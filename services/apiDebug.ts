/**
 * Centralized API error logging. In production, avoid spamming the console for
 * expected failures (401 on background polls, validation errors, etc.).
 */
const shouldLog = (): boolean =>
  import.meta.env.DEV || import.meta.env.VITE_DEBUG_API === "true";

export function logApiFailure(context: string, err: unknown): void {
  if (shouldLog()) {
    console.warn(context, err);
  }
}

export function logApiWarn(context: string, err: unknown): void {
  if (shouldLog()) {
    console.warn(context, err);
  }
}
