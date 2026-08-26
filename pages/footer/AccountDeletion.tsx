import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useTranslation } from '../../services/i18nContext';
import { SEO } from '../../components/SEO';
import { SEO_PAGE_META } from '../../services/seo/seoConfig';
import { buildWebPageSchema } from '../../services/seo/schemaBuilders';
import {
  LegalDocumentLayout,
  LegalList,
  LegalParagraph,
  LegalSection,
} from './legal/LegalDocumentLayout';
import { useLegalDocumentMeta } from './legal/useLegalDocumentMeta';
import { openExternalUrl } from '../../services/nativeBrowser';

const SUPPORT_MAIL = 'helpdesk@acheteici.com';

/** Play Console Data-safety “web resource” for account deletion (AgriMarket Connect). */
export const AccountDeletion: React.FC = () => {
  const { t, language } = useTranslation();
  const meta = useLegalDocumentMeta();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    const subject = encodeURIComponent('AgriMarket Connect — account deletion request');
    const body = encodeURIComponent(
      [
        'Please delete my AgriMarket Connect (Achète Tout Ici) account and associated personal data.',
        `Email on the account: ${trimmed}`,
        phone.trim() ? `Phone: ${phone.trim()}` : '',
        details.trim() ? `Details: ${details.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
    await openExternalUrl(`mailto:${SUPPORT_MAIL}?subject=${subject}&body=${body}`);
    setSent(true);
  };

  return (
    <>
      <SEO
        title={SEO_PAGE_META.accountDeletion.title}
        description={SEO_PAGE_META.accountDeletion.description}
        url="/account-deletion"
        locale={language}
        schema={buildWebPageSchema({
          name: t('accountDeletion.title'),
          description: SEO_PAGE_META.accountDeletion.description,
          path: '/account-deletion',
        })}
      />
      <LegalDocumentLayout
        icon={Trash2}
        iconClassName="text-red-600"
        title={t('accountDeletion.title')}
        subtitle={t('accountDeletion.subtitle')}
        meta={meta}
      >
        <LegalSection title={t('accountDeletion.inAppTitle')}>
          <LegalParagraph>{t('accountDeletion.inAppBody')}</LegalParagraph>
          <LegalList
            items={[
              t('accountDeletion.stepSignIn'),
              t('accountDeletion.stepProfile'),
              t('accountDeletion.stepSecurity'),
            ]}
          />
          <p>
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              {t('nav.login')}
            </Link>
          </p>
        </LegalSection>
        <LegalSection title={t('accountDeletion.webTitle')}>
          <LegalParagraph>{t('accountDeletion.webBody')}</LegalParagraph>
          {sent ? (
            <p className="text-sm text-green-800 bg-green-50 border border-green-100 rounded-md p-3">
              {t('accountDeletion.sent')}
            </p>
          ) : (
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-3 max-w-lg">
              <div>
                <label htmlFor="del-email" className="block text-sm font-medium text-gray-700">
                  {t('accountDeletion.email')}
                </label>
                <input
                  id="del-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="del-phone" className="block text-sm font-medium text-gray-700">
                  {t('accountDeletion.phone')}
                </label>
                <input
                  id="del-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="del-details" className="block text-sm font-medium text-gray-700">
                  {t('accountDeletion.details')}
                </label>
                <textarea
                  id="del-details"
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
                />
              </div>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {t('accountDeletion.submit')}
              </button>
            </form>
          )}
          <LegalParagraph>
            {t('accountDeletion.retain')}{' '}
            <a href={`mailto:${SUPPORT_MAIL}`} className="text-primary-600 hover:underline">
              {SUPPORT_MAIL}
            </a>
          </LegalParagraph>
        </LegalSection>
      </LegalDocumentLayout>
    </>
  );
};
