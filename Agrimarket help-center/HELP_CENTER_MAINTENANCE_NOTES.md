# Help Center Maintenance Notes

Internal note for keeping help-center content accurate over time.

## Update triggers

Update help docs whenever these change:

- order status/state machine rules
- payment initiation/status behavior
- wallet and withdrawal constraints (including OTP flow)
- coupon validation rules (channel, min order, per-user limits)
- referral reward logic and eligibility
- chat safety restrictions
- support/dispute visibility or evidence limits
- Terms and Privacy policy updates

## Ownership suggestion

- Product/Support: content accuracy and UX wording
- Engineering: endpoint/behavior validation
- Legal/Compliance: policy and claims review

## Review cadence

- Light review: monthly
- Full review: each major release
- Emergency patch: within 24h after critical behavior changes

## Required consistency checks

Before publishing updates:

1. Ensure EN and FR versions are synchronized.
2. Ensure role-based instructions (Client vs Producer) still match current flows.
3. Ensure no unsupported SLA promises are introduced.
4. Ensure links to legal docs remain valid:
   - `docs/TERMS_AND_CONDITIONS.md`
   - `docs/PRIVACY_POLICY.md`

## Known cautious wording (keep conservative)

- Payment completion timing (provider-dependent)
- Refund automation scope (may require dispute flow)
- Notification delivery reliability (best-effort)
- Administrative review timelines
