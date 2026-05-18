import { OrderStatus } from '../types';

/** i18n keys for compact order status pills (no raw ENUM text). */
export const ORDER_STATUS_LABEL_KEY: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_VALIDATION]: 'order.status.pending',
  [OrderStatus.CONFIRMED_AWAITING_PAYMENT]: 'order.status.awaitingPayment',
  [OrderStatus.PAID_IN_PREPARATION]: 'order.status.preparing',
  [OrderStatus.IN_TRANSIT]: 'order.inTransit',
  [OrderStatus.DELIVERED]: 'order.status.delivered',
  [OrderStatus.COMPLETED]: 'order.completed',
  [OrderStatus.CANCELLED]: 'order.cancelled',
  [OrderStatus.DISPUTE]: 'order.status.dispute',
};

export const ORDER_STATUS_PILL_CLASS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_VALIDATION]: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80',
  [OrderStatus.CONFIRMED_AWAITING_PAYMENT]: 'bg-sky-100 text-sky-900 ring-1 ring-sky-200/80',
  [OrderStatus.PAID_IN_PREPARATION]: 'bg-violet-100 text-violet-900 ring-1 ring-violet-200/80',
  [OrderStatus.IN_TRANSIT]: 'bg-indigo-100 text-indigo-900 ring-1 ring-indigo-200/80',
  [OrderStatus.DELIVERED]: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80',
  [OrderStatus.COMPLETED]: 'bg-gray-100 text-gray-800 ring-1 ring-gray-200/80',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-900 ring-1 ring-red-200/80',
  [OrderStatus.DISPUTE]: 'bg-orange-100 text-orange-900 ring-1 ring-orange-200/80',
};
