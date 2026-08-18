# Store Console checklist — AgriMarket Connect (`com.acheteici.app`)

Fill App Store Connect and Google Play Console to match the binary. Empty reviewer logins or a localhost API URL will fail review.

Plain-language status: [store-review-status.md](./store-review-status.md).

## Do not submit until backend is live

See [backend-cors-and-account-deletion.md](./backend-cors-and-account-deletion.md). Code is in **`API-AgriMarket-Connect`**; live probes on 17 Aug 2026 were still the old API:

- Native CORS on **REST** (`capacitor://localhost`, `https://localhost`) works on staging and production.
- `DELETE /api/auth/account` still **404** on staging and production until that API is deployed.
- Socket.IO OPTIONS still omits `Access-Control-Allow-Origin` until that deploy.
- Play web deletion URL (this SPA): **https://acheteici.com/account-deletion** (after website deploy).

## Age rating

- **17+ / Mature** (not Kids). Registration enforces **18+** date of birth.
- Not a Kids category app.

## Privacy Nutrition Labels (App Store Connect)

Declare **linked to identity**, **not used for tracking** (native builds strip Google Ads / `gtag`):

| Data type | Why |
|---|---|
| Email address, Phone number, Name, Physical address | Account, delivery |
| Precise / coarse location | User-initiated address fill (when in use only) |
| Photos or videos | User-initiated uploads (avatar, offers, dispute evidence) via the system picker — not a gallery browser |
| User ID | Account, chat, orders |
| Payment info | Wallet / Tranzak for **physical goods and on-farm services** |
| Other user content | Offers, reviews, order chat |
| Customer support | Support chat, including Google Gemini after in-app consent |
| Device ID? | No advertising ID. Session tokens in app storage |
| Contacts / tracking | **No** |

Also list **Google Gemini** as a data-use / third-party AI provider for support.

`ITSAppUsesNonExemptEncryption` is `false` in Info.plist (HTTPS only). Still complete the Export Compliance questionnaire.

First release is **iPhone-only** (`TARGETED_DEVICE_FAMILY = 1`). Do **not** upload iPad screenshots.

## Play Data safety

Mirror the table above. Additional Play fields:

- **Account deletion:** in-app (Profile → Security) **and** web URL `https://acheteici.com/account-deletion`
- **Data encryption in transit:** yes (HTTPS)
- **Users can request deletion:** yes
- **Independent security review:** no (unless you later add one)
- **Device backups:** `android:allowBackup="true"` — session tokens in Preferences can be included in device backups. Disclose “app activity / device or other IDs” stored and possibly backed up.
- **Photo and Video Permissions form:** the app does **not** declare `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO`. Uploads use the platform file/photo picker. If Play still shows a photo permission from a merged library, the app manifest uses `tools:node="remove"` for those permissions.
- **16 KB page size:** uncompressed native libs (`android.bundle.enableUncompressedNativeLibs=true`). Verify the AAB in APK Analyzer before upload.

## Listings / screenshots

- Privacy: `https://acheteici.com/privacy`
- Terms: `https://acheteici.com/terms`
- Screenshots of the **native** UI (tab bar, Profile → Delete account, wallet, consent + report) — not the marketing website.
- Payments: physical produce / in-person farm services; wallet top-up opens **Safari View Controller / Chrome Custom Tabs** to Tranzak. No IAP / Play Billing.

## Reviewer accounts

Replace placeholders in [store-reviewer-notes.md](./store-reviewer-notes.md) with a **working client** and a **validated producer**. Empty `REVIEWER_EMAIL` = auto bounce.

## Production API bake

Store binaries:

```bash
VITE_NATIVE=true VITE_API_BASE_URL=https://api.acheteici.com yarn build
npx cap sync
```

Never ship `localhost` or a staging-only host in App Store / Play production tracks.
