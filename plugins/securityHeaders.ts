import type { Plugin } from 'vite';

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

export function securityHeadersPlugin(): Plugin {
  return {
    name: 'security-headers',
    // Only apply in preview (production build). In dev, Vite injects inline scripts (HMR, etc.)
    // and strict CSP (script-src 'self') would block them and break the app.
    apply: 'serve',
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        Object.entries(securityHeaders).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        next();
      });
    },
  };
}
