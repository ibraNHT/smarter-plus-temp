# App Store / Play Console reviewer notes

Paste and adapt this into App Review notes (App Store Connect) and the Play Console questionnaire.

Fill [store-console-checklist.md](./store-console-checklist.md) in both consoles so this text matches the listing. Short status notes: [store-review-status.md](./store-review-status.md).

## What this app is

AgriMarket Connect (Achète Tout Ici) is a **marketplace for physical agricultural goods and in-person farm/agri services** in Cameroon/Africa. Buyers and producers create accounts, list/buy produce, chat about orders, and pay through an in-app **wallet funded via Tranzak** for those physical goods.

It is **not** a digital-only content app. There are **no** Apple IAP or Google Play Billing products.

## Test account

**Replace these placeholders with working credentials before submit.** Empty fields fail App Review.

- Client: `REVIEWER_EMAIL` / `REVIEWER_PASSWORD`
- Producer (validated): `REVIEWER_PRODUCER_EMAIL` / `REVIEWER_PASSWORD`

Walkthrough: open ATI Store or Producer Market → add an item → cart (if payments are enabled in this binary) → wallet. Profile → Security → Delete account is the in-app deletion path (do not complete deletion on the demo account). Chat header Report, listing Report, and Support chat (AI consent checkbox naming Google Gemini) are the UGC / AI paths.

## Account deletion (5.1.1(v) / Play)

Sign in → Profile → **Security** → **Delete account** → confirm.

Requires live backend `DELETE /api/auth/account` (implemented in `API-AgriMarket-Connect`; see `docs/native/backend-cors-and-account-deletion.md`). Re-probe after API deploy: unauthenticated DELETE must be **401**, not 404.

Play Data safety **web** URL: https://acheteici.com/account-deletion

## Payments (Apple 3.1.3(e) physical goods)

Wallet top-up opens **Safari View Controller / Chrome Custom Tabs** to Tranzak hosted checkout, then the user returns to the app. This charges for **physical goods and off-device services**, not digital unlockables. Stored wallet balance is only spent on those marketplace orders. If you later sell in-app digital boosts, IAP/Play Billing must be added first.

## Permissions used

| Permission | When it appears | Why |
|---|---|---|
| Location when in use | Registration / profile “use my location” | Fill delivery address. No background tracking. |
| Camera | User-initiated capture (file picker / camera) | Avatars, listings, ID docs, dispute evidence. |
| Photo library / gallery | **Not requested** on Android 13+ | Uploads use the **system Photo Picker** (`<input type="file" accept="image/…">`). `READ_MEDIA_IMAGES` is removed from the merged manifest. iOS photo-library strings remain for WebKit file inputs. |
| Network | Always | Marketplace API, maps, media, chat. |

We do **not** request microphone, contacts, or push notifications.

## Privacy

Public policy: https://acheteici.com/privacy  
Terms: https://acheteici.com/terms  
Account deletion (web): https://acheteici.com/account-deletion  

Native binaries **do not** load the website Google Ads tag, so App Tracking Transparency is not used.

Privacy manifest: `PrivacyInfo.xcprivacy` is bundled. First iOS release is **iPhone-only** (no iPad screenshots).

## Age

Users must be **18+**. Registration date of birth is validated client-side. Suggested age rating **17+**.

## UGC (Guideline 1.2)

Users post offers, reviews, and chat. Order **disputes** exist. Report is on:

- Chat thread header (also **block** that user locally in the messages list)
- Public producer/client profile
- Offer / product detail

Reports call `POST /api/reports` when authenticated, otherwise email `helpdesk@acheteici.com`. Operators must still take down violating content.

## AI support (Guideline 5.1.2(i))

In-app AgriBot uses **Google Gemini via our backend**. The widget requires an explicit consent checkbox before the first message is sent. Privacy Policy names Gemini. Users can request a human agent after a session exists.

## Deep links / payments return

Wallet return path: `/wallet?payment=return`. Universal Links / App Links can be added later; Tranzak currently opens in the system browser overlay.

## Technical

- Bundle ID / application ID: `com.acheteici.app`
- Display name: AgriMarket Connect
- Devices: iPhone (`TARGETED_DEVICE_FAMILY = 1`); required capability `arm64` (not armv7)
- WebView loads bundled `dist/` (not a remote website wrapper of a third-party site)
- Native plugins: StatusBar, Keyboard, App, Preferences, Geolocation, Browser (Custom Tabs / SVC), Share, splash, hardware back
- REST CORS on staging/production already allows `capacitor://localhost` for `/api`. Socket.IO native CORS is fixed in `API-AgriMarket-Connect` and still needs **deploy** before chat is review-ready.
- Production `VITE_API_BASE_URL` is baked at build time (never localhost)
