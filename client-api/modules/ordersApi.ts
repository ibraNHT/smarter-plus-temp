import { API_ENDPOINTS } from '../endpoints';
import { apiGet } from '../http';
import { UserRole, type Order, type UserSession } from '../../types';

const uniqueById = <T extends { id: string }>(rows: T[]): T[] =>
  Array.from(new Map(rows.map((row) => [row.id, row])).values());

export const ordersApi = {
  async listForUser(user: UserSession): Promise<Order[]> {
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
  },
};
