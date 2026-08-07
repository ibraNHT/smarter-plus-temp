import { CartItem, MarketType, OfferType, Order } from '../types';

/**
 * ATI retail order (sold by the platform itself) rather than a marketplace order
 * sold by a producer. Retail has no seller profile behind it — the seller is ATI —
 * so producer-facing affordances (reveal contact, chat with seller) must be hidden.
 */
export function orderIsRetail(order: Pick<Order, 'items'>): boolean {
  return (order.items ?? []).some((i) => i.marketType === MarketType.ATI);
}

/**
 * Slot length in hours for an order's service line.
 *
 * OrderItem carries no serviceDuration (there is no such column), so this reads it
 * from the offer the item points at. Defaulting to 1 made the reschedule picker ask
 * for 1-hour slots on a multi-hour service — wrong grid, and the server validated
 * the wrong window.
 */
export function serviceDurationHoursForOrder(
  order: Pick<Order, 'items'>,
  offers: Array<{ id: string; serviceDuration?: number }>,
): number {
  const svc = (order.items ?? []).find((i: any) => i?.type === OfferType.SERVICE);
  const onItem = Number((svc as any)?.serviceDuration ?? 0) || 0;
  if (onItem > 0) return Math.max(1, onItem);
  const offerId = (svc as any)?.offerId ?? (svc as any)?.id;
  const offer = offerId ? offers.find((o) => o.id === offerId) : undefined;
  return Math.max(1, Number(offer?.serviceDuration ?? 1) || 1);
}

export function orderHasService(order: Pick<Order, 'items'>): boolean {
  return order.items.some((i) => i.type === OfferType.SERVICE);
}

export function orderIsServiceOnly(order: Pick<Order, 'items'>): boolean {
  return order.items.length > 0 && order.items.every((i) => i.type === OfferType.SERVICE);
}

export function serviceLineCount(order: Pick<Order, 'items'>): number {
  return order.items.filter((i) => i.type === OfferType.SERVICE).length;
}

export function serviceSlotTotal(order: Pick<Order, 'items'>): number {
  return order.items
    .filter((i) => i.type === OfferType.SERVICE)
    .reduce((sum, i) => sum + (Number(i.cartQuantity) || 0), 0);
}

export function cartHasService(cart: Pick<CartItem, 'type'>[]): boolean {
  return cart.some((i) => i.type === OfferType.SERVICE);
}
