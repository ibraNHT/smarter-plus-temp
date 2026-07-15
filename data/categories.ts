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
 *
 * Client-approved service list: General laborer, Transit & warehouse,
 * General Services, Equipment & Machinery.
 */
export const SERVICE_CATEGORIES = [
  'General Services',
  'General laborer',
  'Transit & warehouse',
  'Equipment & Machinery',
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
] as const;

/**
 * Legacy category labels that have been renamed/merged. Every path that READS a
 * stored category (producer productionTypes, offer.category, avatars) normalizes
 * through these aliases so existing data keeps resolving after a rename — no DB
 * migration required. Key = old stored string, value = current canonical string.
 */
export const LEGACY_CATEGORY_ALIASES: Readonly<Record<string, string>> = {
  // Equipment & Machinery (product) and its former "Rentals" service variant were
  // consolidated by the client into ONE service category, "Equipment & Machinery".
  'Equipment & Machinery Rentals': 'Equipment & Machinery',
};

/** Canonical form of a stored category string: trimmed + de-aliased. */
export const normalizeCategory = (
  category: string | null | undefined,
): string => {
  const raw = String(category ?? '').trim();
  return LEGACY_CATEGORY_ALIASES[raw] ?? raw;
};

const SERVICE_CATEGORY_SET = new Set<string>(SERVICE_CATEGORIES);
const MARKETPLACE_CATEGORY_SET = new Set<string>(MARKETPLACE_CATEGORIES);

/** True when a category must be sold/rendered as a service. */
export const isServiceCategory = (
  category: string | null | undefined,
): boolean => SERVICE_CATEGORY_SET.has(normalizeCategory(category));

/**
 * Clean a stored list of category strings for DISPLAY: de-alias legacy labels,
 * drop anything that is no longer a selectable marketplace category (stale/junk),
 * and de-duplicate while preserving order. Used so a producer's public profile
 * shows only their real, current categories instead of leftover/duplicate ones.
 */
export const canonicalizeCategoryList = (
  categories: readonly (string | null | undefined)[] | null | undefined,
): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of categories ?? []) {
    const norm = normalizeCategory(c);
    if (!norm || !MARKETPLACE_CATEGORY_SET.has(norm) || seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out;
};
