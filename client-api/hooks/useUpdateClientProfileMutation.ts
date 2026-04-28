import { useMutation } from '@tanstack/react-query';
import { ClientProfile } from '../../types';
import { useStore } from '../../services/storeContext';

export const useUpdateClientProfileMutation = () => {
  const { updateClientProfile } = useStore();
  return useMutation<boolean, Error, ClientProfile>({
    mutationKey: ['client-profile', 'update'],
    mutationFn: async (payload: ClientProfile) => updateClientProfile(payload),
  });
};

