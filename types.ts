
export interface User {
  id: string;
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  locationId: string;
  /** When set, user can access multiple locations. Backend may use this instead of or in addition to locationId. */
  locationIds?: string[];
  profilePicUrl?: string;
  phone?: string | null;
  address?: string | null;
  jobTitle?: string | null;
  profileCompletedAt?: string | null;
  passwordNeedsReset: boolean;
  /** If false, user is deactivated and cannot log in. Omit or true = active. */
  active?: boolean;
  // tempPassword returned on creation when backend generates one
  tempPassword?: string;
  organizationId?: string;
  isOwner?: boolean;
  organization?: OrganizationSummary | null;
  subscription?: SubscriptionSummary | null;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  legalName?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  taxId?: string | null;
  industry?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  profileCompletedAt?: string | null;
}

export interface SubscriptionSummary {
  planId: string;
  status: string;
  maxUsers: number;
  maxLocations: number;
  currentPeriodEnd?: string;
  planName?: string;
  billingPeriod?: string;
  inRenewalWindow?: boolean;
  canCheckoutAnytime?: boolean;
  usage?: { users: number; locations: number };
}

export interface OrgCouponSummary {
  code: string;
  type: 'percent' | 'fixed' | 'trial' | string;
  summary: string;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface Role {
  id: string;
  name: string;
  /** Logical role key within an organization (e.g. super_admin). */
  key?: string;
  // backend may return permissions as a JSON string or an array
  permissions: string[] | string;
}

/** Normalize permissions to string[] (API may return string or string[]). */
export function normalizePermissions(permissions: string[] | string | undefined): string[] {
  if (!permissions) return [];
  if (Array.isArray(permissions)) return permissions;
  try {
    const parsed = JSON.parse(permissions);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Role with permissions always as string[] for use in app. */
export interface RoleNormalized extends Omit<Role, 'permissions'> {
  permissions: string[];
}

export interface Location {
  id: string;
  en: string;
  fr: string;
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  locationId: string;
  userId: string;
  // Income specific
  source?: string;
  // Expense specific
  description?: string;
  categoryId?: string;
  categoryName?: string;
  locationName?: string;
}

/** Condition of remaining on-hand stock (or reason stock hit zero). */
export type InventoryStatus = 'available' | 'damaged' | 'expired' | 'missing';

/** Incident / adjustment that changes on-hand quantity. */
export type InventoryEventReason = 'damaged' | 'expired' | 'stolen' | 'restored' | 'adjustment';

export interface InventoryItem {
  id: string;
  name: string;
  typeId: string;
  /** Current on-hand quantity (usable stock for value KPIs). */
  quantity: number;
  /** Unit value. */
  value: number;
  locationId: string;
  date?: string;
  typeName?: string;
  totalValue?: number;
  locationName?: string;
  status?: InventoryStatus;
  /** ISO date (yyyy-MM-dd) for perishable / agribusiness expiry. */
  expiresOn?: string | null;
  notes?: string;
  /** Absolute or relative URL of the item photo. */
  imageUrl?: string | null;
  /** Physical place within the business site (shelf, bin, zone, etc.). */
  storagePlace?: string | null;
  createdAt?: string;
  /** ISO timestamp; set by API whenever the item is created or updated. */
  updatedAt?: string;
  userId?: string;
}

export interface InventoryEvent {
  id: string;
  inventoryId: string;
  locationId: string;
  reason: InventoryEventReason;
  /** Units lost (damaged/expired/stolen) or gained (restored/adjustment). */
  quantity: number;
  note?: string;
  userId: string;
  createdAt: string;
  /** Optional denormalized fields from API */
  inventoryName?: string;
  unitValue?: number;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  dob?: string;
  gender?: string;
  address?: string;
  phone?: string;
  email: string;
  positionId: string;
  hireDate: string;
  status: 'active' | 'inactive';
  locationIds: string[]; // Changed from single locationId
  // Optional relation shape returned by the API when including locations
  locations?: { locationId: string; location?: Location }[];
  // Link to an associated User account when created/linked
  userId?: string;
  documents?: StaffDocument[];
  positionName?: string;
  locationName?: string;
}

export interface StaffDocument {
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
  path?: string;
}

export interface Category {
  id: string;
  en: string;
  fr: string;
}

export type InventoryType = Category;
export type Position = Category;
export type IncomeSource = Category;
export type ExpenseDescriptionLabel = Category;
export type StoragePlaceLabel = Category;
export interface PositionReq {
  id: string;
  positionId: string;
  en: string;
  fr: string;
}

export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'archived';
export type EstimateLayout = 'classic' | 'modern' | 'compact';
export type EstimateIndustry = 'pharmacy' | 'construction' | 'mechanics' | 'agriculture' | 'general';

export interface EstimateLineItem {
  id?: string;
  estimateId?: string;
  sortOrder: number;
  description: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  lineTotal: number;
}

export interface EstimateTemplate {
  id: string;
  name: string;
  industry: EstimateIndustry | string;
  isSystem: boolean;
  locationId?: string | null;
  userId?: string | null;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string | null;
  headerHtml?: string | null;
  footerNote?: string | null;
  defaultLineItems: EstimateLineItem[] | string;
  layout: EstimateLayout | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Estimate {
  id: string;
  number: string;
  title: string;
  status: EstimateStatus | string;
  locationId: string;
  userId: string;
  templateId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  businessName: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  accentColor: string;
  layout: EstimateLayout | string;
  issueDate: string;
  validUntil?: string | null;
  notes?: string | null;
  terms?: string | null;
  currency: string;
  subtotal: number;
  taxRate?: number | null;
  taxAmount: number;
  total: number;
  lineItems?: EstimateLineItem[];
  createdAt?: string;
  updatedAt?: string;
}

// Permissions List
export const PERMISSIONS = [
  'perm_viewDashboard',
  'perm_viewIncome', 'perm_addIncome', 'perm_deleteIncome',
  'perm_viewExpenses', 'perm_addExpenses', 'perm_deleteExpenses', 'perm_manageCategories',
  'perm_viewInventory', 'perm_addInventory', 'perm_updateInventory', 'perm_deleteInventory', 'perm_manageTypes',
  'perm_viewHR', 'perm_addHR', 'perm_updateHR', 'perm_deleteHR', 'perm_manageHRUploads', 'perm_managePositions', 'perm_manageDocs',
  'perm_viewReports', 'perm_viewAdmin', 'perm_allLocations',
  'perm_viewEstimates', 'perm_addEstimates', 'perm_updateEstimates', 'perm_deleteEstimates', 'perm_manageEstimateTemplates',
  'perm_viewAuditLogs',
  'perm_viewNotifications',
  // Admin sub-permissions (require perm_viewAdmin to see Admin; these control which tabs/settings are visible)
  'perm_manageAdminUsers',   // User Management tab
  'perm_manageAdminRoles',   // Role Management tab
  'perm_manageAdminConfig',  // Config tab (locations, categories, types, positions)
  'manage_users',
  'perm_resetUserPassword',
  'perm_deactivateUser',
  'perm_removeUser',
] as const;
