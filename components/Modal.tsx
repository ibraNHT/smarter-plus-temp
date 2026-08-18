import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { useNativeBackHandler } from '../hooks/useNativeBackHandler';
import { useTranslation } from '../services/i18nContext';

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const maxWidthClasses: Record<ModalMaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  maxWidth?: ModalMaxWidth;
  zIndex?: number;
  closeOnBackdrop?: boolean;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  className?: string;
  panelClassName?: string;
  backdropClassName?: string;
}

/**
 * Centered viewport modal rendered in a portal. Locks body scroll and never
 * requires scrolling the page behind the overlay to see the dialog.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  maxWidth = 'md',
  zIndex = 80,
  closeOnBackdrop = true,
  ariaLabelledBy,
  ariaLabel,
  className = '',
  panelClassName = '',
  backdropClassName = 'bg-gray-900/50',
}) => {
  const { t } = useTranslation();
  useLockBodyScroll(open);

  const handleNativeBack = useCallback(() => {
    if (onClose) {
      onClose();
      return true;
    }
    return false;
  }, [onClose]);
  useNativeBackHandler(open && Boolean(onClose), handleNativeBack);

  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={`agm-modal-root ${className}`.trim()}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
    >
      {closeOnBackdrop && onClose && (
        <button
          type="button"
          aria-label={t('common.close')}
          className={`agm-modal-backdrop absolute inset-0 ${backdropClassName} agm-modal-backdrop-in`}
          onClick={onClose}
        />
      )}
      <div
        className={`agm-modal-panel agm-modal-panel-in bg-white rounded-2xl shadow-xl w-full ${maxWidthClasses[maxWidth]} ${panelClassName}`.trim()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};
