import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { UserRole, type Order } from '../../types';

const uniqueById = <T extends { id: string }>(rows: T[]): T[] =>
  Array.from(new Map(rows.map((row) => [row.id, row])).values());

export const ordersApi = {
  async listForRole(role: UserRole): Promise<Order[]> {
    if (role === UserRole.CLIENT) {
      const { data } = await apiClient.get<Order[]>(API_ENDPOINTS.orders.my, {
        headers: { 'x-silent-401': true },
      });
      return data;
    }
    if (role === UserRole.PRODUCER) {
      const [producer, my] = await Promise.all([
        apiClient.get<Order[]>(API_ENDPOINTS.orders.producer, { headers: { 'x-silent-401': true } }),
        apiClient.get<Order[]>(API_ENDPOINTS.orders.my, { headers: { 'x-silent-401': true } }),
      ]);
      return uniqueById([...(producer.data || []), ...(my.data || [])]);
    }
    return [];
  },
};
