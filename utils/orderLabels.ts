import { CartItem, MarketType, OfferType, Order } from '../types';

/**
 * ATI retail order (sold by the platform itself) rather than a marketplace order
 * sold by a producer. Retail has no seller profile behind it — the seller is ATI —
 * so producer-facing affordances (reveal contact, chat with seller) must be hidden.
 */
export function orderIsRetail(order: Pick<Order, 'items'>): boolean {
  return (order.items ?? []).some((i) => i.marketType === MarketType.ATI);
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
