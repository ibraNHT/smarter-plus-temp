
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'fr';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navbar
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

  // Footer
  'footer.about': { en: 'About AgriMarket', fr: 'À propos d\'AgriMarket' },
  'footer.tagline': { en: 'Connecting producers and consumers for a sustainable future.', fr: 'Connecter producteurs et consommateurs pour un avenir durable.' },
  'footer.col.markets': { en: 'Markets', fr: 'Marchés' },
  'footer.col.company': { en: 'Company', fr: 'Entreprise' },
  'footer.col.support': { en: 'Support & Legal', fr: 'Aide & Légal' },
  'footer.link.jobs': { en: 'Jobs', fr: 'Emplois' },
  'footer.link.partners': { en: 'Partners', fr: 'Partenaires' },
  'footer.link.blog': { en: 'Blog', fr: 'Blog' },
  'footer.link.faq': { en: 'FAQ', fr: 'FAQ' },
  'footer.link.terms': { en: 'Terms of Use', fr: 'Conditions d\'Utilisation' },
  'footer.link.privacy': { en: 'Privacy Policy', fr: 'Politique de Confidentialité' },
  'footer.rights': { en: 'All rights reserved.', fr: 'Tous droits réservés.' },

  // Static Pages Content
  'blog.title': { en: 'AgriMarket Insights', fr: 'Actualités AgriMarket' },
  'blog.subtitle': { en: 'Latest news, tips for farmers, and market trends.', fr: 'Dernières nouvelles, conseils pour les agriculteurs et tendances du marché.' },
  'jobs.title': { en: 'Join Our Team', fr: 'Rejoignez Notre Équipe' },
  'jobs.subtitle': { en: 'Help us revolutionize agriculture in Africa.', fr: 'Aidez-nous à révolutionner l\'agriculture en Afrique.' },
  'partners.title': { en: 'Our Strategic Partners', fr: 'Nos Partenaires Stratégiques' },
  'faq.title': { en: 'Frequently Asked Questions', fr: 'Foire Aux Questions' },
  'terms.title': { en: 'Terms of Use', fr: 'Conditions d\'Utilisation' },
  'privacy.title': { en: 'Privacy Policy', fr: 'Politique de Confidentialité' },

  // Landing Page
  'landing.hero.title': { en: 'Two Markets, One Platform', fr: 'Deux Marchés, Une Plateforme' },
  'landing.hero.subtitle': { en: 'Whether you are a business looking for bulk produce or a family needing daily groceries, AgriMarket Connect has you covered.', fr: 'Que vous soyez une entreprise cherchant du vrac ou une famille ayant besoin de courses quotidiennes, AgriMarket Connect est là pour vous.' },
  'landing.card.wholesale': { en: 'Wholesale', fr: 'Gros' },
  'landing.card.retail': { en: 'Retail', fr: 'Détail' },
  'landing.producerMarket.title': { en: 'Producer Market', fr: 'Marché Producteurs' },
  'landing.producerMarket.desc': { en: 'Buy in bulk directly from independent farmers. Negotiable prices, large quantities.', fr: 'Achetez en gros directement aux agriculteurs indépendants. Prix négociables, grandes quantités.' },
  'landing.atiStore.title': { en: 'ATI Store', fr: 'Boutique ATI' },
  'landing.atiStore.desc': { en: 'Your daily online grocery store. Managed inventory, fixed prices, fast retail delivery.', fr: 'Votre épicerie en ligne quotidienne. Inventaire géré, prix fixes, livraison rapide.' },
  'landing.cta.browse': { en: 'Browse Offers', fr: 'Voir les Offres' },
  'landing.cta.shop': { en: 'Shop Groceries', fr: 'Faire les Courses' },
  'landing.new': { en: 'New to the platform?', fr: 'Nouveau sur la plateforme ?' },
  'landing.createAccount': { en: 'Create Account', fr: 'Créer un Compte' },

  // Login
  'login.title': { en: 'Sign in to your account', fr: 'Connectez-vous à votre compte' },
  'login.subtitle': { en: 'Access the AgriMarket platform securely.', fr: 'Accédez à la plateforme AgriMarket en toute sécurité.' },
  'login.emailPlaceholder': { en: 'Enter your email', fr: 'Entrez votre email' },
  'login.passwordPlaceholder': { en: 'Enter your password', fr: 'Entrez votre mot de passe' },
  'login.forgotPassword': { en: 'Forgot password?', fr: 'Mot de passe oublié ?' },
  'login.signIn': { en: 'Sign In', fr: 'Se Connecter' },
  'login.demo': { en: 'Demo Accounts (Quick Access)', fr: 'Comptes de Démo (Accès Rapide)' },
  'login.resetTitle': { en: 'Reset Password', fr: 'Réinitialiser le mot de passe' },
  'login.resetDesc': { en: 'Enter the phone number registered on your account. We will send a verification code by SMS.', fr: 'Entrez le numéro de téléphone enregistré sur votre compte. Nous enverrons un code par SMS.' },
  'login.sendReset': { en: 'Send SMS code', fr: 'Envoyer le code SMS' },
  'login.forgotAfterSend': { en: 'If an account exists for this number, you will receive an SMS shortly. Enter the code below.', fr: 'Si un compte existe pour ce numéro, vous recevrez un SMS sous peu. Entrez le code ci-dessous.' },
  'login.newPasswordLabel': { en: 'New password', fr: 'Nouveau mot de passe' },
  'login.confirmNewPasswordLabel': { en: 'Confirm new password', fr: 'Confirmer le mot de passe' },
  'login.saveNewPassword': { en: 'Save new password', fr: 'Enregistrer le mot de passe' },
  'login.passwordResetSuccess': { en: 'Your password was updated. You can sign in now.', fr: 'Votre mot de passe a été mis à jour. Vous pouvez vous connecter.' },
  'login.passwordsMustMatch': { en: 'Passwords do not match.', fr: 'Les mots de passe ne correspondent pas.' },
  'login.passwordMinLength': { en: 'Password must be at least 8 characters.', fr: 'Le mot de passe doit contenir au moins 8 caractères.' },
  'login.changePhoneNumber': { en: 'Use a different number', fr: 'Utiliser un autre numéro' },
  'login.phoneLocalMin': { en: 'Enter at least 6 digits for your phone number.', fr: 'Entrez au moins 6 chiffres pour votre numéro.' },
  'login.invalidPhoneFormat': { en: 'Enter a valid phone number (country code + number).', fr: 'Entrez un numéro valide (indicatif + numéro).' },
  'login.backToLogin': { en: 'Back to Login', fr: 'Retour à la connexion' },

  // OTP Verification
  'verify.title': { en: 'Verify Your Email', fr: 'Vérifiez votre Email' },
  'verify.desc': { en: 'We have sent a 6-digit code to your email address. Please enter it below to activate your account.', fr: 'Nous avons envoyé un code à 6 chiffres à votre adresse email. Veuillez l\'entrer ci-dessous pour activer votre compte.' },
  'verify.label': { en: 'Verification Code', fr: 'Code de Vérification' },
  'verify.submit': { en: 'Verify & Activate', fr: 'Vérifier et Activer' },
  'verify.invalid': { en: 'Invalid code. Please try again.', fr: 'Code invalide. Veuillez réessayer.' },

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

  // Generic Form
  'form.name': { en: 'Full Name', fr: 'Nom Complet' },
  'form.farmName': { en: 'Business/Farm Name', fr: 'Nom de la Ferme/Entreprise' },
  'form.email': { en: 'Email', fr: 'Email' },
  'form.phone': { en: 'Phone', fr: 'Téléphone' },
  'form.address': { en: 'Address', fr: 'Adresse' },
  'form.desc': { en: 'Description', fr: 'Description' },
  'form.category': { en: 'Category', fr: 'Catégorie' },
  'form.price': { en: 'Price', fr: 'Prix' },
  'form.quantity': { en: 'Quantity', fr: 'Quantité' },
  'form.unit': { en: 'Unit', fr: 'Unité' },
  'form.cancel': { en: 'Cancel', fr: 'Annuler' },
  'form.submit': { en: 'Submit', fr: 'Valider' },
  'form.save': { en: 'Save Changes', fr: 'Sauvegarder' },
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
  'category.Equipment': { en: 'Equipment', fr: 'Équipement' },
  'category.Service': { en: 'Service', fr: 'Service' },
  'category.Cereals': { en: 'Cereals', fr: 'Céréales' },
  'category.Oils': { en: 'Oils', fr: 'Huiles' },
  'category.Canned Goods': { en: 'Canned Goods', fr: 'Conserves' },
  'category.Spices': { en: 'Spices', fr: 'Épices' },
  'category.Retail': { en: 'Retail', fr: 'Détail' },

  // Units of Measure
  'unit.KG': { en: 'Kilogram (kg)', fr: 'Kilogramme (kg)' },
  'unit.TON': { en: 'Ton', fr: 'Tonne' },
  'unit.CRATE': { en: 'Crate', fr: 'Cajette' },
  'unit.BUNDLE': { en: 'Bundle', fr: 'Botte' },
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
  'market.producerTitle': { en: 'Producer Market', fr: 'Marché Producteurs' },
  'market.atiTitle': { en: 'ATI Store', fr: 'Boutique ATI' },
  'market.recommended': { en: 'Recommended for You', fr: 'Recommandé pour Vous' },

  // Product Details
  'product.back': { en: 'Back to results', fr: 'Retour aux résultats' },
  'product.producerOffer': { en: 'Producer Offer', fr: 'Offre Producteur' },
  'product.atiOffer': { en: 'ATI Store', fr: 'Boutique ATI' },
  'product.negotiable': { en: 'Price Negotiable', fr: 'Prix Négociable' },
  'product.stock': { en: 'Stock Available', fr: 'Stock Disponible' },
  'product.soldBy': { en: 'Sold by', fr: 'Vendu par' },
  'product.verified': { en: 'Verified Producer', fr: 'Producteur Vérifié' },
  'product.addToCart': { en: 'Add to Cart', fr: 'Ajouter au Panier' },
  'product.negotiate': { en: 'Negotiate Price', fr: 'Négocier le Prix' },
  'product.bookNow': { en: 'Book Now', fr: 'Réserver Maintenant' },
  'product.selectSlot': { en: 'Select a Date & Time', fr: 'Choisir une Date et Heure' },
  'product.rateProducer': { en: 'Rate Producer', fr: 'Noter le Producteur' },
  'product.compare': { en: 'Compare', fr: 'Comparer' },
  
  // Cart
  'cart.title': { en: 'Shopping Cart', fr: 'Panier' },
  'cart.empty': { en: 'Your cart is empty', fr: 'Votre panier est vide' },
  'cart.emptyDesc': { en: 'Looks like you haven\'t added anything yet.', fr: 'Il semble que vous n\'ayez rien ajouté pour l\'instant.' },
  'cart.start': { en: 'Start Shopping', fr: 'Commencer vos achats' },
  'cart.remove': { en: 'Remove', fr: 'Retirer' },
  'cart.saveForLater': { en: 'Save for Later', fr: 'Sauver pour plus tard' },
  'cart.singleProducer': { en: 'Ordered from a single producer', fr: 'Commandé chez un seul producteur' },
  'cart.clear': { en: 'Clear Cart', fr: 'Vider le panier' },
  'cart.summary': { en: 'Order Summary', fr: 'Résumé de la commande' },
  'cart.subtotal': { en: 'Subtotal', fr: 'Sous-total' },
  'cart.serviceFee': { en: 'Service Fee (5%)', fr: 'Frais de service (5%)' },
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
  'cart.confirmOrder': { en: 'Confirm Order', fr: 'Confirmer la Commande' },
  'cart.recap': { en: 'Order Recap', fr: 'Récapitulatif de la Commande' },
  'cart.validate': { en: 'Validate Order', fr: 'Valider la Commande' },
  
  // Dashboard
  'dash.status': { en: 'Status', fr: 'Statut' },
  'dash.pending': { en: 'Pending Validation', fr: 'En attente de validation' },
  'dash.pendingMsg': { en: 'Your account is currently Pending Validation. You can create offers, but they won\'t be visible to clients until approved.', fr: 'Votre compte est en attente de validation. Vous pouvez créer des offres, mais elles ne seront visibles qu\'après approbation.' },
  'dash.activeOffers': { en: 'Total Active Offers', fr: 'Offres Actives' },
  'dash.myCatalog': { en: 'My Catalog', fr: 'Mon Catalogue' },
  'dash.incomingOrders': { en: 'Incoming Orders', fr: 'Commandes Reçues' },
  'dash.ordersToShip': { en: 'Orders to Ship', fr: 'Commandes à Expédier' },
  'dash.awaitingPayment': { en: 'Confirmed – Awaiting Payment', fr: 'Confirmées – En attente de paiement' },
  'dash.allOrders': { en: 'All Orders', fr: 'Toutes les commandes' },
  'dash.allOrdersDesc': { en: 'View details for any order from booking to delivery, including completed or cancelled.', fr: 'Voir les détails de chaque commande du réservation à la livraison, y compris terminées ou annulées.' },
  'dash.orderHistory': { en: 'Order History (Completed/Cancelled)', fr: 'Historique (Terminées/Annulées)' },
  'dash.orderTimeline': { en: 'Order timeline', fr: 'Étapes de la commande' },
  'dash.orderPlaced': { en: 'Order placed', fr: 'Commande passée' },
  'dash.createFirst': { en: 'Create your first offer', fr: 'Créez votre première offre' },
  'dash.confirm': { en: 'Confirm Order', fr: 'Confirmer' },
  'dash.reject': { en: 'Reject', fr: 'Rejeter' },
  'dash.startDelivery': { en: 'Start Delivery', fr: 'Expédier' },
  'dash.viewDetails': { en: 'View Details', fr: 'Voir Détails' },
  'dash.orderDetails': { en: 'Order Details', fr: 'Détails Commande' },
  'dash.client': { en: 'Client', fr: 'Client' },
  'dash.address': { en: 'Shipping Address', fr: 'Adresse de livraison' },
  'dash.items': { en: 'Items', fr: 'Articles' },
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
  'wallet.noTx': { en: 'No transactions yet.', fr: 'Aucune transaction.' },
  'wallet.noReq': { en: 'No withdrawal requests.', fr: 'Aucune demande de retrait.' },
  'wallet.processWithdraw': { en: 'Submit Withdrawal', fr: 'Soumettre le retrait' },

  // OTP verification
  'otp.verifyProfileTitle': { en: 'Verify identity to update profile', fr: 'Vérifiez votre identité pour modifier le profil' },
  'otp.verifyWithdrawTitle': { en: 'Verify identity to withdraw', fr: 'Vérifiez votre identité pour retirer' },
  'otp.sendCode': { en: 'Send code to my phone', fr: 'Envoyer le code à mon téléphone' },
  'otp.verify': { en: 'Verify', fr: 'Vérifier' },
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
  'order.paid': { en: 'Paid - In Preparation', fr: 'Payé - En Préparation' },
  'order.completed': { en: 'Completed', fr: 'Terminé' },
  'order.cancelled': { en: 'Cancelled', fr: 'Annulé' },
  'order.insufficient': { en: 'Insufficient funds. Please top up your wallet.', fr: 'Fonds insuffisants. Veuillez recharger votre compte.' },
  'order.inTransit': { en: 'In Transit', fr: 'En Transit' },
  'order.active': { en: 'Active Orders', fr: 'Commandes Actives' },
  'order.past': { en: 'Order History', fr: 'Historique' },
  'order.cancel': { en: 'Cancel Order', fr: 'Annuler Commande' },
  'order.cannotCancelPaid': { en: 'Paid orders cannot be cancelled by user. Contact support.', fr: 'Impossible d\'annuler une commande payée. Contactez le support.' },
  'order.uploadFiles': { en: 'Upload Evidence (JPG, PNG, PDF)', fr: 'Preuves (JPG, PNG, PDF)' },
  'order.files': { en: 'Files', fr: 'Fichiers' },
  'order.reason': { en: 'Reason', fr: 'Raison' },
  'order.submitReport': { en: 'Submit Report', fr: 'Envoyer le Rapport' },
  'order.paymentRecap': { en: 'Payment Validation', fr: 'Validation du Paiement' },
  'order.soldBy': { en: 'Sold by', fr: 'Vendu par' },
  'order.walletBalance': { en: 'Wallet Balance', fr: 'Solde Portefeuille' },
  'order.orderTotal': { en: 'Order Amount', fr: 'Montant Commande' },
  'order.confirmPayment': { en: 'Confirm Payment', fr: 'Confirmer Paiement' },

  // Profile
  'profile.tabs.info': { en: 'Personal Info', fr: 'Infos Personnelles' },
  'profile.tabs.orders': { en: 'My Orders', fr: 'Mes Commandes' },
  'profile.tabs.security': { en: 'Security', fr: 'Sécurité' },
  'profile.tabs.payment': { en: 'Payment Settings', fr: 'Moyens de Paiement' },
  'profile.tabs.portfolio': { en: 'Portfolio', fr: 'Portfolio' },
  'profile.tabs.favorites': { en: 'Favorites', fr: 'Favoris' },
  'profile.tabs.reputation': { en: 'My Reputation', fr: 'Ma Réputation' },
  'profile.update': { en: 'Update Profile', fr: 'Mettre à jour' },
  'profile.password': { en: 'Change Password', fr: 'Changer le mot de passe' },
  'profile.payment.add': { en: 'Add Payment Method', fr: 'Ajouter un moyen de paiement' },
  'profile.payment.provider': { en: 'Provider', fr: 'Opérateur' },
  'profile.payment.accNum': { en: 'Account/Phone Number', fr: 'Numéro de compte/téléphone' },
  'profile.payment.accName': { en: 'Account Holder Name', fr: 'Nom du titulaire' },
  'profile.payment.saved': { en: 'Saved Payment Methods', fr: 'Moyens de paiement enregistrés' },
  'profile.payment.none': { en: 'No payment methods saved yet.', fr: 'Aucun moyen de paiement enregistré.' },
  'profile.upgrade': { en: 'Become a Producer', fr: 'Devenir Producteur' },
  'profile.upgradeDesc': { en: 'Upgrade your account to start selling your own products.', fr: 'Passez votre compte en mode producteur pour commencer à vendre.' },
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
  'portfolio.categoryTip': { en: 'This portfolio will appear on all offers with this category.', fr: 'Ce portfolio apparaîtra sur toutes les offres de cette catégorie.' },
  'portfolio.deleteConfirmTitle': { en: 'Delete this portfolio item?', fr: 'Supprimer cet élément du portfolio ?' },
  'portfolio.deleteConfirmBody': { en: 'This cannot be undone. You will remove this entry from your profile.', fr: 'Cette action est irréversible. Cette entrée sera retirée de votre profil.' },

  // New Profile Fields
  'profile.type': { en: 'Producer Type', fr: 'Type de Producteur' },
  'profile.business': { en: 'Business', fr: 'Entreprise' },
  'profile.individual': { en: 'Individual', fr: 'Individuel' },
  'profile.firstName': { en: 'First Name', fr: 'Prénom' },
  'profile.lastName': { en: 'Last Name', fr: 'Nom' },
  'profile.gender': { en: 'Gender', fr: 'Genre' },
  'profile.dob': { en: 'Date of Birth', fr: 'Date de Naissance' },
  'profile.region': { en: 'Region', fr: 'Région' },
  'profile.city': { en: 'City', fr: 'Ville' },
  'profile.uploadPhoto': { en: 'Update Profile Picture', fr: 'Mettre à jour la photo' },
  'profile.uploadDocs': { en: 'Upload Certificates (Max 10MB)', fr: 'Télécharger Certificats (Max 10MB)' },

  // Chat
  'chat.proposal': { en: 'Formal Proposal', fr: 'Proposition Formelle' },
  'chat.proposed': { en: 'Proposed', fr: 'Proposé' },
  'chat.makeProposal': { en: 'Make a Proposal', fr: 'Faire une Proposition' },
  'chat.pricePerUnit': { en: 'Price per Unit', fr: 'Prix par Unité' },
  'chat.total': { en: 'Total', fr: 'Total' },
  'chat.accept': { en: 'Accept', fr: 'Accepter' },
  'chat.reject': { en: 'Reject', fr: 'Rejeter' },
  'chat.counter': { en: 'Counter', fr: 'Contre-proposition' },
  'chat.status.PENDING': { en: 'Pending', fr: 'En Attente' },
  'chat.status.ACCEPTED': { en: 'Accepted', fr: 'Accepté' },
  'chat.status.REJECTED': { en: 'Rejected', fr: 'Rejeté' },
  'chat.status.COUNTERED': { en: 'Countered', fr: 'Contré' },
  'chat.typeMessage': { en: 'Type a message...', fr: 'Tapez un message...' },
  'chat.composeHint': { en: 'Enter to send · Shift+Enter for new line', fr: 'Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne' },
  'chat.noChats': { en: 'No active conversations.', fr: 'Aucune conversation active.' },
  'chat.select': { en: 'Select a conversation', fr: 'Sélectionnez une conversation' },

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
  'review.submit': { en: 'Submit Review', fr: 'Envoyer' },
  'review.rated': { en: 'Rated', fr: 'Noté' },
  'review.received': { en: 'Received Reviews', fr: 'Avis Reçus' },
  'review.ratedBy': { en: 'Rated by', fr: 'Noté par' },
  'review.noReviews': { en: 'No reviews received yet.', fr: 'Aucun avis reçu pour le moment.' },

  // Compare
  'compare.bar.title': { en: 'Compare Products', fr: 'Comparer Produits' },
  'compare.bar.desc': { en: 'Select up to 3 items', fr: 'Sélectionnez jusqu\'à 3 articles' },
  'compare.btn': { en: 'Compare Now', fr: 'Comparer Maintenant' },
  'compare.clear': { en: 'Clear All', fr: 'Tout Effacer' },
  'compare.page.title': { en: 'Product Comparison', fr: 'Comparaison de Produits' },
  'compare.empty': { en: 'No products selected for comparison.', fr: 'Aucun produit sélectionné.' },
  'compare.attribute': { en: 'Attribute', fr: 'Attribut' },
  'compare.price': { en: 'Price', fr: 'Prix' },
  'compare.unit': { en: 'Unit', fr: 'Unité' },
  'compare.minOrder': { en: 'Min Order', fr: 'Commande Min' },
  'compare.category': { en: 'Category', fr: 'Catégorie' },
  'compare.delivery': { en: 'Delivery', fr: 'Livraison' },
  'compare.rating': { en: 'Rating', fr: 'Note' },
  'compare.producer': { en: 'Producer', fr: 'Producteur' },
  'compare.select': { en: 'Select to Compare', fr: 'Sélectionner pour comparer' },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) {
        // Simple fallback if key looks like 'category.Value'
        if (key.startsWith('category.')) return key.split('.')[1];
        return key;
    }
    return entry[language];
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
