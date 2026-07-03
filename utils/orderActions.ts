import { Order, OrderStatus } from '../types';

/** Map legacy / retail API status strings to the Connect OrderStatus enum. */
export function normalizeOrderStatus(raw: unknown): OrderStatus {
  const s = String(raw ?? '').toUpperCase();
  switch (s) {
    case 'CONFIRMED':
    case 'CONFIRMED_AWAITING_PAYMENT':
      return OrderStatus.CONFIRMED_AWAITING_PAYMENT;
    case 'PAID_IN_PREPARATION':
    case 'PROCESSING':
      return OrderStatus.PAID_IN_PREPARATION;
    case 'IN_TRANSIT':
    case 'SHIPPED':
      return OrderStatus.IN_TRANSIT;
    case 'DELIVERED':
      return OrderStatus.DELIVERED;
    case 'COMPLETED':
      return OrderStatus.COMPLETED;
    case 'CANCELLED':
    case 'CANCELED':
      return OrderStatus.CANCELLED;
    case 'DISPUTE':
    case 'DISPUTED':
      return OrderStatus.DISPUTE;
    case 'PENDING_VALIDATION':
    default:
      return OrderStatus.PENDING_VALIDATION;
  }
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return [OrderStatus.CANCELLED, OrderStatus.DISPUTE].includes(status);
}

/**
 * Before payment the buyer can cancel FREELY (no admin approval). Applies while
 * the order is still awaiting payment.
 */
export function canCancelDirectly(order: Order): boolean {
  if (isTerminalOrderStatus(order.status)) return false;
  return [
    OrderStatus.PENDING_VALIDATION,
    OrderStatus.CONFIRMED_AWAITING_PAYMENT,
  ].includes(order.status);
}

/**
 * Once the order is PAID (in preparation, before it ships) the buyer can only
 * REQUEST a cancellation for an admin to validate or reject. After it ships, use
 * "Report a problem" instead.
 */
export function canRequestCancellation(order: Order): boolean {
  if (isTerminalOrderStatus(order.status)) return false;
  return order.status === OrderStatus.PAID_IN_PREPARATION;
}

/**
 * Report issues from in transit onward (wrong/damaged package, delivery issues).
 * Not available before transit or after the order is completed.
 */
export function canReportProblem(order: Order): boolean {
  if (order.status === OrderStatus.DISPUTE) return false;
  return [OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED].includes(order.status);
}

/** Leave a review only after the order is fully completed. */
export function canLeaveReview(order: Order): boolean {
  return order.status === OrderStatus.COMPLETED && !order.clientReviewed;
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return [
    OrderStatus.PENDING_VALIDATION,
    OrderStatus.CONFIRMED_AWAITING_PAYMENT,
    OrderStatus.PAID_IN_PREPARATION,
    OrderStatus.IN_TRANSIT,
    OrderStatus.DELIVERED,
    OrderStatus.DISPUTE,
  ].includes(status);
}
