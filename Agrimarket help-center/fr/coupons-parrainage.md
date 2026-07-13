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

La récompense s’applique lorsque :

- le nouvel utilisateur s’est inscrit avec un code de parrainage valide
- sa **première commande** (par date de création) est marquée **Terminée (Completed)**
- **aucune annulation** n’a eu lieu sur une commande antérieure avant cette finalisation

Les montants sont crédités sur les portefeuilles par le serveur à ce moment (sous réserve du programme actif et du budget). Le programme peut être modifié, suspendu ou remplacé.

## Si le coupon/parrainage ne s’applique pas

Vérifiez :

- mauvais canal
- expiration
- minimum de commande non atteint
- quota utilisateur atteint
- conditions d’éligibilité non remplies
