/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TWITTER_HANDLE?: string;
  readonly VITE_FACEBOOK_URL?: string;
  readonly VITE_LINKEDIN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
