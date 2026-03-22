
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
import { fetchMyReferrals } from './referralsApi';
import { validateCouponRemote, type CouponValidationChannel } from './couponsApi';
import { io, Socket } from 'socket.io-client';

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
  createOffer: (offer: Omit<Offer, 'id' | 'createdAt' | 'producerId'>) => Promise<void>;
  updateOffer: (offer: Offer) => Promise<void>;
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
        setUser(parsedUser);
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
          const on401 = (e: unknown) => { if ((e as { status?: number })?.status === 401) setUser(null); };
          const resSessions = await apiFetch<ChatSession[]>('/api/chat/sessions', { silent401: true } as any).catch((e) => { on401(e); return null; });
          if (resSessions && Array.isArray(resSessions)) setChats(resSessions);

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
      const on401 = (e: unknown) => {
        if ((e as { status?: number })?.status === 401) setUser(null);
      };
      if (activeUser && getToken()) await fetchChats().catch(on401);
      const [resProducers, resClients, resOffers, resPickup] = await Promise.all([
        apiFetch<ProducerProfile[]>('/api/producers', { silent401: true } as any).catch((e) => { on401(e); return []; }),
        apiFetch<ClientProfile[]>('/api/clients', { silent401: true } as any).catch((e) => { on401(e); return []; }),
        apiFetch<Offer[]>('/api/offers', { silent401: true } as any).catch((e) => { on401(e); return []; }),
        apiFetch<PickupPoint[]>('/api/pickup-points', { silent401: true } as any).catch((e) => { on401(e); return []; }),
      ]);
      // Only fetch orders, wallet, and referral stats when authenticated and we have a token (avoids 401 spam when token expired)
      if (activeUser && getToken()) {
        const [resOrders, resWallet, referralsPayload] = await Promise.all([
          apiFetch<any[]>('/api/orders', { silent401: true } as any).catch((e) => { on401(e); return []; }),
          apiFetch<any>('/api/wallet/me', { silent401: true } as any).catch((e) => { on401(e); return null; }),
          fetchMyReferrals(),
        ]);
        setMyReferrals(referralsPayload);
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
      } else {
        setMyReferrals(null);
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
      setClients(Array.isArray(resClients) ? resClients.map(c => {
        const displayName = (c as any).user?.displayName ?? `${String((c as any).firstName ?? '').trim()} ${String((c as any).lastName ?? '').trim()}`.trim();
        return {
          ...c,
          name: displayName || 'Unknown',
          locations: c.locations || [],
          favorites: c.favorites || [],
          referrals: c.referrals || [],
          searchHistory: c.searchHistory || []
        };
      }) : []);
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
      await apiFetch('/api/notifications/read', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.userId === user.id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error('Failed to mark notifications as read:', e);
    }
  };



  // ─── AUTHENTICATION ──────────────────────────────────────────────────────────

  const login = async (identifier: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const data = await apiFetch<{ token?: string; accessToken?: string; refreshToken?: string; user: UserSession }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      const jwtToken = data.accessToken || data.token;
      if (jwtToken) {
        setToken(jwtToken);
      }
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      setUser(data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      // Merge offline/localStorage cart with backend on login
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (localCart.length > 0) {
        apiFetch('/api/cart/sync-cart', {
          method: 'POST',
          silent401: true,
          body: JSON.stringify({ items: localCart.map((i: any) => ({ offerId: i.id, quantity: i.cartQuantity || 1 })) })
        } as any).catch(() => { });
      }

      await fetchData(data.user); // Pass user directly to avoid stale state
      return { success: true, message: 'Logged in successfully.' };
    } catch (err: any) {
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
      // 1. Create User
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          phone: data.phone,
          password: password,
          displayName: data.name || 'Producer',
          role: UserRole.PRODUCER,
          referralCode: data.referrerCode
        }),
      });

      // 2. Login to get Access Token
      const loginData = await apiFetch<{ token?: string; accessToken?: string; user: UserSession }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: data.email, password }),
      });

      const jwtToken = loginData.accessToken || loginData.token;
      if (jwtToken) setToken(jwtToken);
      setUser(loginData.user);
      localStorage.setItem('currentUser', JSON.stringify(loginData.user));

      // 3. Create Producer Profile
      await apiFetch('/api/profiles/producer', {
        method: 'POST',
        body: JSON.stringify({
          type: data.type || "BUSINESS",
          firstName: data.name || "Farm",
          lastName: "Owner",
          gender: "OTHER",
          dateOfBirth: new Date().toISOString(),
          description: data.description || "",
          certifications: data.certifications || [],
          productionTypes: data.productionTypes || []
        }),
      });

      await fetchData();
      return { success: true, message: 'Registration successful!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const registerClient = async (data: any, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      // 1. Create User
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          phone: data.phone,
          password: password,
          displayName: data.name || (data.firstName + ' ' + data.lastName),
          role: UserRole.CLIENT,
          referralCode: data.referrerCode
        }),
      });

      // 2. Login to get Access Token
      const loginData = await apiFetch<{ token?: string; accessToken?: string; user: UserSession }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: data.email, password }),
      });

      const jwtToken = loginData.accessToken || loginData.token;
      if (jwtToken) setToken(jwtToken);
      setUser(loginData.user);
      localStorage.setItem('currentUser', JSON.stringify(loginData.user));

      // 3. Create Client Profile
      await apiFetch('/api/profiles/client', {
        method: 'POST',
        body: JSON.stringify({
          firstName: data.firstName || "Client",
          lastName: data.lastName || "",
          gender: data.gender || "OTHER",
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : new Date().toISOString()
        }),
      });

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

  const createOffer = async (offerData: any) => {
    if (!user || !user.producerId) return;
    try {
      const newOffer = await apiFetch<Offer>('/api/offers', {
        method: 'POST',
        body: JSON.stringify({ ...offerData, producerId: user.producerId }),
      });
      setOffers(prev => [...prev, newOffer]);
    } catch (err) {
      console.error('Failed to create offer:', err);
    }
  };

  const updateOffer = async (updatedOffer: Offer) => {
    try {
      const saved = await apiFetch<Offer>(`/api/offers/${updatedOffer.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedOffer),
      });
      setOffers(prev => prev.map(o => o.id === saved.id ? saved : o));
    } catch (error) {
      console.error('Failed to update offer', error);
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
    } catch (error) {
      console.error('Failed to place order:', error);
      if (user) addNotification(user.id, 'Failed to place order. Please try again.', 'ERROR');
    }
    clearCart();
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
        body: JSON.stringify(data),
      });
      setReviews(prev => [...prev, saved]);
      setOrders(prev => prev.map(o => o.id === data.orderId ? (data.reviewerId === o.clientId ? { ...o, clientReviewed: true } : { ...o, producerReviewed: true }) : o));
    } catch (error) {
      console.error('Failed to submit review', error);
    }
  };

  const getAverageRating = (targetId: string) => {
    const target = reviews.filter(r => r.targetId === targetId);
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
        body: JSON.stringify({ amount, method }),
        headers,
      });
      setWithdrawalRequests(prev => [...prev, { id: `w-${Date.now()}`, userId: user.id, amount, paymentMethod: method, status: WithdrawalStatus.PENDING, requestDate: new Date().toISOString() }]);
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
      const saved = await apiFetch<Portfolio>('/api/portfolios', {
        method: 'POST',
        body: JSON.stringify(data),
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
    if (!producer || !producer.availability) return [];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const schedule = producer.availability[dayName];
    const dateStr = date.toISOString().split('T')[0];
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
      setClients(prev => prev.map(c => c.id === user.id ? { ...c, searchHistory: [term, ...(c.searchHistory || [])].slice(0, 20) } : c));
    } else if (user.role === UserRole.PRODUCER && user.producerId) {
      setProducers(prev => prev.map(p => p.id === user.producerId ? { ...p, searchHistory: [term, ...(p.searchHistory || [])].slice(0, 20) } : p));
    }
  };

  const getRecommendedOffers = (): Offer[] => {
    if (!user) return [];
    let history: string[] = [];
    if (user.role === UserRole.CLIENT) {
      const client = clients.find(c => c.id === user.id);
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
      setClients(prev => prev.map(c => c.id === user.id ? { ...c, favorites: c.favorites.includes(offerId) ? c.favorites.filter(id => id !== offerId) : [...c.favorites, offerId] } : c));
    } else if (user.role === UserRole.PRODUCER && user.producerId) {
      setProducers(prev => prev.map(p => p.id === user.producerId ? { ...p, favorites: p.favorites?.includes(offerId) ? p.favorites.filter(id => id !== offerId) : [...(p.favorites || []), offerId] } : p));
    }
  };

  const moveToFavorites = (offerId: string) => {
    if (!user) return;
    if (user.role === UserRole.CLIENT) {
      setClients(prev => prev.map(c => {
        if (c.id === user.id && !c.favorites.includes(offerId)) {
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
      const res = await apiFetch<ChatSession[]>('/api/chat/sessions', { silent401: true } as any);
      setChats(res);
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
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    }
  };

  const startNegotiation = async (pid: string, oid: string) => {
    if (!user) return '';

    // First refresh chats from server to check for an existing session
    try {
      const freshChats = await apiFetch<ChatSession[]>('/api/chat/sessions', { silent401: true } as any);
      if (Array.isArray(freshChats)) setChats(freshChats);
      const existing = freshChats.find((c: ChatSession) =>
        c.participantIds?.includes(user.id) && c.participantIds?.includes(pid) && c.offerId === oid
      );
      if (existing) return existing.id;
    } catch (_) {
      // Network error — fall through to check local cache
      const existing = chats.find(c => c.participantIds?.includes(user.id) && c.participantIds?.includes(pid) && c.offerId === oid);
      if (existing) return existing.id;
    }

    try {
      const res = await apiFetch<ChatSession>('/api/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ participantIds: [pid], offerId: oid })
      });
      setChats(prev => [...prev, res]);
      return res.id;
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
