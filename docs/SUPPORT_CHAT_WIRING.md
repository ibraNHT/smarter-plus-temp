# Support Chat ↔ Admin Console Wiring

This doc describes how the **main webapp** support widget connects to the **Nest API** and the **admin console**.

## Projects

| Project        | Path / URL |
|----------------|------------|
| Main webapp    | This repo (`webApp-AgriMarket-Connect-test`) |
| Admin console  | `AgriMarket-webapp-Console-test` (e.g. Chat Support at `/app/chat-support`) |
| Backend API    | `API-AgriMarket-Connect-test` (e.g. `http://localhost:3000`, global `/api` prefix) |

## Backend API (support)

| Endpoint | Who | Purpose |
|----------|-----|---------|
| `POST /api/ai/support-chat` | User or guest | AI turn; persists USER + AI messages via support session; may set `WAITING_FOR_AGENT` on handover. |
| `POST /api/support/sessions` | JWT user | Create or get session for current user. |
| `GET /api/support/sessions/:id/messages` | JWT user (owner) or admin | List messages (internal notes omitted for non-admin). |
| `POST /api/support/sessions/:id/messages` | JWT user (owner) or admin | Send message; users send `{ text }`. |
| `GET /api/support/guest/sessions/:id/messages?guestEmail=` | Public | Guest poll (internal messages filtered). |
| `POST /api/support/guest/sessions/:id/messages` | Public | Guest post-handover user message; body `{ text, guestEmail }` must match session. |
| Admin-only | Admin JWT | `GET .../overview`, `POST .../assign-to-me`, `PATCH ...` with assign/priority, agent internal notes, etc. |

## Main webapp (this repo)

### Client module

- [`services/supportSessionsApi.ts`](../services/supportSessionsApi.ts) — `createOrGetSupportSession`, `getSupportMessages` (auth poll, fetch-based to avoid logout on 401), `postUserSupportMessage`, `postGuestSupportMessage`, `mergeIncomingSupportMessages`, `mapDtoToSupportMessage`.

### State (`storeContext.tsx`)

1. **Before handover** — `sendSupportMessage` calls `POST /api/ai/support-chat` via [`services/geminiService.ts`](../services/geminiService.ts) (`generateSupportResponse`); stores `supportSessionId` from the response; shows AI reply and optional handover UI.
2. **After handover** — User messages are sent with **`POST /api/support/sessions/:id/messages`** (authenticated) or **`POST /api/support/guest/sessions/:id/messages`** (guest). **No** further AI calls for those messages.
3. **Polling** — Guests: `GET .../guest/sessions/:id/messages`. Authenticated users: `GET .../api/support/sessions/:id/messages` every 3s to receive **AGENT** replies. New messages are merged by `id`.

### UI

- [`components/SupportChatWidget.tsx`](../components/SupportChatWidget.tsx) — reads `supportMessages` + `sendSupportMessage` from context.

### Types

- [`types.ts`](../types.ts) — `SupportMessage` (optional `internal`), `SupportSession` (optional `priority`, `assignedToUserId`) for parity with API DTOs.

## Admin console

Uses its own `src/api/supportSessions.ts` and `src/api/ticketing.ts` (list, messages, agent send, PATCH, assign-to-me, overview, internal notes). Same `sessionId` as the webapp thread.

## Summary

1. **AI path** creates and fills the session; **handover** switches the widget to **REST support** messages + polling.
2. **Guests** after handover use **guest** GET/POST endpoints (no JWT).
3. **Authenticated users** after handover use **JWT** GET/POST on `/api/support/sessions/...`.
