
// Frontend Service - Calls the Node.js Backend

import { apiFetch } from './apiService';
import { getToken } from './apiService';
import { API_ENDPOINTS } from '../api/endpoints';
import { sendSupportChatMessage } from '../api/endpoints/support';

/**
 * Generate a product description using AI
 */
export const generateProductDescription = async (title: string, category: string, features: string): Promise<string> => {
  try {
    const data = await apiFetch<{ text: string }>(API_ENDPOINTS.ai.generateDescription, {
      method: 'POST',
      body: JSON.stringify({ title, category, features })
    } as any);
    return data.text || "No description generated.";
  } catch (error) {
    console.error("Error calling backend:", error);
    return "Could not connect to AI server. Please ensure the backend is running.";
  }
};

/**
 * Send a support chat message to Gemini AI via the backend
 * Works for both authenticated users and guests
 * @param userMessage The user's message text
 * @param sessionId Optional support session ID for tracking/handover
 * @param guestEmail Optional email for unauthenticated users
 * @param guestName Optional name for unauthenticated users
 * @returns AI response with text, handover flag, and session ID
 */
export const generateSupportResponse = async (
  userMessage: string, 
  sessionId?: string,
  guestEmail?: string,
  guestName?: string
): Promise<{ text: string; handover: boolean; sessionId: string }> => {
  try {
    const token = getToken();
    const isAuthenticated = !!token;

    // If not authenticated, guest email must be provided
    if (!isAuthenticated && !guestEmail) {
      return {
        text: "Please log in or provide your email to access support chat.",
        handover: false,
        sessionId: ''
      };
    }

    const payload = isAuthenticated
      ? { message: userMessage, sessionId: sessionId || undefined }
      : {
          message: userMessage,
          sessionId: sessionId || undefined,
          guestEmail: guestEmail || undefined,
          guestName: guestName || undefined
        };

    const data = await sendSupportChatMessage(payload as any);
    return {
      text: data.text || "No response from AI.",
      handover: data.handover || false,
      sessionId: data.sessionId || ''
    };

  } catch (error) {
    console.error("Error calling support backend:", error);
    return {
      text: "Connection error. Please try again later.",
      handover: true,
      sessionId: ''
    };
  }
};
