import React from 'react';
import { Shield } from 'lucide-react';
import {
  LegalDocumentLayout,
  LegalList,
  LegalParagraph,
  LegalSection,
  LegalSubSection,
  type LegalDocumentMeta,
} from './LegalDocumentLayout';

const SUPPORT_EMAIL = (
  <a href="mailto:helpdesk@acheteici.com" className="text-primary-600 hover:underline">
    helpdesk@acheteici.com
  </a>
);

type Props = {
  title: string;
  meta: LegalDocumentMeta;
};

export const PrivacyPolicyFr: React.FC<Props> = ({ title, meta }) => (
  <LegalDocumentLayout
    icon={Shield}
    iconClassName="text-green-600"
    title={title}
    meta={meta}
    subtitle="La présente Politique de Confidentialité explique comment Achète Tout Ici Sarl (agissant sous le nom commercial Agrimarket Connect) collecte, utilise, stocke, partage et protège les données personnelles lorsque vous utilisez les services marketplace et boutique retail d'Agrimarket Connect."
  >
    <LegalSection title="1. Qui Nous Sommes">
      <LegalList
        items={[
          <>Entité juridique : Achète Tout Ici Sarl</>,
          <>Marque : Agrimarket Connect</>,
          <>Adresse : Dogbong, Douala, Littoral, Cameroun</>,
          <>Email support : {SUPPORT_EMAIL}</>,
        ]}
      />
      <LegalParagraph>
        Dans la présente Politique, « nous », « notre » et « nos » désignent Achète Tout Ici Sarl.
      </LegalParagraph>
    </LegalSection>

    <LegalSection title="2. Champ d'Application de cette Politique">
      <LegalParagraph>Cette Politique s'applique aux données personnelles traitées via :</LegalParagraph>
      <LegalList
        items={[
          <>les services marketplace d'Agrimarket Connect (transactions producteur-client),</>,
          <>les services boutique retail d'Agrimarket Connect,</>,
          <>les fonctionnalités de support client associées (y compris le support assisté par IA via Google Gemini sur nos serveurs),</>,
          <>les services de notification et de sécurité de compte,</>,
          <>les interfaces web connectées, les applications iOS et Android, et les interactions API utilisées pour fournir ces services.</>,
        ]}
      />
      <LegalParagraph>
        Cette Politique ne s'applique pas aux sites web ou services tiers que nous ne contrôlons pas, même lorsque
        des liens sont fournis sur la Plateforme. Les applications natives et le site partagent cette Politique. La
        ressource web Google Play pour la suppression de compte est{' '}
        <a href="/account-deletion" className="text-primary-600 hover:underline">
          acheteici.com/account-deletion
        </a>
        .
      </LegalParagraph>
    </LegalSection>

    <LegalSection title="3. Catégories de Données Personnelles que Nous Collectons">
      <LegalParagraph>
        Selon votre usage de la Plateforme, nous pouvons collecter les catégories de données suivantes.
      </LegalParagraph>

      <LegalSubSection title="3.1 Données de Compte et d'Identité">
        <LegalList
          items={[
            <>Nom complet / nom d'affichage</>,
            <>Adresse email</>,
            <>Numéro de téléphone</>,
            <>Rôle du compte (par exemple : client, producteur, admin)</>,
            <>Métadonnées de connexion et d'authentification</>,
          ]}
        />
      </LegalSubSection>

      <LegalSubSection title="3.2 Données de Profil">
        <LegalList
          items={[
            <>Informations de profil Client (telles que prénom/nom, genre, date de naissance)</>,
            <>
              Informations de profil Producteur (telles que type entreprise/particulier, description, certifications,
              types de production, disponibilité, statut du profil)
            </>,
            <>Image de profil et médias associés téléversés, le cas échéant</>,
          ]}
        />
      </LegalSubSection>

      <LegalSubSection title="3.2.1 Localisation et permissions de l'appareil">
        <LegalParagraph>
          Lorsque vous choisissez « utiliser ma position » à l'inscription ou dans le profil, nous collectons des
          coordonnées GPS approximatives ou précises pour préremplir votre adresse de livraison. Nous ne suivons pas
          votre position en arrière-plan. La caméra et la photothèque sont utilisées uniquement lorsque vous
          téléversez une photo de profil, une image d'annonce, une pièce d'identité ou une preuve de litige.
        </LegalParagraph>
      </LegalSubSection>

      <LegalSubSection title="3.3 Données de Commande et de Transaction">
        <LegalList
          items={[
            <>Détails des commandes (articles, quantités, prix, transitions de statut)</>,
            <>Détails/adresses de livraison ou retrait</>,
            <>Utilisation des coupons, éligibilité aux remises et événements de commande liés au parrainage</>,
            <>Références de statut de paiement et métadonnées de transaction</>,
          ]}
        />
      </LegalSubSection>

      <LegalSubSection title="3.4 Données de Portefeuille et de Retrait">
        <LegalList
          items={[
            <>Soldes de portefeuille et enregistrements des transactions portefeuille</>,
            <>Enregistrements des demandes de retrait (montant, statut, dates de demande)</>,
            <>Détails des moyens de paiement Producteur (par ex. prestataire, numéro/nom de compte)</>,
          ]}
        />
      </LegalSubSection>

      <LegalSubSection title="3.5 Données de Support, Litige et Communication">
        <LegalList
          items={[
            <>Messages de session de support (y compris interactions avec l'assistant IA Google Gemini et le support humain)</>,
            <>Identifiants de support invité lorsque le support invité est utilisé (par ex. email/nom invité)</>,
            <>Enregistrements de litige et preuves téléversées</>,
            <>Enregistrements de notifications (notifications in-app et déclenchées par événement)</>,
          ]}
        />
      </LegalSubSection>

      <LegalSubSection title="3.6 Données de Sécurité">
        <LegalList
          items={[
            <>Empreinte de mot de passe (et non le mot de passe en clair)</>,
            <>Jeton de réinitialisation de mot de passe et métadonnées d'expiration</>,
            <>Empreinte de jeton de rafraîchissement et métadonnées d'expiration</>,
            <>Enregistrements de demandes OTP et de vérification utilisés pour les actions sensibles</>,
            <>Signaux de limitation de débit et de prévention d'abus</>,
          ]}
        />
      </LegalSubSection>

      <LegalSubSection title="3.7 Données Techniques, d'Appareil et d'Usage">
        <LegalList
          items={[
            <>Adresse IP et métadonnées de requête</>,
            <>Caractéristiques navigateur/appareil, lorsque disponibles</>,
            <>Journaux API et diagnostics serveur</>,
            <>Métadonnées temporelles de session et d'évènement</>,
          ]}
        />
      </LegalSubSection>

      <LegalSubSection title="3.8 Données de Cookies et de Suivi">
        <LegalParagraph>
          Nous et nos composants de service pouvons utiliser des cookies et technologies similaires pour :
        </LegalParagraph>
        <LegalList
          items={[
            <>maintenir les sessions et l'état d'authentification,</>,
            <>sécuriser les opérations de compte,</>,
            <>mémoriser les préférences,</>,
            <>améliorer la performance et la fiabilité,</>,
            <>comprendre les tendances d'utilisation et la qualité du service.</>,
          ]}
        />
        <LegalParagraph>Voir la Section 8 pour les détails complets sur les cookies.</LegalParagraph>
      </LegalSubSection>
    </LegalSection>

    <LegalSection title="4. Comment Nous Collectons les Données Personnelles">
      <LegalParagraph>Nous collectons les données :</LegalParagraph>
      <LegalList
        items={[
          <>
            Directement auprès de vous (inscription, formulaires de profil, commandes, messages de support, litiges,
            téléversements).
          </>,
          <>
            Automatiquement via le fonctionnement technique de la Plateforme (journaux, métadonnées de session,
            événements de sécurité).
          </>,
          <>
            À partir des flux transactionnels (statut de paiement, transitions de commande, vérifications
            parrainage/coupon).
          </>,
          <>À partir de flux internes de modération et conformité (actions support/litige/admin).</>,
        ]}
      />
    </LegalSection>

    <LegalSection title="5. Pourquoi Nous Traitons les Données Personnelles (Finalités)">
      <LegalParagraph>Nous traitons les données personnelles pour :</LegalParagraph>
      <LegalList
        items={[
          <>créer et gérer votre compte et profil,</>,
          <>authentifier les utilisateurs et sécuriser l'accès,</>,
          <>traiter les commandes marketplace et retail,</>,
          <>prendre en charge les opérations de paiement, portefeuille et retrait,</>,
          <>valider promotions/coupons/parrainages et prévenir les abus,</>,
          <>fournir le support client (y compris support assisté par IA et transfert à un agent),</>,
          <>faire fonctionner les processus de résolution de litige et de gestion des preuves,</>,
          <>envoyer des notifications et communications de service,</>,
          <>surveiller, dépanner, auditer et améliorer la performance du système,</>,
          <>respecter les obligations légales et faire appliquer les conditions de la plateforme.</>,
        ]}
      />
    </LegalSection>

    <LegalSection title="6. Bases Légales du Traitement">
      <LegalParagraph>
        Lorsque la loi applicable l'exige, nous nous appuyons sur une ou plusieurs des bases légales suivantes :
      </LegalParagraph>
      <LegalList
        items={[
          <>
            <strong>Nécessité contractuelle :</strong> pour fournir les services que vous demandez (compte, commandes,
            support).
          </>,
          <>
            <strong>Intérêts légitimes :</strong> pour sécuriser et améliorer la Plateforme, prévenir la fraude et
            administrer les opérations.
          </>,
          <>
            <strong>Obligation légale :</strong> pour respecter les exigences légales, réglementaires, fiscales, des
            autorités ou des tribunaux.
          </>,
          <>
            <strong>Consentement :</strong> lorsque requis par la loi (par exemple, certaines communications
            facultatives ou certains suivis non essentiels).
          </>,
        ]}
      />
    </LegalSection>

    <LegalSection title="7. Partage et Divulgation des Données Personnelles">
      <LegalParagraph>Nous pouvons partager des données personnelles avec :</LegalParagraph>
      <LegalList
        items={[
          <>
            Prestataires/sous-traitants qui prennent en charge l'hébergement, l'infrastructure, la messagerie,
            l'analytique, les outils de support et opérations similaires.
          </>,
          <>Prestataires de paiement et services financiers utilisés dans les flux de transaction ou de règlement.</>,
          <>Conseils professionnels (juridiques, comptables, audit) lorsque nécessaire.</>,
          <>Autorités et régulateurs lorsque la divulgation est requise par la loi ou une procédure légale.</>,
          <>Repreneurs d'activité en cas de fusion, restructuration, acquisition ou transfert d'actifs.</>,
        ]}
      />
      <LegalParagraph>
        Nous ne vendons pas de données personnelles en tant que « courtier de données » lorsque la loi l'interdit.
      </LegalParagraph>
      <LegalParagraph>
        Les sous-traitants actuellement utilisés comprennent Cloudinary (médias), Google Maps / Places (recherche
        d'adresse), OpenStreetMap / Nominatim (cartes et géocodage inverse), Tranzak (rechargement du portefeuille
        pour des biens physiques), Google Gemini (support IA, après consentement dans l'application) et
        l'infrastructure Socket.IO pour les notifications et le chat. Le site web public
        peut charger une balise Google Ads. Les applications iOS et Android du store n'incluent pas cette balise
        publicitaire.
      </LegalParagraph>
    </LegalSection>

    <LegalSection title="8. Cookies et Technologies de Suivi">
      <LegalSubSection title="8.1 Types de Cookies/Traceurs que Nous Pouvons Utiliser">
        <LegalList
          items={[
            <>
              <strong>Cookies strictement nécessaires :</strong> requis pour les fonctionnalités essentielles de la
              plateforme (connexion/session/sécurité).
            </>,
            <>
              <strong>Cookies fonctionnels :</strong> mémorisent les paramètres et préférences d'expérience utilisateur.
            </>,
            <>
              <strong>Technologies de performance/analytique :</strong> nous aident à comprendre l'usage, la fiabilité
              et la qualité du service.
            </>,
            <>
              <strong>Jetons de sécurité/artefacts de stockage de session :</strong> utilisés pour protéger les flux
              authentifiés.
            </>,
          ]}
        />
      </LegalSubSection>

      <LegalSubSection title="8.2 Finalités">
        <LegalParagraph>Nous utilisons ces technologies pour :</LegalParagraph>
        <LegalList
          items={[
            <>maintenir la connexion des utilisateurs lorsque pertinent,</>,
            <>protéger contre les accès non autorisés,</>,
            <>maintenir la continuité et la performance du service,</>,
            <>diagnostiquer les problèmes techniques,</>,
            <>améliorer l'expérience produit.</>,
          ]}
        />
      </LegalSubSection>

      <LegalSubSection title="8.3 Durée de Conservation des Cookies">
        <LegalParagraph>La conservation des cookies/jetons varie selon la finalité :</LegalParagraph>
        <LegalList
          items={[
            <>les artefacts de session de courte durée peuvent expirer rapidement,</>,
            <>les jetons d'authentification/rafraîchissement peuvent persister pendant des périodes configurées,</>,
            <>les artefacts analytiques/performance peuvent persister plus longtemps selon la configuration.</>,
          ]}
        />
      </LegalSubSection>

      <LegalSubSection title="8.4 Vos Choix et Contrôles">
        <LegalParagraph>
          Vous pouvez gérer les cookies via les paramètres de votre navigateur/appareil et en supprimant les données
          stockées. Certaines fonctionnalités de la Plateforme peuvent ne pas fonctionner correctement si les cookies
          strictement nécessaires sont désactivés.
        </LegalParagraph>
        <LegalParagraph>
          Lorsque le consentement est requis par la loi pour le suivi non essentiel, nous le demanderons avant de
          l'activer.
        </LegalParagraph>
      </LegalSubSection>
    </LegalSection>

    <LegalSection title="9. Transferts Internationaux de Données">
      <LegalParagraph>
        Vos données peuvent être traitées dans des juridictions autres que la vôtre si des prestataires ou
        infrastructures sont situés à l'étranger. Le cas échéant, nous utilisons des garanties raisonnables et des
        contrôles contractuels conclus pour protéger les données personnelles lors des transferts transfrontaliers.
      </LegalParagraph>
    </LegalSection>

    <LegalSection title="10. Conservation des Données">
      <LegalParagraph>
        Nous conservons les données personnelles aussi longtemps que nécessaire pour fournir les services et atteindre
        les finalités décrites dans cette Politique, y compris les besoins juridiques, de sécurité, comptables et de
        résolution des litiges.
      </LegalParagraph>
      <LegalParagraph>Les durées de conservation varient selon la catégorie de données. À titre d'exemple :</LegalParagraph>
      <LegalList
        items={[
          <>enregistrements de compte et profil : tant que le compte est actif et selon les exigences post-clôture,</>,
          <>
            enregistrements commande/transaction/portefeuille : selon les besoins comptables, d'audit et de conformité,
          </>,
          <>
            enregistrements support/litige et preuves : pour la qualité de service, la défense juridique et
            l'historique opérationnel,
          </>,
          <>artefacts de sécurité (jetons/OTP/réinitialisation) : généralement de courte durée avec contrôle d'expiration.</>,
        ]}
      />
      <LegalParagraph>
        Lorsque possible, nous supprimons, anonymisons ou dé-identifions les données lorsqu'elles ne sont plus
        nécessaires.
      </LegalParagraph>
    </LegalSection>

    <LegalSection title="11. Sécurité des Données">
      <LegalParagraph>
        Nous mettons en œuvre des mesures techniques et organisationnelles conçues pour protéger les données
        personnelles, y compris des contrôles d'accès, des garde-fous d'authentification et de la surveillance de
        sécurité.
      </LegalParagraph>
      <LegalParagraph>
        Aucun système n'est totalement sécurisé. Vous devez également protéger vos identifiants et nous informer
        immédiatement en cas de suspicion d'utilisation non autorisée de votre compte.
      </LegalParagraph>
    </LegalSection>

    <LegalSection title="12. Vos Droits">
      <LegalParagraph>Sous réserve du droit applicable, vous pouvez disposer des droits suivants :</LegalParagraph>
      <LegalList
        items={[
          <>demander l'accès à vos données personnelles,</>,
          <>demander la correction de données inexactes,</>,
          <>demander la suppression de certaines données,</>,
          <>vous opposer à certains traitements ou en demander la limitation,</>,
          <>retirer votre consentement lorsque le traitement est fondé sur celui-ci,</>,
          <>demander la portabilité lorsque cela est légalement applicable.</>,
        ]}
      />
      <LegalParagraph>
        Pour exercer vos droits, contactez : {SUPPORT_EMAIL}. Si vous avez un compte, vous pouvez aussi le supprimer
        dans l'application via Profil → Sécurité → Supprimer le compte, ou demander la suppression sur le web à{' '}
        <a href="/account-deletion" className="text-primary-600 hover:underline">
          /account-deletion
        </a>
        . Nous pouvons demander une vérification avant de traiter
        les demandes.
      </LegalParagraph>
    </LegalSection>

    <LegalSection title="13. Vie Privée des Enfants">
      <LegalParagraph>
        La Plateforme n'est pas destinée aux enfants n'ayant pas l'âge requis par la loi applicable pour conclure des
        contrats contraignants. Nous ne collectons pas sciemment de données personnelles d'enfants en violation du droit
        applicable.
      </LegalParagraph>
      <LegalParagraph>
        Si vous estimez qu'un enfant a fourni des données personnelles de manière inappropriée, contactez-nous afin que
        nous puissions enquêter et prendre les mesures adéquates.
      </LegalParagraph>
    </LegalSection>

    <LegalSection title="14. Liens et Services Tiers">
      <LegalParagraph>
        La plateforme peut faire référence à des services ou liens tiers. Leurs pratiques de confidentialité sont régies
        par leurs propres politiques, et non par la présente Politique de Confidentialité. Nous recommandons de
        consulter ces politiques avant d'interagir avec ces services.
      </LegalParagraph>
    </LegalSection>

    <LegalSection title="15. Modifications de cette Politique de Confidentialité">
      <LegalParagraph>
        Nous pouvons mettre à jour cette Politique périodiquement. Si les changements sont substantiels, nous prendrons
        des mesures raisonnables pour informer les utilisateurs (par exemple via une notification sur la plateforme ou
        par email). La poursuite de l'utilisation de la Plateforme après la date d'effet des changements indique
        l'acceptation de la Politique mise à jour.
      </LegalParagraph>
    </LegalSection>

    <LegalSection title="16. Contact et Réclamations">
      <LegalParagraph>Pour toute question, demande ou réclamation relative à la confidentialité, contactez :</LegalParagraph>
      <LegalList
        items={[
          <>Email : {SUPPORT_EMAIL}</>,
          <>Adresse : Dogbong, Douala, Littoral, Cameroun</>,
        ]}
      />
      <LegalParagraph>
        Vous pouvez également adresser des réclamations aux autorités compétentes pertinentes lorsque le droit applicable
        le permet.
      </LegalParagraph>
    </LegalSection>
  </LegalDocumentLayout>
);
