import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../../services/storeContext';
import type { ProducerProfile } from '../../types';

export type UpdateProducerProfileVariables = {
  producer: ProducerProfile;
  otpToken?: string;
};

export function useUpdateProducerProfileMutation() {
  const { updateProducerProfile } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile', 'producer', 'update'],
    mutationFn: ({ producer, otpToken }: UpdateProducerProfileVariables) =>
      updateProducerProfile(producer, otpToken),
    onSettled: (ok, _err, variables) => {
      if (import.meta.env.DEV) {
        if (ok) {
          console.info('[AgriMarket] producer profile saved', {
            producerId: variables.producer.id,
            otp: Boolean(variables.otpToken),
          });
        } else {
          console.warn('[AgriMarket] producer profile save failed', {
            producerId: variables.producer.id,
          });
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
