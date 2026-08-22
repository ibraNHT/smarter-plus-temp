# Payments, Wallet & Withdrawals

This guide covers payment status, wallet behavior, and producer withdrawals.

## Payments

- Payment initiation and status checks may rely on external providers.
- Temporary delays can happen due to network/provider processing.
- If payment appears pending, verify status first before retrying.

## Wallet

- Wallet balance reflects platform transaction records.
- Balance changes may come from orders, credits/debits, and admin-approved operations.

## Producer withdrawals

To request a withdrawal:

1. Ensure sufficient wallet balance.
2. Use a valid producer payment method.
3. Complete OTP verification if required.
4. Submit request.

Requests are reviewed by admin and may be approved or rejected.
When a producer withdraws wallet funds:

2% Tranzak fee is added on top
Wallet debit = amount + 2%
Producer receives the requested amount

Example for a 10,000 XAF cart:

Buyer pays: 10,600 (10,000 + 600)

Producer receives: 9,100 (10,000 - 9%)

Withdraw request: 9,100

Withdraw debit: 9,100 + 2% = 9,282

So, for the producer to receive the requested amount of 9,100, they must have at least 9,282 in their wallet.

## Common withdrawal blockers

- OTP missing/expired
- invalid payment method ownership
- amount below minimum
- insufficient balance

## Recommended practice

- Keep payment method details accurate.
- Keep your phone available for OTP verification.
- Avoid repeated duplicate withdrawal submissions while one is pending.
