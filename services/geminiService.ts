
// Frontend Service - Calls the Node.js Backend

import { apiFetch } from './apiService';
import { getToken } from './apiService';

/**
 * Generate a product description using AI
 */
export const generateProductDescription = async (title: string, category: string, features: string): Promise<string> => {
  try {
    const data = await apiFetch<{ text: string }>('/api/ai/generate-description', {
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

    // Use apiFetch for authenticated users (handles JWT, token refresh, etc.)
    if (isAuthenticated) {
      const data = await apiFetch<{ text: string; handover: boolean; sessionId: string }>(
        '/api/ai/support-chat',
        {
          method: 'POST',
          body: JSON.stringify({
            message: userMessage,
            sessionId: sessionId || undefined
          })
        } as any
      );

      return {
        text: data.text || "No response from AI.",
        handover: data.handover || false,
        sessionId: data.sessionId || ''
      };
    }

    // For guests, use raw fetch (no authentication needed)
    const baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');
    const response = await fetch(`${baseURL}/api/ai/support-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        sessionId: sessionId || undefined,
        guestEmail: guestEmail || undefined,
        guestName: guestName || undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Support chat error: ${response.status}`, errorData);
      return {
        text: "Support server is currently unreachable.",
        handover: true,
        sessionId: ''
      };
    }

    const data = await response.json();
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
