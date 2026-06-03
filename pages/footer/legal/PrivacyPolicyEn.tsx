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
  <a href="mailto:helpdesk@aheteici.com" className="text-primary-600 hover:underline">
    helpdesk@aheteici.com
  </a>
);

type Props = {
  title: string;
  meta: LegalDocumentMeta;
};

export const PrivacyPolicyEn: React.FC<Props> = ({ title, meta }) => (
    <LegalDocumentLayout
      icon={Shield}
      iconClassName="text-green-600"
      title={title}
      meta={meta}
      subtitle="This Privacy Policy explains how Achète Tout Ici Sarl (trading as Agrimarket Connect) collects, uses, stores, shares, and protects personal data when you use Agrimarket Connect marketplace and retail store services."
    >
      <LegalSection title="1. Who We Are">
        <LegalList
          items={[
            <>Legal entity: Achète Tout Ici Sarl</>,
            <>Brand: Agrimarket Connect</>,
            <>Address: Dogbong, Douala, Littoral, Cameroon</>,
            <>Support email: {SUPPORT_EMAIL}</>,
          ]}
        />
        <LegalParagraph>
          In this Policy, &ldquo;we,&rdquo; &ldquo;us,&rdquo; and &ldquo;our&rdquo; refer to Achète Tout Ici Sarl.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="2. Scope of this Policy">
        <LegalParagraph>This Policy applies to personal data processed through:</LegalParagraph>
        <LegalList
          items={[
            <>Agrimarket Connect marketplace services (producer-client transactions),</>,
            <>Agrimarket Connect retail store services,</>,
            <>related customer support features (including AI-assisted support),</>,
            <>notification and account security services,</>,
            <>connected web interfaces and API interactions used to provide those services.</>,
          ]}
        />
        <LegalParagraph>
          This Policy does not apply to third-party websites or services that we do not control, even where
          links are provided on the Platform.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="3. Categories of Personal Data We Collect">
        <LegalParagraph>
          Depending on how you use the Platform, we may collect the following categories of data.
        </LegalParagraph>

        <LegalSubSection title="3.1 Account and Identity Data">
          <LegalList
            items={[
              <>Full name / display name</>,
              <>Email address</>,
              <>Phone number</>,
              <>Account role (e.g., client, producer, admin)</>,
              <>Login and authentication metadata</>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="3.2 Profile Data">
          <LegalList
            items={[
              <>Client profile information (such as first/last name, gender, date of birth)</>,
              <>
                Producer profile information (such as business/individual type, description, certifications,
                production types, availability, profile status)
              </>,
              <>Profile image and related uploaded media, where provided</>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="3.3 Order and Transaction Data">
          <LegalList
            items={[
              <>Order details (items, quantities, prices, status transitions)</>,
              <>Delivery/pickup details and addresses</>,
              <>Coupon usage, discount eligibility, and referral-related order events</>,
              <>Payment status references and transaction metadata</>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="3.4 Wallet and Withdrawal Data">
          <LegalList
            items={[
              <>Wallet balances and wallet transaction records</>,
              <>Withdrawal request records (amount, status, request dates)</>,
              <>Producer payment method details (e.g., provider, account number/name)</>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="3.5 Support, Dispute, and Communication Data">
          <LegalList
            items={[
              <>Support session messages (including AI assistant and human support interactions)</>,
              <>Support guest identifiers where guest support is used (e.g., guest email/name)</>,
              <>Dispute records and dispute evidence uploads</>,
              <>Notification records (in-app and event-triggered notifications)</>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="3.6 Security Data">
          <LegalList
            items={[
              <>Password hash (not plain-text password)</>,
              <>Password reset token and expiry metadata</>,
              <>Refresh token hash and expiry metadata</>,
              <>OTP request and verification records used for security-sensitive actions</>,
              <>Rate-limit and anti-abuse signals</>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="3.7 Device, Technical, and Usage Data">
          <LegalList
            items={[
              <>IP address and request metadata</>,
              <>Browser/device characteristics where available</>,
              <>API logs and server diagnostics</>,
              <>Session and event timing metadata</>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="3.8 Cookie and Tracking Data">
          <LegalParagraph>We and our service components may use cookies and similar technologies to:</LegalParagraph>
          <LegalList
            items={[
              <>maintain sessions and authentication state,</>,
              <>secure account operations,</>,
              <>store preferences,</>,
              <>improve performance and reliability,</>,
              <>understand usage trends and service quality.</>,
            ]}
          />
          <LegalParagraph>See Section 8 for full cookie details.</LegalParagraph>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="4. How We Collect Personal Data">
        <LegalParagraph>We collect data:</LegalParagraph>
        <LegalList
          items={[
            <>
              Directly from you (registration, profile forms, orders, support messages, disputes, uploads).
            </>,
            <>Automatically through technical operation of the Platform (logs, session metadata, security events).</>,
            <>From transaction workflows (payment status, order transitions, referral/coupon checks).</>,
            <>From internal moderation and compliance workflows (support/dispute/admin actions).</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Why We Process Personal Data (Purposes)">
        <LegalParagraph>We process personal data to:</LegalParagraph>
        <LegalList
          items={[
            <>create and manage your account and profile,</>,
            <>authenticate users and secure access,</>,
            <>process marketplace and retail orders,</>,
            <>support payment, wallet, and withdrawal operations,</>,
            <>validate promotions/coupons/referrals and prevent abuse,</>,
            <>provide customer support (including AI-assisted support and agent handover),</>,
            <>operate dispute resolution and evidence workflows,</>,
            <>send notifications and service communications,</>,
            <>monitor, troubleshoot, audit, and improve system performance,</>,
            <>comply with legal obligations and enforce platform terms.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Legal Bases for Processing">
        <LegalParagraph>Where required by applicable law, we rely on one or more of the following legal bases:</LegalParagraph>
        <LegalList
          items={[
            <>
              <strong>Contractual necessity:</strong> to provide services you request (account, orders, support).
            </>,
            <>
              <strong>Legitimate interests:</strong> to secure and improve the Platform, prevent fraud, and administer
              operations.
            </>,
            <>
              <strong>Legal obligation:</strong> to comply with legal, regulatory, tax, law-enforcement, or court
              requirements.
            </>,
            <>
              <strong>Consent:</strong> where legally required (for example, certain optional communications or
              non-essential tracking).
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Sharing and Disclosure of Personal Data">
        <LegalParagraph>We may share personal data with:</LegalParagraph>
        <LegalList
          items={[
            <>
              Service providers/processors supporting hosting, infrastructure, messaging, analytics, support tooling,
              and similar operations.
            </>,
            <>Payment and financial service providers used in transaction or settlement workflows.</>,
            <>Professional advisers (legal, accounting, audit) where needed.</>,
            <>Authorities and regulators where disclosure is required by law or lawful process.</>,
            <>Business transferees in case of merger, restructuring, acquisition, or asset transfer.</>,
          ]}
        />
        <LegalParagraph>We do not sell personal data as &ldquo;data brokerage&rdquo; where prohibited by law.</LegalParagraph>
      </LegalSection>

      <LegalSection title="8. Cookies and Tracking Technologies">
        <LegalSubSection title="8.1 Types of Cookies/Tracking We May Use">
          <LegalList
            items={[
              <>
                <strong>Strictly necessary cookies:</strong> required for core platform functionality
                (login/session/security).
              </>,
              <>
                <strong>Functional cookies:</strong> remember settings and user experience preferences.
              </>,
              <>
                <strong>Performance/analytics technologies:</strong> help us understand usage, reliability, and service
                quality.
              </>,
              <>
                <strong>Security-related tokens/session storage artifacts:</strong> used to protect authenticated
                workflows.
              </>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="8.2 Purposes">
          <LegalParagraph>We use these technologies to:</LegalParagraph>
          <LegalList
            items={[
              <>keep users signed in where appropriate,</>,
              <>protect against unauthorized access,</>,
              <>maintain service continuity and performance,</>,
              <>diagnose technical issues,</>,
              <>improve product experience.</>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="8.3 Cookie Retention">
          <LegalParagraph>Cookie/token retention varies by purpose:</LegalParagraph>
          <LegalList
            items={[
              <>short-lived session artifacts may expire quickly,</>,
              <>authentication/refresh-related tokens may persist for configured periods,</>,
              <>analytics/performance artifacts may persist longer depending on configuration.</>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="8.4 Your Choices and Controls">
          <LegalParagraph>
            You can manage cookies through your browser/device settings and by clearing stored data. Some Platform
            features may not work correctly if strictly necessary cookies are disabled.
          </LegalParagraph>
          <LegalParagraph>
            Where consent is required by law for non-essential tracking, we will request consent before enabling it.
          </LegalParagraph>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="9. International Data Transfers">
        <LegalParagraph>
          Your data may be processed in jurisdictions other than your own if service providers or infrastructure are
          located abroad. Where applicable, we use reasonable safeguards and contractual controls designed to protect
          personal data during cross-border transfers.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="10. Data Retention">
        <LegalParagraph>
          We retain personal data for as long as needed to provide services and fulfill the purposes described in this
          Policy, including legal, security, accounting, and dispute-resolution needs.
        </LegalParagraph>
        <LegalParagraph>Retention periods vary by data category. By example:</LegalParagraph>
        <LegalList
          items={[
            <>account and profile records: while account is active and as required post-closure,</>,
            <>order/transaction/wallet records: as needed for accounting, audit, and compliance,</>,
            <>support/dispute records and evidence: for service quality, legal defense, and operational history,</>,
            <>security tokens/OTP/reset artifacts: generally short-lived with expiry controls.</>,
          ]}
        />
        <LegalParagraph>Where feasible, we delete, anonymize, or de-identify data when no longer needed.</LegalParagraph>
      </LegalSection>

      <LegalSection title="11. Data Security">
        <LegalParagraph>
          We implement technical and organizational measures designed to protect personal data, including access
          controls, authentication safeguards, and security monitoring.
        </LegalParagraph>
        <LegalParagraph>
          No system is completely secure. You should also protect your credentials and notify us immediately if you
          suspect unauthorized account use.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="12. Your Rights">
        <LegalParagraph>Subject to applicable law, you may have rights to:</LegalParagraph>
        <LegalList
          items={[
            <>request access to your personal data,</>,
            <>request correction of inaccurate data,</>,
            <>request deletion of certain data,</>,
            <>object to or restrict certain processing,</>,
            <>withdraw consent where processing is based on consent,</>,
            <>request portability where legally applicable.</>,
          ]}
        />
        <LegalParagraph>
          To exercise rights, contact: {SUPPORT_EMAIL}. We may request verification before acting on requests.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="13. Children&rsquo;s Privacy">
        <LegalParagraph>
          The Platform is not intended for children below the age required by applicable law to enter binding contracts.
          We do not knowingly collect personal data from children in violation of applicable law.
        </LegalParagraph>
        <LegalParagraph>
          If you believe a child has provided personal data improperly, contact us so we can investigate and take
          appropriate action.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="14. Third-Party Links and Services">
        <LegalParagraph>
          The Platform may reference third-party services or links. Their privacy practices are governed by their own
          policies, not this Privacy Policy. We recommend reviewing those policies before interacting with such services.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="15. Changes to this Privacy Policy">
        <LegalParagraph>
          We may update this Policy from time to time. If changes are material, we will take reasonable steps to notify
          users (for example, via platform notice or email). Continued use of the Platform after the effective date of
          changes indicates acceptance of the updated Policy.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="16. Contact and Complaints">
        <LegalParagraph>For privacy questions, requests, or complaints, contact:</LegalParagraph>
        <LegalList
          items={[
            <>Email: {SUPPORT_EMAIL}</>,
            <>Address: Dogbong, Douala, Littoral, Cameroon</>,
          ]}
        />
        <LegalParagraph>
          You may also raise complaints with relevant competent authorities where permitted by applicable law.
        </LegalParagraph>
      </LegalSection>
    </LegalDocumentLayout>
);
