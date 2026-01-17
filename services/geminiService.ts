
// Frontend Service - Calls the Node.js Backend

// If hosted separately, this will be 'https://your-backend.com'. 
// If hosted together, this is empty string '' and uses relative paths.
const BASE_URL = process.env.BACKEND_URL || '';

export const generateProductDescription = async (title: string, category: string, features: string): Promise<string> => {
  try {
    const response = await fetch(`${BASE_URL}/api/ai/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, features })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.text || "No description generated.";
  } catch (error) {
    console.error("Error calling backend:", error);
    return "Could not connect to AI server. Please ensure the backend is running.";
  }
};

export const generateSupportResponse = async (userMessage: string, contextRole: string): Promise<{text: string, handover: boolean}> => {
  try {
    const response = await fetch(`${BASE_URL}/api/ai/support-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, role: contextRole })
    });

    if (!response.ok) {
      return { text: "Support server is currently unreachable.", handover: true };
    }

    const data = await response.json();
    return {
      text: data.text,
      handover: data.handover
    };

  } catch (error) {
    console.error("Error calling support backend:", error);
    return { text: "Connection error. Please try again later.", handover: true };
  }
};
