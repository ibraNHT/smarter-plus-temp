# Coupons & Referral Programs

Use this guide to understand discounts and referral rewards.

## Coupons

Coupon validation usually checks:

- code validity and active status
- expiry date
- minimum order amount
- channel compatibility (`MARKETPLACE`, `RETAIL`, or `BOTH`)
- per-user usage caps (if configured)

Coupon validation is enforced server-side during checkout.

## Channel compatibility

- Marketplace-only coupons fail on retail checkout.
- Retail-only coupons fail on marketplace checkout.
- Both-channel coupons can be used in either flow (subject to other rules).

## Referral program basics

Referral behavior can include:

- referral code at registration
- rewards tied to eligible conditions (often first eligible order)
- budget controls and anti-abuse checks

Referral programs may be changed, paused, or replaced over time.

## If coupon/referral is not applied

Check:

- channel mismatch
- expiry
- min amount not reached
- usage cap reached
- ineligible order/account conditions
