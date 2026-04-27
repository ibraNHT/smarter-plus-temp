import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../../services/storeContext';
import type { ClientProfile } from '../../types';

export function useUpdateClientProfileMutation() {
  const { updateClientProfile } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile', 'client', 'update'],
    mutationFn: (client: ClientProfile) => updateClientProfile(client),
    onSettled: (ok, _err, variables) => {
      if (import.meta.env.DEV) {
        if (ok) {
          console.info('[AgriMarket] client profile saved', { clientId: variables.id });
        } else {
          console.warn('[AgriMarket] client profile save failed', { clientId: variables.id });
        }
      }
    },
    onSuccess: (ok) => {
      if (ok) {
        void queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
    },
  });
}
