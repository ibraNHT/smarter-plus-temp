import { API_ENDPOINTS } from '../endpoints';
import { apiPost } from '../http';

export type SupportChatResponse = {
  text: string;
  handover: boolean;
  sessionId: string;
};

export const sendSupportChatMessage = (payload: { message: string; sessionId?: string; guestEmail?: string; guestName?: string }) =>
  apiPost<SupportChatResponse>(API_ENDPOINTS.ai.supportChat, payload, { silent401: true });
