import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { Spinner } from './Loaders';
import { Modal } from './Modal';
import { useTranslation } from '../services/i18nContext';

export type ConfirmTone = 'danger' | 'warning' | 'info';

export interface ConfirmModalProps {
  open: boolean;
  /** Heading shown at the top of the modal. */
  title: string;
  /** Body / description text — can be a string or a node. */
  description?: React.ReactNode;
  /** Confirm button label. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Cancel button label. Defaults to translated "Cancel". */
  cancelLabel?: string;
  /** Visual tone — controls icon and confirm button colours. */
  tone?: ConfirmTone;
  /** True while the confirm action is in flight — disables buttons + shows spinner. */
  busy?: boolean;
  /** Optional extra content rendered above the action buttons (e.g. an input field). */
  children?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

const toneStyles: Record<ConfirmTone, { btn: string; iconWrap: string; iconColor: string; Icon: React.ComponentType<{ className?: string }> }> = {
  danger: {
    btn: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
    iconWrap: 'bg-red-100',
    iconColor: 'text-red-600',
    Icon: Trash2,
  },
  warning: {
    btn: 'bg-yellow-600 hover:bg-yellow-700 focus-visible:ring-yellow-500',
    iconWrap: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    Icon: AlertTriangle,
  },
  info: {
    btn: 'bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500',
    iconWrap: 'bg-primary-100',
    iconColor: 'text-primary-600',
    Icon: Info,
  },
};

/**
 * Reusable confirmation modal. Used for destructive or otherwise consequential
 * actions (delete, cancel order, logout).
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  busy = false,
  children,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();
  const [internalBusy, setInternalBusy] = useState(false);
  const isBusy = busy || internalBusy;
  const styles = toneStyles[tone];

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, isBusy, onClose]);

  const handleConfirm = async () => {
    if (isBusy) return;
    try {
      setInternalBusy(true);
      await onConfirm();
    } finally {
      setInternalBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={isBusy ? undefined : onClose}
      closeOnBackdrop={!isBusy}
      maxWidth="md"
      zIndex={100}
      ariaLabelledBy="confirm-modal-title"
      panelClassName="p-5 sm:p-6"
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full ${styles.iconWrap}`}>
          <styles.Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${styles.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 id="confirm-modal-title" className="text-base sm:text-lg font-semibold text-gray-900 break-words">
            {title}
          </h3>
          {description && (
            <div className="mt-1.5 text-sm text-gray-600 break-words">{description}</div>
          )}
        </div>
      </div>

      {children && <div className="mt-4">{children}</div>}

      <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="inline-flex justify-center items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
        >
          {cancelLabel ?? t('form.cancel')}
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={isBusy}
          className={`inline-flex justify-center items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.btn}`}
        >
          {isBusy && <Spinner size={14} className="text-white" />}
          <span>{confirmLabel ?? t('form.confirm') ?? 'Confirm'}</span>
        </button>
      </div>
    </Modal>
  );
};
