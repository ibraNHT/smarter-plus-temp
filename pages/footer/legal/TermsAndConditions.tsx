import React from 'react';
import { useTranslation } from '../../../services/i18nContext';
import { TermsAndConditionsEn } from './TermsAndConditionsEn';
import { TermsAndConditionsFr } from './TermsAndConditionsFr';
import { useLegalDocumentMeta } from './useLegalDocumentMeta';
import { SEO } from '../../../components/SEO';
import { SEO_PAGE_META } from '../../../services/seo/seoConfig';
import { buildWebPageSchema } from '../../../services/seo/schemaBuilders';

export const TermsAndConditions: React.FC = () => {
  const { language, t } = useTranslation();
  const meta = useLegalDocumentMeta();
  const title = t('terms.title');

  const seo = (
    <SEO
      title={SEO_PAGE_META.terms.title}
      description={SEO_PAGE_META.terms.description}
      url="/terms"
      locale={language}
      schema={buildWebPageSchema({
        name: title,
        description: SEO_PAGE_META.terms.description,
        path: '/terms',
      })}
    />
  );

  if (language === 'fr') {
    return (
      <>
        {seo}
        <TermsAndConditionsFr title={title} meta={meta} />
      </>
    );
  }

  return (
    <>
      {seo}
      <TermsAndConditionsEn title={title} meta={meta} />
    </>
  );
};
