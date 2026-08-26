import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from './ConfirmModal';
import { useStore } from '../services/storeContext';
import { useTranslation } from '../services/i18nContext';
import { apiFetch } from '../services/apiService';
import { API_ENDPOINTS } from '../client-api/endpoints';
import { showAppToast } from '../services/appToast';

export const DeleteAccountSection: React.FC = () => {
  const { t } = useTranslation();
  const { logout } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const onConfirm = useCallback(async () => {
    setBusy(true);
    try {
      await apiFetch(API_ENDPOINTS.auth.deleteAccount, { method: 'DELETE' });
      await logout();
      showAppToast(t('profile.deleteAccountSuccess'), 'SUCCESS');
      setOpen(false);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t('profile.deleteAccountFailed');
      showAppToast(message, 'ERROR');
    } finally {
      setBusy(false);
    }
  }, [logout, navigate, t]);

  return (
    <div className="mt-8 pt-6 border-t border-red-100">
      <h4 className="text-sm font-semibold text-red-800">{t('profile.deleteAccount')}</h4>
      <p className="mt-1 text-sm text-gray-600">{t('profile.deleteAccountBody')}</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 w-full sm:w-auto"
      >
        {t('profile.deleteAccount')}
      </button>
      <ConfirmModal
        open={open}
        onClose={() => { if (!busy) setOpen(false); }}
        onConfirm={onConfirm}
        busy={busy}
        tone="danger"
        title={t('profile.deleteAccountTitle')}
        description={t('profile.deleteAccountConfirm')}
        confirmLabel={t('profile.deleteAccount')}
      />
    </div>
  );
};
