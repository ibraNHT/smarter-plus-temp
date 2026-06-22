# Troubleshooting / Known Issues (English)

Use this guide when common workflows fail or behave unexpectedly.

## 1) Coupon not applied

### What to check
- Coupon channel matches order type (marketplace vs retail).
- Coupon is not expired.
- Minimum order amount is met.
- Per-user usage limit not exceeded.

### What to do
1. Re-check order channel and amount.
2. Re-enter coupon carefully.
3. Try without changing quantity between preview and checkout.
4. Contact support with coupon code + order context if still failing.

## 2) Payment pending too long

### What to check
- Payment reference/status endpoint or payment status in app.
- Network/provider outage possibility.

### What to do
1. Wait briefly and refresh status.
2. Avoid duplicate immediate retries.
3. If unresolved, contact support with payment reference and timestamp.

## 3) Withdrawal request fails (producer)

### What to check
- OTP verification completed and still valid.
- Payment method belongs to your producer profile.
- Balance and minimum withdrawal amount are sufficient.

### What to do
1. Repeat OTP flow if token expired.
2. Confirm payment method details.
3. Retry with valid amount.
4. Contact support if rejection reason is unclear.

## 4) Order appears “stuck”

### What to check
- Current status and which role can move it.
- Pending action required by client or producer.

### What to do
1. Identify missing action.
2. Complete action in correct sequence.
3. Open support ticket if status remains inconsistent.

## 5) Chat message rejected

### Cause
Message may contain blocked contact details (phone/email/link) or invalid proposal content.

### Fix
- Remove phone/email/link text.
- Keep pricing and negotiation details in permitted format.

## 6) Dispute evidence upload problem

### What to check
- File count/size constraints.
- You are a valid participant for the order.

### What to do
1. Reduce file set and retry.
2. Ensure the dispute is opened on the correct order.
3. Contact support with order ID and error details.

## 7) Known platform caveats

- Payment completion timing may depend on external providers.
- Some administrative/reporting views may temporarily reflect backend schema or status naming transitions.
- Notification delivery can be best-effort due to provider/network constraints.
