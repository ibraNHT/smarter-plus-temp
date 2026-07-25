# REST API Contract

When `VITE_USE_MOCKS=false` (the default and production setting), the frontend expects **all data from your REST API**. No Firebase or local mock data is used.

## Required environment (production)

Set these in your build/deploy environment:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Full base URL of your API (e.g. `https://api.example.com` or `https://example.com/api`). Do not rely on the fallback to `window.location.origin` if your API is on another host. |
| `VITE_UPLOAD_API_URL` | No | Base URL for file uploads. Defaults to `VITE_API_URL`. |
| `VITE_USE_MOCKS` | No | Set to `false` for production. |
| `VITE_USE_HTTPONLY_COOKIES` | No | Set to `true` only if your backend uses httpOnly session cookies and exposes `/session` and `/logout`. |

## Endpoints the frontend calls

All requests use the base URL from `VITE_API_URL`. Auth uses either `Authorization: Bearer <token>` (when not using httpOnly cookies) or cookie-based session with `credentials: 'include'`.

### Auth

| Method | Path | Request | Response / behavior |
|--------|------|---------|---------------------|
| POST | `/auth/signup/start` | `{ email, password, organizationName, firstName?, lastName? }` | `{ otpRequired, email, message, devOtp? }` |
| POST | `/auth/signup/verify` | `{ email, code }` | `{ token, user, role }` — creates org + free subscription |
| POST | `/auth/login/start` | `{ email, password }` | `{ otpRequired, email, message, devOtp? }` |
| POST | `/auth/login/verify` | `{ email, code }` | `{ token, user, role }` |
| POST | `/auth/otp/resend` | `{ email, purpose }` | Resend OTP (`signup` \| `login` \| `invite`) |
| GET | `/auth/session` | — | `{ token?, user, role }` for current session |
| POST | `/login` | `{ email, password }` | Same as `/auth/login/start` (legacy; OTP required) |
| PUT | `/update-password` | `{ oldPassword, newPassword }` | Success |
| PATCH | `/profile` | `{ profilePicUrl? }` | Updated user |
| GET | `/organization` | — | Organization profile |
| PATCH | `/organization` | `{ name?, legalName?, address?, phone?, taxId?, logoUrl? }` | Updated org; sets `profileCompletedAt` when required fields filled |
| GET/POST | `/invites` | POST `{ email, roleId, locationIds? }` | Invite create / list (sends email with accept link) |
| POST | `/invites/:id/resend` | — | Regenerate token and resend invite email |
| POST | `/invites/accept/start` | `{ token, password, firstName?, lastName? }` | OTP for invite |
| POST | `/invites/accept/verify` | `{ email, code }` | `{ token, user, role }` |
| GET | `/billing/plans` | — | Plan catalog |
| GET | `/billing/subscription` | — | Current subscription + usage |
| GET | `/billing/coupons` | — | Coupons assigned to the caller’s org (owner) |
| POST | `/billing/coupons/validate` | `{ couponCode, planId, billingPeriod }` | Preview `{ valid, originalAmount, discountAmount, finalAmount, type, message }` |
| POST | `/billing/checkout` | `{ planId, billingPeriod, couponCode? }` | Tranzak `{ paymentAuthUrl, amount, … }` or zero-amount `{ activated: true, amount: 0 }` |
| POST | `/billing/webhook` | Tranzak payload | Payment confirmation |
| GET | `/billing/payments/:ref/status` | — | Payment status |

#### Platform admin API (external panel)

Requires header `X-Platform-Admin-Key: <PLATFORM_ADMIN_API_KEY>`.

| Method | Path | Body / notes | Response |
|--------|------|--------------|----------|
| GET | `/platform/organizations` | — | `{ organizations: [{ id, name, email }] }` |
| GET | `/platform/coupons` | `?code=&active=` | `{ coupons }` |
| POST | `/platform/coupons` | `{ code, type: percent\|fixed\|trial, percentOff?, fixedOffXaf?, trialMonths?, … }` | Created coupon |
| PATCH | `/platform/coupons/:id` | Partial update | Updated coupon |
| POST | `/platform/coupons/:id/assignments` | `{ organizationId }` | Assignment |
| DELETE | `/platform/coupons/:id/assignments/:organizationId` | — | `{ ok: true }` |

| GET | `/roles/:id` | — | `Role` (id, key, name, permissions array or JSON string). |
| PUT | `/users/:id` | `{ password?, passwordNeedsReset?, profilePicUrl? }` | — |
| PUT | `/users/:id/reset-password` | `{ newPassword }` | Admin reset |

### Collections (CRUD)

The app uses generic collection names; your backend must expose them under the same path segment. **All collections are organization-scoped** via the JWT `organizationId`.

| Method | Path | Notes |
|--------|------|--------|
| GET | `/:collection` | Returns array. Collections: `users`, `roles`, `locations`, `income`, `expenses`, `inventory`, `inventory_events`, `staff`, `expense_categories`, `inventory_types`, `positions`, `income_sources`, `expense_descriptions`, `storage_places`, `estimates`, `estimate_templates`. |
| POST | `/:collection` | Body: JSON object. Creating `users`/`locations` is gated by subscription limits. |
| PUT | `/:collection/:id` | Body: JSON object. |
| DELETE | `/:collection/:id` | — |
| DELETE | `/staff_documents/:id` | Delete a staff document by id. |

### Inventory health (adjustments + incident log)

`InventoryItem` (`types.ts`) includes optional `status`, `expiresOn`, `notes`, `imageUrl`, `storagePlace`, `createdAt`, `updatedAt`, `userId`.  
`quantity` is **current on-hand** stock used for available-value KPIs.  
`storagePlace` is a physical place within the business site (shelf, bin, zone); site scoping remains `locationId` from the header.  
Reusable labels for income `source`, expense `description`, and inventory `storagePlace` are managed via Admin catalogs (`income_sources`, `expense_descriptions`, `storage_places`); forms suggest those labels but still accept free text.  
`imageUrl` is set after uploading via `POST /upload/inventory-image`.  
`updatedAt` is maintained by the API on every create/update (Prisma `@updatedAt`) and shown in the inventory table.

`inventory_events` records losses and corrections:

| Field | Type | Notes |
|-------|------|--------|
| `inventoryId` | string | Parent stock line |
| `locationId` | string | Same location as the item |
| `reason` | `damaged` \| `expired` \| `stolen` \| `restored` \| `adjustment` | Loss or gain |
| `quantity` | number | Units lost or restored |
| `note` | string? | Required in UI for stolen/damaged |
| `userId` | string | Actor |
| `createdAt` | string | ISO timestamp |

**Preferred write flow for an incident:** `POST /inventory_events`, then `PUT /inventory/:id` with updated `quantity` and `status`. Frontend invalidates both collections.

### Estimates

Standalone professional quotes (no auto-convert to income in this phase).

| Collection | Notes |
|------------|--------|
| `estimates` | Location-scoped. `GET` includes `lineItems` (ordered) and optional `template`. `POST`/`PUT` accept nested `lineItems[]` (`description`, `quantity`, `unit`, `unitPrice`, `lineTotal`, `sortOrder`); server replaces line items on update when the array is sent. Fields include branding (`logoUrl`, `primaryColor`, `accentColor`, `layout`), customer/business block, `issueDate`, `validUntil`, tax/totals, `status` (`draft` \| `sent` \| `accepted` \| `rejected` \| `archived`). |
| `estimate_templates` | System industry templates (`isSystem: true`, `locationId` null) plus user-archived templates (`isSystem: false`, `locationId`/`userId` set). `defaultLineItems` is returned as a JSON array. |

Permissions: `perm_viewEstimates`, `perm_addEstimates`, `perm_updateEstimates`, `perm_deleteEstimates`, `perm_manageEstimateTemplates`.

Exports are client-side: CSV, Excel (`.xlsx`), and print-ready PDF via `window.print()` on the estimate preview.

### Uploads

| Method | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/upload` | FormData with `file`, `path` | `{ url, path? }` |
| POST | `/upload/profile-picture` | FormData with `file` | `{ url, filename }` (images; served under `/uploads/profiles`) |
| POST | `/upload/inventory-image` | FormData with `file` | `{ url, filename }` (jpeg/png/gif/webp; served under `/uploads/inventory`) |
| POST | `/upload/estimate-logo` | FormData with `file` | `{ url, filename }` (jpeg/png/gif/webp; served under `/uploads/estimates`) |
| POST | `/upload/document` | FormData with `file`, `staffId`, `documentName`, `documentType`, `path` | `{ url, path? }` (HR document upload uses `UPLOAD_API_URL`) |

**Inventory create/edit with photo:** upload the file to `/upload/inventory-image` first, then `POST`/`PUT` `/inventory` with `imageUrl` (and optional `storagePlace`). After the 24h registration lock, `imageUrl` and `storagePlace` remain editable with other operational fields (`quantity`, `status`, `notes`, `expiresOn`).

**Estimate logo:** upload via `/upload/estimate-logo`, then set `logoUrl` on the estimate or template.

## Data shapes

See `types.ts` for TypeScript interfaces: `User`, `Role`, `Location`, `Transaction`, `InventoryItem`, `Staff`, `Category`, `Estimate`, `EstimateTemplate`, etc. The API should return data matching these shapes (or the frontend will need small adaptations for field renames).

## Production checklist

- [ ] `VITE_USE_MOCKS=false` (default).
- [ ] `VITE_API_URL` set to your production API base URL.
- [ ] Backend implements the endpoints above and returns the expected shapes.
- [ ] CORS allows your frontend origin; if using cookie auth, credentials and SameSite are configured correctly.
- [ ] Build: `npm run build`; serve the `dist/` folder (and optionally set security headers via Nginx/Vercel as in `PRODUCTION_READINESS.md`).
