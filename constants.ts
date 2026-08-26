
import type { InventoryEventReason, InventoryItem, InventoryStatus } from './types';
import { convertAmount } from './lib/exchangeRates';

export const CURRENCIES = {
  XAF: { code: 'XAF', symbol: 'FCFA', precision: 0 },
  XOF: { code: 'XOF', symbol: 'CFA', precision: 0 },
  NGN: { code: 'NGN', symbol: '₦', precision: 2 },
  USD: { code: 'USD', symbol: '$ US', precision: 2 },
  CAD: { code: 'CAD', symbol: '$ CAD', precision: 2 },
  EUR: { code: 'EUR', symbol: '€', precision: 2 },
  GBP: { code: 'GBP', symbol: '£', precision: 2 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export const isSupportedCurrency = (value: unknown): value is CurrencyCode =>
  typeof value === 'string' && value in CURRENCIES;

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    loginWelcome: "Smarter Panel",
    loginToAccess: "Login to access your dashboard.",
    login: "Login",
    email: "Email",
    password: "Password",
    signupTitle: "Create your organization",
    signupSubtitle: "Start free with one user and one location. Complete your profile after signup.",
    otpTitle: "Enter verification code",
    otpSubtitle: "We sent a one-time code to your email.",
    inviteTitle: "Accept invitation",
    inviteSubtitle: "Set your password to join the organization.",
    organizationName: "Organization name",
    createOrganization: "Create an organization",
    createAccount: "Create account",
    noAccount: "New here?",
    haveAccount: "Already have an account?",
    pleaseWait: "Please wait…",
    otpCode: "Verification code",
    verifyOtp: "Verify",
    resendOtp: "Resend code",
    inviteToken: "Invite token",
    acceptInvite: "Continue",
    backToLogin: "Back to login",
    forgotPassword: "Forgot password?",
    forgotPasswordTitle: "Reset your password",
    forgotPasswordSubtitle: "Enter your email and we’ll send a verification code.",
    forgotResetTitle: "Choose a new password",
    forgotResetSubtitle: "Enter the code from your email and your new password.",
    sendResetCode: "Send reset code",
    resetPasswordSubmit: "Update password",
    forgotSuccess: "Password updated. You can log in with your new password.",
    devOtpHint: "Dev OTP (SMTP not configured)",
    orgProfileTitle: "Complete organization profile",
    orgProfileSubtitle: "Business details for your organization. Separate from your personal profile.",
    legalName: "Legal name",
    taxId: "Tax ID",
    saveOrgProfile: "Save organization profile",
    orgProfileSaved: "Organization profile saved",
    orgLogoHint: "Upload your organization logo (optional).",
    orgSectionIdentity: "Identity",
    workingCurrency: "Working currency",
    workingCurrencyHint: "Amounts you enter are stored in this currency. The header dropdown only converts for display using live rates.",
    locationCurrency: "Location currency",
    locationCurrencyHint: "Each site books amounts in its own currency. New locations default to the organization working currency.",
    displayCurrency: "Display currency",
    orgSectionContact: "Contact",
    orgSectionAddress: "Address",
    industry: "Industry",
    orgDescription: "About the organization",
    orgEmail: "Organization email",
    city: "City",
    country: "Country",
    postalCode: "Postal code",
    website: "Website",
    organization: "Organization",
    personalProfileTitle: "Complete your personal profile",
    personalProfileSubtitle: "Your personal details within this organization.",
    personalProfileSaved: "Personal profile saved",
    personalInfo: "Personal information",
    jobTitle: "Job title",
    owner: "Owner",
    billing: "Billing",
    billingSubtitle: "Manage your subscription plan and renewals.",
    currentPlan: "Current plan",
    plan: "Plan",
    dueDate: "Due date",
    choosePlan: "Choose a plan",
    subscribe: "Subscribe",
    unlimitedUsers: "Unlimited users",
    unlimitedLocations: "Unlimited locations",
    couponCode: "Coupon code",
    applyCoupon: "Apply",
    assignedCoupons: "Assigned to your org",
    couponApplied: "Coupon applied",
    couponInvalid: "Invalid coupon code",
    couponCheckoutActivated: "Subscription activated with your coupon — no payment required.",
    renewalWindowHint: "You can renew or change plans only within 5 days before or after your due date.",
    probationBanner: "Your organization is on free-tier probation. Only the owner can sign in until you subscribe again.",
    paymentSimulated: "Payment marked successful (dev).",
    sendInvite: "Send invite",
    inviteEmailHint: "Invite a teammate by email. They will receive a link, set their password, and verify with OTP.",
    inviteSent: "Invitation sent",
    inviteResent: "Invitation resent",
    inviteEmailFailed: "Email could not be sent — check SMTP or resend later",
    pendingInvites: "Pending invitations",
    resendInvite: "Resend",
    inviteFromStaff: "Invite from staff",
    dashboard: "Dashboard",
    income: "Income",
    expenses: "Expenses",
    inventory: "Inventory",
    hr: "HR",
    reports: "Reports",
    estimates: "Estimates",
    admin: "Admin",
    logout: "Logout",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    netBalance: "Net Balance",
    inventoryValue: "Inventory Value",
    recentActivity: "Recent Activity",
    add: "Add",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    editUser: "Edit user",
    saveChanges: "Save changes",
    actions: "Actions",
    source: "Source",
    amount: "Amount",
    date: "Date",
    description: "Description",
    category: "Category",
    item: "Item",
    type: "Type",
    quantity: "Quantity",
    value: "Value",
    firstName: "First Name",
    lastName: "Last Name",
    position: "Position",
    status: "Status",
    documents: "Documents",
    upload: "Upload",
    download: "Download",
    view: "View",
    back: "Back",
    profile: "My Profile",
    address: "Address",
    phone: "Phone",
    gender: "Gender",
    dob: "Date of Birth",
    hireDate: "Hire Date",
    terminationDate: "Termination Date",
    allLocations: "All Locations",
    selectLocation: "Select Location",
    changePassword: "Change Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    passwordMismatch: "Passwords do not match.",
    passwordChanged: "Password changed successfully.",
    resetPassword: "Reset Password",
    resetSuccess: "Password reset. Temp password: ",
    oldPassword: "Current Password",
    oldPasswordRequired: "Current password is required",
    confirmDelete: "Confirm Delete",
    deactivate: "Deactivate",
    reactivate: "Reactivate",
    remove: "Remove",
    confirmDeactivateUser: "Deactivate this user? They will no longer be able to log in.",
    confirmRemoveUser: "Permanently remove this user? This cannot be undone.",
    userDeactivated: "User deactivated",
    userReactivated: "User reactivated",
    userRemoved: "User removed",
    active: "Active",
    inactive: "Inactive",
    deleteStaffConfirm: "Are you sure you want to delete this staff member?",
    noUserAccount: "This staff member has no user account",
    uploadDocument: "Upload Document",
    documentName: "Document Name",
    documentType: "Document Type",
    selectFile: "Select File",
    updatePermissions: "Update Permissions",
    positions: "Positions",
    noDocuments: "No documents uploaded yet",
    permissionsSelected: "permissions selected",
    perm_viewDashboard: "View Dashboard",
    perm_viewIncome: "View Income",
    perm_addIncome: "Add Income",
    perm_deleteIncome: "Delete Income",
    perm_viewExpenses: "View Expenses",
    perm_addExpenses: "Add Expenses",
    perm_deleteExpenses: "Delete Expenses",
    perm_manageCategories: "Manage Categories",
    perm_viewInventory: "View Inventory",
    perm_addInventory: "Add Inventory",
    perm_updateInventory: "Update Inventory / Report Incidents",
    perm_deleteInventory: "Delete Inventory",
    perm_manageTypes: "Manage Inventory Types",
    perm_viewHR: "View HR",
    perm_addHR: "Add Employee",
    perm_updateHR: "Update Employee",
    perm_deleteHR: "Delete Employee",
    perm_manageHRUploads: "Manage HR Documents",
    perm_managePositions: "Manage Positions",
    perm_manageDocs: "Manage Documents",
    perm_viewReports: "View Reports",
    perm_viewEstimates: "View Estimates",
    perm_addEstimates: "Add Estimates",
    perm_updateEstimates: "Update Estimates",
    perm_deleteEstimates: "Delete Estimates",
    perm_manageEstimateTemplates: "Manage Estimate Templates",
    perm_viewAdmin: "Admin Access",
    perm_manageAdminUsers: "Admin: User Management tab",
    perm_manageAdminRoles: "Admin: Role Management tab",
    perm_manageAdminConfig: "Admin: Config (locations, categories, types, positions, sources, descriptions, storage places)",
    adminNoSubPermission: "You don't have permission to manage any settings. Contact an administrator to get access to User Management, Role Management, or Config.",
    perm_allLocations: "All Locations Access",
    manage_users: "Manage Users (create, edit, delete, reset password for any user)",
    perm_resetUserPassword: "Reset User Password (users in your location only)",
    perm_deactivateUser: "Deactivate users",
    perm_removeUser: "Remove users",
    errorFillFields: "Please fill all required fields.",
    errorDateFuture: "Date cannot be in the future.",
    errorDatePast: "Date cannot be older than 7 days.",
    errorNoLocation: "Please select a specific location.",
    userManagement: "User Management",
    roleManagement: "Role Management",
    locationManagement: "Locations",
    configManagement: "Configurations",
    generateReport: "Generate Report",
    forecast: "Financial Forecast",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    allTime: "All Time",
    dateRange: "Date Range",
    dateFrom: "From",
    dateTo: "To",
    last7Days: "Last 7 days",
    thisMonth: "This month",
    thisYear: "This year",
    last12Months: "Last 12 months",
    incomeVsExpenses: "Income vs Expenses",
    incomeBySource: "Income by Source",
    expensesByCategory: "Expenses by Category",
    financialOverview: "Financial Overview",
    financialHealth: "Financial Health",
    netTrend: "Net Balance Trend",
    showCharts: "Show charts",
    hideCharts: "Hide charts",
    downloadCSV: "Download CSV",
    downloadExcel: "Download Excel",
    forecastTitle: "Projected Financials",
    forecastDesc: "Based on historical average",
    managePermissions: "Manage Permissions",
    roleName: "Role Name",
    permissions: "Permissions",
    expenseCategories: "Expense Categories",
    inventoryTypes: "Inventory Types",
    incomeSources: "Income Sources",
    expenseDescriptions: "Expense Descriptions",
    storagePlaces: "Storage Places",
    name: "Name",
    nameFr: "Name (FR)",
    metric: "Metric",
    allMetrics: "All Metrics",
    incomeOnly: "Income Only",
    expensesOnly: "Expenses Only",
    inventoryOnly: "Inventory",
    specificLocation: "Specific Location",
    changePhoto: "Change Photo",
    updateProfile: "Update Profile",
    mandatoryReset: "Security Alert: You must change your password to continue.",
    hierarchyForbidden: "You cannot modify or delete a user who is above you in the hierarchy.",
    locked24hMessage: "Cannot modify or delete after 24 hours (fraud prevention).",
    auditLogs: "Audit Logs",
    perm_viewAuditLogs: "View Audit Logs",
    filterByLocation: "Location",
    filterByUser: "User",
    searchByName: "Search by name",
    filterByPosition: "Position",
    allPositions: "All positions",
    listView: "List view",
    gridView: "Grid view",
    auditAction: "Action",
    auditResource: "Resource",
    auditTime: "Time",
    auditDetails: "Details",
    auditUser: "User",
    auditLocation: "Location",
    noAuditLogs: "No audit logs found.",
    applyFilters: "Apply",
    clearFilters: "Clear",
    notifications: "Notifications",
    perm_viewNotifications: "View Notifications",
    noNotifications: "No notifications",
    themeToggle: "Toggle light/dark mode",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    installApp: "Install app",
    installAppHint: "Use Smarter Panel like a native app on your device.",
    installAppIosHint: "Tap Share, then Add to Home Screen.",
    installAppBrowserHint: "Open your browser menu and choose Install app or Add to Home Screen.",
    installAppDismiss: "Not now",
    errorNoInventory: "No inventory item selected.",
    inventoryDeleteConfirm: "Delete inventory item?",
    inventoryDeleteConfirmMsg: "Are you sure you want to delete this inventory item?",
    inventoryUpdateTitle: "Edit inventory item",
    inventoryReportIncident: "Report incident",
    inventoryOnHand: "On hand",
    inventoryOnHandShort: "Qty",
    inventoryUnitValue: "Unit value",
    inventoryUnitValueShort: "Unit",
    inventoryTotal: "Total",
    inventoryTotalShort: "Total",
    inventoryStatus: "Status",
    inventoryExpiry: "Expiry",
    inventoryLastUpdated: "Last updated",
    inventoryLastUpdatedShort: "Updated",
    inventoryExpiresOn: "Expires on",
    inventoryNotes: "Notes",
    inventoryImage: "Item image",
    inventoryStoragePlace: "Storage place",
    inventoryStoragePlaceShort: "Place",
    inventoryStoragePlaceHint: "Shelf, bin, cold room, zone…",
    inventorySiteLabel: "Business site",
    inventoryImageUploadFailed: "Failed to upload item image.",
    inventoryChangeImage: "Change image",
    inventorySearch: "Search items…",
    inventoryFilterStatus: "Status",
    inventoryFilterType: "Type",
    inventoryFilterAll: "All",
    inventoryExpiringSoon: "Expiring within 30 days",
    inventoryStatus_available: "Available",
    inventoryStatus_damaged: "Damaged",
    inventoryStatus_expired: "Expired",
    inventoryStatus_missing: "Missing",
    inventoryReason_damaged: "Damaged / broken",
    inventoryReason_expired: "Expired / spoiled",
    inventoryReason_stolen: "Stolen / missing",
    inventoryReason_restored: "Restored / found",
    inventoryReason_adjustment: "Quantity adjustment",
    inventoryIncidentReason: "Reason",
    inventoryIncidentQty: "Quantity",
    inventoryIncidentNote: "Note",
    inventoryIncidentNoteRequired: "A note is required for damaged or stolen incidents.",
    inventoryIncidentQtyInvalid: "Enter a valid quantity for this incident.",
    inventoryIncidentSuccess: "Incident recorded.",
    inventoryIncidentFailed: "Failed to record incident.",
    inventoryAdded: "Inventory item added successfully",
    inventoryUpdated: "Inventory item updated successfully",
    inventoryRemoved: "Inventory item removed successfully",
    inventoryNoPermAdd: "You do not have permission to add inventory items.",
    inventoryNoPermUpdate: "You do not have permission to update inventory.",
    inventoryNoPermDelete: "You do not have permission to delete inventory items.",
    inventoryHealth: "Inventory health",
    inventoryAvailableValue: "Available value",
    inventoryLossValue: "Loss value",
    inventoryUnitsLost: "Units lost",
    inventoryDamagedUnits: "Damaged",
    inventoryExpiredUnits: "Expired",
    inventoryStolenUnits: "Stolen",
    inventoryExpiringSoonCount: "Expiring soon",
    inventoryLossesByReason: "Inventory losses by reason",
    inventoryLossesSheet: "Inventory Losses",
    inventoryNoItems: "No inventory items match your filters.",
    newHire: "New hire",
    staffTerminationDate: "Termination date set",
    staffDeleted: "Staff account deleted",
    incomeDeleted: "Income deleted",
    expenseDeleted: "Expense deleted",
    inventoryDeleted: "Inventory item deleted",
    reportDownloaded: "Report downloaded",
    newEstimate: "New estimate",
    editEstimate: "Edit estimate",
    estimateTitle: "Title",
    estimateNumber: "Estimate #",
    estimateStatus: "Status",
    estimateCustomer: "Customer",
    estimateBusiness: "Business",
    estimateLineItems: "Line items",
    estimatePreview: "Preview",
    estimateTemplate: "Template",
    estimateIndustryTemplates: "Industry templates",
    estimateUserTemplates: "Your templates",
    archiveAsTemplate: "Archive as template",
    estimateLogo: "Logo",
    primaryColor: "Primary color",
    accentColor: "Accent color",
    estimateLayout: "Layout",
    layoutClassic: "Classic",
    layoutModern: "Modern",
    layoutCompact: "Compact",
    validUntil: "Valid until",
    issueDate: "Issue date",
    taxRate: "Tax %",
    subtotal: "Subtotal",
    taxAmount: "Tax",
    total: "Total",
    unitPrice: "Unit price",
    unit: "Unit",
    lineTotal: "Line total",
    terms: "Terms",
    notes: "Notes",
    exportCsv: "Export CSV",
    exportExcel: "Export Excel",
    exportPdf: "Print / PDF",
    copyPlainText: "Copy text",
    estimateDraft: "Draft",
    estimateSent: "Sent",
    estimateAccepted: "Accepted",
    estimateRejected: "Rejected",
    estimateArchived: "Archived",
    noEstimates: "No estimates yet.",
    searchEstimates: "Search estimates…",
    addLineItem: "Add line",
    removeLineItem: "Remove",
    customerName: "Customer name",
    customerEmail: "Customer email",
    customerPhone: "Customer phone",
    customerAddress: "Customer address",
    businessName: "Business name",
    businessAddress: "Business address",
    businessPhone: "Business phone",
    estimateSaved: "Estimate saved",
    estimateDeleted: "Estimate deleted",
    templateArchived: "Saved as template",
    pickTemplate: "Start from template",
    blankEstimate: "Blank estimate",

        // Marketing / Navigation
    navDescription: "Description",
    navPartners: "Our partners",
    navFeatures: "Features",
    navTestimonials: "Testimonials",
    navFaq: "FAQ",
    navBlog: "Blog",
    getStarted: "Get started",
    getItNow: "Get it now",
    trustedBy: "Trusted by the best companies",

    // Hero
    heroTitle: "Your new business companion ",
    heroHighlight: "SMARTER PANEL",
    heroSubtitle:
      "SMARTER PANEL is a comprehensive HR and Accounting management dashboard for business operations. Features include income/expense tracking, inventory management, staff administration, and financial reporting.",

    // Highlights
    highlightsTitle: "Highlights",
    highlightsDesc:
      "Explore why our product stands out: adaptability, durability, user-friendly design, and innovation. Enjoy reliable customer support and precision in every detail.",
    highlightAdaptableTitle: "Adaptable performance",
    highlightAdaptableDesc:
      "Our product effortlessly adjusts to your needs, boosting efficiency and simplifying your tasks.",
    highlightBuiltToLastTitle: "Built to last",
    highlightBuiltToLastDesc:
      "Experience unmatched durability that goes above and beyond with lasting investment.",
    highlightUserExperienceTitle: "Great user experience",
    highlightUserExperienceDesc:
      "Integrate our product into your routine with an intuitive and easy-to-use interface.",
    highlightInnovativeTitle: "Innovative functionality",
    highlightInnovativeDesc:
      "Stay ahead with features that set new standards, addressing your evolving needs better than the rest.",
    highlightSupportTitle: "Reliable support",
    highlightSupportDesc:
      "Count on our responsive customer support, offering assistance that goes beyond the purchase.",
    highlightPrecisionTitle: "Precision in every detail",
    highlightPrecisionDesc:
      "Enjoy a meticulously crafted product where small touches make a significant impact on your overall experience.",

    // Features
    featuresTitle: "Product features",
    featuresDesc:
      "Provide a brief overview of the key features of the product. For example, you could list the number of features, their types or benefits, and add-ons.",
    featureDashboardTitle: "Dashboard overview, financials, HR, operations and more features capabilities",
    featureDashboardDesc:
      "Our solution give users easy acces tools to manage their activity, from financials to operations, all in one place.",
    featureOfflineTitle: "Offline functionality integration",
    featureOfflineDesc:
      "Our product could provide offline functionality, allowing users to continue working even when they are not connected to the internet.",
    featureDevicesTitle: "Available for all devices",
    featureDevicesDesc:
      "This item could let users know the product is available on all platforms, such as web, mobile, and desktop.",

    // Testimonials
    testimonialsTitle: "Testimonials",
    testimonialsDesc:
      "See what our customers love about our products. Discover how we excel in efficiency, durability, and satisfaction. Join us for quality, innovation, and reliable support.",
    testimonial1Name: "Remy Sharp",
    testimonial1Occupation: "Senior Engineer",
    testimonial1Text:
      "I absolutely love how versatile this product is! Whether I'm tackling work projects or indulging in my favorite hobbies, it seamlessly adapts to my changing needs. Its intuitive design has truly enhanced my daily routine, making tasks more efficient and enjoyable.",
    testimonial2Name: "Travis Howard",
    testimonial2Occupation: "Lead Product Designer",
    testimonial2Text:
      "One of the standout features of this product is the exceptional customer support. In my experience, the team behind this product has been quick to respond and incredibly helpful. It's reassuring to know that they stand firmly behind their product.",
    testimonial3Name: "Cindy Baker",
    testimonial3Occupation: "CTO",
    testimonial3Text:
      "The level of simplicity and user-friendliness in this product has significantly simplified my life. I appreciate the creators for delivering a solution that not only meets but exceeds user expectations.",
    testimonial4Name: "Julia Stewart",
    testimonial4Occupation: "Senior Engineer",
    testimonial4Text:
      "I appreciate the attention to detail in the design of this product. The small touches make a big difference, and it's evident that the creators focused on delivering a premium experience.",
    testimonial5Name: "John Smith",
    testimonial5Occupation: "Product Designer",
    testimonial5Text:
      "I've tried other similar products, but this one stands out for its innovative features. It's clear that the makers put a lot of thought into creating a solution that truly addresses user needs.",
    testimonial6Name: "Daniel Wolf",
    testimonial6Occupation: "CDO",
    testimonial6Text:
      "The quality of this product exceeded my expectations. It's durable, well-designed, and built to last. Definitely worth the investment!",

    // Pricing
    pricingTitle: "Pricing",
    pricingDesc: "Chooze the subscription plan that's right for you and your team.",
    planFreeTitle: "Free",
    // planFreeDescription: ["1 user included", "1 location included", "Unlimited storage", "Report download", "Email support", "24/7 customer support"],
    planStarterTitle: "Starter",
    // planStarterDescription: ["2 users included", "2 locations included", "Unlimited storage", "Help center access", "report download", "Email support", "24/7 customer support"],
    planGrowthTitle: "Growth",
    // planGrowthDescription: ["5 users included", "3 locations included", "Unlimited storage", "Report download", "Help center access", "Priority email support", "Best deals", "24/7 customer support"],
    planEnterpriseTitle: "Enterprise",
    // planEnterpriseDescription: ["Unlimited users", "Unlimited locations", "unlimited storage", "Help center access priority", "Dedicated team", "Report download", "Phone & email support", "Priority email support", "24/7 customer support"],
    // In TRANSLATIONS.en
    planFreeDescription: "1 user included\n1 location included\nUnlimited storage\nReport download\nEmail support\n24/7 customer support",
    planStarterDescription: "2 users included\n2 locations included\nUnlimited storage\nHelp center access\nreport download\nEmail support\n24/7 customer support",
    planGrowthDescription: "5 users included\n3 locations included\nUnlimited storage\nReport download\nHelp center access\nPriority email support\nBest deals\n24/7 customer support",
    planEnterpriseDescription: "Unlimited users\nUnlimited locations\nunlimited storage\nHelp center access priority\nDedicated team\nReport download\nPhone & email support\nPriority email support\n24/7 customer support",
    planFreeButton: "Sign up for free",
    planStarterButton: "Get started",
    planGrowthButton: "Start now",
    planEnterpriseButton: "Go smarter",
    perMonth: "/ month",

    // FAQ
    faqTitle: "Frequently asked questions",
    faqQuestion1: "How do I sign in? What is the OTP flow?",
    faqAnswer1:
      "Sign in with your email and password, then verify using the one-time code sent to your email. Use the <strong>Resend code</strong> button if the code does not arrive. The app uses email OTP rather than password-only authentication for added security.",
    faqQuestion2: "I didn't receive an OTP or invite email — what should I do?",
    faqAnswer2:
      "Check your spam/junk folder and confirm the email is correct. Ask the sender to resend the invite or code. If the app shows SMTP or delivery errors, contact support or your organization administrator.",
    faqQuestion3: "How does offline mode and syncing work?",
    faqAnswer3:
      "The PWA can queue certain creates, updates and uploads in the browser (IndexedDB) while offline. When you reconnect the queued actions are synced to the server. Avoid clearing site data until sync completes to prevent data loss.",
    faqQuestion4: "Where can I find the Privacy Policy and Terms? How do I request data deletion?",
    faqAnswer4:
      "Privacy Policy and Terms links are available in the footer and on the Help Center. For data export or deletion requests contact the privacy contact listed on the Privacy Policy page (or email the organization owner/admin to initiate the request).",

    // Footer
    footerDescription: "Smarter Panel is a powerful and user-friendly platform that helps businesses streamline their operations.",
    footerProduct: "Product",
    footerDescriptionLink: "Description",
    footerFeaturesLink: "Features",
    footerTestimonialsLink: "Testimonials",
    footerPricingLink: "Pricing",
    footerHelpCenter: "Help Center",
    footerFaq: "FAQs",
    footerCompany: "Company",
    footerAboutUs: "About us",
    footerCareers: "Careers",
    footerPress: "Press",
    footerPrivacyPolicy: "Privacy Policy",
    footerTermsOfService: "Terms of Service",
    footerCopyright: "Copyright © {year} Smarter Panel",
    and: "and the",

    // Help Center page
    helpTitle: "Help Center — Smarter Panel",
    helpIntro:
      "Practical guide to using Smarter Panel. Below are topics to help you get started, troubleshoot common issues, and understand product limits and rules. For privacy and legal terms see the links at the bottom of the page.",
    helpGettingStartedTitle: "Getting started",
    helpGettingStartedText:
      "Create an organization from the login screen, set a password (min 6 chars) and verify using the code sent to your email. Complete the organization and personal profiles as prompted.",
    helpSignInTitle: "Sign in, OTP, and password reset",
    helpSignInText:
      "Smarter Panel uses email one-time codes (OTP) for login, signup and password reset. If you don’t receive a code check spam/junk and use the resend button. In dev environments a dev OTP may be shown on screen when SMTP is not configured.",
    helpInvitationsTitle: "Invitations",
    helpInvitationsText:
      "Admins invite users from Admin → Users. Invitees accept using the link or token in the email, set a password, then verify using an email code.",
    helpOfflineTitle: "Offline mode",
    helpOfflineText:
      "The PWA supports offline queues for some creates/updates/uploads. If you work offline, items are queued in the browser (IndexedDB) and synchronized when connectivity returns. Clearing site data can remove unsynced work.",
    helpSupportTitle: "Support",
    helpSupportText:
      "Use the floating Support chat in the app or email our support team at {email}.",
    helpDocLink: "For the full documentation see the ",

    // Privacy Policy page
    privacyTitle: "Privacy Policy — Smarter Panel",
    privacyIntro:
      "This page summarizes how Smarter Panel collects and processes data. This is a product-facing draft — have legal review for production.",
    privacyWhatCollectTitle: "What we collect",
    privacyWhatCollectText:
      "We collect account/profile data, organization data, operational business data (income, expenses, inventory, HR), billing and support communications, authentication data (OTP and tokens), and client-side caches for offline support.",
    privacyWhyProcessTitle: "Why we process data",
    privacyWhyProcessText:
      "To provide and secure the Service, support onboarding, billing, offline continuity, and legal compliance. We do not sell your personal information.",
    privacySharingTitle: "Sharing",
    privacySharingText:
      "We share data with your organization, our payment processor, email providers, hosting infrastructure, and when required by law.",
    privacyRetentionTitle: "Retention & deletion",
    privacyRetentionText:
      "Active data is retained while your organization uses the Service. Device caches persist until cleared. Contact privacy for export or deletion requests.",
    privacyContact: "Contact: {email}",

    // Terms page
    termsTitle: "Terms and Conditions — Smarter Panel",
    termsIntro:
      "These terms govern access and use of Smarter Panel. This is a product draft and should be reviewed by legal before publishing.",
    termsAccountsTitle: "Accounts and eligibility",
    termsAccountsText:
      "Organizations and owner accounts are responsible for profiles, users, subscriptions and compliance with these Terms.",
    termsSubscriptionsTitle: "Subscriptions and billing",
    termsSubscriptionsText:
      "Plans may limit users and locations. Owners manage billing and can upgrade or renew through the Billing UI. Checkout may use a third party payment provider.",
    termsRulesTitle: "Product rules",
    termsRulesText:
      "The product enforces practical rules such as 7-day date limits and 24-hour edit/delete locks on many records to reduce fraud and errors.",
    termsContact: "Contact legal: {email}",

    helpCenterContent: `
# Help Center — Smarter Panel

Practical guide to using **Smarter Panel**, based on the current application. The UI is available in **English** and **French** (language toggle in the header). Display currencies include **XAF**, **USD**, **EUR**, and **CAD** (display conversion; billing amounts are typically shown in XAF).

**Support:** use the floating **Support** chat in the app, or contact \`contact@acheteici.com\`.

---

## Contents

1. [Getting started](#1-getting-started)
2. [Sign in, OTP, and password reset](#2-sign-in-otp-and-password-reset)
3. [Invitations](#3-invitations)
4. [Navigation, locations, and languages](#4-navigation-locations-and-languages)
5. [Roles and permissions](#5-roles-and-permissions)
6. [Dashboard](#6-dashboard)
7. [Income](#7-income)
8. [Expenses](#8-expenses)
9. [Inventory](#9-inventory)
10. [HR](#10-hr)
11. [Reports](#11-reports)
12. [Estimates](#12-estimates)
13. [Admin](#13-admin)
14. [Organization profile](#14-organization-profile)
15. [Personal profile](#15-personal-profile)
16. [Billing](#16-billing)
17. [Audit logs and notifications](#17-audit-logs-and-notifications)
18. [Offline mode](#18-offline-mode)
19. [Support chat](#19-support-chat)
20. [Common limits and rules](#20-common-limits-and-rules)
21. [Troubleshooting](#21-troubleshooting)

---

## 1. Getting started

### Create an organization (owner)

1. On the login screen, choose **Create an organization**.  
2. Enter organization name, your name (optional fields as shown), email, and password (minimum **6** characters).  
3. Submit and enter the **verification code** emailed to you.  
4. After signup you typically land on a free plan with limited users and locations.

### Complete required profiles

Before the main app:

1. **Organization profile** (owners only, if not completed) — legal name, address, contact, tax ID, logo, and related fields.  
2. **Personal profile** — your name and other required personal details within the organization.

You can open **Organization** and **Profile** later from the sidebar (Organization is owner-only).

---

## 2. Sign in, OTP, and password reset

### Sign in

1. Enter email and password → **Login**.  
2. Enter the **one-time code** from email → **Verify**.  
3. Use **Resend code** if needed.

Smarter Panel uses email OTP for login (not password alone).

### Forgot password

1. On the login screen, click **Forgot password?**  
2. Enter your account email → **Send reset code**.  
3. On the next screen, enter the **6-digit code** from email, your **new password**, and confirmation → **Update password**.  
4. Sign in normally with the new password.

You receive a **verification code**, not a clickable reset link. For security, the app may show a generic success message even if the email is unknown.

### Forced password change

If an admin resets your password, you may be required to set a new password (current/temporary password + new password) before continuing.

### Sign out

Use **Logout** in the sidebar. This clears local session data (when using token auth).

---

## 3. Invitations

### For admins

In **Admin → Users** (permission required):

1. Send an invite with the teammate’s email and role (and locations if applicable).  
2. The invitee receives an email with an accept link (\`?invite=\` token).  
3. You can **Resend** pending invites if email delivery failed.

### For invitees

1. Open the invite link (or paste the invite token on the Accept invitation screen).  
2. Set first/last name and password → continue.  
3. Verify with the email OTP, then complete your personal profile if prompted.

---

## 4. Navigation, locations, and languages

- **Sidebar:** Dashboard, Income, Expenses, Inventory, HR, Reports, Estimates, Admin, Audit logs (if permitted), Organization (owner), Billing (owner), Profile, Logout.  
- **Location switcher (header):** filters data to a site. Users with all-locations access may choose **All**.  
- **Language:** EN / FR.  
- **Theme:** light / dark.  
- **Currency (header):** changes how amounts are **displayed**; it does not change stored transaction currency logic on the server.

Menu items appear only if your role has the matching **view** permission (Billing and Organization require **owner**).

---

## 5. Roles and permissions

Roles are defined per organization in **Admin → Roles**. Permissions cover view/add/update/delete for modules, admin configuration, audit logs, notifications, and user management actions (reset password, deactivate, remove, etc.).

Typical patterns:

- **Owner** — full business control, including Billing and Organization profile.  
- **Super admin / all-locations** — broad access across sites when configured.  
- **Location-scoped roles** — see and edit data only for assigned location(s).

If a page is missing or actions are disabled, ask your organization administrator—not necessarily platform support.

---

## 6. Dashboard

Shows high-level KPIs for the selected location (or all, if allowed):

- Total income, total expenses, net balance  
- Inventory value and inventory health / loss-related signals  

Use it for a quick operational snapshot; use **Reports** for deeper analysis and export.

---

## 7. Income

Record money received for a location:

- Amount, date, source, description (and related fields as shown)  
- Requires add/update/delete permissions as applicable  

**Date rule:** the transaction date generally cannot be older than **7 days**.  
**Edit/delete lock:** many records cannot be modified or deleted after **24 hours** (fraud prevention).

Sources may be suggested from Admin catalogs but free text may still be allowed.

---

## 8. Expenses

Same pattern as Income: amount, date, category/description, location scope, permissions, **7-day** date rule, and **24-hour** edit/delete lock.

Expense categories and descriptions can be managed under Admin catalogs.

---

## 9. Inventory

Manage stock lines:

- Name, type, quantity, value, status, expiry, notes, storage place, photo  
- **Incidents / events:** log damaged, expired, stolen, restored, or adjustments (with notes when required)  

Registration create/edit may lock some fields after **24 hours**; operational fields (quantity, status, notes, etc.) may remain editable per product rules.

Images are uploaded then saved on the inventory record.

---

## 10. HR

Manage staff profiles:

- Personal and employment details (name, DOB, gender, contacts, position, hire date, status, locations)  
- Upload and manage **staff documents**  
- Optionally link staff to user accounts / invites (as provided in the UI)

Requires HR-related permissions. Treat staff data as sensitive personal information.

---

## 11. Reports

Analytics and exports for income, expenses, inventory, and related views (charts, forecasts where available).

Exports may include **CSV**, **Excel (.xlsx)**, and print-oriented flows depending on the report. Exports run in the browser from data you can already access.

---

## 12. Estimates

Create professional quotes:

- Start blank or from a **template**  
- Customer and business blocks, line items, tax, totals, status (draft, sent, accepted, etc.)  
- Branding (logo, colors, layout)  
- Export CSV / Excel / print-ready PDF via the estimate preview  

Estimate template management may require a separate permission.

---

## 13. Admin

Admin is split into areas gated by permissions, for example:

- **Users** – Invite users, edit roles/locations, reset password (temporary password), deactivate/remove  
- **Roles** – Create roles and assign permission sets  
- **Config / catalogs** – Locations, expense categories, inventory types, positions, income sources, expense descriptions, storage places

Creating users or locations may fail if your **subscription limits** are reached—upgrade in Billing (owner) or free a seat/site.

---

## 14. Organization profile

**Owner only.** Maintain legal and contact identity for the business (legal name, tax ID, address, logo, industry, etc.). Required fields may need to be completed before the rest of the app unlocks for a new organization.

---

## 15. Personal profile

Update your personal details, profile photo, and password (current password required). Completing the personal profile may be required on first use.

---

## 16. Billing

**Owner only.**

- View current plan, status, usage (users / locations), and due date  
- Browse plans and subscribe or renew  
- Apply **coupon codes** when available (some coupons may activate a plan without payment)  
- Checkout may redirect to **Tranzak** to pay  

**Renewal window:** plan changes may only be allowed within a few days before/after the due date, unless the product allows checkout anytime.

**Probation:** if the organization is on free-tier probation, a banner explains that **only the owner** can sign in until you subscribe again.

---

## 17. Audit logs and notifications

### Audit logs

If permitted, view a paginated history of actions (who did what, on which resource, when, optionally by location/date filters). Useful for accountability and troubleshooting.

### Notifications

The header bell shows unread notifications (permission-gated). Open the list to review and mark as read as supported by the UI.

---

## 18. Offline mode

Smarter Panel can be installed as a **PWA** and may work with limited connectivity:

1. The header shows online/offline status.  
2. While offline, some creates/updates/deletes and uploads can be **queued** locally (IndexedDB).  
3. When you reconnect, the app **syncs** the queue and refreshes caches.  
4. You may see messages such as that data was saved offline and will sync when online.

**Important:** clearing browser data, uninstalling the PWA, or failing sync can lose unsynced work. Prefer working online for critical entries. Login and OTP still need email/network when authenticating.

---

## 19. Support chat

Use the floating **Support** widget (typically bottom-right):

1. Open a new thread with a subject and message, or continue an existing thread.  
2. Platform support staff can reply; the widget may refresh periodically.  

This contacts **platform** support, not your organization admin. For permission or location access issues, ask your admin first.

---

## 20. Common limits and rules

- **7-day date limit** – Income/expense dates cannot usually be older than 7 days  
- **24-hour lock** – Many records cannot be edited or deleted after 24 hours from creation  
- **Plan caps** – Max users and max locations per subscription  
- **Owner-only** – Billing and Organization profile  
- **OTP everywhere** – Signup, login, invite accept, and password reset require email codes  
- **Password length** – At least 6 characters for new passwords

---

## 21. Troubleshooting

### I did not receive an OTP or invite email

- Check spam/junk.  
- Click **Resend code** or ask an admin to **Resend** the invite.  
- If the UI mentions SMTP / email failure, the server email configuration may be down—contact \`contact@acheteici.com\`.  
- In non-production environments, a **dev OTP** may appear on screen when SMTP is not configured.

### Forgot password sends me back to login with no message

Hard-refresh the app and try again. Ensure the API that serves \`/auth/forgot-password/start\` is running and reachable (same origin \`/api\` in local dev).

### I cannot open a menu item

You likely lack \`perm_view…\` for that module, or you are not the owner (Billing / Organization). Ask your administrator.

### I cannot add a user or location

Check subscription usage under Billing. Free or lower plans enforce caps.

### Only the owner can sign in

The organization may be in **probation** or restricted. The owner should open Billing and renew/subscribe.

### Changes made offline never appear

Confirm you are online, wait for sync, and avoid clearing site data. Retry the action online if the queue failed.

### Login works but I must change password

An admin reset your password or \`passwordNeedsReset\` is set. Complete the mandatory change screen using the temporary/current password.

### Wrong language or currency

Use the header controls; they are per session/UI preference and do not change other users’ settings.

---

## Still need help?

1. Ask your **organization administrator** for roles, locations, and invites.  
2. Use **Support chat** in the app for platform issues.  
3. Email \`contact@acheteici.com\`.

---

*Last aligned with Smarter Panel product behavior in this repository. Update this guide when features change.*
`,

privacyPolicyContent: `
# Privacy Policy — Smarter Panel

**Effective date:** \`08/2026\`

**Disclaimer:** This document is a product-aligned draft based on how Smarter Panel works today. It is not legal advice. Have counsel review and complete all placeholders before publishing.

---

## 1. Who we are

**Smarter Panel** is a multi-tenant business administration application (income, expenses, inventory, HR, estimates, billing, and related tools). It is operated by:

- **Legal entity:** \`ATI SARL\`
- **Registered address:** \`Ndogbong, Douala Cameroun\`
- **Product / sites:** Smarter Panel; typically \`app.smarterworkspace.cloud\` and \`api.smarterworkspace.cloud\` (or your deployed domains)
- **Privacy contact:** \`contact@acheteici.com\`

In this policy, “we,” “us,” and “our” mean \`ATI SARL\`. “You” means an individual user or the organization that uses the Service.

---

## 2. Scope

This policy describes how we process personal and business data when you:

- Create or join an organization account  
- Sign in (including email one-time passwords)  
- Use modules such as Dashboard, Income, Expenses, Inventory, HR, Reports, Estimates, Admin, Billing, Audit logs, and Support chat  
- Install or use the Progressive Web App (PWA), including offline features  

It does not cover third-party websites or services that we do not control (for example, the Tranzak payment experience after you leave our checkout flow), except where we explain how we share data with them.

---

## 3. Data we collect

### 3.1 Account and profile data

- Email address, password (stored hashed by the backend; we do not store plaintext passwords)  
- First name, last name, phone, address, job title, profile photo  
- Role and location assignment(s) within your organization  
- Flags such as whether a password reset is required and whether the account is active  

### 3.2 Organization (business) data

Provided mainly by the organization owner:

- Organization name, legal name, address, city, country, postal code  
- Business phone, email, website, tax ID, industry, description, logo  

### 3.3 Operational and financial content you enter

Data is scoped to your organization (and usually to a location):

- **Income and expenses:** amounts, dates, sources/descriptions, categories, linked user and location  
- **Inventory:** item details, quantities, values, status, expiry, notes, photos, storage places, and incident events (e.g. damaged, expired, stolen, adjustments)  
- **HR / staff:** staff identity and employment details (including date of birth, gender, contact details, position, hire date, status, locations) and uploaded staff documents  
- **Estimates / quotes:** customer and business contact blocks, line items, tax, branding, notes/terms  
- **Catalogs and configuration:** locations, roles, categories, positions, income sources, expense descriptions, storage places, and similar admin data  
- **Audit logs:** actions such as login or resource changes, with user, location, resource identifiers, and details  
- **In-app notifications:** titles, messages, read state, and related context  

### 3.4 Billing and subscription data

- Plan, status, billing period, usage (users/locations), renewal window information  
- Coupon codes applied to your organization  
- Checkout and payment references needed to complete or confirm payment  

Card or wallet details are typically handled by the payment provider (see Section 6); we receive status and reference information needed to activate or renew subscriptions.

### 3.5 Support communications

Messages and subjects you send through the in-app Support chat, and replies from platform support staff.

### 3.6 Authentication and security data

- One-time verification codes sent by email for signup, login, invites, and password reset (codes are short-lived; the backend stores hashed challenges, not long-term plaintext OTPs)  
- Session credentials: bearer tokens in browser storage by default, or optional httpOnly session cookies when that mode is enabled  
- Invite tokens when teammates are invited by email  

### 3.7 Technical and client-side data

On your device, the app may store:

- **localStorage:** auth token and cached user/role data (when not using httpOnly cookies); theme preference (\`smarter-panel-theme\`)  
- **IndexedDB:** cached collection data, offline action queues, and temporary upload blobs for sync when connectivity returns  
- **PWA / service worker caches:** static app assets for installable/offline shell behavior  

We also process standard server/request technical data as needed to operate the API (for example IP address, timestamps, and error logs on infrastructure we control). Exact log retention is \`[Log Retention Policy / Contact Admin]\`.

### 3.8 Data we do not intentionally collect in-app

The current Smarter Panel frontend does not integrate third-party product analytics SDKs (for example Mixpanel, Google Analytics in-app). Google Fonts may be loaded for typography.

---

## 4. How we collect data

- Directly from you via forms (signup, login, profiles, modules, support)  
- From organization admins who invite you or manage your role/locations  
- Via email delivery of OTP and invite messages (SMTP)  
- Via file uploads (profile pictures, inventory images, logos, HR documents)  
- Via payment checkout and webhooks with our payment processor  
- Automatically from the browser for session, theme, PWA, and offline sync  

---

## 5. Why we process data (purposes)

- **Provide the Service** – Store and display org-scoped business data; enforce roles and locations  
- **Account security** – Password verification, OTP challenges, forced password reset, deactivation  
- **Onboarding** – Complete organization and personal profiles before full access  
- **Billing** – Plans, limits, coupons, checkout, probation/subscription state  
- **Support** – In-app support threads with platform staff  
- **Integrity and fraud controls** – Audit logs; rules such as limited backdating and edit locks after creation  
- **Offline continuity** – Queue and replay changes when the network returns  
- **Legal compliance** – \`[List any legal bases / obligations under Governing Law]\`

---

## 6. Sharing and disclosure

We share data only as needed to run Smarter Panel:

1. **Within your organization** — Owners, admins, and teammates see data according to roles, permissions, and location scope.  
2. **Payment processor (Tranzak)** — For subscription checkout and payment confirmation. Their processing is subject to their own terms and privacy practices.  
3. **Email / SMTP providers** — To deliver OTP codes and invitation emails.  
4. **Hosting and infrastructure** — Providers that host the application, API, database, and file storage under our instructions.  
5. **Platform operators** — Platform admin tooling may access organization status, support threads, payments/refunds, and related operational data as needed to run the service.  
6. **Legal requirements** — When required by law, court order, or to protect rights, safety, and security.  

We do not sell your personal information.

---

## 7. Multi-tenancy and international use

Each organization is a tenant: API data is organization-scoped. Users generally access only their organization’s data, subject to role and location permissions.

If you access the Service from multiple countries, data may be processed in \`[Hosting Region(s)]\`. Cross-border transfer safeguards, if required: \`[Transfer Mechanism / Contact Privacy Email]\`.

---

## 8. Retention and deletion

- Active account and organization data are retained while the organization uses the Service.  
- OTP challenges are short-lived (on the order of minutes) and then expire or are consumed.  
- Offline and cache data on your device remain until cleared by the browser, logout (for auth keys), or app/storage cleanup.  
- After account or organization closure: \`[Retention Period and Deletion Process — fill in]\`.  

To request deletion or export: contact \`contact@acheteici.com\` (and, where applicable, your organization owner/admin).

---

## 9. Security

We implement measures appropriate to a business SaaS product, including:

- Password hashing on the server  
- Email OTP for signup, login, invite acceptance, and password reset  
- Organization-scoped APIs and role-based permissions  
- Optional httpOnly cookie sessions or bearer tokens  
- Rate limiting on authentication endpoints (backend)  

No method of transmission or storage is perfectly secure. You must protect your credentials and device access.

---

## 10. Your rights and choices

Depending on \`[Governing Law / Jurisdiction]\`, you may have rights to access, correct, delete, restrict, or object to certain processing, and to withdraw consent where processing is consent-based.

- Update profile and organization information in the app where permitted.  
- Change password from Profile (or via forced reset / forgot-password flow).  
- Contact \`contact@acheteici.com\` for privacy requests.  
- Organization owners/admins control teammate access, invites, and many records inside the tenant.  

We will respond according to applicable law: \`[Response Timeframe]\`.

---

## 11. Children’s privacy

Smarter Panel is a business tool and is not directed at children. We do not knowingly collect personal information from children under \`[Minimum Age, e.g. 16 or 18]\`. If you believe we have done so, contact \`contact@acheteici.com\`.

---

## 12. Cookies and similar technologies

- **Essential:** session/auth (localStorage token or httpOnly cookies), theme preference, PWA caches, IndexedDB offline queue.  
- **Non-essential marketing cookies:** not used by the current frontend as shipped.  

You can clear site data in your browser; doing so may sign you out and discard unsynced offline queues.

---

## 13. Third-party links and processors

Payment redirects, email providers, and font CDNs are third parties. Review their policies. Primary payment processor for subscriptions: **Tranzak**.

---

## 14. Changes to this policy

We may update this policy to reflect product or legal changes. The “Effective date” will be revised. Material changes may be communicated by \`[Notification Method — e.g. email to owners, in-app notice]\`. Continued use after the effective date constitutes acknowledgment of the updated policy where permitted by law.

---

## 15. Contact

- **Privacy requests:** \`contact@acheteici.com\`
- **General / support:** \`contact@acheteici.com\` or the in-app Support chat
- **Postal:** \`contact@acheteici.com\`

---

*Product reference: Smarter Panel (ATI / smarterworkspace.cloud deployments as configured by the operator).*
`,

termsContent: `
# Terms and Conditions — Smarter Panel

**Effective date:** \`08/2026\`

**Disclaimer:** This document is a product-aligned draft based on how Smarter Panel works today. It is not legal advice. Have counsel review and complete all placeholders before publishing.

---

## 1. Agreement to these Terms

These Terms and Conditions (“Terms”) govern access to and use of **Smarter Panel** (the “Service”), operated by \`ATI SARL\` (“we,” “us,” “our”), located at \`Ndogbong, Douala Cameroun\`.

By creating an account, accepting an invitation, or using the Service, you agree to these Terms and our Privacy Policy. If you use the Service on behalf of an organization, you represent that you have authority to bind that organization, and “you” includes that organization.

If you do not agree, do not use the Service.

---

## 2. The Service

Smarter Panel is a multi-tenant web application (including a Progressive Web App) for business administration. Features may include, depending on your plan and permissions:

- Dashboard and reporting  
- Income and expense tracking  
- Inventory management and incident logging  
- HR / staff records and documents  
- Estimates / quotes  
- Organization administration (users, roles, locations, catalogs)  
- Billing and subscriptions  
- Audit logs and in-app notifications  
- In-app support chat  

We may add, change, or remove features. We do not guarantee that every feature will remain available indefinitely.

Production deployments are commonly served under domains such as \`app.smarterworkspace.cloud\` and \`api.smarterworkspace.cloud\`, or other domains you configure.

---

## 3. Accounts and eligibility

### 3.1 Eligibility

You must be able to form a binding contract under \`[Governing Law / Jurisdiction]\` and meet any minimum age we set: \`[Minimum Age]\`. The Service is intended for business use.

### 3.2 Organization owner accounts

Signing up creates an **organization** and an **owner** user. The owner is responsible for:

- Completing the organization profile when required  
- Managing users, invites, roles, and locations (directly or via permitted admins)  
- Billing, plan selection, and subscription status  
- Ensuring that use of the Service complies with these Terms and applicable law  

### 3.3 Invited users

Admins may invite teammates by email. Invitees set a password and verify with a one-time code. Invited users must only use access granted by their organization and must follow these Terms.

### 3.4 Account information

You agree to provide accurate information and keep it updated. You must not impersonate others or create accounts for unauthorized use.

---

## 4. Account security

- Protect your password and device.  
- Sign-in, signup, invite acceptance, and password reset use **email one-time passwords (OTP)**.  
- Organization admins may reset passwords or deactivate users where permitted.  
- You must use the forgot-password or change-password flows only for accounts you are authorized to control.  
- Notify us promptly at \`contact@acheteici.com\` of suspected unauthorized access.  

You are responsible for activity under your credentials, except to the extent caused by our failure to implement reasonable security measures.

---

## 5. Acceptable use

You agree not to:

- Violate laws or third-party rights  
- Upload malware or attempt to breach, scrape, or overload the Service  
- Access another organization’s data without authorization  
- Circumvent permissions, location scoping, edit locks, or subscription limits  
- Use the Service to send unlawful spam or phishing (including abuse of invites or support)  
- Reverse engineer the Service except where such restriction is prohibited by law  
- Resell or white-label the Service without our written permission  

We may suspend or terminate access for violations, security risk, non-payment, or organization suspension.

---

## 6. Customer content and data ownership

### 6.1 Your content

“Customer Content” means data you or your organization submit to the Service (financial records, inventory, HR files, estimates, chat messages, uploads, etc.).

As between you and us, your organization retains ownership of Customer Content. You grant us a worldwide, non-exclusive license to host, process, transmit, and display Customer Content solely to provide and improve the Service, comply with law, and as described in the Privacy Policy.

### 6.2 Responsibility for Customer Content

You are responsible for Customer Content, including having necessary rights and consents (especially for staff and customer personal data) and for backups appropriate to your business needs.

### 6.3 Our intellectual property

The Service, software, branding, default estimate templates, and documentation (excluding Customer Content) are owned by us or our licensors. These Terms do not transfer ownership of our IP to you.

---

## 7. Roles, permissions, and locations

Access inside an organization is controlled by roles and permissions. Data is generally filtered by organization and often by location. Global or “all locations” access may be limited to specific roles.

Misconfiguration of roles by your admins is your organization’s responsibility. Contact your organization administrator for access issues before contacting us.

---

## 8. Subscriptions, billing, and limits

### 8.1 Plans and limits

Subscriptions may limit **maximum users** and **maximum locations**. Creating users or locations beyond plan limits may be blocked until you upgrade or free capacity.

### 8.2 Free tier, probation, and suspension

Organizations may start on a free or limited plan. If a subscription enters **probation** (for example after lapse), the Service may restrict sign-in so that **only the organization owner** can access the account until a subscription is renewed. Platform operators may also **suspend** organizations; suspended organizations may be unable to use the Service.

### 8.3 Checkout and payments

Paid plans may be purchased or renewed through in-app Billing (owner only). Checkout may redirect you to **Tranzak** or another payment provider. Coupons may apply discounts or activate plans without payment when valid.

Renewal or plan changes may only be allowed within a defined renewal window (for example around the due date), except where the product allows checkout at any time.

### 8.4 Fees, taxes, refunds

Fees, taxes, currency (commonly displayed as XAF for billing amounts in-product), and refund eligibility: \`[Pricing / Refund Policy URL or summary]\`. Owner-initiated refund requests may exist at the API/platform level; availability in the UI may vary.

### 8.5 Non-payment

We may downgrade, limit, or suspend the Service for failed or missing payment according to our billing practices: \`[Billing Enforcement Details]\`.

---

## 9. Availability, offline use, and support

### 9.1 Availability

We aim for reasonable availability but do not warrant uninterrupted or error-free operation. Maintenance, outages, and force majeure may occur.

### 9.2 PWA and offline sync

The Service may work as an installable PWA and may queue certain create/update/delete or upload actions while offline, then sync when connectivity returns. Offline queues are not a substitute for durable backups. Unsynced local data can be lost if browser storage is cleared. Authoritative data resides on the server after successful sync.

### 9.3 Support

Support may be available via the in-app Support chat and/or \`contact@acheteici.com\`. We do not guarantee response times unless separately agreed in writing: \`[Support SLA if any]\`.

---

## 10. Product rules that affect your use

Without limiting other Terms, the product currently enforces rules such as:

- Income and expense **transaction dates** generally cannot be older than **7 days**  
- Certain records may be **locked from edit or delete after 24 hours** (fraud prevention)  
- Owners may be required to complete organization profile before full use; users may be required to complete personal profile  

These operational rules may change as the product evolves.

---

## 11. Confidentiality

Each party may receive non-public information from the other. You will not disclose our non-public Service information. We will treat Customer Content as confidential and use it as described in these Terms and the Privacy Policy, except for information that is public, independently developed, or required to be disclosed by law.

---

## 12. Disclaimers

THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” TO THE MAXIMUM EXTENT PERMITTED BY LAW. WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

We do not warrant that reports, forecasts, inventory valuations, or exported files are free from error or suitable for any specific regulatory, tax, or audit purpose. You remain responsible for your own accounting, tax, and compliance decisions.

---

## 13. Limitation of liability

TO THE MAXIMUM EXTENT PERMITTED BY \`[Governing Law / Jurisdiction]\`:

- We are not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, revenue, data, or business opportunities.  
- Our aggregate liability arising out of or related to the Service or these Terms will not exceed the greater of (a) fees you paid us for the Service in the **\`[e.g. 12]\` months** before the claim or (b) **\`[Minimum Cap Amount]\`**.  

Some jurisdictions do not allow certain limitations; in those cases our liability is limited to the fullest extent permitted.

---

## 14. Indemnity

You will defend and indemnify us and our affiliates, officers, and employees against claims, damages, and expenses (including reasonable legal fees) arising from: (a) Customer Content; (b) your misuse of the Service; (c) your breach of these Terms; or (d) violation of law or third-party rights by you or your users—except to the extent caused by our willful misconduct.

---

## 15. Suspension and termination

- You may stop using the Service at any time. Organization closure / data export: \`[Account Closure Process]\`.  
- We may suspend or terminate for breach, risk, non-payment, prolonged inactivity, or legal requirement.  
- Upon termination, your right to access the Service ends. Survival: sections on IP, Customer Content license (for wind-down), disclaimers, liability, indemnity, and governing law survive.  

---

## 16. Changes to the Terms

We may update these Terms. We will revise the effective date and may notify owners by \`[Notification Method]\`. Continued use after changes become effective constitutes acceptance where allowed by law. If you do not agree, stop using the Service.

---

## 17. Governing law and disputes

These Terms are governed by the laws of \`[Governing Law / Jurisdiction]\`, excluding conflict-of-law rules. Courts / arbitration: \`[Venue or Arbitration Clause]\`.

---

## 18. General

- **Entire agreement:** These Terms and the Privacy Policy are the entire agreement regarding the Service, unless a separate written contract says otherwise.  
- **Severability:** If a provision is unenforceable, the rest remains in effect.  
- **Assignment:** You may not assign these Terms without our consent; we may assign to an affiliate or successor.  
- **No waiver:** Failure to enforce a provision is not a waiver.  
- **Notices:** Legal notices to us: \`contact@acheteici.com\` / \`contact@acheteici.com\`. Notices to you may be sent to the owner email on file or via the Service.  

---

## 19. Contact

- **Legal:** \`contact@acheteici.com\`
- **Support:** \`contact@acheteici.com\` or in-app Support chat
- **Privacy:** \`contact@acheteici.com\`
- **Postal:** \`contact@acheteici.com\`

---

*Product reference: Smarter Panel (ATI / smarterworkspace.cloud deployments as configured by the operator).*
`
  },
  fr: {
    loginWelcome: "Smarter Panel",
    loginToAccess: "Connectez-vous pour accéder.",
    login: "Connexion",
    email: "Email",
    password: "Mot de passe",
    signupTitle: "Créer votre organisation",
    signupSubtitle: "Commencez gratuitement avec un utilisateur et un site. Complétez le profil après l'inscription.",
    otpTitle: "Code de vérification",
    otpSubtitle: "Nous avons envoyé un code unique à votre e-mail.",
    inviteTitle: "Accepter l'invitation",
    inviteSubtitle: "Définissez votre mot de passe pour rejoindre l'organisation.",
    organizationName: "Nom de l'organisation",
    createOrganization: "Créer une organisation",
    createAccount: "Créer le compte",
    noAccount: "Nouveau ?",
    haveAccount: "Déjà un compte ?",
    pleaseWait: "Veuillez patienter…",
    otpCode: "Code de vérification",
    verifyOtp: "Vérifier",
    resendOtp: "Renvoyer le code",
    inviteToken: "Jeton d'invitation",
    acceptInvite: "Continuer",
    backToLogin: "Retour à la connexion",
    forgotPassword: "Mot de passe oublié ?",
    forgotPasswordTitle: "Réinitialiser le mot de passe",
    forgotPasswordSubtitle: "Saisissez votre e-mail et nous enverrons un code de vérification.",
    forgotResetTitle: "Choisir un nouveau mot de passe",
    forgotResetSubtitle: "Entrez le code reçu par e-mail et votre nouveau mot de passe.",
    sendResetCode: "Envoyer le code",
    resetPasswordSubmit: "Mettre à jour le mot de passe",
    forgotSuccess: "Mot de passe mis à jour. Vous pouvez vous connecter.",
    devOtpHint: "OTP dev (SMTP non configuré)",
    orgProfileTitle: "Compléter le profil de l'organisation",
    orgProfileSubtitle: "Informations de l'entreprise. Séparé de votre profil personnel.",
    legalName: "Raison sociale",
    taxId: "N° fiscal",
    saveOrgProfile: "Enregistrer le profil organisation",
    orgProfileSaved: "Profil organisation enregistré",
    orgLogoHint: "Téléverser le logo de l'organisation (optionnel).",
    orgSectionIdentity: "Identité",
    workingCurrency: "Devise de travail",
    workingCurrencyHint: "Les montants saisis sont enregistrés dans cette devise. Le sélecteur de l’en-tête ne convertit que l’affichage avec des taux en direct.",
    locationCurrency: "Devise du site",
    locationCurrencyHint: "Chaque site enregistre les montants dans sa propre devise. Les nouveaux sites héritent de la devise de l’organisation.",
    displayCurrency: "Devise d’affichage",
    orgSectionContact: "Contact",
    orgSectionAddress: "Adresse",
    industry: "Secteur d'activité",
    orgDescription: "À propos de l'organisation",
    orgEmail: "E-mail de l'organisation",
    city: "Ville",
    country: "Pays",
    postalCode: "Code postal",
    website: "Site web",
    organization: "Organisation",
    personalProfileTitle: "Compléter votre profil personnel",
    personalProfileSubtitle: "Vos informations personnelles au sein de cette organisation.",
    personalProfileSaved: "Profil personnel enregistré",
    personalInfo: "Informations personnelles",
    jobTitle: "Poste",
    owner: "Propriétaire",
    billing: "Abonnement",
    billingSubtitle: "Gérez votre forfait et les renouvellements.",
    currentPlan: "Forfait actuel",
    plan: "Forfait",
    dueDate: "Échéance",
    choosePlan: "Choisir un forfait",
    subscribe: "S'abonner",
    unlimitedUsers: "Utilisateurs illimités",
    unlimitedLocations: "Sites illimités",
    couponCode: "Code promo",
    applyCoupon: "Appliquer",
    assignedCoupons: "Assignés à votre organisation",
    couponApplied: "Code promo appliqué",
    couponInvalid: "Code promo invalide",
    couponCheckoutActivated: "Abonnement activé avec votre code promo — aucun paiement requis.",
    renewalWindowHint: "Renouvellement ou changement de forfait uniquement dans les 5 jours avant/après l'échéance.",
    probationBanner: "Votre organisation est en probation (forfait gratuit). Seul le propriétaire peut se connecter jusqu'à un nouvel abonnement.",
    paymentSimulated: "Paiement marqué réussi (dev).",
    sendInvite: "Envoyer une invitation",
    inviteEmailHint: "Invitez un collaborateur par e-mail. Il recevra un lien, choisira son mot de passe et vérifiera par OTP.",
    inviteSent: "Invitation envoyée",
    inviteResent: "Invitation renvoyée",
    inviteEmailFailed: "L'e-mail n'a pas pu être envoyé — vérifiez SMTP ou renvoyez plus tard",
    pendingInvites: "Invitations en attente",
    resendInvite: "Renvoyer",
    inviteFromStaff: "Inviter depuis le personnel",
    dashboard: "Tableau de Bord",
    income: "Revenus",
    expenses: "Dépenses",
    inventory: "Inventaire",
    hr: "RH",
    reports: "Rapports",
    estimates: "Devis",
    admin: "Admin",
    logout: "Déconnexion",
    totalIncome: "Revenus Totaux",
    totalExpenses: "Dépenses Totales",
    netBalance: "Solde Net",
    inventoryValue: "Valeur Inventaire",
    recentActivity: "Activité Récente",
    add: "Ajouter",
    delete: "Supprimer",
    save: "Enregistrer",
    cancel: "Annuler",
    edit: "Modifier",
    editUser: "Modifier l'utilisateur",
    saveChanges: "Enregistrer les modifications",
    actions: "Actions",
    source: "Source",
    amount: "Montant",
    date: "Date",
    description: "Description",
    category: "Catégorie",
    item: "Article",
    type: "Type",
    quantity: "Quantité",
    value: "Valeur",
    firstName: "Prénom",
    lastName: "Nom",
    position: "Poste",
    status: "Statut",
    documents: "Documents",
    upload: "Téléverser",
    download: "Télécharger",
    view: "Voir",
    back: "Retour",
    profile: "Mon Profil",
    address: "Adresse",
    phone: "Téléphone",
    gender: "Sexe",
    dob: "Date de Naissance",
    hireDate: "Date d'embauche",
    terminationDate: "Date de fin de contrat",
    allLocations: "Tous les Sites",
    selectLocation: "Choisir un site",
    changePassword: "Changer mot de passe",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer mot de passe",
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    passwordChanged: "Mot de passe changé avec succès.",
    resetPassword: "Réinitialiser MDP",
    resetSuccess: "Réinitialisé. MDP temp: ",
    oldPassword: "Mot de passe actuel",
    oldPasswordRequired: "Le mot de passe actuel est requis",
    confirmDelete: "Confirmer la suppression",
    deactivate: "Désactiver",
    reactivate: "Réactiver",
    remove: "Supprimer",
    confirmDeactivateUser: "Désactiver cet utilisateur ? Il ne pourra plus se connecter.",
    confirmRemoveUser: "Supprimer définitivement cet utilisateur ? Cette action est irréversible.",
    userDeactivated: "Utilisateur désactivé",
    userReactivated: "Utilisateur réactivé",
    userRemoved: "Utilisateur supprimé",
    active: "Actif",
    inactive: "Inactif",
    deleteStaffConfirm: "Êtes-vous sûr de vouloir supprimer ce membre du personnel?",
    noUserAccount: "Ce membre du personnel n'a pas de compte utilisateur",
    uploadDocument: "Téléverser un document",
    documentName: "Nom du document",
    documentType: "Type de document",
    selectFile: "Sélectionner un fichier",
    updatePermissions: "Mettre à jour les permissions",
    positions: "Postes",
    noDocuments: "Aucun document téléversé",
    permissionsSelected: "permissions sélectionnées",
    perm_viewDashboard: "Voir Tableau de Bord",
    perm_viewIncome: "Voir Revenus",
    perm_addIncome: "Ajouter Revenu",
    perm_deleteIncome: "Supprimer Revenu",
    perm_viewExpenses: "Voir Dépenses",
    perm_addExpenses: "Ajouter Dépense",
    perm_deleteExpenses: "Supprimer Dépense",
    perm_manageCategories: "Gérer Catégories",
    perm_viewInventory: "Voir Inventaire",
    perm_addInventory: "Ajouter Inventaire",
    perm_updateInventory: "Modifier inventaire / signaler incidents",
    perm_deleteInventory: "Supprimer Inventaire",
    perm_manageTypes: "Gérer Types Inv.",
    perm_viewHR: "Voir RH",
    perm_addHR: "Ajouter Employé",
    perm_updateHR: "Modifier Employé",
    perm_deleteHR: "Supprimer Employé",
    perm_manageHRUploads: "Gérer Documents RH",
    perm_managePositions: "Gérer Postes",
    perm_manageDocs: "Gérer Documents",
    perm_viewReports: "Voir Rapports",
    perm_viewEstimates: "Voir Devis",
    perm_addEstimates: "Ajouter Devis",
    perm_updateEstimates: "Modifier Devis",
    perm_deleteEstimates: "Supprimer Devis",
    perm_manageEstimateTemplates: "Gérer modèles de devis",
    perm_viewAdmin: "Accès Admin",
    perm_manageAdminUsers: "Admin: onglet Gestion des utilisateurs",
    perm_manageAdminRoles: "Admin: onglet Gestion des rôles",
    perm_manageAdminConfig: "Admin: Config (sites, catégories, types, postes, sources, descriptions, emplacements)",
    adminNoSubPermission: "Vous n'avez pas la permission de gérer les paramètres. Contactez un administrateur pour accéder à la Gestion des utilisateurs, des rôles ou de la Config.",
    perm_allLocations: "Accès à Tous Les Sites",
    manage_users: "Gérer les utilisateurs (créer, modifier, supprimer, réinitialiser MDP pour tout utilisateur)",
    perm_resetUserPassword: "Réinitialiser le mot de passe (utilisateurs de votre site uniquement)",
    perm_deactivateUser: "Désactiver des utilisateurs",
    perm_removeUser: "Supprimer des utilisateurs",
    errorFillFields: "Veuillez remplir tous les champs.",
    errorDateFuture: "La date ne peut pas être dans le futur.",
    errorDatePast: "La date ne peut pas dépasser 7 jours.",
    errorNoLocation: "Veuillez sélectionner un site spécifique.",
    userManagement: "Gestion Utilisateurs",
    roleManagement: "Gestion Rôles",
    locationManagement: "Sites",
    configManagement: "Configurations",
    generateReport: "Générer Rapport",
    forecast: "Prévisions Financières",
    monthly: "Mensuel",
    quarterly: "Trimestriel",
    yearly: "Annuel",
    allTime: "Tout",
    dateRange: "Période",
    dateFrom: "Du",
    dateTo: "Au",
    last7Days: "7 derniers jours",
    thisMonth: "Ce mois",
    thisYear: "Cette année",
    last12Months: "12 derniers mois",
    incomeVsExpenses: "Revenus vs Dépenses",
    incomeBySource: "Revenus par source",
    expensesByCategory: "Dépenses par catégorie",
    financialOverview: "Vue financière",
    financialHealth: "Santé financière",
    netTrend: "Tendance du solde net",
    showCharts: "Afficher les graphiques",
    hideCharts: "Masquer les graphiques",
    downloadCSV: "Télécharger CSV",
    downloadExcel: "Télécharger Excel",
    forecastTitle: "Projections Financières",
    forecastDesc: "Basé sur la moyenne historique",
    managePermissions: "Gérer Permissions",
    roleName: "Nom du Rôle",
    permissions: "Permissions",
    expenseCategories: "Catégories Dépenses",
    inventoryTypes: "Types Inventaire",
    incomeSources: "Sources de revenus",
    expenseDescriptions: "Descriptions de dépenses",
    storagePlaces: "Emplacements de stockage",
    name: "Nom",
    nameFr: "Nom (FR)",
    metric: "Métrique",
    allMetrics: "Toutes Métriques",
    incomeOnly: "Revenus Seuls",
    expensesOnly: "Dépenses Seules",
    inventoryOnly: "Inventaire",
    specificLocation: "Site Spécifique",
    changePhoto: "Changer Photo",
    updateProfile: "Mettre à jour Profil",
    mandatoryReset: "Alerte Sécurité: Vous devez changer votre mot de passe pour continuer.",
    hierarchyForbidden: "Vous ne pouvez pas modifier ou supprimer un utilisateur au-dessus de vous dans la hiérarchie.",
    locked24hMessage: "Modification et suppression interdites après 24 h (prévention des fraudes).",
    auditLogs: "Journaux d'audit",
    perm_viewAuditLogs: "Voir les journaux d'audit",
    filterByLocation: "Site",
    filterByUser: "Utilisateur",
    searchByName: "Rechercher par nom",
    filterByPosition: "Poste",
    allPositions: "Tous les postes",
    listView: "Vue liste",
    gridView: "Vue grille",
    auditAction: "Action",
    auditResource: "Ressource",
    auditTime: "Heure",
    auditDetails: "Détails",
    auditUser: "Utilisateur",
    auditLocation: "Site",
    noAuditLogs: "Aucun journal d'audit.",
    applyFilters: "Appliquer",
    clearFilters: "Effacer",
    notifications: "Notifications",
    perm_viewNotifications: "Voir les notifications",
    noNotifications: "Aucune notification",
    themeToggle: "Basculer mode clair/sombre",
    lightMode: "Mode clair",
    darkMode: "Mode sombre",
    installApp: "Installer l'application",
    installAppHint: "Utilisez Smarter Panel comme une application native sur votre appareil.",
    installAppIosHint: "Touchez Partager, puis Sur l'écran d'accueil.",
    installAppBrowserHint: "Ouvrez le menu du navigateur et choisissez Installer l'application ou Ajouter à l'écran d'accueil.",
    installAppDismiss: "Pas maintenant",
    errorNoInventory: "Aucun article d'inventaire sélectionné.",
    inventoryDeleteConfirm: "Supprimer l'article ?",
    inventoryDeleteConfirmMsg: "Voulez-vous vraiment supprimer cet article d'inventaire ?",
    inventoryUpdateTitle: "Modifier l'article",
    inventoryReportIncident: "Signaler un incident",
    inventoryOnHand: "En stock",
    inventoryOnHandShort: "Qté",
    inventoryUnitValue: "Valeur unitaire",
    inventoryUnitValueShort: "Unit.",
    inventoryTotal: "Total",
    inventoryTotalShort: "Total",
    inventoryStatus: "Statut",
    inventoryExpiry: "Expiration",
    inventoryLastUpdated: "Dernière mise à jour",
    inventoryLastUpdatedShort: "Maj",
    inventoryExpiresOn: "Expire le",
    inventoryNotes: "Notes",
    inventoryImage: "Image de l'article",
    inventoryStoragePlace: "Emplacement de stockage",
    inventoryStoragePlaceShort: "Empl.",
    inventoryStoragePlaceHint: "Rayon, bac, chambre froide, zone…",
    inventorySiteLabel: "Site",
    inventoryImageUploadFailed: "Échec du téléversement de l'image.",
    inventoryChangeImage: "Changer l'image",
    inventorySearch: "Rechercher…",
    inventoryFilterStatus: "Statut",
    inventoryFilterType: "Type",
    inventoryFilterAll: "Tous",
    inventoryExpiringSoon: "Expire dans 30 jours",
    inventoryStatus_available: "Disponible",
    inventoryStatus_damaged: "Endommagé",
    inventoryStatus_expired: "Expiré",
    inventoryStatus_missing: "Manquant",
    inventoryReason_damaged: "Endommagé / cassé",
    inventoryReason_expired: "Expiré / périmé",
    inventoryReason_stolen: "Volé / manquant",
    inventoryReason_restored: "Restauré / retrouvé",
    inventoryReason_adjustment: "Ajustement de quantité",
    inventoryIncidentReason: "Motif",
    inventoryIncidentQty: "Quantité",
    inventoryIncidentNote: "Note",
    inventoryIncidentNoteRequired: "Une note est requise pour les incidents endommagé ou volé.",
    inventoryIncidentQtyInvalid: "Saisissez une quantité valide pour cet incident.",
    inventoryIncidentSuccess: "Incident enregistré.",
    inventoryIncidentFailed: "Échec de l'enregistrement de l'incident.",
    inventoryAdded: "Article d'inventaire ajouté",
    inventoryUpdated: "Article d'inventaire mis à jour",
    inventoryRemoved: "Article d'inventaire supprimé",
    inventoryNoPermAdd: "Vous n'avez pas la permission d'ajouter des articles.",
    inventoryNoPermUpdate: "Vous n'avez pas la permission de modifier l'inventaire.",
    inventoryNoPermDelete: "Vous n'avez pas la permission de supprimer des articles.",
    inventoryHealth: "Santé de l'inventaire",
    inventoryAvailableValue: "Valeur disponible",
    inventoryLossValue: "Valeur des pertes",
    inventoryUnitsLost: "Unités perdues",
    inventoryDamagedUnits: "Endommagé",
    inventoryExpiredUnits: "Expiré",
    inventoryStolenUnits: "Volé",
    inventoryExpiringSoonCount: "Expire bientôt",
    inventoryLossesByReason: "Pertes d'inventaire par motif",
    inventoryLossesSheet: "Pertes inventaire",
    inventoryNoItems: "Aucun article ne correspond aux filtres.",
    newHire: "Nouvelle embauche",
    staffTerminationDate: "Date de fin de contrat",
    staffDeleted: "Compte employé supprimé",
    incomeDeleted: "Revenu supprimé",
    expenseDeleted: "Dépense supprimée",
    inventoryDeleted: "Article d'inventaire supprimé",
    reportDownloaded: "Rapport téléchargé",
    newEstimate: "Nouveau devis",
    editEstimate: "Modifier le devis",
    estimateTitle: "Titre",
    estimateNumber: "N° devis",
    estimateStatus: "Statut",
    estimateCustomer: "Client",
    estimateBusiness: "Entreprise",
    estimateLineItems: "Lignes",
    estimatePreview: "Aperçu",
    estimateTemplate: "Modèle",
    estimateIndustryTemplates: "Modèles métiers",
    estimateUserTemplates: "Vos modèles",
    archiveAsTemplate: "Archiver comme modèle",
    estimateLogo: "Logo",
    primaryColor: "Couleur principale",
    accentColor: "Couleur d'accent",
    estimateLayout: "Mise en page",
    layoutClassic: "Classique",
    layoutModern: "Moderne",
    layoutCompact: "Compacte",
    validUntil: "Valable jusqu'au",
    issueDate: "Date d'émission",
    taxRate: "Taxe %",
    subtotal: "Sous-total",
    taxAmount: "Taxe",
    total: "Total",
    unitPrice: "Prix unitaire",
    unit: "Unité",
    lineTotal: "Total ligne",
    terms: "Conditions",
    notes: "Notes",
    exportCsv: "Exporter CSV",
    exportExcel: "Exporter Excel",
    exportPdf: "Imprimer / PDF",
    copyPlainText: "Copier le texte",
    estimateDraft: "Brouillon",
    estimateSent: "Envoyé",
    estimateAccepted: "Accepté",
    estimateRejected: "Refusé",
    estimateArchived: "Archivé",
    noEstimates: "Aucun devis pour le moment.",
    searchEstimates: "Rechercher des devis…",
    addLineItem: "Ajouter une ligne",
    removeLineItem: "Retirer",
    customerName: "Nom du client",
    customerEmail: "Email client",
    customerPhone: "Téléphone client",
    customerAddress: "Adresse client",
    businessName: "Nom de l'entreprise",
    businessAddress: "Adresse de l'entreprise",
    businessPhone: "Téléphone de l'entreprise",
    estimateSaved: "Devis enregistré",
    estimateDeleted: "Devis supprimé",
    templateArchived: "Enregistré comme modèle",
    pickTemplate: "Partir d'un modèle",
    blankEstimate: "Devis vierge",
    // Marketing / Navigation
    navDescription: "Description",
    navPartners: "Nos partenaires",
    navFeatures: "Fonctionnalités",
    navTestimonials: "Témoignages",
    navFaq: "FAQ",
    navBlog: "Blog",
    getStarted: "Commencer",
    getItNow: "Obtenez-le maintenant",
    trustedBy: "Approuvé par les meilleures entreprises",

    // Hero
    heroTitle: "Votre compagnon d'entreprise",
    heroHighlight: " SMARTER PANEL",
    heroSubtitle:
      "SMARTER PANEL est un tableau de bord de gestion RH et comptable complet pour les opérations commerciales. Fonctionnalités : suivi des revenus/dépenses, gestion des stocks, administration du personnel et rapports financiers.",

    // Highlights
    highlightsTitle: "Points forts",
    highlightsDesc:
      "Découvrez pourquoi notre produit se démarque : adaptabilité, durabilité, conception conviviale et innovation. Profitez d'un support client fiable et d'une précision dans chaque détail.",
    highlightAdaptableTitle: "Performance adaptable",
    highlightAdaptableDesc:
      "Notre produit s'adapte facilement à vos besoins, augmentant l'efficacité et simplifiant vos tâches.",
    highlightBuiltToLastTitle: "Conçu pour durer",
    highlightBuiltToLastDesc:
      "Vivez une durabilité inégalée qui va au-delà avec un investissement durable.",
    highlightUserExperienceTitle: "Excellente expérience utilisateur",
    highlightUserExperienceDesc:
      "Intégrez notre produit dans votre routine avec une interface intuitive et facile à utiliser.",
    highlightInnovativeTitle: "Fonctionnalité innovante",
    highlightInnovativeDesc:
      "Gardez une longueur d'avance avec des fonctionnalités qui établissent de nouvelles normes, répondant mieux à vos besoins évolutifs.",
    highlightSupportTitle: "Support fiable",
    highlightSupportDesc:
      "Comptez sur notre service client réactif, offrant une assistance qui va au-delà de l'achat.",
    highlightPrecisionTitle: "Précision dans chaque détail",
    highlightPrecisionDesc:
      "Profitez d'un produit méticuleusement conçu où les petites touches ont un impact significatif sur votre expérience globale.",

    // Features
    featuresTitle: "Fonctionnalités du produit",
    featuresDesc:
      "Donnez un aperçu des principales fonctionnalités du produit. Par exemple, vous pouvez lister le nombre de fonctionnalités, leurs types ou avantages, et les ajouts.",
    featureDashboardTitle: "Vue d'ensemble du tableau de bord, finances, RH, opérations et plus encore",
    featureDashboardDesc:
      "Notre solution donne aux utilisateurs un accès facile à des outils pour gérer leur activité, des finances aux opérations, le tout en un seul endroit.",
    featureOfflineTitle: "Intégration de la fonctionnalité hors ligne",
    featureOfflineDesc:
      "Notre produit pourrait fournir une fonctionnalité hors ligne, permettant aux utilisateurs de continuer à travailler même lorsqu'ils ne sont pas connectés à Internet.",
    featureDevicesTitle: "Disponible sur tous les appareils",
    featureDevicesDesc:
      "Cet élément permet aux utilisateurs de savoir que le produit est disponible sur toutes les plateformes, telles que le web, mobile et bureau.",

    // Testimonials
    testimonialsTitle: "Témoignages",
    testimonialsDesc:
      "Découvrez ce que nos clients aiment à propos de nos produits. Découvrez comment nous excellons en matière d'efficacité, de durabilité et de satisfaction. Rejoignez-nous pour la qualité, l'innovation et un support fiable.",
    testimonial1Name: "Remy Sharp",
    testimonial1Occupation: "Ingénieur senior",
    testimonial1Text:
      "J'adore la polyvalence de ce produit ! Que je m'attaque à des projets professionnels ou à mes loisirs préférés, il s'adapte parfaitement à mes besoins changeants. Sa conception intuitive a vraiment amélioré ma routine quotidienne, rendant les tâches plus efficaces et agréables.",
    testimonial2Name: "Travis Howard",
    testimonial2Occupation: "Lead Product Designer",
    testimonial2Text:
      "L'une des caractéristiques remarquables de ce produit est le support client exceptionnel. D'après mon expérience, l'équipe derrière ce produit a été rapide à répondre et incroyablement utile. C'est rassurant de savoir qu'ils soutiennent fermement leur produit.",
    testimonial3Name: "Cindy Baker",
    testimonial3Occupation: "CTO",
    testimonial3Text:
      "Le niveau de simplicité et de convivialité de ce produit a considérablement simplifié ma vie. J'apprécie les créateurs pour avoir livré une solution qui répond non seulement mais dépasse les attentes des utilisateurs.",
    testimonial4Name: "Julia Stewart",
    testimonial4Occupation: "Ingénieur senior",
    testimonial4Text:
      "J'apprécie l'attention portée aux détails dans la conception de ce produit. Les petites touches font une grande différence, et il est évident que les créateurs se sont concentrés sur la fourniture d'une expérience premium.",
    testimonial5Name: "John Smith",
    testimonial5Occupation: "Product Designer",
    testimonial5Text:
      "J'ai essayé d'autres produits similaires, mais celui-ci se démarque par ses fonctionnalités innovantes. Il est clair que les fabricants ont mis beaucoup de réflexion dans la création d'une solution qui répond vraiment aux besoins des utilisateurs.",
    testimonial6Name: "Daniel Wolf",
    testimonial6Occupation: "CDO",
    testimonial6Text:
      "La qualité de ce produit a dépassé mes attentes. Il est durable, bien conçu et construit pour durer. Cela vaut vraiment l'investissement !",

    // Pricing
    pricingTitle: "Tarifs",
    pricingDesc: "Choisissez le forfait qui vous convient, à vous et à votre équipe.",
    planFreeTitle: "Gratuit",
    // planFreeDescription: ["1 utilisateur inclus", "1 site inclus", "Stockage illimité", "Téléchargement de rapports", "Assistance par e-mail", "Support client 24/7"],
    planStarterTitle: "Démarrage",
    // planStarterDescription: ["2 utilisateurs inclus", "2 sites inclus", "Stockage illimité", "Accès au centre d'aide", "Téléchargement de rapports", "Assistance par e-mail", "Support client 24/7"],
    planGrowthTitle: "Croissance",
    // planGrowthDescription: ["5 utilisateurs inclus", "3 sites inclus", "Stockage illimité", "Téléchargement de rapports", "Accès au centre d'aide", "Assistance e-mail prioritaire", "Meilleures offres", "Support client 24/7"],
    planEnterpriseTitle: "Entreprise",
    // planEnterpriseDescription: ["Utilisateurs illimités", "Sites illimités", "Stockage illimité", "Accès prioritaire au centre d'aide", "Équipe dédiée", "Téléchargement de rapports", "Assistance téléphonique et e-mail", "Assistance e-mail prioritaire", "Support client 24/7"],
    // In TRANSLATIONS.fr
    planFreeDescription: "1 utilisateur inclus\n1 site inclus\nStockage illimité\nTéléchargement de rapports\nAssistance par e-mail\nSupport client 24/7",
    planStarterDescription: "2 utilisateurs inclus\n2 sites inclus\nStockage illimité\nAccès au centre d'aide\nTéléchargement de rapports\nAssistance par e-mail\nSupport client 24/7",
    planGrowthDescription: "5 utilisateurs inclus\n3 sites inclus\nStockage illimité\nTéléchargement de rapports\nAccès au centre d'aide\nAssistance e-mail prioritaire\nMeilleures offres\nSupport client 24/7",
    planEnterpriseDescription: "Utilisateurs illimités\nSites illimités\nStockage illimité\nAccès prioritaire au centre d'aide\nÉquipe dédiée\nTéléchargement de rapports\nAssistance téléphonique et e-mail\nAssistance e-mail prioritaire\nSupport client 24/7",
    planFreeButton: "S'inscrire gratuitement",
    planStarterButton: "Commencer",
    planGrowthButton: "Commencer maintenant",
    planEnterpriseButton: "Devenir plus intelligent",
    perMonth: "/ mois",

    // FAQ
    faqTitle: "Questions fréquemment posées",
    faqQuestion1: "Comment se connecter ? Quel est le flux OTP ?",
    faqAnswer1:
      "Connectez-vous avec votre e-mail et votre mot de passe, puis vérifiez à l'aide du code unique envoyé à votre e-mail. Utilisez le bouton <strong>Renvoyer le code</strong> si le code n'arrive pas. L'application utilise l'OTP par e-mail plutôt qu'une authentification par mot de passe seul pour une sécurité accrue.",
    faqQuestion2: "Je n'ai pas reçu d'OTP ou d'e-mail d'invitation — que dois-je faire ?",
    faqAnswer2:
      "Vérifiez votre dossier spam/courrier indésirable et confirmez que l'e-mail est correct. Demandez à l'expéditeur de renvoyer l'invitation ou le code. Si l'application affiche des erreurs SMTP ou de livraison, contactez le support ou l'administrateur de votre organisation.",
    faqQuestion3: "Comment fonctionnent le mode hors ligne et la synchronisation ?",
    faqAnswer3:
      "La PWA peut mettre en file d'attente certaines créations, mises à jour et téléchargements dans le navigateur (IndexedDB) en mode hors ligne. Lorsque vous vous reconnectez, les actions en file d'attente sont synchronisées avec le serveur. Évitez d'effacer les données du site jusqu'à ce que la synchronisation soit terminée pour éviter la perte de données.",
    faqQuestion4: "Où puis-je trouver la politique de confidentialité et les conditions ? Comment demander la suppression des données ?",
    faqAnswer4:
      "Les liens vers la politique de confidentialité et les conditions sont disponibles dans le pied de page et dans le centre d'aide. Pour les demandes d'exportation ou de suppression de données, contactez le contact de confidentialité indiqué sur la page de politique de confidentialité (ou envoyez un e-mail au propriétaire/administrateur de l'organisation pour lancer la demande).",

    // Footer
    footerDescription: "Smarter Panel est une plateforme puissante et conviviale qui aide les entreprises à rationaliser leurs opérations.",
    footerProduct: "Produit",
    footerDescriptionLink: "Description",
    footerFeaturesLink: "Fonctionnalités",
    footerTestimonialsLink: "Témoignages",
    footerPricingLink: "Tarifs",
    footerHelpCenter: "Centre d'aide",
    footerFaq: "FAQ",
    footerCompany: "Entreprise",
    footerAboutUs: "À propos de nous",
    footerCareers: "Carrières",
    footerPress: "Presse",
    footerPrivacyPolicy: "Politique de confidentialité",
    footerTermsOfService: "Conditions d'utilisation",
    footerCopyright: "Copyright © {year} Smarter Panel",
    and: "et les",

    // In TRANSLATIONS.fr
    helpTitle: "Centre d'aide — Smarter Panel",
    helpIntro: "Guide pratique d'utilisation de Smarter Panel. Vous trouverez ci-dessous des sujets pour vous aider à démarrer, résoudre les problèmes courants et comprendre les limites et règles du produit. Pour les conditions de confidentialité et légales, consultez les liens en bas de page.",
    helpGettingStartedTitle: "Premiers pas",
    helpGettingStartedText: "Créez une organisation depuis l'écran de connexion, définissez un mot de passe (6 caractères min.) et vérifiez à l'aide du code envoyé à votre e-mail. Complétez les profils d'organisation et personnel comme demandé.",
    helpSignInTitle: "Connexion, OTP et réinitialisation du mot de passe",
    helpSignInText: "Smarter Panel utilise des codes à usage unique (OTP) par e-mail pour la connexion, l'inscription et la réinitialisation du mot de passe. Si vous ne recevez pas de code, vérifiez les spams/courriers indésirables et utilisez le bouton de renvoi. Dans les environnements de développement, un OTP de développement peut être affiché à l'écran lorsque SMTP n'est pas configuré.",
    helpInvitationsTitle: "Invitations",
    helpInvitationsText: "Les administrateurs invitent des utilisateurs depuis Admin → Utilisateurs. Les invités acceptent via le lien ou le jeton dans l'e-mail, définissent un mot de passe, puis vérifient à l'aide d'un code e-mail.",
    helpOfflineTitle: "Mode hors ligne",
    helpOfflineText: "La PWA prend en charge les files d'attente hors ligne pour certaines créations/mises à jour/téléchargements. Si vous travaillez hors ligne, les éléments sont mis en file d'attente dans le navigateur (IndexedDB) et synchronisés lorsque la connectivité revient. L'effacement des données du site peut supprimer le travail non synchronisé.",
    helpSupportTitle: "Support",
    helpSupportText: "Utilisez le chat de support flottant dans l'application ou envoyez un e-mail à notre équipe de support à {email}.",
    helpDocLink: "Pour la documentation complète, consultez la ",

    privacyTitle: "Politique de confidentialité — Smarter Panel",
    privacyIntro: "Cette page résume comment Smarter Panel collecte et traite les données. Ceci est un brouillon orienté produit — faites-le réviser par un juriste avant la mise en production.",
    privacyWhatCollectTitle: "Ce que nous collectons",
    privacyWhatCollectText: "Nous collectons les données de compte/profil, les données d'organisation, les données opérationnelles de l'entreprise (revenus, dépenses, stocks, RH), les communications de facturation et de support, les données d'authentification (OTP et jetons) et les caches côté client pour le support hors ligne.",
    privacyWhyProcessTitle: "Pourquoi nous traitons les données",
    privacyWhyProcessText: "Pour fournir et sécuriser le Service, soutenir l'intégration, la facturation, la continuité hors ligne et la conformité légale. Nous ne vendons pas vos informations personnelles.",
    privacySharingTitle: "Partage",
    privacySharingText: "Nous partageons les données avec votre organisation, notre processeur de paiement, nos fournisseurs d'e-mail, notre infrastructure d'hébergement et lorsque la loi l'exige.",
    privacyRetentionTitle: "Conservation et suppression",
    privacyRetentionText: "Les données actives sont conservées pendant que votre organisation utilise le Service. Les caches des appareils persistent jusqu'à leur effacement. Contactez la confidentialité pour les demandes d'exportation ou de suppression.",
    privacyContact: "Contact : {email}",

    termsTitle: "Conditions générales — Smarter Panel",
    termsIntro: "Ces conditions régissent l'accès et l'utilisation de Smarter Panel. Ceci est un brouillon de produit et doit être révisé par un juriste avant publication.",
    termsAccountsTitle: "Comptes et éligibilité",
    termsAccountsText: "Les organisations et les comptes propriétaires sont responsables des profils, des utilisateurs, des abonnements et du respect de ces conditions.",
    termsSubscriptionsTitle: "Abonnements et facturation",
    termsSubscriptionsText: "Les forfaits peuvent limiter les utilisateurs et les sites. Les propriétaires gèrent la facturation et peuvent mettre à niveau ou renouveler via l'interface de facturation. Le paiement peut utiliser un fournisseur tiers.",
    termsRulesTitle: "Règles du produit",
    termsRulesText: "Le produit applique des règles pratiques telles que des limites de date de 7 jours et des verrous de modification/suppression de 24 heures sur de nombreux enregistrements pour réduire la fraude et les erreurs.",
    termsContact: "Contact légal : {email}",

    termsContent: `
# Conditions générales — Smarter Panel

**Date d’entrée en vigueur :** \`08/2026\`

**Avertissement :** Ce document est un brouillon aligné sur le produit tel qu’il fonctionne aujourd’hui. Il ne constitue pas un avis juridique. Faites-le relire par un conseil juridique et complétez tous les espaces réservés avant publication.

---

## 1. Acceptation des présentes Conditions

Les présentes Conditions générales (« Conditions ») régissent l’accès et l’utilisation de **Smarter Panel** (le « Service »), exploité par \`ATI SARL\` (« nous »), situé à \`Ndogbong, Douala Cameroun\`.

En créant un compte, en acceptant une invitation ou en utilisant le Service, vous acceptez les présentes Conditions et notre Politique de confidentialité. Si vous utilisez le Service pour le compte d’une organisation, vous déclarez avoir le pouvoir de l’engager, et « vous » inclut cette organisation.

Si vous n’acceptez pas, n’utilisez pas le Service.

---

## 2. Le Service

Smarter Panel est une application web multi-locataire (y compris une application web progressive) d’administration d’entreprise. Selon votre forfait et vos permissions, les fonctionnalités peuvent inclure :

- Tableau de bord et rapports  
- Suivi des revenus et des dépenses  
- Gestion d’inventaire et journalisation d’incidents  
- RH / fiches personnel et documents  
- Devis  
- Administration de l’organisation (utilisateurs, rôles, sites, catalogues)  
- Facturation et abonnements  
- Journaux d’audit et notifications in-app  
- Chat de support in-app  

Nous pouvons ajouter, modifier ou retirer des fonctionnalités. Nous ne garantissons pas qu’une fonctionnalité restera disponible indéfiniment.

Les déploiements de production sont souvent servis sous des domaines tels que \`app.smarterworkspace.cloud\` et \`api.smarterworkspace.cloud\`, ou d’autres domaines que vous configurez.

---

## 3. Comptes et éligibilité

### 3.1 Éligibilité

Vous devez pouvoir conclure un contrat valide selon \`[Governing Law / Jurisdiction]\` et respecter l’âge minimum que nous fixons : \`[Minimum Age]\`. Le Service est destiné à un usage professionnel.

### 3.2 Comptes propriétaire d’organisation

L’inscription crée une **organisation** et un utilisateur **propriétaire**. Le propriétaire est responsable de :

- Compléter le profil de l’organisation lorsque requis  
- Gérer les utilisateurs, invitations, rôles et sites (directement ou via des admins autorisés)  
- La facturation, le choix de forfait et l’état d’abonnement  
- Veiller à ce que l’usage du Service respecte les présentes Conditions et la loi applicable  

### 3.3 Utilisateurs invités

Les admins peuvent inviter des collègues par e-mail. Les invités définissent un mot de passe et vérifient avec un code à usage unique. Les utilisateurs invités ne doivent utiliser que l’accès accordé par leur organisation et doivent respecter les présentes Conditions.

### 3.4 Informations de compte

Vous acceptez de fournir des informations exactes et de les maintenir à jour. Vous ne devez pas usurper l’identité d’autrui ni créer de comptes à des fins non autorisées.

---

## 4. Sécurité des comptes

- Protégez votre mot de passe et votre appareil.  
- La connexion, l’inscription, l’acceptation d’invitation et la réinitialisation du mot de passe utilisent des **mots de passe à usage unique (OTP) par e-mail**.  
- Les admins d’organisation peuvent réinitialiser des mots de passe ou désactiver des utilisateurs lorsque c’est autorisé.  
- Vous ne devez utiliser les flux « mot de passe oublié » ou « changer le mot de passe » que pour les comptes que vous êtes autorisé à contrôler.  
- Signalez-nous rapidement à \`contact@acheteici.com\` tout accès non autorisé suspecté.  

Vous êtes responsable de l’activité sous vos identifiants, sauf dans la mesure où elle résulte de notre manquement à mettre en œuvre des mesures de sécurité raisonnables.

---

## 5. Usage acceptable

Vous acceptez de ne pas :

- Enfreindre la loi ou les droits de tiers  
- Téléverser de logiciels malveillants ni tenter de compromettre, aspirer ou surcharger le Service  
- Accéder aux données d’une autre organisation sans autorisation  
- Contourner les permissions, le périmètre de site, les verrouillages d’édition ou les plafonds d’abonnement  
- Utiliser le Service pour du spam illégal ou du hameçonnage (y compris l’abus d’invitations ou du support)  
- Procéder à de l’ingénierie inverse du Service, sauf lorsque cette restriction est interdite par la loi  
- Revendre ou marquer en marque blanche le Service sans notre autorisation écrite  

Nous pouvons suspendre ou résilier l’accès en cas de violation, de risque de sécurité, de non-paiement ou de suspension d’organisation.

---

## 6. Contenu client et propriété des données

### 6.1 Votre contenu

Le « Contenu client » désigne les données que vous ou votre organisation soumettez au Service (enregistrements financiers, inventaire, fichiers RH, devis, messages de chat, téléversements, etc.).

Entre vous et nous, votre organisation conserve la propriété du Contenu client. Vous nous accordez une licence mondiale non exclusive pour héberger, traiter, transmettre et afficher le Contenu client uniquement afin de fournir et d’améliorer le Service, de respecter la loi, et comme décrit dans la Politique de confidentialité.

### 6.2 Responsabilité relative au Contenu client

Vous êtes responsable du Contenu client, y compris de disposer des droits et consentements nécessaires (surtout pour les données personnelles du personnel et des clients) et des sauvegardes adaptées à vos besoins métier.

### 6.3 Notre propriété intellectuelle

Le Service, les logiciels, la marque, les modèles de devis par défaut et la documentation (hors Contenu client) nous appartiennent ou appartiennent à nos concédants. Les présentes Conditions ne vous transfèrent pas la propriété de notre PI.

---

## 7. Rôles, permissions et sites

L’accès au sein d’une organisation est contrôlé par les rôles et permissions. Les données sont en général filtrées par organisation et souvent par site. L’accès global ou « tous les sites » peut être réservé à certains rôles.

Une mauvaise configuration des rôles par vos admins relève de la responsabilité de votre organisation. Contactez d’abord l’administrateur de votre organisation pour les problèmes d’accès.

---

## 8. Abonnements, facturation et plafonds

### 8.1 Forfaits et plafonds

Les abonnements peuvent limiter le **nombre maximal d’utilisateurs** et de **sites**. La création d’utilisateurs ou de sites au-delà des plafonds peut être bloquée jusqu’à une mise à niveau ou la libération de capacité.

### 8.2 Offre gratuite, probation et suspension

Les organisations peuvent commencer sur un forfait gratuit ou limité. Si un abonnement entre en **probation** (par ex. après expiration), le Service peut restreindre la connexion de sorte que **seul le propriétaire** puisse accéder au compte jusqu’au renouvellement. Les opérateurs de plateforme peuvent aussi **suspendre** des organisations ; les organisations suspendues peuvent ne plus pouvoir utiliser le Service.

### 8.3 Paiement

Les forfaits payants peuvent être souscrits ou renouvelés via la Facturation in-app (propriétaire uniquement). Le paiement peut vous rediriger vers **Tranzak** ou un autre prestataire. Des coupons peuvent appliquer des remises ou activer un forfait sans paiement lorsqu’ils sont valides.

Le renouvellement ou le changement de forfait peut n’être autorisé que dans une fenêtre de renouvellement définie (par ex. autour de l’échéance), sauf si le produit permet le paiement à tout moment.

### 8.4 Frais, taxes, remboursements

Frais, taxes, devise (souvent affichée en XAF pour les montants de facturation dans le produit) et éligibilité aux remboursements : \`[Pricing / Refund Policy URL or summary]\`. Des demandes de remboursement initiées par le propriétaire peuvent exister au niveau API/plateforme ; la disponibilité dans l’UI peut varier.

### 8.5 Non-paiement

Nous pouvons rétrograder, limiter ou suspendre le Service en cas de paiement manqué ou échoué selon nos pratiques de facturation : \`[Billing Enforcement Details]\`.

---

## 9. Disponibilité, usage hors ligne et support

### 9.1 Disponibilité

Nous visons une disponibilité raisonnable mais ne garantissons pas un fonctionnement ininterrompu ou sans erreur. Maintenance, pannes et cas de force majeure peuvent survenir.

### 9.2 PWA et synchronisation hors ligne

Le Service peut fonctionner comme PWA installable et mettre en file certaines actions de création/mise à jour/suppression ou téléversement hors ligne, puis synchroniser au retour du réseau. Les files hors ligne ne remplacent pas des sauvegardes durables. Les données locales non synchronisées peuvent être perdues si le stockage du navigateur est effacé. Les données de référence résident sur le serveur après synchronisation réussie.

### 9.3 Support

Le support peut être disponible via le chat Support in-app et/ou \`contact@acheteici.com\`. Nous ne garantissons pas de délais de réponse sauf accord écrit distinct : \`[Support SLA if any]\`.

---

## 10. Règles produit affectant votre usage

Sans limiter les autres Conditions, le produit applique actuellement des règles telles que :

- Les **dates de transaction** de revenus et dépenses ne peuvent en général pas être antérieures de plus de **7 jours**  
- Certains enregistrements peuvent être **verrouillés en modification ou suppression après 24 heures** (prévention de la fraude)  
- Les propriétaires peuvent devoir compléter le profil d’organisation avant l’usage complet ; les utilisateurs peuvent devoir compléter le profil personnel  

Ces règles opérationnelles peuvent évoluer avec le produit.

---

## 11. Confidentialité

Chaque partie peut recevoir des informations non publiques de l’autre. Vous ne divulguez pas nos informations non publiques relatives au Service. Nous traitons le Contenu client comme confidentiel et l’utilisons comme décrit dans les présentes Conditions et la Politique de confidentialité, sauf informations publiques, développées indépendamment, ou devant être divulguées en vertu de la loi.

---

## 12. Avertissements / exclusions de garantie

LE SERVICE EST FOURNI « EN L’ÉTAT » ET « SELON DISPONIBILITÉ » DANS LA MESURE MAXIMALE PERMISE PAR LA LOI. NOUS DÉCLINONS TOUTE GARANTIE, EXPRESSE, IMPLICITE OU LÉGALE, Y COMPRIS DE QUALITÉ MARCHANDE, D’ADÉQUATION À UN USAGE PARTICULIER ET DE NON-CONTREFAÇON.

Nous ne garantissons pas que les rapports, prévisions, valorisations d’inventaire ou fichiers exportés sont exempts d’erreur ou adaptés à une finalité réglementaire, fiscale ou d’audit particulière. Vous restez responsable de vos propres décisions comptables, fiscales et de conformité.

---

## 13. Limitation de responsabilité

DANS LA MESURE MAXIMALE PERMISE PAR \`[Governing Law / Jurisdiction]\` :

- Nous ne sommes pas responsables des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs, ni des pertes de profits, de revenus, de données ou d’opportunités commerciales.  
- Notre responsabilité globale découlant du Service ou des présentes Conditions ne dépassera pas le plus élevé de (a) les sommes que vous nous avez payées pour le Service au cours des **\`[e.g. 12]\` mois** précédant la réclamation, ou (b) **\`[Minimum Cap Amount]\`**.  

Certaines juridictions n’autorisent pas certaines limitations ; dans ce cas, notre responsabilité est limitée dans toute la mesure permise.

---

## 14. Indemnisation

Vous nous défendrez et indemniserez, ainsi que nos affiliés, dirigeants et employés, contre les réclamations, dommages et frais (y compris honoraires d’avocat raisonnables) découlant de : (a) Contenu client ; (b) mauvais usage du Service ; (c) violation des présentes Conditions ; ou (d) violation de la loi ou de droits de tiers par vous ou vos utilisateurs — sauf dans la mesure causée par notre faute intentionnelle.

---

## 15. Suspension et résiliation

- Vous pouvez cesser d’utiliser le Service à tout moment. Clôture d’organisation / export de données : \`[Account Closure Process]\`.  
- Nous pouvons suspendre ou résilier en cas de manquement, de risque, de non-paiement, d’inactivité prolongée ou d’obligation légale.  
- À la résiliation, votre droit d’accès au Service prend fin. Survie : les sections sur la PI, la licence Contenu client (pour la transition), les exclusions, la responsabilité, l’indemnisation et le droit applicable survivent.  

---

## 16. Modifications des Conditions

Nous pouvons mettre à jour les présentes Conditions. Nous réviserons la date d’entrée en vigueur et pourrons notifier les propriétaires par \`[Notification Method]\`. L’usage continu après l’entrée en vigueur des changements vaut acceptation dans la mesure permise par la loi. Si vous n’acceptez pas, cessez d’utiliser le Service.

---

## 17. Droit applicable et litiges

Les présentes Conditions sont régies par les lois de \`[Governing Law / Jurisdiction]\`, à l’exclusion des règles de conflit de lois. Tribunaux / arbitrage : \`[Venue or Arbitration Clause]\`.

---

## 18. Dispositions générales

- **Intégralité de l’accord :** les présentes Conditions et la Politique de confidentialité constituent l’intégralité de l’accord relatif au Service, sauf contrat écrit distinct contraire.  
- **Divisibilité :** si une disposition est inapplicable, le reste demeure en vigueur.  
- **Cession :** vous ne pouvez pas céder les présentes Conditions sans notre consentement ; nous pouvons céder à un affilié ou successeur.  
- **Non-renonciation :** le défaut d’appliquer une disposition ne constitue pas une renonciation.  
- **Notifications :** avis juridiques à notre attention : \`contact@acheteici.com\` / \`contact@acheteici.com\`. Les avis à votre attention peuvent être envoyés à l’e-mail du propriétaire enregistré ou via le Service.  

---

## 19. Contact

- **Juridique :** \`contact@acheteici.com\`
- **Support :** \`contact@acheteici.com\` ou chat Support in-app
- **Confidentialité :** \`contact@acheteici.com\`
- **Courrier :** \`contact@acheteici.com\`

---

*Référence produit : Smarter Panel (déploiements ATI / smarterworkspace.cloud selon la configuration de l’opérateur).*
`,

helpCenterContent: `
# Centre d’aide — Smarter Panel

Guide pratique d’utilisation de **Smarter Panel**, basé sur l’application actuelle. L’interface est disponible en **anglais** et en **français** (sélecteur de langue dans l’en-tête). Les devises d’affichage incluent **XAF**, **USD**, **EUR** et **CAD** (conversion d’affichage ; les montants de facturation sont en général présentés en XAF).

**Support :** utilisez le chat flottant **Support** dans l’application, ou contactez \`contact@acheteici.com\`.

---

## Sommaire

1. [Premiers pas](#1-premiers-pas)
2. [Connexion, OTP et réinitialisation du mot de passe](#2-connexion-otp-et-réinitialisation-du-mot-de-passe)
3. [Invitations](#3-invitations)
4. [Navigation, sites et langues](#4-navigation-sites-et-langues)
5. [Rôles et permissions](#5-rôles-et-permissions)
6. [Tableau de bord](#6-tableau-de-bord)
7. [Revenus](#7-revenus)
8. [Dépenses](#8-dépenses)
9. [Inventaire](#9-inventaire)
10. [RH](#10-rh)
11. [Rapports](#11-rapports)
12. [Devis](#12-devis)
13. [Admin](#13-admin)
14. [Profil de l’organisation](#14-profil-de-lorganisation)
15. [Profil personnel](#15-profil-personnel)
16. [Facturation](#16-facturation)
17. [Journaux d’audit et notifications](#17-journaux-daudit-et-notifications)
18. [Mode hors ligne](#18-mode-hors-ligne)
19. [Chat Support](#19-chat-support)
20. [Limites et règles courantes](#20-limites-et-règles-courantes)
21. [Dépannage](#21-dépannage)

---

## 1. Premiers pas

### Créer une organisation (propriétaire)

1. Sur l’écran de connexion, choisissez **Créer une organisation**.  
2. Saisissez le nom de l’organisation, votre nom (champs optionnels selon l’écran), l’e-mail et le mot de passe (minimum **6** caractères).  
3. Validez et saisissez le **code de vérification** reçu par e-mail.  
4. Après l’inscription, vous êtes en général sur un forfait gratuit avec un nombre limité d’utilisateurs et de sites.

### Compléter les profils requis

Avant l’application principale :

1. **Profil de l’organisation** (propriétaires uniquement, s’il n’est pas complété) — raison sociale, adresse, contact, n° fiscal, logo et champs associés.  
2. **Profil personnel** — votre nom et les autres détails personnels requis au sein de l’organisation.

Vous pouvez ouvrir **Organisation** et **Profil** plus tard depuis la barre latérale (Organisation réservé au propriétaire).

---

## 2. Connexion, OTP et réinitialisation du mot de passe

### Connexion

1. Saisissez e-mail et mot de passe → **Connexion**.  
2. Saisissez le **code à usage unique** reçu par e-mail → **Vérifier**.  
3. Utilisez **Renvoyer le code** si besoin.

Smarter Panel utilise un OTP par e-mail pour la connexion (pas le mot de passe seul).

### Mot de passe oublié

1. Sur l’écran de connexion, cliquez sur **Mot de passe oublié ?**  
2. Saisissez l’e-mail du compte → **Envoyer le code**.  
3. À l’écran suivant, saisissez le **code à 6 chiffres** reçu par e-mail, votre **nouveau mot de passe** et la confirmation → **Mettre à jour le mot de passe**.  
4. Connectez-vous normalement avec le nouveau mot de passe.

Vous recevez un **code de vérification**, pas un lien cliquable de réinitialisation. Pour des raisons de sécurité, l’application peut afficher un message de succès générique même si l’e-mail est inconnu.

### Changement de mot de passe forcé

Si un admin réinitialise votre mot de passe, vous pouvez être obligé d’en définir un nouveau (mot de passe actuel/temporaire + nouveau) avant de continuer.

### Déconnexion

Utilisez **Déconnexion** dans la barre latérale. Cela efface les données de session locales (en mode jeton).

---

## 3. Invitations

### Pour les admins

Dans **Admin → Utilisateurs** (permission requise) :

1. Envoyez une invitation avec l’e-mail du collègue et le rôle (et les sites le cas échéant).  
2. L’invité reçoit un e-mail avec un lien d’acceptation (jeton \`?invite=\`).  
3. Vous pouvez **Renvoyer** les invitations en attente si l’e-mail a échoué.

### Pour les invités

1. Ouvrez le lien d’invitation (ou collez le jeton sur l’écran Accepter l’invitation).  
2. Définissez prénom/nom et mot de passe → continuer.  
3. Vérifiez avec l’OTP e-mail, puis complétez votre profil personnel si demandé.

---

## 4. Navigation, sites et langues

- **Barre latérale :** Tableau de bord, Revenus, Dépenses, Inventaire, RH, Rapports, Devis, Admin, Journaux d’audit (si autorisé), Organisation (propriétaire), Facturation (propriétaire), Profil, Déconnexion.  
- **Sélecteur de site (en-tête) :** filtre les données sur un site. Les utilisateurs avec accès à tous les sites peuvent choisir **Tous**.  
- **Langue :** EN / FR.  
- **Thème :** clair / sombre.  
- **Devise (en-tête) :** change l’**affichage** des montants ; cela ne change pas la logique de devise stockée côté serveur.

Les entrées de menu n’apparaissent que si votre rôle a la permission **voir** correspondante (Facturation et Organisation exigent le **propriétaire**).

---

## 5. Rôles et permissions

Les rôles sont définis par organisation dans **Admin → Rôles**. Les permissions couvrent voir/ajouter/modifier/supprimer pour les modules, la configuration admin, les journaux d’audit, les notifications et les actions de gestion des utilisateurs (réinitialiser le mot de passe, désactiver, supprimer, etc.).

Schémas typiques :

- **Propriétaire** — contrôle métier complet, y compris Facturation et profil Organisation.  
- **Super admin / tous les sites** — accès large entre sites lorsqu’il est configuré.  
- **Rôles limités à un site** — voir et modifier uniquement les données des sites assignés.

Si une page manque ou que des actions sont désactivées, demandez à l’administrateur de votre organisation — pas nécessairement au support plateforme.

---

## 6. Tableau de bord

Affiche des indicateurs de haut niveau pour le site sélectionné (ou tous, si autorisé) :

- Total des revenus, total des dépenses, solde net  
- Valeur d’inventaire et signaux de santé / pertes  

Utilisez-le pour un aperçu opérationnel rapide ; utilisez **Rapports** pour une analyse plus poussée et l’export.

---

## 7. Revenus

Enregistrer les sommes reçues pour un site :

- Montant, date, source, description (et champs associés selon l’écran)  
- Nécessite les permissions d’ajout/modification/suppression selon le cas  

**Règle de date :** la date de transaction ne peut en général pas être antérieure de plus de **7 jours**.  
**Verrouillage édition/suppression :** de nombreux enregistrements ne peuvent plus être modifiés ou supprimés après **24 heures** (prévention de la fraude).

Les sources peuvent être suggérées depuis les catalogues Admin, mais le texte libre reste souvent possible.

---

## 8. Dépenses

Même schéma que les Revenus : montant, date, catégorie/description, périmètre de site, permissions, règle des **7 jours**, et verrouillage **24 heures**.

Les catégories et descriptions de dépenses se gèrent dans les catalogues Admin.

---

## 9. Inventaire

Gérer les lignes de stock :

- Nom, type, quantité, valeur, statut, péremption, notes, lieu de stockage, photo  
- **Incidents / événements :** enregistrer endommagé, périmé, volé, restauré ou ajustements (avec notes lorsque requis)  

La création/édition d’enregistrement peut verrouiller certains champs après **24 heures** ; des champs opérationnels (quantité, statut, notes, etc.) peuvent rester modifiables selon les règles produit.

Les images sont téléversées puis enregistrées sur la fiche inventaire.

---

## 10. RH

Gérer les fiches du personnel :

- Détails personnels et d’emploi (nom, date de naissance, genre, contacts, poste, date d’embauche, statut, sites)  
- Téléverser et gérer les **documents du personnel**  
- Lier éventuellement le personnel à des comptes utilisateurs / invitations (selon l’UI)

Nécessite les permissions RH. Traitez les données du personnel comme des informations personnelles sensibles.

---

## 11. Rapports

Analyses et exports pour revenus, dépenses, inventaire et vues associées (graphiques, prévisions le cas échéant).

Les exports peuvent inclure **CSV**, **Excel (.xlsx)** et des flux d’impression selon le rapport. Les exports s’exécutent dans le navigateur à partir des données auxquelles vous avez déjà accès.

---

## 12. Devis

Créer des devis professionnels :

- Partir d’un devis vide ou d’un **modèle**  
- Blocs client et entreprise, lignes, taxes, totaux, statut (brouillon, envoyé, accepté, etc.)  
- Image de marque (logo, couleurs, mise en page)  
- Export CSV / Excel / PDF prêt à imprimer via l’aperçu du devis  

La gestion des modèles de devis peut exiger une permission distincte.

---

## 13. Admin

L’Admin est découpé en zones contrôlées par permissions, par exemple :

- **Utilisateurs** – Inviter, modifier rôles/sites, réinitialiser le mot de passe (temporaire), désactiver/supprimer  
- **Rôles** – Créer des rôles et assigner des jeux de permissions  
- **Config / catalogues** – Sites, catégories de dépenses, types d’inventaire, postes, sources de revenus, descriptions de dépenses, lieux de stockage

La création d’utilisateurs ou de sites peut échouer si vos **plafonds d’abonnement** sont atteints — mettez à niveau dans Facturation (propriétaire) ou libérez une place/un site.

---

## 14. Profil de l’organisation

**Propriétaire uniquement.** Maintenir l’identité légale et de contact de l’entreprise (raison sociale, n° fiscal, adresse, logo, secteur, etc.). Les champs requis peuvent devoir être complétés avant le déblocage du reste de l’application pour une nouvelle organisation.

---

## 15. Profil personnel

Mettre à jour vos détails personnels, photo de profil et mot de passe (mot de passe actuel requis). Compléter le profil personnel peut être obligatoire à la première utilisation.

---

## 16. Facturation

**Propriétaire uniquement.**

- Voir le forfait actuel, le statut, l’usage (utilisateurs / sites) et la date d’échéance  
- Parcourir les forfaits et s’abonner ou renouveler  
- Appliquer des **codes promo** lorsqu’ils sont disponibles (certains peuvent activer un forfait sans paiement)  
- Le paiement peut rediriger vers **Tranzak**  

**Fenêtre de renouvellement :** les changements de forfait peuvent n’être autorisés que quelques jours avant/après l’échéance, sauf si le produit permet le paiement à tout moment.

**Probation :** si l’organisation est en probation sur le forfait gratuit, une bannière indique que **seul le propriétaire** peut se connecter jusqu’à un nouvel abonnement.

---

## 17. Journaux d’audit et notifications

### Journaux d’audit

Si autorisé, consultez un historique paginé des actions (qui a fait quoi, sur quelle ressource, quand, éventuellement filtré par site/date). Utile pour la traçabilité et le dépannage.

### Notifications

La cloche de l’en-tête affiche les notifications non lues (selon permission). Ouvrez la liste pour les consulter et les marquer comme lues selon l’UI.

---

## 18. Mode hors ligne

Smarter Panel peut être installé comme **PWA** et fonctionner avec une connectivité limitée :

1. L’en-tête indique l’état en ligne / hors ligne.  
2. Hors ligne, certaines créations/mises à jour/suppressions et téléversements peuvent être **mis en file** localement (IndexedDB).  
3. Au retour du réseau, l’application **synchronise** la file et actualise les caches.  
4. Vous pouvez voir des messages indiquant que les données ont été enregistrées hors ligne et seront synchronisées en ligne.

**Important :** effacer les données du navigateur, désinstaller la PWA ou échouer la sync peut faire perdre le travail non synchronisé. Préférez le travail en ligne pour les saisies critiques. La connexion et l’OTP nécessitent toujours le réseau/e-mail pour s’authentifier.

---

## 19. Chat Support

Utilisez le widget flottant **Support** (en général en bas à droite) :

1. Ouvrez un nouveau fil avec un objet et un message, ou poursuivez un fil existant.  
2. Le personnel de support de la plateforme peut répondre ; le widget peut se rafraîchir périodiquement.  

Cela contacte le support **plateforme**, pas l’admin de votre organisation. Pour les problèmes de permissions ou de sites, demandez d’abord à votre admin.

---

## 20. Limites et règles courantes

- **Limite de date 7 jours** – Les dates de revenus/dépenses ne peuvent en général pas être antérieures de plus de 7 jours  
- **Verrouillage 24 heures** – De nombreux enregistrements ne peuvent plus être modifiés ou supprimés 24 h après création  
- **Plafonds de forfait** – Nombre max d’utilisateurs et de sites par abonnement  
- **Propriétaire uniquement** – Facturation et profil Organisation  
- **OTP partout** – Inscription, connexion, acceptation d’invitation et réinitialisation exigent des codes e-mail  
- **Longueur du mot de passe** – Au moins 6 caractères pour les nouveaux mots de passe

---

## 21. Dépannage

### Je n’ai pas reçu d’OTP ou d’e-mail d’invitation

- Vérifiez les indésirables / spam.  
- Cliquez sur **Renvoyer le code** ou demandez à un admin de **Renvoyer** l’invitation.  
- Si l’UI mentionne un échec SMTP / e-mail, la configuration e-mail du serveur peut être en panne — contactez \`contact@acheteici.com\`.  
- Hors production, un **OTP de développement** peut s’afficher à l’écran lorsque le SMTP n’est pas configuré.

### Mot de passe oublié : retour à la connexion sans message

Rechargez l’application en force (hard refresh) et réessayez. Vérifiez que l’API servant \`/auth/forgot-password/start\` est joignable (même origine \`/api\` en local).

### Je ne peux pas ouvrir un élément de menu

Il vous manque probablement une permission \`perm_view…\` pour ce module, ou vous n’êtes pas propriétaire (Facturation / Organisation). Demandez à votre administrateur.

### Je ne peux pas ajouter un utilisateur ou un site

Vérifiez l’usage d’abonnement sous Facturation. Les forfaits gratuits ou inférieurs appliquent des plafonds.

### Seul le propriétaire peut se connecter

L’organisation peut être en **probation** ou restreinte. Le propriétaire doit ouvrir Facturation et renouveler / s’abonner.

### Les changements faits hors ligne n’apparaissent jamais

Confirmez que vous êtes en ligne, attendez la sync, et évitez d’effacer les données du site. Réessayez l’action en ligne si la file a échoué.

### La connexion fonctionne mais je dois changer le mot de passe

Un admin a réinitialisé votre mot de passe ou \`passwordNeedsReset\` est activé. Complétez l’écran de changement obligatoire avec le mot de passe temporaire/actuel.

### Mauvaise langue ou devise

Utilisez les contrôles de l’en-tête ; ce sont des préférences de session/UI et elles ne modifient pas les réglages des autres utilisateurs.

---

## Besoin d’aide supplémentaire ?

1. Demandez à l’**administrateur de votre organisation** pour les rôles, sites et invitations.  
2. Utilisez le **chat Support** dans l’app pour les problèmes plateforme.  
3. Écrivez à \`contact@acheteici.com\`.  

---

*Dernière alignement avec le comportement produit Smarter Panel dans ce dépôt. Mettez à jour ce guide lorsque les fonctionnalités évoluent.*
`,

privacyPolicyContent: `
# Politique de confidentialité — Smarter Panel

**Date d’entrée en vigueur :** \`08/2026\`

**Avertissement :** Ce document est un brouillon aligné sur le produit tel qu’il fonctionne aujourd’hui. Il ne constitue pas un avis juridique. Faites-le relire par un conseil juridique et complétez tous les espaces réservés avant publication.

---

## 1. Qui nous sommes

**Smarter Panel** est une application multi-locataire d’administration d’entreprise (revenus, dépenses, inventaire, RH, devis, facturation et outils associés). Elle est exploitée par :

- **Entité juridique :** \`ATI SARL\`
- **Adresse du siège :** \`Ndogbong, Douala Cameroun\`
- **Produit / sites :** Smarter Panel ; en général \`app.smarterworkspace.cloud\` et \`api.smarterworkspace.cloud\` (ou vos domaines déployés)
- **Contact confidentialité :** \`contact@acheteici.com\`

Dans la présente politique, « nous » désigne \`ATI SARL\`. « Vous » désigne un utilisateur individuel ou l’organisation qui utilise le Service.

---

## 2. Champ d’application

Cette politique décrit le traitement des données personnelles et professionnelles lorsque vous :

- Créez ou rejoignez un compte d’organisation  
- Vous connectez (y compris via mots de passe à usage unique par e-mail)  
- Utilisez des modules tels que Tableau de bord, Revenus, Dépenses, Inventaire, RH, Rapports, Devis, Admin, Facturation, Journaux d’audit et chat Support  
- Installez ou utilisez l’application web progressive (PWA), y compris les fonctions hors ligne  

Elle ne couvre pas les sites ou services tiers que nous ne contrôlons pas (par exemple l’expérience de paiement Tranzak après sortie de notre parcours de paiement), sauf lorsque nous expliquons comment nous partageons des données avec eux.

---

## 3. Données que nous collectons

### 3.1 Données de compte et de profil

- Adresse e-mail, mot de passe (stocké haché côté serveur ; nous ne stockons pas les mots de passe en clair)  
- Prénom, nom, téléphone, adresse, intitulé de poste, photo de profil  
- Rôle et affectation(s) de site (location) au sein de votre organisation  
- Indicateurs tels que la nécessité de réinitialiser le mot de passe et l’état actif du compte  

### 3.2 Données d’organisation (entreprise)

Fournies principalement par le propriétaire de l’organisation :

- Nom de l’organisation, raison sociale, adresse, ville, pays, code postal  
- Téléphone professionnel, e-mail, site web, n° fiscal, secteur, description, logo  

### 3.3 Contenu opérationnel et financier que vous saisissez

Les données sont limitées à votre organisation (et en général à un site) :

- **Revenus et dépenses :** montants, dates, sources/descriptions, catégories, utilisateur et site associés  
- **Inventaire :** détails d’articles, quantités, valeurs, statut, péremption, notes, photos, lieux de stockage, et événements d’incident (ex. endommagé, périmé, volé, ajustements)  
- **RH / personnel :** identité et détails d’emploi (y compris date de naissance, genre, contacts, poste, date d’embauche, statut, sites) et documents du personnel téléversés  
- **Devis :** blocs contact client et entreprise, lignes, taxes, image de marque, notes/conditions  
- **Catalogues et configuration :** sites, rôles, catégories, postes, sources de revenus, descriptions de dépenses, lieux de stockage, et données d’administration similaires  
- **Journaux d’audit :** actions telles que connexion ou modifications de ressources, avec utilisateur, site, identifiants de ressource et détails  
- **Notifications in-app :** titres, messages, état de lecture et contexte associé  

### 3.4 Données de facturation et d’abonnement

- Forfait, statut, période de facturation, usage (utilisateurs/sites), informations de fenêtre de renouvellement  
- Codes promo appliqués à votre organisation  
- Références de paiement nécessaires pour finaliser ou confirmer un paiement  

Les détails de carte ou de portefeuille sont en général traités par le prestataire de paiement (voir section 6) ; nous recevons le statut et les références nécessaires pour activer ou renouveler les abonnements.

### 3.5 Communications de support

Messages et objets que vous envoyez via le chat Support in-app, et réponses du personnel de support de la plateforme.

### 3.6 Données d’authentification et de sécurité

- Codes de vérification à usage unique envoyés par e-mail pour l’inscription, la connexion, les invitations et la réinitialisation du mot de passe (codes de courte durée ; le serveur stocke des défis hachés, pas d’OTP en clair à long terme)  
- Identifiants de session : jetons bearer dans le stockage du navigateur par défaut, ou cookies de session httpOnly optionnels lorsque ce mode est activé  
- Jetons d’invitation lorsque des collègues sont invités par e-mail  

### 3.7 Données techniques et côté client

Sur votre appareil, l’application peut stocker :

- **localStorage :** jeton d’auth et données utilisateur/rôle en cache (hors mode cookies httpOnly) ; préférence de thème (\`smarter-panel-theme\`)  
- **IndexedDB :** caches de collections, files d’actions hors ligne, et blobs de téléversement temporaires pour la synchronisation au retour du réseau  
- **Caches PWA / service worker :** assets statiques pour un usage installable / hors ligne  

Nous traitons aussi des données techniques serveur/requête nécessaires au fonctionnement de l’API (par ex. adresse IP, horodatages et journaux d’erreurs sur notre infrastructure). La conservation des journaux : \`[Log Retention Policy / Contact Admin]\`.

### 3.8 Données que nous ne collectons pas volontairement in-app

Le frontend actuel de Smarter Panel n’intègre pas de SDK d’analytique produit tiers (par ex. Mixpanel, Google Analytics in-app). Google Fonts peut être chargé pour la typographie.

---

## 4. Comment nous collectons les données

- Directement via les formulaires (inscription, connexion, profils, modules, support)  
- Auprès des administrateurs d’organisation qui vous invitent ou gèrent votre rôle/vos sites  
- Via l’envoi d’e-mails OTP et d’invitations (SMTP)  
- Via les téléversements de fichiers (photos de profil, images d’inventaire, logos, documents RH)  
- Via le parcours de paiement et les webhooks avec notre prestataire de paiement  
- Automatiquement depuis le navigateur pour la session, le thème, la PWA et la sync hors ligne  

---

## 5. Finalités du traitement

- **Fournir le Service** – Stocker et afficher les données métier par organisation ; appliquer rôles et sites  
- **Sécurité des comptes** – Vérification du mot de passe, défis OTP, réinitialisation forcée, désactivation  
- **Onboarding** – Compléter les profils organisation et personnel avant l’accès complet  
- **Facturation** – Forfaits, plafonds, coupons, paiement, probation / état d’abonnement  
- **Support** – Fils de discussion avec le personnel de la plateforme  
- **Intégrité et anti-fraude** – Journaux d’audit ; règles de rétrodatation limitée et verrouillage après création  
- **Continuité hors ligne** – Mettre en file et rejouer les changements au retour du réseau  
- **Conformité légale** – \`[List any legal bases / obligations under Governing Law]\`

---

## 6. Partage et divulgation

Nous partageons les données uniquement dans la mesure nécessaire pour faire fonctionner Smarter Panel :

1. **Au sein de votre organisation** — Propriétaires, admins et collègues voient les données selon les rôles, permissions et périmètre de site.  
2. **Prestataire de paiement (Tranzak)** — Pour le paiement et la confirmation d’abonnement. Leur traitement est soumis à leurs propres conditions et politiques.  
3. **Fournisseurs d’e-mail / SMTP** — Pour livrer les codes OTP et les invitations.  
4. **Hébergement et infrastructure** — Prestataires hébergeant l’application, l’API, la base de données et les fichiers, sous nos instructions.  
5. **Opérateurs de plateforme** — Les outils d’administration plateforme peuvent accéder au statut des organisations, aux fils de support, aux paiements/remboursements et aux données opérationnelles liées.  
6. **Obligations légales** — Lorsque la loi, une décision de justice, ou la protection des droits, de la sécurité et de la sûreté l’exigent.  

Nous ne vendons pas vos informations personnelles.

---

## 7. Multi-locataires et usage international

Chaque organisation est un locataire : les données API sont limitées à l’organisation. Les utilisateurs n’accèdent en général qu’aux données de leur organisation, sous réserve des rôles et permissions de site.

Si vous accédez au Service depuis plusieurs pays, les données peuvent être traitées dans \`[Hosting Region(s)]\`. Garanties pour les transferts internationaux, le cas échéant : \`[Transfer Mechanism / Contact Privacy Email]\`.

---

## 8. Conservation et suppression

- Les données de compte et d’organisation actives sont conservées tant que l’organisation utilise le Service.  
- Les défis OTP sont de courte durée (ordre de magnitude : minutes), puis expirent ou sont consommés.  
- Les données hors ligne et en cache sur votre appareil restent jusqu’à effacement navigateur, déconnexion (clés d’auth), ou nettoyage de l’app/stockage.  
- Après clôture de compte ou d’organisation : \`[Retention Period and Deletion Process — fill in]\`.  

Pour demander une suppression ou un export : contactez \`contact@acheteici.com\` (et, le cas échéant, le propriétaire/admin de votre organisation).

---

## 9. Sécurité

Nous mettons en œuvre des mesures adaptées à un produit SaaS métier, notamment :

- Hachage des mots de passe côté serveur  
- OTP par e-mail pour inscription, connexion, acceptation d’invitation et réinitialisation  
- API limitées à l’organisation et permissions basées sur les rôles  
- Sessions cookies httpOnly optionnelles ou jetons bearer  
- Limitation de débit sur les points d’authentification (backend)  

Aucune méthode de transmission ou de stockage n’est parfaitement sûre. Vous devez protéger vos identifiants et l’accès à vos appareils.

---

## 10. Vos droits et choix

Selon \`[Governing Law / Jurisdiction]\`, vous pouvez disposer de droits d’accès, de rectification, de suppression, de limitation ou d’opposition à certains traitements, et de retrait du consentement lorsque le traitement repose sur le consentement.

- Mettre à jour le profil et les informations d’organisation dans l’app lorsque c’est autorisé.  
- Changer le mot de passe depuis Profil (ou via réinitialisation forcée / mot de passe oublié).  
- Contacter \`contact@acheteici.com\` pour les demandes liées à la confidentialité.  
- Les propriétaires/admins contrôlent l’accès des collègues, les invitations et de nombreux enregistrements dans le locataire.  

Nous répondrons conformément à la loi applicable : \`[Response Timeframe]\`.

---

## 11. Confidentialité des mineurs

Smarter Panel est un outil professionnel et n’est pas destiné aux enfants. Nous ne collectons pas sciemment d’informations personnelles auprès de mineurs de moins de \`[Minimum Age, e.g. 16 or 18]\`. Si vous pensez que cela s’est produit, contactez \`contact@acheteici.com\`.

---

## 12. Cookies et technologies similaires

- **Essentiels :** session/auth (jeton localStorage ou cookies httpOnly), préférence de thème, caches PWA, file hors ligne IndexedDB.  
- **Cookies marketing non essentiels :** non utilisés par le frontend actuel tel que livré.  

Vous pouvez effacer les données du site dans votre navigateur ; cela peut vous déconnecter et supprimer les files hors ligne non synchronisées.

---

## 13. Liens et sous-traitants tiers

Les redirections de paiement, fournisseurs d’e-mail et CDN de polices sont des tiers. Consultez leurs politiques. Prestataire de paiement principal pour les abonnements : **Tranzak**.

---

## 14. Modifications de la présente politique

Nous pouvons mettre à jour cette politique pour refléter des évolutions produit ou juridiques. La « Date d’entrée en vigueur » sera révisée. Les changements importants peuvent être communiqués par \`[Notification Method — e.g. email to owners, in-app notice]\`. L’usage continu après la date d’entrée en vigueur vaut prise de connaissance de la politique mise à jour, dans la mesure permise par la loi.

---

## 15. Contact

- **Demandes de confidentialité :** \`contact@acheteici.com\`
- **Général / support :** \`contact@acheteici.com\` ou le chat Support in-app
- **Courrier :** \`contact@acheteici.com\`

---

*Référence produit : Smarter Panel (déploiements ATI / smarterworkspace.cloud selon la configuration de l’opérateur).*
`
  }
};

export const formatCurrency = (
  amount: number,
  displayCode: string,
  fromCode?: string,
  rates?: Record<string, number> | null
) => {
  const currency = CURRENCIES[(displayCode as CurrencyCode)] || CURRENCIES.XAF;
  const from = fromCode || displayCode;
  const converted = convertAmount(amount, from, currency.code, rates);
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.code,
    maximumFractionDigits: currency.precision,
    minimumFractionDigits: currency.precision,
  }).format(converted);
};

export const getTranslated = (item: any, lang: string) => {
  if (!item) return '';
  return item[lang] || item['en'] || 'N/A';
};

/** Fraud prevention: records older than 24 hours cannot be edited or deleted (applies to income, expense, inventory registration delete/edit). */
export const isLockedAfter24Hours = (createdAt: string | Date | undefined): boolean => {
  if (!createdAt) return false;
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  return Date.now() - created.getTime() > 24 * 60 * 60 * 1000;
};

const LOSS_REASONS: InventoryEventReason[] = ['damaged', 'expired', 'stolen'];

export const isInventoryLossReason = (reason: InventoryEventReason) => LOSS_REASONS.includes(reason);

export const isExpiringSoon = (expiresOn: string | null | undefined, withinDays = 30): boolean => {
  if (!expiresOn) return false;
  const exp = new Date(expiresOn);
  if (Number.isNaN(exp.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + withinDays);
  return exp >= today && exp <= limit;
};

export const isPastExpiry = (expiresOn: string | null | undefined): boolean => {
  if (!expiresOn) return false;
  const exp = new Date(expiresOn);
  if (Number.isNaN(exp.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return exp < today;
};

/** Display status for an inventory line (on-hand + expiry + last stored status). */
export const deriveInventoryStatus = (item: Pick<InventoryItem, 'quantity' | 'status' | 'expiresOn'>): InventoryStatus => {
  if (isPastExpiry(item.expiresOn)) return 'expired';
  if ((item.quantity ?? 0) <= 0) {
    if (item.status === 'damaged' || item.status === 'expired' || item.status === 'missing') return item.status;
    return 'missing';
  }
  if (item.status === 'damaged') return 'damaged';
  return 'available';
};

/** Next status after applying an incident that changes on-hand quantity. */
export const statusAfterIncident = (
  reason: InventoryEventReason,
  nextQty: number,
  expiresOn?: string | null
): InventoryStatus => {
  if (isPastExpiry(expiresOn)) return 'expired';
  if (nextQty <= 0) {
    if (reason === 'stolen') return 'missing';
    if (reason === 'damaged') return 'damaged';
    if (reason === 'expired') return 'expired';
    return 'missing';
  }
  if (reason === 'damaged') return 'damaged';
  return 'available';
};

// Helper for 7-day rule
export const isDateWithinLimit = (dateString: string) => {
  const inputDate = new Date(dateString);
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Reset hours to compare dates only
  inputDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  return inputDate >= sevenDaysAgo && inputDate <= today;
};