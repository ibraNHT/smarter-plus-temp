import React, { useState } from 'react';
import { useTranslation } from '../services/i18nContext';

export interface LogoutConfirmModalProps {
  open: boolean;
  onClose: () => void;
  /** Called when the user confirms; typically `await logout()` then navigate. */
  onConfirm: () => void | Promise<void>;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ open, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="fixed inset-0 bg-gray-900/50 transition-opacity"
        aria-label={t('pwa.dismiss')}
        disabled={busy}
        onClick={() => !busy && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="logout-confirm-title" className="text-lg font-semibold text-gray-900">
          {t('nav.logoutConfirmTitle')}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{t('nav.logoutConfirmBody')}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {t('form.cancel')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleConfirm()}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? '…' : t('nav.logout')}
          </button>
        </div>
      </div>
    </div>
  );
};
