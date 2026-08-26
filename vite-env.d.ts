/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TWITTER_HANDLE?: string;
  readonly VITE_FACEBOOK_URL?: string;
  readonly VITE_LINKEDIN_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_NATIVE?: string;
  readonly VITE_WEB_ORIGIN?: string;
  readonly VITE_PAYMENTS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
