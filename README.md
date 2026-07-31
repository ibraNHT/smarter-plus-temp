# ATI-smarter-panel-frontend

Front end smarter panel.

## Run Locally

**Prerequisites:** Node.js, and the Smarter Panel backend API running (default `http://127.0.0.1:3000`; see sibling repo `ATI-smarter-panel-backend`).

1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local`.
   - **Recommended:** Do **not** set `VITE_API_URL` or `VITE_UPLOAD_API_URL`. The app then uses your dev origin (`http://127.0.0.1:5173`) and [Vite proxies](vite.config.ts) `/api`, `/upload`, and `/uploads` to the backend—no CORS setup needed.
   - **Optional:** Set `VITE_API_URL` to the API base (e.g. `http://localhost:3000/api`) and `VITE_UPLOAD_API_URL` to the API root (e.g. `http://localhost:3000`) if you want the browser to call the API directly; the backend must allow your origin via `FRONTEND_ORIGIN`.
3. Run the app:
   `npm run dev`  
   Open `http://127.0.0.1:5173` (matches Vite `host`).
