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
 * Per spec: ANY order that is not in transit can be cancelled, subject to
 * administrator approval. This includes freshly placed orders. In-transit and
 * terminal (cancelled / dispute / completed) orders cannot be cancelled — a
 * delivered order is handled via "Report an issue" during settlement instead.
 */
export function canRequestCancellation(order: Order): boolean {
  if (order.status === OrderStatus.IN_TRANSIT) return false;
  if (isTerminalOrderStatus(order.status)) return false;
  if (order.status === OrderStatus.COMPLETED) return false;
  return [
    OrderStatus.PENDING_VALIDATION,
    OrderStatus.CONFIRMED_AWAITING_PAYMENT,
    OrderStatus.PAID_IN_PREPARATION,
    OrderStatus.DELIVERED,
  ].includes(order.status);
}

/**
 * Report issues while the order is in transit (wrong/damaged package) or after
 * delivery while awaiting customer confirmation. Not available once COMPLETED.
 */
export function canReportProblem(order: Order): boolean {
  if (order.status === OrderStatus.DISPUTE) return false;
  return [OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED].includes(order.status);
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
