import { apiUpload } from './apiService';
import { API_ENDPOINTS } from '../api/endpoints';

/** POST /api/upload/avatar — requires JWT; returns public URL for User.profileImageUrl. */
export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiUpload<{ url: string }>(API_ENDPOINTS.upload.avatar, formData);
  if (!res?.url) throw new Error('Upload did not return a URL');
  return res.url;
}

/** @deprecated Use `uploadAvatar` — kept for any legacy imports. */
export const uploadFile = uploadAvatar;

export const uploadFiles = async (files: File[]): Promise<string[]> =>
  Promise.all(files.map((f) => uploadAvatar(f)));
