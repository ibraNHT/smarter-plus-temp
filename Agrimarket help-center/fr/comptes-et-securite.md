# Comptes et sécurité

Ce guide explique la création de compte, la sécurité de connexion et les mécanismes de vérification.

## Bases du compte

- Chaque compte doit utiliser un email et un téléphone uniques.
- Gardez vos informations de profil exactes et à jour.
- Vous êtes responsable des actions réalisées avec votre compte.

## Connexion et sessions

- La connexion accepte email ou téléphone.
- Déconnectez-vous sur les appareils partagés.
- En cas d’expiration de session, reconnectez-vous.

## Réinitialisation du mot de passe

1. Faites une demande depuis la page de connexion.
2. Utilisez rapidement le lien/token reçu.
3. Définissez un nouveau mot de passe robuste.

## Vérification OTP (actions sensibles)

La plateforme peut exiger un OTP pour certaines actions, surtout côté producteur, par exemple :

- demande de retrait,
- certaines modifications de profil sensibles (identité/téléphone).

Flux OTP :

1. demander OTP,
2. vérifier OTP,
3. finaliser l’action avec le token de vérification si demandé.

## Statut du profil producteur

Un producteur peut être en attente, validé, ou suspendu.  
Certaines actions vendeurs sont bloquées tant que la validation n’est pas faite.

## Bonnes pratiques sécurité

- Utilisez un mot de passe unique.
- Ne partagez pas vos identifiants ni OTP.
- Évitez les appareils non fiables.
- Signalez vite tout accès suspect à **helpdesk@aheteici.com**.
