import type { Offer } from '../types';

/** Upper bound the buyer may order (stock and optional max per order). */
export function maxOrderableUnits(offer: Offer): number {
  const stock = Math.max(0, Math.floor(Number(offer.quantity) || 0));
  let cap = stock;
  if (offer.maxQuantity != null && Number(offer.maxQuantity) > 0) {
    cap = Math.min(cap, Math.floor(Number(offer.maxQuantity)));
  }
  return Math.max(0, cap);
}

/**
 * When min order equals listed stock, listings often meant "min 1" but duplicated stock into min.
 * Keeps real B2B mins where min < stock.
 */
export function effectiveMinOrder(offer: Offer): number {
  let minQ = Math.max(1, Math.floor(Number(offer.minQuantity) || 1));
  const stock = Math.max(0, Math.floor(Number(offer.quantity) || 0));
  if (stock > 1 && minQ === stock) {
    minQ = 1;
  }
  return minQ;
}

/**
 * One-click add from compare: prefer a single unit, but never below minimum order or above stock caps.
 * Aligns with marketplace "add one" expectations; Product Details still allows raising quantity before add.
 */
export function comparePageAddQuantity(offer: Offer): number {
  const minQ = effectiveMinOrder(offer);
  const maxO = maxOrderableUnits(offer);
  let qty = minQ <= 1 ? 1 : minQ;
  if (maxO > 0 && qty > maxO) qty = maxO;
  return Math.max(1, qty);
}
