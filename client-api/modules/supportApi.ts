import { API_ENDPOINTS } from '../endpoints';
import { apiPost } from '../http';

export type SupportChatResponse = {
  text: string;
  handover: boolean;
  sessionId: string;
};

export const supportApi = {
  async sendAiMessage(payload: { message: string; sessionId?: string }): Promise<SupportChatResponse> {
    return apiPost<SupportChatResponse>(API_ENDPOINTS.ai.supportChat, payload, { silent401: true });
  },
};
