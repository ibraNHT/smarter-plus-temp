export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    register: '/api/auth/register',
    verifyEmail: '/api/auth/verify-email',
    changePassword: '/api/auth/change-password',
    forgotPassword: '/api/auth/forgot-password',
    forgotPasswordVerifyOtp: '/api/auth/forgot-password/verify-otp',
    resetPassword: '/api/auth/reset-password',
  },
  ai: {
    supportChat: '/api/ai/support-chat',
    generateDescription: '/api/ai/generate-description',
  },
  support: {
    base: '/api/support',
    sessions: '/api/support/sessions',
    sessionMessages: (sessionId: string) => `/api/support/sessions/${sessionId}/messages`,
    guestSessionMessages: (sessionId: string, guestEmail: string) =>
      `/api/support/guest/sessions/${sessionId}/messages?guestEmail=${encodeURIComponent(guestEmail)}`,
    guestSessionMessagesPost: (sessionId: string) => `/api/support/guest/sessions/${sessionId}/messages`,
  },
  chat: {
    sessions: '/api/chat/sessions',
    sessionMessages: (chatId: string) => `/api/chat/sessions/${chatId}/messages`,
    proposalAction: (messageId: string) => `/api/chat/messages/${messageId}/proposal`,
  },
  notifications: {
    list: '/api/notifications',
    markRead: '/api/notifications/read',
  },
  orders: {
    my: '/api/orders/my-orders',
    producer: '/api/orders/producer-orders',
    create: '/api/orders',
    confirm: (orderId: string) => `/api/orders/${orderId}/confirm`,
    reject: (orderId: string) => `/api/orders/${orderId}/reject`,
    cancel: (orderId: string) => `/api/orders/${orderId}/cancel`,
    pay: (orderId: string) => `/api/orders/${orderId}/pay`,
    deliver: (orderId: string) => `/api/orders/${orderId}/deliver`,
    confirmReceipt: (orderId: string) => `/api/orders/${orderId}/confirm-receipt`,
    dispute: (orderId: string) => `/api/orders/${orderId}/dispute`,
  },
  users: {
    myReferrals: '/api/users/me/referrals',
  },
  referralPrograms: {
    active: '/api/referral-programs/active',
  },
  profiles: {
    producer: '/api/profiles/producer',
    client: '/api/profiles/client',
    meClient: '/api/profiles/me/client',
  },
  producers: {
    list: '/api/producers',
    update: (producerId: string) => `/api/producers/${producerId}`,
    availability: (producerId: string) => `/api/producers/${producerId}/availability`,
    validate: (producerId: string) => `/api/producers/${producerId}/validate`,
  },
  clients: {
    list: '/api/clients',
    me: '/api/clients/me',
    update: (clientId: string) => `/api/clients/${clientId}`,
  },
  offers: {
    list: '/api/offers',
    create: '/api/offers',
    update: (offerId: string) => `/api/offers/${offerId}`,
  },
  pickupPoints: {
    list: '/api/pickup-points',
  },
  wallet: {
    me: '/api/wallet/me',
    withdrawals: '/api/wallet/me/withdrawals',
    fund: '/api/wallet/fund',
    withdraw: '/api/wallet/withdraw',
  },
  portfolios: {
    list: '/api/portfolios',
    create: '/api/portfolios',
    update: (portfolioId: string) => `/api/portfolios/${portfolioId}`,
    remove: (portfolioId: string) => `/api/portfolios/${portfolioId}`,
  },
  reviews: {
    create: '/api/reviews',
    byUser: (userId: string) => `/api/reviews/user/${userId}`,
  },
  coupons: {
    validate: '/api/coupons/validate',
  },
  otp: {
    request: '/api/otp/request',
    verify: '/api/otp/verify',
  },
  cart: {
    get: '/api/cart',
    sync: '/api/cart/sync-cart',
  },
  upload: {
    avatar: '/api/upload/avatar',
    offerImage: '/api/upload/offer-image',
    portfolioImage: '/api/upload/portfolio-image',
    portfolioVideo: '/api/upload/portfolio-video',
    evidence: '/api/upload/evidence',
  },
} as const;
