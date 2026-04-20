
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { Trash2, ArrowLeft, ShoppingBag, CheckCircle, Calendar, X, MapPin, Heart, Tag, ChevronLeft, ChevronRight, Truck, Home } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { OfferType, MarketType, UserRole } from '../../types';

export const ShoppingCart: React.FC = () => {
  const { cart, removeFromCart, placeOrder, user, clearCart, clients, producers, moveToFavorites, validateCoupon, pickupPoints, guestEmail, setGuestEmail } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showRecap, setShowRecap] = useState(false);
  const [showGuestEmailModal, setShowGuestEmailModal] = useState(false);
  const [tempEmail, setTempEmail] = useState('');

  // Coupon State (discount from POST /api/coupons/validate; order sends coupon UUID)
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);

  // Delivery Date State (ATI Only)
  const [deliveryDate, setDeliveryDate] = useState('');
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Delivery Method State
  const [deliveryMethod, setDeliveryMethod] = useState<'HOME' | 'PICKUP'>('HOME');
  const [selectedPickupCity, setSelectedPickupCity] = useState(''); // Only for Producer Market flow flexibility
  const [selectedPickupPointId, setSelectedPickupPointId] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const serviceFee = subtotal * 0.05;
  const totalAmount = Math.max(0, subtotal + serviceFee - discountAmount);

  const currentClient = user
    ? clients.find(c => c.userId === user.id || c.id === user.id)
    : null;
  const currentProducer = user
    ? producers.find(p => p.userId === user.id || p.id === user.producerId)
    : null;

  /** Buyer profile location, or producer operating location as fallback for producers. */
  const primaryHomeLocation =
    currentClient?.locations?.[0] ??
    (user?.role === UserRole.PRODUCER ? currentProducer?.locations?.[0] : undefined);

  // Check if order contains ATI items
  const isAtiOrder = cart.length > 0 && cart[0].marketType === MarketType.ATI;

  // Client City from Profile
  const clientCity = primaryHomeLocation?.city || '';

  // Location Validation for ATI
  // Rule: ATI delivers to cities where they operate. AND pickup must be in same city as User.

  // Effect: When switching to Pickup for ATI, ensure city matches
  useEffect(() => {
    if (isAtiOrder && deliveryMethod === 'PICKUP' && clientCity) {
      setSelectedPickupCity(clientCity);
    } else if (!isAtiOrder && clientCity && !selectedPickupCity) {
      // For producer market, default to client city for convenience but allow change if logic permits
      setSelectedPickupCity(clientCity);
    }
  }, [deliveryMethod, isAtiOrder, clientCity]);

  // Filter Pickup Points based on selected city
  const availablePickupPoints = pickupPoints.filter(p => p.city === selectedPickupCity);

  // Validation Flags
  const isHomeAddressValid = !!primaryHomeLocation;
  const isPickupValid = deliveryMethod === 'PICKUP' && !!selectedPickupPointId;
  const isDeliveryMethodValid = deliveryMethod === 'HOME' ? isHomeAddressValid : isPickupValid;

  // ATI Specific Validation: If ATI order, Date is required.
  const isAtiDateValid = !isAtiOrder || !!deliveryDate;

  // Global Valid Check
  const canPlaceOrder = isDeliveryMethodValid && isAtiDateValid;

  // Date Logic for Calendar
  const minDateObj = new Date();
  minDateObj.setDate(minDateObj.getDate() + 1); // Tomorrow
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
      alert("For security reasons, please log in or create an account to finalize your purchase.");
      navigate('/login');
      return;
    }

    if (!canPlaceOrder) {
      if (!isDeliveryMethodValid) alert("Please select a valid delivery method and address/pickup point.");
      else if (!isAtiDateValid) alert("Please select a delivery date.");
      return;
    }

    // Additional Check for ATI Pickup Rule
    if (isAtiOrder && deliveryMethod === 'PICKUP') {
      const point = pickupPoints.find(p => p.id === selectedPickupPointId);
      if (point && point.city !== clientCity) {
        alert(`ATI Store policy: Pickup must be in your registered city (${clientCity}).`);
        return;
      }
    }

    setShowRecap(true);
  };

  const confirmPlacement = () => {
    placeOrder(appliedCouponId || undefined, discountAmount, isAtiOrder ? deliveryDate : undefined, deliveryMethod, selectedPickupPointId);
    setShowRecap(false);
    navigate('/');
  };

  const handleGuestEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempEmail.includes('@')) {
      setGuestEmail(tempEmail);
      setShowGuestEmailModal(false);

      alert(t('cart.loginRequired'));
      navigate('/login');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h2>
          <p className="text-gray-500 mb-6">{t('cart.emptyDesc')}</p>
          <Link to="/market/producers" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 w-full">
            {t('cart.start')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO title="Shopping Cart" noindex={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center">
          <ShoppingBag className="h-8 w-8 mr-3 text-primary-600" />
          {t('cart.title')}
        </h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">

          {/* Cart Items */}
          <section className="lg:col-span-7">
            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {isAtiOrder ? 'ATI Retail Store Order' : 'Producer Market Order'}
                </span>
                <button onClick={clearCart} className="text-xs text-red-600 hover:underline">
                  {t('cart.clear')}
                </button>
              </div>
              <ul className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <li key={item.id} className="p-6 flex">
                    <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden relative">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-center object-cover"
                      />
                      {item.type === OfferType.SERVICE && (
                        <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-[10px] text-center py-1 font-bold">SERVICE</div>
                      )}
                    </div>

                    <div className="ml-4 flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>
                            <Link to={`/offer/${item.id}`}>{item.title}</Link>
                          </h3>
                          <p className="ml-4">{(item.price * item.cartQuantity).toLocaleString()} XAF</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{item.category}</p>

                        {/* Display Booking Date for Services */}
                        {item.bookingDate && (
                          <div className="mt-2 flex items-center text-sm text-purple-700 bg-purple-50 p-1 rounded w-fit">
                            <Calendar className="h-3 w-3 mr-1" />
                            Booking: {new Date(item.bookingDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex items-end justify-between text-sm mt-2">
                        <p className="text-gray-500">{t('form.quantity')} {item.cartQuantity} {item.unit}</p>

                        <div className="flex space-x-4">
                          <button
                            type="button"
                            onClick={() => moveToFavorites(item.id)}
                            className="font-medium text-primary-600 hover:text-primary-500 flex items-center"
                          >
                            <Heart className="h-4 w-4 mr-1" /> {t('cart.saveForLater')}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
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
          <section className="lg:col-span-5 mt-16 lg:mt-0 space-y-6">

            {/* Delivery Method Selection */}
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-gray-500" /> Delivery Method
              </h2>

              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setDeliveryMethod('HOME')}
                  className={`flex-1 py-3 px-2 border rounded-md flex flex-col items-center justify-center text-sm font-medium transition-colors ${deliveryMethod === 'HOME' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Home className="h-5 w-5 mb-1" />
                  Home Delivery
                </button>
                <button
                  onClick={() => setDeliveryMethod('PICKUP')}
                  className={`flex-1 py-3 px-2 border rounded-md flex flex-col items-center justify-center text-sm font-medium transition-colors ${deliveryMethod === 'PICKUP' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  <MapPin className="h-5 w-5 mb-1" />
                  Pickup Station
                </button>
              </div>

              {deliveryMethod === 'HOME' && (
                <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                  <p className="font-bold text-gray-700 mb-1">Delivering to:</p>
                  {isHomeAddressValid ? (
                    <>
                      <p className="text-gray-900">{primaryHomeLocation?.address}</p>
                      <p className="text-gray-500">{primaryHomeLocation?.city}, {primaryHomeLocation?.region}</p>
                    </>
                  ) : (
                    <p className="text-red-500">
                      No address in profile.{" "}
                      <Link to="/client/profile" className="underline font-medium text-red-600 hover:text-red-700">
                        Set address now
                      </Link>
                    </p>
                  )}
                </div>
              )}

              {deliveryMethod === 'PICKUP' && (
                <div className="space-y-3">
                  {/* City Filter (Fixed for ATI) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Select City</label>
                    {isAtiOrder ? (
                      <input
                        type="text"
                        disabled
                        value={clientCity || "Update Profile City"}
                        className="block w-full border border-gray-200 bg-gray-100 rounded-md p-2 text-sm text-gray-500 cursor-not-allowed"
                      />
                    ) : (
                      // For Producer orders, allow choosing city if needed, but keeping simple for now
                      <select
                        value={selectedPickupCity}
                        onChange={(e) => { setSelectedPickupCity(e.target.value); setSelectedPickupPointId(''); }}
                        className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                      >
                        <option value="">-- Select City --</option>
                        {[...new Set(pickupPoints.map(p => p.city))].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>

                  {/* Pickup Point Select */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Select Pickup Point</label>
                    <select
                      value={selectedPickupPointId}
                      onChange={(e) => setSelectedPickupPointId(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
                      disabled={!selectedPickupCity}
                    >
                      <option value="">-- Select Station --</option>
                      {availablePickupPoints.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - {p.address}</option>
                      ))}
                    </select>
                    {selectedPickupCity && availablePickupPoints.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">No pickup points available in {selectedPickupCity}.</p>
                    )}
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
                    <Calendar className="h-4 w-4 mr-1" /> Retail Delivery Date
                  </h3>

                  {/* Date Picker (Popup Calendar Trigger) */}
                  <div className="relative" ref={calendarRef}>
                    <label className="block text-xs font-bold text-blue-800 mb-1">Select Date</label>

                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className={`w-full flex items-center justify-between bg-white border border-gray-300 text-gray-900 sm:text-sm rounded-md shadow-sm p-2 text-left focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400`}
                    >
                      <span className={deliveryDate ? 'font-medium' : 'text-gray-500'}>
                        {deliveryDate
                          ? new Date(deliveryDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                          : 'Click to select date...'}
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
                    <dd className="font-medium text-gray-900">{subtotal.toLocaleString()} XAF</dd>
                  </div>
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-gray-600">{t('cart.serviceFee')}</dt>
                    <dd className="font-medium text-gray-900">{serviceFee.toLocaleString()} XAF</dd>
                  </div>

                  {/* Coupon Section */}
                  <div className="py-4">
                    {!appliedCoupon ? (
                      <div>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Coupon Code"
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
                            {couponApplying ? '…' : 'APPLY'}
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
                          <span className="text-green-700 font-bold mr-2">- {discountAmount.toLocaleString()} XAF</span>
                          <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="py-4 flex items-center justify-between border-t border-gray-200">
                    <dt className="text-base font-bold text-gray-900">{t('cart.total')}</dt>
                    <dd className="text-base font-bold text-primary-600">{totalAmount.toLocaleString()} XAF</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleInitialPlaceOrder}
                  disabled={!canPlaceOrder}
                  className="w-full bg-primary-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
      {showRecap && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRecap(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900">{t('cart.recap')}</h3>
                <button onClick={() => setShowRecap(false)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">{t('dash.items')}</h4>
                  <ul className="space-y-1 border-b border-gray-300 pb-2 mb-2">
                    {cart.map(item => (
                      <li key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-800">{item.cartQuantity}x {item.title}</span>
                        <span className="font-medium">{(item.price * item.cartQuantity).toLocaleString()} XAF</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Subtotal</span>
                    <span>{subtotal.toLocaleString()} XAF</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Service Fee (5%)</span>
                    <span>{serviceFee.toLocaleString()} XAF</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600 mb-1 font-bold">
                      <span>Discount ({appliedCoupon})</span>
                      <span>- {discountAmount.toLocaleString()} XAF</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-2 pt-2 border-t border-gray-200 font-bold text-gray-900 text-lg">
                    <span>Total</span>
                    <span className="text-primary-600">{totalAmount.toLocaleString()} XAF</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center">
                    <Truck className="h-3 w-3 mr-1" /> Delivery Info
                  </h4>

                  {deliveryMethod === 'HOME' ? (
                    <p className="text-sm text-blue-900">
                      <span className="font-bold">Home Delivery:</span><br />
                      {currentClient?.locations?.[0]?.address}, {currentClient?.locations?.[0]?.city}
                    </p>
                  ) : (
                    <p className="text-sm text-blue-900">
                      <span className="font-bold">Pickup Station:</span><br />
                      {pickupPoints.find(p => p.id === selectedPickupPointId)?.name}<br />
                      <span className="text-xs opacity-75">{pickupPoints.find(p => p.id === selectedPickupPointId)?.address}</span>
                    </p>
                  )}

                  {isAtiOrder && deliveryDate && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <h4 className="text-xs font-bold text-blue-800 uppercase mb-1 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" /> Delivery Date
                      </h4>
                      <p className="text-sm text-blue-900 font-medium">
                        {new Date(deliveryDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowRecap(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">{t('form.cancel')}</button>
                <button
                  onClick={confirmPlacement}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-bold hover:bg-primary-700"
                >
                  {t('cart.validate')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Email Modal */}
      {showGuestEmailModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowGuestEmailModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Checkout as Guest</h3>
                <button onClick={() => setShowGuestEmailModal(false)}>
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">Please provide an email address so we can send your order details and track your cart.</p>
              <form onSubmit={handleGuestEmailSubmit}>
                <div className="mb-4">
                  <label htmlFor="tempEmail" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    id="tempEmail"
                    required
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowGuestEmailModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-bold hover:bg-primary-700">Continue to Checkout</button>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-500">Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Log in</Link></p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
