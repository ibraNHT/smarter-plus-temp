export const API_ENDPOINTS = {
  auth: {
    login: '/client-api/auth/login',
    logout: '/client-api/auth/logout',
    refresh: '/client-api/auth/refresh',
    register: '/client-api/auth/register',
    verifyEmail: '/client-api/auth/verify-email',
    changePassword: '/client-api/auth/change-password',
    forgotPassword: '/client-api/auth/forgot-password',
    forgotPasswordVerifyOtp: '/client-api/auth/forgot-password/verify-otp',
    resetPassword: '/client-api/auth/reset-password',
  },
  ai: {
    supportChat: '/client-api/ai/support-chat',
    generateDescription: '/client-api/ai/generate-description',
  },
  support: {
    base: '/client-api/support',
    sessions: '/client-api/support/sessions',
    sessionMessages: (sessionId: string) => `/api/support/sessions/${sessionId}/messages`,
    guestSessionMessages: (sessionId: string, guestEmail: string) =>
      `/api/support/guest/sessions/${sessionId}/messages?guestEmail=${encodeURIComponent(guestEmail)}`,
    guestSessionMessagesPost: (sessionId: string) => `/api/support/guest/sessions/${sessionId}/messages`,
  },
  chat: {
    sessions: '/client-api/chat/sessions',
    sessionMessages: (chatId: string) => `/api/chat/sessions/${chatId}/messages`,
    proposalAction: (messageId: string) => `/api/chat/messages/${messageId}/proposal`,
  },
  notifications: {
    list: '/client-api/notifications',
    markRead: '/client-api/notifications/read',
  },
  orders: {
    my: '/client-api/orders/my-orders',
    producer: '/client-api/orders/producer-orders',
    create: '/client-api/orders',
    confirm: (orderId: string) => `/api/orders/${orderId}/confirm`,
    reject: (orderId: string) => `/api/orders/${orderId}/reject`,
    cancel: (orderId: string) => `/api/orders/${orderId}/cancel`,
    pay: (orderId: string) => `/api/orders/${orderId}/pay`,
    deliver: (orderId: string) => `/api/orders/${orderId}/deliver`,
    confirmReceipt: (orderId: string) => `/api/orders/${orderId}/confirm-receipt`,
    dispute: (orderId: string) => `/api/orders/${orderId}/dispute`,
  },
  users: {
    myReferrals: '/client-api/users/me/referrals',
  },
  referralPrograms: {
    active: '/client-api/referral-programs/active',
  },
  profiles: {
    producer: '/client-api/profiles/producer',
    client: '/client-api/profiles/client',
    meClient: '/client-api/profiles/me/client',
  },
  producers: {
    list: '/client-api/producers',
    update: (producerId: string) => `/api/producers/${producerId}`,
    availability: (producerId: string) => `/api/producers/${producerId}/availability`,
    validate: (producerId: string) => `/api/producers/${producerId}/validate`,
  },
  clients: {
    list: '/client-api/clients',
    me: '/client-api/clients/me',
    update: (clientId: string) => `/api/clients/${clientId}`,
  },
  offers: {
    list: '/client-api/offers',
    create: '/client-api/offers',
    update: (offerId: string) => `/api/offers/${offerId}`,
  },
  pickupPoints: {
    list: '/client-api/pickup-points',
  },
  wallet: {
    me: '/client-api/wallet/me',
    withdrawals: '/client-api/wallet/me/withdrawals',
    fund: '/client-api/wallet/fund',
    withdraw: '/client-api/wallet/withdraw',
  },
  portfolios: {
    list: '/client-api/portfolios',
    create: '/client-api/portfolios',
    update: (portfolioId: string) => `/api/portfolios/${portfolioId}`,
    remove: (portfolioId: string) => `/api/portfolios/${portfolioId}`,
  },
  reviews: {
    create: '/client-api/reviews',
    byUser: (userId: string) => `/api/reviews/user/${userId}`,
  },
  coupons: {
    validate: '/client-api/coupons/validate',
  },
  otp: {
    request: '/client-api/otp/request',
    verify: '/client-api/otp/verify',
  },
  cart: {
    get: '/client-api/cart',
    sync: '/client-api/cart/sync-cart',
  },
  upload: {
    avatar: '/client-api/upload/avatar',
    offerImage: '/client-api/upload/offer-image',
    portfolioImage: '/client-api/upload/portfolio-image',
    portfolioVideo: '/client-api/upload/portfolio-video',
    evidence: '/client-api/upload/evidence',
  },
} as const;
