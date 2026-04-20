
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { ArrowLeft, ShoppingCart, MessageCircle, MapPin, ShieldCheck, Package, Plus, Minus, User, Lock, Truck, AlertCircle, Calendar, Clock, Star, Image as ImageIcon, PlayCircle, X, Heart, Layers } from 'lucide-react';
import { MarketType, OfferType, UserRole } from '../../types';
import { SEO } from '../../components/SEO';

/** Parse `YYYY-MM-DD` from `<input type="date">` as a local calendar day (avoids UTC weekday shifts). */
function parseLocalYmd(ymd: string): Date {
  const [y, mo, d] = ymd.split('-').map(Number);
  if (!y || !mo || !d) return new Date();
  return new Date(y, mo - 1, d);
}

export const ProductDetails: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const { getOfferById, producers, addToCart, clearCart, startNegotiation, user, getAvailableSlots, getAverageRating, getProducerPortfolios, toggleFavorite, clients, reviews, compareList, addToCompare, removeFromCompare } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const offer = offerId ? getOfferById(offerId) : undefined;
  const producer = offer ? producers.find(p => p.id === offer.producerId) : undefined;

  // Initialize quantity to minQuantity if available, else 1
  const [quantity, setQuantity] = useState(offer?.minQuantity || 1);

  // Booking State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Portfolio State
  const [relevantPortfolios, setRelevantPortfolios] = useState<any[]>([]);
  const [activePortfolioMedia, setActivePortfolioMedia] = useState<string | null>(null); // For Lightbox

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
    } else if (user.role === UserRole.PRODUCER) {
      const p = producers.find(prod => prod.id === user.producerId);
      favorites = p?.favorites || [];
    }
  }
  const isFav = favorites.includes(offer?.id || '');
  const isComparing = offer ? compareList.includes(offer.id) : false;

  // Reviews for this producer
  const producerReviews = producer ? reviews.filter(r => r.targetId === producer.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  useEffect(() => {
    if (offer?.type === OfferType.SERVICE && offer.producerId) {
      const dateObj = parseLocalYmd(selectedDate);
      const slots = getAvailableSlots(offer.producerId, dateObj, offer.serviceDuration || 1);
      setAvailableSlots(slots);
      setSelectedSlot(null); // Reset slot when date changes
    }
  }, [selectedDate, offer]);

  useEffect(() => {
    if (offer && producer) {
      const portfolios = getProducerPortfolios(producer.id);
      // Filter portfolios that match this offer's category and are published
      const matches = portfolios.filter(p => p.category === offer.category && p.isPublished);
      setRelevantPortfolios(matches);
    }
  }, [offer, producer]);

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
  const maxOrder = offer.maxQuantity && offer.maxQuantity > 0 ? Math.min(offer.maxQuantity, offer.quantity) : offer.quantity;
  const minOrder = offer.minQuantity || 1;
  const producerRating = producer ? getAverageRating(producer.id) : 0;

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= minOrder && newQty <= maxOrder) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    if (offer.type === OfferType.SERVICE && !selectedSlot) {
      alert("Please select a time slot.");
      return;
    }

    const result = addToCart(offer, quantity, selectedSlot || undefined);
    if (!result.success && result.error === 'PRODUCER_CONFLICT') {
      const confirmClear = window.confirm(t('cart.confirmClear'));

      if (confirmClear) {
        clearCart();
        addToCart(offer, quantity, selectedSlot || undefined);
      }
    } else {
      navigate('/cart');
    }
  };

  const handleNegotiate = async () => {
    if (!user) {
      const confirmLogin = window.confirm("You must be logged in to negotiate prices.");
      if (confirmLogin) {
        navigate('/login');
      }
      return;
    }
    const producerUserId = producer?.userId || producer?.id || offer.producerId;
    const chatId = await startNegotiation(producerUserId, offer.id);
    navigate(`/messages/${chatId}`);
  };

  const handleCompareToggle = () => {
    if (isComparing) removeFromCompare(offer.id);
    else addToCompare(offer.id);
  };

  const getProducerDisplayName = () => {
    if (!isProducerMarket) return 'ATI Retail Store';
    if (!producer) return 'Unknown';
    if (producer.type === 'BUSINESS') return producer.name || `${producer.firstName || ''} ${producer.lastName || ''}`.trim() || 'Business';
    return `${producer.firstName || ''} ${producer.lastName || ''}`.trim() || producer.name || 'Unknown';
  };

  const productSchema = offer ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": offer.title,
    "image": offer.imageUrl,
    "description": offer.description,
    "aggregateRating": producerRating > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": producerRating,
      "reviewCount": producerReviews.length > 0 ? producerReviews.length : 1
    } : undefined,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "XAF",
      "price": offer.price,
      "availability": offer.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": getProducerDisplayName()
      }
    }
  } : undefined;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO
        title={offer.title}
        description={offer.description}
        imageUrl={offer.imageUrl}
        type="product"
        url={`/offer/${offer.id}`}
        schema={productSchema}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors font-medium">
          <ArrowLeft className="h-5 w-5 mr-2" /> {t('product.back')}
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="md:flex">

            {/* Image Section */}
            <div className="md:w-1/2 h-96 md:h-auto relative bg-gray-200">
              <img
                src={offer.imageUrl}
                alt={offer.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
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

            {/* Details Section */}
            <div className="md:w-1/2 p-8 flex flex-col">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary-600 uppercase tracking-wide">{offer.category}</p>
                  <div className="flex gap-2 items-center">
                    {/* Fav Button */}
                    {(user?.role === UserRole.CLIENT || user?.role === UserRole.PRODUCER) && (
                      <button
                        onClick={() => toggleFavorite(offer.id)}
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

                    {isProducerMarket && offer.isNegotiable && !offer.reservedClientId && (
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

                <h1 className="text-3xl font-extrabold text-gray-900 mt-2 mb-4 leading-tight">{offer.title}</h1>

                <div className="flex items-baseline mb-6 pb-6 border-b border-gray-100">
                  <span className="text-4xl font-bold text-primary-600">{offer.price.toLocaleString()} XAF</span>
                  <span className="text-gray-500 ml-2 font-medium">/ {t(`unit.${offer.unit}`)}</span>
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
                      {availableSlots.length === 0 ? (
                        <div className="col-span-3 space-y-2 py-2">
                          <p className="text-sm text-gray-500 italic">No slots available for this date.</p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            For <strong>services</strong>, the seller must publish weekly hours in{' '}
                            <strong>Producer dashboard → Availability</strong>. Choose a day they work, pick a time, then press{' '}
                            <strong>Book Now</strong> (that adds the booking to your cart). Complete checkout from the{' '}
                            <Link to="/cart" className="text-primary-600 font-semibold underline">cart</Link>.
                          </p>
                        </div>
                      ) : (
                        availableSlots.map((slot) => {
                          const slotStr = slot.toISOString();
                          const displayTime = slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          const isSelected = selectedSlot === slotStr;
                          return (
                            <button
                              key={slotStr}
                              onClick={() => setSelectedSlot(slotStr)}
                              className={`py-2 px-1 text-xs font-bold rounded border ${isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'}`}
                            >
                              {displayTime}
                            </button>
                          )
                        })
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 flex items-center">
                      <Clock className="h-3 w-3 mr-1" /> Duration: {offer.serviceDuration} hours per slot
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
                  <div className="bg-primary-50 p-4 rounded-lg mb-6 border border-primary-100">
                    <h3 className="text-xs font-bold text-primary-800 uppercase tracking-wide mb-3">{t('product.soldBy')}</h3>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white border border-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg shadow-sm">
                        {(getProducerDisplayName() || 'U').charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/profile/producer/${producer.id}`} className="text-base font-bold text-gray-900 hover:text-primary-600 hover:underline">
                            {getProducerDisplayName()}
                          </Link>
                          {producerRating > 0 && (
                            <span className="flex items-center text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold">
                              <Star className="h-3 w-3 mr-0.5 fill-current" /> {producerRating}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-600 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {offer.offerLocation || producer.locations?.[0]?.address || 'Location not set'}
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
                        <img src="/apple-touch-icon.png" alt="ATI Logo" className="h-10 w-10 object-contain rounded-full" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-gray-900">
                            ATI Retail Store
                          </span>
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
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={handleAddToCart}
                  className="flex items-center justify-center bg-primary-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {offer.type === OfferType.SERVICE ? (
                    <>
                      <Calendar className="h-5 w-5 mr-3" /> {t('product.bookNow')}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-3" /> {t('product.addToCart')}
                    </>
                  )}
                  <span className="ml-2">- {(offer.price * quantity).toLocaleString()} XAF</span>
                </button>

                {isProducerMarket && !offer.reservedClientId && (
                  <button
                    onClick={handleNegotiate}
                    className="flex items-center justify-center bg-white text-primary-600 border-2 border-primary-600 px-6 py-3 rounded-xl font-bold hover:bg-primary-50 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Chat / {t('product.negotiate')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

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
                        <img
                          key={idx}
                          src={url}
                          alt={`Portfolio ${idx}`}
                          onClick={() => setActivePortfolioMedia(url)}
                          className="flex-shrink-0 w-64 h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS SECTION */}
        {isProducerMarket && producer && (
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center">
              <Star className="h-6 w-6 text-yellow-500 fill-current mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Producer Reviews</h2>
              <span className="ml-3 bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full font-medium">{producerReviews.length}</span>
            </div>

            <div className="p-6">
              {producerReviews.length === 0 ? (
                <p className="text-gray-500 italic text-center py-8">No reviews yet. Be the first to review this producer after a purchase!</p>
              ) : (
                <div className="space-y-6">
                  {producerReviews.map((review) => (
                    <div key={review.id} className="flex items-start space-x-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                          {/* We don't have reviewer name easily accessible here without looking up all clients, 
                                       so we use a generic icon or look up if needed. Keeping it simple for UI speed. */}
                          <User className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <span className="font-bold text-gray-900 mr-2">Verified Client</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-700">{review.comment}</p>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
};
