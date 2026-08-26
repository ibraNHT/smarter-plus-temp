import React, { useEffect, useState } from 'react';
import { X, FileText } from 'lucide-react';
import { useTranslation } from '../services/i18nContext';

/**
 * Thumbnails for files staged on a dispute/evidence form.
 *
 * The pickers accept up to 3 files but showed only the native "No file chosen"
 * label, so there was no way to tell what had actually attached — which mattered
 * more once the pickers started APPENDING across dialogs. Images preview via an
 * object URL (revoked on unmount so we don't leak), PDFs show an icon + name.
 */
export const EvidenceFilePreviews: React.FC<{
  files: File[];
  onRemove?: (index: number) => void;
}> = ({ files, onRemove }) => {
  const { t } = useTranslation();
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const next = files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : ''));
    setUrls(next);
    return () => next.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);

  if (files.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-gray-600 mb-1">
        {t('order.filesAttached', { count: files.length })}
      </p>
      <div className="flex flex-wrap gap-2">
        {files.map((file, i) => (
          <div
            key={`${file.name}-${file.size}-${file.lastModified}`}
            className="relative w-20 h-20 rounded-md border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center"
            title={file.name}
          >
            {urls[i] ? (
              <img src={urls[i]} alt={file.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center px-1 text-center">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="mt-1 text-[9px] leading-tight text-gray-500 line-clamp-2 break-all">
                  {file.name}
                </span>
              </div>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={t('order.removeFile')}
                className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
