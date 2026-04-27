import { UserRole, type Order } from '../../types';
import { API_ENDPOINTS } from '../endpoints';
import { apiGet } from '../http';

const uniqueById = <T extends { id: string }>(rows: T[]): T[] =>
  Array.from(new Map(rows.map((row) => [row.id, row])).values());

export const getRoleOrders = async (role: UserRole): Promise<Order[]> => {
  if (role === UserRole.CLIENT) {
    return apiGet<Order[]>(API_ENDPOINTS.orders.my, { silent401: true });
  }
  if (role === UserRole.PRODUCER) {
    const [producerOrders, myOrders] = await Promise.all([
      apiGet<Order[]>(API_ENDPOINTS.orders.producer, { silent401: true }),
      apiGet<Order[]>(API_ENDPOINTS.orders.my, { silent401: true }),
    ]);
    return uniqueById([...(producerOrders || []), ...(myOrders || [])]);
  }
  return [];
};
