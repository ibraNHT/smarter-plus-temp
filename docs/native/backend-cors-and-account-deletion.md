# Backend changes required for Capacitor store apps

The React web app is wrapped with Capacitor. REST calls on device use official **CapacitorHttp** (`capacitor.config.ts` → `plugins.CapacitorHttp.enabled: true`), which bypasses WebView CORS.

**Socket.IO still uses the WebView**, so the API must allow the native WebView origins.

Implementation lives in the Nest repo **`API-AgriMarket-Connect`** (not this web app). After that code is **deployed** to staging and production, re-run the probes below. Until then, live APIs still behave as in the 17 Aug 2026 table.

## Probe results

Unauthenticated `DELETE` should become **401** (route exists) once deployed, not 404.

| Check | Staging (`api.staging.acheteici.com`) | Production (`api.acheteici.com`) |
|---|---|---|
| `OPTIONS DELETE /api/auth/account` with `Origin: capacitor://localhost` | **204**, `Access-Control-Allow-Origin: capacitor://localhost` (17 Aug 2026) | same |
| `DELETE /api/auth/account` (unauthenticated) | **404** until `API-AgriMarket-Connect` is deployed; then **401** | same |
| `OPTIONS /socket.io` with `Origin: capacitor://localhost` | **204** with credentials/methods; **missing `Access-Control-Allow-Origin` until deploy** | same |

Play also needs a prominent **web** deletion URL. This repo serves **https://acheteici.com/account-deletion** (and `/account-deletion` on staging after web deploy). Paste that exact URL in Play Data safety. It does not replace the live DELETE endpoint.

## CORS allowlist

REST and Socket.IO now share `isAllowedCorsOrigin()` in the API repo (`src/common/cors-origin.ts`). That helper always allows:

| Origin | Why |
|---|---|
| `capacitor://localhost` | iOS WKWebView default scheme |
| `https://localhost` | Android `server.androidScheme: https` + `hostname: localhost` |
| `http://localhost` | Fallback if Android scheme is ever `http` |
| any `localhost` / `127.0.0.1` host | Local tooling |

Keep website hosts in `CORS_ORIGIN` (and `CORS_CREDENTIALS=true`). Socket.IO `cors.origin` must use the same callback — a static website-only list is what omitted `Access-Control-Allow-Origin` on native preflight.

Example combined env list:

```
https://acheteici.com,https://www.acheteici.com,https://staging.acheteici.com,capacitor://localhost,https://localhost,http://localhost
```

## Account deletion — `DELETE /api/auth/account`

Apple Guideline 5.1.1(v) and Google Play require in-app account deletion. The client calls this from Profile → Security. Nest: `AuthController.deleteAccount` → `DeleteAccountUseCase`.

**Contract**

- **Method / path:** `DELETE /api/auth/account`
- **Auth:** Bearer access token. Refresh cookie cleared on success.
- **Success:** `204`
- **Failure:** `401` unauthenticated, `409` if deletion cannot complete (staff accounts, or a DB error)

**Anonymizes (keeps the user row so order FKs survive)**

- Email / phone / password / refresh tokens / OTP rows (so the person cannot log in; unique email/phone are freed)
- Profile names, avatars, GPS on saved addresses, payout account numbers
- Support sessions tied to the user (messages cleared, session closed)
- Producer listings are zeroed; portfolios unpublished

**May retain (anonymized owner)**

- Completed order / tax / dispute / wallet ledger rows

Staff (`SUPER_ADMIN` / `ADMIN` / `RETAIL_ADMIN`) cannot use this route.

## User-generated content reports

See the web app `POST /api/reports` client. Still a separate backend follow-up.

## Native build environment

Store binaries are produced with:

```bash
VITE_API_BASE_URL=https://api.YOUR-PRODUCTION-HOST yarn build:native
```

Never bake `localhost` into a store APK/IPA.

**Prove after API deploy**

```bash
curl -sS -D - -o /dev/null -X OPTIONS 'https://api.staging.acheteici.com/socket.io/?EIO=4&transport=polling' \
  -H 'Origin: capacitor://localhost' -H 'Access-Control-Request-Method: GET'
# Expect: Access-Control-Allow-Origin: capacitor://localhost

curl -sS -o /dev/stderr -w '%{http_code}\n' -X DELETE 'https://api.staging.acheteici.com/api/auth/account'
# Expect: 401 (not 404)
```
