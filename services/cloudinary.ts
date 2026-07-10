/**
 * Cloudinary direct (unsigned) upload helper.
 *
 * The browser uploads files straight to Cloudinary using an *unsigned* upload preset.
 * That avoids exposing the API secret and keeps the backend out of the file path.
 *
 * Required env vars (Vite, in `.env`):
 *   - VITE_CLOUDINARY_CLOUD_NAME
 *   - VITE_CLOUDINARY_UPLOAD_PRESET   (must be an *unsigned* preset)
 *
 * To create an unsigned preset:
 *   Cloudinary Dashboard → Settings → Upload → Add upload preset
 *   Signing Mode: Unsigned. Optionally lock it to a `Folder` and `Allowed formats`.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export type CloudinaryResource = "image" | "video" | "raw" | "auto";
//sadasdasdasdasdas
export interface CloudinaryUploadResult {
  /** Permanent HTTPS URL — store this on the resource. */
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export const isCloudinaryConfigured = (): boolean =>
  Boolean(CLOUD_NAME && UPLOAD_PRESET);

/** Returns "image" for image/*, "video" for video/*, "raw" for everything else (PDFs, etc.). */
export const inferCloudinaryResource = (file: File): CloudinaryResource => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "raw";
};

export interface UploadToCloudinaryOptions {
  /** Logical folder under your Cloudinary account (e.g. `agrimarket/avatars`). */
  folder?: string;
  /** Override resource type. Defaults to inference from MIME type. */
  resourceType?: CloudinaryResource;
  /** Optional progress callback (0–1). */
  onProgress?: (progress: number) => void;
  /** Optional comma-separated tags applied to the asset on Cloudinary. */
  tags?: string;
}

/** Uploads `file` straight to Cloudinary; throws if unconfigured or rejected. */
export async function uploadToCloudinary(
  file: File,
  options: UploadToCloudinaryOptions = {},
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.",
    );
  }
  const resourceType = options.resourceType ?? inferCloudinaryResource(file);
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  if (options.folder) {
    // `folder` = fixed-folder mode; `asset_folder` = dynamic-folder mode (the
    // default for newer Cloudinary accounts, where `folder` alone does NOT set
    // the Media Library folder). Send both so the asset nests in its subfolder
    // (e.g. agrimarket/staging/avatars) instead of the environment root.
    form.append("folder", options.folder);
    form.append("asset_folder", options.folder);
  }
  if (options.tags) form.append("tags", options.tags);

  // Use XHR when a progress callback is provided; otherwise fetch is fine.
  const data = options.onProgress
    ? await xhrUpload(url, form, options.onProgress)
    : await fetchUpload(url, form);

  if (!data?.secure_url) {
    throw new Error("Cloudinary did not return a URL for the uploaded file.");
  }
  return {
    url: String(data.secure_url),
    publicId: String(data.public_id ?? ""),
    resourceType: String(data.resource_type ?? resourceType),
    bytes: Number(data.bytes ?? 0),
    format: data.format ? String(data.format) : undefined,
    width: data.width != null ? Number(data.width) : undefined,
    height: data.height != null ? Number(data.height) : undefined,
    duration: data.duration != null ? Number(data.duration) : undefined,
  };
}

async function fetchUpload(url: string, form: FormData): Promise<any> {
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    let message = `Cloudinary upload failed (HTTP ${res.status})`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = String(body.error.message);
    } catch {
      // not JSON, keep default
    }
    throw new Error(message);
  }
  return res.json();
}

function xhrUpload(
  url: string,
  form: FormData,
  onProgress: (progress: number) => void,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) onProgress(evt.loaded / evt.total);
    };
    xhr.onload = () => {
      try {
        const body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(body);
        } else {
          reject(new Error(body?.error?.message ?? `Cloudinary upload failed (HTTP ${xhr.status})`));
        }
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Cloudinary upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading to Cloudinary"));
    xhr.send(form);
  });
}
