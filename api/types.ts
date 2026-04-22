export type ApiError = Error & { status?: number; body?: unknown };

export type ApiRequestOptions = {
  headers?: Record<string, string | number | boolean>;
  silent401?: boolean;
};
