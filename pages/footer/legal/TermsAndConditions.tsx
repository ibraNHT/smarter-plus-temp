import React from 'react';
import { useTranslation } from '../../../services/i18nContext';
import { TermsAndConditionsEn } from './TermsAndConditionsEn';
import { TermsAndConditionsFr } from './TermsAndConditionsFr';
import { useLegalDocumentMeta } from './useLegalDocumentMeta';

export const TermsAndConditions: React.FC = () => {
  const { language, t } = useTranslation();
  const meta = useLegalDocumentMeta();
  const title = t('terms.title');

  if (language === 'fr') {
    return <TermsAndConditionsFr title={title} meta={meta} />;
  }

  return <TermsAndConditionsEn title={title} meta={meta} />;
};
