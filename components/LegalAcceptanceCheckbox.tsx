import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../services/i18nContext';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
  /** Highlight for onboarding forms (more visible above the fold). */
  variant?: 'default' | 'prominent';
};

/**
 * Required acceptance of Terms & Conditions and Privacy Policy.
 * Used on registration and checkout before sensitive actions (OTP, place order).
 */
export const LegalAcceptanceCheckbox: React.FC<Props> = ({
  checked,
  onChange,
  id = 'legal-accept',
  className = '',
  variant = 'default',
}) => {
  const { t } = useTranslation();
  const boxClass =
    variant === 'prominent'
      ? 'rounded-lg border-2 border-primary-200 bg-primary-50/80 p-4'
      : '';

  return (
    <div className={`${boxClass} ${className}`.trim()}>
      <label htmlFor={id} className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          {t('legal.acceptPrefix')}{' '}
          <Link
            to="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {t('footer.link.terms')}
          </Link>{' '}
          {t('legal.acceptAnd')}{' '}
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {t('footer.link.privacy')}
          </Link>
          .
        </span>
      </label>
    </div>
  );
};
