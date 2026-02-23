
const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url; // Returns the server URL (e.g., "/uploads/filename.jpg")
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
};

export const uploadFiles = async (files: File[]): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadFile(file));
  return Promise.all(uploadPromises);
};
