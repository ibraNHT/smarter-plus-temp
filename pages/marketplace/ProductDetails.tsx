
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { ArrowLeft, ShoppingCart, MessageCircle, MapPin, ShieldCheck, Package, Plus, Minus, User, Lock, Truck, AlertCircle, Calendar, Clock, Star, Image as ImageIcon, PlayCircle, X, Heart, Layers, Share2 } from 'lucide-react';
import { MarketType, OfferType, OrderStatus, UserRole, Review } from '../../types';
import { SEO } from '../../components/SEO';
import { buildProductBreadcrumbSchema } from '../../services/seo/schemaBuilders';
import { ProductDetailsSkeleton } from '../../components/skeletons/ProductDetailsSkeleton';
import { ServiceSlotsSkeleton } from '../../components/Loaders';
import { Spinner } from '../../components/Spinner';
import { ConfirmModal } from '../../components/ConfirmModal';
import { offerImageHero, offerImageInBox } from '../../utils/offerImageDisplay';
import { getOfferImageUrls } from '../../utils/offerImages';
import { displayNameTruncateClass, resolveProducerDisplayName, resolveProfileImageUrl } from '../../utils/displayName';
import { getAverageRatingFromReviews, getReviewsForOffer } from '../../utils/offerReviews';
import { isProducerDashboardUser } from '../../services/producerSession';
import { apiFetch } from '../../services/apiService';
import { API_ENDPOINTS } from '../../client-api/endpoints';
import { showAppToast } from '../../services/appToast';
import { usePwaInstall } from '../../contexts/PwaInstallContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
  absoluteOfferImageUrl,
  buildOfferSeoDescription,
  buildOfferShareText,
  buildOfferShareUrl,
} from '../../utils/offerShare';

/** Parse `YYYY-MM-DD` from `<input type="date">` as a local calendar day (avoids UTC weekday shifts). */
function parseLocalYmd(ymd: string): Date {
  const [y, mo, d] = ymd.split('-').map(Number);
  if (!y || !mo || !d) return new Date();
  return new Date(y, mo - 1, d);
}

export const ProductDetails: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const { getOfferById, producers, offers, addToCart, clearCart, startNegotiation, user, getAverageRating, getProducerPortfolios, toggleFavorite, clients, reviews, compareList, addToCompare, removeFromCompare, orders, cart, refreshOffers, refreshProducers, refreshAllReviews, refreshMyPortfolios, refreshClients, refreshOrders } = useStore();
  const { t } = useTranslation();
  const { formatXaf } = useCurrency();
  const navigate = useNavigate();
  const { nudgeInstall } = usePwaInstall();

  // Page-mount fetch — offers + producers + reviews are all shown on this
  // page. `pageLoading` keeps the skeleton scoped to this page.
  const [pageLoading, setPageLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setPageLoading(true);
    Promise.all([
      refreshOffers(),
      refreshProducers(),
      refreshClients(),
      refreshAllReviews(),
      refreshOrders(),
      refreshMyPortfolios(),
    ]).finally(() => {
      if (!cancelled) setPageLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const offer = offerId ? getOfferById(offerId) : undefined;
  const producer = offer ? producers.find(p => p.id === offer.producerId) : undefined;

  // Initialize quantity to minQuantity if available, else 1
  const [quantity, setQuantity] = useState(offer?.minQuantity || 1);

  // Booking State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotBlockReason, setSlotBlockReason] = useState<string>('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [serviceSlotStates, setServiceSlotStates] = useState<Array<{
    time: Date;
    status: 'AVAILABLE' | 'BOOKED_BY_ME' | 'BOOKED' | 'BLOCKED';
    reason?: string;
  }>>([]);

  // Portfolio State
  const [relevantPortfolios, setRelevantPortfolios] = useState<any[]>([]);
  const [activePortfolioMedia, setActivePortfolioMedia] = useState<string | null>(null); // For Lightbox
  const [negotiateLoading, setNegotiateLoading] = useState(false);
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedOfferImageIndex, setSelectedOfferImageIndex] = useState(0);

  useEffect(() => {
    setSelectedOfferImageIndex(0);
  }, [offerId]);

  // Get Favorites (session id is auth-user id; profiles use separate ids)
  let favorites: string[] = [];
  if (user) {
    if (user.role === UserRole.CLIENT) {
      const c = clients.find(
        (client) =>
          (user.clientId && client.id === user.clientId) ||
          (!!client.userId && client.userId === user.id),
      );
      favorites = c?.favorites || [];
    } else if (isProducerDashboardUser(user)) {
      const p = producers.find(prod => prod.id === user.producerId);
      favorites = p?.favorites || [];
    }
  }
  const isFav = favorites.includes(offer?.id || '');
  const isComparing = offer ? compareList.includes(offer.id) : false;

  // Reviews for this producer — fetch from API if not already in global state
  const [fetchedProducerReviews, setFetchedProducerReviews] = useState<any[]>([]);
  useEffect(() => {
    if (!producer?.userId) return;
    apiFetch<any[]>(API_ENDPOINTS.reviews.byUser(producer.userId)).then(data => {
      if (Array.isArray(data)) setFetchedProducerReviews(data);
    }).catch(() => {});
  }, [producer?.userId]);

  const mapReviewRow = (r: any): Review => {
    const pic = r.reviewerProfileImageUrl;
    const picStr = typeof pic === 'string' && pic.trim() ? pic.trim() : undefined;
    return {
      id: String(r.id),
      orderId: String(r.orderId),
      reviewerId: String(r.reviewerId),
      targetId: String(r.targetId),
      rating: Number(r.rating) || 0,
      comment: typeof r.comment === 'string' ? r.comment : '',
      createdAt:
        typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt ?? 0).toISOString(),
      reviewerDisplayName:
        typeof r.reviewerDisplayName === 'string' ? r.reviewerDisplayName : undefined,
      reviewerProfileImageUrl: picStr,
    };
  };

  const allProducerReviews = React.useMemo(() => {
    const localReviews = producer ? reviews.filter(r => r.targetId === producer.id || r.targetId === producer.userId) : [];
    const remoteReviews = fetchedProducerReviews.map(mapReviewRow);
    const byId = new Map<string, Review>();
    [...localReviews, ...remoteReviews].forEach((r) => byId.set(r.id, r));
    return Array.from(byId.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [producer, reviews, fetchedProducerReviews]);

  const producerReviews = allProducerReviews;

  const offerReviews = React.useMemo(() => {
    if (!offerId) return [];
    return getReviewsForOffer(offerId, reviews, orders);
  }, [offerId, reviews, orders]);

  const getClientByUserOrProfileId = (id: string) =>
    clients.find((c) => c.id === id || c.userId === id);

  /** Client name for reviews on this producer (API snapshot, then client catalog). */
  const getReviewerDisplay = (review: Review) => {
    const row = getClientByUserOrProfileId(review.reviewerId) as {
      name?: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
      user?: { displayName?: string; profileImageUrl?: string };
    } | undefined;
    const catalogName = row
      ? (row.name || row.user?.displayName || `${(row.firstName ?? '').trim()} ${(row.lastName ?? '').trim()}`.trim()).trim()
      : '';
    const catalogAvatar =
      (row?.profileImageUrl || row?.user?.profileImageUrl || '').trim() || undefined;
    const apiName = (review.reviewerDisplayName ?? '').trim();
    const apiAvatar =
      typeof review.reviewerProfileImageUrl === 'string' && review.reviewerProfileImageUrl.trim()
        ? review.reviewerProfileImageUrl.trim()
        : undefined;
    return {
      name: apiName || catalogName || t('review.reviewerFallback'),
      avatarUrl: apiAvatar ?? catalogAvatar,
    };
  };

  useEffect(() => {
    let alive = true;
    const loadAvailability = async () => {
      if (!(offer?.type === OfferType.SERVICE && offer.producerId)) return;
      const dateObj = parseLocalYmd(selectedDate);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const durationHours = offer.serviceDuration || 1;
      setSlotsLoading(true);
      try {
        const res = await apiFetch<{
          blocked: boolean;
          reason?: string;
          slots: Array<{ time: string; status: 'AVAILABLE' | 'BOOKED'; reason?: string }>;
        }>(
          API_ENDPOINTS.producers.availabilityByDate(offer.producerId, dateStr, durationHours),
          { silent401: true } as any,
        );
        if (!alive) return;
        if (res?.blocked) {
          setSlotBlockReason(res.reason ? `Unavailable: ${res.reason}` : 'Unavailable');
          setServiceSlotStates([]);
          setSelectedSlot(null);
          return;
        }
        setSlotBlockReason('');
        const activeOrders = orders.filter(
          (o) => o.producerId === offer.producerId && o.status !== OrderStatus.CANCELLED,
        );
        const myBookedStarts = new Set(
          activeOrders
            .filter((o) => !!user?.clientId && o.clientId === user.clientId)
            .flatMap((o) =>
              (o.items || [])
                .filter((item) => item.type === OfferType.SERVICE && !!item.bookingDate)
                .map((item) => new Date(item.bookingDate!).toISOString()),
            ),
        );
        const myCartBookedStarts = new Set(
          cart
            .filter(
              (item) =>
                item.type === OfferType.SERVICE &&
                item.id === offer.id &&
                !!item.bookingDate,
            )
            .map((item) => new Date(item.bookingDate!).toISOString()),
        );
        const allSlots = (res?.slots || []).map((s) => {
          const iso = new Date(s.time).toISOString();
          if (myCartBookedStarts.has(iso)) {
            return {
              time: new Date(s.time),
              status: 'BOOKED_BY_ME' as const,
              reason: 'Already in your cart',
            };
          }
          if (s.status === 'BOOKED' && myBookedStarts.has(iso)) {
            return {
              time: new Date(s.time),
              status: 'BOOKED_BY_ME' as const,
              reason: 'You already booked this slot',
            };
          }
          if (s.status === 'BOOKED') {
            return {
              time: new Date(s.time),
              status: 'BOOKED' as const,
              reason: s.reason || 'Already busy',
            };
          }
          return { time: new Date(s.time), status: 'AVAILABLE' as const };
        });
        setServiceSlotStates(allSlots);
        setSelectedSlot((prev) => {
          if (!prev) return null;
          const selected = allSlots.find((s) => s.time.toISOString() === prev);
          return selected?.status === 'AVAILABLE' ? prev : null;
        });
      } catch {
        if (!alive) return;
        setSlotBlockReason('Availability check failed. Please try another date.');
        setServiceSlotStates([]);
        setSelectedSlot(null);
      } finally {
        if (alive) setSlotsLoading(false);
      }
    };
    void loadAvailability();
    return () => {
      alive = false;
    };
  }, [selectedDate, offer?.id, offer?.producerId, offer?.serviceDuration, orders, user?.clientId, cart]);

  useEffect(() => {
    if (offer && producer) {
      const portfolios = getProducerPortfolios(producer.id);
      // Filter portfolios that match this offer's category and are published
      const matches = portfolios.filter(p => p.category === offer.category && p.isPublished);
      setRelevantPortfolios(matches);
    }
  }, [offer, producer]);

  if (pageLoading && !offer) {
    return <ProductDetailsSkeleton />;
  }

  if (!offer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Not Found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary-600 hover:underline">Go Back</button>
      </div>
    );
  }

  if (offer.reservedClientId && user?.id !== offer.reservedClientId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Lock className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500">This is a personalized offer reserved for another client.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary-600 hover:underline">Go Back</button>
      </div>
    );
  }

  const isProducerMarket = offer.marketType === MarketType.PRODUCER;
  const isNegotiationAllowed = isProducerMarket && offer.isNegotiable && !offer.reservedClientId;
  // Every producer-market offer should let the buyer contact the seller, even
  // when the offer isn't negotiable — the chat session is created the same way.
  const canContactSeller = isProducerMarket && !!producer && !offer.reservedClientId;
  const maxOrder = offer.maxQuantity && offer.maxQuantity > 0 ? Math.min(offer.maxQuantity, offer.quantity) : offer.quantity;
  const minOrder = offer.minQuantity || 1;
  const productReviews = isProducerMarket ? producerReviews : offerReviews;
  const productRating = isProducerMarket
    ? (producer ? getAverageRating(producer.id) : 0)
    : getAverageRatingFromReviews(offerReviews);

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= minOrder && newQty <= maxOrder) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    if (offer.type === OfferType.SERVICE && !selectedSlot) {
      showAppToast('Please select a time slot.', 'WARNING');
      return;
    }

    const result = addToCart(offer, quantity, selectedSlot || undefined);
    if (!result.success && result.error === 'OWN_OFFER') {
      showAppToast('You cannot add your own offer to cart.', 'WARNING');
      return;
    }
    if (!result.success && result.error === 'PRODUCER_CONFLICT') {
      setShowClearCartConfirm(true);
      return;
    }
    if (!result.success && result.error === 'DUPLICATE_SERVICE_SLOT') {
      showAppToast('This exact service slot is already booked or already in your cart.', 'WARNING');
      return;
    }
    nudgeInstall('cart');
    navigate(offer.type === OfferType.SERVICE ? '/cart?booking=1' : '/cart');
  };

  const handleNegotiate = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (negotiateLoading) return;
    setNegotiateLoading(true);
    try {
      const producerUserId = producer?.userId || producer?.id || offer.producerId;
      const chatId = await startNegotiation(producerUserId, offer.id);
      navigate(`/messages/${chatId}`);
    } finally {
      setNegotiateLoading(false);
    }
  };

  const handleCompareToggle = () => {
    if (isComparing) {
      removeFromCompare(offer.id);
      showAppToast(t('product.removedCompare'), 'INFO');
    } else {
      addToCompare(offer.id);
      showAppToast(t('product.addedCompare'), 'SUCCESS');
    }
  };

  const handleFavoriteToggle = () => {
    const willAdd = !isFav;
    toggleFavorite(offer.id);
    showAppToast(willAdd ? t('product.addedFavorite') : t('product.removedFavorite'), willAdd ? 'SUCCESS' : 'INFO');
    if (willAdd) nudgeInstall('favorite');
  };

  const producerDisplayName = !isProducerMarket
    ? 'ATI Retail Store'
    : resolveProducerDisplayName(producer);
  const producerAvatarUrl = isProducerMarket ? resolveProfileImageUrl(producer) : undefined;

  const handleShare = async () => {
    const shareUrl = buildOfferShareUrl(offer.id);
    const text = buildOfferShareText({
      title: offer.title,
      price: offer.price,
      location: offer.offerLocation,
      rating: productRating > 0 ? productRating : null,
      producerName: producerDisplayName,
    });
    const shareData = {
      title: offer.title,
      text,
      url: shareUrl,
    };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
        showAppToast(t('product.linkCopied'), 'SUCCESS');
      }
    } catch {
      // User dismissed the share sheet or clipboard was blocked — no action needed.
    }
  };

  const productSchema = offer ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": offer.title,
    "image": offer.imageUrl ? absoluteOfferImageUrl(offer.imageUrl) : undefined,
    "description": offer.description,
    "url": `https://acheteici.com/offer/${offer.id}`,
    "aggregateRating": productRating > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": productRating,
      "reviewCount": productReviews.length > 0 ? productReviews.length : 1
    } : undefined,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "XAF",
      "price": offer.price,
      "availability": offer.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": `https://acheteici.com/offer/${offer.id}`,
      "seller": {
        "@type": "Organization",
        "name": producerDisplayName
      }
    }
  } : undefined;

  const seoSchema =
    offer && productSchema
      ? [productSchema, buildProductBreadcrumbSchema(offer.title, offer.id)]
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO
        title={offer ? `Buy ${offer.title} — Agriculture Africa` : 'Product'}
        description={buildOfferSeoDescription({
          title: offer.title,
          description: offer.description,
          price: offer.price,
          location: offer.offerLocation,
          rating: productRating > 0 ? productRating : null,
          producerName: producerDisplayName,
        })}
        imageUrl={absoluteOfferImageUrl(offer.imageUrl)}
        type="product"
        url={`/offer/${offer.id}`}
        priceAmount={offer.price}
        priceCurrency="XAF"
        schema={seoSchema}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors font-medium">
          <ArrowLeft className="h-5 w-5 mr-2" /> {t('product.back')}
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="md:flex">

            {/* Image Section — primary + additional photos */}
            <div className="md:w-1/2 flex flex-col bg-gray-100 p-3 sm:p-4">
              <div className="h-72 sm:h-80 md:h-96 md:min-h-96 flex items-center justify-center relative">
              <img
                src={getOfferImageUrls(offer)[selectedOfferImageIndex] ?? offer.imageUrl}
                alt={offer.title}
                className={offerImageHero}
              />
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${isProducerMarket ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                  {isProducerMarket ? t('product.producerOffer') : t('product.atiOffer')}
                </span>

                {offer.type === OfferType.SERVICE && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm bg-purple-600 text-white">
                    Service
                  </span>
                )}

                {offer.reservedClientId && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm bg-purple-600 text-white">
                    <User className="h-3 w-3 mr-1" /> Personalized for You
                  </span>
                )}
              </div>
              </div>
              {getOfferImageUrls(offer).length > 1 ? (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {getOfferImageUrls(offer).map((url, idx) => (
                    <button
                      key={`${url}-${idx}`}
                      type="button"
                      onClick={() => setSelectedOfferImageIndex(idx)}
                      className={`shrink-0 w-16 h-16 rounded-md border-2 overflow-hidden bg-white ${
                        selectedOfferImageIndex === idx ? 'border-primary-600' : 'border-gray-200'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Details Section */}
            <div className="md:w-1/2 p-5 sm:p-6 md:p-8 flex flex-col min-w-0">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs sm:text-sm font-medium text-primary-600 uppercase tracking-wide">{offer.category}</p>
                  <div className="flex gap-1.5 sm:gap-2 items-center flex-wrap">
                    {/* Fav Button */}
                    {(user?.role === UserRole.CLIENT || isProducerDashboardUser(user)) && (
                      <button
                        onClick={handleFavoriteToggle}
                        className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        title={t('cart.saveForLater')}
                      >
                        <Heart className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                      </button>
                    )}

                    {/* Compare Button */}
                    <button
                      onClick={handleCompareToggle}
                      className={`p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ${isComparing ? 'text-blue-600' : 'text-gray-400'}`}
                      title={t('product.compare')}
                    >
                      <Layers className="h-5 w-5" />
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={() => void handleShare()}
                      className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-400 hover:text-primary-600"
                      title={t('product.share')}
                    >
                      <Share2 className="h-5 w-5" />
                    </button>

                    {isNegotiationAllowed && (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-bold">
                        <MessageCircle className="h-3 w-3 mr-1" /> Negotiable
                      </span>
                    )}
                    {offer.isDeliveryAvailable ? (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold">
                        <Truck className="h-3 w-3 mr-1" /> Delivery
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-bold">
                        <MapPin className="h-3 w-3 mr-1" /> Pickup
                      </span>
                    )}
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 mb-4 leading-tight break-words">{offer.title}</h1>

                <div className="flex items-baseline flex-wrap mb-6 pb-6 border-b border-gray-100 gap-x-2">
                  <span className="text-3xl sm:text-4xl font-bold text-primary-600 break-words">{formatXaf(offer.price)}</span>
                  <span className="text-gray-500 font-medium">/ {t(`unit.${offer.unit}`)}</span>
                </div>

                <div className="prose prose-sm text-gray-600 mb-8">
                  <p className="text-base leading-relaxed">{offer.description}</p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Package className="h-4 w-4 mr-2" /> {offer.type === OfferType.SERVICE ? 'Capacity' : t('product.stock')}
                    </div>
                    <p className="font-bold text-gray-900">{offer.quantity} {t(`unit.${offer.unit}`)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <AlertCircle className="h-4 w-4 mr-2" /> Limits
                    </div>
                    <p className="text-xs text-gray-700">Min: <strong>{minOrder}</strong> {t(`unit.${offer.unit}`)}</p>
                    {maxOrder < offer.quantity && (
                      <p className="text-xs text-gray-700">Max: <strong>{maxOrder}</strong> {t(`unit.${offer.unit}`)}</p>
                    )}
                  </div>
                </div>

                {/* BOOKING WIDGET FOR SERVICE */}
                {offer.type === OfferType.SERVICE ? (
                  <div className="mb-8 bg-purple-50 p-5 rounded-lg border border-purple-100">
                    <h3 className="font-bold text-purple-900 mb-3 flex items-center"><Calendar className="h-5 w-5 mr-2" /> {t('product.selectSlot')}</h3>
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white text-gray-900"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {slotsLoading ? (
                        <ServiceSlotsSkeleton label={t('product.loadingSlots')} />
                      ) : serviceSlotStates.length === 0 ? (
                        <div className="col-span-3 space-y-2 py-2">
                          <p className="text-sm text-gray-500 italic">
                            {slotBlockReason || 'No slots available for this date.'}
                          </p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            For <strong>services</strong>, the seller must publish weekly hours in{' '}
                            <strong>Producer dashboard → Availability</strong>. Choose a day they work, pick a time, then press{' '}
                            <strong>Book Now</strong> (that adds the booking to your cart). Complete checkout from the{' '}
                            <Link to="/cart" className="text-primary-600 font-semibold underline">cart</Link>.
                          </p>
                        </div>
                      ) : (
                        serviceSlotStates.map((slot) => {
                          const slotStr = slot.time.toISOString();
                          const displayTime = slot.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          const isSelected = selectedSlot === slotStr;
                          const isDisabled = slot.status !== 'AVAILABLE';
                          return (
                            <button
                              key={slotStr}
                              type="button"
                              onClick={() => {
                                if (isDisabled) return;
                                setSelectedSlot(slotStr);
                              }}
                              disabled={isDisabled}
                              title={slot.reason || ''}
                              className={`relative py-2 px-1 text-xs font-bold rounded border ${
                                isDisabled
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                              }`}
                            >
                              {displayTime}
                              {slot.status === 'BOOKED_BY_ME' && (
                                <span className="absolute -top-2 right-1 rounded bg-blue-600 px-1 py-0.5 text-[9px] text-white">
                                  Mine
                                </span>
                              )}
                              {slot.status === 'BOOKED' && (
                                <span className="absolute -top-2 right-1 rounded bg-gray-500 px-1 py-0.5 text-[9px] text-white">
                                  Busy
                                </span>
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>
                    {/* Number of slots to book — like a product quantity, so the
                        buyer can book more than the minimum. */}
                    <div className="mt-4">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Number of slots</label>
                      <div className="flex items-center w-40 border-2 border-gray-200 rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= minOrder}
                          className="p-3 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="text"
                          readOnly
                          className="w-full text-center border-none focus:ring-0 p-1 text-gray-900 font-bold text-lg bg-transparent"
                          value={quantity}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= maxOrder}
                          className="p-3 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {minOrder > 1 && <p className="text-xs text-orange-600 mt-1 font-medium">Minimum booking is {minOrder} slots.</p>}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 flex items-center">
                      <Clock className="h-3 w-3 mr-1" /> {quantity} slot{quantity > 1 ? 's' : ''} × {offer.serviceDuration}h =
                      <strong className="ml-1">{quantity * (offer.serviceDuration || 1)} hours total</strong>
                    </p>
                  </div>
                ) : (
                  // STANDARD QUANTITY FOR PRODUCTS
                  <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('form.quantity')}</label>
                    <div className="flex items-center w-40 border-2 border-gray-200 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        className="p-3 hover:bg-gray-100 text-gray-600 transition-colors"
                        disabled={quantity <= minOrder}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="text"
                        readOnly
                        className="w-full text-center border-none focus:ring-0 p-1 text-gray-900 font-bold text-lg bg-transparent"
                        value={quantity}
                      />
                      <button
                        onClick={() => handleQuantityChange(1)}
                        className="p-3 hover:bg-gray-100 text-gray-600 transition-colors"
                        disabled={quantity >= maxOrder}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {minOrder > 1 && <p className="text-xs text-orange-600 mt-2 font-medium">Minimum order is {minOrder} units.</p>}
                  </div>
                )}

                {/* Info Card */}
                {isProducerMarket && producer ? (
                  <div className="bg-primary-50 p-4 rounded-lg mb-6 border border-primary-100 min-w-0 overflow-hidden">
                    <h3 className="text-xs font-bold text-primary-800 uppercase tracking-wide mb-3">{t('product.soldBy')}</h3>
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white border border-primary-200 overflow-hidden shadow-sm flex items-center justify-center">
                        {producerAvatarUrl ? (
                          <img
                            src={producerAvatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-primary-600" aria-hidden />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link
                            to={`/profile/producer/${producer.id}`}
                            className={`text-base font-bold text-gray-900 hover:text-primary-600 hover:underline ${displayNameTruncateClass}`}
                            title={producerDisplayName}
                          >
                            {producerDisplayName}
                          </Link>
                          {productRating > 0 && (
                            <span className="flex shrink-0 items-center text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold">
                              <Star className="h-3 w-3 mr-0.5 fill-current" /> {productRating}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-600 mt-1 min-w-0">
                          <MapPin className="h-3 w-3 mr-1 shrink-0" />
                          <span
                            className={displayNameTruncateClass}
                            title={offer.offerLocation || producer.locations?.[0]?.address || 'Location not set'}
                          >
                            {offer.offerLocation || producer.locations?.[0]?.address || 'Location not set'}
                          </span>
                        </div>
                        {producer.status === 'VALIDATED' && (
                          <div className="flex items-center text-xs text-green-700 mt-1 font-medium">
                            <ShieldCheck className="h-3 w-3 mr-1" /> {t('product.verified')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : !isProducerMarket ? (
                  <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3">{t('product.soldBy')}</h3>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg shadow-sm">
                        <img src="/apple-touch-icon.png" alt="ATI Logo" className="h-10 w-10 object-contain rounded-xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-gray-900">
                            ATI Retail Store
                          </span>
                          {productRating > 0 && (
                            <span className="flex shrink-0 items-center text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold">
                              <Star className="h-3 w-3 mr-0.5 fill-current" /> {productRating}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-600 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {offer.offerLocation || 'Official Warehouse'}
                        </div>
                        <div className="flex items-center text-xs text-blue-700 mt-1 font-medium">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Vetted Quality
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Actions */}
              <div className="hidden md:flex flex-col gap-3 mt-6">
                <button
                  onClick={handleAddToCart}
                  className="agm-btn-primary flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-primary-600 text-white px-4 sm:px-6 py-3.5 sm:py-4 rounded-xl font-bold hover:bg-primary-700 text-sm sm:text-base"
                >
                  {offer.type === OfferType.SERVICE ? (
                    <span className="inline-flex items-center"><Calendar className="h-5 w-5 mr-2" /> {t('product.bookNow')}</span>
                  ) : (
                    <span className="inline-flex items-center"><ShoppingCart className="h-5 w-5 mr-2" /> {t('product.addToCart')}</span>
                  )}
                  <span className="whitespace-nowrap">- {formatXaf(offer.price * quantity)}</span>
                </button>
                {offer.type === OfferType.SERVICE && (
                  <p className="text-xs text-gray-600 text-center px-1 leading-relaxed">{t('product.bookNowHint')}</p>
                )}

                {canContactSeller && (
                  <button
                    type="button"
                    disabled={negotiateLoading}
                    onClick={() => void handleNegotiate()}
                    className="flex items-center justify-center bg-white text-primary-600 border-2 border-primary-600 px-6 py-3 rounded-xl font-bold hover:bg-primary-50 transition-colors disabled:opacity-60"
                  >
                    {negotiateLoading ? <Spinner className="h-5 w-5 mr-2" label="Opening chat" /> : <MessageCircle className="h-5 w-5 mr-2" />}
                    {negotiateLoading ? 'Opening…' : isNegotiationAllowed ? `Chat / ${t('product.negotiate')}` : 'Chat with seller'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related offers */}
        {(() => {
          const related = offers
            .filter(
              (o) =>
                o.id !== offer.id &&
                o.category === offer.category &&
                o.marketType === offer.marketType &&
                o.quantity > 0,
            )
            .slice(0, 8);
          if (related.length === 0) return null;
          return (
            <div className="mt-12">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{t('product.related')}</h2>
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-thin">
                {related.map((rel) => (
                  <Link
                    key={rel.id}
                    to={`/offer/${rel.id}`}
                    className="agm-card-lift flex-none snap-start w-44 sm:w-52 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div className="h-28 bg-gray-100">
                      <img src={rel.imageUrl} alt="" className={offerImageInBox} />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">{rel.title}</p>
                      <p className="mt-1 text-primary-700 font-bold text-sm">{formatXaf(rel.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* PORTFOLIO SECTION */}
        {isProducerMarket && relevantPortfolios.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center mb-6">
              <ImageIcon className="h-6 w-6 text-gray-400 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Producer Portfolio: {offer.category}</h2>
            </div>

            <div className="space-y-8">
              {relevantPortfolios.map(portfolio => (
                <div key={portfolio.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">{portfolio.title}</h3>
                    <p className="text-gray-600 mt-1">{portfolio.description}</p>
                  </div>

                  <div className="p-6 bg-gray-50">
                    {/* Horizontal Scroll for Media */}
                    <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-thin scrollbar-thumb-gray-300">
                      {portfolio.videoUrl && (
                        <div className="flex-shrink-0 w-64 h-40 bg-black rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-90">
                          <PlayCircle className="h-12 w-12 text-white opacity-80" />
                          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Video</span>
                        </div>
                      )}
                      {portfolio.imageUrls.map((url: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePortfolioMedia(url)}
                          className="flex-shrink-0 w-64 h-40 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={url}
                            alt={`Portfolio ${idx}`}
                            className={offerImageInBox}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS SECTION — producer market (seller) or ATI store (this product) */}
        {(isProducerMarket ? !!producer : true) && (
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center">
              <Star className="h-6 w-6 text-yellow-500 fill-current mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">
                {isProducerMarket ? t('product.producerReviews') : t('product.offerReviews')}
              </h2>
              <span className="ml-3 bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full font-medium">{productReviews.length}</span>
            </div>

            <div className="p-6">
              {productReviews.length === 0 ? (
                <p className="text-gray-500 italic text-center py-8">
                  {isProducerMarket ? t('product.noReviewsProducer') : t('product.noReviewsOffer')}
                </p>
              ) : (
                <div className="space-y-6">
                  {productReviews.map((review) => {
                    const reviewer = getReviewerDisplay(review);
                    const initial = reviewer.name.charAt(0).toUpperCase();
                    return (
                    <div key={review.id} className="flex items-start space-x-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="flex-shrink-0">
                        {reviewer.avatarUrl ? (
                          <img src={reviewer.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                            {initial || <User className="h-5 w-5" />}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <div className="flex items-center min-w-0">
                            <span className="font-bold text-gray-900 mr-2 truncate">{reviewer.name}</span>
                            <div className="flex shrink-0">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-700">{review.comment}</p>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox for Portfolio */}
      {activePortfolioMedia && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4" onClick={() => setActivePortfolioMedia(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300"><X className="h-8 w-8" /></button>
          <img src={activePortfolioMedia} className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl" />
        </div>
      )}

      <ConfirmModal
        open={showClearCartConfirm}
        tone="warning"
        title={t('cart.confirmClearTitle')}
        description={t('cart.confirmClearBody')}
        confirmLabel={t('cart.confirmClearConfirm')}
        onClose={() => setShowClearCartConfirm(false)}
        onConfirm={() => {
          clearCart();
          const second = addToCart(offer, quantity, selectedSlot || undefined);
          setShowClearCartConfirm(false);
          if (second.success) {
            nudgeInstall('cart');
            navigate(offer.type === OfferType.SERVICE ? '/cart?booking=1' : '/cart');
          }
        }}
      />

      <ConfirmModal
        open={showLoginPrompt}
        tone="info"
        title="Sign in required"
        description="You need to be signed in to contact this producer."
        confirmLabel="Sign in"
        onClose={() => setShowLoginPrompt(false)}
        onConfirm={() => {
          setShowLoginPrompt(false);
          navigate('/login');
        }}
      />

      {/* Sticky mobile CTA */}
      <div
        className="md:hidden fixed left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-3 py-2.5 flex gap-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
        style={{ bottom: 'env(safe-area-inset-bottom)' }}
      >
        {canContactSeller && (
          <button
            type="button"
            disabled={negotiateLoading}
            onClick={() => void handleNegotiate()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 border-2 border-primary-600 text-primary-700 font-bold rounded-xl py-3 text-sm disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" />
            {isNegotiationAllowed ? t('product.negotiate') : 'Chat'}
          </button>
        )}
        <button
          type="button"
          onClick={handleAddToCart}
          className="agm-btn-primary flex-[1.4] inline-flex items-center justify-center gap-1.5 bg-primary-600 text-white font-bold rounded-xl py-3 text-sm shadow-md"
        >
          {offer.type === OfferType.SERVICE ? <Calendar className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          {offer.type === OfferType.SERVICE ? t('product.bookNow') : t('product.addToCart')}
        </button>
      </div>
      <div className="md:hidden h-20" aria-hidden />
    </div>
  );
};
