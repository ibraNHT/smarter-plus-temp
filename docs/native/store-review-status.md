# Store review status (plain notes)

Apple and Google will look at three things together: the app you upload, the live API that app talks to, and the forms in App Store Connect / Play Console. This repo is the web/native client. The API is **`API-AgriMarket-Connect`**.

Related files:

- [backend-cors-and-account-deletion.md](./backend-cors-and-account-deletion.md) — API contract and probe results
- [store-console-checklist.md](./store-console-checklist.md) — what to type into the consoles
- [store-reviewer-notes.md](./store-reviewer-notes.md) — text to paste for App Review / Play

## Do not submit until the API is deployed

The in-app **Delete account** button calls `DELETE /api/auth/account`. The route is **implemented in the Nest repo**. Staging and production still answered **404** on 17 Aug 2026 (this client change is not live until you deploy the API). Reviewers will try it. If it 404s, the listing is rejected.

Socket.IO CORS for native origins is also implemented in that API repo. Live `OPTIONS /socket.io` still omits `Access-Control-Allow-Origin` until deploy.

Play **web** deletion URL (this SPA): `https://acheteici.com/account-deletion` after website deploy. Paste that in Play Data safety. It does not replace the DELETE API.

## What this frontend work already changed

- Android no longer asks for full gallery access. Photo uploads use the system picker.
- iOS includes a privacy manifest, `arm64` only, **iPhone-only** first release.
- Report/block on chat, public profiles, and offer pages.
- Support chat requires a **Google Gemini** consent checkbox before the first send.

## What must happen next

1. Deploy **`API-AgriMarket-Connect`** (account delete + Socket.IO CORS) to staging, then production.
2. Re-probe: unauthenticated `DELETE /api/auth/account` → **401** (not 404); Socket.IO OPTIONS with `Origin: capacitor://localhost` includes `Access-Control-Allow-Origin: capacitor://localhost`.
3. Deploy the website so `/account-deletion` is live on acheteici.com.
4. Fill Play Data safety / Apple Privacy Nutrition Labels, rate **17+**, bake production `VITE_API_BASE_URL` into the store binary, put working reviewer logins in the notes.

## Residual reviewer risk

Even after the API is live, two judgments are still up to the reviewer:

- Apple treating a Capacitor app as a “repackaged website” (guideline **4.2**)
- Apple treating the wallet as digital currency instead of payment for physical farm goods (**3.1.3(e)**)

Code cannot make those 100% safe.
