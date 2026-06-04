import React, { useRef, useState } from 'react';
import { FileText, Upload, X, Loader2, ExternalLink } from 'lucide-react';
import { useTranslation } from '../services/i18nContext';
import { uploadDocument } from '../services/uploadService';
import { documentFileLabel } from '../utils/producerDocuments';
import { showAppToast } from '../services/appToast';

function isImageDocUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes('res.cloudinary.com') && lower.includes('/image/upload/')) return true;
  return /\.(jpe?g|png|gif|webp)(\?|#|$)/i.test(lower);
}

function cloudinaryImageThumb(url: string): string {
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const after = url.slice(idx + marker.length);
  if (/^(v\d+\/|f_|c_|w_|h_)/.test(after)) return url;
  return `${url.slice(0, idx + marker.length)}w_120,h_80,c_fill,f_auto,q_auto/${after}`;
}

const ACCEPT = '.png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf';
const MAX_BYTES = 10 * 1024 * 1024;

type DocSlotProps = {
  label: string;
  hint: string;
  required?: boolean;
  url?: string;
  onUpload: (url: string) => void;
  onClear: () => void;
};

const DocSlot: React.FC<DocSlotProps> = ({
  label,
  hint,
  required,
  url,
  onUpload,
  onClear,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      showAppToast('File size exceeds 10MB limit.', 'WARNING');
      return;
    }
    const allowed = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      showAppToast('Only PNG, JPG, and PDF formats are allowed.', 'WARNING');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadDocument(file);
      onUpload(uploaded);
    } catch (err: unknown) {
      showAppToast(err instanceof Error ? err.message : 'Upload failed.', 'ERROR');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {label}
            {required ? <span className="text-red-500 ml-0.5">*</span> : null}
            {!required ? <span className="text-gray-400 font-normal ml-1">(optional)</span> : null}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
        </div>
        {url ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        ) : null}
      </div>
      {url ? (
        isImageDocUrl(url) ? (
          <div className="flex items-start gap-3">
            <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img
                src={cloudinaryImageThumb(url)}
                alt="Preview"
                className="h-20 w-28 object-cover rounded border border-gray-200 hover:opacity-90 transition-opacity"
                onError={(e) => { (e.target as HTMLImageElement).src = url; }}
              />
            </a>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-700 hover:underline mt-1"
            >
              <ExternalLink className="h-3 w-3" /> View full image
            </a>
          </div>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary-700 bg-primary-50 border border-primary-100 px-3 py-2 rounded-md hover:bg-primary-100 max-w-full group"
          >
            <FileText className="h-5 w-5 shrink-0 text-red-500" />
            <span className="truncate flex-1">{documentFileLabel(url)}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        )
      ) : (
        <label
          className={`inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white ${
            uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-50'
          }`}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Choose file'}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ACCEPT}
            disabled={uploading}
            onChange={(e) => void handleChange(e)}
          />
        </label>
      )}
      <p className="text-xs text-gray-400 mt-2">PNG, JPG, or PDF — max 10 MB</p>
    </div>
  );
};

export type ProducerComplianceDocValues = {
  /** TIN/NIU number (text, mandatory). */
  taxIdentificationNumber?: string;
  /** NIU registration certificate file (mandatory, separate from ACF). */
  niuCertificateUrl?: string;
  /** Tax compliance / clearance certificate — ACF (mandatory). */
  taxClearanceCertificateUrl?: string;
  /** Business registration — RCCM (optional, all producer types). */
  businessRegistrationUrl?: string;
};

type Props = {
  producerType: 'BUSINESS' | 'INDIVIDUAL';
  values: ProducerComplianceDocValues;
  onChange: (patch: Partial<ProducerComplianceDocValues>) => void;
};

export const ProducerComplianceDocuments: React.FC<Props> = ({
  producerType: _producerType,
  values,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="sm:col-span-6 space-y-4 border-t border-gray-100 pt-4">
      <h4 className="text-sm font-bold text-gray-900 flex items-center">
        <FileText className="h-4 w-4 mr-1 text-primary-600" />
        {t('profile.complianceDocsTitle')}
      </h4>
      <p className="text-xs text-gray-500 -mt-2">{t('profile.complianceDocsIntro')}</p>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('profile.taxIdNumber')} <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mt-0.5">{t('profile.taxIdNumberHint')}</p>
        <input
          type="text"
          name="taxIdentificationNumber"
          value={values.taxIdentificationNumber ?? ''}
          onChange={(e) => onChange({ taxIdentificationNumber: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900"
        />
      </div>

      <DocSlot
        label={t('profile.niuCertificate')}
        hint={t('profile.niuCertificateHint')}
        required
        url={values.niuCertificateUrl}
        onUpload={(url) => onChange({ niuCertificateUrl: url })}
        onClear={() => onChange({ niuCertificateUrl: '' })}
      />

      <DocSlot
        label={t('profile.taxClearanceDoc')}
        hint={t('profile.taxClearanceDocHint')}
        required
        url={values.taxClearanceCertificateUrl}
        onUpload={(url) => onChange({ taxClearanceCertificateUrl: url })}
        onClear={() => onChange({ taxClearanceCertificateUrl: '' })}
      />

      <DocSlot
        label={t('profile.businessRegistration')}
        hint={t('profile.businessRegistrationHint')}
        url={values.businessRegistrationUrl}
        onUpload={(url) => onChange({ businessRegistrationUrl: url })}
        onClear={() => onChange({ businessRegistrationUrl: '' })}
      />
    </div>
  );
};