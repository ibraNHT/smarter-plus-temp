# Dépannage / problèmes connus (Français)

Utilisez ce guide quand un flux échoue ou se comporte de façon inattendue.

## 1) Coupon non appliqué

### Vérifier
- Canal coupon compatible (marketplace vs retail).
- Coupon non expiré.
- Minimum de commande atteint.
- Limite d’utilisation par utilisateur non dépassée.

### Actions
1. Vérifiez canal et montant.
2. Ressaisissez le coupon.
3. Évitez de modifier la quantité entre prévisualisation et checkout.
4. Contactez le support avec code coupon + contexte commande.

## 2) Paiement en attente trop longtemps

### Vérifier
- Statut paiement (référence/statut dans l’app).
- Incident réseau/fournisseur possible.

### Actions
1. Attendez puis rafraîchissez le statut.
2. Évitez les retries immédiats en doublon.
3. Si persistant, contactez le support avec référence + horodatage.

## 3) Échec de retrait (producteur)

### Vérifier
- OTP validé et encore actif.
- Méthode de paiement liée à votre profil producteur.
- Solde et minimum de retrait respectés.

### Actions
1. Refaites le flux OTP si expiré.
2. Vérifiez vos infos méthode de paiement.
3. Réessayez avec un montant valide.
4. Contactez le support si le motif de rejet est flou.

## 4) Commande “bloquée”

### Vérifier
- Statut courant et rôle autorisé pour l’action suivante.
- Action en attente côté client ou producteur.

### Actions
1. Identifiez l’action manquante.
2. Exécutez-la dans le bon ordre.
3. Ouvrez un ticket support si incohérence persistante.

## 5) Message chat rejeté

### Cause
Le message peut contenir des coordonnées bloquées (téléphone/email/lien) ou un format de proposition invalide.

### Correction
- Supprimez téléphone/email/lien.
- Gardez la négociation dans le format permis.

## 6) Échec upload preuves litige

### Vérifier
- Limites nombre/taille de fichiers.
- Vous êtes bien partie prenante de la commande.

### Actions
1. Réduisez les fichiers puis réessayez.
2. Vérifiez l’ID de commande.
3. Contactez le support avec l’erreur exacte.

## 7) Points d’attention connus

- Les délais de finalisation paiement peuvent dépendre de fournisseurs externes.
- Certaines vues administratives/reporting peuvent refléter des transitions de schéma/statuts.
- La livraison des notifications peut être best-effort selon réseau/fournisseur.
