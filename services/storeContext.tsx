
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { ProducerProfile, ClientProfile, Offer, UserSession, UserRole, ProducerStatus, OfferType, CartItem, Order, OrderStatus, Wallet, Notification, WithdrawalRequest, WithdrawalStatus, PaymentMethod, ChatSession, ChatMessage, Proposal, ProposalStatus, WeeklySchedule, AvailabilityException, Review, SupportMessage, Portfolio, DisputeEvidence, Coupon, PickupPoint, MyReferralsData } from '../types';
import { generateSupportResponse } from './geminiService';
import {
  getSupportMessages,
  mapDtoToSupportMessage,
  mergeIncomingSupportMessages,
  postGuestSupportMessage,
  postUserSupportMessage,
} from './supportSessionsApi';
const defaultSchedule: WeeklySchedule = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
import { apiFetch, apiUpload, setToken, clearToken, getToken, setRefreshToken } from './apiService';

/** Map Prisma withdrawal row (+ nested paymentMethod) to app `WithdrawalRequest`. */
function mapWithdrawalFromApi(d: any): WithdrawalRequest {
  const pm = d.paymentMethod ?? {};
  const prov = String(pm.provider ?? '').toUpperCase();
  const provider: PaymentMethod['provider'] =
    prov === 'ORANGE' || prov === 'MTN' || prov === 'BANK' ? prov : 'MTN';
  const st = String(d.status ?? 'PENDING').toUpperCase();
  const status =
    st === 'APPROVED' ? WithdrawalStatus.APPROVED
    : st === 'PROCESSED' ? WithdrawalStatus.PROCESSED
    : st === 'REJECTED' ? WithdrawalStatus.REJECTED
    : WithdrawalStatus.PENDING;
  return {
    id: d.id,
    userId: d.userId,
    amount: Number(d.amount),
    paymentMethod: {
      id: pm.id ?? d.paymentMethodId ?? '',
      provider,
      accountNumber: String(pm.accountNumber ?? ''),
      accountName: String(pm.accountName ?? ''),
    },
    status,
    requestDate: d.requestDate ? new Date(d.requestDate).toISOString() : new Date().toISOString(),
    processedDate: d.processedDate ? new Date(d.processedDate).toISOString() : undefined,
    adminNote: d.adminNote || undefined,
  };
}

function mapReviewFromApi(r: any): Review {
  return {
    id: String(r.id),
    orderId: String(r.orderId),
    reviewerId: String(r.reviewerId),
    targetId: String(r.targetId),
    rating: Number(r.rating) || 0,
    comment: typeof r.comment === 'string' ? r.comment : '',
    createdAt:
      typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt ?? 0).toISOString(),
  };
}

/** `UserSession.id` is the auth user row; `ClientProfile.id` is the profile row. */
function clientProfileMatchesSession(c: ClientProfile, session: UserSession): boolean {
  if (session.clientId && c.id === session.clientId) return true;
  if (c.userId && c.userId === session.id) return true;
  return false;
}

/** Coerce API/Prisma JSON unread map to numeric counts keyed by user id. */
function coerceUnreadCounts(raw: unknown): Record<string, number> {
  let obj: unknown = raw;
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch {
      return {};
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const n = Number(v);
    out[k] = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  return out;
}

/**
 * Normalize chat sessions from GET /api/chat/sessions (camelCase or snake_case, JSON quirks).
 * Ensures Navbar / ChatPage can read `unreadCounts[userId]` reliably.
 */
function normalizeChatSessionFromApi(raw: any): ChatSession {
  const id = String(raw?.id ?? '');
  const offerId = raw?.offerId ?? raw?.offer_id ?? undefined;
  const lastMessage = String(raw?.lastMessage ?? raw?.last_message ?? '');
  const lm = raw?.lastMessageAt ?? raw?.last_message_at;
  const lastMessageAt =
    typeof lm === 'string' ? lm : lm instanceof Date ? lm.toISOString() : new Date(lm ?? 0).toISOString();

  let participantIds: string[] = [];
  if (Array.isArray(raw?.participantIds)) {
    participantIds = raw.participantIds.map((x: unknown) => String(x));
  } else if (Array.isArray(raw?.participant_ids)) {
    participantIds = raw.participant_ids.map((x: unknown) => String(x));
  } else if (Array.isArray(raw?.participantsData)) {
    participantIds = raw.participantsData.map((p: { id?: string }) => String(p?.id ?? '')).filter(Boolean);
  }

  const unreadCounts = coerceUnreadCounts(raw?.unreadCounts ?? raw?.unread_counts);

  return {
    id,
    offerId,
    lastMessage,
    lastMessageAt,
    participantIds,
    unreadCounts,
  };
}

function normalizeChatSessionsFromApi(rows: unknown): ChatSession[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(normalizeChatSessionFromApi).filter((c) => Boolean(c.id));
}

import { fetchMyReferrals } from './referralsApi';
import { validateCouponRemote, type CouponValidationChannel } from './couponsApi';
import { io, Socket } from 'socket.io-client';
import { isWebAppAllowedRole, isWebAppSessionBlocked } from './authRoles';

interface StoreContextType {
  user: UserSession | null;
  pendingRegistration: { email: string, code: string, data: any, role: UserRole, password?: string } | null;
  producers: ProducerProfile[];
  clients: ClientProfile[];
  offers: Offer[];
  cart: CartItem[];
  orders: Order[];
  wallets: Record<string, Wallet>;
  notifications: Notification[];
  withdrawalRequests: WithdrawalRequest[];
  reviews: Review[];
  portfolios: Portfolio[];
  coupons: Coupon[];
  pickupPoints: PickupPoint[];

  guestEmail: string | null;
  setGuestEmail: (email: string | null) => void;

  // Chat & Negotiation
  chats: ChatSession[];
  messages: ChatMessage[];
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  startNegotiation: (producerId: string, offerId: string) => Promise<string>;
  sendMessage: (chatId: string, text: string, proposal?: Proposal) => Promise<boolean>;
  respondToProposal: (chatId: string, messageId: string, action: 'ACCEPT' | 'REJECT' | 'COUNTER', counterPrice?: number, counterQty?: number) => void;

  // Support Chat (Client Side)
  supportMessages: SupportMessage[];
  isSupportChatOpen: boolean;
  toggleSupportChat: () => void;
  sendSupportMessage: (text: string) => Promise<void>;
  showGuestForm: boolean;
  setShowGuestForm: (show: boolean) => void;
  guestEmailInput: string;
  setGuestEmailInput: (email: string) => void;
  guestNameInput: string;
  setGuestNameInput: (name: string) => void;
  guestName: string | null;
  setGuestName: (name: string | null) => void;
  submitGuestForm: (email: string, name: string) => void;
  supportSessionId: string | null;
  setSupportSessionId: (id: string | null) => void;

  login: (identifier: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  registerProducer: (data: Omit<ProducerProfile, 'id' | 'status' | 'joinedDate' | 'paymentMethods' | 'favorites' | 'searchHistory' | 'referrals' | 'referralCode'> & { referrerCode?: string }, password: string) => Promise<{ success: boolean; message: string }>;
  updateProducerProfile: (producer: ProducerProfile, otpToken?: string) => Promise<void>;
  requestOtp: (action: 'PROFILE_UPDATE' | 'WITHDRAWAL') => Promise<{ success: boolean; message: string }>;
  verifyOtp: (action: 'PROFILE_UPDATE' | 'WITHDRAWAL', code: string) => Promise<{ success: boolean; token?: string; message: string }>;
  updateProducerAvailability: (producerId: string, schedule: WeeklySchedule, exceptions: AvailabilityException[]) => Promise<void>;
  registerClient: (data: Omit<ClientProfile, 'id' | 'joinedDate' | 'referrals' | 'referralCode'> & { referrerCode?: string }, password: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (code: string) => Promise<boolean>;
  updateClientProfile: (client: ClientProfile) => Promise<void>;
  upgradeClientToProducer: (clientId: string, producerDetails: Partial<ProducerProfile>) => void;
  validateProducer: (id: string, status: ProducerStatus) => Promise<void>;
  saveProducerPaymentMethod: (producerId: string, method: PaymentMethod) => void;
  deleteProducerPaymentMethod: (producerId: string, methodId: string) => void;
  createOffer: (offer: Omit<Offer, 'id' | 'createdAt' | 'producerId'>) => Promise<{ success: boolean; error?: string }>;
  updateOffer: (offer: Offer) => Promise<{ success: boolean; error?: string }>;
  getProducerOffers: (producerId: string) => Offer[];
  getOfferById: (offerId: string) => Offer | undefined;
  getAvailableSlots: (producerId: string, date: Date, durationHours: number) => Date[];
  addToCart: (offer: Offer, quantity: number, bookingDate?: string) => { success: boolean; error?: 'PRODUCER_CONFLICT' };
  removeFromCart: (offerId: string) => void;
  clearCart: () => void;
  placeOrder: (couponId?: string, discountAmount?: number, deliveryDate?: string, deliveryMethod?: 'HOME' | 'PICKUP', pickupPointId?: string) => Promise<void>;
  confirmOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  payForOrder: (orderId: string) => Promise<{ success: boolean; error?: 'INSUFFICIENT_FUNDS' }>;
  startDelivery: (orderId: string) => Promise<void>;
  confirmReceipt: (orderId: string) => Promise<void>;
  reportProblem: (orderId: string, reason: string, files: File[]) => Promise<void>;
  addDisputeEvidence: (orderId: string, files: File[]) => void;
  revealContactInfo: (orderId: string) => void;
  submitReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  getAverageRating: (targetId: string) => number;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;

  /** Validates against POST /api/coupons/validate (admin-configured coupons). */
  validateCoupon: (
    code: string,
    cartTotal: number,
    channel?: CouponValidationChannel
  ) => Promise<{ discountAmount: number; couponId: string | null; errorMessage?: string }>;

  // Pickup Points Logic (Admin)
  addPickupPoint: (point: Omit<PickupPoint, 'id'>) => void;
  deletePickupPoint: (id: string) => void;

  // Portfolio Methods
  getProducerPortfolios: (producerId: string) => Portfolio[];
  addPortfolio: (portfolio: Omit<Portfolio, 'id' | 'createdAt'>) => Promise<void>;
  updatePortfolio: (portfolio: Portfolio) => Promise<void>;
  deletePortfolio: (portfolioId: string) => Promise<void>;

  // New Features (Tracking, Favorites)
  trackUserSearch: (term: string) => void;
  toggleFavorite: (offerId: string) => void;
  moveToFavorites: (offerId: string) => void;
  getRecommendedOffers: () => Offer[];

  // Compare Features
  compareList: string[];
  addToCompare: (offerId: string) => void;
  removeFromCompare: (offerId: string) => void;
  clearCompare: () => void;

  // Wallet Methods
  getWallet: (userId: string) => Wallet;
  fundWallet: (amount: number, provider: string, referenceId: string) => Promise<{ success: boolean; message: string }>;
  requestWithdrawal: (amount: number, method: PaymentMethod, otpToken?: string) => Promise<{ success: boolean; message: string }>;
  // Notification Methods
  markNotificationsAsRead: () => void;

  /** From GET /api/users/me/referrals — null when logged out or not loaded. */
  myReferrals: MyReferralsData | null;
  refreshMyReferrals: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  // pendingRegistration kept in-memory for OTP verification flow
  const [pendingRegistration, setPendingRegistration] = useState<{ email: string, code: string, data: any, role: UserRole, password?: string } | null>(null);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);

  // State
  const [producers, setProducers] = useState<ProducerProfile[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [coupons, _setCoupons] = useState<Coupon[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [myReferrals, setMyReferrals] = useState<MyReferralsData | null>(null);

  // Chat State
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Compare State
  const [compareList, setCompareList] = useState<string[]>([]);

  // Support Chat State (Client Side)
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([
    { id: 'init-1', sender: 'AI', text: 'Hello! I am AgriBot, your automated assistant. How can I help you today?', timestamp: new Date().toISOString() }
  ]);
  const [isHandedOver, setIsHandedOver] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestEmailInput, setGuestEmailInput] = useState('');
  const [guestNameInput, setGuestNameInput] = useState('');
  const [supportSessionId, setSupportSessionId] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    let parsedUser = null;
    if (savedUser) {
      try {
        parsedUser = JSON.parse(savedUser);
        if (isWebAppAllowedRole(parsedUser?.role)) {
          setUser(parsedUser);
        } else {
          clearToken();
          localStorage.removeItem('currentUser');
          parsedUser = null;
        }
      } catch (e) { }
    }
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { }
    }
    const savedGuestEmail = localStorage.getItem('guestEmail');
    if (savedGuestEmail) setGuestEmail(savedGuestEmail);
    fetchData(parsedUser); // Pass user directly to avoid stale-closure on first render
  }, []);

  // Drop admin/staff sessions using JWT role (source of truth) even if localStorage user is stale.
  useEffect(() => {
    const token = getToken();
    if (isWebAppSessionBlocked(token, user)) {
      clearToken();
      localStorage.removeItem('currentUser');
      setUser(null);
    }
  }, [user]);

  // ─── DEBOUNCED CART SYNC ───────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    if (guestEmail) localStorage.setItem('guestEmail', guestEmail);
    else localStorage.removeItem('guestEmail');

    if (user && cart.length > 0) {
      const timer = setTimeout(() => {
        apiFetch('/api/cart/sync-cart', {
          method: 'POST',
          silent401: true,
          body: JSON.stringify({
            items: cart.map(item => ({
              offerId: item.id,
              quantity: item.cartQuantity,
              bookingDate: item.bookingDate || undefined
            }))
          })
        } as any).catch(err => console.error('Failed to sync cart:', err));
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [cart, user, guestEmail]);


  // ─── REALTIME: WebSocket for instant order/notification updates ───────────────
  const socketRef = useRef<Socket | null>(null);
  const userRef = useRef<typeof user>(user);
  userRef.current = user;
  useEffect(() => {
    const token = getToken();
    if (!user?.id || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }
    // Socket must connect to backend; in dev with proxy, origin is Vite (5173) so use explicit backend URL when no env set
    const apiBase = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3000' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'))).replace(/\/$/, '');
    const socket = io(apiBase + '/notifications', {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    socket.on('notification', () => {
      // Any notification (e.g. order status change) → refetch orders and notifications so UI updates without refresh
      fetchData(userRef.current);
    });
    socket.on('connect_error', () => {
      // Fallback: polling will still refresh orders every 15s
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  // ─── GLOBAL POLLING (Orders, Notifications, Chats) — fallback when WebSocket is unavailable ─
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user && getToken()) {
      interval = setInterval(async () => {
        try {
          // Background polling endpoints may return 401 for domain reasons
          // (e.g. missing client profile) even when token is valid.
          // Do not drop the session here; let interactive auth flows handle logout.
          const on401 = (_e: unknown) => {};
          const resSessions = await apiFetch<ChatSession[]>('/api/chat/sessions', { silent401: true } as any).catch((e) => { on401(e); return null; });
          if (resSessions && Array.isArray(resSessions)) setChats(normalizeChatSessionsFromApi(resSessions));

          const resNotif = await apiFetch<Notification[]>('/api/notifications', { silent401: true } as any).catch((e) => { on401(e); return null; });
          if (resNotif && Array.isArray(resNotif)) setNotifications(resNotif);

          const resOrders = await apiFetch<any[]>('/api/orders', { silent401: true } as any).catch((e) => { on401(e); return null; });
          if (resOrders && Array.isArray(resOrders)) {
            setOrders(resOrders.map((o: any) => ({
              ...o,
              items: Array.isArray(o.orderItems || o.items)
                ? (o.orderItems || o.items).map((item: any) => ({
                  ...item,
                  cartQuantity: item.cartQuantity || item.quantity || 1,
                  id: item.offerId || item.id
                }))
                : []
            })));
          }
        } catch {
          // ignore background polling errors
        }
      }, 15000); // 15 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.id]);

  // ─── DATA FETCHING ──────────────────────────────────────────────────────────

  const fetchData = async (currentUser?: typeof user) => {
    const activeUser = currentUser ?? user;
    try {
      // Keep session on background/bootstrapping 401 responses from feature endpoints.
      const on401 = (_e: unknown) => {};
      if (activeUser && getToken()) await fetchChats().catch(on401);
      const [resProducers, resClients, resOffers, resPickup] = await Promise.all([
        apiFetch<ProducerProfile[]>('/api/producers', { silent401: true } as any).catch((e) => { on401(e); return []; }),
        apiFetch<ClientProfile[]>('/api/clients', { silent401: true } as any).catch((e) => { on401(e); return []; }),
        apiFetch<Offer[]>('/api/offers', { silent401: true } as any).catch((e) => { on401(e); return []; }),
        apiFetch<PickupPoint[]>('/api/pickup-points', { silent401: true } as any).catch((e) => { on401(e); return []; }),
      ]);
      // Only fetch orders, wallet, and referral stats when authenticated and we have a token (avoids 401 spam when token expired)
      if (activeUser && getToken()) {
        const [resOrders, resWallet, resWithdrawals, referralsPayload, resPortfolios, resMyReviews] = await Promise.all([
          apiFetch<any[]>('/api/orders', { silent401: true } as any).catch((e) => { on401(e); return []; }),
          apiFetch<any>('/api/wallet/me', { silent401: true } as any).catch((e) => { on401(e); return null; }),
          apiFetch<any[]>('/api/wallet/me/withdrawals', { silent401: true } as any).catch((e) => { on401(e); return []; }),
          fetchMyReferrals(),
          apiFetch<Portfolio[]>('/api/portfolios', { silent401: true } as any).catch((e) => { on401(e); return []; }),
          apiFetch<any[]>(`/api/reviews/user/${activeUser.id}`, { silent401: true } as any).catch((e) => {
            on401(e);
            return [];
          }),
        ]);
        setMyReferrals(referralsPayload);
        setWithdrawalRequests(Array.isArray(resWithdrawals) ? resWithdrawals.map(mapWithdrawalFromApi) : []);
        setOrders(Array.isArray(resOrders) ? resOrders.map((o: any) => ({
          ...o,
          items: Array.isArray(o.orderItems || o.items)
            ? (o.orderItems || o.items).map((item: any) => ({
              ...item,
              cartQuantity: item.cartQuantity || item.quantity || 1,
              id: item.offerId || item.id
            }))
            : []
        })) : []);
        if (resWallet && resWallet.userId) {
          setWallets(prev => ({
            ...prev,
            [activeUser.id]: {
              userId: resWallet.userId,
              balance: Number(resWallet.balance) ?? 0,
              transactions: Array.isArray(resWallet.transactions) ? resWallet.transactions : [],
            },
          }));
        }
        setPortfolios(
          Array.isArray(resPortfolios)
            ? resPortfolios.map((p: Portfolio) => ({
                ...p,
                createdAt:
                  typeof (p as any).createdAt === 'string'
                    ? (p as any).createdAt
                    : new Date((p as any).createdAt).toISOString(),
                videoUrl: (p as any).videoUrl || undefined,
              }))
            : [],
        );
        if (Array.isArray(resMyReviews)) {
          const mappedReviews = resMyReviews.map(mapReviewFromApi);
          setReviews((prev) => {
            const byId = new Map(prev.map((x) => [x.id, x]));
            mappedReviews.forEach((x) => byId.set(x.id, x));
            return Array.from(byId.values());
          });
        }
      } else {
        setMyReferrals(null);
        setWithdrawalRequests([]);
        setPortfolios([]);
      }
      setProducers(Array.isArray(resProducers) ? resProducers.map(p => {
        const displayName = (p as any).user?.displayName ?? `${String((p as any).firstName ?? '').trim()} ${String((p as any).lastName ?? '').trim()}`.trim();
        return {
          ...p,
          name: displayName || 'Unknown',
          locations: p.locations || [],
          certifications: p.certifications || [],
          paymentMethods: p.paymentMethods || [],
          referrals: p.referrals || [],
          favorites: p.favorites || [],
          productionTypes: p.productionTypes || [],
          searchHistory: p.searchHistory || []
        };
      }) : []);

      const mapClientRow = (c: any) => {
        const displayName = (c as any).user?.displayName ?? `${String((c as any).firstName ?? '').trim()} ${String((c as any).lastName ?? '').trim()}`.trim();
        return {
          ...c,
          name: displayName || 'Unknown',
          locations: c.locations || [],
          favorites: c.favorites || [],
          referrals: c.referrals || [],
          searchHistory: c.searchHistory || []
        };
      };
      let clientRows = Array.isArray(resClients) ? resClients.map(mapClientRow) : [];
      if (activeUser && getToken()) {
        const meClient = await apiFetch<any>('/api/profiles/me/client', { silent401: true } as any).catch(() =>
          apiFetch<any>('/api/clients/me', { silent401: true } as any).catch(() => null),
        );
        if (meClient && typeof meClient === 'object' && meClient.id) {
          const mapped = mapClientRow(meClient);
          const ix = clientRows.findIndex(
            c => c.id === mapped.id || (c as any).userId === (mapped as any).userId
          );
          if (ix >= 0) {
            clientRows[ix] = { ...clientRows[ix], ...mapped };
          } else {
            clientRows = [...clientRows, mapped];
          }
        }
      }
      setClients(clientRows);
      setOffers(Array.isArray(resOffers) ? resOffers : ((resOffers as any)?.data || []));
      setPickupPoints(Array.isArray(resPickup) ? resPickup : []);
    } catch (error) {
      console.error('Could not fetch data from API:', error);
    }
  };

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  const addNotification = (userId: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', link?: string) => {
    const newNote: Notification = {
      id: `note-${Date.now()}-${Math.random()}`,
      userId, message, type, isRead: false, createdAt: new Date().toISOString(), link
    };
    setNotifications(prev => [newNote, ...prev]);
  };

  const markNotificationsAsRead = async () => {
    if (!user) return;
    try {
      await apiFetch('/api/notifications/read', { method: 'PATCH', silent401: true } as any);
      setNotifications(prev => prev.map(n => n.userId === user.id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error('Failed to mark notifications as read:', e);
    }
  };

  type AuthSessionPayload = {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    user: UserSession;
  };

  const establishSession = async (data: AuthSessionPayload) => {
    if (!isWebAppAllowedRole(data.user?.role)) {
      clearToken();
      localStorage.removeItem('currentUser');
      throw new Error('This account is not supported in WebApp. Please use Admin Panel.');
    }
    const jwtToken = data.accessToken || data.token;
    if (jwtToken) {
      setToken(jwtToken);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    setUser(data.user);
    localStorage.setItem('currentUser', JSON.stringify(data.user));

    const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (localCart.length > 0) {
      apiFetch('/api/cart/sync-cart', {
        method: 'POST',
        silent401: true,
        body: JSON.stringify({ items: localCart.map((i: any) => ({ offerId: i.id, quantity: i.cartQuantity || 1 })) }),
      } as any).catch(() => {});
    }

    await fetchData(data.user);
  };

  // ─── AUTHENTICATION ──────────────────────────────────────────────────────────

  const login = async (identifier: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const data = await apiFetch<AuthSessionPayload>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      await establishSession(data);
      return { success: true, message: 'Logged in successfully.' };
    } catch (err: any) {
      clearToken();
      localStorage.removeItem('currentUser');
      return { success: false, message: err.message || 'Login failed.' };
    }
  };

  const logout = async () => {
    try {
      if (getToken()) {
        await apiFetch('/api/auth/logout', { method: 'POST' });
      }
    } catch {
      // Ignore logout errors — always clear local state
    }
    clearToken();
    setUser(null);
    setMyReferrals(null);
    setReviews([]);
    setCart([]);
    localStorage.removeItem('currentUser');
  };

  const refreshMyReferrals = useCallback(async () => {
    if (!user || !getToken()) {
      setMyReferrals(null);
      return;
    }
    const data = await fetchMyReferrals();
    setMyReferrals(data);
  }, [user]);

  const registerProducer = async (data: any, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const session = await apiFetch<AuthSessionPayload>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          phone: data.phone,
          password,
          displayName: data.name || 'Producer',
          role: UserRole.PRODUCER,
          producerAccountType: data.type === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'BUSINESS',
          referralCode: data.referrerCode,
          phoneVerificationToken: data.phoneVerificationToken,
        }),
      });

      await establishSession(session);

      const producerProfile = await apiFetch<{ id: string }>('/api/profiles/producer', {
        method: 'POST',
        body: JSON.stringify({
          type: data.type || "BUSINESS",
          firstName: data.name || "Farm",
          lastName: "Owner",
          gender: "OTHER",
          dateOfBirth: new Date().toISOString(),
          description: data.description || "",
          certifications: data.certifications || [],
          productionTypes: data.productionTypes || [],
          ...(data.type === 'BUSINESS' || !data.type
            ? {
                taxIdentificationNumber: data.taxIdentificationNumber || undefined,
                taxClearanceCertificateUrl: data.taxClearanceCertificateUrl || undefined,
              }
            : {}),
        }),
      });

      if (producerProfile?.id) {
        setUser(prev => {
          if (!prev) return prev;
          const next = { ...prev, producerId: producerProfile.id };
          localStorage.setItem('currentUser', JSON.stringify(next));
          return next;
        });
      }

      await fetchData();
      return { success: true, message: 'Registration successful!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const registerClient = async (data: any, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const session = await apiFetch<AuthSessionPayload>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          phone: data.phone,
          password,
          displayName: data.name || `${data.firstName} ${data.lastName}`,
          role: UserRole.CLIENT,
          referralCode: data.referrerCode,
          phoneVerificationToken: data.phoneVerificationToken,
        }),
      });

      await establishSession(session);

      const clientProfile = await apiFetch<{ id: string }>('/api/profiles/client', {
        method: 'POST',
        body: JSON.stringify({
          firstName: data.firstName || "Client",
          lastName: data.lastName || "",
          gender: data.gender || "OTHER",
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : new Date().toISOString()
        }),
      });

      if (clientProfile?.id) {
        setUser(prev => {
          if (!prev) return prev;
          const next = { ...prev, clientId: clientProfile.id };
          localStorage.setItem('currentUser', JSON.stringify(next));
          return next;
        });
      }

      await fetchData();
      return { success: true, message: 'Registration successful!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const verifyEmail = async (code: string): Promise<boolean> => {
    if (!pendingRegistration) return false;
    try {
      const data = await apiFetch<{ token: string; user: UserSession }>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: pendingRegistration.email, code }),
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      setPendingRegistration(null);
      return true;
    } catch {
      return false;
    }
  };

  const changePassword = async (currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'User not logged in.' };
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, role: user.role, currentPassword: currentPass, newPassword: newPass }),
      });
      return { success: true, message: 'Password updated successfully!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to change password.' };
    }
  };

  // ─── PRODUCER PROFILE ────────────────────────────────────────────────────────

  const updateProducerProfile = async (updatedProducer: ProducerProfile, otpToken?: string) => {
    try {
      const headers: Record<string, string> = {};
      if (otpToken) headers['X-OTP-Verification'] = otpToken;
      const saved = await apiFetch<any>(`/api/producers/${updatedProducer.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedProducer),
        headers,
      });
      setProducers(prev => prev.map(p => p.id === saved.id ? { ...saved, user: saved.user ?? (p as any).user } : p));
      addNotification(updatedProducer.id, 'Profile updated', 'SUCCESS');
    } catch (error) {
      console.error('Failed to update producer profile', error);
      throw error;
    }
  };

  const requestOtp = async (action: 'PROFILE_UPDATE' | 'WITHDRAWAL') => {
    const res = await apiFetch<{ success: boolean; message: string }>('/api/otp/request', {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    return res;
  };

  const verifyOtp = async (action: 'PROFILE_UPDATE' | 'WITHDRAWAL', code: string) => {
    const res = await apiFetch<{ success: boolean; token?: string; message: string }>('/api/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ action, code }),
    });
    return res;
  };

  const updateProducerAvailability = async (producerId: string, schedule: WeeklySchedule, exceptions: AvailabilityException[]) => {
    try {
      await apiFetch(`/api/producers/${producerId}/availability`, {
        method: 'PUT',
        body: JSON.stringify({ schedule, exceptions }),
      });
      setProducers(prev => prev.map(p => p.id === producerId ? { ...p, availability: schedule, exceptions } : p));
      addNotification(producerId, 'Availability updated', 'SUCCESS');
    } catch (error) {
      console.error('Failed to update availability', error);
    }
  };

  const validateProducer = async (id: string, status: ProducerStatus) => {
    try {
      await apiFetch(`/api/producers/${id}/validate`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setProducers(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (error) {
      console.error('Failed to validate producer', error);
    }
  };

  const upgradeClientToProducer = (clientId: string, producerDetails: Partial<ProducerProfile>) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const newProducer: ProducerProfile = {
      id: clientId, type: producerDetails.type || 'INDIVIDUAL', name: producerDetails.name || client.name,
      firstName: client.firstName, lastName: client.lastName, email: client.email, phone: client.phone,
      description: producerDetails.description || '', locations: client.locations, certifications: [],
      productionTypes: producerDetails.productionTypes || [], status: ProducerStatus.PENDING,
      paymentMethods: [], joinedDate: new Date().toISOString(), profileImageUrl: client.profileImageUrl,
      availability: defaultSchedule, exceptions: [], favorites: client.favorites, searchHistory: client.searchHistory,
      referralCode: client.referralCode, referrals: client.referrals, referredBy: client.referredBy
    };
    setProducers(prev => [...prev, newProducer]);
    // Session update only — user role change is backend-driven in production
    setUser(prev => prev ? { ...prev, role: UserRole.PRODUCER, producerId: newProducer.id } : null);
  };

  const saveProducerPaymentMethod = (producerId: string, method: PaymentMethod) => {
    setProducers(prev => prev.map(p => p.id === producerId ? { ...p, paymentMethods: p.paymentMethods.some(pm => pm.id === method.id) ? p.paymentMethods.map(pm => pm.id === method.id ? method : pm) : [...p.paymentMethods, method] } : p));
  };

  const deleteProducerPaymentMethod = (producerId: string, methodId: string) => {
    setProducers(prev => prev.map(p => p.id === producerId ? { ...p, paymentMethods: p.paymentMethods.filter(pm => pm.id !== methodId) } : p));
  };

  // ─── CLIENT PROFILE ──────────────────────────────────────────────────────────

  const updateClientProfile = async (updatedClient: ClientProfile) => {
    try {
      const saved = await apiFetch<any>(`/api/clients/${updatedClient.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedClient),
      });
      setClients(prev => prev.map(c => c.id === saved.id ? { ...saved, user: saved.user ?? (c as any).user } : c));
      addNotification(updatedClient.id, 'Profile updated', 'SUCCESS');
    } catch (error) {
      console.error('Failed to update client profile', error);
    }
  };

  // ─── OFFERS ──────────────────────────────────────────────────────────────────

  const createOffer = async (offerData: any): Promise<{ success: boolean; error?: string }> => {
    if (!user || !user.producerId) {
      return { success: false, error: 'You must be signed in as a producer to publish an offer.' };
    }
    try {
      const newOffer = await apiFetch<Offer>('/api/offers', {
        method: 'POST',
        body: JSON.stringify(offerData),
      });
      setOffers(prev => [...prev, newOffer]);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create offer.';
      console.error('Failed to create offer:', err);
      return { success: false, error: message };
    }
  };

  const updateOffer = async (updatedOffer: Offer): Promise<{ success: boolean; error?: string }> => {
    try {
      const saved = await apiFetch<Offer>(`/api/offers/${updatedOffer.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedOffer),
      });
      setOffers(prev => prev.map(o => o.id === saved.id ? saved : o));
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update offer.';
      console.error('Failed to update offer', error);
      return { success: false, error: message };
    }
  };

  const getProducerOffers = (producerId: string) => offers.filter(o => o.producerId === producerId);
  const getOfferById = (id: string) => offers.find(o => o.id === id);

  // ─── CART ────────────────────────────────────────────────────────────────────

  const addToCart = (offer: Offer, quantity: number, bookingDate?: string): { success: boolean; error?: 'PRODUCER_CONFLICT' } => {
    if (cart.length > 0 && cart[0].producerId !== offer.producerId) return { success: false, error: 'PRODUCER_CONFLICT' };
    setCart(prev => {
      if (offer.type === OfferType.SERVICE && bookingDate) return [...prev, { ...offer, cartQuantity: quantity, bookingDate }];
      const exists = prev.find(i => i.id === offer.id);
      return exists ? prev.map(i => i.id === offer.id ? { ...i, cartQuantity: i.cartQuantity + quantity } : i) : [...prev, { ...offer, cartQuantity: quantity }];
    });
    return { success: true };
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

  // ─── ORDERS ──────────────────────────────────────────────────────────────────

  const placeOrder = async (couponId?: string, _discountAmount: number = 0, deliveryDate?: string, deliveryMethod: 'HOME' | 'PICKUP' = 'HOME', pickupPointId?: string) => {
    if (cart.length === 0 || (!user && !guestEmail)) return;

    const payload = {
      items: cart.map(item => ({
        offerId: item.id,
        quantity: item.cartQuantity,
        bookingDate: item.bookingDate ? new Date(item.bookingDate).toISOString() : undefined,
      })),
      requestedDeliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : new Date(Date.now() + 86400 * 1000).toISOString(),
      deliveryMethod,
      pickupPointId: pickupPointId || undefined,
      couponId: couponId || undefined,
    };

    try {
      const saved = await apiFetch<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      // Append the saved order immediately for optimistic UI
      setOrders(prev => [...prev, {
        ...saved,
        items: Array.isArray((saved as any).orderItems || saved.items)
          ? ((saved as any).orderItems || saved.items).map((item: any) => ({
            ...item,
            cartQuantity: item.cartQuantity || item.quantity || 1,
            id: item.offerId || item.id
          }))
          : []
      }]);
      if (user) addNotification(user.id, `Order #${saved.id.substring(saved.id.length - 6).toUpperCase()} placed!`, 'SUCCESS');
      // Refresh from server after a short delay to ensure both parties see the accurate state
      setTimeout(() => fetchData(user), 1500);
      clearCart();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
      console.error('Failed to place order:', error);
      if (user) addNotification(user.id, message, 'ERROR');
    }
  };

  const confirmOrder = async (orderId: string) => {
    try {
      await apiFetch(`/api/orders/${orderId}/confirm`, { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CONFIRMED_AWAITING_PAYMENT } : o));
      const order = orders.find(o => o.id === orderId);
      if (order) addNotification(order.clientId, `Order #${order.id.substring(order.id.length - 6).toUpperCase()} confirmed.`, 'SUCCESS');
    } catch (error) {
      console.error('Failed to confirm order', error);
    }
  };

  const rejectOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.status === OrderStatus.PAID_IN_PREPARATION || order.status === OrderStatus.IN_TRANSIT) {
      addNotification(user!.id, 'Cannot cancel paid order. Contact support.', 'ERROR'); return;
    }
    try {
      await apiFetch(`/api/orders/${orderId}/reject`, { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o));
      addNotification(order.clientId, `Order #${orderId.substring(orderId.length - 6).toUpperCase()} cancelled by producer.`, 'WARNING');
    } catch (error) {
      console.error('Failed to reject order', error);
    }
  };

  const cancelOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if ([OrderStatus.PAID_IN_PREPARATION, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED].includes(order.status)) {
      addNotification(user!.id, 'Cannot cancel paid order. Contact support.', 'ERROR'); return;
    }
    try {
      await apiFetch(`/api/orders/${orderId}/cancel`, { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o));
      addNotification(order.producerId, `Order #${orderId.substring(orderId.length - 6).toUpperCase()} cancelled by client.`, 'WARNING');
    } catch (error) {
      console.error('Failed to cancel order', error);
    }
  };

  const payForOrder = async (orderId: string): Promise<{ success: boolean; error?: 'INSUFFICIENT_FUNDS' }> => {
    if (!user) return { success: false };
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false };
    try {
      const result = await apiFetch<{ success: boolean; error?: string; wallet?: Wallet }>(`/api/orders/${orderId}/pay`, { method: 'POST' });
      if (!result.success) return { success: false, error: result.error === 'INSUFFICIENT_FUNDS' ? 'INSUFFICIENT_FUNDS' : undefined };
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.PAID_IN_PREPARATION } : o));
      if (result.wallet) setWallets(prev => ({ ...prev, [user.id]: result.wallet! }));
      addNotification(user.id, 'Payment successful!', 'SUCCESS');
      return { success: true };
    } catch (error) {
      console.error('Payment failed', error);
      return { success: false };
    }
  };

  const startDelivery = async (id: string) => {
    try {
      await apiFetch(`/api/orders/${id}/deliver`, { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: OrderStatus.IN_TRANSIT } : o));
      const order = orders.find(o => o.id === id);
      if (order) addNotification(order.clientId, 'Order in transit', 'INFO');
    } catch (error) {
      console.error('Failed to start delivery', error);
    }
  };

  const confirmReceipt = async (id: string) => {
    try {
      await apiFetch(`/api/orders/${id}/confirm-receipt`, { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: OrderStatus.DELIVERED } : o));
      const order = orders.find(o => o.id === id);
      if (order) {
        // Assume backend updates wallet, so we might need to fetch updated wallet. Just show notification:
        addNotification(order.producerId, 'Order delivered. Funds released to wallet.', 'SUCCESS');
      }
    } catch (error) {
      console.error('Failed to confirm receipt', error);
    }
  };

  const reportProblem = async (orderId: string, reason: string, files: File[]) => {
    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('reason', reason);
    files.forEach(f => formData.append('files', f));
    let evidence: DisputeEvidence[] = [];
    try {
      const result = await apiUpload<{ evidence: DisputeEvidence[] }>(`/api/orders/${orderId}/dispute`, formData);
      evidence = result.evidence;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.DISPUTE, disputeReason: reason, disputeEvidence: evidence } : o));
      const order = orders.find(o => o.id === orderId);
      if (order) addNotification(order.producerId, 'Dispute opened', 'WARNING');
    } catch (error) {
      console.error('Failed to report problem', error);
      addNotification(user!.id, 'Failed to report problem. Please try again.', 'ERROR');
    }
  };

  const addDisputeEvidence = (orderId: string, files: File[]) => {
    if (!user) return;
    const newEvidence: DisputeEvidence[] = files.map(f => ({ id: `ev-${Date.now()}-${Math.random()}`, uploaderId: user.id, fileName: f.name, fileUrl: URL.createObjectURL(f), fileType: f.type.includes('image') ? 'IMAGE' as const : 'DOCUMENT' as const, uploadedAt: new Date().toISOString() }));
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, disputeEvidence: [...(o.disputeEvidence || []), ...newEvidence] } : o));
    addNotification(user.id, 'Evidence uploaded successfully', 'SUCCESS');
  };

  const revealContactInfo = (id: string) => setOrders(prev => prev.map(o => o.id === id ? { ...o, contactRevealed: true } : o));

  // ─── REVIEWS ─────────────────────────────────────────────────────────────────

  const submitReview = async (data: Omit<Review, 'id' | 'createdAt'>) => {
    try {
      const saved = await apiFetch<Review>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId: data.orderId,
          rating: data.rating,
          comment: data.comment ?? '',
        }),
      });
      setReviews(prev => [...prev, saved]);
      setOrders(prev =>
        prev.map((o) => {
          if (o.id !== saved.orderId) return o;
          const clientProf = clients.find((c) => c.userId === saved.reviewerId);
          if (clientProf && o.clientId === clientProf.id) {
            return { ...o, clientReviewed: true };
          }
          const producerProf = producers.find((p) => p.userId === saved.reviewerId);
          if (producerProf && o.producerId === producerProf.id) {
            return { ...o, producerReviewed: true };
          }
          return o;
        }),
      );
    } catch (error) {
      console.error('Failed to submit review', error);
    }
  };

  /** Reviews use `targetId` = rated party's auth user id; callers may pass profile id or user id. */
  const getAverageRating = (profileOrUserId: string) => {
    if (!profileOrUserId) return 0;
    const p = producers.find((pr) => pr.id === profileOrUserId || pr.userId === profileOrUserId);
    const c = clients.find((cl) => cl.id === profileOrUserId || cl.userId === profileOrUserId);
    const matchIds = new Set<string>([profileOrUserId]);
    if (p?.userId) matchIds.add(p.userId);
    if (p?.id) matchIds.add(p.id);
    if (c?.userId) matchIds.add(c.userId);
    if (c?.id) matchIds.add(c.id);
    const target = reviews.filter((r) => matchIds.has(r.targetId));
    return target.length ? parseFloat((target.reduce((a, b) => a + b.rating, 0) / target.length).toFixed(1)) : 0;
  };

  // ─── WALLET ──────────────────────────────────────────────────────────────────

  const getWallet = (userId: string): Wallet => {
    return wallets[userId] || { userId, balance: 0, transactions: [] };
  };

  const fundWallet = async (amount: number, provider: string, refId: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'No user' };
    try {
      const result = await apiFetch<{ success: boolean; message: string; wallet: Wallet }>('/api/wallet/fund', {
        method: 'POST',
        body: JSON.stringify({ amount, provider, referenceId: refId }),
      });
      if (result.wallet) setWallets(prev => ({ ...prev, [user.id]: result.wallet }));
      return { success: result.success, message: result.message };
    } catch (error: any) {
      console.error('Failed to fund wallet', error);
      return { success: false, message: error.message || 'Funding failed' };
    }
  };

  const requestWithdrawal = async (amount: number, method: PaymentMethod, otpToken?: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'No user' };
    try {
      const headers: Record<string, string> = {};
      if (otpToken) headers['X-OTP-Verification'] = otpToken;
      const result = await apiFetch<{ success: boolean; message: string }>('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethodId: method.id }),
        headers,
      });
      const list = await apiFetch<any[]>('/api/wallet/me/withdrawals', { silent401: true } as any).catch(() => []);
      setWithdrawalRequests(Array.isArray(list) ? list.map(mapWithdrawalFromApi) : []);
      return { success: result.success, message: result.message };
    } catch (error: any) {
      console.error('Failed to request withdrawal', error);
      return { success: false, message: error.message || 'Withdrawal request failed' };
    }
  };

  // ─── PORTFOLIOS ──────────────────────────────────────────────────────────────

  const getProducerPortfolios = (producerId: string) => portfolios.filter(p => p.producerId === producerId);

  const addPortfolio = async (data: Omit<Portfolio, 'id' | 'createdAt'>) => {
    try {
      const { producerId: _producerId, ...payload } = data as Omit<Portfolio, 'id' | 'createdAt'> & {
        producerId?: string;
      };
      const saved = await apiFetch<Portfolio>('/api/portfolios', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setPortfolios(prev => [...prev, saved]);
    } catch (error) {
      console.error('Failed to add portfolio', error);
    }
  };

  const updatePortfolio = async (updated: Portfolio) => {
    try {
      const saved = await apiFetch<Portfolio>(`/api/portfolios/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      setPortfolios(prev => prev.map(p => p.id === saved.id ? saved : p));
    } catch (error) {
      console.error('Failed to update portfolio', error);
    }
  };

  const deletePortfolio = async (id: string) => {
    try {
      await apiFetch(`/api/portfolios/${id}`, { method: 'DELETE' });
      setPortfolios(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete portfolio', error);
    }
  };

  // ─── AVAILABILITY ─────────────────────────────────────────────────────────────

  const getAvailableSlots = (producerId: string, date: Date, durationHours: number): Date[] => {
    const producer = producers.find(p => p.id === producerId);
    if (!producer) return [];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    let schedule = producer.availability?.[dayName];
    const hasAnyConfigured =
      producer.availability &&
      typeof producer.availability === 'object' &&
      Object.values(producer.availability).some(
        (r) => Array.isArray(r) && r.length > 0,
      );
    // Local dev: if the producer never saved a schedule, use a simple weekday window so services can be booked.
    if (
      (!schedule || schedule.length === 0) &&
      import.meta.env.DEV &&
      !hasAnyConfigured
    ) {
      schedule = [{ start: '09:00', end: '17:00' }];
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const isBlocked = producer.exceptions?.some(ex => ex.date === dateStr);
    if (isBlocked || !schedule || schedule.length === 0) return [];
    const bookedRanges = orders.filter(o => o.producerId === producerId && o.status !== OrderStatus.CANCELLED).flatMap(o => o.items).filter(item => item.type === OfferType.SERVICE && item.bookingDate && item.bookingDate.startsWith(dateStr)).map(item => ({ start: new Date(item.bookingDate!).getTime(), end: new Date(item.bookingDate!).getTime() + (item.serviceDuration || 1) * 3600000 }));
    const slots: Date[] = [];
    schedule.forEach(range => {
      const [sh, sm] = range.start.split(':').map(Number);
      const [eh, em] = range.end.split(':').map(Number);
      let current = new Date(date); current.setHours(sh, sm, 0, 0);
      const end = new Date(date); end.setHours(eh, em, 0, 0);
      while (current.getTime() + durationHours * 3600000 <= end.getTime()) {
        const slotEnd = current.getTime() + durationHours * 3600000;
        if (!bookedRanges.some(b => current.getTime() < b.end && slotEnd > b.start)) slots.push(new Date(current));
        current = new Date(current.getTime() + 3600000);
      }
    });
    return slots;
  };

  // ─── COUPONS ─────────────────────────────────────────────────────────────────

  const validateCoupon = async (
    code: string,
    cartTotal: number,
    channel: CouponValidationChannel = 'MARKETPLACE'
  ): Promise<{ discountAmount: number; couponId: string | null; errorMessage?: string }> => {
    const trimmed = code.trim();
    if (!trimmed) {
      return { discountAmount: 0, couponId: null, errorMessage: 'Enter a coupon code.' };
    }
    try {
      const clientProfileId =
        user?.role === UserRole.CLIENT && user.clientId ? user.clientId : undefined;
      const data = await validateCouponRemote(trimmed, cartTotal, channel, clientProfileId);
      if (data.valid && typeof data.discountAmount === 'number' && data.coupon?.id) {
        return { discountAmount: data.discountAmount, couponId: data.coupon.id };
      }
      return { discountAmount: 0, couponId: null, errorMessage: 'Coupon could not be applied.' };
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null && 'message' in e
            ? String((e as { message: unknown }).message)
            : 'Invalid coupon.';
      return { discountAmount: 0, couponId: null, errorMessage: msg };
    }
  };

  // ─── PICKUP POINTS ────────────────────────────────────────────────────────────

  const addPickupPoint = (point: Omit<PickupPoint, 'id'>) => {
    const newPoint = { ...point, id: `pp-${Date.now()}` };
    setPickupPoints(prev => [...prev, newPoint]);
  };

  const deletePickupPoint = (id: string) => {
    setPickupPoints(prev => prev.filter(p => p.id !== id));
  };

  // ─── SEARCH & FAVORITES ───────────────────────────────────────────────────────

  const trackUserSearch = (term: string) => {
    if (!user) return;
    if (user.role === UserRole.CLIENT) {
      setClients(prev => prev.map(c => clientProfileMatchesSession(c, user) ? { ...c, searchHistory: [term, ...(c.searchHistory || [])].slice(0, 20) } : c));
    } else if (user.role === UserRole.PRODUCER && user.producerId) {
      setProducers(prev => prev.map(p => p.id === user.producerId ? { ...p, searchHistory: [term, ...(p.searchHistory || [])].slice(0, 20) } : p));
    }
  };

  const getRecommendedOffers = (): Offer[] => {
    if (!user) return [];
    let history: string[] = [];
    if (user.role === UserRole.CLIENT) {
      const client = clients.find(c => clientProfileMatchesSession(c, user));
      history = client?.searchHistory || [];
    } else if (user.role === UserRole.PRODUCER && user.producerId) {
      const producer = producers.find(p => p.id === user.producerId);
      history = producer?.searchHistory || [];
    }
    if (history.length === 0) return [];
    const historyLower = history.map(t => t.toLowerCase());
    return offers.filter(o =>
      historyLower.some(term => o.category.toLowerCase().includes(term) || o.title.toLowerCase().includes(term))
    ).slice(0, 5);
  };

  const toggleFavorite = (offerId: string) => {
    if (!user) return;
    if (user.role === UserRole.CLIENT) {
      setClients(prev => prev.map(c => clientProfileMatchesSession(c, user) ? { ...c, favorites: c.favorites.includes(offerId) ? c.favorites.filter(id => id !== offerId) : [...c.favorites, offerId] } : c));
    } else if (user.role === UserRole.PRODUCER && user.producerId) {
      setProducers(prev => prev.map(p => p.id === user.producerId ? { ...p, favorites: p.favorites?.includes(offerId) ? p.favorites.filter(id => id !== offerId) : [...(p.favorites || []), offerId] } : p));
    }
  };

  const moveToFavorites = (offerId: string) => {
    if (!user) return;
    if (user.role === UserRole.CLIENT) {
      setClients(prev => prev.map(c => {
        if (clientProfileMatchesSession(c, user) && !c.favorites.includes(offerId)) {
          return { ...c, favorites: [...c.favorites, offerId] };
        }
        return c;
      }));
    } else if (user.role === UserRole.PRODUCER && user.producerId) {
      setProducers(prev => prev.map(p => {
        if (p.id === user.producerId && !p.favorites?.includes(offerId)) {
          return { ...p, favorites: [...(p.favorites || []), offerId] };
        }
        return p;
      }));
    }
    removeFromCart(offerId);
    addNotification(user.id, 'Moved to Favorites for later!', 'SUCCESS');
  };

  // ─── COMPARE ──────────────────────────────────────────────────────────────────

  const addToCompare = (offerId: string) => {
    if (compareList.includes(offerId)) return;
    if (compareList.length >= 3) { alert('You can compare up to 3 products at a time.'); return; }
    setCompareList(prev => [...prev, offerId]);
  };

  const removeFromCompare = (offerId: string) => setCompareList(prev => prev.filter(id => id !== offerId));
  const clearCompare = () => setCompareList([]);

  // ─── SUPPORT CHAT ─────────────────────────────────────────────────────────────

  const toggleSupportChat = () => {
    setIsSupportChatOpen(prev => !prev);
    // Show guest form on first open if guest
    if (!isSupportChatOpen && !user && !guestEmail) {
      setShowGuestForm(true);
    }
  };

  const submitGuestForm = (email: string, name: string) => {
    setGuestEmail(email);
    setGuestName(name);
    setShowGuestForm(false);
    setGuestEmailInput('');
    setGuestNameInput('');
  };

  const sendSupportMessage = async (text: string) => {
    // If guest and no email, show form first
    if (!user && !guestEmail) {
      setShowGuestForm(true);
      return;
    }

    const tempId = `u-${Date.now()}`;
    setSupportMessages((prev) => [
      ...prev,
      { id: tempId, sender: 'USER', text, timestamp: new Date().toISOString() },
    ]);

    if (isHandedOver) {
      if (!supportSessionId) {
        setSupportMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }
      try {
        if (user) {
          const res = await postUserSupportMessage(supportSessionId, text);
          if (res.message) {
            const mapped = mapDtoToSupportMessage(res.message);
            setSupportMessages((prev) => prev.map((m) => (m.id === tempId ? mapped : m)));
          }
        } else if (guestEmail) {
          const res = await postGuestSupportMessage(supportSessionId, text, guestEmail);
          if (res.message) {
            const mapped = mapDtoToSupportMessage(res.message);
            setSupportMessages((prev) => prev.map((m) => (m.id === tempId ? mapped : m)));
          }
        } else {
          setSupportMessages((prev) => prev.filter((m) => m.id !== tempId));
        }
      } catch (e) {
        console.error('Failed to send support message', e);
        setSupportMessages((prev) => prev.filter((m) => m.id !== tempId));
        if (user) addNotification(user.id, 'Could not send message. Please try again.', 'ERROR');
      }
      return;
    }

    // AI phase — guest email and name if not authenticated
    const res = await generateSupportResponse(
      text,
      supportSessionId ?? undefined,
      !user ? (guestEmail ?? undefined) : undefined,
      !user ? (guestName ?? undefined) : undefined
    );

    if (res.sessionId && !supportSessionId) {
      setSupportSessionId(res.sessionId);
    }

    setSupportMessages((prev) => [
      ...prev,
      { id: `a-${Date.now()}`, sender: 'AI', text: res.text, timestamp: new Date().toISOString() },
    ]);
    if (res.handover) {
      setIsHandedOver(true);
      setTimeout(
        () =>
          setSupportMessages((prev) => [
            ...prev,
            {
              id: `s-${Date.now()}`,
              sender: 'AGENT',
              text: 'Connecting agent...',
              timestamp: new Date().toISOString(),
            },
          ]),
        1000
      );
    }
  };

  // Polling for guest support messages when handed over to agent
  useEffect(() => {
    if (!isHandedOver || user || !supportSessionId || !guestEmail) return;

    const pollInterval = setInterval(async () => {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');
        const response = await fetch(`${baseURL}/api/support/guest/sessions/${supportSessionId}/messages?guestEmail=${encodeURIComponent(guestEmail)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && Array.isArray(data.messages)) {
            // Map backend messages to local format and update state
            const backendMessages = data.messages.map((msg: any) =>
              mapDtoToSupportMessage({
                id: msg.id,
                sender: msg.sender,
                text: msg.text,
                timestamp: msg.timestamp,
              })
            );
            setSupportMessages((prev) => mergeIncomingSupportMessages(prev, backendMessages));
          }
        }
      } catch (err) {
        console.error('Error polling support messages:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [isHandedOver, user, supportSessionId, guestEmail]);

  // Polling for authenticated users when handed over to agent
  useEffect(() => {
    if (!isHandedOver || !user || !supportSessionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const data = await getSupportMessages(supportSessionId);
        if (!Array.isArray(data)) return;
        const backendMessages = data.map((msg) => mapDtoToSupportMessage(msg));
        setSupportMessages((prev) => mergeIncomingSupportMessages(prev, backendMessages));
      } catch (err) {
        console.error('Error polling support messages (auth):', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isHandedOver, user, supportSessionId]);

  // ─── CHAT & NEGOTIATION ───────────────────────────────────────────────────────

  const fetchChats = async () => {
    if (!user) return;
    try {
      const res = await apiFetch<any[]>('/api/chat/sessions', { silent401: true } as any);
      if (Array.isArray(res)) setChats(normalizeChatSessionsFromApi(res));
    } catch (e) {
      console.error('Failed to fetch chats:', e);
    }
  };

  const fetchMessages = async (chatId: string) => {
    if (!user) return;
    try {
      const res = await apiFetch<any[]>(`/api/chat/sessions/${chatId}/messages`, { silent401: true } as any);

      const mappedMessages: ChatMessage[] = res.map(m => ({
        id: m.id,
        chatId: m.chatSessionId || chatId,
        senderId: m.senderId,
        text: m.text,
        systemMessage: m.systemMessage,
        createdAt: m.createdAt,
        proposal: m.proposalOfferId ? {
          offerId: m.proposalOfferId,
          pricePerUnit: m.proposalPricePerUnit,
          quantity: m.proposalQuantity,
          status: m.proposalStatus as ProposalStatus || ProposalStatus.PENDING
        } : undefined
      }));

      // Merge: update existing messages (status may have changed) + append new ones
      setMessages(prev => {
        const existingMap = new Map(prev.map(msg => [msg.id, msg]));
        mappedMessages.forEach(msg => existingMap.set(msg.id, msg)); // overwrite with server truth
        return Array.from(existingMap.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      // GET /sessions/:id/messages clears this user's unread on the server — sync list immediately.
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, unreadCounts: { ...c.unreadCounts, [user.id]: 0 } }
            : c,
        ),
      );
      void fetchChats();
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    }
  };

  const startNegotiation = async (pid: string, oid: string) => {
    if (!user) return '';

    // First refresh chats from server to check for an existing session
    try {
      const freshChatsRaw = await apiFetch<any[]>('/api/chat/sessions', { silent401: true } as any);
      if (Array.isArray(freshChatsRaw)) {
        const freshChats = normalizeChatSessionsFromApi(freshChatsRaw);
        setChats(freshChats);
        const existing = freshChats.find((c: ChatSession) =>
          c.participantIds?.includes(user.id) && c.participantIds?.includes(pid) && c.offerId === oid
        );
        if (existing) return existing.id;
      }
    } catch (_) {
      // Network error — fall through to check local cache
      const existing = chats.find(c => c.participantIds?.includes(user.id) && c.participantIds?.includes(pid) && c.offerId === oid);
      if (existing) return existing.id;
    }

    try {
      const res = await apiFetch<any>('/api/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ participantIds: [pid], offerId: oid })
      });
      const normalized = normalizeChatSessionFromApi(res);
      setChats(prev => [...prev, normalized]);
      return normalized.id;
    } catch (e) {
      console.error('Failed to create chat:', e);
      const id = `chat-${Date.now()}`;
      setChats(prev => [...prev, { id, participantIds: [user.id, pid], offerId: oid, lastMessage: 'Started', lastMessageAt: new Date().toISOString(), unreadCounts: {} }]);
      return id;
    }
  };

  const respondToProposal = async (chatId: string, msgId: string, action: 'ACCEPT' | 'REJECT' | 'COUNTER', price?: number, qty?: number) => {
    if (!user) return;

    if (action === 'COUNTER') {
      // Counter-offer: send a new proposal message — no backend proposal-respond needed
      const original = messages.find(m => m.id === msgId);
      await sendMessage(
        chatId,
        `Counter-offer: ${qty} units @ ${price?.toLocaleString()} XAF each`,
        {
          offerId: original?.proposal?.offerId,
          pricePerUnit: price,
          quantity: qty,
          status: ProposalStatus.PENDING
        }
      );
      return;
    }

    // Optimistic UI update immediately
    setMessages(prev => prev.map(m =>
      m.id === msgId && m.proposal
        ? { ...m, proposal: { ...m.proposal, status: action === 'ACCEPT' ? ProposalStatus.ACCEPTED : ProposalStatus.REJECTED } }
        : m
    ));

    try {
      const res = await apiFetch<{ message: any; order?: any }>(
        `/api/chat/messages/${msgId}/proposal`,
        {
          method: 'PATCH',
          body: JSON.stringify({ response: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' }),
        }
      );

      if (action === 'ACCEPT' && res.order) {
        // Backend auto-created the order — add it to local orders state
        setOrders(prev => {
          const alreadyExists = prev.some(o => o.id === res.order.id);
          if (alreadyExists) return prev;
          const mapped = {
            ...res.order,
            items: Array.isArray(res.order.orderItems || res.order.items)
              ? (res.order.orderItems || res.order.items).map((item: any) => ({
                ...item,
                cartQuantity: item.cartQuantity || item.quantity || 1,
                id: item.offerId || item.id
              }))
              : []
          };
          return [...prev, mapped];
        });
        addNotification(user.id, `✅ Proposal accepted! Order #${res.order.id?.substring(res.order.id.length - 6).toUpperCase()} has been created.`, 'SUCCESS', `/orders/${res.order.id}`);
        // Refresh all orders from server
        setTimeout(() => fetchData(user), 1000);
      } else if (action === 'REJECT') {
        addNotification(user.id, '❌ Proposal rejected. The buyer has been notified.', 'WARNING');
      }

      // Confirm the real server proposal status by refreshing this chat's messages
      fetchMessages(chatId);

    } catch (err: any) {
      console.error('Failed to respond to proposal:', err);
      // Revert optimistic update on error
      setMessages(prev => prev.map(m =>
        m.id === msgId && m.proposal
          ? { ...m, proposal: { ...m.proposal, status: ProposalStatus.PENDING } }
          : m
      ));
      
      // Provide user-friendly error messages
      let errorMessage = err?.message || 'Failed to respond to proposal';
      if (errorMessage.toLowerCase().includes('profile')) {
        errorMessage = '❌ Unable to process proposal: One or both parties have incomplete profiles. Please complete your profile and try again.';
      } else if (errorMessage.toLowerCase().includes('order')) {
        errorMessage = '❌ Proposal accepted but failed to create order. Please contact support.';
      }
      
      addNotification(user.id, errorMessage, 'ERROR');
    }
  };

  /** Detect phone numbers (East, West, Central Africa): with/without spaces/dashes, international or national. */
  const hasPhoneNumber = (str: string): boolean => {
    if (!str || typeof str !== 'string') return false;
    const s = str.trim();
    // International: + then country code (1–4 digits), optional space/dot/dash, then 6–12 digits (e.g. +237 96326121, +254 712 345 678)
    if (/\+[0-9]{1,4}[\s.\-]*[0-9]{6,12}\b/.test(s)) return true;
    // Collapse spaces/dots/dashes only between digits: "0 6 12 34 56 78" -> "0612345678"
    let collapsed = s;
    while (true) {
      const next = collapsed.replace(/(\d)([\s.\-]+)(?=\d)/g, '$1');
      if (next === collapsed) break;
      collapsed = next;
    }
    // International (collapsed): + then 10–14 digits
    if (/\+[0-9]{10,14}\b/.test(collapsed)) return true;
    if (/\+[\s.\-]*\d([\s.\-]*\d){9,13}/.test(collapsed)) return true;
    // African patterns: national (0 + 8–11 digits), 9-digit mobile (5–9 + 8), 10-digit (7–9 + 9), country code (2–9 + 10–11)
    if (/(^|[^\d])0\d{8,11}([^\d]|$)/.test(collapsed)) return true;
    if (/(^|[^\d])[5-9]\d{8}([^\d]|$)/.test(collapsed)) return true;
    if (/(^|[^\d])[789]\d{9}([^\d]|$)/.test(collapsed)) return true;
    if (/(^|[^\d])[2-9]\d{10,11}([^\d]|$)/.test(collapsed)) return true;
    // Same checks on original (no collapse) for numbers without separators
    if (/\b0\d{8,11}\b/.test(s)) return true;
    if (/\b[5-9]\d{8}\b/.test(s)) return true;
    if (/\b[789]\d{9}\b/.test(s)) return true;
    if (/\b[2-9]\d{10,11}\b/.test(s)) return true;
    return false;
  };

  const sendMessage = async (chatId: string, text: string, proposal?: any) => {
    if (!user) return false;
    const hasEmail = text.match(/[a-zA-Z0-9._%+-]+@?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const hasPhone = hasPhoneNumber(text);
    const hasLink = text.match(/https?:\/\/\S+|www\.\S+/i);
    if (!proposal && !text.startsWith('Counter') && !text.startsWith('Formal') && (hasEmail || hasPhone || hasLink)) {
      addNotification(user.id, hasPhone ? 'Sharing phone numbers is not allowed in chat.' : hasEmail ? 'Sharing email addresses is not allowed in chat.' : 'Sharing links is not allowed in chat.', 'ERROR');
      return Promise.resolve(false);
    }

    try {
      const body: any = { text };
      if (proposal) {
        body.proposalOfferId = proposal.offerId;
        body.proposalPricePerUnit = proposal.pricePerUnit;
        body.proposalQuantity = proposal.quantity;
      }

      const res = await apiFetch<any>(`/api/chat/sessions/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const mappedMsg: ChatMessage = {
        id: res.id,
        chatId: res.chatSessionId || chatId,
        senderId: res.senderId,
        text: res.text,
        systemMessage: res.systemMessage,
        createdAt: res.createdAt,
        proposal: res.proposalOfferId ? {
          offerId: res.proposalOfferId,
          pricePerUnit: res.proposalPricePerUnit,
          quantity: res.proposalQuantity,
          status: res.proposalStatus as ProposalStatus || ProposalStatus.PENDING
        } : undefined
      };

      // Optimistic updates for new messages
      setMessages(prev => [...prev, mappedMsg]);
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastMessage: text, lastMessageAt: res.createdAt } : c));
      void fetchChats();
      return true;
    } catch (e: any) {
      console.error('Failed to send message:', e);
      
      // Parse and provide user-friendly error messages
      let errorMessage = e?.message || 'Failed to send message';
      
      // Map common backend errors to user-friendly messages
      if (errorMessage.toLowerCase().includes('offer') && errorMessage.toLowerCase().includes('not negotiable')) {
        errorMessage = '❌ This offer is not open for negotiation.';
      } else if (errorMessage.toLowerCase().includes('offer') && errorMessage.toLowerCase().includes('not exist')) {
        errorMessage = '❌ The offer no longer exists.';
      } else if (errorMessage.toLowerCase().includes('price') || errorMessage.toLowerCase().includes('quantity')) {
        errorMessage = '❌ Price per unit and quantity must be greater than 0.';
      } else if (e?.status === 400) {
        errorMessage = '❌ Invalid proposal. Please check your price and quantity values.';
      }
      
      addNotification(user.id, errorMessage, 'ERROR');
      // Never add the message to the UI when the request failed — server may have rejected it (e.g. phone number / link)
      return false;
    }
  };



  return (
    <StoreContext.Provider value={{
      user, pendingRegistration, guestEmail, setGuestEmail, producers, clients, offers, cart, orders, wallets, notifications, withdrawalRequests, reviews, portfolios, coupons, pickupPoints,
      chats,
      messages,
      fetchChats,
      fetchMessages,
      startNegotiation,
      sendMessage, respondToProposal,
      login, logout, registerProducer, registerClient, verifyEmail, updateClientProfile, upgradeClientToProducer, validateProducer, updateProducerProfile, updateProducerAvailability, saveProducerPaymentMethod, deleteProducerPaymentMethod, requestOtp, verifyOtp, createOffer, updateOffer, getProducerOffers, getOfferById,
      addToCart, removeFromCart, clearCart, placeOrder, confirmOrder, rejectOrder, cancelOrder, payForOrder, startDelivery, confirmReceipt, reportProblem, addDisputeEvidence, revealContactInfo,
      getWallet, fundWallet, requestWithdrawal, markNotificationsAsRead, getAvailableSlots, submitReview, getAverageRating,
      getProducerPortfolios, addPortfolio, updatePortfolio, deletePortfolio,
      trackUserSearch, toggleFavorite, moveToFavorites, getRecommendedOffers,
      compareList, addToCompare, removeFromCompare, clearCompare,
      supportMessages, isSupportChatOpen, toggleSupportChat, sendSupportMessage, showGuestForm, setShowGuestForm, guestEmailInput, setGuestEmailInput, guestNameInput, setGuestNameInput, guestName, setGuestName, submitGuestForm, supportSessionId, setSupportSessionId,
      validateCoupon,
      addPickupPoint, deletePickupPoint,
      changePassword,
      myReferrals,
      refreshMyReferrals
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

/** Use when component may render outside StoreProvider (e.g. global widgets). Returns undefined when outside provider. */
export const useStoreOptional = (): StoreContextType | undefined => useContext(StoreContext);
