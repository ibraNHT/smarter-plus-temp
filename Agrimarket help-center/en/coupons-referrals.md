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

Referral rewards apply when:

- the new user registered with a valid referral code
- their **chronologically first order** is marked **Completed**
- **no cancellation** happened on an earlier order before that completion

Rewards are credited to wallets by the server at that moment (subject to the active program’s amounts and budget). Programs may be changed, paused, or replaced over time.

## If coupon/referral is not applied

Check:

- channel mismatch
- expiry
- min amount not reached
- usage cap reached
- ineligible order/account conditions
