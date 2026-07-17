
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'fr';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navbaradasdada
  'nav.home': { en: 'Home', fr: 'Accueil' },
  'nav.producerMarket': { en: 'Producer Market', fr: 'Marché Producteurs' },
  'nav.atiStore': { en: 'ATI Store', fr: 'Boutique ATI' },
  'nav.dashboard': { en: 'My Dashboard', fr: 'Mon Tableau de bord' },
  'nav.profile': { en: 'My Profile', fr: 'Mon Profil' },
  'nav.wallet': { en: 'Wallet', fr: 'Portefeuille' },
  'nav.newOffer': { en: 'New Offer', fr: 'Nouvelle Offre' },
  'nav.admin': { en: 'Admin Overview', fr: 'Admin' },
  'nav.login': { en: 'Log in', fr: 'Connexion' },
  'nav.signup': { en: 'Sign Up', fr: 'S\'inscrire' },
  'nav.logout': { en: 'Logout', fr: 'Déconnexion' },
  'nav.logoutConfirmTitle': { en: 'Log out?', fr: 'Se déconnecter ?' },
  'nav.logoutConfirmBody': { en: 'You will need to sign in again to access your account.', fr: 'Vous devrez vous reconnecter pour accéder à votre compte.' },
  'nav.notifications': { en: 'Notifications', fr: 'Notifications' },
  'nav.noNotifs': { en: 'No new notifications', fr: 'Pas de nouvelles notifications' },
  'nav.messages': { en: 'Messages', fr: 'Messages' },
  'nav.messagesUnreadAria': { en: 'unread', fr: 'non lus' },
  'nav.switchAccount': { en: 'Switch Account', fr: 'Changer de Compte' },

  // PWA install (beforeinstallprompt / Android Chrome)
  'pwa.bannerTitle': { en: 'Install AgriMarket Connect', fr: 'Installer AgriMarket Connect' },
  'pwa.bannerBody': { en: 'Add the app to your home screen for quicker access.', fr: 'Ajoutez l’app à votre écran d’accueil pour un accès plus rapide.' },
  'pwa.installButton': { en: 'Install', fr: 'Installer' },
  'pwa.dismiss': { en: 'Dismiss', fr: 'Fermer' },
  'pwa.installMenu': { en: 'Install app', fr: 'Installer l’application' },
  'pwa.iosTipTitle': { en: 'Add to Home Screen', fr: 'Ajouter à l’écran d’accueil' },
  'pwa.iosTipBody': { en: 'On iPhone: tap Share, then “Add to Home Screen”.', fr: 'Sur iPhone : appuyez sur Partager, puis « Sur l’écran d’accueil ».' },
  'pwa.intentFavorite': { en: 'Keep favorites handy — install the app.', fr: 'Gardez vos favoris à portée — installez l’app.' },
  'pwa.intentCart': { en: 'Checkout faster next time — install the app.', fr: 'Passez commande plus vite — installez l’app.' },
  'pwa.intentReturn': { en: 'Back for more? Install for quicker browsing.', fr: 'De retour ? Installez pour naviguer plus vite.' },

  // Footer
  'footer.about': { en: 'About AgriMarket', fr: 'À propos d\'AgriMarket' },
  'footer.tagline': { en: 'Connecting producers and consumers for a sustainable future.', fr: 'Connecter producteurs et consommateurs pour un avenir durable.' },
  'footer.col.markets': { en: 'Markets', fr: 'Marchés' },
  'footer.col.company': { en: 'Company', fr: 'Entreprise' },
  'footer.col.support': { en: 'Support & Legal', fr: 'Aide & Légal' },
  'footer.link.jobs': { en: 'Jobs', fr: 'Emplois' },
  'footer.link.partners': { en: 'Partners', fr: 'Partenaires' },
  'footer.link.blog': { en: 'Blog', fr: 'Blog' },
  'footer.link.helpCenter': { en: 'Help Center', fr: "Centre d'aide" },
  'footer.link.faq': { en: 'FAQ', fr: 'FAQ' },
  'footer.link.terms': { en: 'Terms & Conditions', fr: 'Conditions Générales' },
  'footer.link.privacy': { en: 'Privacy Policy', fr: 'Politique de Confidentialité' },
  'footer.rights': { en: 'All rights reserved.', fr: 'Tous droits réservés.' },
  'footer.exploreHelp': { en: 'Need a hand?', fr: 'Besoin d’aide ?' },
  'footer.exploreBlog': { en: 'Latest from the blog', fr: 'Dernières du blog' },

  // Static Pages Content
  'blog.title': { en: 'AgriMarket Insights', fr: 'Actualités AgriMarket' },
  'blog.subtitle': { en: 'Latest news, tips for farmers, and market trends.', fr: 'Dernières nouvelles, conseils pour les agriculteurs et tendances du marché.' },
  'blog.readArticle': { en: 'Read Article', fr: 'Lire l\'article' },
  'jobs.title': { en: 'Join Our Team', fr: 'Rejoignez Notre Équipe' },
  'jobs.subtitle': { en: 'Help us revolutionize agriculture in Africa.', fr: 'Aidez-nous à révolutionner l\'agriculture en Afrique.' },
  'partners.title': { en: 'Our Strategic Partners', fr: 'Nos Partenaires Stratégiques' },
  'faq.title': { en: 'Frequently Asked Questions', fr: 'Foire Aux Questions' },
  'helpCenter.title': { en: 'Help Center', fr: "Centre d'aide" },
  'helpCenter.subtitle': {
    en: 'Find answers about buying, selling, payments, and account security on AgriMarket Connect.',
    fr: 'Trouvez des réponses sur l’achat, la vente, les paiements et la sécurité du compte sur AgriMarket Connect.',
  },
  'helpCenter.searchPlaceholder': {
    en: 'Search help articles by keyword…',
    fr: 'Rechercher dans les articles par mot-clé…',
  },
  'helpCenter.section.allTopics': { en: 'All topics', fr: 'Tous les sujets' },
  'helpCenter.section.startHere': { en: 'Start here', fr: 'Pour commencer' },
  'helpCenter.section.client': { en: 'Client guides', fr: 'Guides client' },
  'helpCenter.section.producer': { en: 'Producer guides', fr: 'Guides producteur' },
  'helpCenter.section.quickHelp': { en: 'Quick help', fr: 'Aide rapide' },
  'helpCenter.section.legal': { en: 'Legal', fr: 'Légal' },
  'helpCenter.noResults': {
    en: 'No articles match your search or filters.',
    fr: 'Aucun article ne correspond à votre recherche ou à vos filtres.',
  },
  'helpCenter.backToIndex': { en: 'Back to Help Center', fr: "Retour au centre d'aide" },
  'helpCenter.topicFilter': { en: 'Filter by topic', fr: 'Filtrer par sujet' },
  'helpCenter.allTopics': { en: 'All topics', fr: 'Tous les sujets' },
  'helpCenter.readArticle': { en: 'Read article', fr: "Lire l'article" },
  'helpCenter.previous': { en: 'Previous', fr: 'Précédent' },
  'helpCenter.next': { en: 'Next', fr: 'Suivant' },
  'terms.title': { en: 'Terms and Conditions', fr: 'Conditions Générales' },
  'privacy.title': { en: 'Privacy Policy', fr: 'Politique de Confidentialité' },
  'legal.meta.effectiveDate': { en: 'Effective date', fr: "Date d'effet" },
  'legal.meta.lastUpdated': { en: 'Last updated', fr: 'Dernière mise à jour' },
  'legal.meta.version': { en: 'Version', fr: 'Version' },
  'legal.acceptPrefix': { en: 'I have read and agree to the', fr: 'J\'ai lu et j\'accepte les' },
  'legal.acceptAnd': { en: 'and the', fr: 'et la' },
  'legal.mustAccept': {
    en: 'You must accept the Terms & Conditions and Privacy Policy to continue.',
    fr: 'Vous devez accepter les Conditions générales et la Politique de confidentialité pour continuer.',
  },
  'legal.sendVerificationCode': {
    en: 'Send verification code',
    fr: 'Envoyer le code de vérification',
  },
  'legal.beforeOtpHint': {
    en: 'Accept our policies below before we send a verification code to your phone and email.',
    fr: 'Acceptez nos politiques ci-dessous avant l\'envoi du code de vérification sur votre téléphone et votre e-mail.',
  },

  // Landing Page
  'landing.hero.title': { en: 'Two Markets, One Platform', fr: 'Deux Marchés, Une Plateforme' },
  'landing.hero.subtitle': { en: 'Whether you are a business looking for bulk produce or a family needing daily groceries, AgriMarket Connect has you covered.', fr: 'Que vous soyez une entreprise cherchant du vrac ou une famille ayant besoin de courses quotidiennes, AgriMarket Connect est là pour vous.' },
  'landing.card.wholesale': { en: 'Wholesale', fr: 'Gros' },
  'landing.card.retail': { en: 'Retail', fr: 'Détail' },
  'landing.featuresTitle': { en: 'Platform features', fr: 'Fonctionnalites de la plateforme' },
  'landing.subTitle': { en: 'Connecting you to the source, however you choose to buy.', fr: 'Vous connecter a la source, comme vous souhaitez l\'acheter.' },
  'landing.producerMarket.title': { en: 'Producer Market', fr: 'Marché Producteurs' },
  'landing.producerMarket.desc': { en: 'Buy in bulk directly from independent farmers. Negotiable prices, large quantities.', fr: 'Achetez en gros directement aux agriculteurs indépendants. Prix négociables, grandes quantités.' },
  'landing.atiStore.title': { en: 'ATI Store', fr: 'Boutique ATI' },
  'landing.atiStore.desc': { en: 'Your daily online grocery store. Managed inventory, fixed prices, fast retail delivery.', fr: 'Votre épicerie en ligne quotidienne. Inventaire géré, prix fixes, livraison rapide.' },
  'landing.cta.browse': { en: 'Browse Offers', fr: 'Voir les Offres' },
  'landing.cta.shop': { en: 'Shop Groceries', fr: 'Faire les Courses' },
  'landing.new': { en: 'New to the platform?', fr: 'Nouveau sur la plateforme ?' },
  'landing.createAccount': { en: 'Create Account', fr: 'Créer un Compte' },
  'landing.brand': { en: 'AgriMarket Connect', fr: 'AgriMarket Connect' },
  'landing.freshNearYou': { en: 'Fresh near you', fr: 'Frais près de chez vous' },
  'landing.freshNearYouDesc': { en: 'Live offers from producers and the ATI store.', fr: 'Offres en direct des producteurs et de la boutique ATI.' },
  'landing.seeAllOffers': { en: 'See all offers', fr: 'Voir toutes les offres' },
  'landing.noLiveOffers': { en: 'New offers are arriving soon.', fr: 'De nouvelles offres arrivent bientôt.' },
  'landing.features.title': { en: 'Built for real trade', fr: 'Conçu pour le vrai commerce' },
  'landing.features.subtitle': { en: 'Escrow, verified sources, and flexible pickup — so buyers and producers can trade with confidence.', fr: 'Séquestre, sources vérifiées et retrait flexible — pour que acheteurs et producteurs échangent en confiance.' },
  'landing.features.verified': { en: 'Verified producers', fr: 'Producteurs vérifiés' },
  'landing.features.verifiedDesc': { en: 'Independent producers and ATI store items are vetted so you know who you are buying from.', fr: 'Producteurs indépendants et articles boutique ATI sont contrôlés pour que vous sachiez à qui vous achetez.' },
  'landing.features.logistics': { en: 'Pickup or delivery', fr: 'Retrait ou livraison' },
  'landing.features.logisticsDesc': { en: 'Choose home delivery or pick up at authorized focal points near you.', fr: 'Choisissez la livraison à domicile ou le retrait aux points focaux autorisés près de chez vous.' },
  'landing.features.escrow': { en: 'Secure escrow', fr: 'Séquestre sécurisé' },
  'landing.features.escrowDesc': { en: 'Payments stay protected until you confirm delivery — reducing risk for both sides.', fr: 'Les paiements restent protégés jusqu’à confirmation de livraison — moins de risque pour les deux parties.' },
  'landing.closing.title': { en: 'Ready to buy or sell fresh?', fr: 'Prêt à acheter ou vendre du frais ?' },
  'landing.closing.subtitle': { en: 'Create a free account and join AgriMarket Connect today.', fr: 'Créez un compte gratuit et rejoignez AgriMarket Connect dès aujourd’hui.' },

  // Login
  'login.bridging': { en: 'Bridging the gap between producers and consumers.', fr: 'Comblez le gap entre les producteurs et les consommateurs.' },
  'login.title': { en: 'Sign in to your account', fr: 'Connectez-vous à votre compte' },
  'login.subtitle': { en: 'Access the AgriMarket platform securely.', fr: 'Accédez à la plateforme AgriMarket en toute sécurité.' },
  'login.emailPlaceholder': { en: 'Enter your email', fr: 'Entrez votre email' },
  'login.passwordPlaceholder': { en: 'Enter your password', fr: 'Entrez votre mot de passe' },
  'login.forgotPassword': { en: 'Forgot password?', fr: 'Mot de passe oublié ?' },
  'login.signIn': { en: 'Sign In', fr: 'Se Connecter' },
  'login.phone': { en: 'Phone', fr: 'Téléphone' },
  'login.noAccount': { en: 'Don\'t have an account ', fr: 'Pas de compte' },
  'login.registerHere': { en: 'Register here', fr: 'Inscrivez-vous ici' },
  'login.demo': { en: 'Demo Accounts (Quick Access)', fr: 'Comptes de Démo (Accès Rapide)' },
  'login.resetTitle': { en: 'Reset Password', fr: 'Réinitialiser le mot de passe' },
  'login.resetDesc': { en: 'Enter your registered phone or email. We will send a 6-digit verification code by SMS and/or email.', fr: 'Entrez votre téléphone ou e-mail enregistré. Nous enverrons un code à 6 chiffres par SMS et/ou e-mail.' },
  'login.sendReset': { en: 'Send SMS code', fr: 'Envoyer le code SMS' },
  'login.forgotAfterSend': { en: 'If an account exists, you will receive a code by SMS and/or email. Enter the 6-digit code below.', fr: 'Si un compte existe, vous recevrez un code par SMS et/ou e-mail. Entrez le code à 6 chiffres ci-dessous.' },
  'login.newPasswordLabel': { en: 'New password', fr: 'Nouveau mot de passe' },
  'login.confirmNewPasswordLabel': { en: 'Confirm new password', fr: 'Confirmer le mot de passe' },
  'login.saveNewPassword': { en: 'Save new password', fr: 'Enregistrer le mot de passe' },
  'login.passwordResetSuccess': { en: 'Your password was updated. You can sign in now.', fr: 'Votre mot de passe a été mis à jour. Vous pouvez vous connecter.' },
  'login.passwordsMustMatch': { en: 'Passwords do not match.', fr: 'Les mots de passe ne correspondent pas.' },
  'login.passwordMinLength': { en: 'Password must be at least 4 characters and include a letter, a number, and a special character.', fr: 'Le mot de passe doit contenir au moins 4 caractères avec une lettre, un chiffre et un caractère spécial.' },
  'login.changePhoneNumber': { en: 'Use a different number', fr: 'Utiliser un autre numéro' },
  'login.phoneLocalMin': { en: 'Enter at least 6 digits for your phone number.', fr: 'Entrez au moins 6 chiffres pour votre numéro.' },
  'login.invalidPhoneFormat': { en: 'Enter a valid phone number (country code + number).', fr: 'Entrez un numéro valide (indicatif + numéro).' },
  'login.backToLogin': { en: 'Back to Login', fr: 'Retour à la connexion' },
  'auth.loginFailed': { en: 'Login failed. Please check your credentials.', fr: 'Échec de la connexion. Vérifiez vos identifiants.' },
  'auth.unexpectedError': { en: 'An unexpected error occurred. Please try again.', fr: 'Une erreur inattendue s’est produite. Veuillez réessayer.' },
  'auth.emailRequired': { en: 'Please enter a valid email.', fr: 'Veuillez saisir un e-mail valide.' },
  'auth.passwordRequired': { en: 'Enter your password.', fr: 'Entrez votre mot de passe.' },

  // OTP Verification
  'verify.title': { en: 'Verify Your Email', fr: 'Vérifiez votre Email' },
  'verify.desc': { en: 'We have sent a 6-digit code to your email address. Please enter it below to activate your account.', fr: 'Nous avons envoyé un code à 6 chiffres à votre adresse email. Veuillez l\'entrer ci-dessous pour activer votre compte.' },
  'verify.label': { en: 'Verification Code', fr: 'Code de Vérification' },
  'verify.placeholder': { en: '123456', fr: '123456' },
  'verify.submit': { en: 'Verify & Activate', fr: 'Vérifier et Activer' },
  'verify.verifying': { en: 'Verifying…', fr: 'Vérification…' },
  'verify.invalid': { en: 'Invalid code. Please try again.', fr: 'Code invalide. Veuillez réessayer.' },
  
  'verify.sent_to': { en: 'Sent to:', fr: 'Envoyé à:' },
  
  'verify.check': { en: 'Check your email for the verification code.', fr: 'Consultez votre e-mail pour le code de vérification.' },

  // Register
  'register.title': { en: 'Join AgriMarket Connect', fr: 'Rejoindre AgriMarket Connect' },
  'register.subtitle': { en: 'Choose how you want to participate in the marketplace', fr: 'Choisissez comment vous souhaitez participer au marché' },
  'register.producer.title': { en: 'I am a Producer', fr: 'Je suis Producteur' },
  'register.producer.desc': { en: 'Register your farm, list your products, and sell directly to consumers.', fr: 'Enregistrez votre ferme, listez vos produits et vendez directement aux consommateurs.' },
  'register.producer.btn': { en: 'Register as Producer', fr: 'S\'inscrire comme Producteur' },
  'register.client.title': { en: 'I am a Client', fr: 'Je suis Client' },
  'register.client.desc': { en: 'Browse fresh catalog, find local producers, and order products securely.', fr: 'Parcourez le catalogue frais, trouvez des producteurs locaux et commandez en toute sécurité.' },
  'register.client.btn': { en: 'Register as Client', fr: 'S\'inscrire comme Client' },
  'register.loginLink': { en: 'Already have an account?', fr: 'Vous avez déjà un compte ?' },
  'register.loginHere': { en: 'Log in here', fr: 'Connectez-vous ici' },
  'register.security': { en: 'Security', fr: 'Sécurité' },
  'register.multiSelect': { en: 'Multi-Select', fr: 'Sélection Multiple' },
  'register.operatingLocation': { en: 'Operating Location', fr: 'Emplacement d\'Opération' },
  'register.formRegion': { en: 'Region', fr: 'Région' },
  'register.formCity': { en: 'City', fr: 'Ville' },
  'register.formCountry': { en: 'Country', fr: 'Pays' },
  'register.password': { en: 'Password', fr: 'Mot de passe' },
  'register.confirmPassword': { en: 'Confirm Password', fr: 'Confirmer le mot de passe' },
  'register.passwordRequirements': { en: 'Min 4 chars: 1 letter, 1 number, 1 special', fr: 'Min 4 caractères : 1 lettre, 1 chiffre, 1 caractère spécial' },
  'register.backToLogin': { en: 'Back to log in', fr: 'Retour à la connexion' },
  'register.backToChoice': { en: 'Back to account type', fr: 'Retour au type de compte' },
  'register.registrationFailed': { en: 'Registration failed.', fr: 'Inscription échouée.' },
  'register.locationReadFailed': { en: 'Could not read your location. Allow permission or enter the address manually.', fr: 'Impossible de lire votre position. Autorisez l’accès ou saisissez l’adresse manuellement.' },
  'registerOtp.emailRequired': { en: 'Email is required to receive your verification code.', fr: 'Un e-mail est requis pour recevoir votre code de vérification.' },
  'registerOtp.phoneRequired': { en: 'Phone number is required.', fr: 'Un numéro de téléphone est requis.' },
  'registerOtp.sendFailed': { en: 'Could not send verification code. Try again in a moment.', fr: 'Impossible d’envoyer le code de vérification. Réessayez dans un instant.' },
  'registerOtp.sendFailedCheck': { en: 'Could not send verification code. Check your number and try again.', fr: 'Impossible d’envoyer le code de vérification. Vérifiez votre numéro et réessayez.' },
  'registerOtp.codeSent': { en: 'We sent a 6-digit code to {email}.', fr: 'Nous avons envoyé un code à 6 chiffres à {email}.' },
  'registerOtp.newCodeSent': { en: 'New code sent to {email}.', fr: 'Un nouveau code a été envoyé à {email}.' },
  'registerOtp.verifyEmailTitle': { en: 'Verify your email', fr: 'Vérifiez votre e-mail' },
  'registerOtp.verifyCodeLabel': { en: 'Verification code', fr: 'Code de vérification' },
  'registerOtp.sendCodeFirst': { en: 'Please send a verification code first.', fr: 'Veuillez d’abord envoyer un code de vérification.' },
  'registerOtp.enterCode': { en: 'Please enter the 6-digit code.', fr: 'Veuillez saisir le code à 6 chiffres.' },
  'registerOtp.emailMissing': { en: 'Email is required. Go back and enter your email on the registration form.', fr: 'L’adresse e-mail est requise. Revenez au formulaire d’inscription et saisissez votre e-mail.' },
  'registerOtp.invalidOrExpired': { en: 'Invalid or expired code. Please try again.', fr: 'Code invalide ou expiré. Veuillez réessayer.' },
  'registerOtp.verificationFailed': { en: 'Verification failed. Please try again.', fr: 'La vérification a échoué. Veuillez réessayer.' },
  'registerOtp.creatingTitle': { en: 'Creating your account…', fr: 'Création de votre compte…' },
  'registerOtp.creatingBody': { en: 'Almost there — we are setting up your profile. This only takes a moment.', fr: 'Presque terminé — nous préparons votre profil. Cela ne prend qu’un instant.' },
  'registerOtp.tryAgain': { en: 'Try creating account again', fr: 'Réessayer la création du compte' },
  'registerOtp.sending': { en: 'Sending…', fr: 'Envoi…' },

  // Generic Form
  'form.name': { en: 'Full Name', fr: 'Nom Complet' },
  'form.optional': { en: 'optional', fr: 'facultatif' },
  'form.farmName': { en: 'Business/Farm Name', fr: 'Nom de la Ferme/Entreprise' },
  'form.email': { en: 'Email', fr: 'Email' },
  'form.phone': { en: 'Phone', fr: 'Téléphone' },
  'form.security': { en: 'Security', fr: 'Sécurité' },
  'form.password': { en: 'Password', fr: 'Mot de passe' },
  'form.confirmPassword': { en: 'Confirm Password', fr: 'Confirmer le mot de passe' },
  'form.passwordRequirements': { en: 'Min 4 chars: 1 letter, 1 number, 1 special', fr: 'Min 4 caractères : 1 lettre, 1 chiffre, 1 caractère spécial' },
  'form.address': { en: 'Address', fr: 'Adresse' },
  'form.desc': { en: 'Description', fr: 'Description' },
  'form.category': { en: 'Category', fr: 'Catégorie' },
  'form.price': { en: 'Price', fr: 'Prix' },
  'form.quantity': { en: 'Quantity', fr: 'Quantité' },
  'form.unit': { en: 'Unit', fr: 'Unité' },
  'form.cancel': { en: 'Cancel', fr: 'Annuler' },
  'form.confirm': { en: 'Confirm', fr: 'Confirmer' },
  'form.processing': { en: 'Processing…', fr: 'Traitement…' },
  'form.loading': { en: 'Loading…', fr: 'Chargement…' },
  'form.locationNotSet': { en: 'Location not set', fr: 'Lieu non défini' },
  'form.featuresPlaceholder': { en: 'e.g. sweet, crunchy, grown without pesticides, harvest 2023', fr: 'ex: sucré, croquant, cultivé sans pesticides, récolte 2023' },
  'form.removeImage': { en: 'Remove image', fr: 'Supprimer l image' },
  'form.addressPlaceholder': { en: 'Address/Street', fr: 'Adresse/Rue' },
  'form.hidePassword': { en: 'Hide password', fr: 'Masquer le mot de passe' },
  'form.showPassword': { en: 'Show password', fr: 'Afficher le mot de passe' },
  'form.back': { en: 'Back', fr: 'Retour' },
  'form.profileAlt': { en: 'Profile', fr: 'Profil' },
  'form.submit': { en: 'Submit', fr: 'Valider' },
  'form.save': { en: 'Save Changes', fr: 'Sauvegarder' },
  'form.saving': { en: 'Saving…', fr: 'Enregistrement…' },
  'form.add': { en: 'Add', fr: 'Ajouter' },
  'form.delete': { en: 'Delete', fr: 'Supprimer' },
  'form.create': { en: 'Create Account', fr: 'Créer un Compte' },
  'form.publish': { en: 'Publish', fr: 'Publier' },
  'form.unpublish': { en: 'Unpublish', fr: 'Dépublier' },
  'form.editOffer': { en: 'Edit Offer', fr: 'Modifier l\'Offre' },
  'form.update': { en: 'Update', fr: 'Mettre à jour' },
  'form.location': { en: 'Product Location', fr: 'Lieu du Produit' },
  'form.deliveryAvailable': { en: 'Delivery Available', fr: 'Livraison Possible' },
  'form.negotiable': { en: 'Price Negotiable', fr: 'Prix Négociable' },
  'form.minOrder': { en: 'Minimum Order', fr: 'Commande Minimum' },
  'form.maxOrder': { en: 'Maximum Order', fr: 'Commande Maximum' },
  'form.title': { en: 'Title', fr: 'Titre' },
  'form.prev': { en: 'Previous', fr: 'Précédent' },
  'form.next': { en: 'Next', fr: 'Suivant' },
  'form.required': { en: 'Required', fr: 'Requis' },
  'form.step': { en: 'Step', fr: 'Étape' },
  'form.minOrderHint': { en: 'Minimum amount a client can buy.', fr: 'Quantité minimale qu un client peut acheter.' },
  'form.maxOrderHint': { en: 'Maximum amount per client (0 = Unlimited).', fr: 'Quantité maximale par client (0 = Illimitée).' },
  'form.titlePlaceholder': { en: 'e.g. Organic Red Onions', fr: 'ex: Oignons Rouges Biologiques' },
  // Wizard Steps
  'wizard.productDetails': { en: 'Product Details', fr: 'Détails du Produit' },
  'wizard.pricingStock': { en: 'Pricing & Stock', fr: 'Prix & Stock' },
  'wizard.logistics': { en: 'Logistics', fr: 'Logistique' },
  'wizard.error': { en: 'Please fill all required fields.', fr: 'Veuillez remplir tous les champs obligatoires.' },
  'wizard.noteMinMax': { en: 'Max quantity cannot be less than Min quantity.', fr: 'La quantité max ne peut être inférieure à la min.' },

  // Categories
  'category.Agriculture': { en: 'Agriculture', fr: 'Agriculture' },
  'category.Livestock farming': { en: 'Livestock farming', fr: 'Élevage' },
  'category.Fish Farming': { en: 'Fish Farming', fr: 'Pisciculture' },
  'category.Vegetables': { en: 'Vegetables', fr: 'Légumes' },
  'category.Processed foods': { en: 'Processed foods', fr: 'Aliments transformés' },
  'category.Plant Protection Products': { en: 'Plant Protection Products', fr: 'Produits phytosanitaires' },
  'category.Fertilizer': { en: 'Fertilizer', fr: 'Engrais' },
  'category.Equipment': { en: 'Equipment', fr: 'Équipement' },
  'category.Service': { en: 'Service', fr: 'Service' },
  'category.Cereals': { en: 'Cereals', fr: 'Céréales' },
  'category.Oils': { en: 'Oils', fr: 'Huiles' },
  'category.Canned Goods': { en: 'Canned Goods', fr: 'Conserves' },
  'category.Spices': { en: 'Spices', fr: 'Épices' },
  'category.Retail': { en: 'Retail', fr: 'Détail' },
  // Canonical marketplace categories (keep in sync with data/categories.ts)
  'category.Livestock Farming': { en: 'Livestock Farming', fr: 'Élevage' },
  'category.Process Goods': { en: 'Process Goods', fr: 'Produits transformés' },
  'category.Equipment & Machinery': { en: 'Equipment & Machinery', fr: 'Équipement et machines' },
  'category.General Services': { en: 'General Services', fr: 'Services généraux' },
  'category.Plants Protection Products': { en: 'Plants Protection Products', fr: 'Produits phytosanitaires' },
  'category.Seeds': { en: 'Seeds', fr: 'Semences' },
  'category.Nurseries': { en: 'Nurseries', fr: 'Pépinières' },
  'category.Animal Feeds': { en: 'Animal Feeds', fr: 'Aliments pour animaux' },
  'category.General laborer': { en: 'General laborer', fr: 'Main-d’œuvre générale' },
  'category.Transit & warehouse': { en: 'Transit & warehouse', fr: 'Transit et entreposage' },
  'category.Equipment & Machinery Rentals': { en: 'Equipment & Machinery Rentals', fr: 'Location d’équipement et de machines' },

  // Units of Measure
  'unit.KG': { en: 'Kilogram (kg)', fr: 'Kilogramme (kg)' },
  'unit.TON': { en: 'Ton', fr: 'Tonne' },
  'unit.CRATE': { en: 'Crate', fr: 'Cajette' },
  'unit.BUNDLE': { en: 'Bundle', fr: 'Paquet' },
  'unit.LITER': { en: 'Liter', fr: 'Litre' },
  'unit.UNIT': { en: 'Unit', fr: 'Unité' },
  'unit.HOUR': { en: 'Hour', fr: 'Heure' },
  'unit.DAY': { en: 'Day', fr: 'Jour' },
  'unit.HECTARE': { en: 'Hectare', fr: 'Hectare' },
  'unit.JOB': { en: 'Job/Task', fr: 'Tâche' },

  // Marketplaces
  'market.searchPlaceholder': { en: 'Search products...', fr: 'Rechercher des produits...' },
  'market.locationPlaceholder': { en: 'Region/City...', fr: 'Région/Ville...' },
  'market.allCategories': { en: 'All Categories', fr: 'Toutes Catégories' },
  'market.noResults': { en: 'No offers match your criteria.', fr: 'Aucune offre ne correspond à vos critères.' },
  'market.clear': { en: 'Clear Filters', fr: 'Effacer les filtres' },
  'market.available': { en: 'Available', fr: 'Disponible' },
  'market.per': { en: 'per', fr: 'par' },
  'market.view': { en: 'View Details', fr: 'Voir Détails' },
  'market.readMore': { en: 'Read more', fr: 'Lire plus' },
  'market.producerTitle': { en: 'Producer Market', fr: 'Marché Producteurs' },
  'market.atiTitle': { en: 'ATI Store', fr: 'Boutique ATI' },
  'market.recommended': { en: 'Recommended for You', fr: 'Recommandé pour Vous' },
  'market.offerCount': { en: '{count} offers', fr: '{count} offres' },
  'market.offerCountOne': { en: '1 offer', fr: '1 offre' },
  'market.updatedJustNow': { en: 'Updated just now', fr: 'Mis à jour à l’instant' },
  'market.emptyHint': { en: 'Try another category or clear your filters.', fr: 'Essayez une autre catégorie ou effacez vos filtres.' },
  'market.browseAll': { en: 'Browse all categories', fr: 'Parcourir toutes les catégories' },
  'market.tryAti': { en: 'Shop ATI Store', fr: 'Boutique ATI' },
  'market.tryProducers': { en: 'Browse Producer Market', fr: 'Marché Producteurs' },

  // Product Details
  'product.back': { en: 'Back to results', fr: 'Retour aux résultats' },
  'product.producerOffer': { en: 'Producer Offer', fr: 'Offre Producteur' },
  'product.atiOffer': { en: 'ATI Store', fr: 'Boutique ATI' },
  'product.negotiable': { en: 'Price Negotiable', fr: 'Prix Négociable' },
  'product.stock': { en: 'Stock Available', fr: 'Stock Disponible' },
  'product.soldBy': { en: 'Sold by', fr: 'Vendu par' },
  'product.producerReviews': { en: 'Producer Reviews', fr: 'Avis sur le producteur' },
  'product.offerReviews': { en: 'Product Reviews', fr: 'Avis sur le produit' },
  'product.noReviewsProducer': {
    en: 'No reviews yet. Be the first to review this producer after a purchase!',
    fr: 'Aucun avis pour le moment. Soyez le premier à noter ce producteur après un achat !',
  },
  'product.noReviewsOffer': {
    en: 'No reviews yet. Be the first to review this product after a purchase!',
    fr: 'Aucun avis pour le moment. Soyez le premier à noter ce produit après un achat !',
  },
  'product.verified': { en: 'Verified Producer', fr: 'Producteur Vérifié' },
  'product.addToCart': { en: 'Add to Cart', fr: 'Ajouter au Panier' },
  'product.negotiate': { en: 'Negotiate Price', fr: 'Négocier le Prix' },
  'product.bookNow': { en: 'Book Now', fr: 'Réserver Maintenant' },
  'product.bookNowHint': {
    en: 'Adds this booking to your cart — next you confirm delivery and pay with Place Order.',
    fr: 'Ajoute cette réservation au panier — puis confirmez la livraison et payez avec « Passer la commande ».',
  },
  'product.selectSlot': { en: 'Select a Date & Time', fr: 'Choisir une Date et Heure' },
  'product.loadingSlots': { en: 'Loading available slots…', fr: 'Chargement des créneaux disponibles…' },
  'product.rateProducer': { en: 'Rate Producer', fr: 'Noter le Producteur' },
  'product.compare': { en: 'Compare', fr: 'Comparer' },
  'product.share': { en: 'Share', fr: 'Partager' },
  'product.linkCopied': { en: 'Link copied to clipboard', fr: 'Lien copié dans le presse-papiers' },
  'product.related': { en: 'More in this category', fr: 'Plus dans cette catégorie' },
  'product.addedFavorite': { en: 'Saved to favorites', fr: 'Ajouté aux favoris' },
  'product.removedFavorite': { en: 'Removed from favorites', fr: 'Retiré des favoris' },
  'product.addedCompare': { en: 'Added to compare', fr: 'Ajouté à la comparaison' },
  'product.removedCompare': { en: 'Removed from compare', fr: 'Retiré de la comparaison' },
  
  // Cart
  'cart.title': { en: 'Shopping Cart', fr: 'Panier' },
  'cart.empty': { en: 'Your cart is empty', fr: 'Votre panier est vide' },
  'cart.emptyDesc': { en: 'Looks like you haven\'t added anything yet.', fr: 'Il semble que vous n\'ayez rien ajouté pour l\'instant.' },
  'cart.start': { en: 'Start Shopping', fr: 'Commencer vos achats' },
  'cart.browseAti': { en: 'Shop ATI Store', fr: 'Boutique ATI' },
  'cart.remove': { en: 'Remove', fr: 'Retirer' },
  'cart.saveForLater': { en: 'Save for Later', fr: 'Sauver pour plus tard' },
  'cart.singleProducer': { en: 'Ordered from a single producer', fr: 'Commandé chez un seul producteur' },
  'cart.clear': { en: 'Clear Cart', fr: 'Vider le panier' },
  'cart.summary': { en: 'Order Summary', fr: 'Résumé de la commande' },
  'cart.bookingCheckoutHint': {
    en: 'Your service is in the cart. Choose delivery below, then tap Place Order to complete checkout.',
    fr: 'Votre service est dans le panier. Choisissez la livraison ci-dessous, puis appuyez sur « Passer la commande » pour finaliser.',
  },
  'cart.subtotal': { en: 'Subtotal', fr: 'Sous-total' },
  'cart.serviceFee': { en: 'Service Fee (16.5%)', fr: 'Frais de service (16,5%)' },
  'cart.total': { en: 'Order Total', fr: 'Total Commande' },
  'cart.placeOrder': { en: 'Place Order', fr: 'Passer la commande' },
  'cart.continue': { en: 'Continue Shopping', fr: 'Continuer vos achats' },
  'cart.loginRequired': { en: 'Please login to place an order.', fr: 'Veuillez vous connecter pour commander.' },
  'cart.success': { en: 'Order placed successfully!', fr: 'Commande passée avec succès !' },
  'cart.conflict': { en: 'Cart cleared and item added!', fr: 'Panier vidé et article ajouté !' },
  'cart.confirmClear': { 
    en: 'Your cart contains items from another producer.\n\nA cart can only contain items from a single producer.\n\nDo you want to clear your cart and add this item?',
    fr: 'Votre panier contient des articles d\'un autre producteur.\n\nUn panier ne peut contenir que des articles d\'un seul producteur.\n\nVoulez-vous vider votre panier et ajouter cet article ?'
  },
  'cart.confirmClearTitle': { en: 'Replace cart contents?', fr: 'Remplacer le contenu du panier ?' },
  'cart.confirmClearBody': {
    en: 'Your cart already contains items from another producer. We can only checkout one producer at a time. Clear the existing cart and add this item?',
    fr: 'Votre panier contient déjà des articles d\'un autre producteur. Une commande ne peut concerner qu\'un seul producteur à la fois. Vider le panier et ajouter cet article ?'
  },
  'cart.confirmClearConfirm': { en: 'Clear & Add', fr: 'Vider et Ajouter' },
  'cart.confirmRemoveTitle': { en: 'Remove this item?', fr: 'Retirer cet article ?' },
  'cart.confirmRemoveBody': { en: 'This item will be removed from your cart.', fr: 'Cet article sera retiré de votre panier.' },
  'favorites.removeTitle': { en: 'Remove from favorites?', fr: 'Retirer des favoris ?' },
  'favorites.removeBody': { en: 'You can add it back later from the product page.', fr: 'Vous pourrez l\'ajouter à nouveau plus tard depuis la page du produit.' },
  'notif.deleteTitle': { en: 'Delete this notification?', fr: 'Supprimer cette notification ?' },
  'notif.deleteBody': { en: 'It will be permanently removed from your inbox.', fr: 'Elle sera supprimée définitivement de votre boîte de réception.' },
  'notif.clearAllTitle': { en: 'Clear all notifications?', fr: 'Effacer toutes les notifications ?' },
  'notif.clearAllBody': { en: 'All notifications in your inbox will be permanently deleted. This cannot be undone.', fr: 'Toutes les notifications de votre boîte seront définitivement supprimées. Cette action est irréversible.' },
  'payment.removeTitle': { en: 'Remove this payment method?', fr: 'Supprimer ce moyen de paiement ?' },
  'payment.removeBody': { en: 'You will need to add it again before it can receive payouts.', fr: 'Vous devrez l\'ajouter à nouveau avant de pouvoir recevoir des paiements.' },
  'location.removeTitle': { en: 'Remove this location?', fr: 'Supprimer cette adresse ?' },
  'location.removeBody': { en: 'This address will be removed from your profile.', fr: 'Cette adresse sera retirée de votre profil.' },
  'cart.pickupSearchCity': { en: 'Search city or area (Google Places)', fr: 'Rechercher ville ou zone (Google Places)' },
  'cart.pickupSearchPlaceholder': { en: 'Start typing a city…', fr: 'Saisissez une ville…' },
  'cart.pickupProfileCity': { en: 'Your city (from profile)', fr: 'Votre ville (profil)' },
  'cart.pickupProfileCityHint': { en: 'Pickup must be in this city. Update your profile to change it.', fr: 'Le retrait doit être dans cette ville. Modifiez votre profil pour changer.' },
  'cart.pickupStation': { en: 'Select pickup station', fr: 'Choisir le point de retrait' },
  'cart.pickupPlacesFallback': { en: 'Places unavailable — choose a city from the list.', fr: 'Places indisponible — choisissez une ville dans la liste.' },
  'cart.pickupNoPointsHint': {
    en: 'No pickup points in this area yet. Admin can add new pickup points; meanwhile choose another city.',
    fr: 'Aucun point de retrait dans cette zone pour le moment. Un administrateur peut en ajouter ; en attendant, choisissez une autre ville.',
  },
  'cart.pickupNoProfileCity': { en: 'Add your city in profile', fr: 'Ajoutez votre ville au profil' },
  'cart.pickupPlacesLoading': { en: 'Loading Places…', fr: 'Chargement de Places…' },
  'cart.pickupPlacesReadyHint': {
    en: 'Pick a suggestion or leave the field to match a station city.',
    fr: 'Choisissez une suggestion ou quittez le champ pour faire correspondre une ville.',
  },
  'cart.confirmOrder': { en: 'Confirm Order', fr: 'Confirmer la Commande' },
  'cart.recap': { en: 'Order Recap', fr: 'Récapitulatif de la Commande' },
  'cart.validate': { en: 'Validate Order', fr: 'Valider la Commande' },
  'cart.includesServices': { en: 'Includes service bookings', fr: 'Inclut des réservations de service' },
  
  // Service orders (vs product orders)
  'service.badge': { en: 'Service', fr: 'Service' },
  'service.booking': { en: 'Service booking', fr: 'Réservation de service' },
  'service.scheduledServices': { en: 'Scheduled services', fr: 'Services planifiés' },
  'service.appointment': { en: 'Appointment', fr: 'Rendez-vous' },
  'service.perSlotHours': { en: 'h per slot', fr: 'h par créneau' },
  'service.lineSingular': { en: 'service', fr: 'service' },
  'service.linePlural': { en: 'services', fr: 'services' },
  'service.slotSingular': { en: 'slot', fr: 'créneau' },
  'service.slotPlural': { en: 'slots', fr: 'créneaux' },
  'service.bookedQty': { en: 'Booked', fr: 'Réservé' },
  'service.paidPrepareAppt': { en: 'Paid — prepare for appointment', fr: 'Payé — préparez le rendez-vous' },
  'service.readyToStart': { en: 'SERVICE — ready to start', fr: 'SERVICE — prêt à commencer' },
  'service.visitLocation': { en: 'Visit / delivery location', fr: 'Lieu de passage / livraison' },
  'service.fulfillment': { en: 'Service Fulfillment', fr: 'Réalisation du service' },
  'service.atClientLocation': { en: 'At client location', fr: 'Chez le client' },
  'service.atServicePoint': { en: 'At pickup/service point', fr: 'Au point de retrait/service' },
  'service.locationInfo': { en: 'Service Location', fr: 'Lieu du service' },
  'dash.startServiceVisit': { en: 'Start visit', fr: 'Démarrer la visite' },
  'dash.itemsProduct': { en: 'items', fr: 'articles' },
  'dash.paidPrepareShip': { en: 'PAID — prepare shipment', fr: 'PAYÉ — préparer l\'expédition' },
  
  // Dashboard
  'dash.status': { en: 'Status', fr: 'Statut' },
  'dash.pending': { en: 'Pending Validation', fr: 'En attente de validation' },
  'dash.pendingMsg': {
    en: 'Your producer account is pending. You can still buy as a client. Enter your NIU / tax ID and upload your NIU certificate in your profile to complete verification.',
    fr: 'Votre compte producteur est en attente. Vous pouvez toujours acheter. Saisissez votre NIU et téléversez votre certificat NIU dans votre profil pour finaliser la vérification.',
  },
  'producerStatus.pendingTitle': {
    en: 'Your producer account is pending approval',
    fr: 'Votre compte producteur est en attente d\'approbation',
  },
  'producerStatus.pendingMsg': {
    en: 'You registered as a producer, but you cannot publish offers or sell until our team validates your account. Complete your tax documents in your profile to speed up review.',
    fr: 'Vous êtes inscrit comme producteur, mais vous ne pouvez pas publier d\'offres ni vendre tant que notre équipe n\'a pas validé votre compte. Complétez vos documents fiscaux dans votre profil pour accélérer la vérification.',
  },
  'producerStatus.pendingHint': {
    en: 'You can still browse the marketplace and buy as a client while you wait.',
    fr: 'Vous pouvez toujours parcourir la place de marché et acheter en tant que client en attendant.',
  },
  'producerStatus.rejectedTitle': {
    en: 'Producer application not approved',
    fr: 'Demande producteur non approuvée',
  },
  'producerStatus.rejectedMsg': {
    en: 'Your producer account was not approved. Open your profile to review your documents or contact support for help.',
    fr: 'Votre compte producteur n\'a pas été approuvé. Ouvrez votre profil pour vérifier vos documents ou contactez le support.',
  },
  'producerStatus.completeVerification': {
    en: 'Complete verification',
    fr: 'Finaliser la vérification',
  },
  'producerStatus.viewProfile': {
    en: 'View profile',
    fr: 'Voir le profil',
  },
  'producerStatus.goToDashboard': {
    en: 'Producer dashboard',
    fr: 'Tableau de bord producteur',
  },
  'producerStatus.roleBadgePending': {
    en: 'Producer · Pending approval',
    fr: 'Producteur · En attente',
  },
  'producerStatus.roleBadgeRejected': {
    en: 'Producer · Not approved',
    fr: 'Producteur · Non approuvé',
  },
  'producerStatus.roleBadgeApproved': {
    en: 'Approved producer',
    fr: 'Producteur approuvé',
  },
  'producerStatus.welcomePending': {
    en: 'Registration received! Your producer account is now pending admin approval. Complete your documents below while you wait.',
    fr: 'Inscription reçue ! Votre compte producteur est en attente d\'approbation par l\'administration. Complétez vos documents ci-dessous en attendant.',
  },
  'producerStatus.cannotPublishYet': {
    en: 'Your producer account is pending approval. Complete verification in your profile before publishing offers.',
    fr: 'Votre compte producteur est en attente. Finalisez la vérification dans votre profil avant de publier des offres.',
  },
  'dash.activeOffers': { en: 'Total Active Offers', fr: 'Offres Actives' },
  'dash.myCatalog': { en: 'My Catalog', fr: 'Mon Catalogue' },
  'dash.myPurchases': { en: 'My Purchases', fr: 'Mes Achats' },
  'dash.myPurchasesEmpty': { en: 'No active purchases. Browse the marketplace to buy from other producers.', fr: 'Aucun achat en cours. Parcourez la marketplace pour acheter chez d\'autres producteurs.' },
  'dash.myPurchasesHint': { en: 'Orders you placed as a buyer — pay, track delivery, and complete purchases here.', fr: 'Commandes passées en tant qu\'acheteur — payez, suivez la livraison et finalisez vos achats ici.' },
  'dash.incomingOrders': { en: 'Incoming Orders', fr: 'Commandes Reçues' },
  'dash.ordersToShip': { en: 'Orders to Ship', fr: 'Commandes à Expédier' },
  'dash.awaitingPayment': { en: 'Confirmed – Awaiting Payment', fr: 'Confirmées – En attente de paiement' },
  'dash.allOrders': { en: 'All Orders', fr: 'Toutes les commandes' },
  'dash.allOrdersDesc': { en: 'View details for any order from booking to delivery, including completed or cancelled.', fr: 'Voir les détails de chaque commande du réservation à la livraison, y compris terminées ou annulées.' },
  'dash.orderHistory': { en: 'Order History (Completed/Cancelled)', fr: 'Historique (Terminées/Annulées)' },

  // Profile fields
  'profile.firstName': { en: 'First Name', fr: 'Prénom' },
  'profile.lastName': { en: 'Last Name', fr: 'Nom de famille' },
  'profile.gender': { en: 'Gender', fr: 'Sexe' },
  'profile.dob': { en: 'Date of Birth', fr: 'Date de naissance' },
  'profile.selectGender': { en: 'Select Gender', fr: 'Sélectionner le sexe' },
  'profile.male': { en: 'Male', fr: 'Masculin' },
  'profile.female': { en: 'Female', fr: 'Féminin' },
  'profile.city': { en: 'City', fr: 'Ville' },
  'profile.region': { en: 'Region / State', fr: 'Région / État' },
  'profile.locationDetails': { en: 'Location Details', fr: 'Détails de localisation' },
  'profile.locationHint': { en: 'Use your device location (browser permission). We do not load Google Places on signup. You can edit the address fields below.', fr: 'Utilisez votre position (autorisation navigateur). Nous ne chargeons pas Google Places lors de l\'inscription. Vous pouvez modifier les champs d\'adresse ci-dessous.' },
  'profile.useMyLocation': { en: 'Use my current location', fr: 'Utiliser ma position actuelle' },
  'profile.gettingLocation': { en: 'Getting location…', fr: 'Obtention de la position…' },
  'profile.coordinates': { en: 'Coordinates:', fr: 'Coordonnées :' },
  'profile.addressPlaceholder': { en: 'Street, area, or full address', fr: 'Rue, quartier ou adresse complète' },

  // Validation messages
  'validation.firstNameRequired': { en: 'First name is required.', fr: 'Le prénom est requis.' },
  'validation.lastNameRequired': { en: 'Last name is required.', fr: 'Le nom de famille est requis.' },
  'validation.genderRequired': { en: 'Gender is required.', fr: 'Le sexe est requis.' },
  'validation.dobRequired': { en: 'Date of birth is required.', fr: 'La date de naissance est requise.' },
  'validation.emailRequired': { en: 'Valid email is required.', fr: 'Un email valide est requis.' },
  'validation.passwordRequired': { en: 'Enter your password.', fr: 'Entrez votre mot de passe.' },
  'validation.confirmPassword': { en: 'Confirm your password.', fr: 'Confirmez votre mot de passe.' },
  'validation.phoneRequired': { en: 'Enter your phone number.', fr: 'Entrez votre numéro de téléphone.' },
  'validation.phoneMin': { en: 'Enter a valid phone number (at least 6 digits).', fr: 'Entrez un numéro valide (au moins 6 chiffres).' },
  'validation.addressRequired': { en: 'Address is required.', fr: 'L\'adresse est requise.' },
  'validation.regionRequired': { en: 'Region is required.', fr: 'La région est requise.' },
  'validation.cityRequired': { en: 'City is required.', fr: 'La ville est requise.' },
  'validation.passwordsMatch': { en: 'Passwords do not match.', fr: 'Les mots de passe ne correspondent pas.' },
  'validation.descriptionMin': { en: 'Description should be at least 10 characters.', fr: 'La description doit contenir au moins 10 caractères.' },
  'validation.farmNameRequired': { en: 'Farm/Business name is required for business accounts.', fr: 'Le nom de la ferme/entreprise est requis pour les comptes professionnels.' },
  'validation.taxIdRequired': { en: 'Tax ID (NIU) is required.', fr: 'L\'identifiant fiscal (NIU) est requis.' },
  'validation.commentMin': { en: 'Please add a short comment.', fr: 'Veuillez ajouter un court commentaire.' },
  'validation.disputeReasonMin': { en: 'Please describe the issue in at least 5 characters.', fr: 'Veuillez décrire le problème en au moins 5 caractères.' },

  // UI labels
  'ui.hidePassword': { en: 'Hide password', fr: 'Masquer le mot de passe' },
  'ui.showPassword': { en: 'Show password', fr: 'Afficher le mot de passe' },
  'ui.hideConfirmPassword': { en: 'Hide confirm password', fr: 'Masquer la confirmation' },
  'ui.showConfirmPassword': { en: 'Show confirm password', fr: 'Afficher la confirmation' },
  'ui.creating': { en: 'Creating…', fr: 'Création…' },
  'ui.profile': { en: 'Profile', fr: 'Profil' },
  'ui.emailPlaceholder': { en: 'you@example.com', fr: 'vous@exemple.com' },
  'ui.phonePlaceholder': { en: '612 345 678', fr: '612 345 678' },

  // Client profile specific
  'client.profileTitle': { en: 'Client Profile', fr: 'Profil Client' },
  'client.loginRequired': { en: 'Please log in to view your profile.', fr: 'Veuillez vous connecter pour voir votre profil.' },
  'client.accessDenied': { en: 'Access Denied', fr: 'Accès refusé' },
  'client NoProfileFound': { en: 'No client profile was found for your account.', fr: 'Aucun profil client n\'a été trouvé pour votre compte.' },
  'client.completeRegistration': { en: 'Complete client registration', fr: 'Compléter l\'inscription client' },
  'client.imageSizeError': { en: 'Image must be 2 MB or less.', fr: 'L\'image doit faire 2 Mo ou moins.' },
  'client.imageTypeError': { en: 'Use JPG, PNG, or WebP.', fr: 'Utilisez JPG, PNG ou WebP.' },
  'client.uploadFailed': { en: 'Upload failed.', fr: 'Échec du téléchargement.' },
  'client.locationError': { en: 'Could not read your location. Allow permission or set the pin on the map.', fr: 'Impossible de lire votre position. Autorisez la permission ou placez le point sur la carte.' },
  'client.referralLinkCopied': { en: 'Referral link copied!', fr: 'Lien de parrainage copié !' },
  'client.upgradeFailed': { en: 'Upgrade failed. Please try again.', fr: 'Mise à niveau échouée. Veuillez réessayer.' },

  // Order timeline steps
  'orderTimeline.booked': { en: 'Booked', fr: 'Réservé' },
  'orderTimeline.confirmed': { en: 'Confirmed', fr: 'Confirmé' },
  'orderTimeline.paid': { en: 'Paid', fr: 'Payé' },
  'orderTimeline.inTransit': { en: 'In transit', fr: 'En transit' },
  'orderTimeline.delivered': { en: 'Delivered', fr: 'Livré' },
  'orderTimeline.completed': { en: 'Completed', fr: 'Terminé' },
  'dash.orderTimeline': { en: 'Order timeline', fr: 'Étapes de la commande' },
  'dash.orderPlaced': { en: 'Order placed', fr: 'Commande passée' },
  'dash.createFirst': { en: 'Create your first offer', fr: 'Créez votre première offre' },
  'dash.confirm': { en: 'Confirm Order', fr: 'Confirmer' },
  'dash.reject': { en: 'Reject', fr: 'Rejeter' },
  'dash.startDelivery': { en: 'Start Delivery', fr: 'Expédier' },
  'dash.awaitingClientReceipt': { en: 'Awaiting customer receipt', fr: 'En attente de réception client' },
  'dash.outForDelivery': { en: 'Out for Delivery', fr: 'En cours de livraison' },
  'dash.markDeliveredHint': { en: 'Mark as delivered once the customer has the order.', fr: 'Marquez comme livré dès que le client a reçu la commande.' },
  'dash.viewDetails': { en: 'View Details', fr: 'Voir Détails' },
  'dash.orderDetails': { en: 'Order Details', fr: 'Détails Commande' },
  'dash.client': { en: 'Client', fr: 'Client' },
  'dash.address': { en: 'Shipping Address', fr: 'Adresse de livraison' },
  'dash.items': { en: 'Items', fr: 'Articles' },
  'dash.mixedOrderHint': { en: 'Includes products and services', fr: 'Inclut produits et services' },
  'dash.orderValue': { en: 'Order value', fr: 'Valeur de la commande' },
  'dash.producerPayoutHint': { en: 'Your payout is this amount minus the 5% platform commission.', fr: 'Votre versement correspond à ce montant moins la commission de 5% de la plateforme.' },
  'dash.close': { en: 'Close', fr: 'Fermer' },
  'dash.availability': { en: 'Availability', fr: 'Disponibilité' },
  'dash.rateClient': { en: 'Rate Client', fr: 'Noter le Client' },
  'dash.uploadEvidence': { en: 'Upload Evidence', fr: 'Télécharger Preuve' },
  'dash.evidence': { en: 'Dispute Evidence', fr: 'Preuves du Litige' },
  'dash.myReviews': { en: 'My Reviews', fr: 'Mes Avis' },
  
  // Wallet
  'wallet.title': { en: 'My Wallet', fr: 'Mon Portefeuille' },
  'wallet.balance': { en: 'Current Balance', fr: 'Solde Actuel' },
  'wallet.available': { en: 'Available to Withdraw', fr: 'Disponible pour retrait' },
  'wallet.topup': { en: 'Top Up Wallet', fr: 'Recharger le compte' },
  'wallet.withdraw': { en: 'Withdraw Funds', fr: 'Retirer des fonds' },
  'wallet.history': { en: 'Transaction History', fr: 'Historique des Transactions' },
  'wallet.requests': { en: 'Withdrawal Requests', fr: 'Demandes de Retrait' },
  'wallet.amount': { en: 'Amount', fr: 'Montant' },
  'wallet.type': { en: 'Type', fr: 'Type' },
  'wallet.date': { en: 'Date', fr: 'Date' },
  'wallet.desc': { en: 'Description', fr: 'Description' },
  'wallet.selectMethod': { en: 'Select Payment Method', fr: 'Choisir le moyen de paiement' },
  'wallet.selectSaved': { en: 'Select Saved Account', fr: 'Choisir un compte enregistré' },
  'wallet.enterAmount': { en: 'Enter Amount (XAF)', fr: 'Entrer le montant (XAF)' },
  'wallet.phoneNumber': { en: 'Phone Number', fr: 'Numéro de téléphone' },
  'wallet.txnId': { en: 'Transaction Reference ID', fr: 'Référence Transaction (ID)' },
  'wallet.verify': { en: 'Verify & Fund', fr: 'Vérifier et Financer' },
  'wallet.requestWithdraw': { en: 'Request Withdrawal', fr: 'Demander un retrait' },
  'wallet.bank': { en: 'Bank Transfer', fr: 'Virement Bancaire' },
  'wallet.manualDesc': { en: 'To fund your wallet, perform a transfer using your provider and enter the Transaction ID below.', fr: 'Pour recharger, effectuez un transfert via votre opérateur et entrez l\'ID de transaction ci-dessous.' },
  'wallet.withdrawDesc': { en: 'Select a provider to transfer funds from your wallet to your mobile money account.', fr: 'Sélectionnez un opérateur pour transférer des fonds de votre portefeuille vers votre compte mobile money.' },
  'wallet.processing': { en: 'Processing...', fr: 'Traitement...' },
  'wallet.success': { en: 'Deposit successful!', fr: 'Dépôt réussi !' },
  'wallet.confirmingPayment': { en: 'Confirming your payment…', fr: 'Confirmation de votre paiement…' },
  'wallet.topUpSuccess': { en: 'Wallet topped up successfully!', fr: 'Portefeuille rechargé avec succès !' },
  'wallet.paymentNotCompleted': { en: 'Payment was not completed.', fr: 'Le paiement n’a pas été finalisé.' },
  'wallet.stillConfirming': { en: 'Still confirming your payment — it will appear once settled.', fr: 'Confirmation du paiement toujours en cours — il apparaîtra une fois validé.' },
  'wallet.withdrawProducerOnly': { en: 'Withdrawals are for producers only.', fr: 'Les retraits sont réservés aux producteurs.' },
  'wallet.selectPaymentMethod': { en: 'Please select a payment method.', fr: 'Veuillez sélectionner un moyen de paiement.' },
  'wallet.amountMin': { en: 'Amount must be at least 100 XAF.', fr: 'Le montant doit être d’au moins 100 XAF.' },
  'wallet.withdrawAmountMin': { en: 'Enter a valid amount (min 100 XAF).', fr: 'Entrez un montant valide (min. 100 XAF).' },
  'wallet.amountFeeLimit': {
    en: 'Amount + 1.5% fee ({total} XAF) cannot exceed your balance of {balance} XAF.',
    fr: 'Le montant + frais de 1,5 % ({total} XAF) ne peut pas dépasser votre solde de {balance} XAF.',
  },
  'wallet.startPaymentFailed': { en: 'Could not start payment.', fr: 'Impossible de démarrer le paiement.' },
  'wallet.noTx': { en: 'No transactions yet.', fr: 'Aucune transaction.' },
  'wallet.noReq': { en: 'No withdrawal requests.', fr: 'Aucune demande de retrait.' },
  'wallet.processWithdraw': { en: 'Submit Withdrawal', fr: 'Soumettre le retrait' },

  // OTP verification
  'otp.verifyProfileTitle': { en: 'Verify identity to update profile', fr: 'Vérifiez votre identité pour modifier le profil' },
  'otp.verifyWithdrawTitle': { en: 'Verify identity to withdraw', fr: 'Vérifiez votre identité pour retirer' },
  'otp.sendCode': { en: 'Send code to my phone', fr: 'Envoyer le code à mon téléphone' },
  'otp.verify': { en: 'Verify', fr: 'Vérifier' },
  'otp.verifyTitle': { en: 'Verify with OTP', fr: 'Vérifier avec OTP' },
  'otp.requestNewCode': { en: 'Request new code', fr: 'Demander un nouveau code' },
  'otp.enterCode': { en: 'Enter the 6-digit code sent to your registered phone number.', fr: 'Entrez le code à 6 chiffres envoyé à votre numéro enregistré.' },

  // Orders
  'order.id': { en: 'Order ID', fr: 'ID Commande' },
  'order.date': { en: 'Date', fr: 'Date' },
  'order.total': { en: 'Total', fr: 'Total' },
  'order.status': { en: 'Status', fr: 'Statut' },
  'order.payNow': { en: 'Pay Now', fr: 'Payer Maintenant' },
  'order.confirmReceipt': { en: 'Confirm Receipt', fr: 'Confirmer la Réception' },
  'order.reportProblem': { en: 'Report a Problem', fr: 'Signaler un Problème' },
  'order.revealContact': { en: 'Reveal Contact Info', fr: 'Voir Contact' },
  'order.shareLocation': { en: 'Share Location', fr: 'Partager Position' },
  'order.contactInfo': { en: 'Contact Information', fr: 'Coordonnées' },
  'order.pending': { en: 'Pending Validation', fr: 'En attente de validation' },
  'order.confirmed': { en: 'Confirmed - Awaiting Payment', fr: 'Confirmé - En attente de paiement' },
  'order.status.pending': { en: 'Pending', fr: 'En attente' },
  'order.status.awaitingPayment': { en: 'Awaiting payment', fr: 'Paiement dû' },
  'order.status.preparing': { en: 'Preparing', fr: 'En préparation' },
  'order.status.delivered': { en: 'Delivered', fr: 'Livré' },
  'order.status.dispute': { en: 'Dispute', fr: 'Litige' },
  'order.paid': { en: 'Paid - In Preparation', fr: 'Payé - En Préparation' },
  'order.completed': { en: 'Completed', fr: 'Terminé' },
  'order.cancelled': { en: 'Cancelled', fr: 'Annulé' },
  'order.cancelConfirmTitle': { en: 'Cancel this order?', fr: 'Annuler cette commande ?' },
  'order.cancelConfirmBody': { en: 'This will cancel the order. The producer will be notified. This action cannot be undone.', fr: 'Cela annulera la commande. Le producteur sera notifié. Cette action est irréversible.' },
  'order.cancelKeep': { en: 'Keep order', fr: 'Conserver la commande' },
  'order.receiptConfirmTitle': { en: 'Confirm receipt?', fr: 'Confirmer la réception ?' },
  'order.receiptConfirmBody': { en: 'Confirm only after you have received and inspected the goods. The seller will then finalize the delivery.', fr: 'Confirmez uniquement après avoir reçu et inspecté les articles. Le vendeur finalisera ensuite la livraison.' },
  'order.awaitingSellerDelivery': { en: 'Receipt confirmed — awaiting seller', fr: 'Réception confirmée — en attente du vendeur' },
  'order.awaitingCustomerConfirm': { en: 'Waiting for the customer to confirm receipt before you can mark this delivered.', fr: 'En attente de la confirmation de réception du client avant de pouvoir marquer comme livré.' },
  'order.markDelivered': { en: 'Mark as Delivered', fr: 'Marquer comme Livré' },
  'order.onItsWay': { en: 'On its way', fr: 'En route' },
  'order.completeOrder': { en: 'Confirm & Complete', fr: 'Confirmer & Terminer' },
  'order.completeConfirmTitle': { en: 'Confirm you received this order?', fr: 'Confirmer la réception de cette commande ?' },
  'order.completeConfirmBody': { en: 'Only confirm after you have received and checked everything. This closes the order and releases payment to the seller.', fr: 'Confirmez uniquement après avoir reçu et vérifié le tout. Cela clôture la commande et libère le paiement au vendeur.' },
  'order.requestCancellation': { en: 'Request Cancellation', fr: 'Demander l’Annulation' },
  'order.requestCancellationHint': { en: 'An administrator must approve this cancellation before the order is cancelled (and refunded if already paid).', fr: 'Un administrateur doit approuver cette annulation avant que la commande soit annulée (et remboursée si déjà payée).' },
  'order.submitCancellation': { en: 'Submit Request', fr: 'Envoyer la Demande' },
  'order.cancellationPending': { en: 'Cancellation pending approval', fr: 'Annulation en attente d’approbation' },
  'order.reschedule': { en: 'Reschedule Appointment', fr: 'Reprogrammer le Rendez-vous' },
  'order.rescheduleHint': { en: 'Choose the correct appointment date and time for this service booking.', fr: 'Choisissez la date et l’heure correctes pour ce rendez-vous de service.' },
  'order.saveAppointment': { en: 'Save Appointment', fr: 'Enregistrer le Rendez-vous' },
  'order.insufficient': { en: 'Insufficient funds. Please top up your wallet.', fr: 'Fonds insuffisants. Veuillez recharger votre compte.' },
  'order.inTransit': { en: 'In Transit', fr: 'En Transit' },
  'order.active': { en: 'Active Orders', fr: 'Commandes Actives' },
  'order.past': { en: 'Order History', fr: 'Historique' },
  'order.cancel': { en: 'Cancel Order', fr: 'Annuler Commande' },
  'order.cannotCancelPaid': { en: 'Paid orders cannot be cancelled by user. Contact support.', fr: 'Impossible d\'annuler une commande payée. Contactez le support.' },
  'order.uploadFiles': { en: 'Upload Evidence (JPG, PNG, PDF)', fr: 'Preuves (JPG, PNG, PDF)' },
  'order.uploadFilesHint': { en: 'You can attach up to 3 files.', fr: 'Vous pouvez joindre jusqu’à 3 fichiers.' },
  'order.disputeFileRequired': { en: 'Please attach at least one file as evidence.', fr: 'Veuillez joindre au moins un fichier comme preuve.' },
  'order.files': { en: 'Files', fr: 'Fichiers' },
  'order.reason': { en: 'Reason', fr: 'Raison' },
  'order.disputeReasonRequired': { en: 'Please describe the issue in at least 5 characters.', fr: 'Veuillez décrire le problème en au moins 5 caractères.' },
  'order.invalidReason': { en: 'Invalid reason.', fr: 'Raison invalide.' },
  'order.appointmentUnavailable': { en: 'Unable to load appointment details.', fr: 'Impossible de charger les détails du rendez-vous.' },
  'order.disputePlaceholder': { en: 'What\'s the issue?', fr: 'Quel est le problème ?' },
  'order.submitReport': { en: 'Submit Report', fr: 'Envoyer le Rapport' },
  'order.paymentRecap': { en: 'Payment Validation', fr: 'Validation du Paiement' },
  'order.soldBy': { en: 'Sold by', fr: 'Vendu par' },
  'order.walletBalance': { en: 'Wallet Balance', fr: 'Solde Portefeuille' },
  'order.orderTotal': { en: 'Order Amount', fr: 'Montant Commande' },
  'order.confirmPayment': { en: 'Confirm Payment', fr: 'Confirmer Paiement' },

  // Profile
  'profile.tabs.back': { en: 'Back', fr: 'Retour' },
  'profile.tabs.info': { en: 'Personal Info', fr: 'Infos Personnelles' },
  'profile.tabs.orders': { en: 'My Orders', fr: 'Mes Commandes' },
  'profile.tabs.security': { en: 'Security', fr: 'Sécurité' },
  'profile.tabs.payment': { en: 'Payment Settings', fr: 'Moyens de Paiement' },
  'profile.tabs.portfolio': { en: 'Portfolio', fr: 'Portfolio' },
  'profile.tabs.favorites': { en: 'Favorites', fr: 'Favoris' },
  'profile.tabs.payment2': { en: 'Payment', fr: 'Paiement' },
  'profile.tabs.referrals': { en: 'Referrals', fr: 'Parrainages' },
  'profile.tabs.payment_reload': { en: 'Payment &amp; reload', fr: 'Paiement &amp; rechargement' },
  'profile.tabs.walletDescription': { en: 'Add money to your wallet to pay for orders. You pay securely through the hosted payment page — no card details are stored here. Wallet funds are for purchases only and can&apos;t be withdrawn.', fr: 'Ajoutez de l’argent à votre portefeuille pour payer vos commandes. Vous payez en toute sécurité via la page de paiement hébergée — aucune information de carte n’est stockée ici. Les fonds du portefeuille sont uniquement destinés aux achats et ne peuvent pas être retirés.' },
  'profile.tabs.walleReload': { en: 'Reload Wallet', fr: 'Actualiser le portefeuille'},
  'profile.tabs.reputation': { en: 'My Reputation', fr: 'Ma Réputation' },
  'profile.update': { en: 'Update Profile', fr: 'Mettre à jour' },
  'profile.password': { en: 'Change Password', fr: 'Changer le mot de passe' },
  'profile.currentPassword': { en: 'Current Password', fr: 'Mot de passe actuel' },
  'profile.newPassword': { en: 'New Password', fr: 'Nouveau mot de passe' },
  'profile.confirmNewPassword': { en: 'Confirm New Password', fr: 'Confirmer le nouveau mot de passe' },
  'profile.passwordVerificationHint': { en: 'We will verify your current password first, then send a code to your phone and email.', fr: 'Nous vérifierons d’abord votre mot de passe actuel, puis enverrons un code à votre téléphone et à votre e-mail.' },
  'profile.otpVerificationHint': { en: 'Enter the 6-digit code sent to your registered phone and email.', fr: 'Entrez le code à 6 chiffres envoyé à votre téléphone et votre e-mail enregistrés.' },
  'profile.otpCodePlaceholder': { en: '000000', fr: '000000' },
  'profile.otpCodeRequired': { en: 'Enter the 6-digit code from your phone or email.', fr: 'Entrez le code à 6 chiffres envoyé à votre téléphone ou e-mail.' },
  'profile.checking': { en: 'Checking…', fr: 'Vérification…' },
  'profile.continue': { en: 'Continue', fr: 'Continuer' },
  'profile.updating': { en: 'Updating…', fr: 'Mise à jour…' },
  'profile.payment.add': { en: 'Add Payment Method', fr: 'Ajouter un moyen de paiement' },
  'profile.payment.provider': { en: 'Provider', fr: 'Opérateur' },
  'profile.payment.accNum': { en: 'Account/Phone Number', fr: 'Numéro de compte/téléphone' },
  'profile.payment.accName': { en: 'Account Holder Name', fr: 'Nom du titulaire' },
  'profile.payment.bankName': { en: 'Bank Name', fr: 'Nom de la banque' },
  'profile.payment.saved': { en: 'Saved Payment Methods', fr: 'Moyens de paiement enregistrés' },
  'profile.payment.none': { en: 'No payment methods saved yet.', fr: 'Aucun moyen de paiement enregistré.' },
  'profile.upgrade': { en: 'Become a Producer', fr: 'Devenir Producteur' },
  'profile.upgradeDesc': { en: 'Upgrade your account to start selling your own products.', fr: 'Passez votre compte en mode producteur pour commencer à vendre.' },
  'profile.producerApprovedTitle': { en: 'Approved Producer', fr: 'Producteur approuvé' },
  'profile.producerApprovedMsg': {
    en: 'Your producer account is approved. You can publish offers and still buy from other producers or the ATI store as a client.',
    fr: 'Votre compte producteur est approuvé. Vous pouvez publier des offres et continuer à acheter chez d\'autres producteurs ou à la boutique ATI en tant que client.',
  },
  'profile.producerPendingTitle': { en: 'Producer account pending', fr: 'Compte producteur en attente' },
  'profile.producerPendingMsg': {
    en: 'Your producer account is pending. You can still buy as a client. Enter your NIU / tax ID and upload your NIU certificate (and business registration if applicable) below to complete verification.',
    fr: 'Votre compte producteur est en attente. Vous pouvez toujours acheter en tant que client. Saisissez votre NIU et téléversez votre certificat NIU (et l\'immatriculation le cas échéant) ci-dessous pour finaliser la vérification.',
  },
  'profile.complianceDocsTitle': { en: 'Tax & compliance documents', fr: 'Documents fiscaux et administratifs' },
  'upload.fileTooLarge': { en: 'File size exceeds 10MB limit.', fr: 'La taille du fichier dépasse la limite de 10 Mo.' },
  'upload.invalidFormat': { en: 'Only PNG, JPG, and PDF formats are allowed.', fr: 'Seuls les formats PNG, JPG et PDF sont autorisés.' },
  'upload.failed': { en: 'Upload failed.', fr: 'Le téléversement a échoué.' },
  'upload.chooseFile': { en: 'Choose file', fr: 'Choisir un fichier' },
  'upload.formatHint': { en: 'PNG, JPG, or PDF — max 10 MB', fr: 'PNG, JPG ou PDF — 10 Mo maximum' },
  'profile.complianceDocsIntro': {
    en: 'Required for all producers (individual and business): your TIN/NIU number, NIU certificate file, and tax compliance certificate (ACF). Use the same upload control for each document. Business registration (RCCM) is optional.',
    fr: 'Obligatoire pour tous les producteurs : numéro NIU/TIN, certificat NIU et attestation ACF (deux documents distincts). Même bouton de téléversement pour chaque fichier. RCCM facultatif.',
  },
  'profile.taxIdNumber': { en: 'Tax identification number (TIN/NIU)', fr: 'Numéro d\'identification fiscale (NIU/TIN)' },
  'profile.taxIdNumberHint': {
    en: 'The unique tax ID printed on your NIU registration (not the uploaded file).',
    fr: 'Le numéro fiscal unique figurant sur votre enregistrement NIU (pas le fichier téléversé).',
  },
  'profile.taxClearanceDoc': { en: 'Tax clearance certificate (ACF)', fr: 'Attestation de non-redevance (ACF)' },
  'profile.taxClearanceDocHint': {
    en: 'Tax completion / clearance document from the tax authority.',
    fr: 'Document attestant la régularité fiscale auprès de l\'administration.',
  },
  'profile.niuCertificate': { en: 'NIU certificate', fr: 'Certificat NIU' },
  'profile.niuCertificateHint': {
    en: 'Official NIU registration certificate for your business or activity.',
    fr: 'Certificat officiel d\'enregistrement au NIU pour votre activité.',
  },
  'profile.businessRegistration': { en: 'Business registration', fr: 'Immatriculation / registre de commerce' },
  'profile.businessRegistrationHint': {
    en: 'RCCM or equivalent — optional but helps speed up approval.',
    fr: 'RCCM ou équivalent — facultatif mais accélère la validation.',
  },
  'profile.favorites.empty': { en: 'No favorite items yet.', fr: 'Pas encore de favoris.' },
  'profile.findSimilar': { en: 'Find Similar', fr: 'Trouver Similaire' },
  
  // Portfolio
  'portfolio.title': { en: 'My Portfolio', fr: 'Mon Portfolio' },
  'portfolio.add': { en: 'Add Portfolio', fr: 'Ajouter Portfolio' },
  'portfolio.empty': { en: 'No portfolios created yet. Showcase your work!', fr: 'Aucun portfolio créé. Mettez en valeur votre travail !' },
  'portfolio.maxImages': { en: 'Max 10 images (PNG/JPG, < 2MB)', fr: 'Max 10 images (PNG/JPG, < 2MB)' },
  'portfolio.video': { en: 'Video (Max 1, < 30MB)', fr: 'Vidéo (Max 1, < 30Mo)' },
  'portfolio.published': { en: 'Published', fr: 'Publié' },
  'portfolio.draft': { en: 'Draft', fr: 'Brouillon' },
  'portfolio.preview': { en: 'Preview', fr: 'Aperçu' },
  'portfolio.viewFullImage': { en: 'View full image', fr: 'Voir l’image complète' },
  'portfolio.categoryTip': { en: 'This portfolio will appear on all offers with this category.', fr: 'Ce portfolio apparaîtra sur toutes les offres de cette catégorie.' },
  'portfolio.deleteConfirmTitle': { en: 'Delete this portfolio item?', fr: 'Supprimer cet élément du portfolio ?' },
  'portfolio.deleteConfirmBody': { en: 'This cannot be undone. You will remove this entry from your profile.', fr: 'Cette action est irréversible. Cette entrée sera retirée de votre profil.' },

  // New Profile Fields
  'profile.type': { en: 'Producer Type', fr: 'Type de Producteur' },
  'profile.business': { en: 'Business', fr: 'Entreprise' },
  'profile.individual': { en: 'Individual', fr: 'Individuel' },
  // 'profile.firstName': { en: 'First Name', fr: 'Prénom' },
  // 'profile.lastName': { en: 'Last Name', fr: 'Nom' },
  // 'profile.gender': { en: 'Gender', fr: 'Genre' },
  // 'profile.dob': { en: 'Date of Birth', fr: 'Date de Naissance' },
  // 'profile.region': { en: 'Region', fr: 'Région' },
  // 'profile.city': { en: 'City', fr: 'Ville' },
  'profile.uploadPhoto': { en: 'Update Profile Picture', fr: 'Mettre à jour la photo' },
  'profile.uploadHint': { en: 'JPG, PNG, or WebP. Max 2 MB.', fr: 'JPG, PNG ou WebP. Max 2 Mo.' },
  'profile.uploading': { en: 'Uploading…', fr: 'Téléchargement…' },
  'profile.uploadDocs': { en: 'Upload Certificates (Max 10MB)', fr: 'Télécharger Certificats (Max 10MB)' },

  // Chat
  'chat.proposal': { en: 'Formal Proposal', fr: 'Proposition Formelle' },
  'chat.proposed': { en: 'Proposed', fr: 'Proposé' },
  'chat.makeProposal': { en: 'Make a Proposal', fr: 'Faire une Proposition' },
  'chat.makeServiceProposal': { en: 'Propose a Service Rate', fr: 'Proposer un tarif de service' },
  'chat.serviceRate': { en: 'Rate', fr: 'Tarif' },
  'chat.serviceSessions': { en: 'Sessions', fr: 'Séances' },
  'chat.serviceProposalHint': { en: 'The buyer will pick an appointment slot when accepting. Duration: {hours}h per session.', fr: 'L’acheteur choisira un créneau lors de l’acceptation. Durée : {hours}h par séance.' },
  'chat.serviceListedRate': { en: 'Listed rate: {price} per {unit}', fr: 'Tarif affiché : {price} par {unit}' },
  'chat.serviceRateRange': { en: 'Propose between {min} and {max} per {unit}', fr: 'Proposez entre {min} et {max} par {unit}' },
  'chat.serviceRateUpTo': { en: 'Propose up to {max} per {unit}', fr: 'Proposez jusqu’à {max} par {unit}' },
  'chat.productRateRange': { en: 'Allowed range: {min} – {max} per unit', fr: 'Fourchette autorisée : {min} – {max} par unité' },
  'chat.productRateUpTo': { en: 'Propose up to {max} per unit', fr: 'Proposez jusqu’à {max} par unité' },
  'chat.estimatedTotal': { en: 'Estimated total', fr: 'Total estimé' },
  'chat.pricePerUnit': { en: 'Price per Unit', fr: 'Prix par Unité' },
  'chat.total': { en: 'Total', fr: 'Total' },
  'chat.accept': { en: 'Accept', fr: 'Accepter' },
  'chat.reject': { en: 'Reject', fr: 'Rejeter' },
  'chat.appointmentTitle': { en: 'Choose appointment date', fr: 'Choisir la date du rendez-vous' },
  'chat.appointmentHint': { en: 'Select the date and time for this service before accepting. You can adjust it later from your orders.', fr: 'Sélectionnez la date et l’heure du service avant d’accepter. Vous pourrez l’ajuster plus tard depuis vos commandes.' },
  'chat.acceptBooking': { en: 'Accept & Book', fr: 'Accepter et Réserver' },
  'chat.counter': { en: 'Counter', fr: 'Contre-proposition' },
  'chat.failedToSend': { en: 'Failed to send — tap to retry', fr: 'Échec de l envoi — appuyez pour réessayer' },
  'chat.isTyping': { en: 'is typing', fr: 'est en train d écrire' },
  'chat.sendMessage': { en: 'Send message', fr: 'Envoyer le message' },
  'chat.retry': { en: 'retry', fr: 'réessayer' },
  'chat.status.PENDING': { en: 'Pending', fr: 'En Attente' },
  'chat.status.ACCEPTED': { en: 'Accepted', fr: 'Accepté' },
  'chat.status.REJECTED': { en: 'Rejected', fr: 'Rejeté' },
  'chat.status.COUNTERED': { en: 'Countered', fr: 'Contré' },
  'chat.status.SUPERSEDED': { en: 'No longer active', fr: 'Plus actif' },
  'chat.typeMessage': { en: 'Type a message...', fr: 'Tapez un message...' },
  'chat.composeHint': { en: 'Enter to send · Shift+Enter for new line', fr: 'Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne' },
  'chat.noChats': { en: 'No active conversations.', fr: 'Aucune conversation active.' },
  'support.guestEmailRequired': { en: 'Email is required', fr: 'L’e-mail est requis' },
  'support.guestEmailInvalid': { en: 'Please enter a valid email address', fr: 'Veuillez saisir une adresse e-mail valide' },
  'support.guestFallbackName': { en: 'Guest', fr: 'Invité' },
  'support.chatStatusTyping': { en: 'AgriBot is typing…', fr: 'AgriBot écrit…' },
  'support.chatStatusSending': { en: 'Sending…', fr: 'Envoi…' },
  'support.chatStatusWaiting': { en: 'Waiting for agent…', fr: 'En attente d’agent…' },
  'support.chatStatusOnline': { en: 'Online', fr: 'En ligne' },
  'support.openChatAria': { en: 'Open Support Chat (drag to move)', fr: 'Ouvrir le chat d’assistance (glisser pour déplacer)' },
  'support.dragHint': { en: 'Drag to move', fr: 'Glisser pour déplacer' },
  'support.chatDialogAria': { en: 'AgriBot Support Chat', fr: 'Chat d’assistance AgriBot' },
  'support.humanAgent': { en: 'Human Agent', fr: 'Agent humain' },
  'support.botName': { en: 'AgriBot Support', fr: 'Assistance AgriBot' },
  'support.closeChatAria': { en: 'Close support chat', fr: 'Fermer le chat d’assistance' },
  'support.retrySendTitle': { en: 'Failed to send — tap to retry', fr: 'Échec de l’envoi — appuyez pour réessayer' },
  'support.retrySendAria': { en: 'Retry sending message', fr: 'Réessayer l’envoi du message' },
  'support.waitingHumanTitle': { en: 'Waiting for a human agent', fr: 'En attente d’un agent humain' },
  'support.waitingHumanDesc': { en: 'An agent will reply here shortly. No response yet?', fr: 'Un agent répondra ici sous peu. Aucune réponse pour le moment ?' },
  'support.switching': { en: 'Switching…', fr: 'Changement…' },
  'support.backToBot': { en: 'Back to AgriBot', fr: 'Retour à AgriBot' },
  'support.guestIntro': { en: 'Enter your email to start chatting with AgriBot.', fr: 'Saisissez votre e-mail pour commencer le chat avec AgriBot.' },
  'support.guestEmailLabel': { en: 'Email Address *', fr: 'Adresse e-mail *' },
  'support.guestEmailPlaceholder': { en: 'your@email.com', fr: 'votre@email.com' },
  'support.guestNameLabel': { en: 'Name (optional)', fr: 'Nom (facultatif)' },
  'support.guestNamePlaceholder': { en: 'Your name', fr: 'Votre nom' },
  'support.startChat': { en: 'Start Chat', fr: 'Démarrer le chat' },
  'support.chatReplying': { en: 'AgriBot is replying…', fr: 'AgriBot répond…' },
  'support.chatComposerPlaceholder': { en: 'Ask about orders, payments, listings…', fr: 'Posez une question sur les commandes, paiements, annonces…' },
  'support.sendingMessageAria': { en: 'Sending message', fr: 'Envoi du message' },
  'support.chatStatusAgentConnected': { en: 'Agent connected', fr: 'Agent connecté' },
  'support.chatStatusWaitingForAgent': { en: 'Waiting for an agent…', fr: 'En attente d\'un agent…' },
  'support.sending': { en: 'Sending', fr: 'Envoi' },
  'support.sent': { en: 'Sent', fr: 'Envoyé' },
  'support.typing': { en: 'Typing', fr: 'En train d\'écrire' },
  'chat.sendCounter': { en: 'Send Counter-Offer', fr: 'Envoyer une contre-proposition' },
  'chat.select': { en: 'Select a conversation', fr: 'Sélectionnez une conversation' },
  'chat.loadingMessages': { en: 'Loading messages…', fr: 'Chargement des messages…' },
  'chat.loadingChats': { en: 'Loading conversations…', fr: 'Chargement des conversations…' },

  // Availability
  'avail.title': { en: 'My Availability', fr: 'Mes Disponibilités' },
  'avail.workHours': { en: 'Weekly Working Hours', fr: 'Heures de travail hebdomadaires' },
  'avail.exceptions': { en: 'Exceptions (Holidays/Time Off)', fr: 'Exceptions (Congés)' },
  'avail.save': { en: 'Save Schedule', fr: 'Sauvegarder' },
  'avail.addException': { en: 'Block Date', fr: 'Bloquer une date' },
  'avail.reason': { en: 'Reason', fr: 'Raison' },
  
  // Reviews
  'review.rate': { en: 'Leave a Review', fr: 'Laisser un Avis' },
  'review.comment': { en: 'Comment', fr: 'Commentaire' },
  'review.commentRequired': { en: 'Please add a short comment.', fr: 'Veuillez ajouter un court commentaire.' },
  'review.shareExperience': { en: 'Share your experience...', fr: 'Partagez votre expérience...' },
  'review.submit': { en: 'Submit Review', fr: 'Envoyer' },
  'review.rated': { en: 'Rated', fr: 'Noté' },
  'review.received': { en: 'Received Reviews', fr: 'Avis Reçus' },
  'review.ratedBy': { en: 'Rated by', fr: 'Noté par' },
  'review.reviewerFallback': { en: 'Unknown reviewer', fr: 'Auteur inconnu' },
  'review.noReviews': { en: 'No reviews received yet.', fr: 'Aucun avis reçu pour le moment.' },

  // Compare
  'compare.bar.title': { en: 'Compare Products', fr: 'Comparer Produits' },
  'compare.bar.desc': { en: 'Select up to 3 items', fr: 'Sélectionnez jusqu\'à 3 articles' },
  'compare.btn': { en: 'Compare Now', fr: 'Comparer Maintenant' },
  'compare.clear': { en: 'Clear All', fr: 'Tout Effacer' },
  'compare.page.title': { en: 'Product Comparison', fr: 'Comparaison de Produits' },
  'compare.empty': { en: 'No products selected for comparison.', fr: 'Aucun produit sélectionné.' },
  'compare.emptyHint': { en: 'Tap the layers icon on offers to build a comparison.', fr: 'Appuyez sur l’icône calques des offres pour comparer.' },
  'compare.browseMarket': { en: 'Browse Producer Market', fr: 'Parcourir le marché producteurs' },
  'compare.attribute': { en: 'Attribute', fr: 'Attribut' },
  'compare.price': { en: 'Price', fr: 'Prix' },
  'compare.unit': { en: 'Unit', fr: 'Unité' },
  'compare.minOrder': { en: 'Min Order', fr: 'Commande Min' },
  'compare.category': { en: 'Category', fr: 'Catégorie' },
  'compare.delivery': { en: 'Delivery', fr: 'Livraison' },
  'compare.rating': { en: 'Rating', fr: 'Note' },
  'compare.producer': { en: 'Producer', fr: 'Producteur' },
  'compare.select': { en: 'Select to Compare', fr: 'Sélectionner pour comparer' },

  // ── NEW KEYS ──────────────────────────────────────────────────────────────

  // Blog
  'blog.post.1.title': { en: 'The Future of Sustainable Farming in Cameroon', fr: "L'avenir de l'agriculture durable au Cameroun" },
  'blog.post.1.excerpt': { en: 'Exploring how digital platforms are enabling farmers to reduce waste and increase profits through direct market access.', fr: "Explorer comment les plateformes numériques permettent aux agriculteurs de réduire les déchets et d'augmenter les profits grâce à un accès direct au marché." },
  'blog.post.1.author': { en: 'Sarah M.', fr: 'Sarah M.' },
  'blog.post.1.date': { en: 'Oct 15, 2023', fr: '15 oct. 2023' },
  'blog.post.1.category': { en: 'Sustainability', fr: 'Durabilité' },
  'blog.post.2.title': { en: 'Maximizing Yields: Tips for Tomato Growers', fr: 'Maximiser les rendements : conseils pour les producteurs de tomates' },
  'blog.post.2.excerpt': { en: 'Expert advice on soil preparation, pest control, and harvesting techniques to get the best out of your tomato crop this season.', fr: "Conseils d'experts sur la préparation du sol, la lutte antiparasitaire et les techniques de récolte pour tirer le meilleur parti de votre récolte de tomates cette saison." },
  'blog.post.2.author': { en: 'Dr. Jean-Paul K.', fr: 'Dr. Jean-Paul K.' },
  'blog.post.2.date': { en: 'Nov 02, 2023', fr: '2 nov. 2023' },
  'blog.post.2.category': { en: 'Agriculture', fr: 'Agriculture' },
  'blog.post.3.title': { en: 'Understanding the Escrow Payment System', fr: "Comprendre le système de paiement sécurisé" },
  'blog.post.3.excerpt': { en: 'A detailed guide on how AgriMarket Connect protects both buyers and sellers using our secure escrow technology.', fr: "Un guide détaillé sur la façon dont AgriMarket Connect protège les acheteurs et les vendeurs grâce à notre technologie de séquestre sécurisée." },
  'blog.post.3.author': { en: 'AgriMarket Team', fr: "Équipe AgriMarket" },
  'blog.post.3.date': { en: 'Dec 10, 2023', fr: '10 déc. 2023' },
  'blog.post.3.category': { en: 'Platform Guide', fr: 'Guide de la plateforme' },

  // Favorites
  'favorites.unavailableTitle': { en: 'Unavailable Items', fr: 'Articles indisponibles' },
  'favorites.itemUnavailable': { en: 'This item is no longer available.', fr: "Cet article n'est plus disponible." },

  // Gender
  'gender.male': { en: 'Male', fr: 'Masculin' },
  'gender.female': { en: 'Female', fr: 'Féminin' },

  // Jobs
  'jobs.job.1.title': { en: 'Logistics Coordinator', fr: 'Coordinateur Logistique' },
  'jobs.job.1.desc': { en: 'Manage our network of focal points and delivery partners across Cameroon.', fr: 'Gérer notre réseau de points focaux et de partenaires de livraison à travers le Cameroun.' },
  'jobs.job.2.title': { en: 'Community Manager', fr: 'Community Manager' },
  'jobs.job.2.desc': { en: 'Engage with our producers and clients to build a thriving community.', fr: "Engager nos producteurs et clients pour construire une communauté florissante." },
  'jobs.job.3.title': { en: 'Sales Representative', fr: 'Représentant Commercial' },
  'jobs.job.3.desc': { en: 'Onboard new farmers and businesses to the AgriMarket platform.', fr: "Intégrer de nouveaux agriculteurs et entreprises sur la plateforme AgriMarket." },
  'jobs.applyNow': { en: 'Apply Now', fr: 'Postuler maintenant' },
  'jobs.becomePartner': { en: 'Become a Partner', fr: 'Devenir partenaire' },
  'jobs.becomePartnerDesc': { en: 'Interested in integrating your logistics, financial, or agricultural services with AgriMarket Connect?', fr: "Intéressé par l'intégration de vos services logistiques, financiers ou agricoles avec AgriMarket Connect ?" },
  'jobs.contactPartnerships': { en: 'Contact Partnerships', fr: 'Contacter les partenariats' },

  // Location
  'location.useMyLocation': { en: 'Use my current location', fr: 'Utiliser ma position actuelle' },
  'location.gettingLocation': { en: 'Getting location…', fr: 'Obtention de la position…' },
  'location.coordinates': { en: 'Coordinates: {lat}, {lng}', fr: 'Coordonnées : {lat}, {lng}' },
  'location.searchAddress': { en: 'Search address', fr: 'Rechercher une adresse' },
  'location.city': { en: 'City', fr: 'Ville' },
  'location.region': { en: 'Region / State', fr: 'Région / État' },
  'location.updateLocation': { en: 'Update location', fr: 'Mettre à jour la localisation' },
  'location.fullAddress': { en: 'Full address', fr: 'Adresse complète' },
  'location.searchPlaceholder': { en: 'Type to search (OpenStreetMap)', fr: 'Tapez pour rechercher (OpenStreetMap)' },
  'location.findingNearby': { en: 'Finding nearby locations...', fr: 'Recherche des lieux à proximité...' },

  // Order
  'order.label': { en: 'Order', fr: 'Commande' },
  'order.pickupDelivery': { en: 'ðŸ“¦ Pickup delivery', fr: 'ðŸ“¦ Livraison par retrait' },
  // 'order.soldBy': { en: 'Sold by', fr: 'Vendu par' },
  'order.shippingAddressLabel': { en: 'Shipping Address:', fr: 'Adresse de livraison :' },
  'order.pickupPointLabel': { en: 'Pickup Point:', fr: 'Point de retrait :' },
  'order.reasonLabel': { en: 'Reason', fr: 'Raison' },
  'order.appointmentLoadError': { en: 'Unable to load appointment details.', fr: 'Impossible de charger les détails du rendez-vous.' },
  'order.uploadEvidence': { en: 'Upload Evidence (JPG, PNG, PDF)', fr: 'Télécharger des preuves (JPG, PNG, PDF)' },

  // Payment
  'payment.balanceAfter': { en: 'Balance After Payment', fr: 'Solde après paiement' },
  'wallet.topUpLink': { en: 'Top up wallet →', fr: 'Recharger le portefeuille →' },

  // Profile (info tab)
  'profile.myLocations': { en: 'My Locations', fr: 'Mes adresses' },
  'profile.addOrUpdateAddress': { en: 'Add or update an address', fr: 'Ajouter ou modifier une adresse' },
  'profile.newAddressKeep': { en: 'New address (keep existing)', fr: 'Nouvelle adresse (garder existante)' },
  'profile.addAnotherAddress': { en: 'Add another address', fr: 'Ajouter une autre adresse' },
  'profile.mapPinHint': { en: 'Drag the pin or tap the map to set coordinates. Address fields update from the pin when possible.', fr: 'Faites glisser le marqueur ou appuyez sur la carte pour définir les coordonnées. Les champs d\'adresse se mettent à jour à partir du marqueur lorsque c\'est possible.' },
  // 'profile.city': { en: 'City', fr: 'Ville' },
  'profile.regionState': { en: 'Region / State', fr: 'Région / État' },
  'profile.fullAddress': { en: 'Full address', fr: 'Adresse complète' },
  'profile.addToList': { en: 'Add to list', fr: 'Ajouter à la liste' },
  'profile.updateLocation': { en: 'Update location', fr: 'Mettre à jour l\'adresse' },
  'profile.addAsNewAddress': { en: 'Add as new address (keep fields below)', fr: 'Ajouter comme nouvelle adresse (garder les champs ci-dessous)' },

  // Profile (upgrade modal)
  'profile.producerType': { en: 'Producer Type', fr: 'Type de producteur' },
  'profile.farmBusinessName': { en: 'Farm/Business Name', fr: 'Nom de la ferme/entreprise' },
  'profile.niuTaxId': { en: 'NIU / Tax ID', fr: 'NIU / N° fiscal' },
  'profile.categoriesClick': { en: 'Categories (Click to select)', fr: 'Catégories (Cliquez pour sélectionner)' },
  'profile.upgradeAccount': { en: 'Upgrade Account', fr: 'Mettre à niveau le compte' },

  // Referrals
  'referrals.yourLink': { en: 'Your Referral Link', fr: 'Votre lien de parrainage' },
  'referrals.copy': { en: 'Copy', fr: 'Copier' },
  'referrals.shareHint': { en: 'Share this link with friends to invite them to the platform.', fr: 'Partagez ce lien avec vos amis pour les inviter sur la plateforme.' },
  'referrals.yourImpact': { en: 'Your Impact', fr: 'Votre impact' },
  'referrals.referredCount': { en: 'You have successfully referred {count} user(s).', fr: 'Vous avez parrainé {count} utilisateur(s) avec succès.' },
  'referrals.noReferrals': { en: "You haven't referred anyone yet.", fr: "Vous n'avez encore parrainé personne." },

  // Register
  'register.selectGender': { en: 'Select Gender', fr: 'Sélectionnez le genre' },
  // 'register.security': { en: 'Security', fr: 'Sécurité' },
  'register.locationDetails': { en: 'Location Details', fr: 'Détails de localisation' },
  'register.locationHint': { en: 'Use your device location (browser permission). We do not load Google Places on signup. You can edit the address fields below.', fr: 'Utilisez la localisation de votre appareil (autorisation du navigateur). Nous ne chargeons pas Google Places lors de l\'inscription. Vous pouvez modifier les champs d\'adresse ci-dessous.' },
  'register.useActualLocation': { en: 'Use my current location', fr: 'Utiliser ma position actuelle' },
  'register.gettingLocation': { en: 'Getting location…', fr: 'Obtention de la position…' },
  'register.addressPlaceholder': { en: 'Street, area, or full address', fr: 'Rue, quartier ou adresse complète' },
  'register.addLocation': {en: 'Add a location', fr: 'Ajouter une localisation'},
  'register.city': {en: 'City', fr: 'Ville'},
  'register.regionOrState': {en: 'Region / State', fr: 'Ajouter une localisation'},
  'register.locationDescription': {en: 'Type your full address, pick a suggestion, or drag the map pin. Click + to add this location.',
                                  fr: 'Entrez votre adresse complete, choisissez parmi les suggestions our choisissez sur la map. Puis cliquez + pour ajouter la localisation.'},
  'register.findingLocation': {en: 'Finding nearby locations...', fr: 'Recherche de localisations à proximité...'},
  'register.locationsRequired': {en: 'At least one location is required.', fr: 'Veuillez enregistrer au moins une localisation' },
  'register.locationsError': {en: 'Please add at least one location before continuing.', fr: 'Veuillez enregistrer au moins une localisation avant de continuer.' },

  // FAQ
  'faq.q1': { en: 'How does the Escrow payment work?', fr: 'Comment fonctionne le paiement sécurisé ?' },
  'faq.a1': { en: 'When you make a payment, the funds are held securely by AgriMarket Connect and are not immediately sent to the producer. The money is released to the producer only after you confirm the delivery of your order or after 4 days if no dispute is raised.', fr: 'Lorsque vous effectuez un paiement, les fonds sont conservés en toute sécurité par AgriMarket Connect et ne sont pas immédiatement envoyés au producteur. L\'argent est libéré au producteur uniquement après que vous ayez confirmé la livraison de votre commande ou après 4 jours si aucun litige n\'est soulevé.' },
  'faq.q2': { en: 'Can I return products if they are damaged?', fr: 'Puis-je retourner des produits s\'ils sont endommagés ?' },
  'faq.a2': { en: 'Yes. If your order arrives damaged or does not match the description, you can click "Report a Problem" on your order page. This opens a dispute, freezes the funds, and allows you to upload evidence for our admin team to review.', fr: 'Oui. Si votre commande arrive endommagée ou ne correspond pas à la description, vous pouvez cliquer sur "Signaler un problème" sur la page de votre commande. Cela ouvre un litige, bloque les fonds et vous permet de télécharger des preuves pour que notre équipe administrative les examine.' },
  'faq.q3': { en: 'What are the delivery fees?', fr: 'Quels sont les frais de livraison ?' },
  'faq.a3': { en: 'Delivery fees vary depending on the producer\'s location and your chosen delivery method (Home Delivery vs. Focal Point Pickup). The total cost is calculated before you confirm your order.', fr: 'Les frais de livraison varient en fonction de l\'emplacement du producteur et de votre méthode de livraison choisie (livraison à domicile ou retrait en point focal). Le coût total est calculé avant que vous ne confirmiez votre commande.' },
  'faq.q4': { en: 'How do I become a verified producer?', fr: 'Comment devenir un producteur vérifié ?' },
  'faq.a4': { en: 'To become a verified producer, sign up for a producer account and upload the required documents (Business License or ID, and any relevant certificates) in your profile. Our team will review your documents and verify your status within 48 hours.', fr: 'Pour devenir producteur vérifié, inscrivez-vous pour un compte producteur et téléchargez les documents requis (licence commerciale ou pièce d\'identité, et tout certificat pertinent) dans votre profil. Notre équipe examinera vos documents et vérifiera votre statut dans les 48 heures.' },
  'faq.q5': { en: 'Are there fees for using the platform?', fr: 'Y a-t-il des frais pour utiliser la plateforme ?' },
  'faq.a5': { en: 'Clients pay a 16.5% service fee on each order. Producers are charged a 5% commission on successful sales, which is deducted automatically from their earnings before withdrawal.', fr: 'Les clients paient des frais de service de 16,5 % sur chaque commande. Les producteurs paient une commission de 5 % sur les ventes réussies, qui est déduite automatiquement de leurs gains avant le retrait.' },

  // More order (for all-orders list)
  // Partners (Company.tsx)
'partners.subtitle': {
  en: 'We collaborate with industry leaders to bring you the best services.',
  fr: 'Nous collaborons avec des leaders du secteur pour vous offrir les meilleurs services.',
},
'partners.orangeMoney': {
  en: 'Orange Money',
  fr: 'Orange Money',
},
'partners.mtn': {
  en: 'MTN Mobile Money',
  fr: 'MTN Mobile Money',
},
'partners.uba': {
  en: 'UBA Bank',
  fr: 'UBA Bank',
},
'partners.minAgri': {
  en: 'Min. of Agriculture',
  fr: 'Min. de l\'Agriculture',
},
'partners.becomeTitle': {
  en: 'Become a Partner',
  fr: 'Devenir Partenaire',
},
'partners.becomeDesc': {
  en: 'Interested in integrating your logistics, financial, or agricultural services with AgriMarket Connect?',
  fr: 'Intéressé par l\'intégration de vos services logistiques, financiers ou agricoles avec AgriMarket Connect ?',
},
'partners.contactBtn': {
  en: 'Contact Partnerships',
  fr: 'Contacter les partenariats',
},

// FAQ intro
'faq.subtitle': {
  en: 'Everything you need to know about buying and selling on AgriMarket Connect.',
  fr: 'Tout ce que vous devez savoir sur l\'achat et la vente sur AgriMarket Connect.',
},
// ── Marketplace specific ──────────────────────────────────────────────

// ATI Store
'market.atiOfficial': {
  en: 'Official ATI Products • Verified Quality • Fast Delivery',
  fr: 'Produits officiels ATI • Qualité vérifiée • Livraison rapide',
},
'market.seeAll': {
  en: 'See All ',
  fr: 'Voir tout ',
},
'market.allCategoriesBack': {
  en: '← All Categories',
  fr: '← Toutes les catégories',
},
'market.atiChoice': {
  en: 'ATI Choice',
  fr: 'Choix ATI',
},
'market.items': {
  en: 'Items',
  fr: 'Articles',
},
'market.results': {
  en: 'results',
  fr: 'résultats',
},
'market.nearby': {
  en: 'Nearby',
  fr: 'À proximité',
},
'market.delivery': {
  en: 'Delivery',
  fr: 'Livraison',
},
'market.pickup': {
  en: 'Pickup',
  fr: 'Retrait',
},
'market.negotiable': {
  en: 'Negotiable',
  fr: 'Négociable',
},
'market.prioritizing': {
  en: 'Prioritizing offers in:',
  fr: 'Offres prioritaires dans :',
},
'market.searchProducers': {
  en: 'Search products or producers...',
  fr: 'Rechercher des produits ou des producteurs...',
},
'market.unknownProducer': {
  en: 'Unknown Producer',
  fr: 'Producteur inconnu',
},
'market.pickupOnly': {
  en: 'Pickup Only',
  fr: 'Retrait uniquement',
},
'market.availableShort': {
  en: 'Available',
  fr: 'Disponible',
},

// Product details
'product.notFound': {
  en: 'Product Not Found',
  fr: 'Produit non trouvé',
},
'product.goBack': {
  en: 'Go Back',
  fr: 'Retourner',
},
'product.accessDenied': {
  en: 'Access Denied',
  fr: 'Accès refusé',
},
'product.reservedMessage': {
  en: 'This is a personalized offer reserved for another client.',
  fr: 'Cette offre personnalisée est réservée à un autre client.',
},
'product.selectSlotWarning': {
  en: 'Please select a time slot.',
  fr: 'Veuillez sélectionner un créneau horaire.',
},
'product.ownOfferError': {
  en: 'You cannot add your own offer to cart.',
  fr: 'Vous ne pouvez pas ajouter votre propre offre au panier.',
},
'product.serviceSlotError': {
  en: 'This exact service slot is already booked or already in your cart.',
  fr: 'Ce créneau de service est déjà réservé ou déjà dans votre panier.',
},
'product.serviceCapacity': {
  en: 'Capacity',
  fr: 'Capacité',
},
'product.limits': {
  en: 'Limits',
  fr: 'Limites',
},
'product.minPrefix': {
  en: 'Min:',
  fr: 'Min :',
},
'product.maxPrefix': {
  en: 'Max:',
  fr: 'Max :',
},
'product.numberOfSlots': {
  en: 'Number of slots',
  fr: 'Nombre de créneaux',
},
'product.minBooking': {
  en: 'Minimum booking is {min} slots.',
  fr: 'La réservation minimale est de {min} créneaux.',
},
'product.totalDuration': {
  en: '{quantity} slot(s) × {duration}h = {total} hours total',
  fr: '{quantity} créneau(x) × {duration}h = {total} heures au total',
},
'product.notSelected': {
  en: 'Not selected',
  fr: 'Non sélectionné',
},
'product.atiStoreName': {
  en: 'ATI Retail Store',
  fr: 'Boutique de détail ATI',
},
'product.vettedQuality': {
  en: 'Vetted Quality',
  fr: 'Qualité vérifiée',
},
'product.portfolioTitle': {
  en: 'Producer Portfolio: {category}',
  fr: 'Portfolio du producteur : {category}',
},
'product.videoLabel': {
  en: 'Video',
  fr: 'Vidéo',
},
'product.slotMine': {
  en: 'Mine',
  fr: 'Le mien',
},
'product.slotBusy': {
  en: 'Busy',
  fr: 'Occupé',
},
'product.openingChat': {
  en: 'Opening…',
  fr: 'Ouverture…',
},
'product.chatWithSeller': {
  en: 'Chat with seller',
  fr: 'Discuter avec le vendeur',
},
'product.chatNegotiate': {
  en: 'Chat / Negotiate',
  fr: 'Discuter / Négocier',
},
'product.noReviewsShort': {
  en: '(No reviews)',
  fr: '(Aucun avis)',
},

// Compare
'compare.unknown': {
  en: 'Unknown',
  fr: 'Inconnu',
},
'compare.action': {
  en: 'Action',
  fr: 'Action',
},
'compare.ratingFallback': {
  en: 'N/A',
  fr: 'N/D',
},

// Auth
'auth.signInRequired': {
  en: 'Sign in required',
  fr: 'Connexion requise',
},
'auth.signInRequiredDesc': {
  en: 'You need to be signed in to perform this action.',
  fr: 'Vous devez être connecté pour effectuer cette action.',
},
'auth.pleaseLogin': {
  en: 'For security reasons, please log in or create an account to finalize your purchase.',
  fr: 'Pour des raisons de sécurité, veuillez vous connecter ou créer un compte pour finaliser votre achat.',
},

// Cart
'cart.atiOrderLabel': {
  en: 'ATI Retail Store Order',
  fr: 'Commande boutique ATI',
},
'cart.producerOrderLabel': {
  en: 'Producer Market Order',
  fr: 'Commande marché producteurs',
},
'cart.deliveryMethod': {
  en: 'Delivery Method',
  fr: 'Méthode de livraison',
},
'cart.homeDelivery': {
  en: 'Home Delivery',
  fr: 'Livraison à domicile',
},
'cart.pickupStationLabel': {
  en: 'Pickup Station',
  fr: 'Point de retrait',
},
'cart.deliveringTo': {
  en: 'Delivering to:',
  fr: 'Livraison à :',
},
'cart.setAddressNow': {
  en: 'Set address now',
  fr: 'Définir l’adresse maintenant',
},
'cart.retailDeliveryDate': {
  en: 'Retail Delivery Date',
  fr: 'Date de livraison au détail',
},
'cart.selectDate': {
  en: 'Select Date',
  fr: 'Sélectionner une date',
},
'cart.selectDatePlaceholder': {
  en: 'Click to select date...',
  fr: 'Cliquez pour sélectionner une date...',
},
'cart.couponPlaceholder': {
  en: 'Coupon Code',
  fr: 'Code promo',
},
'cart.applyCoupon': {
  en: 'APPLY',
  fr: 'APPLIQUER',
},
'cart.discountLabel': {
  en: 'Discount ({coupon})',
  fr: 'Réduction ({coupon})',
},
'cart.deliveryInfo': {
  en: 'Delivery Info',
  fr: 'Infos de livraison',
},
'cart.guestCheckoutTitle': {
  en: 'Checkout as Guest',
  fr: 'Commander en tant qu’invité',
},
'cart.guestCheckoutDesc': {
  en: 'Please provide an email address so we can send your order details and track your cart.',
  fr: 'Veuillez fournir une adresse e-mail pour que nous puissions vous envoyer les détails de votre commande et suivre votre panier.',
},
'cart.guestContinue': {
  en: 'Continue to Checkout',
  fr: 'Continuer vers la commande',
},
'cart.guestCancel': {
  en: 'Cancel',
  fr: 'Annuler',
},
'cart.guestLoginLink': {
  en: ' Log in',
  fr: ' Connectez-vous',
},
'cart.guestAccountAlready': {
  en: 'Already have an account?',
  fr: 'Déjà un compte ?',
},
'cart.guestEmailLabel': {
  en: 'Email Address',
  fr: 'Adresse e-mail',
},
// ── Missing marketplace keys ──────────────────────────────────────────

// ComparePage.tsx
'compare.available': {
  en: 'Available',
  fr: 'Disponible',
},
'compare.pickupOnly': {
  en: 'Pickup Only',
  fr: 'Retrait uniquement',
},
'compare.ownOfferError': {
  en: 'You cannot add your own offer to cart.',
  fr: 'Vous ne pouvez pas ajouter votre propre offre au panier.',
},

// ProducerMarket.tsx
'market.service': {
  en: 'Service',
  fr: 'Service',
},
'market.saveForLater': {
  en: 'Save for later',
  fr: 'Sauvegarder pour plus tard',
},

// ProductDetails.tsx
'product.capacity': {
  en: 'Capacity',
  fr: 'Capacité',
},
'product.signInRequired': {
  en: 'Sign in required',
  fr: 'Connexion requise',
},
'product.signInRequiredDesc': {
  en: 'You need to be signed in to perform this action.',
  fr: 'Vous devez être connecté pour effectuer cette action.',
},
'product.signIn': {
  en: 'Sign in',
  fr: 'Se connecter',
},

// ShoppingCart.tsx
'cart.selectSavedAddress': {
  en: 'Select saved address',
  fr: 'Sélectionner une adresse enregistrée',
},
'cart.noAddressInProfile': {
  en: 'No address in profile.',
  fr: 'Aucune adresse dans le profil.',
},
'cart.deliveryDate': {
  en: 'Delivery Date',
  fr: 'Date de livraison',
},
'cart.couponApply': {
  en: 'APPLY',
  fr: 'APPLIQUER',
},
// ── CreateOffer / Producer forms ──────────────────────────────────────

'form.offerType': {
  en: 'Offer Type',
  fr: 'Type d’offre',
},
'form.product': {
  en: 'Product',
  fr: 'Produit',
},
'form.service': {
  en: 'Service',
  fr: 'Service',
},
'form.productDesc': {
  en: 'Physical goods with stock',
  fr: 'Biens physiques avec stock',
},
'form.serviceDesc': {
  en: 'Time-based (Rental, Labor)',
  fr: 'Basé sur le temps (Location, Main-d’œuvre)',
},
'form.aiHelper': {
  en: 'AI Helper (Gemini)',
  fr: 'Assistant IA (Gemini)',
},
'form.aiHint': {
  en: 'Enter key features (comma separated) and let AI write your description.',
  fr: 'Saisissez les caractéristiques clés (séparées par des virgules) et laissez l’IA rédiger votre description.',
},
'form.generate': {
  en: 'Generate',
  fr: 'Générer',
},
'form.listingCurrency': {
  en: 'Listing currency',
  fr: 'Devise d’affichage',
},
'form.availableCapacity': {
  en: 'Available Slots/Capacity',
  fr: 'Créneaux/Capacité disponibles',
},
'form.serviceConfig': {
  en: 'Service Configuration',
  fr: 'Configuration du service',
},
'form.durationPerSlot': {
  en: 'Duration per Slot (Hours)',
  fr: 'Durée par créneau (heures)',
},
'form.durationHint': {
  en: 'Clients will book timeslots of this duration based on your Availability Calendar.',
  fr: 'Les clients réserveront des créneaux de cette durée selon votre calendrier de disponibilité.',
},
'form.myLocation': {
  en: 'My Location',
  fr: 'Mon emplacement',
},
'form.locationHint': {
  en: 'Select where this product is shipping from.',
  fr: 'Sélectionnez l’origine d’expédition de ce produit.',
},
'form.negotiateHint': {
  en: 'Allow clients to negotiate the price.',
  fr: 'Autoriser les clients à négocier le prix.',
},
'form.deliveryHint': {
  en: 'You can deliver this item/service.',
  fr: 'Vous pouvez livrer cet article/service.',
},
'form.products': {
  en: 'Product images',
  fr: 'Images de produits',
},
'form.services': {
  en: 'Service images',
  fr: 'Images de services',
},
'form.images': {
  en: 'Images',
  fr: 'Images',
},
'form.addImage': {
  en: 'Add image',
  fr: 'Ajouter une image',
},
'form.uploading': {
  en: 'Uploading…',
  fr: 'Téléchargement…',
},
'form.uploadPhotos': {
  en: 'Upload photos (up to 3)',
  fr: 'Téléchargez des photos (jusqu’à 3)',
},
'form.imageFormatHint': {
  en: 'PNG, JPG, or WebP up to 5MB',
  fr: 'PNG, JPG ou WebP jusqu’à 5 Mo',
},
'form.mainImage': {
  en: 'Main',
  fr: 'Principale',
},
'form.minOrderMsg': {
  en: 'Minimum order is {min} units.',
  fr: 'La commande minimum est de {min} unités.',
},
'form.maxOrderMsg': {
  en: 'Maximum order is {max} units.',
  fr: 'La commande maximum est de {max} unités.',
},

// ── ProducerAvailability ──────────────────────────────────────────────

'avail.closed': {
  en: 'Closed',
  fr: 'Fermé',
},
'avail.noExceptions': {
  en: 'No exceptions added.',
  fr: 'Aucune exception ajoutée.',
},
'producer.profileMissing': {
  en: 'Producer profile not found. Please complete your producer profile setup before configuring availability.',
  fr: 'Profil producteur introuvable. Veuillez compléter votre profil producteur avant de configurer les disponibilités.',
},

// ── ProducerDashboard ──────────────────────────────────────────────────

'dash.dashboardTitle': {
  en: 'Dashboard: ',
  fr: 'Tableau de bord : ',
},
'dash.manageAvailability': {
  en: 'Manage Availability',
  fr: 'Gérer les disponibilités',
},
'dash.actionRequired': {
  en: 'Action Required',
  fr: 'Action requise',
},
'dash.noOrdersToShip': {
  en: 'No orders ready for shipping.',
  fr: 'Aucune commande prête à être expédiée.',
},
'dash.clientContact': {
  en: 'Client Contact:',
  fr: 'Contact client :',
},
'dash.contactShared': {
  en: 'Contact Shared',
  fr: 'Contact partagé',
},
'dash.noPendingOrders': {
  en: 'No new orders waiting validation.',
  fr: 'Aucune nouvelle commande en attente de validation.',
},
'dash.noPastOrders': {
  en: 'No past order history.',
  fr: 'Aucun historique de commandes.',
},
'dash.noOrders': {
  en: 'No orders yet.',
  fr: 'Aucune commande pour le moment.',
},
'dash.noOffers': {
  en: 'No offers created yet.',
  fr: 'Aucune offre créée pour le moment.',
},
'dash.edit': {
  en: 'Edit',
  fr: 'Modifier',
},
'dash.deleteOffer': {
  en: 'Delete offer',
  fr: 'Supprimer l’offre',
},
'dash.accountManagerMode': {
  en: 'Account manager mode',
  fr: 'Mode gestionnaire de compte',
},
'dash.accountManagerDesc': {
  en: 'Managing {name} — full producer tools except changing their phone, email, or identity fields.',
  fr: 'Gestion de {name} — tous les outils producteur, sauf modification du téléphone, de l’e-mail ou des champs d’identité.',
},
'producer.profileMissingDashboard': {
  en: 'Producer profile not found. Please complete your producer profile setup.',
  fr: 'Profil producteur introuvable. Veuillez compléter votre profil producteur.',
},

// ── ProducerProfile ────────────────────────────────────────────────────

'profile.accountManagerMode': {
  en: 'Account manager mode',
  fr: 'Mode gestionnaire de compte',
},
'profile.accountManagerDesc': {
  en: 'You are assisting {name}. You can manage offers, orders, locations, documents, and wallet activity. Phone, email, and other personal identity fields cannot be changed.',
  fr: 'Vous assistez {name}. Vous pouvez gérer les offres, les commandes, les emplacements, les documents et l’activité du portefeuille. Le téléphone, l’e-mail et les autres champs d’identité personnelle ne peuvent pas être modifiés.',
},
'profile.fieldLocked': {
  en: 'Cannot be changed after registration',
  fr: 'Ne peut pas être modifié après l’inscription',
},
'profile.portfolioVideoWarning': {
  en: 'Video uses a temporary local URL and cannot be played here after reload. Edit this item and upload again, or use a public https:// link.',
  fr: 'La vidéo utilise une URL locale temporaire et ne peut pas être lue après rechargement. Modifiez cet élément et téléchargez à nouveau, ou utilisez un lien https:// public.',
},
'profile.oneMoreImage': {
  en: '1 more image',
  fr: '1 image supplémentaire',
},
'profile.moreImages': {
  en: '{count} more images',
  fr: '{count} images supplémentaires',
},

// ── RegisterProducer ──────────────────────────────────────────────────

'register.producer.niuBusinessHint': {
  en: 'Required for business accounts; validated by the platform.',
  fr: 'Requis pour les comptes professionnels ; validé par la plateforme.',
},
'register.producer.niuIndividualHint': {
  en: 'National Identification Number — required for all producers.',
  fr: 'Numéro d’identification nationale — requis pour tous les producteurs.',
},
'register.producer.registering': {
  en: 'Registering…',
  fr: 'Inscription…',
},

// ── Referrals (ProducerProfile) ───────────────────────────────────────

'referrals.inviteDesc': {
  en: 'Invite friends and earn when they complete their first order.',
  fr: 'Invitez des amis et gagnez lorsqu’ils finalisent leur première commande.',
},
'referrals.yourInviteCode': {
  en: 'Your invite code',
  fr: 'Votre code d’invitation',
},
'referrals.peopleInvited': {
  en: 'People you invited',
  fr: 'Personnes que vous avez invitées',
},
'referrals.copyLink': {
  en: 'Copy link',
  fr: 'Copier le lien',
},
'referrals.rewardsApply': {
  en: 'Share this link with friends. Rewards apply when their first order is marked Completed (no prior cancellation).',
  fr: 'Partagez ce lien avec vos amis. Les récompenses s’appliquent lorsque leur première commande est marquée Terminée (sans annulation préalable).',
},
'referrals.referrerReward': { en: 'Referrer reward:', fr: 'Récompense du parrain :' },
'referrals.newUserReward': { en: 'New user reward:', fr: 'Récompense pour le nouvel utilisateur :' },
'referrals.minPayout': { en: 'Minimum payout:', fr: 'Paiement minimum :' },
'referrals.termsTitle': { en: 'Terms &amp; conditions', fr: 'Conditions d’utilisation' },
'referrals.noInvites': {
  en: "You haven't invited anyone yet.",
  fr: "Vous n'avez encore invité personne.",
},
'referrals.inviteHint': {
  en: 'Copy your link above and share it to get started.',
  fr: 'Copiez votre lien ci-dessus et partagez-le pour commencer.',
},
// ── Wallet ─────────────────────────────────────────────────────────────

'wallet.upcoming': {
  en: 'Upcoming',
  fr: 'À venir',
},
'wallet.heldUntil': {
  en: 'Held until 5‑day window',
  fr: 'Retenu jusqu’à la fenêtre de 5 jours',
},
'wallet.pendingWithdrawals': {
  en: 'Pending Withdrawals',
  fr: 'Retraits en attente',
},
'wallet.method': {
  en: 'Method',
  fr: 'Méthode',
},
'wallet.proceedToPay': {
  en: 'Proceed to Pay',
  fr: 'Procéder au paiement',
},
'wallet.amountPlaceholder': {
  en: 'Amount (XAF)',
  fr: 'Montant (XAF)',
},
'wallet.withdrawal': {
  en: 'WITHDRAWAL',
  fr: 'RETRAIT',
},
'wallet.redirecting': {
  en: 'Redirecting…',
  fr: 'Redirection…',
},
'wallet.noSavedMethods': {
  en: 'You have no saved payment methods.',
  fr: 'Vous n’avez aucun moyen de paiement enregistré.',
},
'wallet.goToProfile': {
  en: 'Go to Profile to Add Payment Method',
  fr: 'Aller au profil pour ajouter un moyen de paiement',
},
'wallet.topUpDescription': {
  en: 'Enter the amount to add to your wallet. You’ll be redirected to our secure payment page to complete payment (Mobile Money, card, etc.).',
  fr: 'Entrez le montant à ajouter à votre portefeuille. Vous serez redirigé vers notre page de paiement sécurisée pour finaliser le paiement (Mobile Money, carte, etc.).',
},
'wallet.maxAvailable': {
  en: 'Max available: {amount} XAF',
  fr: 'Max disponible : {amount} XAF',
},
'wallet.youReceive': {
  en: 'You receive',
  fr: 'Vous recevez',
},
'wallet.tranzakFee': {
  en: 'Tranzak fee (1.5%)',
  fr: 'Frais Tranzak (1,5 %)',
},
'wallet.deductedFromWallet': {
  en: 'Deducted from wallet',
  fr: 'Déduit du portefeuille',
},
  // Shared components
  'common.close': { en: 'Close', fr: 'Fermer' },
  'common.dismiss': { en: 'Dismiss', fr: 'Fermer' },
  'common.loading': { en: 'Loading...', fr: 'Chargement...' },
  'common.loadingAvailableSlots': { en: 'Loading available slots...', fr: 'Chargement des creneaux disponibles...' },
  'toast.success': { en: 'Success', fr: 'Succes' },
  'toast.error': { en: 'Error', fr: 'Erreur' },
  'toast.attention': { en: 'Attention', fr: 'Attention' },
  'toast.info': { en: 'Info', fr: 'Info' },
  'currency.displayTitle': { en: 'Display currency', fr: "Devise d'affichage" },
  'currency.description': {
    en: 'Prices across the marketplace are shown in this currency. Coverage includes CFA (XAF/XOF), USD, EUR, GBP, JPY, and major African currencies (NGN, GHS, GNF, CDF, KES, RWF, ZAR, ZMW). Your wallet and payments always stay in {currency} (platform settlement). Rates refresh live.',
    fr: "Les prix sur la place de marche sont affiches dans cette devise. Les devises prises en charge incluent le CFA (XAF/XOF), l'USD, l'EUR, la GBP, le JPY et les principales devises africaines (NGN, GHS, GNF, CDF, KES, RWF, ZAR, ZMW). Votre portefeuille et vos paiements restent toujours en {currency} (reglement de la plateforme). Les taux sont actualises en direct.",
  },
  'currency.preferredLabel': { en: 'Preferred display currency', fr: "Devise d'affichage preferee" },
  'currency.updated': { en: 'Display currency updated.', fr: "Devise d'affichage mise a jour." },
  'map.locationPickerAria': { en: 'Map: drag the pin or click to set your location', fr: 'Carte : faites glisser le repere ou cliquez pour definir votre emplacement' },
  'stepper.decrease': { en: 'Decrease', fr: 'Diminuer' },
  'stepper.increase': { en: 'Increase', fr: 'Augmenter' },
  'producer.accessDenied': { en: 'Access denied', fr: 'Accès refusé' },
  'day.Monday': { en: 'Monday', fr: 'Lundi' },
  'day.Tuesday': { en: 'Tuesday', fr: 'Mardi' },
  'day.Wednesday': { en: 'Wednesday', fr: 'Mercredi' },
  'day.Thursday': { en: 'Thursday', fr: 'Jeudi' },
  'day.Friday': { en: 'Friday', fr: 'Vendredi' },
  'day.Saturday': { en: 'Saturday', fr: 'Samedi' },
  'day.Sunday': { en: 'Sunday', fr: 'Dimanche' },
  'avail.off': { en: 'Off', fr: 'Fermé' },
  'avail.removeException': { en: 'Remove exception', fr: "Supprimer l’exception" },
  'register.showPassword': { en: 'Show password', fr: 'Afficher le mot de passe' },
  'register.hidePassword': { en: 'Hide password', fr: 'Masquer le mot de passe' },
  'register.showConfirmPassword': { en: 'Show confirm password', fr: 'Afficher la confirmation du mot de passe' },
  'register.hideConfirmPassword': { en: 'Hide confirm password', fr: 'Masquer la confirmation du mot de passe' },
  'dash.pickup': { en: 'Pickup', fr: 'Retrait' },
  'dash.contactInfo': { en: 'Contact information', fr: 'Coordonnées' },
  'dash.disputeActive': { en: 'Dispute active', fr: 'Litige en cours' },
  'dash.reasonLabel': { en: 'Reason:', fr: 'Motif :' },
  'dash.notAvailable': { en: 'N/A', fr: 'N/D' },
  'dash.evidenceUploaded': { en: 'Evidence uploaded:', fr: 'Preuves envoyées :' },
  'dash.you': { en: 'You', fr: 'Vous' },
  'dash.clientLabel': { en: 'Client', fr: 'Client' },
  'dash.total': { en: 'Total', fr: 'Total' },
  'dash.reviewPlaceholder': { en: 'Comments about this client...', fr: 'Commentaires sur ce client...' },
  'dash.uploadFiles': { en: 'Upload files', fr: 'Téléverser des fichiers' },
  'dash.evidenceUploadHint': { en: 'JPG, PNG, PDF up to 10MB — up to 3 files', fr: 'JPG, PNG, PDF jusqu’à 10 Mo — 3 fichiers maximum' },
  'dash.filesSelected': { en: '{count} files selected:', fr: '{count} fichiers sélectionnés :' },
  'dash.upload': { en: 'Upload', fr: 'Téléverser' },
  'dash.deleteOfferTitle': { en: 'Delete offer?', fr: 'Supprimer l’offre ?' },
  'dash.deleteOfferDescription': { en: 'This action cannot be undone.', fr: 'Cette action est irréversible.' },
  'dash.delete': { en: 'Delete', fr: 'Supprimer' },
  'dash.rejectOrderTitle': { en: 'Reject this order?', fr: 'Rejeter cette commande ?' },
  'dash.rejectOrderDescription': { en: 'The client will be notified that this order was rejected. This action cannot be undone.', fr: 'Le client sera informé du rejet de cette commande. Cette action est irréversible.' },
  'form.offerImageAlt': { en: 'Offer image {number}', fr: 'Image de l’offre {number}' },
  'service.date': { en: 'Date', fr: 'Date' },
  'service.unavailable': { en: 'Unavailable', fr: 'Indisponible' },
  'service.unavailableReason': { en: 'Unavailable: {reason}', fr: 'Indisponible : {reason}' },
  'service.alreadyInCart': { en: 'Already in your cart', fr: 'Déjà dans votre panier' },
  'service.alreadyBooked': { en: 'You already booked this slot', fr: 'Vous avez déjà réservé ce créneau' },
  'service.alreadyBusy': { en: 'Already busy', fr: 'Déjà occupé' },
  'service.availabilityFailed': { en: 'Availability check failed. Please try another date.', fr: 'La vérification des disponibilités a échoué. Veuillez essayer une autre date.' },
  'service.noSlots': { en: 'No slots available for this date.', fr: 'Aucun créneau disponible pour cette date.' },
  'service.pickDayHint': { en: 'Pick a day when the producer is available and choose an open time slot.', fr: 'Choisissez un jour où le producteur est disponible, puis un créneau libre.' },
  'service.mine': { en: 'Mine', fr: 'Le mien' },
  'service.busy': { en: 'Busy', fr: 'Occupé' },
  'service.duration': { en: 'Duration: {hours} hours per slot', fr: 'Durée : {hours} heures par créneau' },
  'validation.titleMin': { en: 'Title must be at least 3 characters.', fr: 'Le titre doit comporter au moins 3 caractères.' },
  'validation.descriptionMinTen': { en: 'Description must be at least 10 characters.', fr: 'La description doit comporter au moins 10 caractères.' },
  'validation.categoryRequired': { en: 'Category is required.', fr: 'La catégorie est requise.' },
  'validation.unitRequired': { en: 'Unit is required.', fr: 'L’unité est requise.' },
  'validation.pricePositive': { en: 'Price must be greater than 0.', fr: 'Le prix doit être supérieur à 0.' },
  'validation.quantityMin': { en: 'Quantity must be at least 1.', fr: 'La quantité doit être au moins 1.' },
  'validation.minOrderMin': { en: 'Minimum order must be at least 1.', fr: 'La commande minimale doit être au moins de 1.' },
  'validation.maxOrderNegative': { en: 'Maximum order cannot be negative.', fr: 'La commande maximale ne peut pas être négative.' },
  'validation.locationRequired': { en: 'Product location is required.', fr: 'L’emplacement du produit est requis.' },
  'validation.imageRequired': { en: 'Please upload a product or service image.', fr: 'Veuillez téléverser une image du produit ou service.' },
  'validation.maxBelowMin': { en: 'Maximum order quantity cannot be less than minimum order quantity.', fr: 'La quantité maximale ne peut pas être inférieure à la quantité minimale.' },
  'validation.serviceDurationMin': { en: 'Service duration must be at least 1 hour.', fr: 'La durée du service doit être d’au moins 1 heure.' },
  'form.waitImageUpload': { en: 'Please wait for the image to finish uploading.', fr: 'Veuillez attendre la fin du téléversement de l’image.' },
  'form.pricePlaceholder': { en: 'Enter price in {currency}', fr: 'Saisissez le prix en {currency}' },
  'form.priceAriaLabel': { en: 'Price in {currency}', fr: 'Prix en {currency}' },
  'profile.accountNumberRequired': { en: 'Account number is required.', fr: 'Le numéro de compte est requis.' },
  'profile.accountNameRequired': { en: 'Account name is required.', fr: 'Le nom du titulaire est requis.' },
  'profile.invalidCameroonNumber': { en: 'Enter a valid Cameroon number: 237 + 9 digits starting with 65–69 (for example, 237670000000).', fr: 'Saisissez un numéro camerounais valide : 237 suivi de 9 chiffres commençant par 65–69 (par exemple, 237670000000).' },
  'profile.imageSizeLimit': { en: 'Image must be 2 MB or less.', fr: 'L’image doit faire 2 Mo ou moins.' },
  'profile.imageTypeInvalid': { en: 'Only PNG, JPG, and WebP are allowed for profile photos.', fr: 'Seuls les formats PNG, JPG et WebP sont autorisés pour les photos de profil.' },
  'profile.uploadFailed': { en: 'Upload failed.', fr: 'Le téléversement a échoué.' },
  'profile.descriptionRequired': { en: 'Description is required.', fr: 'La description est requise.' },
  'profile.phoneRequired': { en: 'Phone is required.', fr: 'Le numéro de téléphone est requis.' },
  'profile.emailInvalid': { en: 'Valid email is required.', fr: 'Une adresse e-mail valide est requise.' },
  'profile.fixFormErrors': { en: 'Please fix profile form errors.', fr: 'Veuillez corriger les erreurs du profil.' },
  'profile.waitMediaUploads': { en: 'Please wait for media uploads to finish.', fr: 'Veuillez attendre la fin des téléversements multimédias.' },
  'profile.missingProducer': { en: 'No producer profile was found for your account.', fr: 'Aucun profil producteur n’a été trouvé pour votre compte.' },
  'profile.profileImageAlt': { en: 'Profile', fr: 'Profil' },
  'portfolio.titleRequired': { en: 'Title is required.', fr: 'Le titre est requis.' },
  'portfolio.categoryRequired': { en: 'Category is required.', fr: 'La catégorie est requise.' },
  'portfolio.descriptionRequired': { en: 'Description is required.', fr: 'La description est requise.' },
  'portfolio.fixFormErrors': { en: 'Please fix portfolio form errors.', fr: 'Veuillez corriger les erreurs du portfolio.' },
  'portfolio.editItem': { en: 'Edit portfolio item', fr: 'Modifier l’élément du portfolio' },
  'portfolio.addItem': { en: 'Add portfolio item', fr: 'Ajouter un élément au portfolio' },
  'portfolio.selectCategory': { en: 'Select category', fr: 'Sélectionner une catégorie' },
  'portfolio.media': { en: 'Media', fr: 'Médias' },
  'portfolio.addImages': { en: 'Add images (max 10)', fr: 'Ajouter des images (max. 10)' },
  'portfolio.addVideo': { en: 'Add video', fr: 'Ajouter une vidéo' },
  'portfolio.replaceVideo': { en: 'Replace video', fr: 'Remplacer la vidéo' },
  'portfolio.videoAttached': { en: 'Video attached', fr: 'Vidéo jointe' },
  'portfolio.remove': { en: 'Remove', fr: 'Supprimer' },
  'dash.noAddress': { en: 'No address', fr: 'Aucune adresse' },
  'dash.unknownProducer': { en: 'Unknown producer', fr: 'Producteur inconnu' },
  'dash.booked': { en: 'Booked', fr: 'Réservé' },
  'dash.confirmed': { en: 'Confirmed', fr: 'Confirmé' },
  'dash.paid': { en: 'Paid', fr: 'Payé' },
  'dash.inTransit': { en: 'In transit', fr: 'En transit' },
  'dash.delivered': { en: 'Delivered', fr: 'Livré' },
  'dash.completed': { en: 'Completed', fr: 'Terminé' },
  'dash.cancelled': { en: 'Cancelled', fr: 'Annulé' },
  'dash.dispute': { en: 'Dispute', fr: 'Litige' },
  'dash.deleteOfferAria': { en: 'Delete {title}', fr: 'Supprimer {title}' },
  'dash.profileMissingDashboard': { en: 'Producer profile not found. Please complete your producer profile setup.', fr: 'Profil producteur introuvable. Veuillez compléter votre profil producteur.' },
  'favorites.unavailableTitleLegacy': { en: 'Unavailable favorites', fr: 'Favoris indisponibles' },
  'favorites.itemUnavailableLegacyDuplicate': { en: 'This item is no longer available.', fr: 'Legacy translation.' },
  'profile.taxComplianceRequired': { en: 'Tax compliance certificate (ACF) is required.', fr: 'L’attestation de non-redevance fiscale (ACF) est requise.' },
  'profile.referralCopied': { en: 'Referral link copied!', fr: 'Lien de parrainage copié !' },
  'profile.maxImages': { en: 'Maximum 10 images allowed.', fr: 'Maximum 10 images autorisées.' },
  'profile.videoSizeLimit': { en: 'Video file too large. Maximum size is 50MB.', fr: 'Le fichier vidéo est trop volumineux. La taille maximale est de 50 Mo.' },
  'form.imageTypeAccepted': { en: 'Only PNG, JPG, or WebP images are accepted.', fr: 'Seules les images PNG, JPG ou WebP sont acceptées.' },
  'form.imageSizeLimit': { en: 'Image must be 5 MB or less.', fr: 'L’image doit faire 5 Mo ou moins.' },
  'profile.paymentSaveFailed': { en: 'Could not save the payment method.', fr: 'Impossible d’enregistrer le moyen de paiement.' },
  'portfolio.fileTooLarge': { en: 'File {name} is too large. Maximum size is 5MB.', fr: 'Le fichier {name} est trop volumineux. La taille maximale est de 5 Mo.' },
  'portfolio.fileTypeInvalid': { en: 'File {name} has an invalid format. Only PNG, JPG, or WebP are allowed.', fr: 'Le fichier {name} a un format non valide. Seuls PNG, JPG ou WebP sont autorisés.' },
  'portfolio.imageUploadFailed': { en: 'Portfolio image upload failed.', fr: 'Le téléversement de l’image du portfolio a échoué.' },
  'portfolio.videoUploadFailed': { en: 'Video upload failed.', fr: 'Le téléversement de la vidéo a échoué.' },
  'portfolio.categoryExists': { en: 'You already have a portfolio for the "{category}" category. You can edit the existing one instead.', fr: 'Vous avez déjà un portfolio pour la catégorie « {category} ». Vous pouvez modifier celui qui existe déjà.' },
  'profile.thisProducer': { en: 'this producer', fr: 'ce producteur' },
  // ── SupportChatWidget ─────────────────────────────────────────────────
'support.connectedAgent': {
  en: 'Connected with a support agent',
  fr: 'Connecté avec un agent d’assistance',
},
'support.agentWithYou': {
  en: 'An agent is with you — send your message below.',
  fr: 'Un agent est avec vous — envoyez votre message ci-dessous.',
},
'support.talkToHuman': {
  en: 'Talk to a human agent',
  fr: 'Parler à un agent humain',
},
'support.connecting': {
  en: 'Connecting…',
  fr: 'Connexion…',
},

// ── ChatPage ──────────────────────────────────────────────────────────
'chat.newNegotiationContext': {
  en: 'New negotiation context:',
  fr: 'Nouveau contexte de négociation :',
},
'chat.selectOfferFirst': {
  en: 'Select an offer first',
  fr: 'Sélectionnez d’abord une offre',
},
'chat.onlyProducerProposal': {
  en: 'Only producer can open a new proposal round',
  fr: 'Seul le producteur peut ouvrir un nouveau tour de proposition',
},
'chat.counterLimitReached': {
  en: 'Counter-offer limit reached (3 per round)',
  fr: 'Limite de contre-offres atteinte (3 par tour)',
},
'chat.offerNotNegotiable': {
  en: 'This offer is not open for negotiation',
  fr: 'Cette offre n’est pas ouverte à la négociation',
},
'chat.pricePlaceholder': {
  en: 'e.g. 2500',
  fr: 'ex: 2500',
},
'chat.quantityPlaceholder': {
  en: 'e.g. 10',
  fr: 'ex: 10',
},

// ── CreateOffer ──────────────────────────────────────────────────────
'form.maxImagesPerOffer': {
  en: 'Maximum 3 images per offer.',
  fr: 'Maximum 3 images par offre.',
},
'form.uploadFailed': {
  en: 'Image upload failed.',
  fr: 'Le téléversement de l’image a échoué.',
},
'form.updateOfferFailed': {
  en: 'Could not update the offer.',
  fr: 'Impossible de mettre à jour l’offre.',
},
'form.publishOfferFailed': {
  en: 'Could not publish the offer.',
  fr: 'Impossible de publier l’offre.',
},

// ── PublicProfile ────────────────────────────────────────────────────
'profile.userNotFound': {
  en: 'User not found',
  fr: 'Utilisateur non trouvé',
},
'profile.about': {
  en: 'About',
  fr: 'À propos',
},
'profile.businessSector': {
  en: 'Business Sector',
  fr: 'Secteur d’activité',
},
'profile.noDescription': {
  en: 'No description provided.',
  fr: 'Aucune description fournie.',
},
'profile.activeOffers': {
  en: 'Active Offers',
  fr: 'Offres actives',
},
'profile.noActiveOffers': {
  en: 'No active offers at the moment.',
  fr: 'Aucune offre active pour le moment.',
},
'portfolio.noItems': {
  en: 'No portfolio items published yet.',
  fr: 'Aucun élément de portfolio publié pour le moment.',
},
'profile.reviewsAndNotes': {
  en: 'Reviews & Notes',
  fr: 'Avis et notes',
},
'profile.noReviews': {
  en: 'No reviews yet.',
  fr: 'Aucun avis pour le moment.',
},
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const t = (key: string, replacements?: Record<string, string | number>): string => {
  const entry = translations[key];
  if (!entry) {
    if (key.startsWith('category.')) return key.split('.')[1];
    return key;
  }
  let text = entry[language];
  if (replacements) {
    text = text.replace(/{(\w+)}/g, (_, placeholder) =>
      String(replacements[placeholder] ?? `{${placeholder}}`)
    );
  }
  // console.log(translations[key], language, text); // Debugging line
  return text;
};

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
};
