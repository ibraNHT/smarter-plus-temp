import React, { useState, useEffect } from 'react';
import { Input, Button, Card, Select } from '../components/UI';
import { CURRENCY_CODES } from '../constants';
import { apiFetch, useStorage, getAbsoluteImageUrl } from '../hooks/useAppData';
import { Building2, Upload } from 'lucide-react';

type OrgFormState = {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
  industry: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  description: string;
  logoUrl: string;
  currency: string;
};

const emptyForm = (): OrgFormState => ({
  name: '',
  legalName: '',
  email: '',
  phone: '',
  website: '',
  taxId: '',
  industry: '',
  address: '',
  city: '',
  country: '',
  postalCode: '',
  description: '',
  logoUrl: '',
  currency: 'XAF',
});

/** Full organization profile form — used as onboarding gate and as editable settings page. */
export default function OrgProfile({ t, onComplete, refreshUser, onLogout, embedded = false }: any) {
  const { upload, uploading } = useStorage();
  const [form, setForm] = useState<OrgFormState>(emptyForm());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOrg, setLoadingOrg] = useState(true);

  const setField = (key: keyof OrgFormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    apiFetch('/organization')
      .then((org: any) => {
        setForm({
          name: org.name || '',
          legalName: org.legalName || '',
          email: org.email || '',
          phone: org.phone || '',
          website: org.website || '',
          taxId: org.taxId || '',
          industry: org.industry || '',
          address: org.address || '',
          city: org.city || '',
          country: org.country || '',
          postalCode: org.postalCode || '',
          description: org.description || '',
          logoUrl: org.logoUrl || '',
          currency: org.currency || 'XAF',
        });
      })
      .catch((err: any) => setError(err.message || 'Failed to load organization'))
      .finally(() => setLoadingOrg(false));
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      const result = await upload(
        e.target.files[0],
        `uploads/estimates/org_logo_${Date.now()}_${e.target.files[0].name}`,
        { kind: 'estimate' }
      );
      if (result?.url) setForm((prev) => ({ ...prev, logoUrl: result.url }));
    } catch {
      /* upload notifies */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await apiFetch('/organization', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      if (refreshUser) await refreshUser();
      setSuccess(t('orgProfileSaved') || 'Organization profile saved');
      if (onComplete) onComplete();
    } catch (err: any) {
      setError(err.message || 'Could not save organization info');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOrg) {
    return <div className="p-8 text-center text-gray-500">{t('pleaseWait')}</div>;
  }

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="text-sm text-red-400">{error}</div>}
      {success && embedded && <div className="text-sm text-green-400">{success}</div>}

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="w-28 h-28 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-300 dark:border-gray-600 relative group shrink-0">
          {form.logoUrl ? (
            <img src={getAbsoluteImageUrl(form.logoUrl)} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-10 h-10 text-gray-500" />
          )}
          <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <Upload className="w-6 h-6 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
          </label>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">{t('orgLogoHint')}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('orgSectionIdentity')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Input label={t('organizationName')} value={form.name} onChange={setField('name')} required />
          <Input label={t('legalName')} value={form.legalName} onChange={setField('legalName')} required />
          <Input label={t('industry')} value={form.industry} onChange={setField('industry')} required />
          <Input label={t('taxId')} value={form.taxId} onChange={setField('taxId')} />
          <Select
            label={t('workingCurrency')}
            value={form.currency}
            onChange={setField('currency')}
            options={CURRENCY_CODES.map((code) => ({ value: code, label: code }))}
            required
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-4">{t('workingCurrencyHint')}</p>
        <Input label={t('orgDescription')} value={form.description} onChange={setField('description')} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('orgSectionContact')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Input label={t('orgEmail')} type="email" value={form.email} onChange={setField('email')} required />
          <Input label={t('phone')} value={form.phone} onChange={setField('phone')} required />
          <Input label={t('website')} value={form.website} onChange={setField('website')} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('orgSectionAddress')}</h3>
        <Input label={t('address')} value={form.address} onChange={setField('address')} required />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
          <Input label={t('city')} value={form.city} onChange={setField('city')} required />
          <Input label={t('country')} value={form.country} onChange={setField('country')} required />
          <Input label={t('postalCode')} value={form.postalCode} onChange={setField('postalCode')} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || uploading} className={embedded ? '' : 'w-full sm:w-auto'}>
          {loading ? t('pleaseWait') : t('saveOrgProfile')}
        </Button>
      </div>
    </form>
  );

  if (embedded) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('organization')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('orgProfileSubtitle')}</p>
        </div>
        <Card>{formBody}</Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('orgProfileTitle')}</h1>
          {typeof onLogout === 'function' && (
            <button
              type="button"
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white underline shrink-0"
            >
              {t('logout') || 'Sign out'}
            </button>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">{t('orgProfileSubtitle')}</p>
        {formBody}
      </div>
    </div>
  );
}
