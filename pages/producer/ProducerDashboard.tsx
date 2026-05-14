import React, { useEffect, useState } from 'react';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { UserRole, ProducerStatus, OrderStatus, Order, OfferType, Review } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, CheckCircle, Package, XCircle, Truck, Eye, User, MapPin, History, ArrowLeft, Calendar, Star, Phone, Mail, Navigation, Upload, X, ThumbsUp, Trash2 } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Spinner } from '../../components/Spinner';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SectionLoader, ListSkeleton } from '../../components/Loaders';
import { offerImageInBox } from '../../utils/offerImageDisplay';
import { orderHasService, orderIsServiceOnly, serviceLineCount, serviceSlotTotal } from '../../utils/orderLabels';

export const ProducerDashboard: React.FC = () => {
   const { user, getProducerOffers, deleteOffer, producers, clients, orders, confirmOrder, rejectOrder, startDelivery, submitReview, revealContactInfo, addDisputeEvidence, reviews, getAverageRating, pickupPoints, isInitialCatalogLoading } = useStore();
   const { t } = useTranslation();
   const navigate = useNavigate();
   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
   const [profileLookupTimedOut, setProfileLookupTimedOut] = useState(false);

   // Review State
   const [showReviewModal, setShowReviewModal] = useState(false);
   const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
   const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);
   const [rating, setRating] = useState(5);
   const [comment, setComment] = useState('');

   // Evidence Upload State
   const [showEvidenceModal, setShowEvidenceModal] = useState(false);
   const [evidenceOrderId, setEvidenceOrderId] = useState<string | null>(null);
   const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
   const [orderActionBusy, setOrderActionBusy] = useState<string | null>(null);
   const [rejectOrderTarget, setRejectOrderTarget] = useState<string | null>(null);
   const [offerDeleteTarget, setOfferDeleteTarget] = useState<{ id: string; title: string } | null>(null);
   const [isDeletingOffer, setIsDeletingOffer] = useState(false);

   const currentProducer = producers.find(p => p.id === user?.producerId);
   const myOffers = user?.producerId ? getProducerOffers(user.producerId) : [];
   const isProducerProfileLoading =
      user?.role === UserRole.PRODUCER &&
      Boolean(user?.producerId) &&
      !currentProducer &&
      !profileLookupTimedOut;

   useEffect(() => {
      if (!isProducerProfileLoading) {
         setProfileLookupTimedOut(false);
         return;
      }
      const timer = setTimeout(() => setProfileLookupTimedOut(true), 2500);
      return () => clearTimeout(timer);
   }, [isProducerProfileLoading]);

   // Seller-side orders (producer can manage/confirm/reject these)
   const producerOwnedOrders = orders.filter((o) =>
      o.producerId === currentProducer?.id || o.producerId === user?.producerId,
   );
   // Buyer-side orders (producer may have placed orders as a client account)
   const producerPurchaseOrders = orders.filter(
      (o) => o.clientId === user?.id || (user?.clientId ? o.clientId === user.clientId : false),
   );
   // Unified list for history/details without duplicates
   const allMyOrders = Array.from(
      new Map([...producerOwnedOrders, ...producerPurchaseOrders].map((o) => [o.id, o])).values(),
   ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

   const pendingValidationOrders = producerOwnedOrders.filter(o => o.status === OrderStatus.PENDING_VALIDATION);
   const awaitingPaymentOrders = producerOwnedOrders.filter(o => o.status === OrderStatus.CONFIRMED_AWAITING_PAYMENT);
   const ordersToShip = producerOwnedOrders.filter(o => o.status === OrderStatus.PAID_IN_PREPARATION);

   // Past Orders (Completed, Cancelled, Dispute, Delivered, In Transit) — always visible so producers can see full history
   const pastOrders = allMyOrders.filter(o =>
      o.status === OrderStatus.COMPLETED ||
      o.status === OrderStatus.CANCELLED ||
      o.status === OrderStatus.DELIVERED ||
      o.status === OrderStatus.DISPUTE ||
      o.status === OrderStatus.IN_TRANSIT
   );

   // My Reviews
   /** Backend stores `targetId` as the rated party's auth user id, not producer profile id. */
   const myReviews = user?.id
     ? reviews.filter((r) => r.targetId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
     : [];
   const myAverageRating = user?.id ? getAverageRating(user.id) : 0;

   if (!user || user.role !== UserRole.PRODUCER) {
      return <div className="p-8 text-center">Access Denied</div>;
   }

   /*
    * Note: we no longer block the entire dashboard with a skeleton takeover
    * while the producer profile is hydrating. The page shell (back button,
    * title placeholder) renders immediately and each data section reveals its
    * own scoped loader. This matches the behaviour of /client/profile and
    * /producer/profile after the latest UX pass.
    */
   if (isProducerProfileLoading) {
      return (
         <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4">
            <SEO title="Producer Dashboard | AgriMarket" noindex={true} />
            <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 min-w-0">
               <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0" aria-label="Back">
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
               </button>
               <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-gray-900 truncate min-w-0">
                  Dashboard
               </h2>
            </div>
            <div className="bg-white shadow rounded-lg p-6 sm:p-8">
               <SectionLoader message={t('form.loading')} />
            </div>
         </div>
      );
   }

   if (!currentProducer) {
      return (
         <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4">
            <SEO title="Producer Dashboard | AgriMarket" noindex={true} />
            <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 min-w-0">
               <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0" aria-label="Back">
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
               </button>
               <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-gray-900 truncate min-w-0">
                  Dashboard
               </h2>
            </div>
            <div className="bg-white shadow rounded-lg p-6 sm:p-8 text-center text-gray-600">
               Producer profile not found. Please complete your producer profile setup.
            </div>
         </div>
      );
   }

   const getClientDetails = (clientId: string) => {
      const fromClientProfile = clients.find(
         (c) => c.id === clientId || (c as any).userId === clientId,
      );
      if (fromClientProfile) return fromClientProfile as any;

      // Fallback for legacy rows where order.clientId stored auth user id.
      return producers.find(
         (p) => p.id === clientId || (p as any).userId === clientId,
      ) as any;
   };

   /** Prefer reviewer snapshot from GET /reviews/user/:id; else catalog by auth user id. */
   const getReviewerDisplayForReview = (review: Review) => {
      const row = getClientDetails(review.reviewerId) as any;
      const catalogName = row
         ? (row.name || row.user?.displayName || `${(row.firstName ?? '').trim()} ${(row.lastName ?? '').trim()}`.trim()).trim()
         : '';
      const catalogAvatar = row
         ? (row.profileImageUrl || row.user?.profileImageUrl || '').trim() || undefined
         : undefined;
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

   const getClientDisplayName = (order: Order) => {
      if (order.clientDisplayName) return order.clientDisplayName;
      const c = getClientDetails(order.clientId);
      if (!c) return `Client ${order.clientId.slice(0, 8)}`;
      const name = c.name || (c as any).user?.displayName || `${(c.firstName ?? '').trim()} ${(c.lastName ?? '').trim()}`.trim();
      return name || `Client ${order.clientId.slice(0, 8)}`;
   };

   const getClientAddress = (order: Order) => {
      if (order.deliveryMethod === 'PICKUP' && order.pickupPointId) {
         const point = pickupPoints.find((p) => p.id === order.pickupPointId);
         if (point) return `${point.address}, ${point.city}`;
      }

      const snap = order.shippingAddress;
      if (
         order.deliveryMethod === 'HOME' &&
         snap &&
         typeof snap === 'object' &&
         String((snap as { address?: string }).address ?? '').trim()
      ) {
         const s = snap as { address: string; city?: string; region?: string };
         const line = [s.address, s.city, s.region].filter(Boolean).join(', ');
         if (line) return line;
      }

      const c = getClientDetails(order.clientId) as any;
      const clientLocations = Array.isArray(c?.locations) ? c.locations : [];
      if (clientLocations.length > 0) {
         const primary = clientLocations[0];
         const joined = [primary.address, primary.city, primary.region].filter(Boolean).join(', ');
         if (joined) return joined;
      }

      // Legacy migrated users may have location only on producer profile.
      const linkedProducer = producers.find((p: any) => p.userId && p.userId === c?.userId);
      const producerLocations = Array.isArray((linkedProducer as any)?.locations) ? (linkedProducer as any).locations : [];
      if (producerLocations.length > 0) {
         const primary = producerLocations[0];
         const joined = [primary.address, primary.city, primary.region].filter(Boolean).join(', ');
         if (joined) return joined;
      }

      return 'No Address';
   };

   const getClientPhone = (clientId: string) => {
      const c = getClientDetails(clientId) as any;
      return c?.phone || c?.user?.phone || 'N/A';
   };

   const getClientEmail = (clientId: string) => {
      const c = getClientDetails(clientId) as any;
      return c?.email || c?.user?.email || 'N/A';
   };

   const getOrderItemImage = (item: any) => {
      if (item?.imageUrl) return item.imageUrl as string;
      const offerId = item?.offerId || item?.id;
      if (!offerId) return '';
      const offerMatch = myOffers.find((o) => o.id === offerId);
      return offerMatch?.imageUrl || '';
   };

   // Order lifecycle steps for timeline (booking → receiving)
   const ORDER_TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
      { status: OrderStatus.PENDING_VALIDATION, label: 'Booked' },
      { status: OrderStatus.CONFIRMED_AWAITING_PAYMENT, label: 'Confirmed' },
      { status: OrderStatus.PAID_IN_PREPARATION, label: 'Paid' },
      { status: OrderStatus.IN_TRANSIT, label: 'In transit' },
      { status: OrderStatus.DELIVERED, label: 'Delivered' },
      { status: OrderStatus.COMPLETED, label: 'Completed' },
   ];
   const TERMINAL_STATUSES = [OrderStatus.CANCELLED, OrderStatus.DISPUTE];
   const getOrderTimelineStepIndex = (status: OrderStatus) => {
      if (TERMINAL_STATUSES.includes(status)) return -1;
      const i = ORDER_TIMELINE_STEPS.findIndex(s => s.status === status);
      return i >= 0 ? i : 0;
   };

   const openReviewModal = (orderId: string, clientId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setReviewOrderId(orderId);
      setReviewTargetId(clientId);
      setRating(5);
      setComment('');
      setShowReviewModal(true);
   };

   const handleSubmitReview = (e: React.FormEvent) => {
      e.preventDefault();
      if (user && reviewOrderId && reviewTargetId) {
         submitReview({
            orderId: reviewOrderId,
            reviewerId: user.id,
            targetId: reviewTargetId,
            rating,
            comment
         });
         setShowReviewModal(false);
      }
   };

   /** Open the device's native maps app for directions to the delivery point.
    *  Uses geo: URI on mobile (opens native app picker), Google Maps fallback on desktop. */
   const openOrderDeliveryInMaps = (order: Order) => {
      let lat: number | undefined;
      let lng: number | undefined;
      let addressLine: string | undefined;

      if (order.deliveryMethod === 'HOME') {
         const snap = order.shippingAddress;
         if (snap && typeof snap === 'object') {
            const sLat = Number((snap as { lat?: number }).lat);
            const sLng = Number((snap as { lng?: number }).lng);
            if (Number.isFinite(sLat) && Number.isFinite(sLng) && (Math.abs(sLat) > 1e-6 || Math.abs(sLng) > 1e-6)) {
               lat = sLat;
               lng = sLng;
            }
         }
      }
      addressLine = getClientAddress(order);
      if (!lat && (!addressLine || addressLine === 'No Address')) return;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (lat != null && lng != null) {
         if (isMobile) {
            window.location.href = `geo:${lat},${lng}?q=${lat},${lng}`;
         } else {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
         }
      } else if (addressLine) {
         const encoded = encodeURIComponent(addressLine);
         if (isMobile) {
            window.location.href = `geo:0,0?q=${encoded}`;
         } else {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
         }
      }
   };

   const openEvidenceModal = (orderId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setEvidenceOrderId(orderId);
      setEvidenceFiles([]);
      setShowEvidenceModal(true);
   };

   const handleEvidenceUpload = (e: React.FormEvent) => {
      e.preventDefault();
      if (evidenceOrderId && evidenceFiles.length > 0) {
         addDisputeEvidence(evidenceOrderId, evidenceFiles);
         setShowEvidenceModal(false);
      }
   };

   const handleDeleteOffer = async () => {
      if (!offerDeleteTarget) return;
      setIsDeletingOffer(true);
      try {
         await deleteOffer(offerDeleteTarget.id);
         setOfferDeleteTarget(null);
      } finally {
         setIsDeletingOffer(false);
      }
   };

   const formatProducerOrderSubtitle = (order: Order) => {
      if (orderIsServiceOnly(order)) {
         const lc = serviceLineCount(order);
         const st = serviceSlotTotal(order);
         return `${lc} ${lc === 1 ? t('service.lineSingular') : t('service.linePlural')} · ${st} ${st === 1 ? t('service.slotSingular') : t('service.slotPlural')} · ${order.totalAmount.toLocaleString()} XAF`;
      }
      if (orderHasService(order)) {
         return `${order.items.length} ${t('dash.itemsProduct')} · ${t('dash.mixedOrderHint')} · ${order.totalAmount.toLocaleString()} XAF`;
      }
      return `${order.items.length} ${t('dash.itemsProduct')} · ${order.totalAmount.toLocaleString()} XAF`;
   };

   return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4">
         <SEO title="Producer Dashboard | AgriMarket" noindex={true} />
         {/* Status Banner */}
         {currentProducer.status === ProducerStatus.PENDING && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
               <div className="flex">
                  <div className="flex-shrink-0">
                     <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                     <p className="text-sm text-yellow-700">
                        {t('dash.pendingMsg')}
                     </p>
                  </div>
               </div>
            </div>
         )}

         <div className="md:flex md:items-center md:justify-between mb-6 sm:mb-8">
            <div className="flex-1 min-w-0">
               <div className="flex items-center mb-2 gap-2 sm:gap-3 min-w-0">
                  <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
                     <ArrowLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-gray-900 truncate min-w-0">
                     Dashboard: {currentProducer.name}
                  </h2>
               </div>
               <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6 sm:ml-12">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentProducer.status === ProducerStatus.VALIDATED ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {t('dash.status')}: {currentProducer.status}
                     </span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                     <Link to="/producer/availability" className="text-primary-600 hover:text-primary-800 font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-1" /> Manage Availability
                     </Link>
                  </div>
               </div>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
               <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('dash.activeOffers')}</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{myOffers.length}</dd>
               </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
               <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('dash.incomingOrders')}</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{pendingValidationOrders.length}</dd>
               </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
               <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('dash.ordersToShip')}</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900 text-primary-600">{ordersToShip.length}</dd>
               </div>
            </div>
         </div>

         {/* Orders to Ship Section (PAID_IN_PREPARATION) */}
         <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8 border-l-4 border-primary-500">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center bg-primary-50">
               <h3 className="text-lg leading-6 font-bold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-primary-600" />
                  {t('dash.ordersToShip')}
               </h3>
               <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-full">Action Required</span>
            </div>
            <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
               {ordersToShip.length === 0 ? (
                  <li className="px-4 py-8 text-center text-gray-500">No orders ready for shipping.</li>
               ) : (
                  ordersToShip.map(order => (
                     <li key={order.id} className="px-4 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                           <div>
                              <p className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                                 {orderIsServiceOnly(order) ? t('service.booking') : 'Order'}{' '}
                                 #{order.id.substring(6)}
                                 {orderIsServiceOnly(order) && (
                                    <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{t('service.badge')}</span>
                                 )}
                                 {orderHasService(order) && !orderIsServiceOnly(order) && (
                                    <span className="text-xs font-medium bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">{t('dash.mixedOrderHint')}</span>
                                 )}
                              </p>
                              <p className="text-sm text-gray-500">{formatProducerOrderSubtitle(order)}</p>
                              {orderIsServiceOnly(order) ? (
                                 <p className="text-xs text-purple-600 font-bold mt-1">{t('service.paidPrepareAppt')}</p>
                              ) : orderHasService(order) ? (
                                 <p className="text-xs text-amber-700 font-medium mt-1">{t('dash.mixedOrderHint')}</p>
                              ) : (
                                 <p className="text-xs text-green-600 font-bold mt-1">{t('dash.paidPrepareShip')}</p>
                              )}
                           </div>

                           <div className="flex flex-wrap gap-2">
                              {/* Contact & Location Buttons */}
                              <div className="text-xs text-gray-600 bg-gray-100 p-1.5 rounded border flex flex-col">
                                 <span className="font-bold">Client Contact:</span>
                                 <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {getClientPhone(order.clientId)}</span>
                                 <span className="flex items-center"><Mail className="w-3 h-3 mr-1" /> {getClientEmail(order.clientId)}</span>
                              </div>

                              <button
                                 onClick={(e) => { e.stopPropagation(); openOrderDeliveryInMaps(order); }}
                                 className="inline-flex items-center px-3 py-2 border border-purple-200 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100"
                              >
                                 <Navigation className="h-4 w-4 mr-2" /> {t('order.shareLocation')}
                              </button>

                              <button
                                 onClick={(e) => { e.stopPropagation(); startDelivery(order.id); }}
                                 className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm"
                              >
                                 <Truck className="h-4 w-4 mr-2" />{' '}
                                 {orderIsServiceOnly(order) ? t('dash.startServiceVisit') : t('dash.startDelivery')}
                              </button>
                           </div>
                        </div>
                     </li>
                  ))
               )}
            </ul>
         </div>

         {/* Incoming Orders Section (PENDING_VALIDATION) */}
         <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
               <h3 className="text-lg leading-6 font-medium text-gray-900">{t('dash.incomingOrders')}</h3>
            </div>
            <ul className="divide-y divide-gray-200">
               {isInitialCatalogLoading && pendingValidationOrders.length === 0 ? (
                  <li className="px-4 py-6"><SectionLoader message={t('form.loading')} /></li>
               ) : pendingValidationOrders.length === 0 ? (
                  <li className="px-4 py-8 text-center text-gray-500">No new orders waiting validation.</li>
               ) : (
                  pendingValidationOrders.map(order => (
                     <li key={order.id} className="px-4 py-4 hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                           <div onClick={() => setSelectedOrder(order)} className="cursor-pointer flex-1">
                              <p className="font-medium text-primary-600 flex items-center gap-2 flex-wrap">
                                 {orderIsServiceOnly(order) ? t('service.booking') : 'Order'}{' '}
                                 #{order.id.substring(6)}
                                 {orderIsServiceOnly(order) && (
                                    <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{t('service.badge')}</span>
                                 )}
                                 <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 flex items-center">
                                    <Eye className="h-3 w-3 mr-1" /> {t('dash.viewDetails')}
                                 </span>
                              </p>
                              <p className="text-sm text-gray-500 mt-1">{formatProducerOrderSubtitle(order)}</p>
                              <p className="text-xs text-gray-400 mt-1">{t('dash.status')}: {order.status.replace(/_/g, ' ')}</p>
                           </div>

                           <div className="flex space-x-2">
                              <button
                                 type="button"
                                 disabled={!!orderActionBusy}
                                 onClick={() => {
                                    setOrderActionBusy(`${order.id}:confirm`);
                                    void confirmOrder(order.id).finally(() => setOrderActionBusy(null));
                                 }}
                                 className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
                              >
                                 {orderActionBusy === `${order.id}:confirm` ? <Spinner className="h-4 w-4 mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                 {t('dash.confirm')}
                              </button>
                              <button
                                 type="button"
                                 disabled={!!orderActionBusy}
                                 onClick={() => setRejectOrderTarget(order.id)}
                                 className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                              >
                                 {orderActionBusy === `${order.id}:reject` ? <Spinner className="h-4 w-4 mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                                 {t('dash.reject')}
                              </button>
                           </div>
                        </div>
                     </li>
                  ))
               )}
            </ul>
         </div>

         {/* Confirmed - Awaiting payment */}
         {awaitingPaymentOrders.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
               <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{t('dash.awaitingPayment')}</h3>
               </div>
               <ul className="divide-y divide-gray-200">
                  {awaitingPaymentOrders.map(order => (
                     <li key={order.id} className="px-4 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <p className="font-medium text-gray-700 flex items-center gap-2 flex-wrap">
                           {orderIsServiceOnly(order) ? t('service.booking') : 'Order'}{' '}
                           #{order.id.substring(6)}
                           {orderIsServiceOnly(order) && (
                              <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{t('service.badge')}</span>
                           )}
                        </p>
                        <p className="text-sm text-gray-500">{formatProducerOrderSubtitle(order)}</p>
                        <p className="text-xs text-amber-600 mt-1">{t('dash.status')}: {order.status.replace(/_/g, ' ')}</p>
                     </li>
                  ))}
               </ul>
            </div>
         )}

         {/* All orders — single list so producers can open any order (booking to receiving), including completed/cancelled */}
         <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8 border-l-4 border-gray-300">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
               <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-gray-500" />
                  {t('dash.allOrders')}
               </h3>
               <p className="text-sm text-gray-500 mt-1">{t('dash.allOrdersDesc')}</p>
            </div>
            <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
               {isInitialCatalogLoading && allMyOrders.length === 0 ? (
                  <li className="px-4 py-6"><SectionLoader message={t('form.loading')} /></li>
               ) : allMyOrders.length === 0 ? (
                  <li className="px-4 py-8 text-center text-gray-500">No orders yet.</li>
               ) : (
                  allMyOrders.map(order => (
                     <li key={order.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center" onClick={() => setSelectedOrder(order)}>
                        <div>
                           <p className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                              {orderIsServiceOnly(order) ? t('service.booking') : 'Order'}{' '}
                              #{order.id.substring(order.id.length - 6)}
                              {orderIsServiceOnly(order) && (
                                 <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{t('service.badge')}</span>
                              )}
                           </p>
                           <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()} · {formatProducerOrderSubtitle(order)}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DISPUTE ? 'bg-red-100 text-red-800' : order.status === OrderStatus.DELIVERED || order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                           {order.status.replace(/_/g, ' ')}
                        </span>
                     </li>
                  ))
               )}
            </ul>
         </div>

         {/* Order History Section (Completed, Cancelled, Delivered, Dispute, In Transit) */}
         <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
               <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <History className="h-5 w-5 mr-2 text-gray-400" />
                  {t('dash.orderHistory')}
               </h3>
            </div>
            <ul className="divide-y divide-gray-200">
               {isInitialCatalogLoading && pastOrders.length === 0 ? (
                  <li className="px-4 py-6"><ListSkeleton rows={2} /></li>
               ) : pastOrders.length === 0 ? (
                  <li className="px-4 py-8 text-center text-gray-500">No past order history.</li>
               ) : (
                  pastOrders.map(order => (
                     <li key={order.id} className="px-4 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                           <div>
                              <p className="font-medium text-gray-700 flex items-center gap-2 flex-wrap">
                                 {orderIsServiceOnly(order) ? t('service.booking') : 'Order'}{' '}
                                 #{order.id.substring(6)}
                                 {orderIsServiceOnly(order) && (
                                    <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{t('service.badge')}</span>
                                 )}
                              </p>
                              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()} · {formatProducerOrderSubtitle(order)}</p>
                           </div>

                           <div className="flex items-center space-x-2">
                              {/* Show share buttons for In Transit orders too */}
                              {order.status === OrderStatus.IN_TRANSIT && (
                                 <>
                                    {!order.contactRevealed ? (
                                       <button
                                          onClick={(e) => { e.stopPropagation(); revealContactInfo(order.id); }}
                                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100"
                                       >
                                          <Phone className="h-3 w-3 inline mr-1" /> Contact
                                       </button>
                                    ) : (
                                       <span className="text-xs text-green-600 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Contact Shared</span>
                                    )}
                                    <button
                                       onClick={(e) => { e.stopPropagation(); openOrderDeliveryInMaps(order); }}
                                       className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200 hover:bg-purple-100"
                                    >
                                       <Navigation className="h-3 w-3 inline mr-1" /> Loc
                                    </button>
                                 </>
                              )}

                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DISPUTE ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                 {order.status.replace(/_/g, ' ')}
                              </span>

                              {order.status === OrderStatus.DISPUTE && (
                                 <button
                                    onClick={(e) => openEvidenceModal(order.id, e)}
                                    className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded border border-orange-200 hover:bg-orange-200 flex items-center font-bold"
                                 >
                                    <Upload className="h-3 w-3 mr-1" /> {t('dash.uploadEvidence')}
                                 </button>
                              )}

                              {(order.status === OrderStatus.DELIVERED || order.status === OrderStatus.COMPLETED) && !order.producerReviewed && (
                                 <button
                                    onClick={(e) => openReviewModal(order.id, order.clientId, e)}
                                    className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold hover:bg-yellow-200"
                                 >
                                    {t('dash.rateClient')}
                                 </button>
                              )}
                           </div>
                        </div>
                     </li>
                  ))
               )}
            </ul>
         </div>

         {/* Offers List */}
         <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
               <h3 className="text-lg leading-6 font-medium text-gray-900">{t('dash.myCatalog')}</h3>
               <Link to="/producer/offers/new" className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <Plus className="-ml-1 mr-1 h-4 w-4" aria-hidden="true" />
                  {t('nav.newOffer')}
               </Link>
            </div>
            <ul className="divide-y divide-gray-200">
               {myOffers.length === 0 ? (
                  <li className="px-4 py-12 text-center">
                     <Package className="mx-auto h-12 w-12 text-gray-400" />
                     <p className="mt-2 text-sm text-gray-500">No offers created yet.</p>
                  </li>
               ) : (
                  myOffers.map((offer) => (
                     <li key={offer.id}>
                        <div className="px-4 py-4 sm:px-6 flex items-center hover:bg-gray-50">
                           <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                              <div className="flex items-center">
                                 <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-md overflow-hidden">
                                    <img src={offer.imageUrl} alt={offer.title} className={offerImageInBox} />
                                 </div>
                                 <div className="ml-4 truncate">
                                    <div className="flex text-sm">
                                       <p className="font-medium text-primary-600 truncate">{offer.title}</p>
                                       <p className="ml-1 flex-shrink-0 font-normal text-gray-500">in {offer.category}</p>
                                       {offer.type === OfferType.SERVICE && <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 rounded-full">Service</span>}
                                    </div>
                                    <div className="mt-2 flex">
                                       <div className="flex items-center text-sm text-gray-500">
                                          <p>
                                             {offer.quantity} {offer.unit} @ {offer.price} XAF / {offer.unit}
                                          </p>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                                 <div className="flex items-center gap-3 overflow-hidden">
                                    <Link to={`/producer/offers/edit/${offer.id}`} className="text-gray-400 hover:text-primary-600">Edit</Link>
                                    <button
                                       type="button"
                                       onClick={() => setOfferDeleteTarget({ id: offer.id, title: offer.title })}
                                       className="text-gray-400 hover:text-red-600"
                                       aria-label={`Delete ${offer.title}`}
                                       title="Delete offer"
                                    >
                                       <Trash2 className="h-4 w-4" />
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </li>
                  ))
               )}
            </ul>
         </div>

         {/* Reviews Section */}
         <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
               <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <ThumbsUp className="h-5 w-5 mr-2 text-yellow-500" />
                  {t('dash.myReviews')}
               </h3>
               <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-bold text-yellow-700">{myAverageRating}</span>
                  <span className="text-xs text-yellow-600 ml-1">/ 5</span>
               </div>
            </div>

            {myReviews.length === 0 ? (
               <div className="px-4 py-8 text-center text-gray-500 italic">{t('review.noReviews')}</div>
            ) : (
               <ul className="divide-y divide-gray-200">
                  {myReviews.map(review => {
                     const author = getReviewerDisplayForReview(review);
                     const initial = (author.name || '?').charAt(0).toUpperCase();
                     return (
                     <li key={review.id} className="px-4 py-4 hover:bg-gray-50">
                        <div className="flex justify-between mb-1">
                           <div className="flex items-center min-w-0">
                              {author.avatarUrl ? (
                                 <img src={author.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover mr-2 shrink-0" />
                              ) : (
                                 <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 mr-2 shrink-0">
                                    {initial}
                                 </div>
                              )}
                              <span className="text-sm font-bold text-gray-800 truncate">{author.name}</span>
                           </div>
                           <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                 <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                              ))}
                           </div>
                        </div>
                        <p className="text-sm text-gray-600 italic ml-8">"{review.comment}"</p>
                        <p className="text-xs text-gray-400 text-right mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                     </li>
                     );
                  })}
               </ul>
            )}
         </div>

         {/* Order Details Modal */}
         {selectedOrder && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
               <div className="flex items-end sm:items-center justify-center min-h-screen p-2 sm:p-4">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedOrder(null)}></div>
                  <div className="relative bg-white rounded-t-lg sm:rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 w-full sm:max-w-lg sm:p-6 max-h-[90vh] overflow-y-auto">
                     <div className="flex justify-between items-start mb-4 gap-2">
                        <div>
                           <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                              {orderIsServiceOnly(selectedOrder) ? t('service.booking') : t('dash.orderDetails')} #{selectedOrder.id.substring(6)}
                           </h3>
                           {orderIsServiceOnly(selectedOrder) && (
                              <span className="inline-flex mt-1 text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{t('service.badge')}</span>
                           )}
                           {orderHasService(selectedOrder) && !orderIsServiceOnly(selectedOrder) && (
                              <p className="text-xs text-amber-700 mt-1">{t('dash.mixedOrderHint')}</p>
                           )}
                        </div>
                        <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-500 shrink-0"><XCircle className="h-6 w-6" /></button>
                     </div>

                     {/* Order timeline: booking → receiving */}
                     <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('dash.orderTimeline')}</h4>
                        <div className="flex flex-wrap gap-x-1 gap-y-1 items-center">
                           {ORDER_TIMELINE_STEPS.map((step, idx) => {
                              const isCurrent = selectedOrder.status === step.status;
                              const currentIdx = getOrderTimelineStepIndex(selectedOrder.status);
                              const isPast = currentIdx >= 0 && idx < currentIdx;
                              return (
                                 <span
                                    key={step.status}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isCurrent ? 'bg-primary-600 text-white' : isPast ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'}`}
                                 >
                                    {step.label}
                                    {idx < ORDER_TIMELINE_STEPS.length - 1 && <span className="ml-1 text-gray-400">→</span>}
                                 </span>
                              );
                           })}
                           {(selectedOrder.status === OrderStatus.CANCELLED || selectedOrder.status === OrderStatus.DISPUTE) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 ml-1">
                                 {selectedOrder.status === OrderStatus.CANCELLED ? 'Cancelled' : 'Dispute'}
                              </span>
                           )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{t('dash.orderPlaced')}: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                     </div>

                     {/* Client Info */}
                     <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <div className="flex items-center mb-2">
                           <User className="h-4 w-4 text-gray-500 mr-2" />
                           <span className="text-sm font-medium text-gray-900">{t('dash.client')}:
                              <Link to={`/profile/client/${selectedOrder.clientId}`} className="ml-1 text-blue-600 hover:underline">
                                 {getClientDisplayName(selectedOrder)}
                              </Link>
                           </span>
                        </div>
                        <div className="flex items-start flex-wrap gap-2">
                           <MapPin className="h-4 w-4 text-gray-500 mr-2 mt-0.5 shrink-0" />
                           <span className="text-sm text-gray-600 flex-1 min-w-0">
                              {orderIsServiceOnly(selectedOrder) ? t('service.visitLocation') : t('dash.address')}: {getClientAddress(selectedOrder)}
                           </span>
                           <button
                              type="button"
                              onClick={() => openOrderDeliveryInMaps(selectedOrder)}
                              className="inline-flex items-center text-xs font-medium text-purple-700 hover:text-purple-900 shrink-0"
                           >
                              <Navigation className="h-3 w-3 mr-1" /> {t('order.shareLocation')}
                           </button>
                        </div>

                        {selectedOrder.contactRevealed && (
                           <div className="mt-2 pt-2 border-t border-gray-200 text-sm">
                              <div className="font-bold text-gray-700 mb-1">Contact Info:</div>
                                 <div className="text-gray-600"><Phone className="h-3 w-3 inline mr-1" /> {getClientPhone(selectedOrder.clientId)}</div>
                                 <div className="text-gray-600"><Mail className="h-3 w-3 inline mr-1" /> {getClientEmail(selectedOrder.clientId)}</div>
                           </div>
                        )}
                     </div>

                     {/* Dispute Info if any */}
                     {selectedOrder.status === OrderStatus.DISPUTE && (
                        <div className="bg-red-50 p-3 rounded-md mb-4 border border-red-200">
                           <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center"><AlertTriangle className="h-4 w-4 mr-2" /> Dispute Active</h4>
                           <p className="text-sm text-red-700 mb-2"><span className="font-semibold">Reason:</span> {selectedOrder.disputeReason || 'N/A'}</p>
                           {selectedOrder.disputeEvidence && selectedOrder.disputeEvidence.length > 0 && (
                              <div>
                                 <p className="text-xs font-bold text-red-800 mb-1">Evidence Uploaded:</p>
                                 <ul className="list-disc ml-4">
                                    {selectedOrder.disputeEvidence.map(ev => (
                                       <li key={ev.id} className="text-xs text-red-600">
                                          {ev.fileName} ({ev.uploaderId === user.id ? 'You' : 'Client'})
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                           )}
                        </div>
                     )}

                     {/* Items / scheduled services */}
                     <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                           {orderHasService(selectedOrder) ? (
                              <>
                                 <Calendar className="h-4 w-4 text-purple-600" /> {t('service.scheduledServices')}
                              </>
                           ) : (
                              t('dash.items')
                           )}
                        </h4>
                        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                           {selectedOrder.items.map((item) => (
                              <li
                                 key={item.id}
                                 className={`p-3 flex justify-between items-start gap-2 ${item.type === OfferType.SERVICE ? 'bg-purple-50/50 border-l-4 border-l-purple-400' : ''}`}
                              >
                                 <div className="flex items-start min-w-0">
                                    <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden mr-3 shrink-0">
                                       {getOrderItemImage(item) ? (
                                          <img src={getOrderItemImage(item)} alt={item.title} className={offerImageInBox} />
                                       ) : (
                                          <div className="h-full w-full bg-gray-200" />
                                       )}
                                    </div>
                                    <div className="min-w-0">
                                       <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                          {item.type === OfferType.SERVICE && (
                                             <span className="text-[10px] font-bold uppercase bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded">{t('service.badge')}</span>
                                          )}
                                       </div>
                                       {item.type === OfferType.SERVICE ? (
                                          <>
                                             <p className="text-xs text-gray-600 mt-1">
                                                {t('service.bookedQty')}: {item.cartQuantity} {t(`unit.${item.unit}`)} · {item.price.toLocaleString()} XAF / {t(`unit.${item.unit}`)}
                                             </p>
                                             {item.bookingDate && (
                                                <p className="text-xs text-purple-800 font-semibold mt-1 flex items-center gap-1">
                                                   <Calendar className="h-3 w-3 shrink-0" />
                                                   {t('service.appointment')}: {new Date(item.bookingDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                             )}
                                             {item.serviceDuration != null && item.serviceDuration > 0 && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                   {item.serviceDuration} {t('service.perSlotHours')}
                                                </p>
                                             )}
                                          </>
                                       ) : (
                                          <p className="text-xs text-gray-500">{item.cartQuantity} {item.unit} × {item.price.toLocaleString()}</p>
                                       )}
                                    </div>
                                 </div>
                                 <p className="text-sm font-bold text-gray-900 shrink-0">{(item.price * item.cartQuantity).toLocaleString()} XAF</p>
                              </li>
                           ))}
                        </ul>
                     </div>

                     <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-base font-medium text-gray-900">Total</span>
                        <span className="text-xl font-bold text-primary-600">{selectedOrder.totalAmount.toLocaleString()} XAF</span>
                     </div>

                     <div className="mt-6">
                        <button
                           onClick={() => setSelectedOrder(null)}
                           className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
                        >
                           {t('dash.close')}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Review Modal */}
         {showReviewModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-end sm:items-center justify-center min-h-screen p-2 sm:p-4">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowReviewModal(false)}></div>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                  <div className="relative bg-white rounded-t-lg sm:rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 w-full sm:max-w-sm sm:p-6 max-h-[90vh] overflow-y-auto">
                     <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">{t('dash.rateClient')}</h3>
                     <form onSubmit={handleSubmitReview}>
                        <div className="flex justify-center space-x-2 mb-6">
                           {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                 key={star}
                                 type="button"
                                 onClick={() => setRating(star)}
                                 className="focus:outline-none"
                              >
                                 <Star
                                    className={`h-8 w-8 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                 />
                              </button>
                           ))}
                        </div>
                        <div className="mb-4">
                           <label className="block text-sm font-medium text-gray-700 mb-2">{t('review.comment')}</label>
                           <textarea
                              rows={3}
                              className="block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Comments about this client..."
                           />
                        </div>
                        <button type="submit" className="w-full bg-primary-600 text-white rounded-md py-2 text-sm font-bold hover:bg-primary-700">
                           {t('review.submit')}
                        </button>
                     </form>
                  </div>
               </div>
            </div>
         )}

         {/* Evidence Upload Modal */}
         {showEvidenceModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-end sm:items-center justify-center min-h-screen p-2 sm:p-4">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEvidenceModal(false)}></div>
                  <div className="relative bg-white rounded-t-lg sm:rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 w-full sm:max-w-lg sm:p-6 max-h-[90vh] overflow-y-auto">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{t('dash.uploadEvidence')}</h3>
                        <button onClick={() => setShowEvidenceModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
                     </div>

                     <form onSubmit={handleEvidenceUpload}>
                        <div className="mb-6">
                           <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                              <div className="space-y-1 text-center">
                                 <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                 <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                       <span>Upload files</span>
                                       <input
                                          type="file"
                                          multiple
                                          accept=".jpg,.jpeg,.png,.pdf"
                                          className="sr-only"
                                          onChange={(e) => e.target.files && setEvidenceFiles(Array.from(e.target.files))}
                                       />
                                    </label>
                                 </div>
                                 <p className="text-xs text-gray-500">JPG, PNG, PDF up to 10MB</p>
                              </div>
                           </div>
                           {evidenceFiles.length > 0 && (
                              <div className="mt-2">
                                 <p className="text-xs font-bold text-gray-700">{evidenceFiles.length} files selected:</p>
                                 <ul className="list-disc ml-4">
                                    {evidenceFiles.map((f, i) => <li key={i} className="text-xs text-gray-600">{f.name}</li>)}
                                 </ul>
                              </div>
                           )}
                        </div>

                        <div className="flex justify-end">
                           <button type="submit" className="px-4 py-2 text-white bg-primary-600 rounded-md text-sm hover:bg-primary-700">Upload</button>
                        </div>
                     </form>
                  </div>
               </div>
            </div>
         )}

         <ConfirmModal
            open={offerDeleteTarget !== null}
            tone="danger"
            title="Delete offer?"
            description={offerDeleteTarget && (
               <>
                  <p>This action cannot be undone.</p>
                  <p className="mt-2 break-words text-sm font-semibold text-gray-900">{offerDeleteTarget.title}</p>
               </>
            )}
            confirmLabel="Delete"
            busy={isDeletingOffer}
            onClose={() => { if (!isDeletingOffer) setOfferDeleteTarget(null); }}
            onConfirm={() => handleDeleteOffer()}
         />

         <ConfirmModal
            open={rejectOrderTarget !== null}
            tone="danger"
            title="Reject this order?"
            description="The client will be notified that this order was rejected. This action cannot be undone."
            confirmLabel={t('dash.reject')}
            busy={orderActionBusy === `${rejectOrderTarget}:reject`}
            onClose={() => { if (orderActionBusy !== `${rejectOrderTarget}:reject`) setRejectOrderTarget(null); }}
            onConfirm={async () => {
               if (!rejectOrderTarget) return;
               try {
                  setOrderActionBusy(`${rejectOrderTarget}:reject`);
                  await rejectOrder(rejectOrderTarget);
               } finally {
                  setOrderActionBusy(null);
                  setRejectOrderTarget(null);
               }
            }}
         />
      </div>
   );
};
