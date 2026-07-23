
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { Trash2, ArrowLeft, ShoppingBag, CheckCircle, Calendar, X, MapPin, Heart, Tag, ChevronLeft, ChevronRight, Truck, Home } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Spinner } from '../../components/Spinner';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Modal } from '../../components/Modal';
import { OfferType, MarketType, Location, PreferredHomeDeliverySnapshot } from '../../types';
import { LegalAcceptanceCheckbox } from '../../components/LegalAcceptanceCheckbox';
import { isProducerDashboardUser } from '../../services/producerSession';
import { addressTruncateClass, truncateAddress } from '../../utils/addressDisplay';

function pickDefaultHomeLocationIndex(
  locs: Location[],
  preferred: PreferredHomeDeliverySnapshot | null | undefined,
): number {
  if (!locs.length) return 0;
  if (preferred && (preferred.address || preferred.city || preferred.region)) {
    const a = String(preferred.address ?? '').trim().toLowerCase();
    const c = String(preferred.city ?? '').trim().toLowerCase();
    const r = String(preferred.region ?? '').trim().toLowerCase();
    const byFields = locs.findIndex(
      (l) =>
        l.address.trim().toLowerCase() === a &&
        l.city.trim().toLowerCase() === c &&
        l.region.trim().toLowerCase() === r,
    );
    if (byFields >= 0) return byFields;
  }
  if (preferred != null) {
    const plat = Number(preferred.lat);
    const plng = Number(preferred.lng);
    if (Number.isFinite(plat) && Number.isFinite(plng) && (plat !== 0 || plng !== 0)) {
      const TOL = 1e-4;
      const byCoords = locs.findIndex(
        (l) => Math.abs(l.lat - plat) < TOL && Math.abs(l.lng - plng) < TOL,
      );
      if (byCoords >= 0) return byCoords;
    }
  }
  let best = 0;
  let bestTs = -1;
  locs.forEach((l, i) => {
    const ts = l.lastUsedForOrderAt ? new Date(l.lastUsedForOrderAt).getTime() : 0;
    if (ts > bestTs) {
      bestTs = ts;
      best = i;
    }
  });
  return best;
}
import { loadGooglePlacesApi, parseGooglePlace, citiesLooselyMatch } from '../../services/googlePlaces';
import { offerImageInBox } from '../../utils/offerImageDisplay';
import { cartHasService } from '../../utils/orderLabels';
import { showAppToast } from '../../services/appToast';
import { useFormik } from 'formik';
import { z } from 'zod';
import { useCurrency } from '../../contexts/CurrencyContext';

export const ShoppingCart: React.FC = () => {
  const { cart, removeFromCart, placeOrder, user, clearCart, clients, producers, moveToFavorites, validateCoupon, pickupPoints, guestEmail, setGuestEmail, refreshOffers, refreshProducers, refreshPickupPoints, refreshCart, refreshClients } = useStore();
  const { t } = useTranslation();
  const { formatXaf } = useCurrency();

  // Cart page hydrates everything it actually renders: offers (item details),
  // producers (delivery options), pickup points (PICKUP method), clients
  // (saved home addresses), and the server-side cart. React Query dedupes
  // within `staleTime` so repeat visits don't refire requests.
  useEffect(() => {
    void refreshOffers();
    void refreshProducers();
    void refreshPickupPoints();
    if (user) {
      void refreshClients();
      void refreshCart();
    }
  }, [user?.id]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showRecap, setShowRecap] = useState(false);
  const [showGuestEmailModal, setShowGuestEmailModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{ id: string; title?: string } | null>(null);
  const guestEmailSchema = z.object({
    tempEmail: z.string().trim().email('Please enter a valid email address.'),
  });

  const guestEmailFormik = useFormik({
    initialValues: { tempEmail: '' },
    validate: (values) => {
      const parsed = guestEmailSchema.safeParse(values);
      if (parsed.success) return {};
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      return nextErrors;
    },
    onSubmit: (values) => {
      setGuestEmail(values.tempEmail.trim());
      setShowGuestEmailModal(false);
      showAppToast(t('cart.loginRequired'), 'INFO');
      navigate('/login');
    },
  });


  // Coupon State (discount from POST /api/coupons/validate; order sends coupon UUID)
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);

  // Delivery Date State (ATI Only)
  const [deliveryDate, setDeliveryDate] = useState('');
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Delivery Method State
  const [deliveryMethod, setDeliveryMethod] = useState<'HOME' | 'PICKUP'>('HOME');
  const [selectedPickupCity, setSelectedPickupCity] = useState(''); // Only for Producer Market flow flexibility
  const [selectedPickupPointId, setSelectedPickupPointId] = useState('');
  const [selectedHomeLocationIndex, setSelectedHomeLocationIndex] = useState(0);
  const [pickupCitySearch, setPickupCitySearch] = useState('');
  const [pickupPlacesStatus, setPickupPlacesStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const pickupCityInputRef = useRef<HTMLInputElement | null>(null);
  const checkoutSectionRef = useRef<HTMLElement | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  // ATI retail store = 4% service fee; producer marketplace = 16.5% buyer commission.
  // Kept in sync with API create-order use-case (order-amounts.util.ts FEE_RATES).
  const cartIsAti = cart.length > 0 && cart[0].marketType === MarketType.ATI;
  const serviceFeeRate = cartIsAti ? 0.04 : 0.165;
  const serviceFee = subtotal * serviceFeeRate;
  const totalAmount = Math.max(0, subtotal + serviceFee - discountAmount);
  const isServiceCart = cartHasService(cart);

  const currentClient = user
    ? clients.find(c => c.userId === user.id || c.id === user.id)
    : null;
  const currentProducer = user
    ? producers.find(p => p.userId === user.id || p.id === user.producerId)
    : null;

  const homeLocations =
    currentClient?.locations?.length
      ? currentClient.locations
      : (isProducerDashboardUser(user) ? (currentProducer?.locations ?? []) : []);
  const selectedHomeLocation = homeLocations[selectedHomeLocationIndex] ?? homeLocations[0];

  const preferredHomeDelivery =
    currentClient?.preferredHomeDelivery ?? currentProducer?.preferredHomeDelivery ?? null;
  const homeLocationsStabilityKey = homeLocations
    .map((l) => `${l.id ?? 'noid'}|${l.lastUsedForOrderAt ?? ''}|${l.address.slice(0, 48)}`)
    .join('>');
  const preferredKey = preferredHomeDelivery
    ? `${preferredHomeDelivery.address}|${preferredHomeDelivery.city}|${preferredHomeDelivery.region}`
    : '';

  useEffect(() => {
    if (deliveryMethod !== 'HOME' || homeLocations.length === 0) return;
    setSelectedHomeLocationIndex(pickDefaultHomeLocationIndex(homeLocations, preferredHomeDelivery));
  }, [homeLocationsStabilityKey, preferredKey, deliveryMethod, homeLocations.length]);

  // Check if order contains ATI items
  const isAtiOrder = cart.length > 0 && cart[0].marketType === MarketType.ATI;

  // Client City from Profile
  const clientCity = selectedHomeLocation?.city || '';

  // Location Validation for ATI
  // Rule: ATI delivers to cities where they operate. AND pickup must be in same city as User.

  // Effect: When switching to Pickup for ATI, ensure city matches
  useEffect(() => {
    if (isAtiOrder && deliveryMethod === 'PICKUP' && clientCity) {
      setSelectedPickupCity(clientCity);
      setPickupCitySearch(clientCity);
    } else if (!isAtiOrder && clientCity && !selectedPickupCity) {
      setSelectedPickupCity(clientCity);
      setPickupCitySearch(clientCity);
    }
  }, [deliveryMethod, isAtiOrder, clientCity, selectedPickupCity]);

  useEffect(() => {
    if (selectedHomeLocationIndex >= homeLocations.length) {
      setSelectedHomeLocationIndex(0);
    }
  }, [homeLocations.length, selectedHomeLocationIndex]);

  const fromServiceBooking = searchParams.get('booking') === '1';

  useEffect(() => {
    if (!fromServiceBooking || cart.length === 0) return;
    const frame = requestAnimationFrame(() => {
      checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [fromServiceBooking, cart.length]);

  // Google Places autocomplete for producer-market pickup city (when API key present)
  useEffect(() => {
    if (deliveryMethod !== 'PICKUP' || isAtiOrder) {
      setPickupPlacesStatus('idle');
      return;
    }
    let canceled = false;
    const w = window as unknown as { google?: { maps?: { places?: { Autocomplete: new (el: HTMLInputElement, opts: object) => unknown }; event?: { clearInstanceListeners: (x: unknown) => void } } } };
    let autocomplete: unknown = null;
    const input = pickupCityInputRef.current;

    const run = async () => {
      setPickupPlacesStatus('loading');
      const ok = await loadGooglePlacesApi();
      if (canceled) return;
      if (!ok || !input) {
        setPickupPlacesStatus('unavailable');
        return;
      }
      if (!w.google?.maps?.places?.Autocomplete) {
        setPickupPlacesStatus('unavailable');
        return;
      }
      setPickupPlacesStatus('ready');
      autocomplete = new w.google.maps.places.Autocomplete(input, {
        fields: ['formatted_address', 'geometry', 'address_components', 'name'],
        types: ['geocode'],
      });
      (autocomplete as { addListener: (ev: string, fn: () => void) => void }).addListener('place_changed', () => {
        const place = (autocomplete as { getPlace: () => unknown }).getPlace();
        const parsed = parseGooglePlace(place);
        if (!parsed) return;
        const city = (parsed.city || parsed.region || '').trim() || parsed.address.split(',')[0]?.trim() || '';
        setPickupCitySearch(parsed.address || city);
        setSelectedPickupCity(city || parsed.address);
        setSelectedPickupPointId('');
      });
    };

    void run();
    return () => {
      canceled = true;
      if (autocomplete && w.google?.maps?.event) {
        w.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [deliveryMethod, isAtiOrder]);

  const syncPickupCityFromTypedSearch = () => {
    const q = pickupCitySearch.trim();
    if (!q) return;
    const hit = pickupPoints.find(
      (p) => citiesLooselyMatch(p.city, q) || citiesLooselyMatch(p.region, q),
    );
    if (hit) {
      setSelectedPickupCity(hit.city);
      setPickupCitySearch(hit.city);
      setSelectedPickupPointId('');
    }
  };

  // Filter pickup points by city (tolerant match vs Places / profile spelling)
  const availablePickupPoints = pickupPoints
    .filter((p) => selectedPickupCity && citiesLooselyMatch(p.city, selectedPickupCity))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Validation Flags
  const isHomeAddressValid = !!selectedHomeLocation;
  const isPickupValid = deliveryMethod === 'PICKUP' && !!selectedPickupPointId;
  const isDeliveryMethodValid = deliveryMethod === 'HOME' ? isHomeAddressValid : isPickupValid;

  // ATI Specific Validation: If ATI order, Date is required.
  const isAtiDateValid = !isAtiOrder || !!deliveryDate;

  // Global Valid Check
  const canPlaceOrder = isDeliveryMethodValid && isAtiDateValid;

  // Date Logic for Calendar
  const minDateObj = new Date();
  minDateObj.setDate(minDateObj.getDate() + 3); // Earliest delivery = today + 3 days (no same/next-day delivery yet)
  minDateObj.setHours(0, 0, 0, 0);

  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 30); // Next 30 days
  maxDateObj.setHours(23, 59, 59, 999);

  const isDateDisabled = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < minDateObj || d > maxDateObj;
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(calendarViewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCalendarViewDate(newDate);
  };

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Email Deep Link Handling
  useEffect(() => {
    if (searchParams.get('returnCart') === 'true') {
      // Logic could automatically highlight cart or show a specific success message.
      // Already on page, no further action strictly needed besides routing landing here.
    }
  }, [searchParams]);

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;

    setCouponApplying(true);
    try {
      const result = await validateCoupon(couponCode, subtotal, 'MARKETPLACE');
      if (result.discountAmount > 0 && result.couponId) {
        setDiscountAmount(result.discountAmount);
        setAppliedCoupon(couponCode.trim());
        setAppliedCouponId(result.couponId);
      } else {
        setDiscountAmount(0);
        setAppliedCoupon(null);
        setAppliedCouponId(null);
        setCouponError(result.errorMessage || 'Invalid coupon code or minimum order not met.');
      }
    } finally {
      setCouponApplying(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setAppliedCouponId(null);
    setDiscountAmount(0);
    setCouponError('');
  };

  const handleInitialPlaceOrder = () => {
    if (!user && !guestEmail) {
      setShowGuestEmailModal(true);
      return;
    }

    if (!user) {
      showAppToast(t('auth.pleaseLogin'), 'WARNING');
      navigate('/login');
      return;
    }

    if (!legalAccepted) {
      showAppToast(t('legal.mustAccept'), 'WARNING');
      return;
    }

    if (!canPlaceOrder) {
      if (!isDeliveryMethodValid) showAppToast('Please select a valid delivery method and address/pickup point.', 'WARNING');
      else if (!isAtiDateValid) showAppToast('Please select a delivery date.', 'WARNING');
      return;
    }

    // Additional Check for ATI Pickup Rule
    if (isAtiOrder && deliveryMethod === 'PICKUP') {
      const point = pickupPoints.find(p => p.id === selectedPickupPointId);
      if (point && !citiesLooselyMatch(point.city, clientCity)) {
        showAppToast(`ATI Store policy: Pickup must be in your registered city (${clientCity}).`, 'WARNING');
        return;
      }
    }

    setShowRecap(true);
  };

  const confirmPlacement = async () => {
    setOrderPlacing(true);
    try {
      const ok = await placeOrder(
        appliedCouponId || undefined,
        discountAmount,
        isAtiOrder ? deliveryDate : undefined,
        deliveryMethod,
        selectedPickupPointId,
        deliveryMethod === 'HOME' ? selectedHomeLocation?.id : undefined,
        deliveryMethod === 'HOME' && selectedHomeLocation
          ? {
              address: selectedHomeLocation.address,
              city: selectedHomeLocation.city,
              region: selectedHomeLocation.region,
              lat: selectedHomeLocation.lat,
              lng: selectedHomeLocation.lng,
            }
          : undefined,
      );
      if (ok) {
        setShowRecap(false);
        navigate('/');
      }
    } finally {
      setOrderPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center agm-empty-wash px-4">
        <div className="bg-white/90 p-8 rounded-xl shadow-lg text-center max-w-md w-full border border-primary-100">
          <ShoppingBag className="h-16 w-16 text-primary-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h2>
          <p className="text-gray-500 mb-6">{t('cart.emptyDesc')}</p>
          <div className="flex flex-col gap-3">
            <Link to="/market/producers" className="agm-btn-primary inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 w-full">
              {t('cart.start')}
            </Link>
            <Link to="/market/ati" className="agm-btn-secondary inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full">
              {t('cart.browseAti')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO title="Shopping Cart" noindex={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center flex-wrap gap-2">
            <ShoppingBag className="h-7 w-7 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-primary-600" />
            {t('cart.title')}
            {cartHasService(cart) && (
              <span className="text-xs sm:text-sm font-bold bg-purple-100 text-purple-800 px-2 py-1 rounded-full">{t('service.badge')}</span>
            )}
          </h1>
          {cartHasService(cart) && (
            <p className="text-sm text-gray-600 mt-2 ml-9 sm:ml-11">{t('cart.includesServices')}</p>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">

          {/* Cart Items */}
          <section className="lg:col-span-7">
            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {isAtiOrder ? t('cart.atiOrderLabel') : t('cart.producerOrderLabel')}
                </span>
                <button onClick={clearCart} className="text-xs text-red-600 hover:underline">
                  {t('cart.clear')}
                </button>
              </div>
              <ul className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <li
                    key={item.id}
                    className={`p-4 sm:p-6 flex gap-3 sm:gap-4 ${item.type === OfferType.SERVICE ? 'bg-purple-50/40 border-l-4 border-l-purple-300' : ''}`}
                  >
                    <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 border border-gray-200 bg-gray-100 rounded-md overflow-hidden relative">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className={offerImageInBox}
                      />
                      {item.type === OfferType.SERVICE && (
                        <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-[10px] text-center py-1 font-bold">
                          {t('service.badge').toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div>
                        <div className="flex justify-between gap-3 text-sm sm:text-base font-medium text-gray-900">
                          <h3 className="min-w-0 break-words">
                            <Link to={`/offer/${item.id}`} className="hover:text-primary-600 line-clamp-2 sm:line-clamp-none">{item.title}</Link>
                          </h3>
                          <p className="whitespace-nowrap flex-shrink-0">{formatXaf(item.price * item.cartQuantity)}</p>
                        </div>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500">{item.category}</p>

                        {/* Display Booking Date for Services */}
                        {item.bookingDate && (
                          <div className="mt-2 flex items-start flex-wrap gap-1 text-xs sm:text-sm text-purple-800 bg-purple-100 border border-purple-200 px-2 py-1 rounded max-w-full">
                            <Calendar className="h-3 w-3 mr-1 shrink-0 mt-0.5" />
                            <span className="font-medium">{t('service.appointment')}:</span>
                            <span>
                              {new Date(item.bookingDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                        )}
                        {item.type === OfferType.SERVICE && item.serviceDuration != null && item.serviceDuration > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {t('product.totalDuration', { quantity: item.cartQuantity, duration: item.serviceDuration, total: item.cartQuantity * item.serviceDuration })}
                          </p>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-end sm:justify-between text-xs sm:text-sm mt-3 gap-2">
                        <p className="text-gray-500">
                          {item.type === OfferType.SERVICE ? (
                            <>
                              {t('service.bookedQty')}: {item.cartQuantity} {t(`unit.${item.unit}`)}
                            </>
                          ) : (
                            <>
                              {t('form.quantity')} {item.cartQuantity} {item.unit}
                            </>
                          )}
                        </p>

                        <div className="flex flex-wrap gap-3 sm:gap-4">
                          <button
                            type="button"
                            onClick={() => moveToFavorites(item.id)}
                            className="font-medium text-primary-600 hover:text-primary-500 flex items-center"
                          >
                            <Heart className="h-4 w-4 mr-1" /> {t('cart.saveForLater')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToRemove({ id: item.id, title: item.title })}
                            className="font-medium text-red-600 hover:text-red-500 flex items-center"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> {t('cart.remove')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Order Summary & Logistics */}
          <section
            ref={checkoutSectionRef}
            id="agm-cart-checkout"
            className="lg:col-span-5 mt-8 lg:mt-0 space-y-4 sm:space-y-6"
          >
            {fromServiceBooking && cart.some((i) => i.type === OfferType.SERVICE) && (
              <div
                className="bg-primary-50 border border-primary-200 text-primary-900 text-sm rounded-lg px-4 py-3"
                role="status"
              >
                {t('cart.bookingCheckoutHint')}
              </div>
            )}

            {/* Delivery Method Selection */}
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-gray-500" /> {isServiceCart ? t('service.fulfillment') : t('cart.deliveryMethod')}
              </h2>

              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setDeliveryMethod('HOME')}
                  className={`flex-1 py-3 px-2 border rounded-md flex flex-col items-center justify-center text-sm font-medium transition-colors ${deliveryMethod === 'HOME' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Home className="h-5 w-5 mb-1" />
                  {isServiceCart ? t('service.atClientLocation') : t('cart.homeDelivery')}
                </button>
                <button
                  onClick={() => setDeliveryMethod('PICKUP')}
                  className={`flex-1 py-3 px-2 border rounded-md flex flex-col items-center justify-center text-sm font-medium transition-colors ${deliveryMethod === 'PICKUP' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  <MapPin className="h-5 w-5 mb-1" />
                  {isServiceCart ? t('service.atServicePoint') : t('cart.pickupStationLabel')}
                </button>
              </div>

              {deliveryMethod === 'HOME' && (
                <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                  <p className="font-bold text-gray-700 mb-1">{isServiceCart ? `${t('service.locationInfo')}:` : t('cart.deliveringTo')}</p>
                  {isHomeAddressValid ? (
                    <>
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('cart.selectSavedAddress')}</label>
                        <select
                          value={selectedHomeLocationIndex}
                          onChange={(e) => setSelectedHomeLocationIndex(Number(e.target.value))}
                          className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
                        >
                          {homeLocations.map((loc, idx) => (
                            <option key={loc.id ?? `${loc.address}-${idx}`} value={idx}>
                              {truncateAddress(loc.address)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className={`text-gray-900 ${addressTruncateClass}`} title={selectedHomeLocation?.address}>
                        {selectedHomeLocation?.address}
                      </p>
                      <p className="text-gray-500">{selectedHomeLocation?.city}, {selectedHomeLocation?.region}</p>
                    </>
                  ) : (
                    <p className="text-red-500">
                      {t('cart.noAddressInProfile')}.{" "}
                      <Link
                        to={isProducerDashboardUser(user) ? '/producer/profile' : '/client/profile'}
                        className="underline font-medium text-red-600 hover:text-red-700"
                      >
                        {t('cart.setAddressNow')}
                      </Link>
                    </p>
                  )}
                </div>
              )}

              {deliveryMethod === 'PICKUP' && (
                <div className="space-y-3">
                  <div>
                    {isAtiOrder ? (
                      <>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('cart.pickupProfileCity')}</label>
                        <input
                          type="text"
                          disabled
                          value={clientCity || t('cart.pickupNoProfileCity')}
                          className="block w-full border border-gray-200 bg-gray-100 rounded-md p-2 text-sm text-gray-600 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('cart.pickupProfileCityHint')}</p>
                      </>
                    ) : (
                      <>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('cart.pickupSearchCity')}</label>
                        {pickupPlacesStatus === 'unavailable' ? (
                          <>
                            <p className="text-xs text-amber-700 mb-1">{t('cart.pickupPlacesFallback')}</p>
                            <select
                              value={selectedPickupCity}
                              onChange={(e) => {
                                const v = e.target.value;
                                setSelectedPickupCity(v);
                                setPickupCitySearch(v);
                                setSelectedPickupPointId('');
                              }}
                              className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
                            >
                              <option value="">--</option>
                              {[...new Set(pickupPoints.map((p) => p.city))].sort().map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </>
                        ) : (
                          <>
                            <input
                              ref={pickupCityInputRef}
                              type="text"
                              value={pickupCitySearch}
                              onChange={(e) => setPickupCitySearch(e.target.value)}
                              onBlur={() => syncPickupCityFromTypedSearch()}
                              placeholder={t('cart.pickupSearchPlaceholder')}
                              autoComplete="off"
                              className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900 placeholder:text-gray-400"
                            />
                            {pickupPlacesStatus === 'loading' && (
                              <p className="text-xs text-gray-500 mt-1">{t('cart.pickupPlacesLoading')}</p>
                            )}
                            {pickupPlacesStatus === 'ready' && (
                              <p className="text-xs text-gray-500 mt-1">{t('cart.pickupPlacesReadyHint')}</p>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('cart.pickupStation')}</label>
                    <select
                      value={selectedPickupPointId}
                      onChange={(e) => setSelectedPickupPointId(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
                      disabled={availablePickupPoints.length === 0}
                    >
                      <option value="">--</option>
                      {availablePickupPoints.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} — {truncateAddress(p.address, 40)}, {p.city}</option>
                      ))}
                    </select>
                    {selectedPickupCity && availablePickupPoints.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">{t('cart.pickupNoPointsHint')}</p>
                    )}
                    {(() => {
                      const sel = availablePickupPoints.find((p) => p.id === selectedPickupPointId);
                      return sel?.image ? (
                        <img
                          src={sel.image}
                          alt={sel.name}
                          className="mt-2 w-full h-32 object-cover rounded-md border border-gray-200"
                          loading="lazy"
                        />
                      ) : null;
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">{t('cart.summary')}</h2>

              {/* ATI Specific Logic: Delivery Date */}
              {isAtiOrder && (
                <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" /> {t('cart.retailDeliveryDate')}
                  </h3>

                  {/* Date Picker (Popup Calendar Trigger) */}
                  <div className="relative" ref={calendarRef}>
                    <label className="block text-xs font-bold text-blue-800 mb-1">{t('cart.selectDate')}</label>

                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className={`w-full flex items-center justify-between bg-white border border-gray-300 text-gray-900 sm:text-sm rounded-md shadow-sm p-2 text-left focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400`}
                    >
                      <span className={deliveryDate ? 'font-medium' : 'text-gray-500'}>
                        {deliveryDate
                          ? new Date(`${deliveryDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                          : t('cart.selectDatePlaceholder')}
                      </span>
                      <Calendar className={`h-5 w-5 text-blue-600`} />
                    </button>

                    {isCalendarOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-blue-200 p-3 shadow-xl animate-fade-in">
                        <div className="flex justify-between items-center mb-3">
                          <button onClick={() => changeMonth(-1)} type="button" className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-bold text-gray-800 capitalize">
                            {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </span>
                          <button onClick={() => changeMonth(1)} type="button" className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} className="text-[10px] font-bold text-gray-400 uppercase">{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {(() => {
                            const year = calendarViewDate.getFullYear();
                            const month = calendarViewDate.getMonth();
                            const firstDay = new Date(year, month, 1).getDay();
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            const days = [];

                            for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);

                            for (let d = 1; d <= daysInMonth; d++) {
                              const current = new Date(year, month, d);
                              const safeDateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;

                              const disabled = isDateDisabled(current);
                              const selected = deliveryDate === safeDateStr;

                              days.push(
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    if (!disabled) {
                                      setDeliveryDate(safeDateStr);
                                      setIsCalendarOpen(false); // Close on selection
                                    }
                                  }}
                                  disabled={disabled}
                                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200
                                                       ${selected ? 'bg-blue-600 text-white shadow-md font-bold' : ''}
                                                       ${!selected && !disabled ? 'hover:bg-blue-50 text-gray-700 hover:text-blue-600 hover:font-bold' : ''}
                                                       ${disabled ? 'text-gray-300 cursor-not-allowed' : ''}
                                                   `}
                                >
                                  {d}
                                </button>
                              );
                            }
                            return days;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flow-root">
                <dl className="-my-4 text-sm divide-y divide-gray-200">
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-gray-600">{t('cart.subtotal')}</dt>
                    <dd className="font-medium text-gray-900">{formatXaf(subtotal)}</dd>
                  </div>
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-gray-600">{t(cartIsAti ? 'cart.serviceFeeRetail' : 'cart.serviceFee')}</dt>
                    <dd className="font-medium text-gray-900">{formatXaf(serviceFee)}</dd>
                  </div>

                  {/* Coupon Section */}
                  <div className="py-4">
                    {!appliedCoupon ? (
                      <div>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder={t('cart.couponPlaceholder')}
                            className="flex-1 border border-gray-300 rounded-md p-2 text-sm uppercase"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          />
                          <button
                            type="button"
                            onClick={() => void handleApplyCoupon()}
                            disabled={couponApplying}
                            className="bg-gray-800 text-white px-3 py-2 rounded-md text-xs font-bold hover:bg-gray-700 disabled:opacity-60"
                          >
                            {couponApplying ? '…' : t('cart.couponApply')}
                          </button>
                        </div>
                        {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-green-50 p-2 rounded border border-green-200">
                        <span className="flex items-center text-green-700 font-medium">
                          <Tag className="h-4 w-4 mr-1" /> {appliedCoupon}
                        </span>
                        <div className="flex items-center">
                          <span className="text-green-700 font-bold mr-2">- {formatXaf(discountAmount)}</span>
                          <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="py-4 flex items-center justify-between border-t border-gray-200">
                    <dt className="text-base font-bold text-gray-900">{t('cart.total')}</dt>
                    <dd className="text-base font-bold text-primary-600">{formatXaf(totalAmount)}</dd>
                  </div>
                </dl>
              </div>

              <LegalAcceptanceCheckbox
                id="checkout-legal"
                checked={legalAccepted}
                onChange={setLegalAccepted}
                variant="prominent"
                className="mt-4"
              />

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => void handleInitialPlaceOrder()}
                  disabled={!canPlaceOrder || !legalAccepted}
                  className="agm-btn-primary w-full bg-primary-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {t('cart.placeOrder')}
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link to="/" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center justify-center">
                  <ArrowLeft className="h-4 w-4 mr-1" /> {t('cart.continue')}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Recap Modal */}
      <Modal open={showRecap} onClose={() => setShowRecap(false)} maxWidth="lg" zIndex={50} panelClassName="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900">{t('cart.recap')}</h3>
                <button onClick={() => setShowRecap(false)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">{t('dash.items')}</h4>
                  <ul className="space-y-1 border-b border-gray-300 pb-2 mb-2">
                    {cart.map(item => (
                      <li key={item.id} className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-800">{item.cartQuantity}x {item.title}</span>
                          <span className="font-medium">{formatXaf(item.price * item.cartQuantity)}</span>
                        </div>
                        {item.type === OfferType.SERVICE && (
                          <div className="mt-1 text-xs text-gray-600">
                            {item.bookingDate ? (
                              <p>
                                <span className="font-semibold">{t('service.appointment')}:</span>{' '}
                                {new Date(item.bookingDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            ) : (
                              <p className="text-amber-700">
                                <span className="font-semibold">{t('service.appointment')}:</span> {t('product.notSelected')}
                              </p>
                            )}
                            {item.serviceDuration != null && item.serviceDuration > 0 && (
                              <p>
                                <span className="font-semibold">{t('product.totalDuration', { quantity: item.cartQuantity, duration: item.serviceDuration, total: item.cartQuantity * item.serviceDuration })}</span>
                              </p>
                            )}
                            <p>
                              <span className="font-semibold">{t('service.bookedQty')}:</span> {item.cartQuantity} {t(`unit.${item.unit}`)}
                            </p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Subtotal</span>
                    <span>{formatXaf(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{t(cartIsAti ? 'cart.serviceFeeRetail' : 'cart.serviceFee')}</span>
                    <span>{formatXaf(serviceFee)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600 mb-1 font-bold">
                      <span>{t('cart.discountLabel')} ({appliedCoupon})</span>
                      <span>- {formatXaf(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-2 pt-2 border-t border-gray-200 font-bold text-gray-900 text-lg">
                    <span>{t('cart.total')}</span>
                    <span className="text-primary-600">{formatXaf(totalAmount)}</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center">
                    <Truck className="h-3 w-3 mr-1" /> {isServiceCart ? t('service.locationInfo') : t('cart.deliveryInfo')}
                  </h4>

                  {deliveryMethod === 'HOME' ? (
                    <p className="text-sm text-blue-900">
                      <span className="font-bold">{isServiceCart ? t('service.atClientLocation') : t('cart.homeDelivery')}:</span><br />
                      <span
                        className={`inline-block ${addressTruncateClass}`}
                        title={`${selectedHomeLocation?.address ?? ''}, ${selectedHomeLocation?.city ?? ''}`}
                      >
                        {selectedHomeLocation?.address}, {selectedHomeLocation?.city}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-blue-900">
                      <span className="font-bold">{isServiceCart ? t('service.atServicePoint') : t('cart.pickupStation')}:</span><br />
                      {pickupPoints.find(p => p.id === selectedPickupPointId)?.name}<br />
                      <span
                        className={`text-xs opacity-75 inline-block ${addressTruncateClass}`}
                        title={pickupPoints.find(p => p.id === selectedPickupPointId)?.address}
                      >
                        {pickupPoints.find(p => p.id === selectedPickupPointId)?.address}
                      </span>
                    </p>
                  )}

                  {isAtiOrder && deliveryDate && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <h4 className="text-xs font-bold text-blue-800 uppercase mb-1 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" /> {t('cart.deliveryDate')}
                      </h4>
                      <p className="text-sm text-blue-900 font-medium">
                        {new Date(`${deliveryDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={orderPlacing}
                  onClick={() => setShowRecap(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50"
                >
                  {t('form.cancel')}
                </button>
                <button
                  type="button"
                  disabled={orderPlacing}
                  onClick={() => void confirmPlacement()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-bold hover:bg-primary-700 disabled:opacity-60 inline-flex items-center justify-center gap-2 min-w-[8rem]"
                >
                  {orderPlacing && <Spinner className="h-4 w-4" label="Submitting order" />}
                  {orderPlacing ? t('wallet.processing') : t('cart.validate')}
                </button>
              </div>
      </Modal>

      {/* Guest Email Modal */}
      <Modal open={showGuestEmailModal} onClose={() => setShowGuestEmailModal(false)} maxWidth="md" zIndex={50} panelClassName="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">{t('cart.guestCheckoutTitle')}</h3>
                <button onClick={() => setShowGuestEmailModal(false)}>
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">{t('cart.guestCheckoutDesc')}</p>
              <form onSubmit={guestEmailFormik.handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="tempEmail" className="block text-sm font-medium text-gray-700">{t('guest.emailLabel')}</label>
                  <input
                    type="email"
                    id="tempEmail"
                    name="tempEmail"
                    required
                    value={guestEmailFormik.values.tempEmail}
                    onChange={guestEmailFormik.handleChange}
                    onBlur={guestEmailFormik.handleBlur}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="you@example.com"
                  />
                  {guestEmailFormik.touched.tempEmail && guestEmailFormik.errors.tempEmail ? <p className="text-xs text-red-600 mt-1">{guestEmailFormik.errors.tempEmail}</p> : null}
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowGuestEmailModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">{t('cart.guestCancel')}</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-bold hover:bg-primary-700">{t('cart.guestContinue')}</button>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-500">{t('cart.guestAccountAlready')} <Link to="/login" className="text-primary-600 font-medium hover:underline">{t('cart.guestLoginLink')}</Link></p>
                </div>
              </form>
      </Modal>

      <ConfirmModal
        open={itemToRemove !== null}
        tone="danger"
        title={t('cart.confirmRemoveTitle')}
        description={itemToRemove?.title ? <><span className="font-medium text-gray-900">{itemToRemove.title}</span> — {t('cart.confirmRemoveBody')}</> : t('cart.confirmRemoveBody')}
        confirmLabel={t('cart.remove')}
        onClose={() => setItemToRemove(null)}
        onConfirm={() => {
          if (!itemToRemove) return;
          removeFromCart(itemToRemove.id);
          setItemToRemove(null);
        }}
      />
    </div>
  );
};
