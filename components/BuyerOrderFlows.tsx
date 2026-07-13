import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import { z } from 'zod';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Star,
  Wallet,
  X,
} from 'lucide-react';
import { useStore } from '../services/storeContext';
import { useTranslation } from '../services/i18nContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { showAppToast } from '../services/appToast';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { ServiceAppointmentPicker } from './ServiceAppointmentPicker';
import { Order, OrderStatus, UserSession } from '../types';
import { offerImageInBox } from '../utils/offerImageDisplay';
import { PAYMENTS_ENABLED } from '../utils/featureFlags';
import { orderHasService, orderIsServiceOnly, serviceLineCount } from '../utils/orderLabels';
import {
  canCancelDirectly,
  canLeaveReview,
  canReportProblem,
  canRequestCancellation,
  isActiveOrderStatus,
} from '../utils/orderActions';
import { ORDER_STATUS_LABEL_KEY, ORDER_STATUS_PILL_CLASS } from '../utils/orderStatusDisplay';

type ActionSize = 'sm' | 'md';

type BuyerOrderFlowsContextValue = {
  renderActions: (order: Order, size?: ActionSize, afterAction?: () => void) => React.ReactNode;
};

const BuyerOrderFlowsContext = createContext<BuyerOrderFlowsContextValue | null>(null);

/**
 * True when `order` is one the given session placed as a *buyer* (not one they sell).
 * An order has exactly one producer (seller) and one client (buyer); a producer can never
 * buy their own offer (blocked server-side), so this cleanly separates the two roles.
 */
export function isOrderAsBuyer(order: Order, user: UserSession | null | undefined): boolean {
  if (!user?.id) return false;
  if (order.clientId === user.id) return true;
  if (user.clientId && order.clientId === user.clientId) return true;
  return false;
}

/**
 * Provides the buyer-side order experience (pay, confirm receipt, complete, cancel, dispute,
 * reschedule, review) and the modals that back those actions. This is the same flow a client
 * gets in ClientProfile, reused so a producer buying from another producer behaves like a buyer.
 */
export function BuyerOrderFlowsProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    orders,
    offers,
    producers,
    payForOrder,
    cancelOrder,
    completeOrder,
    confirmReceipt,
    requestOrderCancellation,
    updateAppointment,
    reportProblem,
    submitReview,
    getWallet,
    refreshWallet,
  } = useStore();
  const { t } = useTranslation();
  const { formatXaf } = useCurrency();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);

  const [showPaymentRecap, setShowPaymentRecap] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState(false);
  const [completeOrderId, setCompleteOrderId] = useState<string | null>(null);
  const [completingOrder, setCompletingOrder] = useState(false);
  const [confirmReceiptOrderId, setConfirmReceiptOrderId] = useState<string | null>(null);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [cancelRequestOrderId, setCancelRequestOrderId] = useState<string | null>(null);
  const [cancelRequestReason, setCancelRequestReason] = useState('');
  const [requestingCancel, setRequestingCancel] = useState(false);
  const [rescheduleOrderId, setRescheduleOrderId] = useState<string | null>(null);
  const [rescheduleSlotIso, setRescheduleSlotIso] = useState<string | null>(null);
  const [reschedulingAppt, setReschedulingAppt] = useState(false);

  const wallet = user ? getWallet(user.id) : null;

  useEffect(() => {
    if (user?.id) void refreshWallet();
    // NOTE: `refreshWallet` is intentionally NOT a dependency. The store value is
    // rebuilt every render, so `refreshWallet` gets a new identity each time;
    // depending on it would re-run this effect every render → refreshWallet() →
    // setWallets() → re-render → loop, freezing the tab. We only need to refresh
    // when the signed-in user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const reviewFormik = useFormik({
    initialValues: { comment: '', rating: 5 },
    validate: (values) => {
      const parsed = z
        .object({
          comment: z.string().trim().min(2, 'Please add a short comment.'),
          rating: z.number().min(1).max(5),
        })
        .safeParse(values);
      if (parsed.success) return {};
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !errs[key]) errs[key] = issue.message;
      }
      return errs;
    },
    onSubmit: (values) => {
      if (user && reviewOrderId && reviewTargetId) {
        submitReview({
          orderId: reviewOrderId,
          reviewerId: user.id,
          targetId: reviewTargetId,
          rating: values.rating,
          comment: values.comment,
        });
        setShowReviewModal(false);
      }
    },
  });

  const disputeFormik = useFormik({
    initialValues: { disputeReason: '' },
    validate: (values) => {
      const parsed = z
        .object({ disputeReason: z.string().trim().min(5, 'Please describe the issue in at least 5 characters.') })
        .safeParse(values);
      if (parsed.success) return {};
      return { disputeReason: parsed.error.issues[0]?.message || 'Invalid reason.' };
    },
    onSubmit: (values, { setFieldError }) => {
      if (disputeOrderId) {
        if (disputeFiles.length === 0) {
          setFieldError('disputeReason', t('order.disputeFileRequired'));
          return;
        }
        reportProblem(disputeOrderId, values.disputeReason, disputeFiles);
        setShowDisputeModal(false);
      }
    },
  });

  const getProducerName = (producerId: string) => {
    const p = producers.find((prod) => prod.id === producerId);
    return p
      ? p.name ||
          (p as any).user?.displayName ||
          `${(p.firstName ?? '').trim()} ${(p.lastName ?? '').trim()}`.trim()
      : 'Unknown Producer';
  };

  const getProducerDisplayName = (order: Order) => order.producerDisplayName || getProducerName(order.producerId);

  const getOrderItemImage = (item: any) => {
    if (item?.imageUrl) return item.imageUrl as string;
    const offerId = item?.offerId || item?.id;
    if (!offerId) return '';
    const offerMatch = offers.find((o) => o.id === offerId);
    return offerMatch?.imageUrl || '';
  };

  const canRescheduleAppointment = (order: Order) =>
    orderHasService(order) &&
    [OrderStatus.PENDING_VALIDATION, OrderStatus.CONFIRMED_AWAITING_PAYMENT, OrderStatus.PAID_IN_PREPARATION].includes(
      order.status,
    );

  const firstServiceBookingIso = (order: Order): string | null => {
    const svc = (order.items || []).find(
      (it: any) => String(it.type ?? '').toUpperCase() === 'SERVICE' && it.bookingDate,
    );
    const raw = (svc as any)?.bookingDate || order.requestedDeliveryDate;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  const initiatePayment = (orderId: string) => {
    setPaymentOrderId(orderId);
    setShowPaymentRecap(true);
  };

  const confirmPayment = async () => {
    if (!paymentOrderId || paymentProcessing) return;
    setPaymentProcessing(true);
    try {
      const result = await payForOrder(paymentOrderId);
      if (!result.success && result.error === 'INSUFFICIENT_FUNDS') {
        showAppToast(t('order.insufficient'), 'ERROR');
      }
      setShowPaymentRecap(false);
      setPaymentOrderId(null);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const openReviewModal = (orderId: string, producerId: string) => {
    setReviewOrderId(orderId);
    setReviewTargetId(producerId);
    reviewFormik.setValues({ rating: 5, comment: '' });
    setShowReviewModal(true);
  };

  const openDisputeModal = (orderId: string) => {
    setDisputeOrderId(orderId);
    disputeFormik.setFieldValue('disputeReason', '');
    setDisputeFiles([]);
    setShowDisputeModal(true);
  };

  const openRescheduleModal = (order: Order) => {
    setRescheduleOrderId(order.id);
    setRescheduleSlotIso(firstServiceBookingIso(order));
  };

  const openCancelRequestModal = (orderId: string) => {
    setCancelRequestOrderId(orderId);
    setCancelRequestReason('');
  };

  const rescheduleOrder = rescheduleOrderId ? orders.find((o) => o.id === rescheduleOrderId) ?? null : null;
  const rescheduleServiceItem = rescheduleOrder
    ? (rescheduleOrder.items || []).find((it: any) => String(it.type ?? '').toUpperCase() === 'SERVICE')
    : null;
  const rescheduleDurationHours = Math.max(1, Number((rescheduleServiceItem as any)?.serviceDuration ?? 1) || 1);

  const renderActions = useCallback(
    (order: Order, size: ActionSize = 'sm', afterAction?: () => void) => {
      const btn = size === 'sm' ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2';
      const btnBold = size === 'sm' ? 'text-xs px-4 py-1.5' : 'text-sm px-4 py-2';
      const iconSm = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
      const wrap = (fn: () => void) => () => {
        fn();
        afterAction?.();
      };

      return (
        <>
          {PAYMENTS_ENABLED && order.status === OrderStatus.CONFIRMED_AWAITING_PAYMENT && (
            <button
              type="button"
              onClick={wrap(() => initiatePayment(order.id))}
              className={`bg-primary-600 text-white ${btnBold} rounded-md font-bold hover:bg-primary-700 shadow-sm flex items-center gap-1`}
            >
              <CreditCard className={iconSm} /> {t('order.payNow')}
            </button>
          )}
          {canRescheduleAppointment(order) && (
            <button
              type="button"
              onClick={wrap(() => openRescheduleModal(order))}
              className={`text-purple-700 hover:bg-purple-50 ${btn} rounded-md font-medium border border-purple-200 flex items-center gap-1`}
            >
              <Calendar className={iconSm} /> {t('order.reschedule')}
            </button>
          )}
          {order.status === OrderStatus.IN_TRANSIT &&
            (order.clientConfirmedReceipt ? (
              <span
                className={`text-emerald-700 bg-emerald-50 ${btn} rounded-md font-medium border border-emerald-100 flex items-center gap-1`}
              >
                <CheckCircle className={iconSm} /> {t('order.awaitingSellerDelivery')}
              </span>
            ) : (
              <button
                type="button"
                onClick={wrap(() => setConfirmReceiptOrderId(order.id))}
                className={`bg-emerald-600 text-white ${btnBold} rounded-md font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-1`}
              >
                <CheckCircle className={iconSm} /> {t('order.confirmReceipt')}
              </button>
            ))}
          {order.status === OrderStatus.DELIVERED && (
            <button
              type="button"
              onClick={wrap(() => setCompleteOrderId(order.id))}
              className={`bg-green-600 text-white ${btnBold} rounded-md font-bold hover:bg-green-700 shadow-sm flex items-center gap-1`}
            >
              <CheckCircle className={iconSm} /> {t('order.completeOrder')}
            </button>
          )}
          {canCancelDirectly(order) && (
            <button
              type="button"
              onClick={wrap(() => setCancelOrderId(order.id))}
              className={`text-red-600 hover:bg-red-50 ${btn} rounded-md font-medium border border-red-100`}
            >
              {t('order.cancel')}
            </button>
          )}
          {canRequestCancellation(order) &&
            (order.cancellationRequested ? (
              <span className={`text-gray-500 bg-gray-50 ${btn} rounded-md font-medium border border-gray-200`}>
                {t('order.cancellationPending')}
              </span>
            ) : (
              <button
                type="button"
                onClick={wrap(() => openCancelRequestModal(order.id))}
                className={`text-red-600 hover:bg-red-50 ${btn} rounded-md font-medium border border-red-100`}
              >
                {t('order.requestCancellation')}
              </button>
            ))}
          {canReportProblem(order) && (
            <button
              type="button"
              onClick={wrap(() => openDisputeModal(order.id))}
              className={`text-orange-600 hover:bg-orange-50 ${btn} rounded-md font-medium border border-orange-100 flex items-center gap-1`}
            >
              <AlertTriangle className={iconSm} /> {t('order.reportProblem')}
            </button>
          )}
          {canLeaveReview(order) && (
            <button
              type="button"
              onClick={wrap(() => openReviewModal(order.id, order.producerId))}
              className={`bg-yellow-100 text-yellow-800 ${btnBold} rounded-md font-bold hover:bg-yellow-200 border border-yellow-200 flex items-center gap-1`}
            >
              <Star className={`${iconSm} fill-current`} /> {t('review.rate')}
            </button>
          )}
        </>
      );
    },
    [t],
  );

  const contextValue = useMemo(() => ({ renderActions }), [renderActions]);

  const payOrder = paymentOrderId ? orders.find((o) => o.id === paymentOrderId) : null;

  return (
    <BuyerOrderFlowsContext.Provider value={contextValue}>
      {children}

      {showPaymentRecap && payOrder && (() => {
        const producerName = getProducerDisplayName(payOrder);
        const walletBalance = wallet?.balance ?? 0;
        const newBalance = walletBalance - payOrder.totalAmount;
        const hasSufficientFunds = newBalance >= 0;

        return (
          <Modal
            open={showPaymentRecap}
            onClose={() => setShowPaymentRecap(false)}
            maxWidth="lg"
            zIndex={50}
            backdropClassName="bg-gray-900/60"
            panelClassName="p-4 sm:p-6"
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('order.paymentRecap')}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Order #{payOrder.id.substring(payOrder.id.length - 6).toUpperCase()}
                </p>
              </div>
              <button type="button" onClick={() => setShowPaymentRecap(false)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 bg-primary-50 p-3 rounded-lg border border-primary-100">
              <div className="h-9 w-9 rounded-full bg-primary-200 flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-primary-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Sold by</p>
                <p className="text-sm font-bold text-gray-900">{producerName}</p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('dash.items')}</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(payOrder.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
                    {getOrderItemImage(item) && (
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                        <img src={getOrderItemImage(item)} alt={item.title} className={offerImageInBox} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title || item.description || 'Item'}</p>
                      <p className="text-xs text-gray-500">
                        {item.cartQuantity ?? item.quantity ?? 1} {item.unit || 'units'} × {formatXaf(item.price ?? 0)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                      {formatXaf((item.price ?? 0) * (item.cartQuantity ?? item.quantity ?? 1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{t('cart.subtotal')}</span>
                <span className="font-medium">{formatXaf(payOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t('cart.serviceFee')}</span>
                <span className="font-medium">{formatXaf(payOrder.serviceFee)}</span>
              </div>
              {(payOrder.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount Applied</span>
                  <span>- {formatXaf(payOrder.discountAmount ?? 0)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
                <span>{t('cart.total')}</span>
                <span className="text-primary-600 text-base">{formatXaf(payOrder.totalAmount)}</span>
              </div>
            </div>

            <div
              className={`rounded-lg p-3 border mb-5 space-y-2 text-sm ${hasSufficientFunds ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className="flex justify-between text-gray-700">
                <span className="flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  {t('order.walletBalance')}
                </span>
                <span className="font-medium">{walletBalance.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>{t('order.orderTotal')}</span>
                <span className="font-medium">- {payOrder.totalAmount.toLocaleString()} XAF</span>
              </div>
              <div
                className={`flex justify-between font-bold border-t pt-2 ${hasSufficientFunds ? 'border-blue-200 text-blue-800' : 'border-red-200 text-red-700'}`}
              >
                <span>Balance After Payment</span>
                <span>{newBalance.toLocaleString()} XAF</span>
              </div>
            </div>

            {!hasSufficientFunds && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-700">{t('order.insufficient')}</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    You need {(payOrder.totalAmount - walletBalance).toLocaleString()} XAF more.
                  </p>
                  <Link
                    to="/wallet"
                    className="text-xs text-red-700 underline font-medium mt-1 inline-block"
                    onClick={() => setShowPaymentRecap(false)}
                  >
                    Top up wallet →
                  </Link>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void confirmPayment()}
                disabled={!hasSufficientFunds || paymentProcessing}
                className="w-full bg-primary-600 text-white rounded-lg py-3 font-bold hover:bg-primary-700 shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentProcessing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CreditCard className="h-4 w-4" />}
                {paymentProcessing
                  ? t('wallet.processing')
                  : `${t('order.confirmPayment')} — ${formatXaf(payOrder.totalAmount)}`}
              </button>
              <button type="button" onClick={() => setShowPaymentRecap(false)} className="w-full text-gray-500 text-sm hover:underline py-1">
                {t('form.cancel')}
              </button>
            </div>
          </Modal>
        );
      })()}

      <Modal open={showReviewModal && !!reviewOrderId} onClose={() => setShowReviewModal(false)} maxWidth="sm" zIndex={50} panelClassName="p-4 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">{t('review.rate')}</h3>
        <form onSubmit={reviewFormik.handleSubmit}>
          <div className="flex justify-center space-x-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => void reviewFormik.setFieldValue('rating', star)} className="focus:outline-none">
                <Star className={`h-8 w-8 ${star <= reviewFormik.values.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('review.comment')}</label>
            <textarea
              name="comment"
              rows={3}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
              value={reviewFormik.values.comment}
              onChange={reviewFormik.handleChange}
              onBlur={reviewFormik.handleBlur}
              placeholder="Share your experience..."
            />
            {reviewFormik.touched.comment && reviewFormik.errors.comment ? (
              <p className="text-xs text-red-600 mt-1">{reviewFormik.errors.comment}</p>
            ) : null}
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white rounded-md py-2 text-sm font-bold hover:bg-primary-700">
            {t('review.submit')}
          </button>
        </form>
      </Modal>

      <Modal open={showDisputeModal && !!disputeOrderId} onClose={() => setShowDisputeModal(false)} maxWidth="lg" zIndex={50} panelClassName="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
          <h3 className="text-lg font-bold text-gray-900">{t('order.reportProblem')}</h3>
          <button type="button" onClick={() => setShowDisputeModal(false)}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <form onSubmit={disputeFormik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('order.reason')}</label>
            <textarea
              name="disputeReason"
              required
              rows={3}
              className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
              value={disputeFormik.values.disputeReason}
              onChange={disputeFormik.handleChange}
              onBlur={disputeFormik.handleBlur}
              placeholder="What's the issue?"
            />
            {disputeFormik.touched.disputeReason && disputeFormik.errors.disputeReason ? (
              <p className="text-xs text-red-600 mt-1">{disputeFormik.errors.disputeReason}</p>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('order.uploadFiles')}</label>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              onChange={(e) => e.target.files && setDisputeFiles(Array.from(e.target.files).slice(0, 3))}
            />
            <p className="text-xs text-gray-400 mt-1">{t('order.uploadFilesHint')}</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowDisputeModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">
              {t('form.cancel')}
            </button>
            <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-bold hover:bg-orange-700">
              {t('order.submitReport')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={rescheduleOrderId !== null}
        onClose={() => {
          if (!reschedulingAppt) setRescheduleOrderId(null);
        }}
        maxWidth="sm"
        zIndex={50}
        panelClassName="p-4 sm:p-6"
      >
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" /> {t('order.reschedule')}
          </h3>
          <button
            type="button"
            onClick={() => {
              if (!reschedulingAppt) setRescheduleOrderId(null);
            }}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">{t('order.rescheduleHint')}</p>
        {rescheduleOrder?.producerId ? (
          <ServiceAppointmentPicker
            producerId={rescheduleOrder.producerId}
            durationHours={rescheduleDurationHours}
            selectedSlotIso={rescheduleSlotIso}
            onSelectSlot={setRescheduleSlotIso}
            clientId={user?.clientId}
            orders={orders}
            currentBookingIso={firstServiceBookingIso(rescheduleOrder) ?? undefined}
          />
        ) : (
          <p className="text-sm text-red-600">Unable to load appointment details.</p>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => setRescheduleOrderId(null)}
            disabled={reschedulingAppt}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50"
          >
            {t('form.cancel')}
          </button>
          <button
            type="button"
            disabled={!rescheduleSlotIso || reschedulingAppt}
            onClick={async () => {
              if (!rescheduleOrderId || !rescheduleSlotIso) return;
              try {
                setReschedulingAppt(true);
                const ok = await updateAppointment(rescheduleOrderId, rescheduleSlotIso);
                if (ok) setRescheduleOrderId(null);
              } finally {
                setReschedulingAppt(false);
              }
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
          >
            {reschedulingAppt ? t('wallet.processing') : t('order.saveAppointment')}
          </button>
        </div>
      </Modal>

      <Modal
        open={cancelRequestOrderId !== null}
        onClose={() => {
          if (!requestingCancel) setCancelRequestOrderId(null);
        }}
        maxWidth="sm"
        zIndex={50}
        panelClassName="p-4 sm:p-6"
      >
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
          <h3 className="text-lg font-bold text-gray-900">{t('order.requestCancellation')}</h3>
          <button
            type="button"
            onClick={() => {
              if (!requestingCancel) setCancelRequestOrderId(null);
            }}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">{t('order.requestCancellationHint')}</p>
        <textarea
          rows={3}
          value={cancelRequestReason}
          onChange={(e) => setCancelRequestReason(e.target.value)}
          placeholder={t('order.reason')}
          className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
        />
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => setCancelRequestOrderId(null)}
            disabled={requestingCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50"
          >
            {t('order.cancelKeep')}
          </button>
          <button
            type="button"
            disabled={requestingCancel}
            onClick={async () => {
              if (!cancelRequestOrderId) return;
              try {
                setRequestingCancel(true);
                await requestOrderCancellation(cancelRequestOrderId, cancelRequestReason.trim());
                setCancelRequestOrderId(null);
              } finally {
                setRequestingCancel(false);
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 disabled:opacity-50"
          >
            {requestingCancel ? t('wallet.processing') : t('order.submitCancellation')}
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={cancelOrderId !== null}
        tone="danger"
        title={t('order.cancelConfirmTitle')}
        description={t('order.cancelConfirmBody')}
        confirmLabel={t('order.cancel')}
        cancelLabel={t('order.cancelKeep')}
        busy={cancelingOrder}
        onClose={() => {
          if (!cancelingOrder) setCancelOrderId(null);
        }}
        onConfirm={async () => {
          if (!cancelOrderId) return;
          try {
            setCancelingOrder(true);
            await cancelOrder(cancelOrderId);
          } finally {
            setCancelingOrder(false);
            setCancelOrderId(null);
          }
        }}
      />

      <ConfirmModal
        open={completeOrderId !== null}
        tone="info"
        title={t('order.completeConfirmTitle')}
        description={t('order.completeConfirmBody')}
        confirmLabel={t('order.completeOrder')}
        busy={completingOrder}
        onClose={() => {
          if (!completingOrder) setCompleteOrderId(null);
        }}
        onConfirm={async () => {
          if (!completeOrderId) return;
          try {
            setCompletingOrder(true);
            await completeOrder(completeOrderId);
          } finally {
            setCompletingOrder(false);
            setCompleteOrderId(null);
          }
        }}
      />

      <ConfirmModal
        open={confirmReceiptOrderId !== null}
        tone="info"
        title={t('order.receiptConfirmTitle')}
        description={t('order.receiptConfirmBody')}
        confirmLabel={t('order.confirmReceipt')}
        busy={confirmingReceipt}
        onClose={() => {
          if (!confirmingReceipt) setConfirmReceiptOrderId(null);
        }}
        onConfirm={async () => {
          if (!confirmReceiptOrderId) return;
          try {
            setConfirmingReceipt(true);
            await confirmReceipt(confirmReceiptOrderId);
          } finally {
            setConfirmingReceipt(false);
            setConfirmReceiptOrderId(null);
          }
        }}
      />
    </BuyerOrderFlowsContext.Provider>
  );
}

function useBuyerOrderFlows() {
  const ctx = useContext(BuyerOrderFlowsContext);
  if (!ctx) throw new Error('BuyerOrderFlows components must be used within BuyerOrderFlowsProvider');
  return ctx;
}

/** Buyer-side action buttons for a single order (pay, confirm, complete, cancel, dispute, review). */
export function BuyerOrderActions({
  order,
  size = 'sm',
  afterAction,
}: {
  order: Order;
  size?: ActionSize;
  afterAction?: () => void;
}) {
  const { renderActions } = useBuyerOrderFlows();
  return <>{renderActions(order, size, afterAction)}</>;
}

/** Producer (seller) contact block shown to a buyer once their order is in transit. */
export function BuyerPurchaseProducerContact({ order }: { order: Order }) {
  const { t } = useTranslation();
  const { producers, revealContactInfo } = useStore();

  if (order.status !== OrderStatus.IN_TRANSIT) return null;

  const getProducerContact = (producerId: string) => {
    const p = producers.find((prod) => prod.id === producerId) as any;
    return {
      phone: p?.phone || p?.user?.phone || null,
      email: p?.email || p?.user?.email || null,
    };
  };

  return (
    <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200 text-sm">
      <p className="font-medium text-blue-800 mb-1 flex items-center gap-1">
        <Phone className="h-3.5 w-3.5" /> Producer Contact
      </p>
      {order.contactRevealed ? (
        (() => {
          const contact = getProducerContact(order.producerId);
          return (
            <div className="space-y-1 text-blue-700">
              {contact.phone ? (
                <p className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 shrink-0" /> {contact.phone}
                </p>
              ) : null}
              {contact.email ? (
                <p className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> {contact.email}
                </p>
              ) : null}
              {!contact.phone && !contact.email ? <p>Contact not available</p> : null}
            </div>
          );
        })()
      ) : (
        <button
          type="button"
          onClick={() => void revealContactInfo(order.id)}
          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-medium"
        >
          {t('order.revealContact')}
        </button>
      )}
    </div>
  );
}

/** A list of the producer's *active* buyer orders, each with buyer-side actions. */
export function BuyerPurchaseOrdersSection({
  orders: purchaseOrders,
  onSelectOrder,
  emptyMsg,
}: {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  emptyMsg?: string;
}) {
  const { t } = useTranslation();
  const { offers, producers } = useStore();
  const { renderActions } = useBuyerOrderFlows();

  const activeOrders = purchaseOrders.filter((o) => isActiveOrderStatus(o.status));

  const getProducerName = (producerId: string) => {
    const p = producers.find((prod) => prod.id === producerId);
    return p
      ? p.name ||
          (p as any).user?.displayName ||
          `${(p.firstName ?? '').trim()} ${(p.lastName ?? '').trim()}`.trim()
      : 'Unknown Producer';
  };

  const getOrderItemImage = (item: any) => {
    if (item?.imageUrl) return item.imageUrl as string;
    const offerId = item?.offerId || item?.id;
    if (!offerId) return '';
    return offers.find((o) => o.id === offerId)?.imageUrl || '';
  };

  const getStatusBadge = (status: OrderStatus) => (
    <span
      className={`agm-order-status-pill ${ORDER_STATUS_PILL_CLASS[status] || 'bg-gray-100 text-gray-800 ring-1 ring-gray-200/80'}`}
      title={t(ORDER_STATUS_LABEL_KEY[status] || 'order.status')}
    >
      {t(ORDER_STATUS_LABEL_KEY[status] || 'order.status')}
    </span>
  );

  const metaLine = (order: Order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    const seller = getProducerName(order.producerId);
    if (orderIsServiceOnly(order)) {
      const lc = serviceLineCount(order);
      return `${date} · ${seller} · ${lc} ${lc === 1 ? t('service.lineSingular') : t('service.linePlural')}`;
    }
    return `${date} · ${seller} · ${order.items?.length ?? 0} ${t('dash.itemsProduct')}`;
  };

  if (activeOrders.length === 0) {
    return <div className="px-4 py-8 text-center text-gray-500">{emptyMsg || t('dash.myPurchasesEmpty')}</div>;
  }

  return (
    <ul className="divide-y divide-gray-200 agm-dash-scroll-4 agm-dash-row-tall scrollbar-thin">
      {activeOrders.map((order) => (
        <li key={order.id} className="px-4 py-4 hover:bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="cursor-pointer flex-1 min-w-0" onClick={() => onSelectOrder(order)}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                  {orderIsServiceOnly(order) ? t('service.booking') : 'Order'} #{order.id.substring(order.id.length - 6).toUpperCase()}
                  {orderIsServiceOnly(order) && (
                    <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{t('service.badge')}</span>
                  )}
                </p>
                <div className="shrink-0">{getStatusBadge(order.status)}</div>
              </div>
              <p className="text-sm text-gray-500">{metaLine(order)}</p>
              {order.deliveryMethod === 'HOME' && order.shippingAddress && typeof order.shippingAddress === 'object' && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {[(order.shippingAddress as any).address, (order.shippingAddress as any).city, (order.shippingAddress as any).region]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              <div className="flex -space-x-2 overflow-hidden mt-3">
                {(order.items || []).slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} className="inline-block h-10 w-10 overflow-hidden rounded-md ring-2 ring-white bg-gray-100" title={item.title}>
                    {getOrderItemImage(item) ? (
                      <img src={getOrderItemImage(item)} alt="" className={offerImageInBox} />
                    ) : (
                      <div className="h-full w-full bg-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full sm:w-auto sm:text-right shrink-0" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-bold text-gray-900 mb-2">{formatXaf(Number(order.totalAmount ?? 0))}</p>
              <div className="flex gap-2 flex-wrap sm:justify-end">{renderActions(order)}</div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
