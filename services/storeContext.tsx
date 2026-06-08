
import React, { useState, ReactNode, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { ProducerProfile, ClientProfile, Offer, UserSession, UserRole, ProducerStatus, OfferType, MarketType, CartItem, Order, OrderStatus, Wallet, Notification, WithdrawalRequest, WithdrawalStatus, PaymentMethod, ChatSession, ChatMessage, Proposal, ProposalStatus, WeeklySchedule, AvailabilityException, Review, SupportMessage, Portfolio, DisputeEvidence, Coupon, PickupPoint, MyReferralsData, Location, PreferredHomeDeliverySnapshot } from '../types';
import { generateSupportResponse } from './geminiService';
import {
  getSupportMessages,
  getGuestSupportMessages,
  mapDtoToSupportMessage,
  mergeIncomingSupportMessages,
  postGuestSupportMessage,
  postUserSupportMessage,
  listUserSupportSessions,
  type SupportMessageDto,
} from './supportSessionsApi';
import { apiFetch, apiUpload, setToken, clearToken, getToken, getRefreshToken, setRefreshToken, isRefreshOnCooldown, attemptTokenRefresh } from './apiService';
import { normalizeRegisterPhoneFull } from '../utils/registerPhone';
import { resolveOfferImageSrc } from '../utils/offerImageDisplay';
import { logApiFailure } from './apiDebug';
import { showAppToast } from './appToast';
import { uploadAvatar } from './uploadService';
// `clientProfileMatchesSession` lives in its own module so this file only
// exports React-related symbols (provider + hooks). Vite's React plugin
// disables Fast Refresh on files with mixed exports, which led to two copies
// of the store module being loaded during HMR and the runtime crash
//   "useStore must be used within a StoreProvider".
import { clientProfileMatchesSession } from './clientProfileMatcher';

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
  const pic = r.reviewerProfileImageUrl;
  const picStr = typeof pic === 'string' && pic.trim() ? pic.trim() : undefined;
  return {
    id: String(r.id),
    orderId: String(r.orderId),
    reviewerId: String(r.reviewerId),
    targetId: String(r.targetId),
    rating: Number(r.rating) || 0,
    comment: typeof r.comment === 'string' ? r.comment : '',
    createdAt:
      typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt ?? 0).toISOString(),
    reviewerDisplayName:
      typeof r.reviewerDisplayName === 'string' ? r.reviewerDisplayName : undefined,
    reviewerProfileImageUrl: picStr,
  };
}

function normalizeLocationFromApi(raw: any): Location {
  const latLng = raw?.latLng;
  const lat = Number(raw?.lat ?? latLng?.lat ?? 0);
  const lng = Number(raw?.lng ?? latLng?.lng ?? 0);
  return {
    id: raw?.id ? String(raw.id) : undefined,
    region: String(raw?.region ?? ''),
    city: String(raw?.city ?? ''),
    address: String(raw?.address ?? ''),
    lat: Number.isFinite(lat) ? lat : 0,
    lng: Number.isFinite(lng) ? lng : 0,
    lastUsedForOrderAt: raw?.lastUsedForOrderAt
      ? new Date(raw.lastUsedForOrderAt).toISOString()
      : undefined,
  };
}

function normalizePreferredHomeFromApi(raw: unknown): PreferredHomeDeliverySnapshot | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  return {
    address: String(o.address ?? ''),
    city: String(o.city ?? ''),
    region: String(o.region ?? ''),
    lat: o.lat != null ? Number(o.lat) : undefined,
    lng: o.lng != null ? Number(o.lng) : undefined,
  };
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
  const participantsData = Array.isArray(raw?.participantsData)
    ? raw.participantsData
        .map((p: any) => ({
          id: String(p?.id ?? ''),
          displayName: p?.displayName ? String(p.displayName) : undefined,
          email: p?.email ? String(p.email) : undefined,
          role: p?.role ? String(p.role) : undefined,
        }))
        .filter((p: any) => p.id)
    : undefined;

  return {
    id,
    offerId,
    lastMessage,
    lastMessageAt,
    participantIds,
    participantsData,
    unreadCounts,
  };
}

function normalizeChatSessionsFromApi(rows: unknown): ChatSession[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(normalizeChatSessionFromApi).filter((c) => Boolean(c.id));
}

function mergeChatSessionsById(
  previous: ChatSession[],
  incoming: ChatSession[],
): ChatSession[] {
  const byId = new Map<string, ChatSession>();
  previous.forEach((s) => byId.set(s.id, s));
  incoming.forEach((s) => byId.set(s.id, s)); // incoming wins for freshest server truth
  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
}

import { fetchMyReferrals } from './referralsApi';
import { validateCouponRemote, type CouponValidationChannel } from './couponsApi';
import { io, Socket } from 'socket.io-client';
import { isWebAppAllowedRole, isWebAppSessionBlocked } from './authRoles';
import { isProducerDashboardUser, isManagerSession, producerAccountUserId } from './producerSession';
import { findProducerForUser } from '../utils/producerAccountStatus';
import { normalizeOrderStatus } from '../utils/orderActions';
import { useSessionStore } from '../stores/sessionStore';
import { API_ENDPOINTS } from '../client-api/endpoints';
import { queryClient } from '../client-api/queryClient';

/**
 * Feature-scoped cache keys + stale-times for lazy `refreshX()` helpers.
 *
 * These map every data slice we previously slurped in a single bootstrap call
 * into a React Query entry. With React Query already provided via
 * `QueryClientProvider`, calling `queryClient.fetchQuery({queryKey, staleTime})`
 * means:
 *   - first call hits the API and caches the result
 *   - subsequent calls within `staleTime` are no-ops (no network)
 *   - mutations invalidate the relevant key and the next read refetches
 *
 * That replaces the old "fetch everything on mount" pattern with on-demand,
 * per-page fetching while preserving the existing `useStore()` API for
 * downstream components (we still write the result into our useState arrays).
 */
const QK = {
  producers: () => ['producers'] as const,
  clients: () => ['clients'] as const,
  offers: () => ['offers'] as const,
  pickupPoints: () => ['pickup-points'] as const,
  allReviews: () => ['reviews', 'all'] as const,
  myReviews: (userId: string) => ['reviews', 'byUser', userId] as const,
  orders: (userId: string, role: string, clientId?: string) =>
    ['orders', userId, role, clientId ?? null] as const,
  wallet: (userId: string) => ['wallet', userId] as const,
  withdrawals: (userId: string) => ['wallet', 'withdrawals', userId] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
  chats: (userId: string) => ['chats', userId] as const,
  myPortfolios: (userId: string) => ['portfolios', 'mine', userId] as const,
  cart: (userId: string) => ['cart', userId] as const,
  myReferrals: (userId: string) => ['referrals', 'me', userId] as const,
};

const STALE = {
  catalog: 60_000,          // offers / producers / clients — re-fetch at most once / minute
  reviews: 60_000,
  pickupPoints: 5 * 60_000, // rarely changes
  orders: 30_000,
  wallet: 15_000,           // wallet balance is sensitive after payment
  withdrawals: 30_000,
  notifications: 15_000,
  chats: 15_000,
  portfolios: 30_000,
  cart: 30_000,
  referrals: 60_000,
};

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
  /**
   * Real-time typing indicators keyed by chat session id. Value is the
   * userId of the other participant currently typing; entries auto-expire
   * after ~5s if no follow-up `chat:typing` event arrives.
   */
  typingByChatId: Record<string, { userId: string; expiresAt: number }>;
  /**
   * True while the underlying socket.io connection is established. UI can
   * use this to fall back to a "Sending…" affordance or skip optimistic
   * typing emits gracefully.
   */
  isSocketConnected: boolean;
  /**
   * True while the /notifications WebSocket is connected. Pages can use this
   * to switch between an aggressive poll fallback (WS down) and a slow
   * safety-net poll (WS up). Chat pushes are delivered over WS as
   * `chat:message`/`chat:session-update`/`chat:proposal-resolved`.
   */
  realtimeConnected: boolean;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  startNegotiation: (producerId: string, offerId: string) => Promise<string>;
  sendMessage: (chatId: string, text: string, proposal?: Proposal) => Promise<boolean>;
  /** Re-send a message currently in `FAILED` state. Identified by its local clientId. */
  retryMessage: (clientId: string) => Promise<boolean>;
  /**
   * Emit a `chat:typing` event for the active session. Caller is responsible
   * for throttling `isTyping: true` and debouncing `isTyping: false`. The
   * `recipientIds` array tells the server which other user rooms to fan out
   * to — passing it from the caller avoids a stale-closure lookup against
   * the global `chats` array.
   */
  emitTyping: (chatId: string, isTyping: boolean, recipientIds: string[]) => void;
  respondToProposal: (chatId: string, messageId: string, action: 'ACCEPT' | 'REJECT' | 'COUNTER', counterPrice?: number, counterQty?: number, bookingDate?: string) => Promise<boolean>;

  // Support Chat (Client Side)
  supportMessages: SupportMessage[];
  isSupportChatOpen: boolean;
  /** True while waiting for an AI reply (shows typing indicator). */
  supportAiTyping: boolean;
  /** True while a support message is being sent (disables composer). */
  supportChatSending: boolean;
  /** True when the session has been handed over to a human agent. */
  isHandedOver: boolean;
  /** True while returnToAiMode() is in-flight. */
  returningToAi: boolean;
  /** User voluntarily switches back from agent mode to AI (AgriBot) mode. */
  returnToAiMode: () => Promise<void>;
  toggleSupportChat: () => void;
  /** Open the support widget and sync agent messages when available. */
  openSupportChat: () => void;
  syncSupportInbox: () => Promise<void>;
  sendSupportMessage: (text: string) => Promise<void>;
  retrySupportMessage: (messageId: string) => Promise<void>;
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
  registerProducer: (data: Omit<ProducerProfile, 'id' | 'status' | 'joinedDate' | 'paymentMethods' | 'favorites' | 'searchHistory' | 'referrals' | 'referralCode'> & { referrerCode?: string; phoneVerificationToken?: string }, password: string) => Promise<{ success: boolean; message: string }>;
  updateProducerProfile: (producer: ProducerProfile, otpToken?: string) => Promise<boolean>;
  requestOtp: (action: 'PROFILE_UPDATE' | 'WITHDRAWAL' | 'PASSWORD_CHANGE') => Promise<{ success: boolean; message: string }>;
  verifyOtp: (action: 'PROFILE_UPDATE' | 'WITHDRAWAL' | 'PASSWORD_CHANGE', code: string) => Promise<{ success: boolean; token?: string; message: string }>;
  updateProducerAvailability: (producerId: string, schedule: WeeklySchedule, exceptions: AvailabilityException[]) => Promise<void>;
  registerClient: (data: Omit<ClientProfile, 'id' | 'joinedDate' | 'referrals' | 'referralCode'> & { referrerCode?: string; phoneVerificationToken?: string }, password: string, avatarFile?: File | null) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (code: string) => Promise<boolean>;
  updateClientProfile: (client: ClientProfile) => Promise<boolean>;
  upgradeClientToProducer: (clientId: string, producerDetails: Partial<ProducerProfile>) => Promise<boolean>;
  validateProducer: (id: string, status: ProducerStatus) => Promise<void>;
  saveProducerPaymentMethod: (producerId: string, method: PaymentMethod) => void;
  deleteProducerPaymentMethod: (producerId: string, methodId: string) => void;
  createOffer: (offer: Omit<Offer, 'id' | 'createdAt' | 'producerId'>) => Promise<{ success: boolean; error?: string }>;
  updateOffer: (offer: Offer) => Promise<{ success: boolean; error?: string }>;
  deleteOffer: (offerId: string) => Promise<{ success: boolean; error?: string }>;
  getProducerOffers: (producerId: string) => Offer[];
  getOfferById: (offerId: string) => Offer | undefined;
  getAvailableSlots: (producerId: string, date: Date, durationHours: number) => Date[];
  addToCart: (offer: Offer, quantity: number, bookingDate?: string) => { success: boolean; error?: 'PRODUCER_CONFLICT' | 'OWN_OFFER' | 'DUPLICATE_SERVICE_SLOT' };
  removeFromCart: (offerId: string) => void;
  clearCart: () => void;
  placeOrder: (
    couponId?: string,
    discountAmount?: number,
    deliveryDate?: string,
    deliveryMethod?: 'HOME' | 'PICKUP',
    pickupPointId?: string,
    homeDeliveryLocationId?: string,
    homeShippingSnapshot?: PreferredHomeDeliverySnapshot | null,
  ) => Promise<boolean>;
  confirmOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  payForOrder: (orderId: string) => Promise<{ success: boolean; error?: 'INSUFFICIENT_FUNDS' }>;
  startDelivery: (orderId: string) => Promise<void>;
  markOrderDelivered: (orderId: string) => Promise<void>;
  confirmReceipt: (orderId: string) => Promise<void>;
  completeOrder: (orderId: string) => Promise<void>;
  requestOrderCancellation: (orderId: string, reason?: string) => Promise<void>;
  updateAppointment: (orderId: string, bookingDate: string) => Promise<boolean>;
  reportProblem: (orderId: string, reason: string, files: File[]) => Promise<void>;
  addDisputeEvidence: (orderId: string, files: File[]) => void;
  revealContactInfo: (orderId: string) => Promise<void>;
  submitReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  getAverageRating: (targetId: string) => number;
  changePassword: (
    currentPass: string,
    newPass: string,
    otpToken?: string,
  ) => Promise<{ success: boolean; message: string }>;
  verifyCurrentPassword: (currentPass: string) => Promise<{ success: boolean; message: string }>;

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
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearNotifications: () => Promise<void>;

  /** From GET /api/users/me/referrals — null when logged out or not loaded. */
  myReferrals: MyReferralsData | null;
  refreshMyReferrals: () => Promise<void>;

  /** True until the first bootstrap fetch that loads offers (and related catalog data) finishes. */
  isInitialCatalogLoading: boolean;

  /**
   * Lazy, dedup-protected refreshers. Each one is backed by React Query — calling
   * within the slice's `staleTime` is a no-op (no network), so pages can call
   * them on mount without worrying about thrash. Pass `{force:true}` to bypass
   * the cache (used by mutations after server writes).
   */
  refreshOffers: (opts?: { force?: boolean }) => Promise<void>;
  refreshProducers: (opts?: { force?: boolean }) => Promise<void>;
  refreshClients: (opts?: { force?: boolean }) => Promise<void>;
  refreshAllReviews: (opts?: { force?: boolean }) => Promise<void>;
  refreshPickupPoints: (opts?: { force?: boolean }) => Promise<void>;
  refreshOrders: (opts?: { force?: boolean }) => Promise<void>;
  refreshWallet: (opts?: { force?: boolean }) => Promise<void>;
  refreshWithdrawals: (opts?: { force?: boolean }) => Promise<void>;
  refreshMyPortfolios: (opts?: { force?: boolean }) => Promise<void>;
  refreshMyReviews: (opts?: { force?: boolean }) => Promise<void>;
  refreshNotifications: (opts?: { force?: boolean }) => Promise<void>;
  refreshCart: (opts?: { force?: boolean }) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const getOrdersEndpointsForUser = (activeUser?: UserSession | null): string[] => {
  if (!activeUser) return [];
  if (activeUser.role === UserRole.CLIENT) return [API_ENDPOINTS.orders.my];
  if (isProducerDashboardUser(activeUser)) {
    // `GET /orders/my-orders` uses GetClientOrders and returns 403 without a client profile.
    // Only add it when the session has a client profile (producer–buyer or linked clientId).
    const out: string[] = [API_ENDPOINTS.orders.producer];
    if (activeUser.clientId) out.push(API_ENDPOINTS.orders.my);
    return out;
  }
  return [];
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) return null;
    try {
      const parsedUser = JSON.parse(savedUser);
      if (!isWebAppAllowedRole(parsedUser?.role)) {
        clearToken();
        localStorage.removeItem('currentUser');
        return null;
      }
      return parsedUser;
    } catch {
      return null;
    }
  });
  // pendingRegistration kept in-memory for OTP verification flow
  const [pendingRegistration, setPendingRegistration] = useState<{ email: string, code: string, data: any, role: UserRole, password?: string } | null>(null);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);

  // State
  const [producers, setProducers] = useState<ProducerProfile[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('cart');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [coupons, _setCoupons] = useState<Coupon[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [myReferrals, setMyReferrals] = useState<MyReferralsData | null>(null);
  const initialCatalogLoadDoneRef = useRef(false);
  const [isInitialCatalogLoading, setIsInitialCatalogLoading] = useState(true);

  // Chat State
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /**
   * Live typing indicators keyed by chat session id. Each entry is the
   * other-party userId currently typing in that chat and an `expiresAt`
   * timestamp so a missed "stopped typing" event can't leave the bubble
   * stuck on screen. Auto-pruned by a 1s interval below.
   */
  const [typingByChatId, setTypingByChatId] = useState<Record<string, { userId: string; expiresAt: number }>>({});
  /** True while the /notifications socket.io connection is up. */
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  /** Bumped after silent refresh so the socket reconnects with a new JWT. */
  const [socketAuthEpoch, setSocketAuthEpoch] = useState(0);

  // Compare State
  const [compareList, setCompareList] = useState<string[]>([]);

  // Support Chat State (Client Side)
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([
    { id: 'init-1', sender: 'AI', text: 'Hello! I am AgriBot, your automated assistant. How can I help you today?', timestamp: new Date().toISOString() }
  ]);
  const [isHandedOver, setIsHandedOver] = useState(false);
  const [returningToAi, setReturningToAi] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestEmailInput, setGuestEmailInput] = useState('');
  const [guestNameInput, setGuestNameInput] = useState('');
  const [supportSessionId, setSupportSessionId] = useState<string | null>(null);
  const [supportAiTyping, setSupportAiTyping] = useState(false);
  const [supportChatSending, setSupportChatSending] = useState(false);

  useEffect(() => {
    useSessionStore.getState().setUser(user);
    const savedGuestEmail = localStorage.getItem('guestEmail');
    if (savedGuestEmail) setGuestEmail(savedGuestEmail);

    let cancelled = false;
    (async () => {
      const hasStoredSession = Boolean(
        getToken() || getRefreshToken() || localStorage.getItem('currentUser'),
      );
      if (hasStoredSession) {
        await attemptTokenRefresh();
        if (!cancelled) await hydrateMarketplaceSession();
      }
      if (!cancelled) void bootstrapForRoute();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onTokenRefreshed = () => setSocketAuthEpoch((n) => n + 1);
    window.addEventListener('agm:token-refreshed', onTokenRefreshed);
    return () => window.removeEventListener('agm:token-refreshed', onTokenRefreshed);
  }, []);

  // Drop admin/staff sessions using JWT role (source of truth) even if localStorage user is stale.
  useEffect(() => {
    const token = getToken();
    if (isWebAppSessionBlocked(token, user)) {
      clearToken();
      localStorage.removeItem('currentUser');
      setUser(null);
      useSessionStore.getState().clear();
    }
  }, [user]);

  // Force a clean React state wipe when the API layer hard-logs-out the user
  // (refresh token expired/revoked, server 401 the SPA can't recover from).
  // Without this, the in-memory store keeps showing the previous user even
  // though localStorage / hash route have already moved to /login.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onSessionExpired = () => {
      setUser(null);
      useSessionStore.getState().clear();
      setMyReferrals(null);
      setReviews([]);
      setCart([]);
      setOrders([]);
      setWithdrawalRequests([]);
      setNotifications([]);
      setChats([]);
      setMessages([]);
      setCompareList([]);
    };
    window.addEventListener('agm:session-expired', onSessionExpired);
    return () => window.removeEventListener('agm:session-expired', onSessionExpired);
  }, []);

  // ─── DEBOUNCED CART SYNC ───────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    if (guestEmail) localStorage.setItem('guestEmail', guestEmail);
    else localStorage.removeItem('guestEmail');

    if (user && getToken()) {
      const timer = setTimeout(() => {
        apiFetch(API_ENDPOINTS.cart.sync, {
          method: 'POST',
          silent401: true,
          body: JSON.stringify({
            items: cart.map(item => ({
              offerId: item.id,
              quantity: item.cartQuantity,
              bookingDate: item.bookingDate || undefined
            }))
          })
        } as any).catch(() => {});
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [cart, user, guestEmail]);


  // ─── REALTIME: WebSocket for instant order/notification updates ───────────────
  const socketRef = useRef<Socket | null>(null);
  const userRef = useRef<typeof user>(user);
  userRef.current = user;
  const supportSessionIdRef = useRef<string | null>(supportSessionId);
  supportSessionIdRef.current = supportSessionId;
  // True while the /notifications socket is connected. The chat page reads
  // this via `useStore()` to decide whether to fall back to polling.
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);

  // Debounced light refresh: only fetches orders + notifications (the things that change
  // on socket events), not the full catalog. Collapses rapid-fire notifications into one call.
  const notificationFetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchInFlightRef = useRef<boolean>(false);
  const globalPollInFlightRef = useRef<boolean>(false);
  const debouncedLightFetch = useCallback(() => {
    if (notificationFetchTimer.current) clearTimeout(notificationFetchTimer.current);
    notificationFetchTimer.current = setTimeout(async () => {
      const u = userRef.current;
      if (!u || !getToken() || isRefreshOnCooldown() || fetchInFlightRef.current) return;
      fetchInFlightRef.current = true;
      try {
        const on401 = (_e: unknown) => {};
        const [resNotif, resSessions] = await Promise.all([
          apiFetch<Notification[]>(API_ENDPOINTS.notifications.list, { silent401: true } as any).catch((e) => { on401(e); return null; }),
          apiFetch<ChatSession[]>(API_ENDPOINTS.chat.sessions, { silent401: true } as any).catch((e) => { on401(e); return null; }),
        ]);
        if (resNotif && Array.isArray(resNotif)) {
          setNotifications((prev) => {
            const localOnly = prev.filter((n) => n.id.startsWith('note-'));
            const byId = new Map(resNotif.map((n) => [n.id, n]));
            localOnly.forEach((n) => byId.set(n.id, n));
            return Array.from(byId.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
          });
        }
        if (resSessions && Array.isArray(resSessions)) {
          const normalized = normalizeChatSessionsFromApi(resSessions);
          setChats((prev) => mergeChatSessionsById(prev, normalized));
        }
        const orderEndpoints = getOrdersEndpointsForUser(u);
        if (orderEndpoints.length > 0) {
          const orderResults = await Promise.all(
            orderEndpoints.map((ep) => apiFetch<any[]>(ep, { silent401: true } as any).catch((e) => { on401(e); return []; })),
          );
          const merged = Array.from(new Map(orderResults.flat().map((o: any) => [o.id, o])).values());
          setOrders(merged.map((o: any) => ({ ...o, items: Array.isArray(o.orderItems || o.items) ? (o.orderItems || o.items).map((item: any) => ({ ...item, cartQuantity: item.cartQuantity || item.quantity || 1, id: item.offerId || item.id })) : [] })));
        }
      } catch { /* ignore */ } finally {
        fetchInFlightRef.current = false;
      }
    }, 2000);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!user?.id || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsSocketConnected(false);
      setRealtimeConnected(false);
      return;
    }
    const apiBase = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : (typeof window !== 'undefined' ? window.location.origin : ''))).replace(/\/$/, '');
    const socket = io(`${apiBase}/notifications`, {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
      withCredentials: true,
    });
    socketRef.current = socket;
    let refreshOnConnectError = false;

    socket.on('connect', () => setRealtimeConnected(true));
    socket.on('disconnect', () => setRealtimeConnected(false));

    socket.on('notification', () => {
      debouncedLightFetch();
    });

    // ─── Chat message push (new). Replaces the 3s message-poll. ─────────────
    //
    // The backend now emits `chat:message` to every participant when a chat
    // message is saved. We append it in-place so the recipient's UI updates
    // instantly without hitting the messages endpoint. The chat page keeps a
    // long-interval visibility-gated safety-net poll for missed events.
    socket.on('chat:message', (payload: any) => {
      if (!payload?.message?.id) return;
      const sessionId = String(payload.sessionId ?? payload.message.chatSessionId ?? '');
      const m = payload.message;
      const incoming: ChatMessage = {
        id: String(m.id),
        chatId: sessionId,
        senderId: String(m.senderId),
        text: String(m.text ?? ''),
        systemMessage: Boolean(m.systemMessage),
        createdAt: typeof m.createdAt === 'string' ? m.createdAt : new Date(m.createdAt).toISOString(),
        proposal: m.proposalOfferId
          ? {
              offerId: String(m.proposalOfferId),
              pricePerUnit: Number(m.proposalPricePerUnit ?? 0),
              quantity: Number(m.proposalQuantity ?? 0),
              status: (m.proposalStatus as ProposalStatus) || ProposalStatus.PENDING,
            }
          : undefined,
        status: 'SENT',
      };
      setMessages((prev) => {
        // Already present (e.g. sender's own POST response wrote it): replace.
        const idx = prev.findIndex((x) => x.id === incoming.id);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = { ...prev[idx], ...incoming };
          return next;
        }
        // Collapse the optimistic placeholder (same chat/sender/text within 2 min).
        const optIdx = prev.findIndex(
          (x) =>
            x.status === 'SENDING' &&
            x.chatId === incoming.chatId &&
            x.senderId === incoming.senderId &&
            (x.text || '') === (incoming.text || '') &&
            Math.abs(new Date(x.createdAt).getTime() - new Date(incoming.createdAt).getTime()) < 120_000,
        );
        if (optIdx >= 0) {
          const next = prev.slice();
          next[optIdx] = { ...incoming, clientId: prev[optIdx].clientId };
          return next;
        }
        // Append only if this chat is the one currently loaded in state.
        // Other chats stay lazy — they'll fetch on open. This keeps the
        // store small and avoids leaking history across sessions.
        const isCurrentChat = prev.some((x) => x.chatId === incoming.chatId);
        if (!isCurrentChat) return prev;
        return [...prev, incoming].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
    });

    // Sidebar preview + unread badge — update in-place, no refetch.
    socket.on('chat:session-update', (payload: any) => {
      if (!payload?.sessionId) return;
      const me = userRef.current?.id;
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== payload.sessionId) return c;
          const nextUnread = { ...(c.unreadCounts || {}) };
          if (me && payload.senderId && me !== payload.senderId) {
            nextUnread[me] = (nextUnread[me] || 0) + 1;
          }
          return {
            ...c,
            lastMessage: payload.lastMessage ?? c.lastMessage,
            lastMessageAt: payload.lastMessageAt ?? c.lastMessageAt,
            unreadCounts: nextUnread,
          };
        }),
      );
    });

    // Live proposal resolution — flip PENDING → ACCEPTED/REJECTED in place.
    socket.on('chat:proposal-resolved', (payload: any) => {
      if (!payload?.messageId || !payload?.proposalStatus) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId && m.proposal
            ? { ...m, proposal: { ...m.proposal, status: payload.proposalStatus as ProposalStatus } }
            : m,
        ),
      );
    });

    // Real-time typing indicator. We treat any incoming `chat:typing` event as
    // valid (the server only forwards it to the right recipient) and stamp it
    // with an `expiresAt` 5s in the future so a dropped "stopped typing"
    // event can't leave the indicator on screen forever. The window is wider
    // than the sender's 2.5s emit throttle to absorb network jitter.
    const applySupportPush = (sessionId: string, message: SupportMessageDto) => {
      if (!sessionId || !message?.id) return;
      const current = supportSessionIdRef.current;
      if (current && current !== sessionId) return;
      if (message.sender === 'AGENT') setIsHandedOver(true);
      if (!current) setSupportSessionId(sessionId);
      const mapped = mapDtoToSupportMessage(message);
      setSupportMessages((prev) => {
        // Replace an optimistic placeholder (temp id starting with "u-", "a-", or "s-")
        // that has the same sender+text, rather than appending a duplicate. This happens
        // because the AI controller saves both the USER message and the AI reply to the
        // DB (emitting WS events each time) while the frontend has already shown them
        // optimistically with local temp ids.
        const dupIdx = prev.findIndex(
          (m) =>
            (m.id.startsWith('u-') || m.id.startsWith('a-') || m.id.startsWith('s-')) &&
            m.sender === mapped.sender &&
            m.text === mapped.text,
        );
        if (dupIdx !== -1) {
          const next = [...prev];
          next[dupIdx] = { ...mapped, status: (prev[dupIdx] as any).status };
          return next;
        }
        return mergeIncomingSupportMessages(prev, [mapped]);
      });
    };

    socket.on(
      'support:message',
      (payload: { sessionId?: string; message?: SupportMessageDto }) => {
        if (!payload?.sessionId || !payload?.message) return;
        applySupportPush(payload.sessionId, payload.message);
      },
    );

    socket.on(
      'support:session-update',
      (payload: { sessionId?: string; status?: string }) => {
        if (!payload?.sessionId) return;
        if (
          payload.status === 'AGENT_ACTIVE' ||
          payload.status === 'WAITING_FOR_AGENT'
        ) {
          setSupportSessionId((prev) => prev ?? payload.sessionId ?? null);
          setIsHandedOver(true);
          const sid = supportSessionIdRef.current ?? payload.sessionId;
          if (sid) {
            void getSupportMessages(sid).then((data) => {
              if (!Array.isArray(data)) return;
              setSupportMessages(data.map((msg) => mapDtoToSupportMessage(msg)));
            });
          }
        }
      },
    );

    socket.on('chat:typing', (data: { sessionId?: string; userId?: string; isTyping?: boolean }) => {
      const sessionId = typeof data?.sessionId === 'string' ? data.sessionId : '';
      const fromUserId = typeof data?.userId === 'string' ? data.userId : '';
      if (!sessionId || !fromUserId) return;
      // Ignore echoes for our own user id (shouldn't happen — server filters —
      // but defensive when sender has multiple tabs open as the same user).
      if (userRef.current && fromUserId === userRef.current.id) return;
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('[chat:typing] received', { sessionId, fromUserId, isTyping: data.isTyping });
      }
      setTypingByChatId((prev) => {
        const next = { ...prev };
        if (data?.isTyping === false) {
          if (next[sessionId]?.userId === fromUserId) delete next[sessionId];
          return next;
        }
        next[sessionId] = { userId: fromUserId, expiresAt: Date.now() + 5000 };
        return next;
      });
    });
    socket.on('connect', () => {
      setIsSocketConnected(true);
    });
    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });
    socket.on('connect_error', () => {
      setIsSocketConnected(false);
      setRealtimeConnected(false);
      if (refreshOnConnectError) return;
      refreshOnConnectError = true;
      void (async () => {
        const ok = await attemptTokenRefresh();
        const nextToken = getToken();
        if (ok && nextToken) {
          socket.auth = { token: nextToken };
          socket.connect();
        }
      })();
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setRealtimeConnected(false);
      setIsSocketConnected(false);
      if (notificationFetchTimer.current) clearTimeout(notificationFetchTimer.current);
    };
  }, [user?.id, socketAuthEpoch]);

  // Garbage-collect stale typing indicators every second. Avoids a leaked
  // "is typing" bubble when the other tab closes mid-keystroke.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingByChatId((prev) => {
        let dirty = false;
        const next: typeof prev = {};
        for (const key in prev) {
          if (prev[key].expiresAt > now) {
            next[key] = prev[key];
          } else {
            dirty = true;
          }
        }
        return dirty ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Emit a `chat:typing` event for the active chat.
   *
   * Caller passes the resolved `recipientIds` (already filtered to exclude
   * self) so this function has zero dependencies on global state — meaning
   * the React closure stays stable for the entire session lifetime and the
   * ChatPage cleanup effect never fires spurious "stopped typing" events on
   * every poll/state change.
   *
   * We deliberately don't gate on `socket.connected`: socket.io-client
   * buffers `emit` calls while reconnecting (default behaviour with
   * `volatile = false`), so a momentary disconnect doesn't silently drop
   * the keystroke. A `console.debug` line makes the path visible in
   * DevTools so this can be verified without instrumentation.
   */
  const emitTyping = useCallback(
    (chatId: string, isTyping: boolean, recipientIds: string[]) => {
      const socket = socketRef.current;
      const u = userRef.current;
      if (!socket || !u || !chatId) return;
      const safeRecipients = Array.isArray(recipientIds)
        ? recipientIds.filter((id) => typeof id === 'string' && id.length > 0 && id !== u.id)
        : [];
      if (safeRecipients.length === 0) return;
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('[chat:typing] emit', {
          sessionId: chatId,
          recipientIds: safeRecipients,
          isTyping,
          connected: socket.connected,
        });
      }
      socket.emit('chat:typing', { sessionId: chatId, recipientIds: safeRecipients, isTyping });
    },
    [],
  );

  // ─── GLOBAL POLLING (lightweight, visibility-gated) ─────────────────────────
  //
  // Previously polled orders + notifications + chat sessions every 15s for every
  // authenticated user — even an idle tab. Now:
  //   - 60s cadence
  //   - paused when the tab is hidden (visibilitychange listener)
  //   - orders dropped from the poll: pages re-fetch via `refreshOrders()` on
  //     mount (dedup-cached) and sockets push real-time updates anyway
  //
  // Only notifications + chat-session unread counts run here because the navbar
  // badges need to stay live without forcing the user to be on a particular page.
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const isVisible = () =>
      typeof document === 'undefined' || document.visibilityState === 'visible';

    const tick = async () => {
      if (!getToken() || isRefreshOnCooldown() || globalPollInFlightRef.current) return;
      if (!isVisible()) return;
      globalPollInFlightRef.current = true;
      try {
        const resSessions = await apiFetch<ChatSession[]>(
          API_ENDPOINTS.chat.sessions,
          { silent401: true } as any,
        ).catch(() => null);
        if (resSessions && Array.isArray(resSessions)) {
          const normalized = normalizeChatSessionsFromApi(resSessions);
          setChats((prev) => mergeChatSessionsById(prev, normalized));
        }
        // Use the dedup-aware refresher; it skips if cache is still fresh.
        await refreshNotifications();
      } catch {
        // ignore background polling errors
      } finally {
        globalPollInFlightRef.current = false;
      }
    };

    if (user && getToken()) {
      interval = setInterval(tick, 60_000); // 60s
      // Run once immediately on tab becoming visible so badges don't lag.
      const onVisibility = () => { if (isVisible()) void tick(); };
      document.addEventListener('visibilitychange', onVisibility);
      return () => {
        if (interval) clearInterval(interval);
        document.removeEventListener('visibilitychange', onVisibility);
      };
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.id]);

  /**
   * Mark a feature's query cache as stale so the next `refreshX()` call hits
   * the API instead of replaying cached data. Most mutations already update
   * local state optimistically, but if the cache stayed "fresh" the next page
   * mount would call `refreshX()` → cached() → `setX(staleCache)` and revert
   * the mutation. This helper prevents that.
   */
  const bustCache = (queryKey: readonly unknown[]) => {
    void queryClient.invalidateQueries({ queryKey: queryKey as any, exact: false });
  };

  // ─── PER-FEATURE REFRESHERS (React Query backed) ───────────────────────────
  //
  // Each helper is a thin wrapper around `queryClient.fetchQuery` so calls
  // within the slice's `staleTime` window are no-ops (dedup + cache). After
  // a successful fetch we mirror the result into the existing `useState`
  // arrays so every downstream `useStore()` consumer keeps reading from a
  // single source of truth.

  const mapOrderRow = (o: any) => ({
    ...o,
    status: normalizeOrderStatus(o.status),
    clientConfirmedReceipt: o.clientConfirmedReceipt ?? false,
    cancellationRequested: o.cancellationRequested ?? false,
    settledAt: o.settledAt ?? undefined,
    deliveredAt: o.deliveredAt ?? undefined,
    items: Array.isArray(o.orderItems || o.items)
      ? (o.orderItems || o.items).map((item: any) => ({
          ...item,
          cartQuantity: item.cartQuantity || item.quantity || 1,
          id: item.offerId || item.id,
        }))
      : [],
  });

  const mapProducerRow = (p: any): ProducerProfile => {
    const displayName =
      (p as any).user?.displayName ??
      `${String((p as any).firstName ?? '').trim()} ${String((p as any).lastName ?? '').trim()}`.trim();
    const userId = String((p as any).userId ?? (p as any).user?.id ?? '');
    return {
      ...p,
      userId: userId || (p as any).userId,
      name: displayName || 'Unknown',
      profileImageUrl: (p as any).user?.profileImageUrl ?? (p as any).profileImageUrl,
      locations: Array.isArray(p.locations) ? p.locations.map(normalizeLocationFromApi) : [],
      preferredHomeDelivery: normalizePreferredHomeFromApi((p as any).preferredHomeDelivery),
      certifications: p.certifications || [],
      taxIdentificationNumber: p.taxIdentificationNumber ?? undefined,
      taxClearanceCertificateUrl: p.taxClearanceCertificateUrl ?? undefined,
      paymentMethods: p.paymentMethods || [],
      referrals: p.referrals || [],
      favorites: p.favorites || [],
      productionTypes: p.productionTypes || [],
      searchHistory: p.searchHistory || [],
    };
  };

  const mapClientRow = (c: any) => {
    const displayName =
      (c as any).user?.displayName ??
      `${String((c as any).firstName ?? '').trim()} ${String((c as any).lastName ?? '').trim()}`.trim();
    return {
      ...c,
      name: displayName || 'Unknown',
      profileImageUrl: (c as any).user?.profileImageUrl ?? (c as any).profileImageUrl,
      locations: Array.isArray(c.locations) ? c.locations.map(normalizeLocationFromApi) : [],
      preferredHomeDelivery: normalizePreferredHomeFromApi(c.preferredHomeDelivery),
      favorites: c.favorites || [],
      referrals: c.referrals || [],
      searchHistory: c.searchHistory || [],
    };
  };

  /** `queryClient.fetchQuery` honours `staleTime`; passing `force` invalidates first. */
  const cached = async <T,>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>,
    staleTime: number,
    force?: boolean,
  ): Promise<T | null> => {
    try {
      if (force) {
        await queryClient.invalidateQueries({ queryKey: queryKey as any, exact: false });
      }
      return await queryClient.fetchQuery({
        queryKey: queryKey as any,
        queryFn,
        staleTime,
      });
    } catch (e) {
      logApiFailure('cached fetch failed', e);
      return null;
    }
  };

  const refreshOffers = async (opts?: { force?: boolean }) => {
    const [marketplace, retail] = await Promise.all([
      cached(
        QK.offers(),
        () =>
          apiFetch<Offer[] | { data: Offer[] }>(
            `${API_ENDPOINTS.offers.list}?limit=100&page=1`,
            { silent401: true } as any,
          ),
        STALE.catalog,
        opts?.force,
      ),
      cached(
        [...QK.offers(), 'retail'] as any,
        () =>
          apiFetch<Offer[]>(API_ENDPOINTS.offers.retailList, { silent401: true } as any),
        STALE.catalog,
        opts?.force,
      ),
    ]);
    const withDisplayImage = (row: any) => ({
      ...row,
      imageUrl: resolveOfferImageSrc(row.imageUrl),
      imageUrls: Array.isArray(row.imageUrls)
        ? row.imageUrls.map((u: string) => resolveOfferImageSrc(u))
        : row.imageUrls,
    });
    const marketplaceList = (marketplace
      ? Array.isArray(marketplace)
        ? marketplace
        : ((marketplace as any).data ?? [])
      : []
    ).map(withDisplayImage);
    const retailRaw = retail ?? [];
    const retailList = (Array.isArray(retailRaw) ? retailRaw : []).map((row: any) =>
      withDisplayImage({
        ...row,
        marketType: row.marketType ?? MarketType.ATI,
        quantity: Number(row.quantity ?? 0),
        price: Number(row.price ?? 0),
        isNegotiable: row.isNegotiable ?? false,
        isDeliveryAvailable: row.isDeliveryAvailable ?? true,
        minQuantity: Number(row.minQuantity ?? 1),
        createdAt: row.createdAt ?? new Date().toISOString(),
      }),
    );
    const byId = new Map<string, Offer>();
    for (const o of marketplaceList) {
      if (o?.id) byId.set(o.id, o);
    }
    for (const o of retailList) {
      if (o?.id) byId.set(o.id, o);
    }
    setOffers(Array.from(byId.values()));
  };

  const syncProducerDashboardSession = (rows: ProducerProfile[]): boolean => {
    const session = userRef.current;
    if (!session) return false;
    let next: UserSession | null = null;
    if (isManagerSession(session) && session.managedProducerUserId) {
      const managed = rows.find((p) => {
        const profileUserId = p.userId ?? (p as { user?: { id?: string } }).user?.id;
        return profileUserId === session.managedProducerUserId;
      });
      if (managed && session.producerId !== managed.id) {
        next = {
          ...session,
          producerId: managed.id,
          managedProducerUserId: session.managedProducerUserId,
        };
      }
    } else if (session.role === UserRole.PRODUCER && !session.producerId) {
      const own = rows.find((p) => {
        const profileUserId = p.userId ?? (p as { user?: { id?: string } }).user?.id;
        return profileUserId === session.id;
      });
      if (own) next = { ...session, producerId: own.id };
    }
    if (!next) return false;
    userRef.current = next;
    setUser(next);
    useSessionStore.getState().setUser(next);
    localStorage.setItem('currentUser', JSON.stringify(next));
    bustCache(QK.orders(producerAccountUserId(next), next.role, next.clientId));
    return true;
  };

  const refreshProducers = async (opts?: { force?: boolean }) => {
    const session = userRef.current;
    const data = await cached(
      QK.producers(),
      () => apiFetch<any[]>(API_ENDPOINTS.producers.list, { silent401: true } as any),
      STALE.catalog,
      opts?.force,
    );
    if (!Array.isArray(data)) return;
    const rows = data.map(mapProducerRow);
    setProducers(rows);
    const priorProducerId = session?.producerId;
    const sessionSynced = syncProducerDashboardSession(rows);
    const activeSession = userRef.current;
    if (
      sessionSynced ||
      (activeSession?.producerId && activeSession.producerId !== priorProducerId)
    ) {
      bustCache(QK.orders(producerAccountUserId(activeSession!), activeSession!.role, activeSession!.clientId));
      if (getToken()) {
        await refreshOrders({ force: true });
      }
    }
    if (
      activeSession &&
      isProducerDashboardUser(activeSession) &&
      activeSession.producerId &&
      !rows.some((p) => p.id === activeSession.producerId)
    ) {
      const ownerUserId = isManagerSession(activeSession)
        ? activeSession.managedProducerUserId ?? activeSession.id
        : activeSession.id;
      upsertProducerInStore({
        id: activeSession.producerId,
        userId: ownerUserId,
        name: activeSession.name ?? activeSession.displayName ?? 'Producer',
        firstName: activeSession.name ?? 'Producer',
        lastName: '',
        user: {
          id: ownerUserId,
          email: activeSession.email,
          phone: activeSession.phone,
          displayName: activeSession.displayName ?? activeSession.name,
        },
      });
    }
  };

  const upsertClientInStore = (raw: any) => {
    if (!raw?.id) return;
    const mapped = mapClientRow(raw);
    const session = userRef.current;
    setClients((prev) => {
      const idx = prev.findIndex(
        (c) =>
          c.id === mapped.id ||
          (session && clientProfileMatchesSession(c, session)),
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...mapped, userId: mapped.userId ?? (next[idx] as any).userId ?? session?.id };
        return next;
      }
      return [...prev, { ...mapped, userId: mapped.userId ?? session?.id }];
    });
  };

  const upsertProducerInStore = (raw: any) => {
    if (!raw?.id) return;
    const mapped = mapProducerRow(raw);
    const session = userRef.current;
    setProducers((prev) => {
      const idx = prev.findIndex(
        (p) =>
          p.id === mapped.id ||
          (session?.producerId && p.id === session.producerId) ||
          (session && (p as any).userId === session.id),
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...mapped };
        return next;
      }
      return [...prev, mapped];
    });
  };

  const refreshClients = async (opts?: { force?: boolean }) => {
    if (!getToken()) return;
    const session = userRef.current;
    if (session?.role === UserRole.CLIENT) {
      try {
        const me = await cached(
          [...QK.clients(), 'me', session.id] as const,
          () =>
            apiFetch<any>(API_ENDPOINTS.profiles.meClient, { silent401: true } as any).catch(
              () => apiFetch<any>(API_ENDPOINTS.clients.me, { silent401: true } as any),
            ),
          STALE.catalog,
          opts?.force,
        );
        if (me?.id) {
          upsertClientInStore({ ...me, userId: (me as any).userId ?? session.id });
          return;
        }
      } catch {
        /* fall through to list */
      }
    }
    const data = await cached(
      QK.clients(),
      () => apiFetch<any[]>(API_ENDPOINTS.clients.list, { silent401: true } as any),
      STALE.catalog,
      opts?.force,
    );
    if (!Array.isArray(data)) return;
    setClients(data.map(mapClientRow));
  };

  const refreshPickupPoints = async (opts?: { force?: boolean }) => {
    const data = await cached(
      QK.pickupPoints(),
      () => apiFetch<PickupPoint[]>(API_ENDPOINTS.pickupPoints.list, { silent401: true } as any),
      STALE.pickupPoints,
      opts?.force,
    );
    if (Array.isArray(data)) setPickupPoints(data);
  };

  const refreshAllReviews = async (opts?: { force?: boolean }) => {
    const data = await cached(
      QK.allReviews(),
      () => apiFetch<any[]>(API_ENDPOINTS.reviews.all, { silent401: true } as any),
      STALE.reviews,
      opts?.force,
    );
    if (!Array.isArray(data) || data.length === 0) return;
    const mapped = data.map(mapReviewFromApi);
    setReviews((prev) => {
      const byId = new Map(prev.map((x) => [x.id, x]));
      mapped.forEach((x) => byId.set(x.id, x));
      return Array.from(byId.values());
    });
  };

  const refreshOrders = async (opts?: { force?: boolean }) => {
    const u = userRef.current;
    if (!u || !getToken()) return;
    const endpoints = getOrdersEndpointsForUser(u);
    if (endpoints.length === 0) return;
    const ordersCacheOwner = producerAccountUserId(u) || u.id;
    const data = await cached(
      QK.orders(ordersCacheOwner, u.role, u.clientId),
      async () => {
        const rows = await Promise.all(
          endpoints.map((ep) =>
            apiFetch<any[]>(ep, { silent401: true } as any).catch(() => [] as any[]),
          ),
        );
        return Array.from(new Map(rows.flat().map((o: any) => [o.id, o])).values());
      },
      STALE.orders,
      opts?.force,
    );
    if (Array.isArray(data)) setOrders(data.map(mapOrderRow));
  };

  const refreshWallet = async (opts?: { force?: boolean }) => {
    const u = userRef.current;
    if (!u || !getToken()) return;
    const walletKey = producerAccountUserId(u);
    const data = await cached(
      QK.wallet(walletKey),
      () => apiFetch<any>(API_ENDPOINTS.wallet.me, { silent401: true } as any),
      STALE.wallet,
      opts?.force,
    );
    if (!data || !data.userId) return;
    const walletRow = {
      userId: data.userId,
      balance: Number(data.balance) || 0,
      pendingBalance: Number(data.pendingBalance) || 0,
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
    };
    setWallets((prev) => ({
      ...prev,
      [walletKey]: walletRow,
      [u.id]: walletRow,
    }));
  };

  const refreshWithdrawals = async (opts?: { force?: boolean }) => {
    const u = userRef.current;
    if (!u || !getToken()) return;
    const walletKey = producerAccountUserId(u);
    const data = await cached(
      QK.withdrawals(walletKey),
      () => apiFetch<any[]>(API_ENDPOINTS.wallet.myWithdrawals, { silent401: true } as any),
      STALE.withdrawals,
      opts?.force,
    );
    setWithdrawalRequests(Array.isArray(data) ? data.map(mapWithdrawalFromApi) : []);
  };

  const refreshMyPortfolios = async (opts?: { force?: boolean }) => {
    const u = userRef.current;
    if (!u || !getToken()) return;
    if (!isProducerDashboardUser(u) || !u.producerId) return;
    const data = await cached(
      QK.myPortfolios(u.id),
      () => apiFetch<Portfolio[]>(API_ENDPOINTS.portfolios.list, { silent401: true } as any),
      STALE.portfolios,
      opts?.force,
    );
    if (Array.isArray(data)) setPortfolios(data);
  };

  const refreshMyReviews = async (opts?: { force?: boolean }) => {
    const u = userRef.current;
    if (!u || !getToken()) return;
    const data = await cached(
      QK.myReviews(u.id),
      () => apiFetch<any[]>(API_ENDPOINTS.reviews.byUser(u.id), { silent401: true } as any),
      STALE.reviews,
      opts?.force,
    );
    if (!Array.isArray(data)) return;
    const mapped = data.map(mapReviewFromApi);
    setReviews((prev) => {
      const byId = new Map(prev.map((x) => [x.id, x]));
      mapped.forEach((x) => byId.set(x.id, x));
      return Array.from(byId.values());
    });
  };

  const refreshNotifications = async (opts?: { force?: boolean }) => {
    const u = userRef.current;
    if (!u || !getToken()) return;
    const data = await cached(
      QK.notifications(u.id),
      () => apiFetch<Notification[]>(API_ENDPOINTS.notifications.list, { silent401: true } as any),
      STALE.notifications,
      opts?.force,
    );
    if (!Array.isArray(data)) return;
    setNotifications((prev) => {
      const localOnly = prev.filter((n) => n.id.startsWith('note-'));
      const byId = new Map(data.map((n) => [n.id, n]));
      localOnly.forEach((n) => byId.set(n.id, n));
      return Array.from(byId.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    });
  };

  const refreshCart = async (opts?: { force?: boolean }) => {
    const u = userRef.current;
    if (!u || !getToken()) return;
    const payload = await cached(
      QK.cart(u.id),
      () =>
        apiFetch<{ items?: Array<{ offerId: string; quantity: number; bookingDate?: string }> }>(
          API_ENDPOINTS.cart.get,
          { silent401: true } as any,
        ),
      STALE.cart,
      opts?.force,
    );
    const rows = payload?.items;
    if (!Array.isArray(rows) || rows.length === 0) return;
    // Read offers from the React Query cache (always current after a refresh
    // in the same render cycle, unlike `offers` from useState which is stale
    // inside the same closure). Fall back to component state when missing.
    let offersList = (queryClient.getQueryData<Offer[] | { data: Offer[] }>(QK.offers()) ?? null) as
      | Offer[]
      | { data: Offer[] }
      | null;
    let offersArr: Offer[] = Array.isArray(offersList)
      ? offersList
      : Array.isArray((offersList as any)?.data)
        ? ((offersList as any).data as Offer[])
        : offers;
    if (offersArr.length === 0) return; // bootstrap will retry on next page mount
    setCart((prev) => {
      if (prev.length > 0) return prev;
      const hydrated = rows
        .map((row) => {
          const off = offersArr.find((o: any) => o.id === row.offerId) as Offer | undefined;
          if (!off) return null;
          return {
            ...off,
            cartQuantity: Math.max(1, Math.floor(Number(row.quantity)) || 1),
            bookingDate: row.bookingDate ? new Date(row.bookingDate).toISOString() : undefined,
          } as CartItem;
        })
        .filter(Boolean) as CartItem[];
      return hydrated.length ? hydrated : prev;
    });
  };

  /**
   * Minimal bootstrap.
   *
   * Only fetches the data the navbar needs to render its badges (unread
   * notifications + chat sessions) for authenticated users. Every other slice
   * is fetched lazily by the page (or even by the active tab within a page)
   * that actually needs it.
   *
   * This is the React Query pattern: pages own their queries, and the cache
   * dedupes repeat reads within `staleTime`, so a second visit to a page is
   * instant.
   */
  const bootstrapForRoute = async () => {
    const authed = Boolean(user && getToken());
    try {
      if (authed) {
        await Promise.all([refreshNotifications(), fetchChats()]);
      }
    } finally {
      if (!initialCatalogLoadDoneRef.current) {
        initialCatalogLoadDoneRef.current = true;
        setIsInitialCatalogLoading(false);
      }
    }
  };

  // ─── DATA FETCHING ──────────────────────────────────────────────────────────

  const fetchData = async (currentUser?: typeof user) => {
    const activeUser = currentUser ?? user;
    const isClientSession = activeUser?.role === UserRole.CLIENT;
    const isProducerSession = isProducerDashboardUser(activeUser);
    // BrowserRouter uses pathname; hash is often empty (only used if present).
    const path =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.hash}`
        : '';
    const isClientUiRoute =
      path.includes('/client/') || path.includes('/register/client');
    const isProducerUiRoute = path.includes('/producer/');
    /** Skip `/api/clients` list when a producer is not on client UI (reduces load; rev behavior). */
    const shouldFetchBuyerProfile =
      isClientSession || (isProducerSession && (isClientUiRoute || isProducerUiRoute));
    const shouldFetchProducerPortfolios = isProducerSession && Boolean(activeUser?.producerId);
    const ordersEndpoints = getOrdersEndpointsForUser(activeUser);
    try {
      if (isRefreshOnCooldown()) return;
      const on401 = (_e: unknown) => {};
      if (activeUser && getToken()) await fetchChats().catch(on401);
      const [resProducers, resClients, resOffers, resPickup, resAllReviews] = await Promise.all([
        apiFetch<ProducerProfile[]>(API_ENDPOINTS.producers.list, { silent401: true } as any).catch((e) => { on401(e); return []; }),
        shouldFetchBuyerProfile
          ? apiFetch<ClientProfile[]>(API_ENDPOINTS.clients.list, { silent401: true } as any).catch((e) => { on401(e); return []; })
          : Promise.resolve([] as ClientProfile[]),
        apiFetch<Offer[]>(API_ENDPOINTS.offers.list, { silent401: true } as any).catch((e) => { on401(e); return []; }),
        apiFetch<PickupPoint[]>(API_ENDPOINTS.pickupPoints.list, { silent401: true } as any).catch((e) => { on401(e); return []; }),
        apiFetch<any[]>(API_ENDPOINTS.reviews.all, { silent401: true } as any).catch(() => [] as any[]),
      ]);
      // Only fetch orders, wallet, and referral stats when authenticated and we have a token (avoids 401 spam when token expired)
      if (activeUser && getToken()) {
        const [resOrders, resWallet, resWithdrawals, referralsPayload, resMyReviews, resMyPortfolios, resNotifications] = await Promise.all([
          ordersEndpoints.length > 0
            ? Promise.all(
                ordersEndpoints.map((endpoint) =>
                  apiFetch<any[]>(endpoint, { silent401: true } as any).catch((e) => { on401(e); return []; }),
                ),
              ).then((rows) => Array.from(new Map(rows.flat().map((o: any) => [o.id, o])).values()))
            : Promise.resolve([] as any[]),
          apiFetch<any>(API_ENDPOINTS.wallet.me, { silent401: true } as any).catch((e) => { on401(e); return null; }),
          apiFetch<any[]>(API_ENDPOINTS.wallet.myWithdrawals, { silent401: true } as any).catch((e) => {
            on401(e);
            return [];
          }),
          fetchMyReferrals(),
          apiFetch<any[]>(API_ENDPOINTS.reviews.byUser(activeUser.id), { silent401: true } as any).catch((e) => {
            on401(e);
            return [];
          }),
          shouldFetchProducerPortfolios
            ? apiFetch<Portfolio[]>(API_ENDPOINTS.portfolios.list, { silent401: true } as any).catch((e) => {
                on401(e);
                return [];
              })
            : Promise.resolve([] as Portfolio[]),
          apiFetch<Notification[]>(API_ENDPOINTS.notifications.list, { silent401: true } as any).catch((e) => {
            on401(e);
            return null;
          }),
        ]);
        setMyReferrals(referralsPayload);
        if (Array.isArray(resWithdrawals)) {
          setWithdrawalRequests(resWithdrawals.map(mapWithdrawalFromApi));
        } else {
          setWithdrawalRequests([]);
        }
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
          const walletKey = producerAccountUserId(activeUser);
          const walletRow = {
            userId: resWallet.userId,
            balance: Number(resWallet.balance) || 0,
            pendingBalance: Number(resWallet.pendingBalance) || 0,
            transactions: Array.isArray(resWallet.transactions) ? resWallet.transactions : [],
          };
          setWallets((prev) => ({
            ...prev,
            [walletKey]: walletRow,
            [activeUser.id]: walletRow,
          }));
        }
        setPortfolios(Array.isArray(resMyPortfolios) ? resMyPortfolios : []);
        if (resNotifications && Array.isArray(resNotifications)) {
          setNotifications((prev) => {
            const localOnly = prev.filter((n) => n.id.startsWith('note-'));
            const byId = new Map(resNotifications.map((n) => [n.id, n]));
            localOnly.forEach((n) => byId.set(n.id, n));
            return Array.from(byId.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
          });
        }
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
        setNotifications([]);
      }
      setProducers(Array.isArray(resProducers) ? resProducers.map(p => {
        const displayName = (p as any).user?.displayName ?? `${String((p as any).firstName ?? '').trim()} ${String((p as any).lastName ?? '').trim()}`.trim();
        return {
          ...p,
          name: displayName || 'Unknown',
          profileImageUrl: (p as any).user?.profileImageUrl ?? (p as any).profileImageUrl,
          locations: Array.isArray(p.locations) ? p.locations.map(normalizeLocationFromApi) : [],
          preferredHomeDelivery: normalizePreferredHomeFromApi((p as any).preferredHomeDelivery),
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
          profileImageUrl: (c as any).user?.profileImageUrl ?? (c as any).profileImageUrl,
          locations: Array.isArray(c.locations) ? c.locations.map(normalizeLocationFromApi) : [],
          preferredHomeDelivery: normalizePreferredHomeFromApi(c.preferredHomeDelivery),
          favorites: c.favorites || [],
          referrals: c.referrals || [],
          searchHistory: c.searchHistory || []
        };
      };
      let clientRows = Array.isArray(resClients) ? resClients.map(mapClientRow) : [];
      // API must return `locations` on each client (see Prisma `include` on GET /api/clients);
      // otherwise this map will set `locations: []` and wipe in-memory saved addresses.
      setClients(clientRows);
      const offersList = Array.isArray(resOffers) ? resOffers : ((resOffers as any)?.data || []);
      setOffers(offersList);
      setPickupPoints(Array.isArray(resPickup) ? resPickup : []);
      if (Array.isArray(resAllReviews) && resAllReviews.length > 0) {
        const mapped = resAllReviews.map(mapReviewFromApi);
        setReviews((prev) => {
          const byId = new Map(prev.map((x) => [x.id, x]));
          mapped.forEach((x) => byId.set(x.id, x));
          return Array.from(byId.values());
        });
      }

      if (activeUser && getToken() && offersList.length > 0) {
        const cartPayload = await apiFetch<{ items?: Array<{ offerId: string; quantity: number; bookingDate?: string }> }>(
          API_ENDPOINTS.cart.get,
          { silent401: true } as any,
        ).catch(() => null);
        const rows = cartPayload?.items;
        if (Array.isArray(rows) && rows.length > 0) {
          setCart((prev) => {
            if (prev.length > 0) return prev;
            const hydrated = rows
              .map((row) => {
                const off = offersList.find((o: any) => o.id === row.offerId) as Offer | undefined;
                if (!off) return null;
                return {
                  ...off,
                  cartQuantity: Math.max(1, Math.floor(Number(row.quantity)) || 1),
                  bookingDate: row.bookingDate ? new Date(row.bookingDate).toISOString() : undefined,
                } as CartItem;
              })
              .filter(Boolean) as CartItem[];
            return hydrated.length ? hydrated : prev;
          });
        }
      }
    } catch (error) {
      logApiFailure('Could not fetch data from API:', error);
    } finally {
      if (!initialCatalogLoadDoneRef.current) {
        initialCatalogLoadDoneRef.current = true;
        setIsInitialCatalogLoading(false);
      }
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
      await apiFetch(API_ENDPOINTS.notifications.markRead, { method: 'PATCH', silent401: true } as any);
      setNotifications(prev => prev.map(n => n.userId === user.id ? { ...n, isRead: true } : n));
      bustCache(['notifications']);
    } catch (e) {
      logApiFailure('Failed to mark notifications as read:', e);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await apiFetch(API_ENDPOINTS.notifications.markOneRead(notificationId), {
        method: 'PATCH',
        silent401: true,
      } as any);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId && n.userId === user.id ? { ...n, isRead: true } : n,
        ),
      );
      bustCache(['notifications']);
    } catch (e) {
      logApiFailure('Failed to mark notification as read:', e);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    try {
      await apiFetch(API_ENDPOINTS.notifications.remove(notificationId), {
        method: 'DELETE',
        silent401: true,
      } as any);
      setNotifications((prev) => prev.filter((n) => !(n.id === notificationId && n.userId === user.id)));
      bustCache(['notifications']);
    } catch (e) {
      logApiFailure('Failed to delete notification:', e);
    }
  };

  const clearNotifications = async () => {
    if (!user) return;
    try {
      await apiFetch(API_ENDPOINTS.notifications.clear, {
        method: 'DELETE',
        silent401: true,
      } as any);
      setNotifications((prev) => prev.filter((n) => n.userId !== user.id));
      bustCache(['notifications']);
    } catch (e) {
      logApiFailure('Failed to clear notifications:', e);
    }
  };

  type AuthSessionPayload = {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    user: UserSession;
  };

  const hydrateMarketplaceSession = async (): Promise<UserSession | null> => {
    if (!getToken()) return userRef.current;
    try {
      const me = await apiFetch<UserSession>(API_ENDPOINTS.auth.me, { silent401: true } as any);
      if (!me?.id || !isWebAppAllowedRole(me.role)) return userRef.current;
      const current = userRef.current;
      const merged: UserSession = {
        ...(current ?? ({} as UserSession)),
        ...me,
        id: me.id,
        role: me.role,
        email: me.email ?? current?.email ?? '',
        displayName: me.displayName ?? current?.displayName,
        name: me.name ?? current?.name ?? me.displayName,
        producerId: me.producerId ?? current?.producerId,
        clientId: me.clientId ?? current?.clientId,
        managedProducerUserId:
          me.managedProducerUserId ?? current?.managedProducerUserId,
      };
      userRef.current = merged;
      setUser(merged);
      useSessionStore.getState().setUser(merged);
      localStorage.setItem('currentUser', JSON.stringify(merged));
      return merged;
    } catch {
      return userRef.current;
    }
  };

  const establishSession = async (
    data: AuthSessionPayload,
    options?: { skipCatalogFetch?: boolean },
  ) => {
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
    useSessionStore.getState().setUser(data.user);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    userRef.current = data.user;
    await hydrateMarketplaceSession();

    const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (localCart.length > 0) {
      apiFetch(API_ENDPOINTS.cart.sync, {
        method: 'POST',
        silent401: true,
        body: JSON.stringify({ items: localCart.map((i: any) => ({ offerId: i.id, quantity: i.cartQuantity || 1 })) }),
      } as any).catch(() => {});
    }

    // `skipCatalogFetch` avoids a race: an in-flight fetch from here can finish *after* the
    // profile is created and overwrite `clients` / `producers` with stale data. Registration
    // flows call `fetchData(mergedUser)` once at the end instead.
    if (!options?.skipCatalogFetch) {
      void fetchData(userRef.current ?? data.user);
    }
  };

  // ─── AUTHENTICATION ──────────────────────────────────────────────────────────

  const login = async (identifier: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const data = await apiFetch<AuthSessionPayload>(API_ENDPOINTS.auth.login, {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      await establishSession(data);
      return { success: true, message: 'Logged in successfully.' };
    } catch (err: any) {
      clearToken();
      localStorage.removeItem('currentUser');
      useSessionStore.getState().clear();
      return { success: false, message: err.message || 'Login failed.' };
    }
  };

  const logout = async () => {
    try {
      if (getToken()) {
        await apiFetch(API_ENDPOINTS.auth.logout, { method: 'POST' });
      }
    } catch {
      // Ignore logout errors — always clear local state
    }
    clearToken();
    setUser(null);
    useSessionStore.getState().clear();
    setMyReferrals(null);
    setReviews([]);
    setCart([]);
    localStorage.removeItem('currentUser');
    // Drop session-scoped data so the next login/register does not reconcile against a huge
    // in-memory graph from the previous user (slower updates, brief wrong-user flash).
    setOrders([]);
    setWithdrawalRequests([]);
    setNotifications([]);
    setChats([]);
    setMessages([]);
    setCompareList([]);
    // Public catalog refresh in the background (non-blocking).
    setTimeout(() => {
      void fetchData(null);
    }, 0);
  };

  const refreshMyReferrals = useCallback(async () => {
    if (!user || !getToken()) {
      setMyReferrals(null);
      return;
    }
    const data = await fetchMyReferrals();
    setMyReferrals(data);
  }, [user]);

  const normalizeRegisterPhone = (phone: string | undefined) =>
    normalizeRegisterPhoneFull(String(phone ?? ''));

  /** Avoid RangeError from Invalid Date (e.g. empty date string) breaking registration. */
  const toIsoDateOfBirthSafe = (dob: unknown): string => {
    if (dob == null || String(dob).trim() === '') return new Date().toISOString();
    const d = new Date(String(dob));
    if (Number.isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  };

  /**
   * Backend DTOs require non-empty region, city, address on each location.
   * Browser geolocation / Nominatim can leave blanks; Google Places used to fill everything.
   */
  const sanitizeProfileLocationsForApi = (
    raw: unknown,
  ): Array<{ region: string; city: string; address: string; lat: number; lng: number }> => {
    if (!Array.isArray(raw) || raw.length === 0) return [];
    const out: Array<{ region: string; city: string; address: string; lat: number; lng: number }> = [];
    for (const loc of raw) {
      const region = String(loc?.region ?? '').trim() || 'Unknown';
      const city = String(loc?.city ?? '').trim() || 'Unknown';
      let address = String(loc?.address ?? '').trim();
      let lat = Number(loc?.lat);
      let lng = Number(loc?.lng);
      if (!Number.isFinite(lat)) lat = 0;
      if (!Number.isFinite(lng)) lng = 0;
      if (!address) {
        address =
          lat !== 0 || lng !== 0
            ? `Map pin (${lat.toFixed(5)}, ${lng.toFixed(5)})`
            : 'Address to be completed';
      }
      out.push({ region, city, address, lat, lng });
    }
    return out;
  };

  const registerProducer = async (data: any, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const producerRegisterBody: Record<string, string> = {
        email: String(data.email ?? '').trim(),
        phone: normalizeRegisterPhone(data.phone),
        password,
        displayName: data.name || 'Producer',
        role: UserRole.PRODUCER,
        producerAccountType: data.type === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'BUSINESS',
      };
      const refP = data.referrerCode;
      if (refP != null && String(refP).trim() !== '') {
        producerRegisterBody.referralCode = String(refP).trim();
      }
      const otpP = data.phoneVerificationToken;
      if (otpP == null || String(otpP).trim() === '') {
        return {
          success: false,
          message: 'Phone verification is required. Complete the OTP step before creating your account.',
        };
      }
      producerRegisterBody.phoneVerificationToken = String(otpP).trim();
      const session = await apiFetch<AuthSessionPayload>(API_ENDPOINTS.auth.register, {
        method: 'POST',
        body: JSON.stringify(producerRegisterBody),
      });

      await establishSession(session, { skipCatalogFetch: true });

      const producerProfile = await apiFetch<{ id: string }>(API_ENDPOINTS.profiles.producer, {
        method: 'POST',
        body: JSON.stringify({
          type: data.type || "BUSINESS",
          firstName: data.name || "Farm",
          lastName: "Owner",
          gender: "OTHER",
          dateOfBirth: new Date().toISOString(),
          description: String(data.description ?? '').trim() || 'Producer',
          certifications: data.certifications || [],
          productionTypes: data.productionTypes || [],
          locations: sanitizeProfileLocationsForApi(data.locations),
          taxIdentificationNumber: data.taxIdentificationNumber || undefined,
          taxClearanceCertificateUrl: data.taxClearanceCertificateUrl || undefined,
        }),
      });

      const mergedUser: UserSession = producerProfile?.id
        ? { ...session.user, producerId: producerProfile.id }
        : session.user;
      if (producerProfile?.id) {
        setUser(mergedUser);
        useSessionStore.getState().setUser(mergedUser);
        localStorage.setItem('currentUser', JSON.stringify(mergedUser));
        upsertProducerInStore({
          id: producerProfile.id,
          userId: session.user.id,
          name: data.name || 'Producer',
          firstName: data.name || 'Farm',
          lastName: 'Owner',
          description: data.description,
          locations: data.locations,
          productionTypes: data.productionTypes,
          type: data.type,
          user: {
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone,
            displayName: session.user.displayName ?? data.name,
          },
        });
      }

      setTimeout(() => {
        void fetchData(mergedUser);
      }, 0);
      return { success: true, message: 'Registration successful!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const registerClient = async (data: any, password: string, avatarFile?: File | null): Promise<{ success: boolean; message: string }> => {
    try {
      const clientRegisterBody: Record<string, string> = {
        email: String(data.email ?? '').trim(),
        phone: normalizeRegisterPhone(data.phone),
        password,
        displayName: data.name || `${data.firstName} ${data.lastName}`,
        role: UserRole.CLIENT,
      };
      const refC = data.referrerCode;
      if (refC != null && String(refC).trim() !== '') {
        clientRegisterBody.referralCode = String(refC).trim();
      }
      const otpC = data.phoneVerificationToken;
      if (otpC == null || String(otpC).trim() === '') {
        return {
          success: false,
          message: 'Phone verification is required. Complete the OTP step before creating your account.',
        };
      }
      clientRegisterBody.phoneVerificationToken = String(otpC).trim();
      const session = await apiFetch<AuthSessionPayload>(API_ENDPOINTS.auth.register, {
        method: 'POST',
        body: JSON.stringify(clientRegisterBody),
      });

      await establishSession(session, { skipCatalogFetch: true });

      const clientProfile = await apiFetch<{ id: string }>(API_ENDPOINTS.profiles.client, {
        method: 'POST',
        body: JSON.stringify({
          firstName: data.firstName || "Client",
          lastName: data.lastName || "",
          gender: data.gender || "OTHER",
          dateOfBirth: toIsoDateOfBirthSafe(data.dateOfBirth),
          locations: sanitizeProfileLocationsForApi(data.locations),
        }),
      });

      if (clientProfile?.id && avatarFile) {
        try {
          const url = await uploadAvatar(avatarFile);
          await apiFetch(API_ENDPOINTS.clients.update(clientProfile.id), {
            method: 'PUT',
            body: JSON.stringify({ profileImageUrl: url }),
          });
        } catch (avatarErr) {
          logApiFailure('Client avatar upload failed', avatarErr);
        }
      }

      const mergedUser: UserSession = clientProfile?.id
        ? { ...session.user, clientId: clientProfile.id }
        : session.user;
      if (clientProfile?.id) {
        setUser(mergedUser);
        useSessionStore.getState().setUser(mergedUser);
        localStorage.setItem('currentUser', JSON.stringify(mergedUser));
        upsertClientInStore({
          id: clientProfile.id,
          userId: session.user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          locations: data.locations,
          favorites: data.favorites ?? [],
          user: {
            id: session.user.id,
            email: session.user.email ?? data.email,
            phone: session.user.phone ?? data.phone,
            displayName: session.user.displayName ?? data.name,
          },
        });
        void queryClient.invalidateQueries({ queryKey: [...QK.clients()] });
      }

      setTimeout(() => {
        void fetchData(mergedUser);
      }, 0);
      return { success: true, message: 'Registration successful!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const verifyEmail = async (code: string): Promise<boolean> => {
    if (!pendingRegistration) return false;
    try {
      const data = await apiFetch<{ token: string; user: UserSession }>(API_ENDPOINTS.auth.verifyEmail, {
        method: 'POST',
        body: JSON.stringify({ email: pendingRegistration.email, code }),
      });
      setToken(data.token);
      setUser(data.user);
      useSessionStore.getState().setUser(data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      setPendingRegistration(null);
      return true;
    } catch {
      return false;
    }
  };

  const verifyCurrentPassword = async (
    currentPass: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'User not logged in.' };
    try {
      await apiFetch<{ success: true }>(API_ENDPOINTS.auth.verifyCurrentPassword, {
        method: 'POST',
        body: JSON.stringify({ currentPassword: currentPass }),
      });
      return { success: true, message: '' };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Current password is incorrect.';
      return { success: false, message };
    }
  };

  const changePassword = async (
    currentPass: string,
    newPass: string,
    otpToken?: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'User not logged in.' };
    if (!otpToken) {
      return {
        success: false,
        message: 'Verification required. Request an OTP and try again.',
      };
    }
    try {
      await apiFetch(API_ENDPOINTS.auth.changePassword, {
        method: 'POST',
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
        headers: { 'X-OTP-Verification': otpToken },
      });
      return { success: true, message: 'Password updated successfully!' };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to change password.';
      return { success: false, message };
    }
  };

  // ─── PRODUCER PROFILE ────────────────────────────────────────────────────────

  const updateProducerProfile = async (updatedProducer: ProducerProfile, otpToken?: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = {};
      if (otpToken) headers['X-OTP-Verification'] = otpToken;
      const saved = await apiFetch<any>(API_ENDPOINTS.producers.update(updatedProducer.id), {
        method: 'PUT',
        body: JSON.stringify(updatedProducer),
        headers,
      });
      setProducers(prev =>
        prev.map((p) => {
          if (p.id !== saved.id) return p;
          const displayName =
            (saved as any).user?.displayName ??
            `${String((saved as any).firstName ?? '').trim()} ${String((saved as any).lastName ?? '').trim()}`.trim();
          return {
            ...p,
            ...saved,
            name: displayName || p.name || 'Unknown',
            locations: Array.isArray(saved.locations)
              ? saved.locations.map(normalizeLocationFromApi)
              : p.locations,
            preferredHomeDelivery:
              normalizePreferredHomeFromApi((saved as any).preferredHomeDelivery) ??
              p.preferredHomeDelivery,
            user: saved.user ?? (p as any).user,
          };
        }),
      );
      if (saved?.user && user && user.id === saved.user.id) {
        const nextUser: UserSession = {
          ...user,
          email: saved.user.email ?? user.email,
          phone: saved.user.phone ?? user.phone,
          displayName: saved.user.displayName ?? user.displayName,
          name: saved.user.displayName ?? user.name,
          profileImageUrl: saved.user.profileImageUrl ?? user.profileImageUrl,
        };
        setUser(nextUser);
        useSessionStore.getState().setUser(nextUser);
        localStorage.setItem('currentUser', JSON.stringify(nextUser));
      }
      bustCache(QK.producers());
      if (user) addNotification(user.id, 'Profile updated', 'SUCCESS');
      return true;
    } catch (error) {
      logApiFailure('Failed to update producer profile', error);
      if (user) addNotification(user.id, 'Failed to save changes.', 'ERROR');
      return false;
    }
  };

  const requestOtp = async (action: 'PROFILE_UPDATE' | 'WITHDRAWAL' | 'PASSWORD_CHANGE') => {
    const res = await apiFetch<{ success: boolean; message: string }>(API_ENDPOINTS.otp.request, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    return res;
  };

  const verifyOtp = async (action: 'PROFILE_UPDATE' | 'WITHDRAWAL' | 'PASSWORD_CHANGE', code: string) => {
    const res = await apiFetch<{ success: boolean; token?: string; message: string }>(API_ENDPOINTS.otp.verify, {
      method: 'POST',
      body: JSON.stringify({ action, code }),
    });
    return res;
  };

  const updateProducerAvailability = async (producerId: string, schedule: WeeklySchedule, exceptions: AvailabilityException[]) => {
    try {
      await apiFetch(API_ENDPOINTS.producers.availability(producerId), {
        method: 'PUT',
        body: JSON.stringify({ schedule, exceptions }),
      });
      setProducers(prev => prev.map(p => p.id === producerId ? { ...p, availability: schedule, exceptions } : p));
      bustCache(QK.producers());
      if (user) addNotification(user.id, 'Availability updated', 'SUCCESS');
    } catch (error) {
      logApiFailure('Failed to update availability', error);
    }
  };

  const validateProducer = async (id: string, status: ProducerStatus) => {
    try {
      await apiFetch(API_ENDPOINTS.producers.validate(id), {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setProducers(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      bustCache(QK.producers());
    } catch (error) {
      logApiFailure('Failed to validate producer', error);
    }
  };

  const upgradeClientToProducer = async (clientId: string, producerDetails: Partial<ProducerProfile>): Promise<boolean> => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !user) return false;
    try {
      const upgraded = await apiFetch<{ producerId: string; accessToken: string; refreshToken: string }>(
        API_ENDPOINTS.profiles.upgradeToProducer,
        {
          method: 'POST',
          body: JSON.stringify({
            type: producerDetails.type || 'INDIVIDUAL',
            name: producerDetails.name || client.name,
            description: producerDetails.description || '',
            productionTypes: producerDetails.productionTypes || [],
          }),
        },
      );

      if (upgraded?.accessToken) setToken(upgraded.accessToken);
      if (upgraded?.refreshToken) setRefreshToken(upgraded.refreshToken);

      const nextUser: UserSession = {
        ...user,
        role: UserRole.PRODUCER,
        producerId: upgraded.producerId,
      };
      setUser(nextUser);
      useSessionStore.getState().setUser(nextUser);
      localStorage.setItem('currentUser', JSON.stringify(nextUser));
      await fetchData(nextUser);
      return true;
    } catch (error) {
      logApiFailure('Failed to upgrade client to producer', error);
      return false;
    }
  };

  const saveProducerPaymentMethod = (producerId: string, method: PaymentMethod) => {
    setProducers(prev => prev.map(p => p.id === producerId ? { ...p, paymentMethods: p.paymentMethods.some(pm => pm.id === method.id) ? p.paymentMethods.map(pm => pm.id === method.id ? method : pm) : [...p.paymentMethods, method] } : p));
    bustCache(QK.producers());
  };

  const deleteProducerPaymentMethod = (producerId: string, methodId: string) => {
    setProducers(prev => prev.map(p => p.id === producerId ? { ...p, paymentMethods: p.paymentMethods.filter(pm => pm.id !== methodId) } : p));
    bustCache(QK.producers());
  };

  // ─── CLIENT PROFILE ──────────────────────────────────────────────────────────

  const updateClientProfile = async (updatedClient: ClientProfile): Promise<boolean> => {
    try {
      // Always send `locations` as JSON (Prisma update replaces rows); omitting it skips server-side location sync.
      const locations = Array.isArray(updatedClient.locations)
        ? updatedClient.locations.map((loc) => ({
            lat: Number(loc.lat) || 0,
            lng: Number(loc.lng) || 0,
            region: String(loc.region ?? ''),
            city: String(loc.city ?? ''),
            address: String(loc.address ?? ''),
          }))
        : [];
      const payload = { ...updatedClient, locations };
      const saved = await apiFetch<any>(API_ENDPOINTS.clients.update(updatedClient.id), {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== saved.id) return c;
          const displayName =
            (saved as any).user?.displayName ??
            `${String((saved as any).firstName ?? '').trim()} ${String((saved as any).lastName ?? '').trim()}`.trim();
          return {
            ...c,
            ...saved,
            name: displayName || c.name || 'Unknown',
            locations: Array.isArray(saved.locations)
              ? saved.locations.map(normalizeLocationFromApi)
              : c.locations,
            preferredHomeDelivery:
              normalizePreferredHomeFromApi((saved as any).preferredHomeDelivery) ??
              c.preferredHomeDelivery,
            user: saved.user ?? (c as any).user,
          };
        }),
      );
      if (saved?.user && user && user.id === saved.user.id) {
        const nextUser: UserSession = {
          ...user,
          email: saved.user.email ?? user.email,
          phone: saved.user.phone ?? user.phone,
          displayName: saved.user.displayName ?? user.displayName,
          name: saved.user.displayName ?? user.name,
          profileImageUrl: saved.user.profileImageUrl ?? user.profileImageUrl,
        };
        setUser(nextUser);
        useSessionStore.getState().setUser(nextUser);
        localStorage.setItem('currentUser', JSON.stringify(nextUser));
      }
      bustCache(QK.clients());
      if (user) addNotification(user.id, 'Profile updated', 'SUCCESS');
      return true;
    } catch (error) {
      logApiFailure('Failed to update client profile', error);
      if (user) addNotification(user.id, 'Failed to save changes.', 'ERROR');
      return false;
    }
  };

  // ─── OFFERS ──────────────────────────────────────────────────────────────────

  const createOffer = async (offerData: any): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProducerDashboardUser(user) || !user.producerId) {
      return { success: false, error: 'You must be signed in as a producer to publish an offer.' };
    }
    const myProducer = findProducerForUser(producers, user);
    if (myProducer?.status === 'PENDING') {
      return {
        success: false,
        error:
          'Your producer account is pending approval. Complete verification in your profile before publishing offers.',
      };
    }
    try {
      const payload = {
        title: offerData.title,
        description: offerData.description,
        category: offerData.category,
        type: offerData.type,
        marketType: offerData.marketType,
        unit: offerData.unit,
        quantity: offerData.quantity,
        price: offerData.price,
        imageUrl: offerData.imageUrl,
        imageUrls: offerData.imageUrls ?? [],
        isNegotiable: offerData.isNegotiable,
        isDeliveryAvailable: offerData.isDeliveryAvailable,
        offerLocation: offerData.offerLocation,
        minQuantity: offerData.minQuantity,
        maxQuantity: offerData.maxQuantity,
        serviceDuration: offerData.serviceDuration ?? 0,
        reservedClientId: offerData.reservedClientId,
      };
      const newOffer = await apiFetch<Offer>(API_ENDPOINTS.offers.create, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setOffers(prev => [...prev, newOffer]);
      bustCache(QK.offers());
      addNotification(user.id, 'Offer created successfully.', 'SUCCESS');
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create offer.';
      logApiFailure('Failed to create offer:', err);
      addNotification(user.id, message, 'ERROR');
      return { success: false, error: message };
    }
  };

  const updateOffer = async (updatedOffer: Offer): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = {
        title: updatedOffer.title,
        description: updatedOffer.description,
        category: updatedOffer.category,
        type: updatedOffer.type,
        marketType: updatedOffer.marketType,
        unit: updatedOffer.unit,
        quantity: updatedOffer.quantity,
        price: updatedOffer.price,
        imageUrl: updatedOffer.imageUrl,
        imageUrls: updatedOffer.imageUrls ?? [],
        isNegotiable: updatedOffer.isNegotiable,
        isDeliveryAvailable: updatedOffer.isDeliveryAvailable,
        offerLocation: updatedOffer.offerLocation,
        minQuantity: updatedOffer.minQuantity,
        maxQuantity: updatedOffer.maxQuantity,
        serviceDuration: updatedOffer.serviceDuration ?? 0,
        reservedClientId: updatedOffer.reservedClientId,
      };
      const saved = await apiFetch<Offer>(API_ENDPOINTS.offers.update(updatedOffer.id), {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setOffers(prev => prev.map(o => o.id === saved.id ? saved : o));
      bustCache(QK.offers());
      if (user) addNotification(user.id, 'Offer updated successfully.', 'SUCCESS');
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update offer.';
      logApiFailure('Failed to update offer', error);
      if (user) addNotification(user.id, message, 'ERROR');
      return { success: false, error: message };
    }
  };

  // const deleteOffer = async (offerId: string): Promise<{ success: boolean; error?: string }> => {
  //   try {
  //     await apiFetch(API_ENDPOINTS.offers.remove(offerId), { method: 'DELETE' });
  //     setOffers(prev => prev.filter(o => o.id !== offerId));
  //     if (user) addNotification(user.id, 'Offer deleted successfully.', 'SUCCESS');
  //     return { success: true };
  //   } catch (error: unknown) {
  //     const message = error instanceof Error ? error.message : 'Failed to delete offer.';
  //     logApiFailure('Failed to delete offer', error);
  //     if (user) addNotification(user.id, message, 'ERROR');
  //     return { success: false, error: message };
  //   }
  // };

  const deleteOffer = async (offerId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiFetch(API_ENDPOINTS.offers.remove(offerId), {
        method: 'DELETE',
      });
      setOffers(prev => prev.filter(o => o.id !== offerId));
      bustCache(QK.offers());
      if (user) addNotification(user.id, 'Offer deleted successfully.', 'SUCCESS');
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete offer.';
      logApiFailure('Failed to delete offer', error);
      if (user) addNotification(user.id, message, 'ERROR');
      return { success: false, error: message };
    }
  };

  const getProducerOffers = (producerId: string) => offers.filter(o => o.producerId === producerId);
  const getOfferById = (id: string) => offers.find(o => o.id === id);

  // ─── CART ────────────────────────────────────────────────────────────────────

  const addToCart = (offer: Offer, quantity: number, bookingDate?: string): { success: boolean; error?: 'PRODUCER_CONFLICT' | 'OWN_OFFER' | 'DUPLICATE_SERVICE_SLOT' } => {
    if (user && isProducerDashboardUser(user) && user.producerId && offer.producerId === user.producerId) {
      return { success: false, error: 'OWN_OFFER' };
    }
    const cartIsRetail = cart.length > 0 && cart.every((i) => i.marketType === MarketType.ATI);
    const offerIsRetail = offer.marketType === MarketType.ATI;
    if (cart.length > 0 && cartIsRetail && offerIsRetail) {
      // ATI retail store: allow multiple products in one cart regardless of producer profile id.
    } else if (cart.length > 0 && cart[0].producerId !== offer.producerId) {
      return { success: false, error: 'PRODUCER_CONFLICT' };
    }
    if (offer.type === OfferType.SERVICE && bookingDate) {
      const alreadyInCart = cart.some(
        (i) =>
          i.type === OfferType.SERVICE &&
          i.producerId === offer.producerId &&
          i.id === offer.id &&
          i.bookingDate === bookingDate,
      );
      if (alreadyInCart) return { success: false, error: 'DUPLICATE_SERVICE_SLOT' };
      const alreadyBookedInOrders = orders.some(
        (o) =>
          o.clientId === user?.clientId &&
          o.producerId === offer.producerId &&
          o.status !== OrderStatus.CANCELLED &&
          (o.items || []).some(
            (item) =>
              item.type === OfferType.SERVICE &&
              item.id === offer.id &&
              !!item.bookingDate &&
              new Date(item.bookingDate).toISOString() === new Date(bookingDate).toISOString(),
          ),
      );
      if (alreadyBookedInOrders) return { success: false, error: 'DUPLICATE_SERVICE_SLOT' };
    }
    setCart(prev => {
      if (offer.type === OfferType.SERVICE && bookingDate) return [...prev, { ...offer, cartQuantity: quantity, bookingDate }];
      const exists = prev.find(i => i.id === offer.id);
      return exists ? prev.map(i => i.id === offer.id ? { ...i, cartQuantity: i.cartQuantity + quantity } : i) : [...prev, { ...offer, cartQuantity: quantity }];
    });
    if (user?.id) bustCache(QK.cart(user.id));
    return { success: true };
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
    if (user?.id) bustCache(QK.cart(user.id));
  };
  const clearCart = () => {
    setCart([]);
    if (user?.id) bustCache(QK.cart(user.id));
    if (user && getToken()) {
      apiFetch(API_ENDPOINTS.cart.clear, {
        method: 'DELETE',
        silent401: true,
      } as any).catch(() => {});
    }
  };

  // ─── ORDERS ──────────────────────────────────────────────────────────────────

  const placeOrder = async (couponId?: string, _discountAmount: number = 0, deliveryDate?: string, deliveryMethod: 'HOME' | 'PICKUP' = 'HOME', pickupPointId?: string, homeDeliveryLocationId?: string, homeShippingSnapshot?: PreferredHomeDeliverySnapshot | null): Promise<boolean> => {
    if (cart.length === 0 || (!user && !guestEmail)) return false;

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
      homeDeliveryLocationId:
        deliveryMethod === 'HOME' && homeDeliveryLocationId ? homeDeliveryLocationId : undefined,
      shippingAddress:
        deliveryMethod === 'HOME' &&
        homeShippingSnapshot &&
        String(homeShippingSnapshot.address ?? '').trim()
          ? {
              address: String(homeShippingSnapshot.address).trim(),
              city: String(homeShippingSnapshot.city ?? '').trim(),
              region: String(homeShippingSnapshot.region ?? '').trim(),
              lat: homeShippingSnapshot.lat,
              lng: homeShippingSnapshot.lng,
            }
          : undefined,
    };

    try {
      const saved = await apiFetch<Order>(API_ENDPOINTS.orders.create, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      // Append the saved order immediately for optimistic UI
      setOrders(prev => [...prev, mapOrderRow(saved)]);
      bustCache(['orders']);
      bustCache(['offers']);
      if (user?.id) bustCache(QK.cart(user.id));
      if (user) addNotification(user.id, `Order #${saved.id.substring(saved.id.length - 6).toUpperCase()} placed!`, 'SUCCESS');
      if (isProducerDashboardUser(user) && saved?.clientId) {
        setUser(prev => {
          if (!prev) return prev;
          const next = { ...prev, clientId: saved.clientId };
          localStorage.setItem('currentUser', JSON.stringify(next));
          return next;
        });
      }
      debouncedLightFetch();
      clearCart();
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
      logApiFailure('Failed to place order:', error);
      if (user) addNotification(user.id, message, 'ERROR');
      return false;
    }
  };

  const confirmOrder = async (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || !user) return;
    if (!isProducerDashboardUser(user) || targetOrder.producerId !== user.producerId) {
      addNotification(user.id, 'You can only confirm orders assigned to your producer profile.', 'ERROR');
      return;
    }
    try {
      await apiFetch(API_ENDPOINTS.orders.confirm(orderId), { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CONFIRMED_AWAITING_PAYMENT } : o));
      bustCache(['orders']);
      addNotification(user.id, `Order #${targetOrder.id.substring(targetOrder.id.length - 6).toUpperCase()} confirmed.`, 'SUCCESS');
    } catch (error) {
      logApiFailure('Failed to confirm order', error);
    }
  };

  const rejectOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.status === OrderStatus.PAID_IN_PREPARATION || order.status === OrderStatus.IN_TRANSIT) {
      addNotification(user!.id, 'Cannot cancel paid order. Contact support.', 'ERROR'); return;
    }
    try {
      await apiFetch(API_ENDPOINTS.orders.reject(orderId), { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o));
      bustCache(['orders']);
      addNotification(user!.id, `Order #${orderId.substring(orderId.length - 6).toUpperCase()} cancelled by producer.`, 'WARNING');
    } catch (error) {
      logApiFailure('Failed to reject order', error);
    }
  };

  const cancelOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if ([OrderStatus.PAID_IN_PREPARATION, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED].includes(order.status)) {
      addNotification(user!.id, 'Cannot cancel paid order. Contact support.', 'ERROR'); return;
    }
    try {
      await apiFetch(API_ENDPOINTS.orders.cancel(orderId), { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o));
      bustCache(['orders']);
      addNotification(user!.id, `Order #${orderId.substring(orderId.length - 6).toUpperCase()} cancelled.`, 'WARNING');
    } catch (error) {
      logApiFailure('Failed to cancel order', error);
    }
  };

  const payForOrder = async (orderId: string): Promise<{ success: boolean; error?: 'INSUFFICIENT_FUNDS' }> => {
    if (!user) return { success: false };
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false };
    try {
      const result = await apiFetch<{ success: boolean; error?: string; wallet?: Wallet }>(API_ENDPOINTS.orders.pay(orderId), { method: 'POST' });
      if (!result.success) return { success: false, error: result.error === 'INSUFFICIENT_FUNDS' ? 'INSUFFICIENT_FUNDS' : undefined };
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.PAID_IN_PREPARATION } : o));
      if (result.wallet) setWallets(prev => ({ ...prev, [user.id]: result.wallet! }));
      bustCache(['orders']);
      bustCache(QK.wallet(user.id));
      addNotification(user.id, 'Payment successful!', 'SUCCESS');
      return { success: true };
    } catch (error) {
      logApiFailure('Payment failed', error);
      return { success: false };
    }
  };

  const startDelivery = async (id: string) => {
    try {
      await apiFetch(API_ENDPOINTS.orders.deliver(id), { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: OrderStatus.IN_TRANSIT } : o));
      bustCache(['orders']);
      if (user) addNotification(user.id, 'Order marked as in transit.', 'INFO');
    } catch (error) {
      logApiFailure('Failed to start delivery', error);
    }
  };

  /**
   * Producer/seller finalizes delivery. Only succeeds once the buyer has confirmed
   * receipt (enforced server-side via the two-step delivery handshake).
   */
  const markOrderDelivered = async (id: string) => {
    try {
      await apiFetch(API_ENDPOINTS.orders.markDelivered(id), { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: OrderStatus.DELIVERED } : o));
      bustCache(['orders']);
      if (user) addNotification(user.id, 'Order marked as delivered.', 'SUCCESS');
    } catch (error) {
      logApiFailure('Failed to mark order as delivered', error);
      if (user) addNotification(user.id, 'The customer must confirm receipt before you can mark this order as delivered.', 'ERROR');
    }
  };

  /**
   * Buyer confirms they received the order (first step of the delivery handshake).
   * Status stays IN_TRANSIT until the seller finalizes delivery.
   */
  const confirmReceipt = async (id: string) => {
    try {
      await apiFetch(API_ENDPOINTS.orders.confirmReceipt(id), { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, clientConfirmedReceipt: true } : o));
      bustCache(['orders']);
      if (user) {
        addNotification(user.id, 'Receipt confirmed. Waiting for the seller to finalize delivery.', 'SUCCESS');
      }
    } catch (error) {
      logApiFailure('Failed to confirm receipt', error);
    }
  };

  /**
   * Buyer confirms receipt and closes the order (DELIVERED → COMPLETED). This is
   * the buyer's final step and starts the escrow-release window for the seller.
   */
  const completeOrder = async (id: string) => {
    try {
      await apiFetch(API_ENDPOINTS.orders.complete(id), { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: OrderStatus.COMPLETED, clientConfirmedReceipt: true } : o));
      bustCache(['orders']);
      if (user) addNotification(user.id, 'Order completed. Thank you!', 'SUCCESS');
    } catch (error) {
      logApiFailure('Failed to complete order', error);
      if (user) addNotification(user.id, 'Could not complete the order. Please try again.', 'ERROR');
    }
  };

  /** Buyer requests cancellation of a paid, non-in-transit order (admin approves). */
  const requestOrderCancellation = async (orderId: string, reason?: string) => {
    try {
      await apiFetch(API_ENDPOINTS.orders.requestCancellation(orderId), {
        method: 'PATCH',
        body: JSON.stringify({ reason: reason ?? '' }),
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, cancellationRequested: true, cancellationReason: reason ?? '' } : o));
      bustCache(['orders']);
      if (user) addNotification(user.id, 'Cancellation requested. An administrator will review it shortly.', 'WARNING');
    } catch (error) {
      logApiFailure('Failed to request cancellation', error);
      if (user) addNotification(user.id, 'Could not request cancellation. Please try again.', 'ERROR');
    }
  };

  /** Buyer reschedules the appointment date of a SERVICE booking before fulfilment. */
  const updateAppointment = async (orderId: string, bookingDate: string): Promise<boolean> => {
    try {
      await apiFetch(API_ENDPOINTS.orders.appointment(orderId), {
        method: 'PATCH',
        body: JSON.stringify({ bookingDate }),
      });
      setOrders(prev => prev.map(o => o.id === orderId
        ? { ...o, requestedDeliveryDate: bookingDate, items: (o.items || []).map((it: any) => (String(it.type ?? '').toUpperCase() === 'SERVICE' ? { ...it, bookingDate } : it)) }
        : o));
      bustCache(['orders']);
      if (user) addNotification(user.id, 'Appointment updated.', 'SUCCESS');
      return true;
    } catch (error) {
      logApiFailure('Failed to update appointment', error);
      if (user) addNotification(user.id, 'Could not update the appointment. Please try again.', 'ERROR');
      return false;
    }
  };

  const reportProblem = async (orderId: string, reason: string, files: File[]) => {
    const formData = new FormData();
    formData.append('reason', reason);
    files.forEach(f => formData.append('files', f));
    let evidence: DisputeEvidence[] = [];
    try {
      const result = await apiUpload<DisputeEvidence[] | { evidence: DisputeEvidence[] }>(API_ENDPOINTS.orders.dispute(orderId), formData);
      evidence = Array.isArray(result) ? result : (result?.evidence ?? []);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.DISPUTE, disputeReason: reason, disputeEvidence: evidence } : o));
      bustCache(['orders']);
      if (user) addNotification(user.id, 'Dispute opened.', 'WARNING');
    } catch (error) {
      logApiFailure('Failed to report problem', error);
      addNotification(user!.id, 'Failed to report problem. Please try again.', 'ERROR');
    }
  };

  const addDisputeEvidence = (orderId: string, files: File[]) => {
    if (!user) return;
    const newEvidence: DisputeEvidence[] = files.map(f => ({ id: `ev-${Date.now()}-${Math.random()}`, uploaderId: user.id, fileName: f.name, fileUrl: URL.createObjectURL(f), fileType: f.type.includes('image') ? 'IMAGE' as const : 'DOCUMENT' as const, uploadedAt: new Date().toISOString() }));
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, disputeEvidence: [...(o.disputeEvidence || []), ...newEvidence] } : o));
    addNotification(user.id, 'Evidence uploaded successfully', 'SUCCESS');
  };

  const revealContactInfo = async (id: string) => {
    const u = userRef.current;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, contactRevealed: true } : o)),
    );
    try {
      await apiFetch(API_ENDPOINTS.orders.revealContact(id), { method: 'PATCH' });
      if (u) {
        const ordersCacheOwner = producerAccountUserId(u) || u.id;
        bustCache(QK.orders(ordersCacheOwner, u.role, u.clientId));
      }
    } catch (e) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, contactRevealed: false } : o)),
      );
      logApiFailure('Failed to reveal contact info', e);
      if (u?.id) {
        addNotification(u.id, 'Could not reveal contact info. Please try again.', 'ERROR');
      }
    }
  };

  // ─── REVIEWS ─────────────────────────────────────────────────────────────────

  const submitReview = async (data: Omit<Review, 'id' | 'createdAt'>) => {
    try {
      const savedRaw = await apiFetch<any>(API_ENDPOINTS.reviews.create, {
        method: 'POST',
        body: JSON.stringify({
          orderId: data.orderId,
          rating: data.rating,
          comment: data.comment ?? '',
        }),
      });
      const saved = mapReviewFromApi(savedRaw);
      setReviews(prev => [...prev, saved]);
      // Hide the review CTA immediately. Attribute the review by the session user's
      // role on THIS order: if they are the producer side, it's a producer review,
      // otherwise it's the client's review. This does not rely on the (possibly
      // incomplete) client catalog, so the button always disappears after rating.
      setOrders(prev =>
        prev.map((o) => {
          if (o.id !== saved.orderId) return o;
          const orderProducer = producers.find((p) => p.id === o.producerId);
          const sessionIsProducer = !!orderProducer && orderProducer.userId === user?.id;
          return sessionIsProducer
            ? { ...o, producerReviewed: true }
            : { ...o, clientReviewed: true };
        }),
      );
      bustCache(['reviews']);
      bustCache(['orders']);
    } catch (error) {
      logApiFailure('Failed to submit review', error);
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
      const result = await apiFetch<{ success: boolean; message: string; wallet: Wallet }>(API_ENDPOINTS.wallet.fund, {
        method: 'POST',
        body: JSON.stringify({ amount, provider, referenceId: refId }),
      });
      const walletKey = producerAccountUserId(user);
      if (result.wallet) {
        setWallets((prev) => ({ ...prev, [walletKey]: result.wallet, [user.id]: result.wallet }));
      }
      bustCache(QK.wallet(walletKey));
      return { success: result.success, message: result.message };
    } catch (error: any) {
      logApiFailure('Failed to fund wallet', error);
      return { success: false, message: error.message || 'Funding failed' };
    }
  };

  const requestWithdrawal = async (amount: number, method: PaymentMethod, otpToken?: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'No user' };
    try {
      const headers: Record<string, string> = {};
      if (otpToken) headers['X-OTP-Verification'] = otpToken;
      const result = await apiFetch<{ success: boolean; message: string }>(API_ENDPOINTS.wallet.withdraw, {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethodId: method.id }),
        headers,
      });
      try {
        const rows = await apiFetch<any[]>(API_ENDPOINTS.wallet.myWithdrawals, { silent401: true } as any);
        if (Array.isArray(rows)) setWithdrawalRequests(rows.map(mapWithdrawalFromApi));
      } catch {
        setWithdrawalRequests([]);
      }
      bustCache(QK.wallet(user.id));
      bustCache(QK.withdrawals(user.id));
      return { success: result.success, message: result.message };
    } catch (error: any) {
      logApiFailure('Failed to request withdrawal', error);
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
      const saved = await apiFetch<Portfolio>(API_ENDPOINTS.portfolios.create, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setPortfolios(prev => [...prev, saved]);
      bustCache(['portfolios']);
    } catch (error) {
      logApiFailure('Failed to add portfolio', error);
    }
  };

  const updatePortfolio = async (updated: Portfolio) => {
    try {
      const saved = await apiFetch<Portfolio>(API_ENDPOINTS.portfolios.update(updated.id), {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      setPortfolios(prev => prev.map(p => p.id === saved.id ? saved : p));
      bustCache(['portfolios']);
    } catch (error) {
      logApiFailure('Failed to update portfolio', error);
    }
  };

  const deletePortfolio = async (id: string) => {
    try {
      await apiFetch(API_ENDPOINTS.portfolios.remove(id), { method: 'DELETE' });
      setPortfolios(prev => prev.filter(p => p.id !== id));
      bustCache(['portfolios']);
    } catch (error) {
      logApiFailure('Failed to delete portfolio', error);
    }
  };

  // ─── AVAILABILITY ─────────────────────────────────────────────────────────────

  const getAvailableSlots = (producerId: string, date: Date, durationHours: number): Date[] => {
    const producer = producers.find(p => p.id === producerId);
    if (!producer) return [];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    let schedule = producer.availability?.[dayName];
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const normalizeExceptionDate = (raw: string): string => {
      if (!raw) return '';
      const trimmed = String(raw).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const ddmmyyyy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (ddmmyyyy) {
        const [, dd, mm, yyyy] = ddmmyyyy;
        return `${yyyy}-${mm}-${dd}`;
      }
      const dt = new Date(trimmed);
      if (!Number.isFinite(dt.getTime())) return '';
      const yy = dt.getFullYear();
      const mo = String(dt.getMonth() + 1).padStart(2, '0');
      const da = String(dt.getDate()).padStart(2, '0');
      return `${yy}-${mo}-${da}`;
    };
    const isBlocked = producer.exceptions?.some(ex => normalizeExceptionDate(ex.date) === dateStr);
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
    } else if (isProducerDashboardUser(user) && user.producerId) {
      setProducers(prev => prev.map(p => p.id === user.producerId ? { ...p, searchHistory: [term, ...(p.searchHistory || [])].slice(0, 20) } : p));
    }
  };

  const getRecommendedOffers = (): Offer[] => {
    if (!user) return [];
    let history: string[] = [];
    if (user.role === UserRole.CLIENT) {
      const client = clients.find(c => clientProfileMatchesSession(c, user));
      history = client?.searchHistory || [];
    } else if (isProducerDashboardUser(user) && user.producerId) {
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
      const client = clients.find(c => clientProfileMatchesSession(c, user));
      if (!client) return;
      const previousFavorites = [...(client.favorites || [])];
      const nextFavorites = previousFavorites.includes(offerId)
        ? previousFavorites.filter(id => id !== offerId)
        : [...previousFavorites, offerId];
      const added = !previousFavorites.includes(offerId);

      setClients(prev => prev.map(c => c.id === client.id ? { ...c, favorites: nextFavorites } : c));

      void (async () => {
        try {
          await apiFetch(API_ENDPOINTS.clients.update(client.id), {
            method: 'PUT',
            body: JSON.stringify({ favorites: nextFavorites }),
          });
          addNotification(user.id, added ? 'Added to favorites.' : 'Removed from favorites.', 'SUCCESS');
        } catch (error) {
          setClients(prev => prev.map(c => c.id === client.id ? { ...c, favorites: previousFavorites } : c));
          addNotification(user.id, 'Failed to update favorites. Please try again.', 'ERROR');
          logApiFailure('Failed to persist client favorites:', error);
        }
      })();
      return;
    }

    if (isProducerDashboardUser(user) && user.producerId) {
      const producer = producers.find(p => p.id === user.producerId);
      if (!producer) return;
      const previousFavorites = [...(producer.favorites || [])];
      const nextFavorites = previousFavorites.includes(offerId)
        ? previousFavorites.filter(id => id !== offerId)
        : [...previousFavorites, offerId];
      const added = !previousFavorites.includes(offerId);

      setProducers(prev => prev.map(p => p.id === producer.id ? { ...p, favorites: nextFavorites } : p));

      void (async () => {
        try {
          await apiFetch(API_ENDPOINTS.producers.update(producer.id), {
            method: 'PUT',
            body: JSON.stringify({ favorites: nextFavorites }),
          });
          addNotification(user.id, added ? 'Added to favorites.' : 'Removed from favorites.', 'SUCCESS');
        } catch (error) {
          setProducers(prev => prev.map(p => p.id === producer.id ? { ...p, favorites: previousFavorites } : p));
          addNotification(user.id, 'Failed to update favorites. Please try again.', 'ERROR');
          logApiFailure('Failed to persist producer favorites:', error);
        }
      })();
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
    } else if (isProducerDashboardUser(user) && user.producerId) {
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
    if (compareList.length >= 3) {
      showAppToast('You can compare up to 3 products at a time.', 'WARNING');
      return;
    }
    setCompareList(prev => [...prev, offerId]);
  };

  const removeFromCompare = (offerId: string) => setCompareList(prev => prev.filter(id => id !== offerId));
  const clearCompare = () => setCompareList([]);

  // ─── SUPPORT CHAT ─────────────────────────────────────────────────────────────

  const syncSupportInbox = useCallback(async () => {
    if (!userRef.current || !getToken()) return;
    try {
      const sessions = await listUserSupportSessions();
      if (!sessions.length) return;
      const open = sessions
        .filter((s) => s.status !== 'CLOSED')
        .sort(
          (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
        );
      const active = open[0];
      if (!active?.sessionId) return;

      const agentReady =
        active.status === 'AGENT_ACTIVE' || active.status === 'WAITING_FOR_AGENT';

      // Always store the session ID so subsequent sends can reuse it.
      setSupportSessionId(active.sessionId);

      if (!agentReady) {
        // Session is back to AI_HANDLING — make sure the frontend is NOT stuck
        // in agent mode (e.g. after an admin resets the status).
        setIsHandedOver(false);
        return;
      }

      setIsHandedOver(true);

      const data = await getSupportMessages(active.sessionId);
      if (!Array.isArray(data) || data.length === 0) return;
      const backendMessages = data.map((msg) => mapDtoToSupportMessage(msg));
      setSupportMessages(backendMessages);
    } catch (e) {
      logApiFailure('Support inbox sync failed', e);
    }
  }, []);

  const openSupportChat = () => {
    setIsSupportChatOpen(true);
    if (!user && !guestEmail) {
      setShowGuestForm(true);
    }
    void syncSupportInbox();
  };

  const toggleSupportChat = () => {
    setIsSupportChatOpen((prev) => {
      const next = !prev;
      if (next) void syncSupportInbox();
      return next;
    });
    if (!isSupportChatOpen && !user && !guestEmail) {
      setShowGuestForm(true);
    }
  };

  useEffect(() => {
    if (user?.id) void syncSupportInbox();
  }, [user?.id, syncSupportInbox]);

  const submitGuestForm = (email: string, name: string) => {
    setGuestEmail(email);
    setGuestName(name);
    setShowGuestForm(false);
    setGuestEmailInput('');
    setGuestNameInput('');
  };

  const markSupportUserMessage = (
    tempId: string,
    patch: Partial<SupportMessage> | 'remove',
  ) => {
    setSupportMessages((prev) => {
      if (patch === 'remove') return prev.filter((m) => m.id !== tempId);
      return prev.map((m) => (m.id === tempId ? { ...m, ...patch } : m));
    });
  };

  const sendSupportMessage = async (text: string) => {
    if (supportChatSending) return;

    if (!user && !guestEmail) {
      setShowGuestForm(true);
      return;
    }

    const tempId = `u-${Date.now()}`;
    setSupportChatSending(true);
    setSupportMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender: 'USER',
        text,
        timestamp: new Date().toISOString(),
        status: 'SENDING',
      },
    ]);

    try {
      if (isHandedOver) {
        if (!supportSessionId) {
          markSupportUserMessage(tempId, 'remove');
          return;
        }
        try {
          if (user) {
            const res = await postUserSupportMessage(supportSessionId, text);
            if (res.message) {
              const mapped = mapDtoToSupportMessage(res.message);
              setSupportMessages((prev) =>
                prev.map((m) => (m.id === tempId ? { ...mapped, status: 'SENT' } : m)),
              );
            } else {
              markSupportUserMessage(tempId, { status: 'SENT' });
            }
          } else if (guestEmail) {
            const res = await postGuestSupportMessage(supportSessionId, text, guestEmail);
            if (res.message) {
              const mapped = mapDtoToSupportMessage(res.message);
              setSupportMessages((prev) =>
                prev.map((m) => (m.id === tempId ? { ...mapped, status: 'SENT' } : m)),
              );
            } else {
              markSupportUserMessage(tempId, { status: 'SENT' });
            }
          } else {
            markSupportUserMessage(tempId, 'remove');
          }
        } catch (e) {
          logApiFailure('Failed to send support message', e);
          markSupportUserMessage(tempId, { status: 'FAILED' });
          if (user) addNotification(user.id, 'Could not send message. Please try again.', 'ERROR');
        }
        return;
      }

      // Message is queued locally; AI wait is separate from "send" (see SupportChatWidget).
      markSupportUserMessage(tempId, { status: 'SENT' });
      setSupportChatSending(false);
      setSupportAiTyping(true);

      const res = await generateSupportResponse(
        text,
        supportSessionId ?? undefined,
        !user ? (guestEmail ?? undefined) : undefined,
        !user ? (guestName ?? undefined) : undefined,
      );

      if (res.sessionId && !supportSessionId) {
        setSupportSessionId(res.sessionId);
      }

      setSupportMessages((prev) => {
        // The backend emits a support:message WS event when it saves the AI reply —
        // this happens server-side BEFORE the HTTP response is sent back, so the WS
        // push can arrive first and already be in `prev`. Guard against that race.
        const alreadyDelivered = prev.some(
          (m) => m.sender === 'AI' && m.text === res.text,
        );
        if (alreadyDelivered) return prev;
        return [
          ...prev,
          { id: `a-${Date.now()}`, sender: 'AI', text: res.text, timestamp: new Date().toISOString() },
        ];
      });
      if (res.handover) {
        setIsHandedOver(true);
        setTimeout(
          () =>
            setSupportMessages((prev) => [
              ...prev,
              {
                id: `s-${Date.now()}`,
                sender: 'AGENT',
                text: 'Connecting you with a support agent…',
                timestamp: new Date().toISOString(),
              },
            ]),
          1000,
        );
      }
    } catch (e) {
      logApiFailure('Support AI chat failed', e);
      markSupportUserMessage(tempId, { status: 'FAILED' });
      setSupportMessages((prev) => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          sender: 'AI',
          text: 'Something went wrong. Please try again or ask for a human agent.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSupportAiTyping(false);
      setSupportChatSending(false);
    }
  };

  const retrySupportMessage = async (messageId: string) => {
    const failed = supportMessages.find(
      (m) => m.id === messageId && m.sender === 'USER' && m.status === 'FAILED',
    );
    if (!failed?.text.trim()) return;
    setSupportMessages((prev) => prev.filter((m) => m.id !== messageId));
    await sendSupportMessage(failed.text);
  };

  const returnToAiMode = async () => {
    if (returningToAi || !supportSessionId) return;
    setReturningToAi(true);
    try {
      const { returnSessionToAi } = await import('./supportSessionsApi');
      await returnSessionToAi(supportSessionId);
      setIsHandedOver(false);
      setSupportMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'AI',
          text: 'You\'ve been reconnected to AgriBot. How can I help you?',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      logApiFailure('Failed to return to AI mode', e);
    } finally {
      setReturningToAi(false);
    }
  };

  // Polling for guest support messages when handed over to agent
  useEffect(() => {
    if (!isSupportChatOpen || !isHandedOver || user || !supportSessionId || !guestEmail) return;

    const pollInterval = setInterval(async () => {
      try {
        const data = await getGuestSupportMessages(supportSessionId, guestEmail);
        if (data && Array.isArray(data)) {
          const backendMessages = data.map((msg: any) =>
            mapDtoToSupportMessage({
              id: msg.id,
              sender: msg.sender,
              text: msg.text,
              timestamp: msg.timestamp,
            })
          );
          setSupportMessages((prev) => mergeIncomingSupportMessages(prev, backendMessages));
        }
      } catch (err) {
        logApiFailure('Error polling support messages:', err);
      }
    }, 5000); // Poll every 5 seconds while chat is open

    return () => clearInterval(pollInterval);
  }, [isSupportChatOpen, isHandedOver, user, supportSessionId, guestEmail]);

  // Polling for authenticated users when handed over to agent.
  // Also re-syncs inbox every 15s to detect if an admin resets the session
  // back to AI_HANDLING (which should unlock Gemini for the user again).
  useEffect(() => {
    if (!isSupportChatOpen || !isHandedOver || !user || !supportSessionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const data = await getSupportMessages(supportSessionId);
        if (!Array.isArray(data)) return;
        const backendMessages = data.map((msg) => mapDtoToSupportMessage(msg));
        setSupportMessages((prev) => mergeIncomingSupportMessages(prev, backendMessages));
      } catch (err) {
        logApiFailure('Error polling support messages (auth):', err);
      }
    }, 5000);

    // Periodically re-sync session status so the frontend can exit agent mode
    // if an admin resets the session back to AI_HANDLING.
    const statusInterval = setInterval(() => void syncSupportInbox(), 15000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(statusInterval);
    };
  }, [isSupportChatOpen, isHandedOver, user, supportSessionId, syncSupportInbox]);

  // ─── CHAT & NEGOTIATION ───────────────────────────────────────────────────────

  const fetchChats = async () => {
    if (!user) return;
    try {
      const res = await apiFetch<any[]>(API_ENDPOINTS.chat.sessions, { silent401: true } as any);
      if (Array.isArray(res)) {
        const normalized = normalizeChatSessionsFromApi(res);
        setChats((prev) => mergeChatSessionsById(prev, normalized));
      }
    } catch (e) {
      logApiFailure('Failed to fetch chats:', e);
    }
  };

  const fetchMessages = async (chatId: string) => {
    if (!user) return;
    try {
      const res = await apiFetch<any[]>(API_ENDPOINTS.chat.sessionMessages(chatId), { silent401: true } as any);

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
        } : undefined,
        status: 'SENT',
      }));

      // Merge with reconciliation:
      // 1. Server messages overwrite by id (canonical truth).
      // 2. Any local optimistic bubble (status: 'SENDING') whose senderId/text/chatId
      //    matches an incoming server message within a 2-minute window is collapsed
      //    into the server record (carries the clientId across) so we don't render
      //    duplicates when the 3s poll races the POST response.
      // 3. Local 'SENDING' / 'FAILED' bubbles that have no server counterpart yet
      //    are preserved as-is.
      setMessages(prev => {
        const out = new Map<string, ChatMessage>();
        // First copy everything we already have keyed by id.
        for (const m of prev) out.set(m.id, m);
        // Then merge in server messages, collapsing optimistic matches.
        for (const server of mappedMessages) {
          // Try to find an optimistic local bubble that this server record represents.
          let optimisticKey: string | null = null;
          for (const [key, local] of out) {
            if (local.status !== 'SENDING') continue;
            if (local.chatId !== server.chatId) continue;
            if (local.senderId !== server.senderId) continue;
            if ((local.text || '') !== (server.text || '')) continue;
            const drift = Math.abs(new Date(local.createdAt).getTime() - new Date(server.createdAt).getTime());
            if (drift > 120_000) continue;
            optimisticKey = key;
            break;
          }
          if (optimisticKey) {
            const optimistic = out.get(optimisticKey)!;
            out.delete(optimisticKey);
            out.set(server.id, { ...server, clientId: optimistic.clientId });
          } else {
            out.set(server.id, server);
          }
        }
        return Array.from(out.values()).sort(
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
    } catch (e) {
      logApiFailure('Failed to fetch messages:', e);
    }
  };

  const startNegotiation = async (pid: string, oid: string) => {
    if (!user) return '';

    // First refresh chats from server to check for an existing session
    try {
      const freshChatsRaw = await apiFetch<any[]>(API_ENDPOINTS.chat.sessions, { silent401: true } as any);
      if (Array.isArray(freshChatsRaw)) {
        const freshChats = normalizeChatSessionsFromApi(freshChatsRaw);
        setChats((prev) => mergeChatSessionsById(prev, freshChats));
        const existing = freshChats.find((c: ChatSession) =>
          c.participantIds?.includes(user.id) && c.participantIds?.includes(pid) && c.offerId === oid
        );
        if (existing) {
          await fetchMessages(existing.id);
          return existing.id;
        }
      }
    } catch (_) {
      // Network error — fall through to check local cache
      const existing = chats.find(c => c.participantIds?.includes(user.id) && c.participantIds?.includes(pid) && c.offerId === oid);
      if (existing) {
        await fetchMessages(existing.id);
        return existing.id;
      }
    }

    try {
      const res = await apiFetch<any>(API_ENDPOINTS.chat.sessions, {
        method: 'POST',
        body: JSON.stringify({ participantIds: [pid], offerId: oid })
      });
      const normalized = normalizeChatSessionFromApi(res);
      setChats(prev => [...prev, normalized]);
      await fetchMessages(normalized.id);
      return normalized.id;
    } catch (e) {
      logApiFailure('Failed to create chat:', e);
      const id = `chat-${Date.now()}`;
      setChats(prev => [...prev, { id, participantIds: [user.id, pid], offerId: oid, lastMessage: 'Started', lastMessageAt: new Date().toISOString(), unreadCounts: {} }]);
      return id;
    }
  };

  const respondToProposal = async (chatId: string, msgId: string, action: 'ACCEPT' | 'REJECT' | 'COUNTER', price?: number, qty?: number, bookingDate?: string): Promise<boolean> => {
    if (!user) return false;

    if (action === 'COUNTER') {
      const original = messages.find(m => m.id === msgId);
      // Optimistically mark the countered proposal as SUPERSEDED so the round counter resets.
      // This prevents the 3-counter limit from freezing the button after accepting/rejecting
      // the full round when the previous proposals are still technically PENDING on the server.
      if (original?.proposal) {
        setMessages(prev => prev.map(m =>
          m.id === msgId && m.proposal
            ? { ...m, proposal: { ...m.proposal, status: ProposalStatus.SUPERSEDED } }
            : m,
        ));
      }
      return sendMessage(
        chatId,
        `Counter-offer: ${qty} units @ ${price?.toLocaleString()} XAF each`,
        {
          offerId: original?.proposal?.offerId,
          pricePerUnit: price,
          quantity: qty,
          status: ProposalStatus.PENDING
        }
      );
    }

    // Optimistic UI: resolve this proposal and void other pending ones for the same offer in this chat
    setMessages(prev => {
      const target = prev.find((m) => m.id === msgId);
      const offerId = target?.proposal?.offerId;
      const resolvedStatus =
        action === 'ACCEPT' ? ProposalStatus.ACCEPTED : ProposalStatus.REJECTED;
      return prev.map((m) => {
        if (m.id === msgId && m.proposal) {
          return { ...m, proposal: { ...m.proposal, status: resolvedStatus } };
        }
        if (
          offerId &&
          m.chatId === chatId &&
          m.proposal?.offerId === offerId &&
          m.proposal.status === ProposalStatus.PENDING &&
          m.id !== msgId
        ) {
          return { ...m, proposal: { ...m.proposal, status: ProposalStatus.SUPERSEDED } };
        }
        return m;
      });
    });

    try {
      const res = await apiFetch<{ message: any; order?: any }>(
        API_ENDPOINTS.chat.proposalAction(msgId),
        {
          method: 'PATCH',
          body: JSON.stringify({
            response: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
            ...(action === 'ACCEPT' && bookingDate ? { bookingDate } : {}),
          }),
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

      fetchMessages(chatId);
      return true;
    } catch (err: any) {
      logApiFailure('Failed to respond to proposal:', err);
      void fetchMessages(chatId);

      let errorMessage = err?.message || 'Failed to respond to proposal';
      if (errorMessage.toLowerCase().includes('profile')) {
        errorMessage = '❌ Unable to process proposal: One or both parties have incomplete profiles. Please complete your profile and try again.';
      } else if (errorMessage.toLowerCase().includes('order')) {
        errorMessage = '❌ Proposal accepted but failed to create order. Please contact support.';
      }

      addNotification(user.id, errorMessage, 'ERROR');
      return false;
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

  /**
   * Translate raw error from the chat POST into a friendly, actionable string.
   * Pulled out so `sendMessage` and `retryMessage` show identical wording.
   */
  const friendlyChatErrorMessage = (e: any): string => {
    let errorMessage = e?.message || 'Failed to send message';
    if (errorMessage.toLowerCase().includes('offer') && errorMessage.toLowerCase().includes('not negotiable')) {
      errorMessage = '❌ This offer is not open for negotiation.';
    } else if (errorMessage.toLowerCase().includes('offer') && errorMessage.toLowerCase().includes('not exist')) {
      errorMessage = '❌ The offer no longer exists.';
    } else if (errorMessage.toLowerCase().includes('exceed') && errorMessage.toLowerCase().includes('listing')) {
      errorMessage = '❌ Proposed price per unit cannot be higher than the listing price.';
    } else if (errorMessage.toLowerCase().includes('price') || errorMessage.toLowerCase().includes('quantity')) {
      errorMessage = '❌ Price per unit and quantity must be greater than 0.';
    } else if (e?.status === 400) {
      errorMessage = '❌ Invalid proposal. Please check your price and quantity values.';
    }
    return errorMessage;
  };

  /** Generate a stable, collision-resistant temporary id for an optimistic bubble. */
  const generateClientMessageId = () => {
    // Browsers without crypto.randomUUID still get a reasonably unique fallback.
    const rand = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return `tmp-${rand}`;
  };

  /**
   * Performs the actual POST for an already-inserted optimistic bubble. Used by
   * both first-time send and retry. The optimistic record must already be in
   * `messages` keyed by `clientId`.
   */
  const dispatchChatMessage = async (
    chatId: string,
    clientId: string,
    text: string,
    proposal?: any,
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      const body: any = { text };
      if (proposal) {
        body.proposalOfferId = proposal.offerId;
        body.proposalPricePerUnit = proposal.pricePerUnit;
        body.proposalQuantity = proposal.quantity;
      }

      const res = await apiFetch<any>(API_ENDPOINTS.chat.sessionMessages(chatId), {
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
          status: res.proposalStatus as ProposalStatus || ProposalStatus.PENDING,
        } : undefined,
        status: 'SENT',
        clientId,
      };

      // Swap the optimistic placeholder for the canonical server record.
      // Identify the optimistic by clientId (preferred) or by temp id (fallback).
      setMessages((prev) => {
        const next: ChatMessage[] = [];
        let swapped = false;
        for (const m of prev) {
          if (!swapped && (m.clientId === clientId || m.id === clientId)) {
            next.push(mappedMsg);
            swapped = true;
            continue;
          }
          // Avoid duplicate if the poll already inserted the server message under its real id.
          if (m.id === mappedMsg.id) continue;
          next.push(m);
        }
        if (!swapped) next.push(mappedMsg);
        return next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });

      setChats((prev) => prev.map((c) =>
        c.id === chatId ? { ...c, lastMessage: text, lastMessageAt: res.createdAt } : c,
      ));
      void fetchChats();
      return true;
    } catch (e: any) {
      logApiFailure('Failed to send message:', e);
      const errorMessage = friendlyChatErrorMessage(e);
      addNotification(user.id, errorMessage, 'ERROR');
      // Keep the bubble visible but flip it to FAILED so the user can retry.
      setMessages((prev) => prev.map((m) =>
        (m.clientId === clientId || m.id === clientId) ? { ...m, status: 'FAILED' } : m,
      ));
      return false;
    }
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

    // Insert the optimistic bubble synchronously so the UI shows the message
    // immediately ("WhatsApp"-style). It carries a temporary id we'll swap for
    // the server's id once the POST resolves.
    const clientId = generateClientMessageId();
    const optimistic: ChatMessage = {
      id: clientId,
      clientId,
      chatId,
      senderId: user.id,
      text,
      systemMessage: false,
      createdAt: new Date().toISOString(),
      status: 'SENDING',
      proposal: proposal
        ? {
            offerId: proposal.offerId,
            pricePerUnit: proposal.pricePerUnit,
            quantity: proposal.quantity,
            status: ProposalStatus.PENDING,
          }
        : undefined,
    };
    setMessages((prev) => [...prev, optimistic]);
    // Also nudge the sidebar preview so the conversation jumps to the top instantly.
    setChats((prev) => prev.map((c) =>
      c.id === chatId ? { ...c, lastMessage: text, lastMessageAt: optimistic.createdAt } : c,
    ));

    return dispatchChatMessage(chatId, clientId, text, proposal);
  };

  const retryMessage = async (clientId: string): Promise<boolean> => {
    if (!user) return false;
    // Look up the failed bubble; flip it back to SENDING and re-dispatch.
    let target: ChatMessage | undefined;
    setMessages((prev) => {
      const next = prev.map((m) => {
        if (m.clientId === clientId || m.id === clientId) {
          target = m;
          return { ...m, status: 'SENDING' as const, createdAt: new Date().toISOString() };
        }
        return m;
      });
      return next;
    });
    if (!target) return false;
    const proposalPayload = target.proposal
      ? {
          offerId: target.proposal.offerId,
          pricePerUnit: target.proposal.pricePerUnit,
          quantity: target.proposal.quantity,
        }
      : undefined;
    return dispatchChatMessage(target.chatId, clientId, target.text, proposalPayload);
  };
  const storeValue: StoreContextType = {
    user, pendingRegistration, guestEmail, setGuestEmail, producers, clients, offers, cart, orders, wallets, notifications, withdrawalRequests, reviews, portfolios, coupons, pickupPoints,
    chats,
    messages,
    typingByChatId,
    isSocketConnected,
    realtimeConnected,
    fetchChats,
    fetchMessages,
    startNegotiation,
    sendMessage, retryMessage, emitTyping, respondToProposal,
    login, logout, registerProducer, registerClient, verifyEmail, updateClientProfile, upgradeClientToProducer, validateProducer, updateProducerProfile, updateProducerAvailability, saveProducerPaymentMethod, deleteProducerPaymentMethod, requestOtp, verifyOtp, createOffer, updateOffer, deleteOffer, getProducerOffers, getOfferById,
    addToCart, removeFromCart, clearCart, placeOrder, confirmOrder, rejectOrder, cancelOrder, payForOrder, startDelivery, markOrderDelivered, confirmReceipt, completeOrder, requestOrderCancellation, updateAppointment, reportProblem, addDisputeEvidence, revealContactInfo,
    getWallet, fundWallet, requestWithdrawal, markNotificationsAsRead, markNotificationAsRead, deleteNotification, clearNotifications, getAvailableSlots, submitReview, getAverageRating,
    getProducerPortfolios, addPortfolio, updatePortfolio, deletePortfolio,
    trackUserSearch, toggleFavorite, moveToFavorites, getRecommendedOffers,
    compareList, addToCompare, removeFromCompare, clearCompare,
    supportMessages, isSupportChatOpen, supportAiTyping, supportChatSending, isHandedOver, returningToAi, returnToAiMode, toggleSupportChat, openSupportChat, syncSupportInbox, sendSupportMessage, retrySupportMessage, showGuestForm, setShowGuestForm, guestEmailInput, setGuestEmailInput, guestNameInput, setGuestNameInput, guestName, setGuestName, submitGuestForm, supportSessionId, setSupportSessionId,
    validateCoupon,
    addPickupPoint, deletePickupPoint,
    changePassword,
    verifyCurrentPassword,
    myReferrals,
    refreshMyReferrals,
    isInitialCatalogLoading,
    refreshOffers,
    refreshProducers,
    refreshClients,
    refreshAllReviews,
    refreshPickupPoints,
    refreshOrders,
    refreshWallet,
    refreshWithdrawals,
    refreshMyPortfolios,
    refreshMyReviews,
    refreshNotifications,
    refreshCart,
  };

  return <StoreContext.Provider value={storeValue}>{children}</StoreContext.Provider>;
};

// Hooks are declared as `function` (not `const` arrows) so Vite's React
// plugin reliably recognises them as hooks for Fast Refresh. Const-arrow
// exports next to a component force HMR invalidate -> module duplication ->
// "useStore must be used within a StoreProvider" at runtime.
export function useStore(): StoreContextType {
  const snapshot = useContext(StoreContext);
  if (!snapshot) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return snapshot;
}

/** Use when component may render outside StoreProvider (e.g. global widgets). Returns undefined when outside provider. */
export function useStoreOptional(): StoreContextType | undefined {
  return useContext(StoreContext);
}
