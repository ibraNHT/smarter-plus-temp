import React from 'react';
import { useTranslation } from '../../../services/i18nContext';
import { PrivacyPolicyEn } from './PrivacyPolicyEn';
import { PrivacyPolicyFr } from './PrivacyPolicyFr';
import { useLegalDocumentMeta } from './useLegalDocumentMeta';
import { SEO } from '../../../components/SEO';
import { SEO_PAGE_META } from '../../../services/seo/seoConfig';
import { buildWebPageSchema } from '../../../services/seo/schemaBuilders';

export const PrivacyPolicy: React.FC = () => {
  const { language, t } = useTranslation();
  const meta = useLegalDocumentMeta();
  const title = t('privacy.title');

  const seo = (
    <SEO
      title={SEO_PAGE_META.privacy.title}
      description={SEO_PAGE_META.privacy.description}
      url="/privacy"
      locale={language}
      schema={buildWebPageSchema({
        name: title,
        description: SEO_PAGE_META.privacy.description,
        path: '/privacy',
      })}
    />
  );

  if (language === 'fr') {
    return (
      <>
        {seo}
        <PrivacyPolicyFr title={title} meta={meta} />
      </>
    );
  }

  return (
    <>
      {seo}
      <PrivacyPolicyEn title={title} meta={meta} />
    </>
  );
};
