# Support Chat ↔ Admin Console Wiring

This doc describes how to connect the **support chat** (AgriBot in the main webapp) to the **admin console** so agents can handle handover conversations.

## Projects

| Project        | Path / URL |
|----------------|------------|
| Main webapp    | This repo (`webApp-AgriMarket-Connect-test`) |
| Admin console  | `AgriMarket-webapp-Console-test` (e.g. `/Users/account/Documents/ATI devops/AgriMarket-webapp-Console-test`) |
| Backend API    | Same backend as main app (e.g. `http://localhost:3000`) |

## Backend API contract

The backend must expose the following so both apps can use the same support sessions.

### Support sessions

- **`GET /api/support/sessions`** (admin only)  
  - Query: `?status=WAITING_FOR_AGENT` (optional)  
  - Returns: `{ sessionId, userId, userName?, status, lastMessage?, lastActive, unreadCount? }[]`

- **`GET /api/support/sessions/:id`**  
  - Returns one session (same shape).

- **`GET /api/support/sessions/:id/messages`**  
  - Returns: `{ id, sender: 'USER'|'AI'|'AGENT', text, timestamp }[]`

- **`POST /api/support/sessions`** (main webapp – create or get for current user)  
  - Body: `{}` or `{ userId }`  
  - Returns: session object including `sessionId`.

- **`POST /api/support/sessions/:id/messages`**  
  - Body: `{ text, sender?: 'USER'|'AI'|'AGENT' }`  
  - Used by: main webapp (user/AI) and admin console (agent).

- **`PATCH /api/support/sessions/:id`**  
  - Body: `{ status: 'AI_HANDLING'|'WAITING_FOR_AGENT'|'AGENT_ACTIVE'|'CLOSED' }`  
  - Used by: admin console (take over, close).

### AI support endpoint (existing)

- **`POST /api/ai/support-chat`**  
  - Body: `{ message, role }`  
  - Returns: `{ text, handover }`  
  - When `handover === true`, backend should create or update a support session with status `WAITING_FOR_AGENT` and persist the thread so the admin console can load it.

## Main webapp (this repo)

- **SupportChatWidget**  
  - Currently: client-only state; calls `POST /api/ai/support-chat`; on handover shows “Connecting agent…” with no real session.
- **To wire:**  
  - On first message or open: `POST /api/support/sessions` to create/get session; send user messages to `POST /api/support/sessions/:id/messages`; call AI via existing support-chat and append AI reply to session.  
  - When AI returns `handover: true`, set session status to `WAITING_FOR_AGENT` (or rely on backend to do it).  
  - Poll `GET /api/support/sessions/:id/messages` (or use WebSocket) and append messages with `sender === 'AGENT'` so the user sees agent replies.

## Admin console (`AgriMarket-webapp-Console-test`)

- **Chat Support** at `/app/chat-support`: uses mock data (`mockChatService`).
- **API client:** `src/api/supportSessions.ts` defines the support session API (list, get, get messages, send as agent, update status).
- **To wire:**  
  - Replace or augment the chat-support page so it loads conversations from `getSupportSessions()` and messages from `getSupportMessages(sessionId)`.  
  - Map `SupportSessionDto` → `Conversation` (e.g. `sessionId` → `id`, `userName` → `title`) and `SupportMessageDto` → `Message` (e.g. `sender === 'AGENT'` → `senderId === 'agent'`, `text` → `body`).  
  - On send: call `sendSupportMessageAsAgent(sessionId, text)` and append or refresh messages.  
  - Optionally call `updateSupportSessionStatus(sessionId, 'AGENT_ACTIVE')` when an agent opens a session and `'CLOSED'` when done.

## Summary

1. **Backend:** Implement support session CRUD and messages; when `POST /api/ai/support-chat` returns `handover: true`, create/update session and set `WAITING_FOR_AGENT`.  
2. **Main webapp:** Create/get session per user; send messages to session; poll (or WS) for agent messages.  
3. **Admin console:** Use `src/api/supportSessions.ts`; load sessions and messages from API; send agent replies via `sendSupportMessageAsAgent`.
