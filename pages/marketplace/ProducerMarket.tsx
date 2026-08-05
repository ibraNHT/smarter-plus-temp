import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../../services/storeContext";
import { useTranslation } from "../../services/i18nContext";
import { MarketType, UserRole } from "../../types";
import {
  Tractor,
  Search,
  MapPin,
  ArrowLeft,
  MessageCircle,
  Truck,
  Heart,
  Star,
  Layers,
  Share2,
} from "lucide-react";
import { SEO } from "../../components/SEO";
import { SEO_PAGE_META } from "../../services/seo/seoConfig";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
} from "../../services/seo/schemaBuilders";
import { OfferRowSkeleton } from "../../components/skeletons/OfferCardSkeleton";
import { CategoryAvatarScroller } from "../../components/CategoryAvatarScroller";
import { ClampText } from "../../components/ClampText";
import {
  offerImageInBox,
  onOfferImageError,
} from "../../utils/offerImageDisplay";
import {
  displayNameTruncateClass,
  resolveProducerDisplayName,
} from "../../utils/displayName";
import { isProducerDashboardUser } from "../../services/producerSession";
import { findProducerForUser } from "../../utils/producerAccountStatus";
import { usePwaInstall } from "../../contexts/PwaInstallContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { showAppToast } from "../../services/appToast";
import {
  buildOfferShareText,
  buildOfferShareUrl,
} from "../../utils/offerShare";

export const ProducerMarket: React.FC = () => {
  const {
    offers,
    producers,
    user,
    clients,
    trackUserSearch,
    toggleFavorite,
    getRecommendedOffers,
    getAverageRating,
    reviews,
    compareList,
    addToCompare,
    removeFromCompare,
    refreshOffers,
    refreshProducers,
    refreshAllReviews,
  } = useStore();
  const { t } = useTranslation();
  const { formatXaf } = useCurrency();
  const navigate = useNavigate();
  const { nudgeInstall } = usePwaInstall();

  // Show cached catalog instantly on return visits; React Query dedupes refetches
  // within staleTime so repeat navigation does not hit the network or flash skeletons.
  const hasCachedCatalog =
    offers.some((o) => o.marketType === MarketType.PRODUCER) &&
    producers.length > 0;
  const [pageLoading, setPageLoading] = useState(!hasCachedCatalog);
  const [showFreshness, setShowFreshness] = useState(false);
  const [resultsKey, setResultsKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (!hasCachedCatalog) setPageLoading(true);
    Promise.all([
      refreshOffers(),
      refreshProducers(),
      refreshAllReviews(),
    ]).finally(() => {
      if (!cancelled) {
        setPageLoading(false);
        setShowFreshness(true);
        window.setTimeout(() => setShowFreshness(false), 3200);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const key = "agm_market_visits";
      const n = Number(sessionStorage.getItem(key) || "0") + 1;
      sessionStorage.setItem(key, String(n));
      if (n >= 2) nudgeInstall("return");
    } catch {
      /* ignore */
    }
  }, [nudgeInstall]);

  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [locationQuery, setLocationQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setExpandedCategory(null);
    setResultsKey((k) => k + 1);
  };

  // Autocomplete State
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationWrapperRef = useRef<HTMLDivElement>(null);
  const searchableLocations = useMemo(() => {
    const values = new Set<string>();
    for (const producer of producers) {
      for (const loc of producer.locations || []) {
        const cityRegion = [loc.city, loc.region]
          .filter(Boolean)
          .join(", ")
          .trim();
        if (cityRegion) values.add(cityRegion);
        if (loc.address?.trim()) values.add(loc.address.trim());
      }
    }
    return Array.from(values);
  }, [producers]);

  // Get Current User Region and Favorites
  let clientRegion = "";
  let favorites: string[] = [];

  if (user) {
    if (user.role === UserRole.CLIENT) {
      const c = clients.find(
        (client) =>
          (user.clientId && client.id === user.clientId) ||
          (client as { userId?: string }).userId === user.id,
      );
      if (c) {
        clientRegion = c.locations.length > 0 ? c.locations[0].region : "";
        favorites = c.favorites || [];
      }
    } else if (isProducerDashboardUser(user)) {
      const p = findProducerForUser(producers, user);
      if (p) {
        clientRegion = p.locations.length > 0 ? p.locations[0].region : "";
        favorites = p.favorites || [];
      }
    }
  }

  // Base data
  const producerOffers = offers.filter(
    (offer) => offer.marketType === MarketType.PRODUCER,
  );
  const recommendedOffers = getRecommendedOffers().filter(
    (o) => o.marketType === MarketType.PRODUCER,
  );

  const getProducer = (id: string) => {
    return producers.find((p) => p.id === id);
  };

  const getProducerName = (producer: ReturnType<typeof getProducer>) => {
    if (!producer) return "Unknown Producer";
    return resolveProducerDisplayName(producer);
  };

  // Handle Search Input (Track on debounce or submit - simplified to effect here)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length > 2) {
        trackUserSearch(searchQuery);
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle Location Input Change
  const handleLocationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationQuery(val);

    if (val.length > 0) {
      const filtered = searchableLocations
        .filter(
          (loc) =>
            loc.toLowerCase().startsWith(val.toLowerCase()) ||
            loc.toLowerCase().includes(val.toLowerCase()),
        )
        .slice(0, 5); // Limit to 5 suggestions
      setLocationSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectLocation = (loc: string) => {
    setLocationQuery(loc);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        locationWrapperRef.current &&
        !locationWrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter Logic
  const filteredOffers = producerOffers.filter((offer) => {
    const producer = getProducer(offer.producerId);
    const producerName = getProducerName(producer);

    // Search Text (Title, Description, OR Producer Name)
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch =
      offer.title.toLowerCase().includes(lowerQuery) ||
      offer.description.toLowerCase().includes(lowerQuery) ||
      producerName.toLowerCase().includes(lowerQuery);

    // Category
    const matchesCategory =
      selectedCategory === "All" || offer.category === selectedCategory;

    // Location (Producer Addresses or Specific Offer Location)
    let matchesLocation = false;
    if (locationQuery === "") {
      matchesLocation = true;
    } else {
      const q = locationQuery.toLowerCase();
      // Check offer specific location
      if (
        offer.offerLocation &&
        offer.offerLocation.toLowerCase().includes(q)
      ) {
        matchesLocation = true;
      } else if (producer) {
        // Check ALL producer locations
        matchesLocation = producer.locations.some(
          (loc) =>
            loc.address.toLowerCase().includes(q) ||
            loc.city.toLowerCase().includes(q) ||
            loc.region.toLowerCase().includes(q) ||
            `${loc.city}, ${loc.region}`.toLowerCase().includes(q),
        );
      }
    }

    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Group by Category AND Sort within groups by Region Priority
  const groupedOffers = filteredOffers.reduce(
    (groups, offer) => {
      const category = offer.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(offer);
      return groups;
    },
    {} as Record<string, typeof filteredOffers>,
  );

  // Sort Categories by Number of Results (Descending), then Alphabetically
  const sortedCategories = Object.keys(groupedOffers).sort((a, b) => {
    const countA = groupedOffers[a].length;
    const countB = groupedOffers[b].length;
    if (countA !== countB) return countB - countA; // More results first
    return a.localeCompare(b);
  });

  // Helper to sort offers within a category: Same Region First
  const sortOffersByRegion = (offersToSort: typeof filteredOffers) => {
    if (!clientRegion) return offersToSort;

    return offersToSort.sort((a, b) => {
      const prodA = getProducer(a.producerId);
      const prodB = getProducer(b.producerId);

      // Check if ANY of producer's locations match client region
      const regionAMatch = prodA?.locations.some(
        (l) => l.region === clientRegion,
      );
      const regionBMatch = prodB?.locations.some(
        (l) => l.region === clientRegion,
      );

      // A matches client region, B does not -> A comes first (-1)
      if (regionAMatch && !regionBMatch) return -1;
      // B matches client region, A does not -> B comes first (1)
      if (regionBMatch && !regionAMatch) return 1;
      // Otherwise maintain order
      return 0;
    });
  };

  // Get all unique categories from the ENTIRE dataset for the filter dropdown
  const renderOfferCard = (offer: any, inCarousel = false) => {
    const producer = getProducer(offer.producerId);
    const isLocal =
      clientRegion &&
      producer?.locations.some((l) => l.region === clientRegion);
    const isFav = favorites.includes(offer.id);
    const rating = getAverageRating(offer.producerId);
    const producerUserId = producer?.userId;
    const reviewCount = reviews.filter(
      (r) =>
        r.targetId === offer.producerId ||
        (producerUserId && r.targetId === producerUserId),
    ).length;

    const isComparing = compareList.includes(offer.id);

    const handleCompareToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      if (isComparing) {
        removeFromCompare(offer.id);
        showAppToast(t("product.removedCompare"), "INFO");
      } else {
        addToCompare(offer.id);
        showAppToast(t("product.addedCompare"), "SUCCESS");
      }
    };

    return (
      <div
        key={offer.id}
        className={`group relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border agm-card-lift ${isLocal ? "border-green-300 ring-2 ring-green-50" : "border-gray-100"} h-full flex flex-col ${inCarousel ? "min-w-[250px] w-40 flex-shrink-0 snap-start sm:min-w-[240px] sm:w-[260px] md:min-w-[280px] md:w-[300px]" : "w-full min-w-0"}`}
      >
        {/* Action Buttons Overlay */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
          {/* Favorite Button (Visible for Client AND Producer) */}
          {(user?.role === UserRole.CLIENT ||
            isProducerDashboardUser(user)) && (
            <button
              onClick={(e) => {
                e.preventDefault();
                const willAdd = !favorites.includes(offer.id);
                toggleFavorite(offer.id);
                showAppToast(
                  willAdd
                    ? t("product.addedFavorite")
                    : t("product.removedFavorite"),
                  willAdd ? "SUCCESS" : "INFO",
                );
                if (willAdd) nudgeInstall("favorite");
              }}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
              title={t("market.saveForLater")}
            >
              <Heart
                className={`h-5 w-5 ${isFav ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"}`}
              />
            </button>
          )}

          {/* Compare Button */}
          <button
            onClick={handleCompareToggle}
            className={`p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors ${isComparing ? "text-blue-600" : "text-gray-400"}`}
            title={t("compare.select")}
          >
            <Layers className="h-5 w-5" />
          </button>

          {/* Share Button — share the offer (native share sheet / copy link) */}
          <button
            onClick={async (e) => {
              e.preventDefault();
              const url = buildOfferShareUrl(offer.id);
              const text = buildOfferShareText({
                title: offer.title,
                price: offer.price,
                location: offer.offerLocation,
                rating: rating > 0 ? rating : null,
                producerName: producer ? getProducerName(producer) : null,
              });
              const data = { title: offer.title, text, url };
              try {
                if (typeof navigator !== "undefined" && navigator.share)
                  await navigator.share(data);
                else if (
                  typeof navigator !== "undefined" &&
                  navigator.clipboard
                )
                  await navigator.clipboard.writeText(`${text}\n${url}`);
              } catch {
                /* share sheet dismissed / clipboard blocked — no action needed */
              }
            }}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors text-gray-400 hover:text-primary-600"
            title={t("product.share")}
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        <Link
          to={`/offer/${offer.id}`}
          className="flex h-full flex-col min-h-0"
        >
          <div className="relative bg-gray-100 h-40 sm:h-44 md:h-44">
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className={offerImageInBox}
              onError={onOfferImageError}
            />

            {/* Single image accent: Nearby > Service */}
            {isLocal ? (
              <div className="absolute top-2 left-2 z-[3] bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide shadow-sm flex items-center">
                <MapPin className="h-3 w-3 mr-1" /> {t("market.nearby")}
              </div>
            ) : offer.type === "SERVICE" ? (
              <span className="absolute top-2 left-2 z-[3] bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide shadow-sm">
                {t("market.service")}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col flex-1 min-h-0 p-3 md:p-4">
            <div className="mb-1.5 md:mb-2 shrink-0">
              <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 md:mb-1 flex items-center justify-between gap-1 min-w-0">
                <span
                  className={`${displayNameTruncateClass} flex-1`}
                  title={producer ? getProducerName(producer) : ""}
                >
                  {producer
                    ? getProducerName(producer)
                    : t("market.unknownProducer")}
                </span>
                {rating > 0 && (
                  <span className="flex items-center text-yellow-600 font-bold text-xs shrink-0">
                    <Star className="w-3 h-3 fill-current mr-0.5" /> {rating}{" "}
                    <span className="text-gray-400 font-normal ml-1">
                      ({reviewCount})
                    </span>
                  </span>
                )}
              </p>
              <ClampText
                as="h3"
                text={offer.title}
                lines={2}
                className="text-sm md:text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors leading-5 min-h-[2.5rem]"
              />
            </div>

            <div className="min-h-[1.25rem] mb-2 md:mb-3 hidden sm:block shrink-0">
              <ClampText
                text={offer.description}
                lines={1}
                className="text-gray-600 text-xs md:text-sm leading-5"
              />
            </div>

            {/* Meta row: delivery + negotiable */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-3 shrink-0">
              {offer.isDeliveryAvailable ? (
                <span className="inline-flex items-center text-green-600 font-medium">
                  <Truck className="h-3 w-3 mr-1 shrink-0" />{" "}
                  {t("market.delivery")}
                </span>
              ) : (
                <span className="inline-flex items-center text-gray-400 font-medium">
                  <MapPin className="h-3 w-3 mr-1 shrink-0" />{" "}
                  {t("market.pickup")}
                </span>
              )}
              {offer.isNegotiable && (
                <span className="inline-flex items-center text-blue-600 font-medium">
                  <MessageCircle className="h-3 w-3 mr-1 shrink-0" />{" "}
                  {t("market.negotiable")}
                </span>
              )}
            </div>

            {/* Two cards per row leaves ~150px of card width on a phone, which is
                not enough for price and stock side by side: the stock column would
                not shrink, so the amount wrapped onto three lines and ran into it.
                Stack them below sm, side by side from sm up. */}
            <div className="mt-auto flex flex-col gap-1 pt-2 md:pt-3 border-t border-gray-100 shrink-0 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-gray-400 truncate">
                  {t("market.per")} {t(`unit.${offer.unit}`)}
                </p>
                <p className="text-sm md:text-lg font-bold text-primary-700 leading-tight">
                  {formatXaf(offer.price)}
                </p>
              </div>
              <div className="flex min-w-0 items-baseline justify-between gap-1 sm:block sm:shrink-0 sm:text-right">
                <p className="text-[10px] md:text-xs text-gray-400 shrink-0">
                  {t("market.available")}
                </p>
                <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                  {offer.quantity} {t(`unit.${offer.unit}`)}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={SEO_PAGE_META.producerMarket.title}
        description={SEO_PAGE_META.producerMarket.description}
        keywords={SEO_PAGE_META.producerMarket.keywords}
        url="/market/producers"
        schema={[
          buildCollectionPageSchema({
            name: SEO_PAGE_META.producerMarket.title,
            description: SEO_PAGE_META.producerMarket.description,
            path: "/market/producers",
          }),
          buildBreadcrumbSchema([
            { name: t("nav.home"), path: "/" },
            { name: t("nav.producerMarket"), path: "/market/producers" },
          ]),
        ]}
      />
      {/* Header */}
      <div className="bg-primary-900 text-white pt-6 sm:pt-8 pb-12 sm:pb-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => {
              if (window.history.length > 2) navigate(-1);
              else navigate("/producer/dashboard");
            }}
            className="inline-flex items-center text-primary-200 hover:text-white transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-5 w-5 mr-1" /> {t("profile.tabs.back")}
          </button>

          <div className="mt-4 sm:mt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-700 rounded-lg flex-shrink-0">
                <Tractor className="h-6 w-6 sm:h-8 sm:w-8 text-green-200" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t("landing.producerMarket.title")}
              </h1>
            </div>
            <p className="text-primary-100 text-sm sm:text-lg max-w-2xl sm:ml-14">
              {t("landing.producerMarket.desc")}
            </p>
            {clientRegion && (
              <div className="mt-3 sm:mt-4 sm:ml-14 inline-flex items-center px-3 py-1 rounded-full bg-green-800 border border-green-600 text-xs sm:text-sm text-green-100">
                <MapPin className="h-4 w-4 mr-1" /> {t("market.prioritizing")}{" "}
                <strong className="ml-1">{clientRegion}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col md:flex-row gap-4 items-center border border-gray-100 relative z-20">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={t("market.searchProducers")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative w-full md:w-64" ref={locationWrapperRef}>
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t("market.locationPlaceholder")}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
              value={locationQuery}
              onChange={handleLocationInput}
              onFocus={() => locationQuery && setShowSuggestions(true)}
            />
            {/* Autocomplete Dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                {locationSuggestions.map((loc, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                    onClick={() => selectLocation(loc)}
                  >
                    {loc}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow-lg p-3 sm:p-4 border border-primary-50 relative z-10">
          <CategoryAvatarScroller
            selected={selectedCategory}
            onSelect={handleSelectCategory}
            sticky
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!pageLoading && (
          <div className="flex flex-wrap items-center gap-2 mb-6 min-h-[1.75rem]">
            <span className="inline-flex items-center rounded-full bg-primary-50 text-primary-800 text-xs font-semibold px-3 py-1">
              {filteredOffers.length === 1
                ? t("market.offerCountOne")
                : t("market.offerCount").replace(
                    "{count}",
                    String(filteredOffers.length),
                  )}
            </span>
            {showFreshness && (
              <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 text-xs font-medium px-3 py-1 animate-fade-in">
                {t("market.updatedJustNow")}
              </span>
            )}
          </div>
        )}

        {pageLoading ? (
          <div className="space-y-12">
            <div>
              <div className="h-8 agm-shimmer rounded w-64 mb-4" />
              <OfferRowSkeleton count={6} variant="producer" />
            </div>
            <div>
              <div className="h-8 agm-shimmer rounded w-48 mb-4" />
              <OfferRowSkeleton count={6} variant="producer" />
            </div>
          </div>
        ) : (
          <div key={resultsKey} className="agm-results-in">
            {/* Recommended Section */}
            {recommendedOffers.length > 0 &&
              searchQuery === "" &&
              selectedCategory === "All" && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <Star className="h-6 w-6 text-yellow-500 mr-2 fill-current" />
                    {t("market.recommended")}
                  </h2>
                  <div className="flex gap-3 px-1 pb-8 pt-2 overflow-x-auto -mx-1 snap-x snap-mandatory md:gap-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {recommendedOffers.map((offer) =>
                      renderOfferCard(offer, true),
                    )}
                  </div>
                </div>
              )}

            {/* Results */}
            {filteredOffers.length === 0 ? (
              <div className="text-center py-12 agm-empty-wash rounded-xl border border-primary-100 px-4 shadow-sm">
                <Tractor className="mx-auto h-12 w-12 text-primary-300 mb-4" />
                <p className="text-gray-700 text-lg font-medium">
                  {t("market.noResults")}
                </p>
                <p className="text-gray-500 text-sm mt-1 mb-5">
                  {t("market.emptyHint")}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                      setLocationQuery("");
                      setResultsKey((k) => k + 1);
                    }}
                    className="agm-btn-primary inline-flex justify-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
                  >
                    {t("market.browseAll")}
                  </button>
                  <Link
                    to="/market/ati"
                    className="inline-flex justify-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                  >
                    {t("market.tryAti")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                {(expandedCategory
                  ? [expandedCategory].filter((c) => groupedOffers[c])
                  : sortedCategories
                ).map((category) => {
                  const sortedCategoryOffers = sortOffersByRegion([
                    ...groupedOffers[category],
                  ]);
                  const isExpanded = expandedCategory === category;

                  return (
                    <div key={category} className="space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                          {isExpanded && (
                            <button
                              type="button"
                              onClick={() => setExpandedCategory(null)}
                              className="mr-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                              <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                          )}
                          <span className="bg-primary-100 text-primary-800 text-sm font-bold px-2 py-1 rounded mr-2 uppercase shadow-sm">
                            {t(`category.${category}`)}
                          </span>
                        </h2>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {sortedCategoryOffers.length} {t("market.results")}
                          </span>
                          {!isExpanded && (
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedCategory(category);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors whitespace-nowrap"
                            >
                              {t("market.seeAll")} &rarr;
                            </button>
                          )}
                          {isExpanded && (
                            <button
                              type="button"
                              onClick={() => setExpandedCategory(null)}
                              className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors whitespace-nowrap"
                            >
                              &larr; {t("market.allCategoriesBack")}
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 pt-2 items-stretch">
                          {sortedCategoryOffers.map((offer) => (
                            <div
                              key={offer.id}
                              className="w-full min-w-0 h-full flex"
                            >
                              {renderOfferCard(offer)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Category preview: horizontal swipe row on all screen sizes,
                           matching the homepage's "fresh near you" carousel (client
                           request, see docs/UI-LAYOUT-RULES.md for history). Mobile card
                           width is intentionally ~150px — not the wider sm:/md: sizes —
                           so roughly two cards plus a peek of the next stay visible on a
                           narrow phone; a wider mobile card regressed this to look like
                           one-per-row before. "See All" still opens the full 2-col grid. */
                        <div className="flex gap-3 px-1 pb-8 pt-2 overflow-x-auto -mx-1 snap-x snap-mandatory md:gap-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                          {sortedCategoryOffers.map((offer) =>
                            renderOfferCard(offer, true),
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
