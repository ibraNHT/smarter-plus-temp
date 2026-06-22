# Coupons et parrainage

Ce guide explique les remises et récompenses de parrainage.

## Coupons

La validation d’un coupon vérifie généralement :

- validité du code et statut actif
- date d’expiration
- montant minimum de commande
- compatibilité canal (`MARKETPLACE`, `RETAIL`, `BOTH`)
- limite d’utilisation par utilisateur (si configurée)

La validation est appliquée côté serveur au checkout.

## Compatibilité de canal

- Coupon marketplace-only : refusé en retail.
- Coupon retail-only : refusé sur marketplace.
- Coupon both : accepté sur les deux canaux (si autres règles OK).

## Programme de parrainage

Le parrainage peut inclure :

- code de parrainage à l’inscription
- récompenses liées à des conditions (souvent première commande éligible)
- contrôles budget/cap et anti-abus

Le programme peut être modifié, suspendu ou remplacé.

## Si le coupon/parrainage ne s’applique pas

Vérifiez :

- mauvais canal
- expiration
- minimum de commande non atteint
- quota utilisateur atteint
- conditions d’éligibilité non remplies
