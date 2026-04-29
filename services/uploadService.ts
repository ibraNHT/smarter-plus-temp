import { apiUpload } from './apiService';
import { API_ENDPOINTS } from '../client-api/endpoints';
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  type CloudinaryResource,
} from './cloudinary';

/**
 * Default upload path: Cloudinary (browser-direct) when configured, otherwise the
 * legacy `/api/upload/avatar` endpoint that stores files locally on the API.
 */
async function uploadViaBackend(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiUpload<{ url: string }>(API_ENDPOINTS.upload.avatar, formData);
  if (!res?.url) throw new Error('Upload did not return a URL');
  return res.url;
}

interface UploadOptions {
  folder?: string;
  resourceType?: CloudinaryResource;
  onProgress?: (progress: number) => void;
}

async function uploadAsset(file: File, options: UploadOptions): Promise<string> {
  if (isCloudinaryConfigured()) {
    const result = await uploadToCloudinary(file, options);
    return result.url;
  }
  return uploadViaBackend(file);
}

/** User avatars / profile pictures (producer + client). */
export const uploadAvatar = (file: File): Promise<string> =>
  uploadAsset(file, { folder: 'agrimarket/avatars' });

/** Offer (product/service) hero images. */
export const uploadOfferImage = (file: File): Promise<string> =>
  uploadAsset(file, { folder: 'agrimarket/offers' });

/** Producer portfolio images (gallery). */
export const uploadPortfolioImage = (file: File): Promise<string> =>
  uploadAsset(file, { folder: 'agrimarket/portfolio' });

/** Producer portfolio videos. */
export const uploadPortfolioVideo = (file: File): Promise<string> =>
  uploadAsset(file, { folder: 'agrimarket/portfolio', resourceType: 'video' });

/** Tax clearance / certification documents (image or PDF). */
export const uploadDocument = (file: File): Promise<string> => {
  const isImage = file.type.startsWith('image/');
  return uploadAsset(file, {
    folder: 'agrimarket/documents',
    resourceType: isImage ? 'image' : 'raw',
  });
};

/** @deprecated Use `uploadAvatar` — kept for any legacy imports. */
export const uploadFile = uploadAvatar;

export const uploadFiles = async (files: File[]): Promise<string[]> =>
  Promise.all(files.map((f) => uploadAvatar(f)));
