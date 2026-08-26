import React from 'react';
import { AlertTriangle, FileText } from 'lucide-react';
import { useTranslation } from '../services/i18nContext';
import { DisputeEvidence, Order } from '../types';

/**
 * Read-only recap of an open dispute, shown to both sides of the order.
 *
 * Previously only the producer's order-detail modal rendered anything about a
 * dispute, and only as a bullet list of filenames — the buyer who *opened* the
 * dispute saw nothing beyond a red status pill, so neither party could tell what
 * the other had submitted. This groups the evidence by who filed it, shows the
 * note each party attached and renders image evidence as thumbnails, so both
 * sides see the same picture the admin sees.
 *
 * The panel keeps the existing red-callout styling used in the producer modal —
 * this is a clarity change, not a redesign.
 */
export const DisputeSummary: React.FC<{
  order: Order;
  /** Current user id, used to label a batch "You" instead of the other party. */
  viewerId?: string | null;
  /** Wording for the other party, e.g. "Client" on the producer side. */
  otherPartyLabel: string;
  className?: string;
}> = ({ order, viewerId, otherPartyLabel, className }) => {
  const { t } = useTranslation();
  const evidence = order.disputeEvidence ?? [];

  /**
   * Group by uploader so each party's submission reads as one statement with its
   * files, rather than an undifferentiated list where a rebuttal note repeats on
   * every row it was uploaded with.
   */
  const byUploader = evidence.reduce<Record<string, DisputeEvidence[]>>((acc, ev) => {
    const key = ev.uploaderId || 'unknown';
    (acc[key] ||= []).push(ev);
    return acc;
  }, {});

  return (
    <div className={`bg-red-50 p-3 rounded-md border border-red-200 ${className ?? ''}`}>
      <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center">
        <AlertTriangle className="h-4 w-4 mr-2" /> {t('dispute.active')}
      </h4>

      <p className="text-sm text-red-700 mb-2">
        <span className="font-semibold">{t('dispute.reasonLabel')}</span>{' '}
        {order.disputeReason || t('dispute.notAvailable')}
      </p>

      {evidence.length === 0 ? (
        <p className="text-xs text-red-600 italic">{t('dispute.noEvidenceYet')}</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(byUploader).map(([uploaderId, items]) => {
            const isViewer = !!viewerId && uploaderId === viewerId;
            // The note is stored per file in a batch; show it once for the party.
            const note = items.find((i) => i.note && i.note.trim())?.note?.trim();
            return (
              <div key={uploaderId}>
                <p className="text-xs font-bold text-red-800 mb-1">
                  {isViewer ? t('dispute.youSubmitted') : t('dispute.partySubmitted', { party: otherPartyLabel })}{' '}
                  ({items.length})
                </p>
                {note ? (
                  <p className="text-xs text-red-700 italic whitespace-pre-wrap mb-1">{note}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {items.map((ev) => (
                    <a
                      key={ev.id}
                      href={ev.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={ev.fileName}
                      className="block"
                    >
                      {ev.fileType === 'IMAGE' ? (
                        <img
                          src={ev.fileUrl}
                          alt={ev.fileName}
                          className="h-16 w-16 object-cover rounded border border-red-200 hover:opacity-80"
                        />
                      ) : (
                        <span className="h-16 w-16 flex flex-col items-center justify-center rounded border border-red-200 bg-white text-red-600 hover:bg-red-50">
                          <FileText className="h-5 w-5" />
                          <span className="text-[10px] px-1 truncate max-w-full">{ev.fileName}</span>
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-red-600 mt-2">{t('dispute.underReview')}</p>
    </div>
  );
};
