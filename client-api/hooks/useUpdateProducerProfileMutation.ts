import { useMutation } from '@tanstack/react-query';
import { ProducerProfile } from '../../types';
import { useStore } from '../../services/storeContext';

type UpdateProducerArgs = {
  producer: ProducerProfile;
  otpToken?: string;
};

export const useUpdateProducerProfileMutation = () => {
  const { updateProducerProfile } = useStore();
  return useMutation<boolean, Error, UpdateProducerArgs>({
    mutationKey: ['producer-profile', 'update'],
    mutationFn: async ({ producer, otpToken }: UpdateProducerArgs) =>
      updateProducerProfile(producer, otpToken),
  });
};

