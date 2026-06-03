import React from 'react';
import { useTranslation } from '../../../services/i18nContext';
import { PrivacyPolicyEn } from './PrivacyPolicyEn';
import { PrivacyPolicyFr } from './PrivacyPolicyFr';
import { useLegalDocumentMeta } from './useLegalDocumentMeta';

export const PrivacyPolicy: React.FC = () => {
  const { language, t } = useTranslation();
  const meta = useLegalDocumentMeta();
  const title = t('privacy.title');

  if (language === 'fr') {
    return <PrivacyPolicyFr title={title} meta={meta} />;
  }

  return <PrivacyPolicyEn title={title} meta={meta} />;
};
