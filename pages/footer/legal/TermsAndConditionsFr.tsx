import React from 'react';
import { FileText } from 'lucide-react';
import {
  LegalDocumentLayout,
  LegalList,
  LegalParagraph,
  LegalSection,
  LegalSubSection,
  type LegalDocumentMeta,
} from './LegalDocumentLayout';

const SUPPORT_EMAIL = (
  <a href="mailto:helpdesk@aheteici.com" className="text-primary-600 hover:underline">
    helpdesk@aheteici.com
  </a>
);

type Props = {
  title: string;
  meta: LegalDocumentMeta;
};

export const TermsAndConditionsFr: React.FC<Props> = ({ title, meta }) => (
  <LegalDocumentLayout
    icon={FileText}
    title={title}
    meta={meta}
    subtitle="Les présentes Conditions Générales (les « Conditions ») régissent l'accès et l'utilisation de la plateforme et des services Agrimarket Connect (la « Plateforme »). Veuillez les lire attentivement."
  >
      <LegalSection title="1. Parties et Exploitant">
        <LegalParagraph>La Plateforme est exploitée par :</LegalParagraph>
        <LegalList
          items={[
            <>Entité juridique : Achète Tout Ici Sarl</>,
            <>Adresse professionnelle : Dogbong, Douala, Littoral, Cameroun</>,
            <>Email support : {SUPPORT_EMAIL}</>,
            <>Nom commercial / marque : Agrimarket Connect</>,
          ]}
        />
        <LegalParagraph>
          Dans les présentes Conditions, Achète Tout Ici Sarl est désigné par « Achète Tout Ici », « nous », « notre »
          ou « nos ».
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="2. Champ d'Application">
        <LegalParagraph>Les présentes Conditions s'appliquent à :</LegalParagraph>
        <LegalList
          items={[
            <>
              la Marketplace Producteurs (où les Producteurs publient des produits/services et les Clients passent des
              commandes),
            </>,
            <>la Boutique Retail (offres retail ATI vendues via la Plateforme), et</>,
            <>
              les fonctionnalités associées telles que les comptes utilisateurs, portefeuilles, coupons/promotions,
              parrainage, chat, support, litiges, notifications et modération administrative.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Acceptation">
        <LegalParagraph>
          En accédant à la Plateforme ou en l'utilisant, vous acceptez d'être lié par les présentes Conditions. Si vous
          n'acceptez pas ces Conditions, n'utilisez pas la Plateforme.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="4. Définitions">
        <LegalParagraph>Aux fins des présentes Conditions :</LegalParagraph>
        <LegalList
          items={[
            <>« Compte » désigne votre compte utilisateur sur la Plateforme.</>,
            <>« Client » désigne un utilisateur achetant des produits/services.</>,
            <>« Producteur » désigne un utilisateur proposant des produits/services.</>,
            <>« Boutique Retail » désigne les offres retail ATI disponibles via la Plateforme.</>,
            <>« Offre » désigne une annonce de produit ou de service sur la Plateforme.</>,
            <>« Commande » désigne une transaction d'achat initiée via la Plateforme.</>,
            <>« Portefeuille » désigne le registre de solde de la Plateforme associé à un utilisateur.</>,
            <>« Coupon » désigne un code promotionnel ou une remise émis par la Plateforme.</>,
            <>« Programme de Parrainage » désigne un programme de récompenses pour inviter de nouveaux utilisateurs.</>,
            <>« Session de Support » désigne un fil de conversation de support sur la Plateforme.</>,
            <>« Assistant IA » désigne les réponses de support automatisées générées par un système d'intelligence artificielle.</>,
            <>« Litige » désigne une réclamation ou un désaccord relatif à une Commande.</>,
            <>
              « Contenu » désigne les textes, images, fichiers, avis, messages, preuves, annonces et autres informations
              soumis à ou générés sur la Plateforme.
            </>,
            <>
              « Moyen de Paiement » désigne un moyen de retrait enregistré par un Producteur (tel que mobile money ou
              coordonnées bancaires), lorsque cette fonctionnalité est prise en charge.
            </>,
          ]}
        />
        <LegalParagraph>
          Si un terme n'est pas défini dans les présentes Conditions, il conserve sa signification ordinaire.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="5. Éligibilité et Comptes">
        <LegalSubSection title="5.1 Éligibilité">
          <LegalParagraph>Vous ne pouvez utiliser la Plateforme que si vous :</LegalParagraph>
          <LegalList
            items={[
              <>avez au moins 18 ans (ou l'âge de la majorité selon la loi applicable) ;</>,
              <>avez la capacité juridique de conclure un accord contraignant ;</>,
              <>n'êtes pas interdit d'utiliser la Plateforme en vertu de la loi applicable ; et</>,
              <>fournissez des informations exactes et complètes.</>,
            ]}
          />
          <LegalParagraph>
            Si vous utilisez la Plateforme au nom d'une entreprise ou d'une autre entité, vous déclarez disposer du
            pouvoir d'engager cette entité au titre des présentes Conditions.
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="5.2 Inscription et Sécurité du Compte">
          <LegalParagraph>
            Pour accéder à certaines fonctionnalités, vous devez créer un Compte. Lors de la création d'un Compte, vous
            acceptez que :
          </LegalParagraph>
          <LegalList
            items={[
              <>
                <strong>Unicité :</strong> chaque Compte doit être créé avec une adresse email et un numéro de téléphone
                uniques lorsque la Plateforme l'exige.
              </>,
              <>
                <strong>Exactitude :</strong> vous fournirez des informations exactes et les maintiendrez à jour.
              </>,
              <>
                <strong>Sécurité :</strong> vous conserverez vos identifiants de connexion confidentiels et sécurisés et
                nous informerez rapidement en cas de suspicion d'accès non autorisé.
              </>,
              <>
                <strong>Responsabilité :</strong> vous êtes responsable de toute activité effectuée sous votre Compte.
              </>,
            ]}
          />
          <LegalParagraph>
            Nous pouvons exiger des étapes de vérification (y compris des mots de passe à usage unique (OTP)) pour les
            actions sensibles liées à la sécurité.
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="5.3 Rôles et Profils">
          <LegalParagraph>La Plateforme prend en charge différents rôles et profils utilisateurs, notamment :</LegalParagraph>
          <LegalList items={[<>les Clients qui passent des Commandes ; et</>, <>les Producteurs qui créent des Offres et exécutent des Commandes.</>]} />
          <LegalParagraph>
            Certaines actions exigent que vous complétiez un profil correspondant (par exemple, un profil Producteur pour
            publier des Offres ; un profil Client pour passer des Commandes). Si les informations de profil requises sont
            manquantes ou incomplètes, vous pourriez ne pas pouvoir utiliser certaines fonctionnalités. Tous les
            utilisateurs de la Plateforme sont des clients par défaut, ce qui signifie que même les producteurs approuvés
            peuvent acheter auprès d'autres producteurs et dans la boutique retail.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Validation des Producteurs.</strong> Les Producteurs peuvent faire l'objet d'un examen interne et
            disposer de statuts tels que en attente, validé/approuvé ou suspendu. La Plateforme peut restreindre l'accès
            aux fonctionnalités de publication ou d'exécution de commandes si un Producteur n'est pas validé ou est
            suspendu.
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="5.4 Suspension et Résiliation">
          <LegalParagraph>
            Nous pouvons suspendre, restreindre ou résilier votre accès à la Plateforme à tout moment si nous avons des
            motifs raisonnables de croire que :
          </LegalParagraph>
          <LegalList
            items={[
              <>vous avez violé les présentes Conditions ou la loi applicable ;</>,
              <>vous vous êtes livré à une fraude, un abus, du harcèlement ou à d'autres comportements préjudiciables ;</>,
              <>la sécurité de votre Compte est compromise ; ou</>,
              <>
                la poursuite de la fourniture de la Plateforme en votre faveur pourrait créer un risque pour la
                Plateforme, d'autres utilisateurs ou des tiers.
              </>,
            ]}
          />
          <LegalParagraph>
            Vous pouvez cesser d'utiliser la Plateforme à tout moment. La résiliation n'annule pas automatiquement les
            Commandes déjà en cours et ne vous libère pas des obligations contractées avant la résiliation. Les soldes de
            Portefeuille et les demandes de retrait en attente peuvent faire l'objet de vérifications et de contrôles de
            conformité.
          </LegalParagraph>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="6. Marketplace Producteurs : Annonces et Conduite">
        <LegalSubSection title="6.1 Obligations des Producteurs">
          <LegalParagraph>Si vous êtes Producteur, vous acceptez de :</LegalParagraph>
          <LegalList
            items={[
              <>
                créer des Offres exactes, complètes et non trompeuses (y compris description, unité, quantité, prix,
                disponibilité de livraison et localisation) ;
              </>,
              <>vous assurer d'avoir le droit de vendre les produits listés ou de fournir les services listés ;</>,
              <>
                respecter toutes les lois applicables (y compris la sécurité des produits, la protection des consommateurs
                et toute exigence de licence) ;
              </>,
              <>maintenir un stock/disponibilité suffisant conforme à vos Offres ; et</>,
              <>
                exécuter les Commandes de bonne foi, en temps utile et conformément au mode de livraison/retrait
                sélectionné.
              </>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="6.2 Annonces et Contenus Interdits">
          <LegalParagraph>
            Vous ne devez pas publier, proposer, transmettre ou mettre à disposition un Contenu qui :
          </LegalParagraph>
          <LegalList
            items={[
              <>est illicite, frauduleux, trompeur ou mensonger ;</>,
              <>porte atteinte à la propriété intellectuelle ou à d'autres droits de tiers ;</>,
              <>est dangereux, nuisible ou restreint par la loi sans les autorisations requises ;</>,
              <>contient du code malveillant ou tente d'interférer avec la Plateforme ; ou</>,
              <>viole la dignité, la vie privée ou la sécurité d'autrui (y compris le harcèlement ou les propos haineux).</>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="6.3 Modération de la Plateforme">
          <LegalParagraph>
            Nous pouvons examiner, modérer, désactiver ou supprimer des Offres ou d'autres Contenus et suspendre les
            fonctionnalités Producteur lorsque cela est nécessaire pour :
          </LegalParagraph>
          <LegalList
            items={[
              <>se conformer à la loi ou à des demandes légitimes ;</>,
              <>protéger les utilisateurs, la Plateforme ou des tiers ; ou</>,
              <>faire respecter les présentes Conditions et les politiques de la Plateforme.</>,
            ]}
          />
          <LegalParagraph>
            Nous ne sommes pas tenus de surveiller l'ensemble du Contenu, mais nous pouvons le faire.
          </LegalParagraph>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="7. Boutique Retail (Offres Retail ATI)">
        <LegalParagraph>
          La Boutique Retail donne accès aux offres désignées comme offres retail/ATI. Les achats en Boutique Retail
          peuvent différer des achats sur la Marketplace Producteurs en termes de tarification, de frais, d'éligibilité
          aux coupons et de règles d'exécution.
        </LegalParagraph>
        <LegalList
          items={[
            <>
              <strong>Éligibilité retail uniquement.</strong> Certaines offres ne sont disponibles que via la Boutique
              Retail.
            </>,
            <>
              <strong>Canaux de coupons.</strong> Les coupons peuvent être limités aux achats Boutique Retail, aux achats
              Marketplace Producteurs, ou aux deux.
            </>,
            <>
              <strong>Stock/disponibilité.</strong> Les offres retail sont soumises à disponibilité et peuvent être limitées
              par l'inventaire.
            </>,
          ]}
        />
        <LegalParagraph>
          Lorsque la Plateforme indique qu'un achat est une commande Boutique Retail, le vendeur peut être Achète Tout
          Ici (ou un opérateur retail désigné) plutôt qu'un Producteur indépendant. La Plateforme indiquera le vendeur
          lorsque requis.
        </LegalParagraph>
        <LegalParagraph>
          En cas de conflit entre les informations de paiement spécifiques à la Boutique Retail et les présentes
          Conditions, les présentes Conditions prévalent sauf indication contraire explicite.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="8. Commandes et Formation du Contrat">
        <LegalSubSection title="8.1 Processus de Commande">
          <LegalParagraph>
            <strong>Marketplace Producteurs.</strong> Sur la Marketplace Producteurs, le cycle de vie type est le suivant
            :
          </LegalParagraph>
          <LegalList
            items={[
              <>le Client passe une Commande sur la base de l'Offre d'un Producteur ;</>,
              <>le Producteur valide/accepte la Commande ;</>,
              <>le Client effectue le paiement lorsque la Plateforme l'exige ;</>,
              <>le Producteur prépare les biens/services ;</>,
              <>
                le Producteur marque la Commande pour livraison/transit (ou disponibilité au retrait lorsque cette option
                est prise en charge) ;
              </>,
              <>le Client confirme la réception/livraison et la Commande est terminée.</>,
            ]}
          />
          <LegalParagraph>
            <strong>Boutique Retail.</strong> Le paiement en Boutique Retail peut confirmer les commandes immédiatement
            après leur création réussie, sous réserve des règles de la Plateforme et de la disponibilité.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Formation du contrat.</strong> Lorsqu'un Client passe une Commande, il formule une offre d'achat. Le
            contrat entre le Client et le Producteur est formé lorsque la Commande est acceptée/validée (ou autrement
            confirmée par le flux de paiement de la Plateforme). Nous pouvons faciliter ce processus mais ne sommes pas
            partie au contrat entre le Client et le Producteur, sauf pour les commandes Boutique Retail où le vendeur
            peut être l'opérateur retail de la Plateforme.
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="8.2 Statuts de Commande (Opérationnels)">
          <LegalParagraph>
            Les transitions de statut de Commande sont des fonctionnalités opérationnelles reflétant l'avancement d'une
            Commande. Les statuts typiques peuvent inclure, sans s'y limiter : en attente de validation, confirmée en
            attente de paiement, payée/en préparation, en transit, livrée, terminée, annulée et en litige.
          </LegalParagraph>
          <LegalParagraph>
            Certains changements de statut peuvent être réservés à des parties spécifiques (par exemple, Producteur ou
            Client) et peuvent dépendre du statut actuel.
          </LegalParagraph>
          <LegalParagraph>
            Vous acceptez d'utiliser les outils de statut de manière honnête et rapide (par exemple, ne confirmer la
            réception que si vous avez effectivement reçu les biens ou le service).
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="8.3 Erreurs et Disponibilité">
          <LegalParagraph>
            Les Offres et Commandes peuvent être refusées, annulées ou ajustées si, par exemple :
          </LegalParagraph>
          <LegalList
            items={[
              <>l'inventaire est insuffisant ;</>,
              <>une Offre est suspendue ou supprimée ;</>,
              <>une fraude ou un usage abusif est suspecté ; ou</>,
              <>des erreurs techniques ou des problèmes d'affichage des prix surviennent.</>,
            ]}
          />
          <LegalParagraph>
            Nous pouvons corriger les erreurs et prendre des mesures raisonnables pour informer les utilisateurs concernés.
          </LegalParagraph>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="9. Tarification, Frais, Taxes">
        <LegalParagraph>
          Les prix sont affichés dans la devise prise en charge par la Plateforme et peuvent être soumis à :
        </LegalParagraph>
        <LegalList
          items={[
            <>des frais de service (le cas échéant) ;</>,
            <>des frais de livraison ou de retrait (le cas échéant) ; et</>,
            <>des taxes ou charges légalement exigées, le cas échéant.</>,
          ]}
        />
        <LegalParagraph>
          Vous êtes responsable de toute taxe applicable à vos transactions, sauf indication contraire explicite de la
          Plateforme.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="10. Coupons, Promotions et Parrainage">
        <LegalSubSection title="10.1 Coupons (Canal et Limites)">
          <LegalParagraph>
            Les coupons et promotions sont offerts à notre discrétion et peuvent être soumis à des critères d'éligibilité,
            des dates d'expiration, des montants minimums de commande et d'autres restrictions.
          </LegalParagraph>
          <LegalList
            items={[
              <>
                <strong>Portée par canal.</strong> Un coupon peut être limité aux achats Marketplace, aux achats Boutique
                Retail, ou aux deux, selon la détermination de la Plateforme au moment de la validation/utilisation.
              </>,
              <>
                <strong>Limites par utilisateur.</strong> Un coupon peut avoir une limite d'utilisation par utilisateur.
                Nous pouvons refuser l'utilisation si les limites sont dépassées ou si nous suspectons raisonnablement un
                abus.
              </>,
              <>
                <strong>Validation.</strong> L'éligibilité aux coupons et le calcul des remises peuvent être validés côté
                serveur au moment du paiement. Vous ne devez pas tenter de manipuler les totaux ou d'utiliser des coupons
                en dehors de leur canal ou de leurs limites autorisés.
              </>,
            ]}
          />
          <LegalParagraph>
            Les coupons n'ont aucune valeur monétaire et ne peuvent être échangés contre de l'espèce sauf si la loi
            l'exige.
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="10.2 Programme de Parrainage">
          <LegalParagraph>
            La Plateforme peut proposer un Programme de Parrainage. S'il est disponible, il peut inclure des codes de
            parrainage et des montants de récompense, susceptibles d'être soumis à :
          </LegalParagraph>
          <LegalList
            items={[
              <>des règles d'éligibilité,</>,
              <>des déclencheurs de première commande ou d'autre activité,</>,
              <>des plafonds budgétaires pour le programme,</>,
              <>des contrôles anti-fraude (y compris le rejet de parrainages suspects), et</>,
              <>des conditions spécifiques au programme (qui peuvent être fournies via un lien sur la Plateforme).</>,
            ]}
          />
          <LegalParagraph>
            Nous pouvons modifier, suspendre ou mettre fin à un Programme de Parrainage à tout moment.
          </LegalParagraph>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="11. Paiements, Portefeuilles et Retraits">
        <LegalSubSection title="11.1 Paiements">
          <LegalParagraph>
            Les paiements peuvent être traités via des prestataires tiers. Vous nous autorisez, ainsi que nos prestataires,
            à traiter les paiements en votre nom, y compris à initier des demandes de paiement, confirmer les statuts de
            paiement et gérer les notifications de paiement.
          </LegalParagraph>
          <LegalParagraph>
            Le traitement des paiements dépend de systèmes externes. Nous ne garantissons pas que les paiements seront
            effectués dans un délai précis.
          </LegalParagraph>
          <LegalParagraph>
            Vous acceptez de ne pas initier de rétrofacturations ou d'annulations de manière frauduleuse. En cas
            d'annulations, nous pouvons prendre des mesures appropriées, y compris la suspension de comptes, l'annulation
            de crédits ou le recouvrement lorsque la loi le permet.
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="11.2 Portefeuille">
          <LegalParagraph>
            La Plateforme peut maintenir un solde de Portefeuille pour les utilisateurs. Les soldes de Portefeuille
            reflètent les écritures du registre de la Plateforme et peuvent être mis à jour en fonction de transactions
            telles que les achats, crédits, récompenses de parrainage, ajustements et retraits.
          </LegalParagraph>
          <LegalParagraph>
            Les soldes de Portefeuille ne constituent pas des comptes bancaires et ne produisent pas d'intérêts sauf
            indication contraire explicite.
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="11.3 Retraits (Producteurs)">
          <LegalParagraph>Si vous êtes Producteur, vous pouvez demander des retraits sous réserve de :</LegalParagraph>
          <LegalList
            items={[
              <>montants minimums de retrait (10.000 FCFA) ;</>,
              <>
                disposer d'un Moyen de Paiement éligible enregistré sur la Plateforme (Orange, MTN, Bank) ;
              </>,
              <>solde de Portefeuille suffisant ; et</>,
              <>étapes de vérification de sécurité (y compris une vérification OTP) lorsque requis.</>,
            ]}
          />
          <LegalParagraph>
            Les demandes de retrait peuvent être examinées et approuvées ou rejetées par les administrateurs de la
            Plateforme. Nous pouvons demander des informations complémentaires à des fins de conformité ou de prévention de
            la fraude.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Vérification OTP.</strong> Pour des raisons de sécurité, les Producteurs peuvent être tenus de
            confirmer un mot de passe à usage unique (OTP) envoyé au numéro de téléphone enregistré avant certaines
            actions sensibles (y compris les retraits et certaines modifications de profil).
          </LegalParagraph>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="12. Livraison, Retrait et Réception">
        <LegalParagraph>
          La Plateforme peut prendre en charge des options de livraison et/ou de retrait, y compris la livraison à domicile
          et les points de retrait.
        </LegalParagraph>
        <LegalList
          items={[
            <>
              <strong>Points de retrait.</strong> Si vous choisissez le retrait, vous êtes responsable de vous rendre au
              point de retrait désigné et de suivre les instructions de retrait.
            </>,
            <>
              <strong>Informations de livraison.</strong> Vous êtes responsable de fournir des informations exactes de
              livraison ou de retrait.
            </>,
          ]}
        />
        <LegalParagraph>
          Le risque de perte et le transfert de responsabilité peuvent dépendre du type de transaction, du mode de
          livraison et de la loi applicable.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="13. Annulations, Retours, Remboursements">
        <LegalParagraph>
          Des annulations peuvent être autorisées dans certaines circonstances selon le statut de la Commande et les
          règles de la Plateforme. Si un mécanisme de retour ou de remboursement est proposé, il sera décrit sur la
          Plateforme ou dans une politique complémentaire.
        </LegalParagraph>
        <LegalParagraph>
          Si la Plateforme ne fournit pas de flux de remboursement automatisé pour un type de transaction donné, les
          remboursements (le cas échéant) peuvent être traités via le processus de litige et de règlement décrit ci-après,
          sous réserve de la loi applicable.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="14. Litiges et Preuves">
        <LegalParagraph>
          Si vous rencontrez un problème avec une Commande, vous pouvez initier un Litige via la Plateforme lorsque cette
          fonctionnalité est disponible. Il peut vous être demandé de fournir des détails et de téléverser des preuves à
          l'appui (telles que des photos ou des documents).
        </LegalParagraph>
        <LegalParagraph>
          Les preuves de litige peuvent n'être visibles que par les participants concernés (par exemple, les parties à la
          Commande) et les administrateurs de la Plateforme.
        </LegalParagraph>
        <LegalParagraph>
          Nous pouvons examiner les litiges, faciliter la communication et prendre des mesures administratives, mais nous
          ne garantissons pas un résultat particulier.
        </LegalParagraph>
        <LegalParagraph>
          Vous acceptez que les preuves que vous téléversez soient véridiques, exactes et licites, et qu'elles ne portent
          pas atteinte aux droits de tiers.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="15. Support, Assistant IA et Transfert vers des Agents">
        <LegalParagraph>
          La Plateforme peut fournir un support via des sessions de chat, y compris un Assistant IA. Vous reconnaissez et
          acceptez que :
        </LegalParagraph>
        <LegalList
          items={[
            <>les réponses de l'IA sont automatisées et peuvent être inexactes ou incomplètes ;</>,
            <>le support par IA ne constitue pas un conseil professionnel (juridique, médical, financier ou autre) ;</>,
            <>vous êtes responsable de vérifier les informations avant d'agir en conséquence ;</>,
            <>
              lorsque cette fonctionnalité est prise en charge, une session de support IA peut être transférée à un agent
              humain. Les agents de support peuvent avoir accès à l'historique de la conversation aux fins de fourniture du
              support ;
            </>,
            <>
              certains messages ou champs de support peuvent être internes aux administrateurs et non visibles par les
              utilisateurs finaux.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="16. Communications et Notifications">
        <LegalParagraph>
          Nous pouvons vous envoyer des communications et notifications liées à la sécurité du compte (par exemple, OTP),
          aux mises à jour de statut de commande, aux interactions de support et aux annonces de la plateforme.
        </LegalParagraph>
        <LegalParagraph>
          La délivrance des notifications dépend de services tiers et peut être fournie en meilleur effort. Vous êtes
          responsable de maintenir des coordonnées exactes.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="17. Contenu Généré par les Utilisateurs, Avis et Licence">
        <LegalParagraph>
          Vous pouvez soumettre du Contenu tel que des descriptions d'Offres, avis, notes, messages et preuves de litige.
          Vous conservez la propriété de votre Contenu, mais vous nous accordez une licence non exclusive, mondiale et
          exempte de redevances pour utiliser, héberger, stocker, reproduire et afficher votre Contenu selon les besoins
          pour exploiter, améliorer et promouvoir la Plateforme.
        </LegalParagraph>
        <LegalParagraph>
          Nous pouvons supprimer ou restreindre un Contenu qui viole les présentes Conditions ou la loi applicable.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="18. Conduite Interdite">
        <LegalParagraph>Vous ne devez pas :</LegalParagraph>
        <LegalList
          items={[
            <>utiliser la Plateforme pour la fraude, les escroqueries ou des activités illégales ;</>,
            <>harceler, menacer ou nuire à autrui ;</>,
            <>tenter de contourner les mesures de sécurité de la Plateforme ;</>,
            <>extraire ou collecter des données sans autorisation ; ou</>,
            <>perturber le fonctionnement de la Plateforme.</>,
          ]}
        />
        <LegalParagraph>
          <strong>Restrictions de chat.</strong> Pour protéger les utilisateurs, la Plateforme peut restreindre le partage
          de coordonnées personnelles (telles que numéros de téléphone et adresses email) ou de liens dans le chat. Toute
          tentative de contourner ces restrictions peut entraîner des mesures sur le compte.
        </LegalParagraph>
        <LegalParagraph>
          Vous acceptez de ne pas demander ou partager d'instructions de paiement hors plateforme via le chat de la
          Plateforme ou autrement utiliser la Plateforme pour faciliter des transactions en dehors de la Plateforme d'une
          manière qui contourne les protections, frais ou processus de litige de la Plateforme.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="19. Confidentialité et Données">
        <LegalParagraph>
          Nous traitons les données personnelles conformément à notre{' '}
          <a href="/privacy" className="text-primary-600 hover:underline">
            Politique de Confidentialité
          </a>
          . Nous pouvons conserver des données relatives à la sécurité des comptes, aux conversations de support, aux
          commandes et transactions, aux preuves de litige et aux journaux d'audit selon les besoins pour fournir la
          Plateforme, assurer la conformité, prévenir la fraude et tenir des registres.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="20. Propriété Intellectuelle">
        <LegalParagraph>
          La Plateforme et son contenu (à l'exclusion du Contenu soumis par les utilisateurs) nous appartiennent ou nous
          sont concédés sous licence et sont protégés par les lois sur la propriété intellectuelle. Vous ne pouvez pas
          utiliser nos marques ou notre image de marque sans autorisation.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="21. Exclusion de Garanties">
        <LegalParagraph>
          Dans la mesure maximale permise par la loi, la Plateforme est fournie « en l'état » et « selon disponibilité »
          sans garantie d'aucune sorte. Nous ne garantissons pas que la Plateforme sera ininterrompue, exempte d'erreurs,
          sécurisée ou dépourvue d'éléments nuisibles.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="22. Limitation de Responsabilité">
        <LegalParagraph>Dans la mesure maximale permise par la loi :</LegalParagraph>
        <LegalList
          items={[
            <>
              nous ne sommes pas responsables des dommages indirects, accessoires, consécutifs, spéciaux ou punitifs ;
            </>,
            <>
              notre responsabilité globale découlant de ou liée à la Plateforme ne dépassera pas les montants (le cas
              échéant) que vous nous avez versés au cours des trois (3) mois précédant l'événement à l'origine de la
              réclamation, sauf si une responsabilité plus élevée est exigée par la loi applicable ;
            </>,
            <>rien dans les présentes Conditions ne limite une responsabilité qui ne peut être exclue en vertu de la loi applicable.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="23. Indemnisation">
        <LegalParagraph>
          Vous acceptez d'indemniser et de dégager de toute responsabilité Achète Tout Ici Sarl ainsi que ses
          administrateurs, dirigeants, employés et mandataires à l'égard des réclamations, responsabilités, dommages et
          dépenses (y compris des honoraires d'avocat raisonnables) découlant de ou liés à :
        </LegalParagraph>
        <LegalList
          items={[
            <>votre utilisation de la Plateforme,</>,
            <>votre Contenu,</>,
            <>votre violation des présentes Conditions, ou</>,
            <>votre violation de toute loi ou de tout droit de tiers.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="24. Modifications de la Plateforme et des Conditions">
        <LegalParagraph>
          Nous pouvons modifier la Plateforme et les présentes Conditions de temps à autre. En cas de modifications
          substantielles, nous prendrons des mesures raisonnables pour vous en informer (par exemple, via la Plateforme ou
          par email). La poursuite de l'utilisation de la Plateforme après l'entrée en vigueur des modifications vaut
          acceptation des Conditions mises à jour.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="25. Force Majeure">
        <LegalParagraph>
          Nous ne sommes pas responsables des retards ou manquements d'exécution résultant d'événements échappant à notre
          contrôle raisonnable, y compris les catastrophes naturelles, les pannes de réseau, les grèves, les actions
          gouvernementales ou les perturbations affectant des prestataires tiers.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="26. Droit Applicable ; Règlement des Litiges (Interne → Arbitrage → Tribunaux)">
        <LegalSubSection title="26.1 Processus de Réclamation Interne">
          <LegalParagraph>
            Avant d'engager une procédure d'arbitrage ou judiciaire, vous acceptez de nous contacter d'abord pour tenter de
            résoudre le différend à l'amiable.
          </LegalParagraph>
          <LegalList
            items={[
              <>
                <strong>Comment nous contacter :</strong> par email à {SUPPORT_EMAIL}
              </>,
              <>
                <strong>Informations à inclure :</strong> l'identifiant de votre Compte, la référence de commande/session
                (le cas échéant), la description du problème et toute preuve à l'appui.
              </>,
            ]}
          />
          <LegalParagraph>
            Nous ferons des efforts raisonnables pour répondre dans un délai raisonnable.
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="26.2 Arbitrage">
          <LegalParagraph>
            Si le différend n'est pas résolu via le processus de réclamation interne, vous acceptez que les litiges
            découlant de ou liés aux présentes Conditions ou à la Plateforme soient soumis à un arbitrage exécutoire.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Détails de l'arbitrage (à finaliser) :</strong> le siège/lieu, l'institution administratrice (le cas
            échéant), les règles d'arbitrage, le nombre d'arbitres et la langue des procédures seront précisés dans un
            avis complémentaire ou une politique publiée par la Plateforme. À défaut de précision, les parties utiliseront
            un cadre d'arbitrage raisonnable conforme au droit camerounais.
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="26.3 Tribunaux pour l'Exécution">
          <LegalParagraph>
            Dans la mesure permise par la loi, les tribunaux du Cameroun sont compétents pour :
          </LegalParagraph>
          <LegalList
            items={[
              <>l'exécution d'une sentence arbitrale ; et</>,
              <>toute question non soumise à l'arbitrage en vertu de la loi applicable.</>,
            ]}
          />
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="27. Dispositions Diverses">
        <LegalSubSection title="27.1 Divisibilité">
          <LegalParagraph>
            Si une disposition des présentes Conditions est jugée invalide ou inapplicable, les autres dispositions
            demeurent pleinement en vigueur.
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="27.2 Cession">
          <LegalParagraph>
            Vous ne pouvez céder vos droits ou obligations au titre des présentes Conditions sans notre consentement écrit
            préalable. Nous pouvons céder nos droits et obligations dans le cadre d'une fusion, acquisition ou cession
            d'actifs.
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="27.3 Renonciation">
          <LegalParagraph>
            Le fait de ne pas faire respecter une disposition ne constitue pas une renonciation à cette disposition.
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="27.4 Intégralité de l'Accord">
          <LegalParagraph>
            Les présentes Conditions constituent l'intégralité de l'accord entre vous et nous concernant la Plateforme,
            sauf lorsqu'elles sont complétées par des politiques additionnelles publiées par la Plateforme (telles qu'une
            Politique de Confidentialité ou des conditions spécifiques à un programme).
          </LegalParagraph>
        </LegalSubSection>

        <LegalSubSection title="27.5 Contact">
          <LegalParagraph>
            Pour toute question relative aux présentes Conditions, contactez {SUPPORT_EMAIL}.
          </LegalParagraph>
        </LegalSubSection>
      </LegalSection>
    </LegalDocumentLayout>
);
