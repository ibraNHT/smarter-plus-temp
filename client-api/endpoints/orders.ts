import { UserRole, type Order, type UserSession } from '../../types';
import { API_ENDPOINTS } from '../endpoints';
import { apiGet } from '../http';

const uniqueById = <T extends { id: string }>(rows: T[]): T[] =>
  Array.from(new Map(rows.map((row) => [row.id, row])).values());

/**
 * Fetches order lists for the session. Producers only call `GET /orders/my-orders` when
 * `user.clientId` is set, otherwise the backend returns 403 (no client profile).
 */
export const getRoleOrders = async (user: UserSession): Promise<Order[]> => {
  if (user.role === UserRole.CLIENT) {
    return apiGet<Order[]>(API_ENDPOINTS.orders.my, { silent401: true });
  }
  if (user.role === UserRole.PRODUCER) {
    if (user.clientId) {
      const [producerOrders, myOrders] = await Promise.all([
        apiGet<Order[]>(API_ENDPOINTS.orders.producer, { silent401: true }),
        apiGet<Order[]>(API_ENDPOINTS.orders.my, { silent401: true }),
      ]);
      return uniqueById([...(producerOrders || []), ...(myOrders || [])]);
    }
    return apiGet<Order[]>(API_ENDPOINTS.orders.producer, { silent401: true });
  }
  return [];
};
