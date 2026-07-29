import { MARKETPLACE_CATEGORIES } from './categories';

/** Local avatar paths for marketplace category filter chips. */
export const CATEGORY_AVATAR_ALL = '/categories/all.webp';

const CATEGORY_AVATAR_BY_NAME: Record<string, string> = {
  Agriculture: '/categories/agriculture.webp',
  'Fish Farming': '/categories/fish-farming.webp',
  'Livestock Farming': '/categories/livestock-farming.webp',
  Fertilizer: '/categories/fertilizer.webp',
  'Process Goods': '/categories/process-goods.webp',
  'Equipment & Machinery': '/categories/equipment-machinery.webp',
  'General Services': '/categories/general-services.webp',
  'Plants Protection Products': '/categories/plants-protection.webp',
  Seeds: '/categories/seeds.webp',
  Nurseries: '/categories/nurseries.webp',
  'Animal Feeds': '/categories/animal-feeds.webp',
  'General laborer': '/categories/general-laborer.webp',
  'Transit & warehouse': '/categories/transit-warehouse.webp',
  'Equipment & Machinery Rentals': '/categories/equipment-rentals.webp',
};

/**
 * Resolve the avatar image URL for a real category name.
 *
 * `overrideUrl` — an image supplied by the backend (e.g. a retail/ATI category
 * configured in AgriAdmin). When present it wins, so newly-added store
 * categories show their uploaded image; otherwise we fall back to the bundled
 * marketplace art.
 *
 * Do not use this for `All` — that chip is a filter, not a product category, and
 * is rendered as an icon (see CategoryAvatarScroller), never a product photo.
 */
export const getCategoryAvatar = (
  category: string,
  overrideUrl?: string | null,
): string => {
  if (overrideUrl && overrideUrl.trim()) return overrideUrl.trim();
  if (category === 'All') return CATEGORY_AVATAR_ALL; // unused by scroller; kept for callers
  return CATEGORY_AVATAR_BY_NAME[category] ?? CATEGORY_AVATAR_ALL;
};

/** Canonical strip order: All, then every marketplace category. */
export const CATEGORY_SCROLLER_ITEMS: readonly string[] = [
  'All',
  ...MARKETPLACE_CATEGORIES,
];
