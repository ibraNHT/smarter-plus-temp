/**
 * Canonical marketplace category list — the single source of truth for Connect.
 *
 * Every category picker (offer creation, producer onboarding, producer/client
 * profile production types, marketplace filters) must derive its options from
 * here so the vocabulary stays consistent everywhere, not just on-boarding.
 *
 * Keep the labels in sync with the `category.*` translation keys in
 * `services/i18nContext.tsx`.
 */

/**
 * Categories that are sold as SERVICES (rendered with the service form:
 * hourly/day/job units + service duration) rather than the product form.
 */
export const SERVICE_CATEGORIES = [
  'General Services',
  'General laborer',
  'Transit & warehouse',
  'Equipment & Machinery Rentals',
] as const;

/**
 * Full category list in the client-approved display order. Includes both
 * product and service categories; use `isServiceCategory` to tell them apart.
 */
export const MARKETPLACE_CATEGORIES = [
  'Agriculture',
  'Fish Farming',
  'Livestock Farming',
  'Fertilizer',
  'Process Goods',
  'Equipment & Machinery',
  'General Services',
  'Plants Protection Products',
  'Seeds',
  'Nurseries',
  'Animal Feeds',
  'General laborer',
  'Transit & warehouse',
  'Equipment & Machinery Rentals',
] as const;

const SERVICE_CATEGORY_SET = new Set<string>(SERVICE_CATEGORIES);

/** True when a category must be sold/rendered as a service. */
export const isServiceCategory = (
  category: string | null | undefined,
): boolean => SERVICE_CATEGORY_SET.has(String(category ?? '').trim());
