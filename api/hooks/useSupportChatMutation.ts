import { useMutation } from '@tanstack/react-query';
import { supportApi } from '../modules/supportApi';

export const useSupportChatMutation = () =>
  useMutation({
    mutationKey: ['support-chat', 'send'],
    mutationFn: supportApi.sendAiMessage,
  });
