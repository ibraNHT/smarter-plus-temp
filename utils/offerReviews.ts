import type { Order, Review } from '../types';

function orderContainsOffer(order: Order, offerId: string): boolean {
  return (order.items || []).some(
    (item) => (item.id || (item as { offerId?: string }).offerId) === offerId,
  );
}

/** Reviews left on orders that included this offer (ATI retail / per-product ratings). */
export function getReviewsForOffer(
  offerId: string,
  reviews: Review[],
  orders: Order[],
): Review[] {
  const orderIds = new Set(
    orders.filter((o) => orderContainsOffer(o, offerId)).map((o) => o.id),
  );
  return reviews
    .filter((r) => orderIds.has(r.orderId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAverageRatingFromReviews(reviewList: Review[]): number {
  if (!reviewList.length) return 0;
  return parseFloat(
    (reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length).toFixed(1),
  );
}
