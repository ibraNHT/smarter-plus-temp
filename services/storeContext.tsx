
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ProducerProfile, ClientProfile, Offer, UserSession, UserRole, ProducerStatus, OfferType, CartItem, Order, OrderStatus, Wallet, TransactionType, WalletTransaction, ExternalTransactionRecord, Notification, WithdrawalRequest, WithdrawalStatus, PaymentMethod, ChatSession, ChatMessage, Proposal, ProposalStatus, WeeklySchedule, AvailabilityException, Review, SupportMessage, Portfolio, DisputeEvidence, Coupon, PickupPoint } from '../types';
import { generateSupportResponse } from './geminiService';
import { initialProducers, initialClients, initialOffers, initialOrders, initialWallets, initialExternalRecords, initialPortfolios, defaultSchedule, initialCoupons, initialPickupPoints } from '../data/mockData';
import { BUSINESS_RULES } from '../data/config';
import { apiFetch, apiUpload, setToken, clearToken, getToken } from './apiService';

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

  // Chat & Negotiation
  chats: ChatSession[];
  messages: ChatMessage[];
  startNegotiation: (producerId: string, offerId: string) => string;
  sendMessage: (chatId: string, text: string, proposal?: Proposal) => void;
  respondToProposal: (chatId: string, messageId: string, action: 'ACCEPT' | 'REJECT' | 'COUNTER', counterPrice?: number, counterQty?: number) => void;

  // Support Chat (Client Side)
  supportMessages: SupportMessage[];
  isSupportChatOpen: boolean;
  toggleSupportChat: () => void;
  sendSupportMessage: (text: string) => Promise<void>;

  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  registerProducer: (data: Omit<ProducerProfile, 'id' | 'status' | 'joinedDate' | 'paymentMethods' | 'favorites' | 'searchHistory' | 'referrals' | 'referralCode'> & { referrerCode?: string }, password: string) => Promise<{ success: boolean; message: string }>;
  updateProducerProfile: (producer: ProducerProfile) => Promise<void>;
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
  placeOrder: (couponCode?: string, discountAmount?: number, deliveryDate?: string, deliveryMethod?: 'HOME' | 'PICKUP', pickupPointId?: string) => Promise<void>;
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

  // Coupon Logic
  validateCoupon: (code: string, cartTotal: number) => number;

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
  requestWithdrawal: (amount: number, method: PaymentMethod) => Promise<{ success: boolean; message: string }>;
  // Notification Methods
  markNotificationsAsRead: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  // pendingRegistration kept in-memory for OTP verification flow
  const [pendingRegistration, setPendingRegistration] = useState<{ email: string, code: string, data: any, role: UserRole, password?: string } | null>(null);

  // State — seeded with mock data as visual demo fallback
  const [producers, setProducers] = useState<ProducerProfile[]>(initialProducers);
  const [clients, setClients] = useState<ClientProfile[]>(initialClients);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [wallets, setWallets] = useState<Record<string, Wallet>>(initialWallets);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [externalRecords, _setExternalRecords] = useState<ExternalTransactionRecord[]>(initialExternalRecords);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>(initialPortfolios);
  const [coupons, _setCoupons] = useState<Coupon[]>(initialCoupons);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>(initialPickupPoints);

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

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchData();
  }, []);

  // ─── DATA FETCHING ──────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      const [resProducers, resClients, resOffers, resOrders, resPickup] = await Promise.all([
        apiFetch<ProducerProfile[]>('/api/producers'),
        apiFetch<ClientProfile[]>('/api/clients'),
        apiFetch<Offer[]>('/api/offers'),
        apiFetch<any[]>('/api/orders'),
        apiFetch<PickupPoint[]>('/api/pickup-points'),
      ]);
      setProducers(resProducers);
      setClients(resClients);
      setOffers(resOffers);
      setOrders(resOrders.map((o: any) => ({
        ...o,
        items: o.items.map((item: any) => ({
          ...item,
          cartQuantity: item.quantity,
          id: item.offerId
        }))
      })));
      setPickupPoints(resPickup);
    } catch (error) {
      console.warn('Could not fetch data from API — running in demo mode with mock data.', error);
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

  const markNotificationsAsRead = () => {
    if (!user) return;
    setNotifications(prev => prev.map(n => n.userId === user.id ? { ...n, isRead: true } : n));
  };



  // ─── AUTHENTICATION ──────────────────────────────────────────────────────────

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const data = await apiFetch<{ token: string; user: UserSession }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
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
    setCart([]);
    localStorage.removeItem('currentUser');
  };

  const registerProducer = async (data: any, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      await apiFetch('/api/auth/register/producer', {
        method: 'POST',
        body: JSON.stringify({ ...data, password }),
      });
      // Store pending state for OTP verification step
      setPendingRegistration({ email: data.email, code: '', data, role: UserRole.PRODUCER, password });
      return { success: true, message: 'Registration submitted. Please verify your email.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const registerClient = async (data: any, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      await apiFetch('/api/auth/register/client', {
        method: 'POST',
        body: JSON.stringify({ ...data, password }),
      });
      setPendingRegistration({ email: data.email, code: '', data, role: UserRole.CLIENT, password });
      return { success: true, message: 'Registration submitted. Please verify your email.' };
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

  const updateProducerProfile = async (updatedProducer: ProducerProfile) => {
    try {
      const saved = await apiFetch<ProducerProfile>(`/api/producers/${updatedProducer.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedProducer),
      });
      setProducers(prev => prev.map(p => p.id === saved.id ? saved : p));
    } catch {
      // Optimistic fallback
      setProducers(prev => prev.map(p => p.id === updatedProducer.id ? updatedProducer : p));
    }
    addNotification(updatedProducer.id, 'Profile updated', 'SUCCESS');
  };

  const updateProducerAvailability = async (producerId: string, schedule: WeeklySchedule, exceptions: AvailabilityException[]) => {
    try {
      await apiFetch(`/api/producers/${producerId}/availability`, {
        method: 'PUT',
        body: JSON.stringify({ schedule, exceptions }),
      });
    } catch {
      // Optimistic fallback
    }
    setProducers(prev => prev.map(p => p.id === producerId ? { ...p, availability: schedule, exceptions } : p));
    addNotification(producerId, 'Availability updated', 'SUCCESS');
  };

  const validateProducer = async (id: string, status: ProducerStatus) => {
    try {
      await apiFetch(`/api/producers/${id}/validate`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch {
      // Optimistic fallback
    }
    setProducers(prev => prev.map(p => p.id === id ? { ...p, status } : p));
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
      const saved = await apiFetch<ClientProfile>(`/api/clients/${updatedClient.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedClient),
      });
      setClients(prev => prev.map(c => c.id === saved.id ? saved : c));
    } catch {
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    }
    addNotification(updatedClient.id, 'Profile updated', 'SUCCESS');
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
    } catch {
      setOffers(prev => prev.map(o => o.id === updatedOffer.id ? updatedOffer : o));
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

  const placeOrder = async (couponCode?: string, discountAmount: number = 0, deliveryDate?: string, deliveryMethod: 'HOME' | 'PICKUP' = 'HOME', pickupPointId?: string) => {
    if (cart.length === 0 || !user) return;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    const serviceFee = subtotal * BUSINESS_RULES.SERVICE_FEE_PERCENT;
    const totalAmount = Math.max(0, subtotal + serviceFee - discountAmount);
    const newOrder: Omit<Order, 'id'> = {
      clientId: user.id, producerId: cart[0].producerId, items: [...cart],
      subtotal, serviceFee, totalAmount, status: OrderStatus.PENDING_VALIDATION, createdAt: new Date().toISOString(),
      clientReviewed: false, producerReviewed: false, contactRevealed: false,
      appliedCoupon: couponCode, discountAmount, requestedDeliveryDate: deliveryDate, deliveryMethod, pickupPointId
    };
    try {
      const saved = await apiFetch<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(newOrder),
      });
      setOrders(prev => [...prev, saved]);
      addNotification(user.id, `Order #${saved.id.substring(saved.id.length - 6).toUpperCase()} placed!`, 'SUCCESS');
    } catch {
      // Optimistic local add on failure
      const localOrder: Order = { ...newOrder, id: `order-${Date.now()}` };
      setOrders(prev => [...prev, localOrder]);
      addNotification(user.id, `Order placed (offline). Will sync when connection is restored.`, 'WARNING');
    }
    clearCart();
  };

  const confirmOrder = async (orderId: string) => {
    try {
      await apiFetch(`/api/orders/${orderId}/confirm`, { method: 'PATCH' });
    } catch { /* optimistic */ }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CONFIRMED_AWAITING_PAYMENT } : o));
    const order = orders.find(o => o.id === orderId);
    if (order) addNotification(order.clientId, `Order #${order.id.substring(order.id.length - 6).toUpperCase()} confirmed.`, 'SUCCESS');
  };

  const rejectOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.status === OrderStatus.PAID_IN_PREPARATION || order.status === OrderStatus.IN_TRANSIT) {
      addNotification(user!.id, 'Cannot cancel paid order. Contact support.', 'ERROR'); return;
    }
    try {
      await apiFetch(`/api/orders/${orderId}/reject`, { method: 'PATCH' });
    } catch { /* optimistic */ }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o));
    addNotification(order.clientId, `Order #${orderId.substring(orderId.length - 6).toUpperCase()} cancelled by producer.`, 'WARNING');
  };

  const cancelOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if ([OrderStatus.PAID_IN_PREPARATION, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED].includes(order.status)) {
      addNotification(user!.id, 'Cannot cancel paid order. Contact support.', 'ERROR'); return;
    }
    try {
      await apiFetch(`/api/orders/${orderId}/cancel`, { method: 'PATCH' });
    } catch { /* optimistic */ }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o));
    addNotification(order.producerId, `Order #${orderId.substring(orderId.length - 6).toUpperCase()} cancelled by client.`, 'WARNING');
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
    } catch {
      // Fallback: local wallet deduction
      const wallet = getWallet(user.id);
      if (wallet.balance < order.totalAmount) return { success: false, error: 'INSUFFICIENT_FUNDS' };
      const tx: WalletTransaction = { id: `txn-${Date.now()}`, userId: user.id, type: TransactionType.PAYMENT, amount: order.totalAmount, description: `Order #${order.id.substring(order.id.length - 6).toUpperCase()} (inc. fees)`, date: new Date().toISOString() };
      setWallets(prev => ({ ...prev, [user.id]: { ...wallet, balance: wallet.balance - order.totalAmount, transactions: [tx, ...wallet.transactions] } }));
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.PAID_IN_PREPARATION } : o));
      addNotification(user.id, 'Payment successful!', 'SUCCESS');
      return { success: true };
    }
  };

  const startDelivery = async (id: string) => {
    try {
      await apiFetch(`/api/orders/${id}/deliver`, { method: 'PATCH' });
    } catch { /* optimistic */ }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: OrderStatus.IN_TRANSIT } : o));
    const order = orders.find(o => o.id === id);
    if (order) addNotification(order.clientId, 'Order in transit', 'INFO');
  };

  const confirmReceipt = async (id: string) => {
    try {
      await apiFetch(`/api/orders/${id}/confirm-receipt`, { method: 'PATCH' });
    } catch { /* optimistic */ }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: OrderStatus.DELIVERED } : o));
    const order = orders.find(o => o.id === id);
    if (order) {
      const commission = order.subtotal * BUSINESS_RULES.PLATFORM_COMMISSION_PERCENT;
      const producerEarnings = order.subtotal - commission;
      const producerWallet = getWallet(order.producerId);
      const tx: WalletTransaction = { id: `tx-earn-${Date.now()}`, userId: order.producerId, type: TransactionType.RECEIVED, amount: producerEarnings, description: `Earnings Order #${order.id.substring(order.id.length - 6).toUpperCase()} (less commission)`, date: new Date().toISOString() };
      setWallets(prev => ({ ...prev, [order.producerId]: { ...producerWallet, balance: producerWallet.balance + producerEarnings, transactions: [tx, ...producerWallet.transactions] } }));
      addNotification(order.producerId, 'Order delivered. Funds released to wallet.', 'SUCCESS');
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
    } catch {
      // Fallback: local blob URLs
      evidence = files.map(f => ({ id: `ev-${Date.now()}-${Math.random()}`, uploaderId: user!.id, fileName: f.name, fileUrl: URL.createObjectURL(f), fileType: f.type.includes('image') ? 'IMAGE' as const : 'DOCUMENT' as const, uploadedAt: new Date().toISOString() }));
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.DISPUTE, disputeReason: reason, disputeEvidence: evidence } : o));
    const order = orders.find(o => o.id === orderId);
    if (order) addNotification(order.producerId, 'Dispute opened', 'WARNING');
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
    } catch {
      // Optimistic fallback
      const review: Review = { ...data, id: `rev-${Date.now()}`, createdAt: new Date().toISOString() };
      setReviews(prev => [...prev, review]);
      setOrders(prev => prev.map(o => o.id === data.orderId ? (data.reviewerId === o.clientId ? { ...o, clientReviewed: true } : { ...o, producerReviewed: true }) : o));
    }
  };

  const getAverageRating = (targetId: string) => {
    const target = reviews.filter(r => r.targetId === targetId);
    return target.length ? parseFloat((target.reduce((a, b) => a + b.rating, 0) / target.length).toFixed(1)) : 0;
  };

  // ─── WALLET ──────────────────────────────────────────────────────────────────

  const getWallet = (userId: string): Wallet => {
    if (!wallets[userId]) setWallets(prev => ({ ...prev, [userId]: { userId, balance: 0, transactions: [] } }));
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
    } catch {
      // DEMO FALLBACK: validate against mock external records
      const recIdx = externalRecords.findIndex(r => r.referenceId === refId && !r.isUsed && r.amount === amount && r.provider === provider);
      if (recIdx === -1) return { success: false, message: 'Invalid transaction reference (demo mode)' };
      const tx: WalletTransaction = { id: `tx-${Date.now()}`, userId: user.id, type: TransactionType.DEPOSIT, amount, description: `Top up ${provider}`, date: new Date().toISOString(), reference: refId };
      setWallets(prev => ({ ...prev, [user.id]: { ...prev[user.id], balance: (prev[user.id]?.balance || 0) + amount, transactions: [tx, ...(prev[user.id]?.transactions || [])] } }));
      return { success: true, message: 'Funded (demo mode)' };
    }
  };

  const requestWithdrawal = async (amount: number, method: PaymentMethod): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'No user' };
    try {
      const result = await apiFetch<{ success: boolean; message: string }>('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, method }),
      });
      setWithdrawalRequests(prev => [...prev, { id: `w-${Date.now()}`, userId: user.id, amount, paymentMethod: method, status: WithdrawalStatus.PENDING, requestDate: new Date().toISOString() }]);
      return { success: result.success, message: result.message };
    } catch {
      // DEMO FALLBACK
      const wallet = getWallet(user.id);
      const pending = withdrawalRequests.filter(r => r.userId === user.id && r.status === WithdrawalStatus.PENDING).reduce((a, b) => a + b.amount, 0);
      if (wallet.balance - pending < amount) return { success: false, message: 'Insufficient available funds' };
      setWithdrawalRequests(prev => [...prev, { id: `w-${Date.now()}`, userId: user.id, amount, paymentMethod: method, status: WithdrawalStatus.PENDING, requestDate: new Date().toISOString() }]);
      return { success: true, message: 'Requested (demo mode)' };
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
    } catch {
      setPortfolios(prev => [...prev, { ...data, id: `port-${Date.now()}`, createdAt: new Date().toISOString() }]);
    }
  };

  const updatePortfolio = async (updated: Portfolio) => {
    try {
      const saved = await apiFetch<Portfolio>(`/api/portfolios/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      setPortfolios(prev => prev.map(p => p.id === saved.id ? saved : p));
    } catch {
      setPortfolios(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
  };

  const deletePortfolio = async (id: string) => {
    try {
      await apiFetch(`/api/portfolios/${id}`, { method: 'DELETE' });
    } catch { /* optimistic */ }
    setPortfolios(prev => prev.filter(p => p.id !== id));
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

  const validateCoupon = (code: string, cartTotal: number): number => {
    const coupon = coupons.find(c => c.code === code && c.isActive);
    if (!coupon) return 0;
    if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) return 0;
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) return 0;
    if (coupon.type === 'PERCENTAGE') { return (cartTotal * coupon.value) / 100; } else { return Math.min(coupon.value, cartTotal); }
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

  const toggleSupportChat = () => setIsSupportChatOpen(prev => !prev);

  const sendSupportMessage = async (text: string) => {
    setSupportMessages(prev => [...prev, { id: `u-${Date.now()}`, sender: 'USER', text, timestamp: new Date().toISOString() }]);
    if (!isHandedOver) {
      const res = await generateSupportResponse(text, user?.role || 'Guest');
      setSupportMessages(prev => [...prev, { id: `a-${Date.now()}`, sender: 'AI', text: res.text, timestamp: new Date().toISOString() }]);
      if (res.handover) {
        setIsHandedOver(true);
        setTimeout(() => setSupportMessages(prev => [...prev, { id: `s-${Date.now()}`, sender: 'AGENT', text: 'Connecting agent...', timestamp: new Date().toISOString() }]), 1000);
      }
    }
  };

  // ─── CHAT & NEGOTIATION ───────────────────────────────────────────────────────

  const startNegotiation = (pid: string, oid: string) => {
    if (!user) return '';
    const existing = chats.find(c => c.participants.includes(user.id) && c.participants.includes(pid) && c.offerId === oid);
    if (existing) return existing.id;
    const id = `chat-${Date.now()}`;
    setChats(prev => [...prev, { id, participants: [user.id, pid], offerId: oid, lastMessage: 'Started', lastMessageAt: new Date().toISOString(), unreadCounts: {} }]);
    return id;
  };

  const sendMessage = (chatId: string, text: string, proposal?: any) => {
    if (!user) return;
    if (!proposal && !text.startsWith('Counter') && !text.startsWith('Formal') && (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || text.match(/\b6\d{8}\b/))) {
      addNotification(user.id, 'Forbidden: No contact info allowed', 'ERROR'); return;
    }
    const msg = { id: `m-${Date.now()}`, chatId, senderId: user.id, text, proposal, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastMessage: text, lastMessageAt: msg.createdAt } : c));
  };

  const respondToProposal = (chatId: string, msgId: string, action: any, price?: number, qty?: number) => {
    if (!user) return;
    setMessages(prev => prev.map(m => m.id === msgId && m.proposal ? { ...m, proposal: { ...m.proposal, status: action === 'ACCEPT' ? ProposalStatus.ACCEPTED : action === 'REJECT' ? ProposalStatus.REJECTED : ProposalStatus.COUNTERED } } : m));
    if (action === 'ACCEPT') {
      const chat = chats.find(c => c.id === chatId);
      const original = messages.find(m => m.id === msgId);
      if (chat && original?.proposal) {
        const client = chat.participants.find(p => p !== user.id);
        if (client) {
          const offerOrigin = offers.find(o => o.id === original.proposal!.offerId);
          if (offerOrigin) {
            const custom = { ...offerOrigin, id: `cust-${Date.now()}`, title: `Special: ${offerOrigin.title}`, price: original.proposal!.pricePerUnit, quantity: original.proposal!.quantity, reservedClientId: client, isNegotiable: false, createdAt: new Date().toISOString() };
            setOffers(prev => [...prev, custom]);
            sendMessage(chatId, 'Proposal Accepted! Offer created.', undefined);
          }
        }
      }
    } else if (action === 'REJECT') { sendMessage(chatId, 'Rejected'); }
    else if (action === 'COUNTER') { sendMessage(chatId, `Counter: ${qty} @ ${price}`, { offerId: messages.find(m => m.id === msgId)?.proposal?.offerId, pricePerUnit: price, quantity: qty, status: ProposalStatus.PENDING }); }
  };

  return (
    <StoreContext.Provider value={{
      user, pendingRegistration, producers, clients, offers, cart, orders, wallets, notifications, withdrawalRequests, reviews, portfolios, coupons, pickupPoints,
      chats, messages, startNegotiation, sendMessage, respondToProposal,
      login, logout, registerProducer, registerClient, verifyEmail, updateClientProfile, upgradeClientToProducer, validateProducer, updateProducerProfile, updateProducerAvailability, saveProducerPaymentMethod, deleteProducerPaymentMethod, createOffer, updateOffer, getProducerOffers, getOfferById,
      addToCart, removeFromCart, clearCart, placeOrder, confirmOrder, rejectOrder, cancelOrder, payForOrder, startDelivery, confirmReceipt, reportProblem, addDisputeEvidence, revealContactInfo,
      getWallet, fundWallet, requestWithdrawal, markNotificationsAsRead, getAvailableSlots, submitReview, getAverageRating,
      getProducerPortfolios, addPortfolio, updatePortfolio, deletePortfolio,
      trackUserSearch, toggleFavorite, moveToFavorites, getRecommendedOffers,
      compareList, addToCompare, removeFromCompare, clearCompare,
      supportMessages, isSupportChatOpen, toggleSupportChat, sendSupportMessage,
      validateCoupon,
      addPickupPoint, deletePickupPoint,
      changePassword
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
