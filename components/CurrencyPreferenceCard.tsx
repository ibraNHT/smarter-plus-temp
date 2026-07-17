import React, { useState } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { BASE_CURRENCY } from '../utils/formatMoney';
import { useTranslation } from '../services/i18nContext';

/**
 * Preferred display-currency control for profile Payment tabs.
 * Wallet / settlement remain XAF; this only affects marketplace price formatting.
 */
export const CurrencyPreferenceCard: React.FC = () => {
  const { currency, supported, setCurrency, currencyLabel } = useCurrency();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const onChange = async (code: string) => {
    setSaving(true);
    setSavedNote(null);
    try {
      await setCurrency(code);
      setSavedNote(t('currency.updated'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
      <h4 className="text-sm font-semibold text-gray-900">{t('currency.displayTitle')}</h4>
      <p className="text-xs text-gray-500 leading-relaxed">
        {t('currency.description', { currency: currencyLabel(BASE_CURRENCY) })}
      </p>
      <label className="block">
        <span className="sr-only">{t('currency.preferredLabel')}</span>
        <select
          value={currency}
          disabled={saving}
          onChange={(e) => { void onChange(e.target.value); }}
          className="mt-1 block w-full max-w-xs border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-60"
          aria-label={t('currency.preferredLabel')}
        >
          {supported.map((code) => (
            <option key={code} value={code}>
              {currencyLabel(code)}
            </option>
          ))}
        </select>
      </label>
      {savedNote && <p className="text-xs text-green-700">{savedNote}</p>}
    </div>
  );
};
