
import { ProducerProfile, ClientProfile, Offer, UserRole, ProducerStatus, OfferType, UnitOfMeasure, MarketType, Order, OrderStatus, Wallet, TransactionType, ExternalTransactionRecord, Portfolio, WeeklySchedule, Coupon, PickupPoint } from '../types';

// Default Schedule: Mon-Fri 9-5
export const defaultSchedule: WeeklySchedule = {
  'Monday': [{ start: '09:00', end: '17:00' }],
  'Tuesday': [{ start: '09:00', end: '17:00' }],
  'Wednesday': [{ start: '09:00', end: '17:00' }],
  'Thursday': [{ start: '09:00', end: '17:00' }],
  'Friday': [{ start: '09:00', end: '17:00' }],
  'Saturday': [{ start: '09:00', end: '12:00' }], // Half day
  'Sunday': [] // Off
};

// Pickup Points Mock
export const initialPickupPoints: PickupPoint[] = [
  { id: 'pp-1', name: 'Total Station Bastos', region: 'Center', city: 'Yaoundé', address: 'Bastos Main Road, near Embassy' },
  { id: 'pp-2', name: 'Mokolo Market Office', region: 'Center', city: 'Yaoundé', address: 'Mokolo Market Entrance B' },
  { id: 'pp-3', name: 'Akwa Post Office', region: 'Littoral', city: 'Douala', address: 'Bd de la Liberté, Akwa' },
  { id: 'pp-4', name: 'Bonamoussadi Carrefour', region: 'Littoral', city: 'Douala', address: 'Carrefour Market Parking' },
  { id: 'pp-5', name: 'Bafoussam Central', region: 'West', city: 'Bafoussam', address: 'Place des Fêtes' }
];

// Initial Data
export const initialProducers: ProducerProfile[] = [
  {
    id: 'prod-1',
    type: 'BUSINESS',
    name: 'Green Valley Farms',
    email: 'contact@greenvalley.com',
    phone: '+237 600000001',
    description: 'Organic vegetables straight from the soil. Selling in bulk.',
    locations: [{ lat: 5.4777, lng: 10.4176, address: 'Main Road', region: 'West', city: 'Bafoussam' }],
    certifications: ['organic_cert.pdf', 'business_license.png'],
    productionTypes: ['Agriculture', 'Vegetables', 'Processed foods', 'Service'],
    status: ProducerStatus.VALIDATED,
    paymentMethods: [],
    joinedDate: new Date().toISOString(),
    availability: defaultSchedule,
    exceptions: [],
    favorites: [],
    searchHistory: [],
    referralCode: 'GVF001',
    referrals: []
  },
  {
    id: 'prod-2',
    type: 'INDIVIDUAL',
    name: 'John Highland',
    firstName: 'John',
    lastName: 'Highland',
    gender: 'MALE',
    dateOfBirth: '1985-05-20',
    email: 'info@highlandranch.com',
    phone: '+237 600000002',
    description: 'Premium livestock and dairy products.',
    locations: [{ lat: 5.9631, lng: 10.1591, address: 'Hilltop Area', region: 'North West', city: 'Bamenda' }],
    certifications: ['Verified'],
    productionTypes: ['Livestock farming', 'Processed foods', 'Fish Farming'],
    status: ProducerStatus.VALIDATED,
    paymentMethods: [],
    joinedDate: new Date().toISOString(),
    availability: defaultSchedule,
    exceptions: [],
    favorites: [],
    searchHistory: [],
    referralCode: 'JHL002',
    referrals: []
  },
  {
    id: 'prod-3',
    type: 'BUSINESS',
    name: 'Savannah Agro Services',
    email: 'services@savannah.com',
    phone: '+237 600000003',
    description: 'Agricultural equipment and professional services.',
    locations: [{ lat: 7.3191, lng: 13.5821, address: 'Industrial Zone', region: 'Adamaoua', city: 'Ngaoundere' }],
    certifications: [],
    productionTypes: ['Equipment', 'Service'],
    status: ProducerStatus.VALIDATED,
    paymentMethods: [],
    joinedDate: new Date().toISOString(),
    availability: defaultSchedule,
    exceptions: [],
    favorites: [],
    searchHistory: [],
    referralCode: 'SAS003',
    referrals: []
  },
  {
    id: 'ati-admin',
    type: 'BUSINESS',
    name: 'ATI Official Store',
    email: 'store@ati.com',
    phone: '+000000000',
    description: 'Official ATI Retail Store for daily groceries.',
    locations: [{ lat: 3.8480, lng: 11.5021, address: 'HQ', region: 'Center', city: 'Yaoundé' }],
    certifications: ['Official'],
    productionTypes: ['Retail', 'Cereals', 'Oils', 'Canned Goods', 'Spices', 'Processed foods', 'Vegetables', 'Fish Farming'],
    status: ProducerStatus.VALIDATED,
    paymentMethods: [],
    joinedDate: new Date().toISOString(),
    availability: defaultSchedule,
    exceptions: [],
    favorites: [],
    searchHistory: [],
    referralCode: 'ATIADMIN',
    referrals: []
  }
];

export const initialClients: ClientProfile[] = [
  {
    id: 'client-demo',
    name: 'Jane Doe',
    firstName: 'Jane',
    lastName: 'Doe',
    gender: 'FEMALE',
    email: 'jane@example.com',
    phone: '+237 699999999',
    locations: [{ lat: 3.8667, lng: 11.5167, address: 'Bastos', region: 'Center', city: 'Yaoundé' }],
    joinedDate: new Date().toISOString(),
    favorites: [],
    searchHistory: [],
    lastLogin: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago (simulates absence)
    referralCode: 'JANE001',
    referrals: []
  }
];

// Helper to generate ID
const genId = (prefix: string, index: number) => `${prefix}-${index}`;

export const initialOffers: Offer[] = [
  {
    id: genId('ag', 1), producerId: 'prod-1', title: 'Yellow Corn (Dried)', description: 'High quality dried yellow corn, suitable for animal feed or processing.',
    category: 'Agriculture', type: OfferType.PRODUCT, marketType: MarketType.PRODUCER, unit: UnitOfMeasure.KG, quantity: 5000, price: 250, imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80', 
    isNegotiable: true, isDeliveryAvailable: true, offerLocation: 'West Region, Bafoussam', minQuantity: 50, maxQuantity: 5000, createdAt: new Date().toISOString()
  },
  {
    id: genId('veg', 1), producerId: 'prod-1', title: 'Fresh Tomatoes (Crate)', description: 'Ripe, juicy tomatoes harvested this morning. Sold by the crate.',
    category: 'Vegetables', type: OfferType.PRODUCT, marketType: MarketType.PRODUCER, unit: UnitOfMeasure.CRATE, quantity: 100, price: 15000, imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    isNegotiable: true, isDeliveryAvailable: false, offerLocation: 'West Region, Bafoussam', minQuantity: 1, maxQuantity: 10, createdAt: new Date().toISOString()
  },
  {
    id: genId('srv', 1), producerId: 'prod-3', title: 'Tractor Rental', description: 'Heavy duty tractor rental for plowing. Operator included.',
    category: 'Service', type: OfferType.SERVICE, marketType: MarketType.PRODUCER, unit: UnitOfMeasure.HOUR, quantity: 100, price: 25000, imageUrl: 'https://images.unsplash.com/photo-1592079927431-3f8c4954922f?auto=format&fit=crop&w=800&q=80',
    isNegotiable: true, isDeliveryAvailable: true, offerLocation: 'Adamaoua, Ngaoundere', minQuantity: 4, maxQuantity: 8, serviceDuration: 4, createdAt: new Date().toISOString()
  },
  {
    id: genId('ati', 1), producerId: 'ati-admin', title: 'ATI Premium Rice (5kg)', description: 'Fragrant long-grain rice, cleaned and packaged by ATI.',
    category: 'Cereals', type: OfferType.PRODUCT, marketType: MarketType.ATI, unit: UnitOfMeasure.UNIT, quantity: 500, price: 4500, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    isNegotiable: false, isDeliveryAvailable: true, offerLocation: 'Yaoundé, Center', minQuantity: 1, maxQuantity: 20, createdAt: new Date().toISOString()
  },
  {
    id: genId('ati', 2), producerId: 'ati-admin', title: 'Refined Palm Oil (1L)', description: 'Pure palm oil for cooking.',
    category: 'Oils', type: OfferType.PRODUCT, marketType: MarketType.ATI, unit: UnitOfMeasure.LITER, quantity: 200, price: 1200, imageUrl: 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?auto=format&fit=crop&w=800&q=80',
    isNegotiable: false, isDeliveryAvailable: true, offerLocation: 'Yaoundé, Center', minQuantity: 1, maxQuantity: 12, createdAt: new Date().toISOString()
  },
  {
    id: genId('lv', 1), producerId: 'prod-2', title: 'Live Chickens (Layers)', description: 'Healthy layers ready for egg production.',
    category: 'Livestock farming', type: OfferType.PRODUCT, marketType: MarketType.PRODUCER, unit: UnitOfMeasure.UNIT, quantity: 200, price: 3500, imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
    isNegotiable: true, isDeliveryAvailable: true, offerLocation: 'North West, Bamenda', minQuantity: 10, maxQuantity: 100, createdAt: new Date().toISOString()
  },
  {
    id: genId('fish', 1), producerId: 'prod-2', title: 'Fresh Tilapia', description: 'Freshly harvested Tilapia from our ponds.',
    category: 'Fish Farming', type: OfferType.PRODUCT, marketType: MarketType.PRODUCER, unit: UnitOfMeasure.KG, quantity: 500, price: 1500, imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a2b7b?auto=format&fit=crop&w=800&q=80',
    isNegotiable: true, isDeliveryAvailable: true, offerLocation: 'North West, Bamenda', minQuantity: 5, maxQuantity: 100, createdAt: new Date().toISOString()
  },
  {
    id: genId('proc', 1), producerId: 'prod-1', title: 'Plantain Chips', description: 'Crispy salted plantain chips.',
    category: 'Processed foods', type: OfferType.PRODUCT, marketType: MarketType.PRODUCER, unit: UnitOfMeasure.BUNDLE, quantity: 200, price: 500, imageUrl: 'https://images.unsplash.com/photo-1566453839209-773df4057dc2?auto=format&fit=crop&w=800&q=80',
    isNegotiable: false, isDeliveryAvailable: true, offerLocation: 'West Region, Bafoussam', minQuantity: 10, maxQuantity: 200, createdAt: new Date().toISOString()
  }
];

// Pre-funded Wallets for Demo
export const initialWallets: Record<string, Wallet> = {
  'prod-1': {
    userId: 'prod-1',
    balance: 50000,
    transactions: [{
      id: 'tx-init-prod',
      userId: 'prod-1',
      type: TransactionType.DEPOSIT,
      amount: 50000,
      description: 'Initial Balance',
      date: new Date().toISOString()
    }]
  },
  'client-demo': {
    userId: 'client-demo',
    balance: 100000,
    transactions: [{
      id: 'tx-init-client',
      userId: 'client-demo',
      type: TransactionType.DEPOSIT,
      amount: 100000,
      description: 'Initial Demo Funds',
      date: new Date().toISOString()
    }]
  }
};

// Initial Orders Mock for History
export const initialOrders: Order[] = [
   {
     id: 'order-hist-1',
     clientId: 'client-demo',
     producerId: 'prod-1',
     items: [{...initialOffers[0], cartQuantity: 2}],
     subtotal: 500,
     serviceFee: 25,
     totalAmount: 525,
     platformCommission: 75,
     status: OrderStatus.DELIVERED,
     createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
     clientReviewed: true,
     producerReviewed: true,
     deliveryMethod: 'HOME'
   }
];

export const initialExternalRecords: ExternalTransactionRecord[] = [
  { referenceId: 'OM-12345', amount: 5000, isUsed: false, provider: 'ORANGE' },
  { referenceId: 'MOMO-67890', amount: 10000, isUsed: false, provider: 'MTN' },
  { referenceId: 'BANK-54321', amount: 50000, isUsed: false, provider: 'BANK' },
  { referenceId: 'TEST-1', amount: 500, isUsed: false, provider: 'ORANGE' },
];

export const initialPortfolios: Portfolio[] = [
  {
    id: 'port-1',
    producerId: 'prod-1',
    category: 'Agriculture',
    title: 'Our Harvest Process',
    description: 'See how we grow and harvest our organic corn and tubers with care.',
    imageUrls: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80'
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  }
];

export const initialCoupons: Coupon[] = [
  { id: 'c1', code: 'WELCOME10', type: 'PERCENTAGE', value: 10, isActive: true },
  { id: 'c2', code: 'SAVE1000', type: 'FIXED', value: 1000, minOrderAmount: 5000, isActive: true },
  { id: 'c3', code: 'AGRI20', type: 'PERCENTAGE', value: 20, isActive: true }
];
