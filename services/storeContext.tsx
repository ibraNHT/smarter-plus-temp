
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ProducerProfile, ClientProfile, Offer, UserSession, UserRole, ProducerStatus, OfferType, UnitOfMeasure, MarketType, CartItem, Order, OrderStatus, Wallet, TransactionType, WalletTransaction, ExternalTransactionRecord, Notification, WithdrawalRequest, WithdrawalStatus, PaymentMethod, ChatSession, ChatMessage, Proposal, ProposalStatus, Location, WeeklySchedule, AvailabilityException, Review, SupportMessage, Portfolio, DisputeEvidence, SupportSession, Coupon, PickupPoint } from '../types';
import { generateSupportResponse } from './geminiService';
import { initialProducers, initialClients, initialOffers, initialOrders, initialWallets, initialExternalRecords, initialPortfolios, defaultSchedule, initialCoupons, initialPickupPoints } from '../data/mockData';
import { BUSINESS_RULES } from '../data/config';

// --- CONFIGURATION ---
const USE_DATABASE = true;
const BASE_URL = process.env.BACKEND_URL || '';

interface StoreContextType {
  user: UserSession | null;
  pendingRegistration: { email: string, code: string, data: any, role: UserRole, password?: string } | null;
  producers: ProducerProfile[];
  clients: ClientProfile[];
  offers: Offer[];
  cart: CartItem[];
  orders: Order[];
  wallets: Record<string, Wallet>; // Map userId to Wallet
  notifications: Notification[];
  withdrawalRequests: WithdrawalRequest[];
  reviews: Review[];
  portfolios: Portfolio[];
  coupons: Coupon[];
  pickupPoints: PickupPoint[];

  // Chat & Negotiation
  chats: ChatSession[];
  messages: ChatMessage[];
  startNegotiation: (producerId: string, offerId: string) => string; // Returns chatId
  sendMessage: (chatId: string, text: string, proposal?: Proposal) => void;
  respondToProposal: (chatId: string, messageId: string, action: 'ACCEPT' | 'REJECT' | 'COUNTER', counterPrice?: number, counterQty?: number) => void;

  // Support Chat (Client Side)
  supportMessages: SupportMessage[];
  isSupportChatOpen: boolean;
  toggleSupportChat: () => void;
  sendSupportMessage: (text: string) => Promise<void>;

  login: (role: UserRole, name: string, idOverride?: string) => void;
  logout: () => void;
  registerProducer: (data: Omit<ProducerProfile, 'id' | 'status' | 'joinedDate' | 'paymentMethods' | 'favorites' | 'searchHistory' | 'referrals' | 'referralCode'> & { referrerCode?: string }, password: string) => void;
  updateProducerProfile: (producer: ProducerProfile) => void;
  updateProducerAvailability: (producerId: string, schedule: WeeklySchedule, exceptions: AvailabilityException[]) => void;
  registerClient: (data: Omit<ClientProfile, 'id' | 'joinedDate' | 'referrals' | 'referralCode'> & { referrerCode?: string }, password: string) => void;
  verifyEmail: (code: string) => boolean;
  updateClientProfile: (client: ClientProfile) => void;
  upgradeClientToProducer: (clientId: string, producerDetails: Partial<ProducerProfile>) => void;
  validateProducer: (id: string, status: ProducerStatus) => void;
  saveProducerPaymentMethod: (producerId: string, method: PaymentMethod) => void;
  deleteProducerPaymentMethod: (producerId: string, methodId: string) => void;
  createOffer: (offer: Omit<Offer, 'id' | 'createdAt' | 'producerId'>) => void;
  updateOffer: (offer: Offer) => void;
  getProducerOffers: (producerId: string) => Offer[];
  getOfferById: (offerId: string) => Offer | undefined;
  getAvailableSlots: (producerId: string, date: Date, durationHours: number) => Date[];
  addToCart: (offer: Offer, quantity: number, bookingDate?: string) => { success: boolean; error?: 'PRODUCER_CONFLICT' };
  removeFromCart: (offerId: string) => void;
  clearCart: () => void;
  placeOrder: (couponCode?: string, discountAmount?: number, deliveryDate?: string, deliveryMethod?: 'HOME' | 'PICKUP', pickupPointId?: string) => void;
  confirmOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  payForOrder: (orderId: string) => { success: boolean; error?: 'INSUFFICIENT_FUNDS' };
  startDelivery: (orderId: string) => void;
  confirmReceipt: (orderId: string) => void;
  reportProblem: (orderId: string, reason: string, files: File[]) => void;
  addDisputeEvidence: (orderId: string, files: File[]) => void;
  revealContactInfo: (orderId: string) => void;
  submitReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  getAverageRating: (targetId: string) => number;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;

  // Coupon Logic
  validateCoupon: (code: string, cartTotal: number) => number;

  // Pickup Points Logic (Admin)
  addPickupPoint: (point: Omit<PickupPoint, 'id'>) => void;
  deletePickupPoint: (id: string) => void;

  // Portfolio Methods
  getProducerPortfolios: (producerId: string) => Portfolio[];
  addPortfolio: (portfolio: Omit<Portfolio, 'id' | 'createdAt'>) => void;
  updatePortfolio: (portfolio: Portfolio) => void;
  deletePortfolio: (portfolioId: string) => void;

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
  const [pendingRegistration, setPendingRegistration] = useState<{ email: string, code: string, data: any, role: UserRole, password?: string } | null>(null);

  // State
  const [producers, setProducers] = useState<ProducerProfile[]>(initialProducers);
  const [clients, setClients] = useState<ClientProfile[]>(initialClients);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [wallets, setWallets] = useState<Record<string, Wallet>>(initialWallets);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [externalRecords, setExternalRecords] = useState<ExternalTransactionRecord[]>(initialExternalRecords);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>(initialPortfolios);
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
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

    if (USE_DATABASE) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const [resProducers, resClients, resOffers, resOrders, resPickup] = await Promise.all([
        fetch(`${BASE_URL}/api/producers`),
        fetch(`${BASE_URL}/api/clients`),
        fetch(`${BASE_URL}/api/offers`),
        fetch(`${BASE_URL}/api/orders`),
        fetch(`${BASE_URL}/api/pickup-points`)
      ]);

      if (resProducers.ok) setProducers(await resProducers.json());
      if (resClients.ok) setClients(await resClients.json());
      if (resOffers.ok) setOffers(await resOffers.json());
      if (resOrders.ok) {
        const dbOrders = await resOrders.json();
        // Map DB results to match expectations of frontend state
        setOrders(dbOrders.map((o: any) => ({
          ...o,
          items: o.items.map((item: any) => ({
            ...item,
            cartQuantity: item.quantity, // Prisma schema uses quantity, CartItem expects cartQuantity
            id: item.offerId // Consistent referencing
          }))
        })));
      }
      if (resPickup.ok) setPickupPoints(await resPickup.json());
    } catch (error) {
      console.error("Failed to fetch data from API", error);
    }
  };

  const sendEmailNotification = (recipientEmail: string, subject: string, body: string) => {
    console.log(`%c[MOCK EMAIL] To: ${recipientEmail}\nSubject: ${subject}\nBody: ${body}`, 'color: cyan; font-weight: bold;');
  };

  const generateReferralCode = (name: string) => {
    const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `${prefix}${random}`;
  };

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
    addNotification(user.id, "Moved to Favorites for later!", 'SUCCESS');
  };

  const addToCompare = (offerId: string) => {
    if (compareList.includes(offerId)) return;
    if (compareList.length >= 3) {
      alert("You can compare up to 3 products at a time.");
      return;
    }
    setCompareList(prev => [...prev, offerId]);
  };

  const removeFromCompare = (offerId: string) => {
    setCompareList(prev => prev.filter(id => id !== offerId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

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

  const login = (role: UserRole, name: string, idOverride?: string) => {
    let producerId = undefined;
    let userId = idOverride || '';
    if (role === UserRole.PRODUCER) {
      producerId = userId;
    }
    const session: UserSession = { id: userId, role, name, producerId };
    setUser(session);
    localStorage.setItem('currentUser', JSON.stringify(session));
  };

  const logout = () => {
    if (user && user.role === UserRole.CLIENT && cart.length > 0) {
      const client = clients.find(c => c.id === user.id);
      if (client) sendEmailNotification(client.email, 'Left Cart', 'You left items in your cart!');
    }
    setUser(null); setCart([]); localStorage.removeItem('currentUser');
  };

  const generateOTP = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  };

  const registerProducer = (data: any, password: string) => {
    const code = generateOTP();
    console.log(`%c[OTP SERVICE] Code for ${data.email}: ${code}`, 'background: #222; color: #bada55; font-size: 14px; padding: 4px;');
    setPendingRegistration({ email: data.email, code, data, role: UserRole.PRODUCER, password });
  };

  const registerClient = (data: any, password: string) => {
    const code = generateOTP();
    console.log(`%c[OTP SERVICE] Code for ${data.email}: ${code}`, 'background: #222; color: #bada55; font-size: 14px; padding: 4px;');
    setPendingRegistration({ email: data.email, code, data, role: UserRole.CLIENT, password });
  };

  const verifyEmail = (code: string) => {
    if (!pendingRegistration) return false;
    if (pendingRegistration.code === code) {
      const { referrerCode, ...registrationData } = pendingRegistration.data;
      let referredBy = undefined;

      if (referrerCode) {
        const referrerProducer = producers.find(p => p.referralCode === referrerCode);
        const referrerClient = clients.find(c => c.referralCode === referrerCode);
        if (referrerProducer) referredBy = referrerProducer.id;
        if (referrerClient) referredBy = referrerClient.id;
      }

      if (pendingRegistration.role === UserRole.PRODUCER) {
        const newId = `prod-${Date.now()}`;
        const newProducer: ProducerProfile = {
          ...registrationData,
          id: newId,
          status: ProducerStatus.PENDING,
          paymentMethods: [],
          joinedDate: new Date().toISOString(),
          availability: defaultSchedule,
          favorites: [],
          referralCode: generateReferralCode(registrationData.name),
          referrals: [],
          referredBy
        };
        setProducers(prev => [...prev, newProducer]);
        login(UserRole.PRODUCER, newProducer.name, newProducer.id);
      } else {
        const newId = `client-${Date.now()}`;
        const newClient: ClientProfile = {
          ...registrationData,
          id: newId,
          joinedDate: new Date().toISOString(),
          favorites: [],
          referralCode: generateReferralCode(registrationData.name),
          referrals: [],
          referredBy
        };
        setClients(prev => [...prev, newClient]);
        login(UserRole.CLIENT, newClient.name, newClient.id);
      }
      setPendingRegistration(null);
      return true;
    }
    return false;
  };

  const updateProducerProfile = (updatedProducer: ProducerProfile) => {
    setProducers(prev => prev.map(p => p.id === updatedProducer.id ? updatedProducer : p));
    addNotification(updatedProducer.id, "Profile updated", 'SUCCESS');
  };
  const updateProducerAvailability = (producerId: string, schedule: WeeklySchedule, exceptions: AvailabilityException[]) => {
    setProducers(prev => prev.map(p => p.id === producerId ? { ...p, availability: schedule, exceptions } : p));
    addNotification(producerId, "Availability updated", "SUCCESS");
  };
  const updateClientProfile = (updatedClient: ClientProfile) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    addNotification(updatedClient.id, "Profile updated", 'SUCCESS');
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
    login(UserRole.PRODUCER, newProducer.name, newProducer.id);
  };
  const validateProducer = (id: string, status: ProducerStatus) => {
    setProducers(producers.map(p => p.id === id ? { ...p, status } : p));
  };
  const saveProducerPaymentMethod = (producerId: string, method: PaymentMethod) => {
    setProducers(prev => prev.map(p => p.id === producerId ? { ...p, paymentMethods: p.paymentMethods.some(pm => pm.id === method.id) ? p.paymentMethods.map(pm => pm.id === method.id ? method : pm) : [...p.paymentMethods, method] } : p));
  };
  const deleteProducerPaymentMethod = (producerId: string, methodId: string) => {
    setProducers(prev => prev.map(p => p.id === producerId ? { ...p, paymentMethods: p.paymentMethods.filter(pm => pm.id !== methodId) } : p));
  };
  const createOffer = async (offerData: any) => {
    if (!user || !user.producerId) return;
    if (USE_DATABASE) {
      try {
        const res = await fetch(`${BASE_URL}/api/offers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...offerData, producerId: user.producerId })
        });
        if (res.ok) {
          const newOffer = await res.json();
          setOffers([...offers, newOffer]);
        }
      } catch (e) { console.error(e); }
    } else {
      const newOffer = { ...offerData, id: `offer-${Date.now()}`, producerId: user.producerId, createdAt: new Date().toISOString() };
      setOffers([...offers, newOffer]);
    }
  };
  const updateOffer = (updatedOffer: Offer) => setOffers(prev => prev.map(o => o.id === updatedOffer.id ? updatedOffer : o));
  const getProducerOffers = (producerId: string) => offers.filter(o => o.producerId === producerId);
  const getOfferById = (id: string) => offers.find(o => o.id === id);
  const getProducerPortfolios = (producerId: string) => portfolios.filter(p => p.producerId === producerId);
  const addPortfolio = (data: any) => setPortfolios(prev => [...prev, { ...data, id: `port-${Date.now()}`, createdAt: new Date().toISOString() }]);
  const updatePortfolio = (updated: Portfolio) => setPortfolios(prev => prev.map(p => p.id === updated.id ? updated : p));
  const deletePortfolio = (id: string) => setPortfolios(prev => prev.filter(p => p.id !== id));
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
  const placeOrder = (couponCode?: string, discountAmount: number = 0, deliveryDate?: string, deliveryMethod: 'HOME' | 'PICKUP' = 'HOME', pickupPointId?: string) => {
    if (cart.length === 0 || !user) return;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    const serviceFee = subtotal * BUSINESS_RULES.SERVICE_FEE_PERCENT;
    const totalAmount = Math.max(0, subtotal + serviceFee - discountAmount);
    const newOrder: Order = {
      id: `order-${Date.now()}`, clientId: user.id, producerId: cart[0].producerId, items: [...cart],
      subtotal, serviceFee, totalAmount, status: OrderStatus.PENDING_VALIDATION, createdAt: new Date().toISOString(),
      clientReviewed: false, producerReviewed: false, contactRevealed: false,
      appliedCoupon: couponCode, discountAmount, requestedDeliveryDate: deliveryDate, deliveryMethod, pickupPointId
    };
    if (USE_DATABASE) {
      fetch(`${BASE_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOrder) });
    }
    setOrders([...orders, newOrder]);
    clearCart();
    addNotification(user.id, `Order #${newOrder.id.substring(newOrder.id.length - 6).toUpperCase()} placed!`, 'SUCCESS');
  };
  const confirmOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CONFIRMED_AWAITING_PAYMENT } : o));
    const order = orders.find(o => o.id === orderId);
    if (order) addNotification(order.clientId, `Order #${order.id.substring(order.id.length - 6).toUpperCase()} confirmed.`, 'SUCCESS');
  };
  const rejectOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.status === OrderStatus.PAID_IN_PREPARATION || order.status === OrderStatus.IN_TRANSIT) { addNotification(user!.id, "Cannot cancel paid order. Contact support.", "ERROR"); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o));
    addNotification(order.clientId, `Order #${orderId.substring(orderId.length - 6).toUpperCase()} cancelled by producer.`, 'WARNING');
  };
  const cancelOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.status === OrderStatus.PAID_IN_PREPARATION || order.status === OrderStatus.IN_TRANSIT || order.status === OrderStatus.DELIVERED) { addNotification(user!.id, "Cannot cancel paid order. Contact support.", "ERROR"); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o));
    addNotification(order.producerId, `Order #${orderId.substring(orderId.length - 6).toUpperCase()} cancelled by client.`, 'WARNING');
  };
  const payForOrder = (orderId: string): { success: boolean; error?: 'INSUFFICIENT_FUNDS' } => {
    if (!user) return { success: false };
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false };
    const wallet = getWallet(user.id);
    if (wallet.balance < order.totalAmount) return { success: false, error: 'INSUFFICIENT_FUNDS' };
    const tx: WalletTransaction = { id: `txn-${Date.now()}`, userId: user.id, type: TransactionType.PAYMENT, amount: order.totalAmount, description: `Order #${order.id.substring(order.id.length - 6).toUpperCase()} (inc. fees)`, date: new Date().toISOString() };
    setWallets(prev => ({ ...prev, [user.id]: { ...wallet, balance: wallet.balance - order.totalAmount, transactions: [tx, ...wallet.transactions] } }));
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.PAID_IN_PREPARATION } : o));
    addNotification(user.id, "Payment successful!", 'SUCCESS');
    return { success: true };
  };
  const startDelivery = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: OrderStatus.IN_TRANSIT } : o));
    const order = orders.find(o => o.id === id);
    if (order) addNotification(order.clientId, "Order in transit", 'INFO');
  };
  const confirmReceipt = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: OrderStatus.DELIVERED } : o));
    const order = orders.find(o => o.id === id);
    if (order) {
      const commission = order.subtotal * BUSINESS_RULES.PLATFORM_COMMISSION_PERCENT;
      const producerEarnings = order.subtotal - commission;
      const producerWallet = getWallet(order.producerId);
      const tx: WalletTransaction = { id: `tx-earn-${Date.now()}`, userId: order.producerId, type: TransactionType.RECEIVED, amount: producerEarnings, description: `Earnings Order #${order.id.substring(order.id.length - 6).toUpperCase()} (less commission)`, date: new Date().toISOString() };
      setWallets(prev => ({ ...prev, [order.producerId]: { ...producerWallet, balance: producerWallet.balance + producerEarnings, transactions: [tx, ...producerWallet.transactions] } }));
      addNotification(order.producerId, "Order delivered. Funds released to wallet.", 'SUCCESS');
    }
  };
  const reportProblem = (orderId: string, reason: string, files: File[]) => {
    const evidence: DisputeEvidence[] = files.map(f => ({ id: `ev-${Date.now()}-${Math.random()}`, uploaderId: user!.id, fileName: f.name, fileUrl: URL.createObjectURL(f), fileType: f.type.includes('image') ? 'IMAGE' : 'DOCUMENT', uploadedAt: new Date().toISOString() }));
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.DISPUTE, disputeReason: reason, disputeEvidence: evidence } : o));
    const order = orders.find(o => o.id === orderId);
    if (order) addNotification(order.producerId, "Dispute opened", 'WARNING');
  };
  const addDisputeEvidence = (orderId: string, files: File[]) => {
    if (!user) return;
    const newEvidence: DisputeEvidence[] = files.map(f => ({ id: `ev-${Date.now()}-${Math.random()}`, uploaderId: user.id, fileName: f.name, fileUrl: URL.createObjectURL(f), fileType: f.type.includes('image') ? 'IMAGE' : 'DOCUMENT', uploadedAt: new Date().toISOString() }));
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, disputeEvidence: [...(o.disputeEvidence || []), ...newEvidence] } : o));
    addNotification(user.id, "Evidence uploaded successfully", "SUCCESS");
  };
  const revealContactInfo = (id: string) => setOrders(prev => prev.map(o => o.id === id ? { ...o, contactRevealed: true } : o));
  const submitReview = (data: any) => {
    setReviews(prev => [...prev, { ...data, id: `rev-${Date.now()}`, createdAt: new Date().toISOString() }]);
    setOrders(prev => prev.map(o => o.id === data.orderId ? (data.reviewerId === o.clientId ? { ...o, clientReviewed: true } : { ...o, producerReviewed: true }) : o));
  };
  const getAverageRating = (targetId: string) => {
    const target = reviews.filter(r => r.targetId === targetId);
    return target.length ? parseFloat((target.reduce((a, b) => a + b.rating, 0) / target.length).toFixed(1)) : 0;
  };
  const getWallet = (userId: string): Wallet => {
    if (!wallets[userId]) setWallets(prev => ({ ...prev, [userId]: { userId, balance: 0, transactions: [] } }));
    return wallets[userId] || { userId, balance: 0, transactions: [] };
  };
  const fundWallet = async (amount: number, provider: string, refId: string) => {
    if (!user) return { success: false, message: "No user" };
    const recIdx = externalRecords.findIndex(r => r.referenceId === refId && !r.isUsed && r.amount === amount && r.provider === provider);
    if (recIdx === -1) return { success: false, message: "Invalid transaction" };
    const updated = [...externalRecords]; updated[recIdx].isUsed = true; setExternalRecords(updated);
    const tx: WalletTransaction = { id: `tx-${Date.now()}`, userId: user.id, type: TransactionType.DEPOSIT, amount, description: `Top up ${provider}`, date: new Date().toISOString(), reference: refId };
    setWallets(prev => ({ ...prev, [user.id]: { ...prev[user.id], balance: prev[user.id].balance + amount, transactions: [tx, ...prev[user.id].transactions] } }));
    return { success: true, message: "Funded" };
  };
  const requestWithdrawal = async (amount: number, method: PaymentMethod) => {
    if (!user) return { success: false, message: "No user" };
    const wallet = getWallet(user.id);
    const pending = withdrawalRequests.filter(r => r.userId === user.id && r.status === WithdrawalStatus.PENDING).reduce((a, b) => a + b.amount, 0);
    if (wallet.balance - pending < amount) return { success: false, message: "Insufficient available funds" };
    setWithdrawalRequests(prev => [...prev, { id: `w-${Date.now()}`, userId: user.id, amount, paymentMethod: method, status: WithdrawalStatus.PENDING, requestDate: new Date().toISOString() }]);
    return { success: true, message: "Requested" };
  };
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
    if (!proposal && !text.startsWith('Counter') && !text.startsWith('Formal') && (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || text.match(/\b6\d{8}\b/))) { addNotification(user.id, "Forbidden: No contact info allowed", "ERROR"); return; }
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
            sendMessage(chatId, "Proposal Accepted! Offer created.", undefined);
          }
        }
      }
    } else if (action === 'REJECT') { sendMessage(chatId, "Rejected"); }
    else if (action === 'COUNTER') { sendMessage(chatId, `Counter: ${qty} @ ${price}`, { offerId: messages.find(m => m.id === msgId)?.proposal?.offerId, pricePerUnit: price, quantity: qty, status: ProposalStatus.PENDING }); }
  };
  const toggleSupportChat = () => setIsSupportChatOpen(prev => !prev);
  const sendSupportMessage = async (text: string) => {
    setSupportMessages(prev => [...prev, { id: `u-${Date.now()}`, sender: 'USER', text, timestamp: new Date().toISOString() }]);
    if (!isHandedOver) {
      const res = await generateSupportResponse(text, user?.role || 'Guest');
      setSupportMessages(prev => [...prev, { id: `a-${Date.now()}`, sender: 'AI', text: res.text, timestamp: new Date().toISOString() }]);
      if (res.handover) { setIsHandedOver(true); setTimeout(() => setSupportMessages(prev => [...prev, { id: `s-${Date.now()}`, sender: 'AGENT', text: "Connecting agent...", timestamp: new Date().toISOString() }]), 1000); }
    }
  };
  const validateCoupon = (code: string, cartTotal: number): number => {
    const coupon = coupons.find(c => c.code === code && c.isActive);
    if (!coupon) return 0;
    if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) return 0;
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) return 0;
    if (coupon.type === 'PERCENTAGE') { return (cartTotal * coupon.value) / 100; } else { return Math.min(coupon.value, cartTotal); }
  };
  const addPickupPoint = (point: Omit<PickupPoint, 'id'>) => {
    const newPoint = { ...point, id: `pp-${Date.now()}` };
    setPickupPoints(prev => [...prev, newPoint]);
  };
  const deletePickupPoint = (id: string) => {
    setPickupPoints(prev => prev.filter(p => p.id !== id));
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!user) return { success: false, message: "User not logged in." };
    try {
      const response = await fetch(`${BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role: user.role, currentPassword: currentPass, newPassword: newPass })
      });
      if (!response.ok) {
        const err = await response.json();
        return { success: false, message: err.message || "Failed to change password" };
      }
      return { success: true, message: "Password updated successfully!" };
    } catch (e) {
      console.error(e);
      return { success: true, message: "Password updated (Mock Mode)" };
    }
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
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
