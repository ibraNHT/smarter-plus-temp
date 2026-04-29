import { apiUpload } from './apiService';
import { API_ENDPOINTS } from '../client-api/endpoints';
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  type CloudinaryResource,
} from './cloudinary';

/**
 * Upload pipeline (end-to-end Cloudinary):
 *
 *   1. Browser → Cloudinary direct (unsigned preset) when VITE_CLOUDINARY_* are set.
 *   2. Otherwise, browser → API multipart route. The API itself uploads to Cloudinary
 *      (server-side signed) when CLOUDINARY_* server keys are set, else writes to local disk.
 *
 * Either way, what the database stores is the resulting absolute URL.
 */

interface UploadOptions {
  folder?: string;
  resourceType?: CloudinaryResource;
  onProgress?: (progress: number) => void;
  /** API route to use when direct-to-Cloudinary is not available. */
  backendPath: string;
}

async function uploadViaBackend(file: File, path: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiUpload<{ url: string }>(path, formData);
  if (!res?.url) {
    throw new Error('Upload did not return a URL.');
  }
  return res.url;
}

async function uploadAsset(file: File, options: UploadOptions): Promise<string> {
  if (isCloudinaryConfigured()) {
    try {
      const result = await uploadToCloudinary(file, options);
      return result.url;
    } catch (err) {
      // If the unsigned preset rejects (bad config / wrong folder rules),
      // fall through to the API so the user isn't blocked.
      console.warn(
        '[upload] Cloudinary direct upload failed, falling back to API:',
        err,
      );
    }
  }
  return uploadViaBackend(file, options.backendPath);
}

/** User avatars / profile pictures (producer + client). */
export const uploadAvatar = (file: File): Promise<string> =>
  uploadAsset(file, { folder: 'agrimarket/avatars', backendPath: API_ENDPOINTS.upload.avatar });

/** Offer (product/service) hero images. */
export const uploadOfferImage = (file: File): Promise<string> =>
  uploadAsset(file, { folder: 'agrimarket/offers', backendPath: API_ENDPOINTS.upload.offerImage });

/** Producer portfolio images (gallery). */
export const uploadPortfolioImage = (file: File): Promise<string> =>
  uploadAsset(file, { folder: 'agrimarket/portfolio', backendPath: API_ENDPOINTS.upload.portfolioImage });

/** Producer portfolio videos. */
export const uploadPortfolioVideo = (file: File): Promise<string> =>
  uploadAsset(file, {
    folder: 'agrimarket/portfolio',
    resourceType: 'video',
    backendPath: API_ENDPOINTS.upload.portfolioVideo,
  });

/**
 * Tax clearance / certification documents (image or PDF).
 * Pre-login flows (e.g. RegisterProducer tax cert) MUST have Cloudinary configured
 * because the API `/api/upload/evidence` route is JWT-protected.
 */
export const uploadDocument = (file: File): Promise<string> => {
  const isImage = file.type.startsWith('image/');
  return uploadAsset(file, {
    folder: 'agrimarket/documents',
    resourceType: isImage ? 'image' : 'raw',
    backendPath: API_ENDPOINTS.upload.evidence,
  });
};

/** @deprecated Use `uploadAvatar` — kept for any legacy imports. */
export const uploadFile = uploadAvatar;

export const uploadFiles = async (files: File[]): Promise<string[]> =>
  Promise.all(files.map((f) => uploadAvatar(f)));
