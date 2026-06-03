import { useTranslation } from '../../../services/i18nContext';
import {
  LEGAL_EFFECTIVE_DATE_EN,
  LEGAL_EFFECTIVE_DATE_FR,
  type LegalDocumentMeta,
} from './LegalDocumentLayout';

export function useLegalDocumentMeta(): LegalDocumentMeta {
  const { language, t } = useTranslation();

  return {
    effectiveDateLabel: t('legal.meta.effectiveDate'),
    lastUpdatedLabel: t('legal.meta.lastUpdated'),
    versionLabel: t('legal.meta.version'),
    effectiveDate: language === 'fr' ? LEGAL_EFFECTIVE_DATE_FR : LEGAL_EFFECTIVE_DATE_EN,
  };
}
