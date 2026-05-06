export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    register: "/api/auth/register",
    verifyEmail: "/api/auth/verify-email",
    changePassword: "/api/auth/change-password",
    forgotPassword: "/api/auth/forgot-password",
    forgotPasswordVerifyOtp: "/api/auth/forgot-password/verify-otp",
    resetPassword: "/api/auth/reset-password",
  },
  otp: {
    request: "/api/otp/request",
    verify: "/api/otp/verify",
  },
  users: {
    myReferrals: "/api/users/me/referrals",
  },
  referralPrograms: {
    active: "/api/referral-programs/active",
  },
  profiles: {
    client: "/api/profiles/client",
    producer: "/api/profiles/producer",
    meClient: "/api/profiles/me/client",
    upgradeToProducer: "/api/profiles/upgrade-to-producer",
  },
  producers: {
    list: "/api/producers",
    update: (id: string) => `/api/producers/${id}`,
    validate: (id: string) => `/api/producers/${id}/validate`,
    availability: (id: string) => `/api/producers/${id}/availability`,
  },
  clients: {
    list: "/api/clients",
    me: "/api/clients/me",
    update: (id: string) => `/api/clients/${id}`,
  },
  offers: {
    list: "/api/offers",
    create: "/api/offers",
    update: (id: string) => `/api/offers/${id}`,
    remove: (id: string) => `/api/offers/${id}`,
  },
  orders: {
    my: "/api/orders/my-orders",
    producer: "/api/orders/producer-orders",
    create: "/api/orders",
    confirm: (id: string) => `/api/orders/${id}/confirm`,
    reject: (id: string) => `/api/orders/${id}/reject`,
    cancel: (id: string) => `/api/orders/${id}/cancel`,
    pay: (id: string) => `/api/orders/${id}/pay`,
    deliver: (id: string) => `/api/orders/${id}/deliver`,
    confirmReceipt: (id: string) => `/api/orders/${id}/confirm-receipt`,
    dispute: (id: string) => `/api/orders/${id}/dispute`,
  },
  cart: {
    get: "/api/cart",
    /** Aligned with Nest: `CartController` @Post("sync-cart") */
    sync: "/api/cart/sync-cart",
    clear: "/api/cart",
  },
  chat: {
    sessions: "/api/chat/sessions",
    sessionMessages: (chatId: string) =>
      `/api/chat/sessions/${chatId}/messages`,
    proposalAction: (messageId: string) => `/api/chat/messages/${messageId}/proposal`,
  },
  notifications: {
    list: "/api/notifications",
    markRead: "/api/notifications/read",
  },
  wallet: {
    me: "/api/wallet/me",
    fund: "/api/wallet/fund",
    withdraw: "/api/wallet/withdraw",
    /** Aligned with Nest: `WalletController` @Get("me/withdrawals") */
    myWithdrawals: "/api/wallet/me/withdrawals",
  },
  reviews: {
    create: "/api/reviews",
    byUser: (userId: string) => `/api/reviews/user/${userId}`,
  },
  portfolios: {
    list: "/api/portfolios",
    publicByProducer: (producerId: string) => `/api/portfolios/producer/${producerId}/public`,
    create: "/api/portfolios",
    update: (id: string) => `/api/portfolios/${id}`,
    remove: (id: string) => `/api/portfolios/${id}`,
  },
  pickupPoints: {
    list: "/api/pickup-points",
  },
  coupons: {
    validate: "/api/coupons/validate",
  },
  upload: {
    avatar: "/api/upload/avatar",
    offerImage: "/api/upload/offer-image",
    portfolioImage: "/api/upload/portfolio-image",
    portfolioVideo: "/api/upload/portfolio-video",
    /** Images + PDF, max 10MB — use when Cloudinary is off (e.g. tax docs, certificates). */
    evidence: "/api/upload/evidence",
  },
  support: {
    sessions: "/api/support/sessions",
    sessionMessages: (sessionId: string) =>
      `/api/support/sessions/${sessionId}/messages`,
    guestSessionMessagesPost: (sessionId: string) =>
      `/api/support/sessions/${sessionId}/guest/messages`,
    guestSessionMessages: (sessionId: string, guestEmail: string) =>
      `/api/support/sessions/${sessionId}/guest/messages?guestEmail=${encodeURIComponent(guestEmail)}`,
  },
  ai: {
    supportChat: "/api/ai/support/chat",
    generateDescription: "/api/ai/generate-description",
  },
} as const;
