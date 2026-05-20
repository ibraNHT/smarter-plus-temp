import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';

export type SupportChatResponse = {
  text: string;
  handover: boolean;
  sessionId: string;
};

export const supportApi = {
  async sendAiMessage(payload: { message: string; sessionId?: string }): Promise<SupportChatResponse> {
    const { data } = await apiClient.post<SupportChatResponse>(
      API_ENDPOINTS.ai.supportChat,
      payload,
      { _silent401: true },
    );
    return data;
  },
};
