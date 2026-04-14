# AgriMarket Connect — WebApp (marketplace)

React + Vite frontend for **guests, clients, and producers**. It talks to the **AgriMarket backend** over `/api` (proxied in development).

---

## Prerequisites

- Node.js 18+ (20+ recommended)
- Backend running (default `http://localhost:3000`) — see `../backend/README.md`

---

## Install & run

```bash
cd "WebApp Repo "
yarn install
yarn dev
```

Default Vite port is **5173** unless changed. The app uses **HashRouter** (`/#/route`).

---

## Environment

- `VITE_API_BASE_URL` — Optional. In dev, empty string is typical so requests stay same-origin and Vite **proxies** `/api` to the backend (see `vite.config.ts`).

---

## Role policy

| Session | Supported |
|---------|-----------|
| Guest (no JWT) | Yes — browse markets, register |
| `CLIENT` | Yes |
| `PRODUCER` | Yes |
| `SUPER_ADMIN`, `ADMIN`, `RETAIL_ADMIN`, `MANAGER` | **No** — use Admin Panel / Retail-admin |

Implementation:

- `src/services/authRoles.ts` — JWT role decode, normalization, `isWebAppSessionBlocked`
- `src/services/storeContext.ts` — Session establishment and cleanup for disallowed roles
- `src/App.tsx` — `RoleScopeBoundary` blocks staff sessions
- `src/components/Navbar.tsx` — Minimal chrome + logout when blocked

---

## Main features (API-backed where integrated)

- Producer market & ATI store, product detail, compare, cart, orders
- Client & producer profiles (producers can have a **buyer** client profile for checkout)
- Wallet, withdrawals (as wired to backend)
- Messaging / negotiation, support chat widget
- Referrals (when `GET /api/users/me/referrals` and related routes are available)
- PWA install hints

---

## API client behavior

`src/services/apiService.ts`:

- Sends `Authorization: Bearer <accessToken>` when present
- On **401**, attempts **one** refresh via refresh token, then retries (including many `silent401` calls)
- Redirects to home only when appropriate for non-silent flows

---

## Build

```bash
yarn build
```

Runs `tsc` then `vite build`.

---

## Related docs

- Monorepo: `../README.md`
- Platform & changelog-style notes: `../docs/PLATFORM-OVERVIEW.md`
- Backend: `../backend/README.md`
