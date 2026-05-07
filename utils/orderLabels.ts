import { CartItem, OfferType, Order } from '../types';

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
