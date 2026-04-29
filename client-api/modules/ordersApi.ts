import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { UserRole, type Order, type UserSession } from '../../types';

const uniqueById = <T extends { id: string }>(rows: T[]): T[] =>
  Array.from(new Map(rows.map((row) => [row.id, row])).values());

const silent = { 'x-silent-401': true } as const;

export const ordersApi = {
  async listForUser(user: UserSession): Promise<Order[]> {
    if (user.role === UserRole.CLIENT) {
      const { data } = await apiClient.get<Order[]>(API_ENDPOINTS.orders.my, { headers: silent });
      return data;
    }
    if (user.role === UserRole.PRODUCER) {
      if (user.clientId) {
        const [producer, my] = await Promise.all([
          apiClient.get<Order[]>(API_ENDPOINTS.orders.producer, { headers: silent }),
          apiClient.get<Order[]>(API_ENDPOINTS.orders.my, { headers: silent }),
        ]);
        return uniqueById([...(producer.data || []), ...(my.data || [])]);
      }
      const { data } = await apiClient.get<Order[]>(API_ENDPOINTS.orders.producer, { headers: silent });
      return data || [];
    }
    return [];
  },
};
