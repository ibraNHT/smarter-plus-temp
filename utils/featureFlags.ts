// Build-time feature flags driven by Vite env vars (VITE_*). These are inlined
// at build time, so each environment's image is built with its own flag values.
//
// Payments (wallet top-up / "Pay Now") are enabled by default and turned OFF in
// production by setting VITE_PAYMENTS_ENABLED=false at build time. Staging keeps
// them ON. The backend enforces the same gate via PAYMENTS_ENABLED.

const flag = (value: unknown, fallback: boolean): boolean => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() !== "false";
};

export const PAYMENTS_ENABLED = flag(
  import.meta.env.VITE_PAYMENTS_ENABLED,
  true,
);
