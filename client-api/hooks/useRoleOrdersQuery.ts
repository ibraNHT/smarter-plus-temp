import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../modules/ordersApi';
import { useSessionStore } from '../../stores/sessionStore';

export const useRoleOrdersQuery = () => {
  const user = useSessionStore((s) => s.user);
  return useQuery({
    queryKey: ['orders', user?.id, user?.role],
    enabled: Boolean(user?.role),
    queryFn: () => ordersApi.listForRole(user!.role),
  });
};
