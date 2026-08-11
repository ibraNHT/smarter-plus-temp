
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { MarketType, UserRole } from '../../types';
import { ShoppingBasket, Search, Star, Heart, Layers, ArrowLeft } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { SEO_PAGE_META } from '../../services/seo/seoConfig';
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
} from '../../services/seo/schemaBuilders';
import { OfferRowSkeleton } from '../../components/skeletons/OfferCardSkeleton';
import { CategoryAvatarScroller } from '../../components/CategoryAvatarScroller';
import { OfferImage } from '../../components/OfferImage';
import { MARKETPLACE_CATEGORIES } from '../../data/categories';
import { offerImageInBox, resolveOfferImageSrc } from '../../utils/offerImageDisplay';
import { getApiBaseUrl } from '../../client-api/config';
import { isProducerDashboardUser } from '../../services/producerSession';
import { findProducerForUser } from '../../utils/producerAccountStatus';
import { getAverageRatingFromReviews, getReviewsForOffer } from '../../utils/offerReviews';
import { apiFetch } from '../../services/apiService';
import { API_ENDPOINTS } from '../../client-api/endpoints';
import { usePwaInstall } from '../../contexts/PwaInstallContext';
import { useCurrency } from '../../contexts/CurrencyContext';

export const AtiStore: React.FC = () => {
  const { offers, toggleFavorite, user, clients, producers, compareList, addToCompare, removeFromCompare, reviews, orders, refreshOffers, refreshProducers, refreshAllReviews } = useStore();
  const { formatXaf } = useCurrency();
  const { nudgeInstall } = usePwaInstall();

  // Star ratings for the grid come from the server in ONE call. Resolving them in
  // the browser needs the order behind each review, and local `orders` only ever
  // holds the viewer's own — so signed-out visitors saw no stars at all and signed-in
  // shoppers saw only their own review counted. The local join stays as a fallback
  // for a rating just left in this session, before the aggregate refetches.
  const [offerRatings, setOfferRatings] = useState<
    Record<string, { count: number; average: number }>
  >({});
  useEffect(() => {
    let alive = true;
    apiFetch<Array<{ offerId: string; count: number; average: number }>>(
      API_ENDPOINTS.reviews.offerRatings,
      { silent401: true } as any,
    )
      .then((rows) => {
        if (!alive || !Array.isArray(rows)) return;
        const byOffer: Record<string, { count: number; average: number }> = {};
        rows.forEach((r) => {
          byOffer[r.offerId] = { count: r.count, average: r.average };
        });
        setOfferRatings(byOffer);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [reviews.length]);

  const getOfferReviewStats = (offerId: string) => {
    const serverStats = offerRatings[offerId];
    if (serverStats) {
      return { reviewCount: serverStats.count, rating: serverStats.average };
    }
    const offerReviews = getReviewsForOffer(offerId, reviews, orders);
    return {
      reviewCount: offerReviews.length,
      rating: getAverageRatingFromReviews(offerReviews),
    };
  };
  const { t, language } = useTranslation();

  const hasCachedCatalog = offers.length > 0 && producers.length > 0;
  const [pageLoading, setPageLoading] = useState(!hasCachedCatalog);
  const [showFreshness, setShowFreshness] = useState(false);
  const [resultsKey, setResultsKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!hasCachedCatalog) setPageLoading(true);
    Promise.all([refreshOffers(), refreshProducers(), refreshAllReviews()]).finally(() => {
      if (!cancelled) {
        setPageLoading(false);
        setShowFreshness(true);
        window.setTimeout(() => setShowFreshness(false), 3200);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      const key = 'agm_market_visits';
      const n = Number(sessionStorage.getItem(key) || '0') + 1;
      sessionStorage.setItem(key, String(n));
      if (n >= 2) nudgeInstall('return');
    } catch { /* ignore */ }
  }, [nudgeInstall]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  // Retail/ATI store categories come from the backend (configured in AgriAdmin).
  // Each entry is { name, imageUrl } — backward-compatible with the old
  // name-only string[] shape.
  const [storeCategories, setStoreCategories] = useState<Array<{ name: string; nameFr?: string; imageUrl?: string }>>([]);
  const [storeCategoriesStatus, setStoreCategoriesStatus] = useState<'loading' | 'ready' | 'empty'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStoreCategoriesStatus('loading');
    // VITE_API_URL is never set by any deploy (Docker/CI only define
    // VITE_API_BASE_URL), so this fell back to a relative /api path. The SPA
    // host has no /api proxy — nginx answers it from the SPA fallback with
    // index.html at HTTP 200 — so r.json() threw, the catch marked categories
    // "empty", and the storefront silently fell back to the hardcoded
    // MARKETPLACE_CATEGORIES list. A category newly added in AgriAdmin is not in
    // that list and has no offers yet, so it never appeared.
    fetch(`${getApiBaseUrl()}/api/retail/categories`)
      .then((r) => {
        const isJson = r.headers.get('content-type')?.includes('application/json');
        return r.ok && isJson ? r.json() : { categories: [] };
      })
      .then((data) => {
        if (cancelled || !Array.isArray(data.categories)) {
          if (!cancelled) setStoreCategoriesStatus('empty');
          return;
        }
        const normalized = data.categories
          .map((c: any) =>
            typeof c === 'string'
              ? { name: c.trim() }
              : {
                  name: String(c?.name ?? '').trim(),
                  nameFr: c?.nameFr ? String(c.nameFr).trim() : undefined,
                  imageUrl: c?.imageUrl ?? c?.image ?? undefined,
                },
          )
          .filter((c: { name: string }) => c.name && c.name !== 'All');
        if (normalized.length) setStoreCategories(normalized);
        if (!cancelled) setStoreCategoriesStatus(normalized.length ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!cancelled) setStoreCategoriesStatus('empty');
      });
    return () => { cancelled = true; };
  }, []);

  // Base data
  const atiOffers = offers.filter(offer => offer.marketType === MarketType.ATI);

  // Get Favorites
  let favorites: string[] = [];
  if (user) {
    if (user.role === UserRole.CLIENT) {
      const c = clients.find(client => client.id === user.id);
      favorites = c?.favorites || [];
    } else if (isProducerDashboardUser(user)) {
      const p = findProducerForUser(producers, user);
      favorites = p?.favorites || [];
    }
  }

  const filteredOffers = atiOffers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) || offer.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || offer.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by Category
  const groupedOffers = filteredOffers.reduce((groups, offer) => {
    const category = offer.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(offer);
    return groups;
  }, {} as Record<string, typeof filteredOffers>);

  const sortedCategories = Object.keys(groupedOffers).sort();

  const offerCategoryNames = Array.from(new Set(atiOffers.map((o) => o.category))).filter(Boolean);
  const scrollerCategories: string[] =
    storeCategories.length > 0
      ? storeCategories.map((c) => c.name)
      : storeCategoriesStatus === 'loading'
        ? [] // Only "All" until retail categories arrive — no marketplace residue chips
        : (offerCategoryNames.length ? offerCategoryNames : [...MARKETPLACE_CATEGORIES]);

  // name → uploaded image URL, so the category scroller can render store art.
  const categoryImages = storeCategories.reduce<Record<string, string>>((acc, c) => {
    // Uploaded store-category images come from the same upload backend as offer
    // photos, so resolve them the same way (rewrites API-origin /uploads URLs to
    // same-origin to dodge Cross-Origin-Resource-Policy blocking; Cloudinary
    // https URLs pass through unchanged).
    if (c.imageUrl) acc[c.name] = resolveOfferImageSrc(c.imageUrl);
    return acc;
  }, {});

  // name → label for the current language. Retail categories are created by ATI
  // staff in AgriAdmin, so they have no static `category.*` translation key —
  // their French wording is stored per-category as `nameFr`. Built-in
  // marketplace categories keep using the static translations.
  const categoryLabels = storeCategories.reduce<Record<string, string>>((acc, c) => {
    if (language === 'fr' && c.nameFr) acc[c.name] = c.nameFr;
    return acc;
  }, {});

  /** Localized display label for a category name. */
  const categoryLabel = (name: string) => categoryLabels[name] ?? t(`category.${name}`);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setExpandedCategory(null);
    setResultsKey((k) => k + 1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setExpandedCategory(null);
    setResultsKey((k) => k + 1);
  };

  const offerCountLabel =
    filteredOffers.length === 1
      ? t('market.offerCountOne')
      : t('market.offerCount').replace('{count}', String(filteredOffers.length));

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={SEO_PAGE_META.atiStore.title}
        description={SEO_PAGE_META.atiStore.description}
        keywords={SEO_PAGE_META.atiStore.keywords}
        url="/market/ati"
        schema={[
          buildCollectionPageSchema({
            name: SEO_PAGE_META.atiStore.title,
            description: SEO_PAGE_META.atiStore.description,
            path: '/market/ati',
          }),
          buildBreadcrumbSchema([
            { name: t('nav.home'), path: '/' },
            { name: t('nav.atiStore'), path: '/market/ati' },
          ]),
        ]}
      />
      {/* Header */}
      <div className="bg-blue-800 text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-700 rounded-lg flex-shrink-0">
              <ShoppingBasket className="h-7 w-7 sm:h-8 sm:w-8 text-blue-200" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{t('landing.atiStore.title')}</h1>
              <p className="text-blue-100 text-xs sm:text-sm line-clamp-2">{t('landing.atiStore.desc')}</p>
            </div>
          </div>
          <div className="hidden md:block bg-blue-700 px-4 py-2 rounded-lg text-sm flex-shrink-0">
            {t('market.atiOfficial')}
          </div>
        </div>
      </div>

      {/* Store Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder={t('market.searchPlaceholder')}
            className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setResultsKey((k) => k + 1); }}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>

        <div className="mb-3 bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
          <CategoryAvatarScroller
            selected={selectedCategory}
            onSelect={handleSelectCategory}
            categories={scrollerCategories}
            categoryImages={categoryImages}
            categoryLabels={categoryLabels}
            sticky
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6 min-h-[1.75rem]">
          {!pageLoading && (
            <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1">
              {offerCountLabel}
            </span>
          )}
          {showFreshness && (
            <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 text-xs font-medium px-3 py-1 animate-fade-in">
              {t('market.updatedJustNow')}
            </span>
          )}
        </div>

        <div className="min-w-0">
            {pageLoading ? (
              <div className="space-y-10 w-full min-w-0">
                <div className="w-full min-w-0">
                  <div className="h-7 agm-shimmer rounded w-48 max-w-full mb-4" />
                  <OfferRowSkeleton count={4} variant="ati" />
                </div>
                <div className="w-full min-w-0">
                  <div className="h-7 agm-shimmer rounded w-40 max-w-full mb-4" />
                  <OfferRowSkeleton count={4} variant="ati" />
                </div>
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="text-center py-12 agm-empty-wash-ati rounded-xl border border-blue-100 px-4 shadow-sm">
                <ShoppingBasket className="mx-auto h-12 w-12 text-blue-300 mb-4" />
                <p className="text-gray-700 font-medium">{t('market.noResults')}</p>
                <p className="text-gray-500 text-sm mt-1 mb-5">{t('market.emptyHint')}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="agm-btn-primary inline-flex justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                  >
                    {t('market.browseAll')}
                  </button>
                  <Link
                    to="/market/producers"
                    className="inline-flex justify-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                  >
                    {t('market.tryProducers')}
                  </Link>
                </div>
              </div>
            ) : (
              <div key={resultsKey} className="space-y-10 agm-results-in">
                {(expandedCategory ? [expandedCategory].filter(c => groupedOffers[c]) : sortedCategories).map(category => {
                  const categoryOffers = groupedOffers[category];
                  const isExpanded = expandedCategory === category;

                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-4 px-1 border-b border-gray-100 pb-3">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center">
                          {isExpanded && (
                            <button
                              type="button"
                              onClick={() => setExpandedCategory(null)}
                              className="mr-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                              <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                          )}
                          {categoryLabel(category)}
                        </h2>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 uppercase tracking-wider">{categoryOffers.length} {t('market.items')}</span>
                          {!isExpanded && (
                            <button
                              type="button"
                              onClick={() => { setExpandedCategory(category); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
                            >
                              {t('market.seeAll')} &rarr;
                            </button>
                          )}
                          {isExpanded && (
                            <button
                              type="button"
                              onClick={() => setExpandedCategory(null)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
                            >
                              &larr; {t('market.allCategoriesBack')}
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 pt-2">
                          {categoryOffers.map((offer) => {
                            const isFav = favorites.includes(offer.id);
                            const isComparing = compareList.includes(offer.id);
                            const { reviewCount, rating } = getOfferReviewStats(offer.id);
                            const filledStars = reviewCount > 0 ? Math.round(rating) : 0;
                            return (
                              <div key={offer.id} className="relative">
                                <div className="absolute top-2 right-2 z-10 flex gap-1">
                                  {(user?.role === UserRole.CLIENT || isProducerDashboardUser(user)) && (
                                    <button
                                      onClick={(e) => { e.preventDefault(); toggleFavorite(offer.id); }}
                                      className="p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
                                    >
                                      <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.preventDefault(); if (isComparing) removeFromCompare(offer.id); else addToCompare(offer.id); }}
                                    className={`p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors ${isComparing ? 'text-blue-600' : 'text-gray-400'}`}
                                  >
                                    <Layers className="h-4 w-4" />
                                  </button>
                                </div>
                                <Link to={`/offer/${offer.id}`} className="group relative bg-white border border-gray-100 rounded-xl shadow-md flex flex-col overflow-hidden hover:shadow-xl transition-all h-full agm-card-lift">
                                  <div className="bg-gray-100 h-40 relative">
                                    <OfferImage
                                      src={offer.imageUrl}
                                      alt={offer.title}
                                      size="card"
                                      className={`${offerImageInBox} group-hover:opacity-90 transition-opacity`}
                                    />
                                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">{t('market.atiChoice')}</div>
                                  </div>
                                  <div className="flex-1 p-3 space-y-2 flex flex-col">
                                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 h-10">{offer.title}</h3>
                                    <div className="flex items-center mb-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3 h-3 ${i < filledStars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                        />
                                      ))}
                                      <span className="text-xs text-gray-400 ml-1">
                                        {reviewCount > 0 ? `(${rating.toFixed(1)})` : t('product.noReviewsShort')}
                                      </span>
                                    </div>
                                    <div className="flex flex-col pt-2 border-t border-gray-100 mt-auto min-w-0">
                                      {/* text-base on phones: two cards per row leaves too
                                          little width for text-lg to hold the amount on one line. */}
                                      <span className="text-base sm:text-lg font-bold text-blue-700 leading-tight">{formatXaf(offer.price)}</span>
                                      <span className="text-xs text-gray-500 truncate">{t('market.per')} {offer.unit}</span>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="w-full min-w-0 overflow-hidden">
                        {/* Two cards per row on phones, horizontal swipe row from sm up.
                            Horizontal swipe row on ALL breakpoints, matching ProducerMarket — client
                            requested 2026-08-10, superseding the earlier two-per-row phone rule.
                            See docs/UI-LAYOUT-RULES.md before changing these classes. */}
                        <div className="flex gap-3 px-1 pb-8 pt-2 overflow-x-auto -mx-1 snap-x snap-mandatory md:gap-6 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-gray-50">
                          {categoryOffers.map((offer) => {
                            const isFav = favorites.includes(offer.id);
                            const isComparing = compareList.includes(offer.id);
                            const { reviewCount, rating } = getOfferReviewStats(offer.id);
                            const filledStars = reviewCount > 0 ? Math.round(rating) : 0;

                            return (
                              <div key={offer.id} className="relative min-w-[250px] w-40 flex-shrink-0 snap-start sm:min-w-[240px] sm:w-[260px] md:min-w-[280px] md:w-[300px]">
                                <div className="absolute top-2 right-2 z-10 flex gap-1">
                                  {(user?.role === UserRole.CLIENT || isProducerDashboardUser(user)) && (
                                    <button
                                      onClick={(e) => { e.preventDefault(); toggleFavorite(offer.id); }}
                                      className="p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
                                    >
                                      <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (isComparing) removeFromCompare(offer.id);
                                      else addToCompare(offer.id);
                                    }}
                                    className={`p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors ${isComparing ? 'text-blue-600' : 'text-gray-400'}`}
                                  >
                                    <Layers className="h-4 w-4" />
                                  </button>
                                </div>

                                <Link to={`/offer/${offer.id}`} className="group relative bg-white border border-gray-100 rounded-xl shadow-md flex flex-col overflow-hidden hover:shadow-xl transition-all h-full agm-card-lift">
                                  <div className="aspect-w-1 aspect-h-1 bg-gray-100 h-36 relative">
                                    <OfferImage
                                      src={offer.imageUrl}
                                      alt={offer.title}
                                      size="card"
                                      className={`${offerImageInBox} group-hover:opacity-90 transition-opacity`}
                                    />
                                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded z-[3]">{t('market.atiChoice')}</div>
                                  </div>
                                  <div className="flex-1 p-3 space-y-2 flex flex-col">
                                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 h-10">
                                      {offer.title}
                                    </h3>
                                    <div className="flex items-center mb-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3 h-3 ${i < filledStars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                        />
                                      ))}
                                      <span className="text-xs text-gray-400 ml-1">
                                        {reviewCount > 0 ? `(${rating.toFixed(1)})` : t('product.noReviewsShort')}
                                      </span>
                                    </div>
                                    <div className="flex flex-col pt-2 border-t border-gray-100 mt-auto min-w-0">
                                      {/* text-base on phones: two cards per row leaves too
                                          little width for text-lg to hold the amount on one line. */}
                                      <span className="text-base sm:text-lg font-bold text-blue-700 leading-tight">{formatXaf(offer.price)}</span>
                                      <span className="text-xs text-gray-500 truncate">{t('market.per')} {offer.unit}</span>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
