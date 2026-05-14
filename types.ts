
export enum UserRole {
  GUEST = 'GUEST',
  PRODUCER = 'PRODUCER',
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT'
}

/** Response from GET /api/users/me/referrals (API: GetMyReferralsUseCase). */
export interface ReferredUserSummary {
  id: string;
  displayName: string;
  joinedDate: string;
}

/** Mirrors admin active program (GET /api/referral-programs/active & me/referrals). */
export interface ActiveReferralProgramPublic {
  id: string;
  name: string;
  description: string;
  referrerRewardAmount: number;
  refereeRewardAmount: number;
  currency: string;
  minimumPayoutThreshold: number;
  termsUrl: string;
}

export interface MyReferralsData {
  referralCode: string;
  totalReferred: number;
  referredUsers: ReferredUserSummary[];
  /** Active platform program from admin console (null if none configured). */
  activeProgram: ActiveReferralProgramPublic | null;
}

export enum ProducerStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED'
}

export enum OfferType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE'
}

export enum UnitOfMeasure {
  KG = 'KG',
  TON = 'TON',
  CRATE = 'CRATE',
  BUNDLE = 'BUNDLE',
  LITER = 'LITER',
  UNIT = 'UNIT',
  HOUR = 'HOUR',
  DAY = 'DAY',
  HECTARE = 'HECTARE',
  JOB = 'JOB'
}

export enum MarketType {
  PRODUCER = 'PRODUCER', // Bulk, Direct from independent farmers
  ATI = 'ATI'            // Retail, Managed by ATI
}

export enum OrderStatus {
  PENDING_VALIDATION = 'PENDING_VALIDATION',
  CONFIRMED_AWAITING_PAYMENT = 'CONFIRMED_AWAITING_PAYMENT',
  PAID_IN_PREPARATION = 'PAID_IN_PREPARATION',
  IN_TRANSIT = 'IN_TRANSIT', // Or "IN PROGRESS" for services
  DELIVERED = 'DELIVERED',   // Or "COMPLETED" for services
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTE = 'DISPUTE'
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT', // Mobile Money In
  PAYMENT = 'PAYMENT', // Buying goods
  RECEIVED = 'RECEIVED', // Getting paid for goods
  WITHDRAWAL = 'WITHDRAWAL', // Mobile Money Out
  REFUND = 'REFUND',
  PENDING = 'PENDING', // Funds held pending order settlement
  FEE = 'FEE' // Service fees
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED'
}

export interface PaymentMethod {
  id: string;
  provider: 'ORANGE' | 'MTN' | 'BANK';
  accountNumber: string; // Phone or IBAN
  accountName: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: WithdrawalStatus;
  requestDate: string;
  processedDate?: string;
  adminNote?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  reference?: string; // Mobile Money Ref
  date: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  pendingBalance?: number;
  transactions: WalletTransaction[];
}

// Mock External Record to simulate the "Data Records" we check against
export interface ExternalTransactionRecord {
  referenceId: string;
  amount: number;
  isUsed: boolean;
  provider: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
  link?: string; // Link to an offer or chat
}

export type ProducerType = 'BUSINESS' | 'INDIVIDUAL';

/** Persisted when a HOME order is placed; used to pre-select the same address next time. */
export interface PreferredHomeDeliverySnapshot {
  address: string;
  city: string;
  region: string;
  lat?: number;
  lng?: number;
}

export interface Location {
  /** Present when loaded from API (saved profile address). */
  id?: string;
  lat: number;
  lng: number;
  region: string;
  city: string;
  address: string;
  /** ISO timestamp from server when this row was last used for a HOME order. */
  lastUsedForOrderAt?: string;
}

// PICKUP POINTS (New)
export interface PickupPoint {
  id: string;
  name: string; // e.g. "Total Station Bastos"
  region: string;
  city: string;
  address: string; // Detailed description or landmark
}

// SCHEDULING TYPES
export interface TimeRange {
  start: string; // "09:00"
  end: string;   // "17:00"
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

// Key is DayOfWeek
export type WeeklySchedule = Record<string, TimeRange[]>;

export interface AvailabilityException {
  id: string;
  date: string; // ISO YYYY-MM-DD
  reason: string;
}

// PORTFOLIO TYPE (Sprint Improvement)
export interface Portfolio {
  id: string;
  producerId: string;
  category: string; // Linked to Offer Category
  title: string;
  description: string;
  imageUrls: string[]; // Max 10
  videoUrl?: string; // Max 1, 30 sec
  isPublished: boolean;
  createdAt: string;
}

export interface ProducerProfile {
  id: string;
  userId?: string;
  type: ProducerType; // New: Business vs Individual
  name: string; // Display Name (Business Name or "First Last")
  firstName?: string; // For Individual
  lastName?: string; // For Individual
  gender?: 'MALE' | 'FEMALE'; // For Individual
  dateOfBirth?: string; // For Individual

  email: string;
  phone: string;
  description: string;
  profileImageUrl?: string; // New

  locations: Location[]; // Refactored to Array
  preferredHomeDelivery?: PreferredHomeDeliverySnapshot | null;

  certifications: string[]; // URLs or filenames
  productionTypes: string[]; // e.g., 'Agriculture', 'Livestock'
  /** TIN / NIU for business producers (admin validation). */
  taxIdentificationNumber?: string;
  /** URL of tax clearance certificate upload. */
  taxClearanceCertificateUrl?: string;
  status: ProducerStatus;
  paymentMethods: PaymentMethod[];
  joinedDate: string;

  // Scheduling
  availability?: WeeklySchedule;
  exceptions?: AvailabilityException[];

  // Producer as Client features
  favorites: string[]; // List of Offer IDs or Producer IDs
  searchHistory: string[]; // List of search terms or categories

  // Referral System
  referralCode: string;
  referrals: string[]; // List of User IDs referred
  referredBy?: string; // ID of referrer
}

export interface ClientProfile {
  id: string;
  userId?: string;
  name: string; // Display Name
  firstName: string;
  lastName: string;
  gender?: 'MALE' | 'FEMALE';
  dateOfBirth?: string;
  email: string;
  phone: string;
  profileImageUrl?: string;
  locations: Location[]; // Refactored to Array
  joinedDate: string;
  preferredHomeDelivery?: PreferredHomeDeliverySnapshot | null;

  // New Features
  favorites: string[]; // List of Offer IDs or Producer IDs
  searchHistory: string[]; // List of search terms or categories
  lastLogin?: string;

  // Referral System
  referralCode: string;
  referrals: string[]; // List of User IDs referred
  referredBy?: string; // ID of referrer
}

export interface Offer {
  id: string;
  producerId: string;
  title: string;
  description: string;
  category: string;
  type: OfferType;
  marketType: MarketType; // New field to distinguish marketplaces
  unit: UnitOfMeasure;
  quantity: number;
  price: number;
  imageUrl: string;
  imageUrls?: string[];
  isNegotiable: boolean; // Sprint 6
  isDeliveryAvailable: boolean; // New field
  offerLocation: string; // New field
  minQuantity: number; // New field: Minimum order
  maxQuantity?: number; // New field: Maximum order per client

  serviceDuration?: number; // in Hours, for services

  reservedClientId?: string; // If set, only this client can see/buy (Personalized Offer)

  createdAt: string;
}

export interface CartItem extends Offer {
  cartQuantity: number;
  bookingDate?: string; // ISO string for start time if Service
}

export interface DisputeEvidence {
  id: string;
  uploaderId: string; // Client or Producer ID
  fileName: string;
  fileUrl: string; // Mock URL
  fileType: 'IMAGE' | 'DOCUMENT';
  uploadedAt: string;
}

// Coupon System
export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // Percentage (0-100) or Fixed Amount
  minOrderAmount?: number;
  expiryDate?: string;
  isActive: boolean;
}

export interface Order {
  id: string;
  clientId: string;
  producerId: string;
  /** Client display name when order is returned for producer (e.g. incoming orders) */
  clientDisplayName?: string;
  /** Producer display name when order is returned for client (e.g. "Sold by") */
  producerDisplayName?: string;
  items: CartItem[];

  // Financials
  subtotal: number; // Items * Price
  serviceFee: number; // 5% of Subtotal
  discountAmount?: number; // Amount deducted by coupon
  totalAmount: number; // Subtotal + ServiceFee - Discount
  platformCommission?: number; // 15% of Subtotal (Deducted from Producer)

  // Coupons
  appliedCoupon?: string;

  status: OrderStatus;
  createdAt: string;
  clientReviewed?: boolean; // Has client rated producer?
  producerReviewed?: boolean; // Has producer rated client?
  contactRevealed?: boolean; // New: Allows sharing phone/email after payment
  disputeReason?: string;
  disputeEvidence?: DisputeEvidence[];

  // Delivery
  requestedDeliveryDate?: string; // YYYY-MM-DD for ATI Retail Orders
  deliveryMethod?: 'HOME' | 'PICKUP'; // New
  pickupPointId?: string; // New
  /** HOME: address chosen at checkout (persisted on order; not profile order). */
  shippingAddress?: PreferredHomeDeliverySnapshot | null;
}

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  targetId: string; // The ID of the person being rated (Producer or Client)
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  /** From API when listing reviews (User row of reviewer). */
  reviewerDisplayName?: string;
  reviewerProfileImageUrl?: string | null;
}

// Chat & Negotiation Types
export enum ProposalStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COUNTERED = 'COUNTERED',
  /** Settled by another proposal for the same product in this chat; no longer actionable. */
  SUPERSEDED = 'SUPERSEDED',
}

export interface Proposal {
  offerId: string; // The original offer being negotiated
  pricePerUnit: number;
  quantity: number;
  status: ProposalStatus;
}

/**
 * Local-only delivery status used to drive WhatsApp-style optimistic UX.
 * Real "delivered" / "read" receipts would need a server-side acknowledgement
 * channel; today we only track the round-trip of the user's own POST.
 */
export type ChatMessageStatus = 'SENDING' | 'SENT' | 'FAILED';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string; // User ID
  text: string;
  proposal?: Proposal; // Optional attached proposal
  systemMessage?: boolean; // If true, rendered as a system notification
  createdAt: string;
  /**
   * Local-only fields for optimistic UX. Not present on server payloads.
   * `clientId` is the stable id assigned at compose time, used to swap
   * the optimistic bubble for the server record once the POST resolves.
   */
  status?: ChatMessageStatus;
  clientId?: string;
}

export interface ChatSession {
  id: string;
  participantIds: string[]; // [clientId, producerId]
  participantsData?: Array<{
    id: string;
    displayName?: string;
    email?: string;
    role?: string;
  }>;
  offerId?: string; // Context of the chat (optional)
  lastMessage: string;
  lastMessageAt: string;
  unreadCounts: Record<string, number>; // Map userId -> count
}

// Mock User Session (matches auth API response)
export interface UserSession {
  id: string;
  role: UserRole;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
  producerId?: string; // If role is PRODUCER
  clientId?: string;   // If role is CLIENT
}

// Support Chat Types
export interface SupportMessage {
  id: string;
  sender: 'USER' | 'AI' | 'AGENT';
  text: string;
  timestamp: string;
  /** Present only in admin context; omitted for customers from API. */
  internal?: boolean;
}

export interface SupportSession {
  sessionId: string;
  userId: string;
  userName: string;
  status: 'AI_HANDLING' | 'WAITING_FOR_AGENT' | 'AGENT_ACTIVE' | 'CLOSED';
  messages: SupportMessage[];
  lastActive: string;
  priority?: string | null;
  assignedToUserId?: string | null;
}
