import { UserRole, type Order, type UserSession } from '../../types';
import { API_ENDPOINTS } from '../endpoints';
import { apiGet } from '../http';
import { isProducerDashboardUser } from '../../services/producerSession';

const uniqueById = <T extends { id: string }>(rows: T[]): T[] =>
  Array.from(new Map(rows.map((row) => [row.id, row])).values());

/**
 * Fetches order lists for the session. Producers are both seller and buyer, so they always
 * fetch their selling orders (`/orders/producer`) AND their buyer orders (`/orders/my-orders`).
 * The buyer endpoint returns 403 until a client profile exists; with `silent401` the failed
 * call resolves to [], so purchases appear as soon as the producer has a buyer profile even
 * before `user.clientId` is synced onto the session.
 */
export const getRoleOrders = async (user: UserSession): Promise<Order[]> => {
  if (user.role === UserRole.CLIENT) {
    return apiGet<Order[]>(API_ENDPOINTS.orders.my, { silent401: true });
  }
  if (isProducerDashboardUser(user)) {
    const [producerOrders, myOrders] = await Promise.all([
      apiGet<Order[]>(API_ENDPOINTS.orders.producer, { silent401: true }).catch(() => [] as Order[]),
      apiGet<Order[]>(API_ENDPOINTS.orders.my, { silent401: true }).catch(() => [] as Order[]),
    ]);
    return uniqueById([...(producerOrders || []), ...(myOrders || [])]);
  }
  return [];
};
