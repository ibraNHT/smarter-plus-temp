export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    me: "/api/auth/me",
    logout: "/api/auth/logout",
    register: "/api/auth/register",
    /** Phone-OTP step 1 — send the SMS+email verification code before registration. */
    registerRequestPhoneOtp: "/api/auth/register/request-phone-otp",
    /** Phone-OTP step 2 — verify the code and receive a short-lived `registrationToken`. */
    registerVerifyPhoneOtp: "/api/auth/register/verify-phone-otp",
    verifyEmail: "/api/auth/verify-email",
    changePassword: "/api/auth/change-password",
    verifyCurrentPassword: "/api/auth/verify-current-password",
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
    update: (id: string) => `/api/users/${id}`,
  },
  exchangeRates: {
    list: "/api/exchange-rates",
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
    availabilityByDate: (id: string, date: string, durationHours: number) =>
      `/api/producers/${id}/availability?date=${encodeURIComponent(date)}&durationHours=${encodeURIComponent(String(durationHours))}`,
    /** Producer's saved payout methods (list / create). */
    paymentMethods: (id: string) => `/api/producers/${id}/payment-methods`,
    /** A single saved payout method (update / delete). */
    paymentMethod: (id: string, methodId: string) =>
      `/api/producers/${id}/payment-methods/${methodId}`,
  },
  clients: {
    list: "/api/clients",
    me: "/api/clients/me",
    update: (id: string) => `/api/clients/${id}`,
  },
  offers: {
    list: "/api/offers",
    /** Official ATI retail catalog (all ATI marketType offers). */
    retailList: "/api/retail/offers",
    /** Single offer by id (public). Needed when the cached catalog list — which
     *  only holds the first page — doesn't contain it, e.g. after a hard reload
     *  straight onto the edit page. */
    detail: (id: string) => `/api/offers/${id}`,
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
    markDelivered: (id: string) => `/api/orders/${id}/mark-delivered`,
    confirmReceipt: (id: string) => `/api/orders/${id}/confirm-receipt`,
    complete: (id: string) => `/api/orders/${id}/complete`,
    requestCancellation: (id: string) => `/api/orders/${id}/request-cancellation`,
    appointment: (id: string) => `/api/orders/${id}/appointment`,
    dispute: (id: string) => `/api/orders/${id}/dispute`,
    revealContact: (id: string) => `/api/orders/${id}/reveal-contact`,
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
    markOneRead: (id: string) => `/api/notifications/${id}/read`,
    remove: (id: string) => `/api/notifications/${id}`,
    clear: "/api/notifications",
  },
  wallet: {
    me: "/api/wallet/me",
    fund: "/api/wallet/fund",
    withdraw: "/api/wallet/withdraw",
    /** Aligned with Nest: `WalletController` @Get("me/withdrawals") */
    myWithdrawals: "/api/wallet/me/withdrawals",
  },
  payments: {
    /** Start a Tranzak wallet top-up; returns a hosted paymentUrl to redirect to. */
    walletTopup: "/api/payments/wallet/topup",
    /** Poll a top-up's status by merchantRef. */
    topupStatus: (merchantRef: string) =>
      `/api/payments/topup/${encodeURIComponent(merchantRef)}/status`,
  },
  reviews: {
    create: "/api/reviews",
    byUser: (userId: string) => `/api/reviews/user/${userId}`,
    /** Public per-offer reviews — readable while signed out. */
    byOffer: (offerId: string) => `/api/reviews/offer/${offerId}`,
    all: "/api/reviews",
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
    requestAgent: (sessionId: string) =>
      `/api/support/sessions/${sessionId}/request-agent`,
    guestRequestAgent: (sessionId: string) =>
      `/api/support/guest/sessions/${sessionId}/request-agent`,
    guestSessionMessagesPost: (sessionId: string) =>
      `/api/support/guest/sessions/${sessionId}/messages`,
    guestSessionMessages: (sessionId: string, guestEmail: string) =>
      `/api/support/guest/sessions/${sessionId}/messages?guestEmail=${encodeURIComponent(guestEmail)}`,
  },
  ai: {
    supportChat: "/api/ai/support-chat",
    generateDescription: "/api/ai/generate-description",
  },
} as const;
