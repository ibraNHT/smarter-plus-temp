import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { useTranslation } from '../services/i18nContext';
import { ConfirmModal } from './ConfirmModal';
import { showAppToast } from '../services/appToast';
import {
  blockUserId,
  type ReportTargetType,
  submitContentReport,
} from '../services/contentModeration';

type Props = {
  targetType: ReportTargetType;
  targetId: string;
  /** When set, Block is offered after a successful report (hides the user locally). */
  blockUserIdValue?: string;
  compact?: boolean;
};

const REASON_KEYS = ['spam', 'harassment', 'scam', 'illegal', 'other'] as const;

export const ReportBlockControl: React.FC<Props> = ({
  targetType,
  targetId,
  blockUserIdValue,
  compact,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reasonKey, setReasonKey] = useState<(typeof REASON_KEYS)[number]>('spam');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [alsoBlock, setAlsoBlock] = useState(Boolean(blockUserIdValue));

  const onConfirm = async () => {
    setBusy(true);
    try {
      const reason = `${t(`report.reason.${reasonKey}`)}${notes.trim() ? ` — ${notes.trim()}` : ''}`;
      await submitContentReport({ targetType, targetId, reason });
      if (alsoBlock && blockUserIdValue) blockUserId(blockUserIdValue);
      showAppToast(t('report.success'), 'SUCCESS');
      setOpen(false);
      setNotes('');
    } catch {
      showAppToast(t('report.failed'), 'ERROR');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? 'inline-flex items-center p-1.5 rounded-full bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-700'
            : 'inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-700'
        }
        title={t('report.action')}
        aria-label={t('report.action')}
      >
        <Flag className="h-4 w-4" />
        {!compact && <span>{t('report.action')}</span>}
      </button>
      <ConfirmModal
        open={open}
        onClose={() => { if (!busy) setOpen(false); }}
        onConfirm={() => void onConfirm()}
        busy={busy}
        tone="danger"
        title={t('report.title')}
        description={t('report.body')}
        confirmLabel={t('report.submit')}
      >
        <div className="mt-3 space-y-3 text-left">
          <label className="block text-sm font-medium text-gray-700" htmlFor="report-reason">
            {t('report.reasonLabel')}
          </label>
          <select
            id="report-reason"
            value={reasonKey}
            onChange={(e) => setReasonKey(e.target.value as (typeof REASON_KEYS)[number])}
            className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
          >
            {REASON_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`report.reason.${key}`)}
              </option>
            ))}
          </select>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t('report.notes')}
            className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
          />
          {blockUserIdValue ? (
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 rounded"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
              />
              <span>{t('report.alsoBlock')}</span>
            </label>
          ) : null}
        </div>
      </ConfirmModal>
    </>
  );
};
