import React, { useMemo, useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { useData, useStorage, useSubmit, getAbsoluteImageUrl } from '../hooks/useAppData';
import { Card, Input, Button } from '../components/UI';
import { useCurrency } from '../context/CurrencyContext';
import { EstimatePreview } from '../components/estimates/EstimatePreview';
import { downloadEstimateCsv, downloadEstimateXlsx, estimateToPlainText } from '../components/estimates/exportEstimate';
import { FALLBACK_SYSTEM_TEMPLATES } from '../components/estimates/systemTemplates';
import type { Estimate, EstimateLineItem, EstimateTemplate } from '../types';
import { Archive, Copy, FileSpreadsheet, FileText, Pencil, Plus, Printer, Trash2, X } from 'lucide-react';

type LineDraft = {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

type FormState = {
  id?: string;
  number: string;
  title: string;
  status: string;
  templateId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  layout: string;
  issueDate: string;
  validUntil: string;
  notes: string;
  terms: string;
  taxRate: string;
  lines: LineDraft[];
};

const emptyLine = (): LineDraft => ({
  key: `line_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  description: '',
  quantity: '1',
  unit: '',
  unitPrice: '0',
});

const nextEstimateNumber = () => {
  const y = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 9000) + 1000);
  return `EST-${y}-${n}`;
};

const parseTemplateItems = (tpl: EstimateTemplate): EstimateLineItem[] => {
  const raw = tpl.defaultLineItems;
  if (Array.isArray(raw)) return raw as EstimateLineItem[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const computeTotals = (lines: LineDraft[], taxRateStr: string) => {
  const normalized = lines.map((l, i) => {
    const quantity = parseFloat(l.quantity) || 0;
    const unitPrice = parseFloat(l.unitPrice) || 0;
    return {
      sortOrder: i,
      description: l.description.trim() || 'Item',
      quantity,
      unit: l.unit.trim() || null,
      unitPrice,
      lineTotal: quantity * unitPrice,
    };
  });
  const subtotal = normalized.reduce((s, li) => s + li.lineTotal, 0);
  const taxRate = taxRateStr === '' ? null : parseFloat(taxRateStr);
  const rate = taxRate != null && Number.isFinite(taxRate) ? taxRate : 0;
  const taxAmount = subtotal * (rate / 100);
  const total = subtotal + taxAmount;
  return { lineItems: normalized, subtotal, taxRate: taxRate != null && Number.isFinite(taxRate) ? taxRate : null, taxAmount, total };
};

const blankForm = (user: any): FormState => ({
  number: nextEstimateNumber(),
  title: '',
  status: 'draft',
  templateId: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerAddress: '',
  businessName: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Business',
  businessAddress: '',
  businessPhone: '',
  logoUrl: '',
  primaryColor: '#1e3a5f',
  accentColor: '#2563eb',
  layout: 'classic',
  issueDate: new Date().toISOString().slice(0, 10),
  validUntil: '',
  notes: '',
  terms: '',
  taxRate: '',
  lines: [emptyLine()],
});

const formFromEstimate = (est: Estimate): FormState => ({
  id: est.id,
  number: est.number,
  title: est.title,
  status: est.status || 'draft',
  templateId: est.templateId || '',
  customerName: est.customerName || '',
  customerEmail: est.customerEmail || '',
  customerPhone: est.customerPhone || '',
  customerAddress: est.customerAddress || '',
  businessName: est.businessName || '',
  businessAddress: est.businessAddress || '',
  businessPhone: est.businessPhone || '',
  logoUrl: est.logoUrl || '',
  primaryColor: est.primaryColor || '#1e3a5f',
  accentColor: est.accentColor || '#2563eb',
  layout: est.layout || 'classic',
  issueDate: String(est.issueDate || '').slice(0, 10),
  validUntil: est.validUntil ? String(est.validUntil).slice(0, 10) : '',
  notes: est.notes || '',
  terms: est.terms || '',
  taxRate: est.taxRate != null ? String(est.taxRate) : '',
  lines: (est.lineItems || []).length
    ? (est.lineItems || []).map((li, i) => ({
        key: li.id || `li_${i}`,
        description: li.description || '',
        quantity: String(li.quantity ?? 1),
        unit: li.unit || '',
        unitPrice: String(li.unitPrice ?? 0),
      }))
    : [emptyLine()],
});

const statusLabel = (status: string, t: (k: string) => string) => {
  const map: Record<string, string> = {
    draft: t('estimateDraft'),
    sent: t('estimateSent'),
    accepted: t('estimateAccepted'),
    rejected: t('estimateRejected'),
    archived: t('estimateArchived'),
  };
  return map[status] || status;
};

export default function Estimates({ t, locationId, user }: any) {
  const { formatMoney, toDisplay, displayCurrency, workingCurrency } = useCurrency();
  const { data: estimates = [], loading } = useData('estimates', locationId);
  const { data: templates = [] } = useData('estimate_templates');
  const { add, update, remove, submitting } = useSubmit('estimates');
  const { add: addTemplate, submitting: savingTemplate } = useSubmit('estimate_templates');
  const { uploadEstimateLogo, uploading } = useStorage();
  const { showNotification } = useNotification();

  const [view, setView] = useState<'list' | 'editor'>('list');
  const [form, setForm] = useState<FormState>(() => blankForm(user));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPreview, setShowPreview] = useState(true);

  const bookCurrency = useMemo(() => {
    if (form.id) {
      const existing = (estimates as Estimate[]).find((e) => e.id === form.id);
      if (existing?.currency) return existing.currency;
    }
    return workingCurrency;
  }, [form.id, estimates, workingCurrency]);

  const hasPermissionFor = (action: string) => {
    const permissionMap: Record<string, string> = {
      view: 'perm_viewEstimates',
      add: 'perm_addEstimates',
      update: 'perm_updateEstimates',
      delete: 'perm_deleteEstimates',
      templates: 'perm_manageEstimateTemplates',
    };
    const perms = user?.role?.permissions;
    if (!Array.isArray(perms)) return false;
    return perms.includes(permissionMap[action]);
  };

  const systemTemplates = useMemo(() => {
    const fromApi = (templates as EstimateTemplate[]).filter((tpl) => tpl.isSystem);
    if (fromApi.length > 0) return fromApi;
    return FALLBACK_SYSTEM_TEMPLATES;
  }, [templates]);
  const userTemplates = useMemo(
    () =>
      (templates as EstimateTemplate[]).filter(
        (tpl) => !tpl.isSystem && (!tpl.locationId || tpl.locationId === locationId || locationId === 'all')
      ),
    [templates, locationId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (estimates as Estimate[]).filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (!q) return true;
      return (
        e.number?.toLowerCase().includes(q) ||
        e.title?.toLowerCase().includes(q) ||
        e.customerName?.toLowerCase().includes(q) ||
        e.businessName?.toLowerCase().includes(q)
      );
    });
  }, [estimates, search, statusFilter]);

  const totals = useMemo(() => computeTotals(form.lines, form.taxRate), [form.lines, form.taxRate]);

  const previewEstimate: Estimate = useMemo(
    () => ({
      id: form.id || 'preview',
      number: form.number,
      title: form.title || t('estimateTitle'),
      status: form.status,
      locationId: locationId || '',
      userId: user?.id || '',
      templateId: form.templateId || null,
      customerName: form.customerName || '—',
      customerEmail: form.customerEmail || null,
      customerPhone: form.customerPhone || null,
      customerAddress: form.customerAddress || null,
      businessName: form.businessName || '—',
      businessAddress: form.businessAddress || null,
      businessPhone: form.businessPhone || null,
      logoUrl: form.logoUrl || null,
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      layout: form.layout,
      issueDate: form.issueDate,
      validUntil: form.validUntil || null,
      notes: form.notes || null,
      terms: form.terms || null,
      currency: bookCurrency,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      lineItems: totals.lineItems,
    }),
    [form, totals, locationId, user, bookCurrency, t]
  );

  const openNew = () => {
    if (!locationId || locationId === 'all') {
      showNotification(t('errorNoLocation'), 'error');
      return;
    }
    if (!hasPermissionFor('add')) {
      showNotification('You do not have permission to add estimates.', 'error');
      return;
    }
    setForm(blankForm(user));
    setView('editor');
  };

  const openEdit = (est: Estimate) => {
    if (!hasPermissionFor('update') && !hasPermissionFor('view')) {
      showNotification('You do not have permission to edit estimates.', 'error');
      return;
    }
    setForm(formFromEstimate(est));
    setView('editor');
  };

  const applyTemplate = (tpl: EstimateTemplate) => {
    const items = parseTemplateItems(tpl);
    setForm((prev) => ({
      ...prev,
      templateId: tpl.id,
      primaryColor: tpl.primaryColor || prev.primaryColor,
      accentColor: tpl.accentColor || prev.accentColor,
      logoUrl: tpl.logoUrl || prev.logoUrl,
      layout: tpl.layout || prev.layout,
      terms: tpl.footerNote || prev.terms,
      notes: tpl.headerHtml || prev.notes,
      title: prev.title || tpl.name,
      lines: items.length
        ? items.map((li, i) => ({
            key: `tpl_${i}_${Date.now()}`,
            description: li.description || '',
            quantity: String(li.quantity ?? 1),
            unit: li.unit || '',
            unitPrice: String(li.unitPrice ?? 0),
          }))
        : [emptyLine()],
    }));
  };

  const setLine = (key: string, patch: Partial<LineDraft>) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    }));
  };

  const handleLogo = async (file: File | null) => {
    if (!file) return;
    try {
      const uploaded = await uploadEstimateLogo(file);
      if (uploaded?.url) setForm((prev) => ({ ...prev, logoUrl: uploaded.url }));
    } catch {
      /* notification already shown */
    }
  };

  const buildPayload = () => {
    const { lineItems, subtotal, taxRate, taxAmount, total } = computeTotals(form.lines, form.taxRate);
    return {
      number: form.number.trim(),
      title: form.title.trim(),
      status: form.status,
      locationId,
      userId: user.id,
      templateId: form.templateId || null,
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim() || null,
      customerPhone: form.customerPhone.trim() || null,
      customerAddress: form.customerAddress.trim() || null,
      businessName: form.businessName.trim(),
      businessAddress: form.businessAddress.trim() || null,
      businessPhone: form.businessPhone.trim() || null,
      logoUrl: form.logoUrl || null,
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      layout: form.layout,
      issueDate: new Date(form.issueDate || Date.now()).toISOString(),
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      notes: form.notes.trim() || null,
      terms: form.terms.trim() || null,
      currency: bookCurrency,
      subtotal,
      taxRate,
      taxAmount,
      total,
      lineItems,
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || locationId === 'all') {
      showNotification(t('errorNoLocation'), 'error');
      return;
    }
    if (!form.title.trim() || !form.customerName.trim() || !form.businessName.trim()) {
      showNotification(t('errorFillFields'), 'error');
      return;
    }
    const payload = buildPayload();
    if (form.id) {
      if (!hasPermissionFor('update')) {
        showNotification('You do not have permission to update estimates.', 'error');
        return;
      }
      const res = await update(form.id, payload);
      if (res) {
        showNotification(t('estimateSaved'), 'success');
        setView('list');
      }
    } else {
      if (!hasPermissionFor('add')) {
        showNotification('You do not have permission to add estimates.', 'error');
        return;
      }
      const res = await add(payload);
      if (res) {
        showNotification(t('estimateSaved'), 'success');
        setView('list');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermissionFor('delete')) {
      showNotification('You do not have permission to delete estimates.', 'error');
      return;
    }
    if (!window.confirm(t('delete') + '?')) return;
    const ok = await remove(id);
    if (ok) showNotification(t('estimateDeleted'), 'success');
  };

  const handleArchiveTemplate = async (est?: Estimate) => {
    if (!hasPermissionFor('templates')) {
      showNotification('You do not have permission to manage estimate templates.', 'error');
      return;
    }
    if (!locationId || locationId === 'all') {
      showNotification(t('errorNoLocation'), 'error');
      return;
    }
    const source = est || previewEstimate;
    const { lineItems } = est
      ? {
          lineItems: (est.lineItems || []).map((li, i) => ({
            sortOrder: i,
            description: li.description,
            quantity: li.quantity,
            unit: li.unit,
            unitPrice: li.unitPrice,
            lineTotal: li.lineTotal,
          })),
        }
      : computeTotals(form.lines, form.taxRate);

    const name = window.prompt(t('estimateTemplate'), `${source.title || source.number} template`);
    if (!name?.trim()) return;

    const res = await addTemplate({
      name: name.trim(),
      industry: 'general',
      isSystem: false,
      locationId,
      userId: user.id,
      primaryColor: source.primaryColor,
      accentColor: source.accentColor,
      logoUrl: source.logoUrl || null,
      footerNote: source.terms || null,
      layout: source.layout || 'classic',
      defaultLineItems: lineItems.map(({ description, quantity, unit, unitPrice }) => ({
        description,
        quantity,
        unit,
        unitPrice,
      })),
    });
    if (res) showNotification(t('templateArchived'), 'success');
  };

  const exportEstimate = (est: Estimate, kind: 'csv' | 'xlsx' | 'pdf' | 'text') => {
    if (kind === 'csv') downloadEstimateCsv(est, toDisplay, displayCurrency);
    else if (kind === 'xlsx') downloadEstimateXlsx(est);
    else if (kind === 'pdf') {
      openEdit(est);
      setShowPreview(true);
      setTimeout(() => window.print(), 300);
    } else if (kind === 'text') {
      navigator.clipboard?.writeText(estimateToPlainText(est, formatMoney)).then(
        () => showNotification('Copied', 'success'),
        () => showNotification('Copy failed', 'error')
      );
    }
  };

  if (view === 'editor') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {form.id ? t('editEstimate') : t('newEstimate')}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setView('list')}>
              <X className="w-4 h-4 inline mr-1" />
              {t('cancel')}
            </Button>
            {hasPermissionFor('templates') && (
              <Button variant="secondary" onClick={() => handleArchiveTemplate()} disabled={savingTemplate}>
                <Archive className="w-4 h-4 inline mr-1" />
                {t('archiveAsTemplate')}
              </Button>
            )}
            <Button variant="secondary" onClick={() => downloadEstimateCsv(previewEstimate, toDisplay, displayCurrency)}>
              {t('exportCsv')}
            </Button>
            <Button variant="secondary" onClick={() => downloadEstimateXlsx(previewEstimate)}>
              {t('exportExcel')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(estimateToPlainText(previewEstimate, formatMoney));
                showNotification('Copied', 'success');
              }}
            >
              <Copy className="w-4 h-4 inline mr-1" />
              {t('copyPlainText')}
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="w-4 h-4 inline mr-1" />
              {t('exportPdf')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <form onSubmit={handleSave} className="space-y-4 no-print">
            <Card title={t('pickTemplate')}>
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-2">{t('estimateIndustryTemplates')}</p>
                <div className="flex flex-wrap gap-2">
                  {systemTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="px-3 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      style={{ borderLeftWidth: 4, borderLeftColor: tpl.primaryColor }}
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
              {userTemplates.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">{t('estimateUserTemplates')}</p>
                  <div className="flex flex-wrap gap-2">
                    {userTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className="px-3 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card title={t('estimateBusiness')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label={t('estimateNumber')} value={form.number} onChange={(v: string) => setForm({ ...form, number: v })} required />
                <Input label={t('estimateTitle')} value={form.title} onChange={(v: string) => setForm({ ...form, title: v })} required />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('estimateStatus')}</label>
                  <select
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {['draft', 'sent', 'accepted', 'rejected', 'archived'].map((s) => (
                      <option key={s} value={s}>{statusLabel(s, t)}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('estimateLayout')}</label>
                  <select
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                    value={form.layout}
                    onChange={(e) => setForm({ ...form, layout: e.target.value })}
                  >
                    <option value="classic">{t('layoutClassic')}</option>
                    <option value="modern">{t('layoutModern')}</option>
                    <option value="compact">{t('layoutCompact')}</option>
                  </select>
                </div>
                <Input label={t('businessName')} value={form.businessName} onChange={(v: string) => setForm({ ...form, businessName: v })} required />
                <Input label={t('businessPhone')} value={form.businessPhone} onChange={(v: string) => setForm({ ...form, businessPhone: v })} />
                <div className="md:col-span-2">
                  <Input label={t('businessAddress')} value={form.businessAddress} onChange={(v: string) => setForm({ ...form, businessAddress: v })} />
                </div>
                <Input label={t('primaryColor')} type="color" value={form.primaryColor} onChange={(v: string) => setForm({ ...form, primaryColor: v })} />
                <Input label={t('accentColor')} type="color" value={form.accentColor} onChange={(v: string) => setForm({ ...form, accentColor: v })} />
                <div className="md:col-span-2 mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('estimateLogo')}</label>
                  <div className="flex items-center gap-3">
                    {form.logoUrl ? (
                      <img src={getAbsoluteImageUrl(form.logoUrl)} alt="" className="h-12 w-12 object-contain rounded border" />
                    ) : null}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => handleLogo(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                  </div>
                </div>
                <Input label={t('issueDate')} type="date" value={form.issueDate} onChange={(v: string) => setForm({ ...form, issueDate: v })} />
                <Input label={t('validUntil')} type="date" value={form.validUntil} onChange={(v: string) => setForm({ ...form, validUntil: v })} />
              </div>
            </Card>

            <Card title={t('estimateCustomer')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label={t('customerName')} value={form.customerName} onChange={(v: string) => setForm({ ...form, customerName: v })} required />
                <Input label={t('customerEmail')} type="email" value={form.customerEmail} onChange={(v: string) => setForm({ ...form, customerEmail: v })} />
                <Input label={t('customerPhone')} value={form.customerPhone} onChange={(v: string) => setForm({ ...form, customerPhone: v })} />
                <Input label={t('customerAddress')} value={form.customerAddress} onChange={(v: string) => setForm({ ...form, customerAddress: v })} />
              </div>
            </Card>

            <Card title={t('estimateLineItems')}>
              <div className="space-y-3">
                {form.lines.map((line) => (
                  <div key={line.key} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <Input label={t('description') || 'Description'} value={line.description} onChange={(v: string) => setLine(line.key, { description: v })} />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Input label={t('quantity')} type="number" value={line.quantity} onChange={(v: string) => setLine(line.key, { quantity: v })} />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Input label={t('unit')} value={line.unit} onChange={(v: string) => setLine(line.key, { unit: v })} />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Input label={`${t('unitPrice')} (${bookCurrency})`} type="number" value={line.unitPrice} onChange={(v: string) => setLine(line.key, { unitPrice: v })} />
                    </div>
                    <div className="col-span-12 md:col-span-1 pb-4">
                      <Button
                        variant="danger"
                        className="w-full px-2"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            lines: prev.lines.length <= 1 ? prev.lines : prev.lines.filter((l) => l.key !== line.key),
                          }))
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  onClick={() => setForm((prev) => ({ ...prev, lines: [...prev.lines, emptyLine()] }))}
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  {t('addLineItem')}
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <Input label={t('taxRate')} type="number" value={form.taxRate} onChange={(v: string) => setForm({ ...form, taxRate: v })} />
                  <div className="text-sm text-gray-600 dark:text-gray-300 self-center">
                    {t('subtotal')}: <strong>{formatMoney(totals.subtotal, bookCurrency)}</strong>
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white self-center">
                    {t('total')}: <strong>{formatMoney(totals.total, bookCurrency)}</strong>
                  </div>
                </div>
              </div>
            </Card>

            <Card title={`${t('notes')} / ${t('terms')}`}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('notes')}</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 min-h-[80px]"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('terms')}</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 min-h-[80px]"
                  value={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.value })}
                />
              </div>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {t('save')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowPreview((v) => !v)}>
                {t('estimatePreview')}
              </Button>
            </div>
          </form>

          {showPreview && (
            <div className="xl:sticky xl:top-4 self-start">
              <EstimatePreview estimate={previewEstimate} t={t} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('estimates')}</h1>
        {hasPermissionFor('add') && (
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 inline mr-1" />
            {t('newEstimate')}
          </Button>
        )}
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            className="flex-1 min-w-[12rem] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
            placeholder={t('searchEstimates')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('inventoryFilterAll')}</option>
            {['draft', 'sent', 'accepted', 'rejected', 'archived'].map((s) => (
              <option key={s} value={s}>{statusLabel(s, t)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500">…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">{t('noEstimates')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                  <th className="py-2 pr-2">{t('estimateNumber')}</th>
                  <th className="py-2 pr-2">{t('estimateTitle')}</th>
                  <th className="py-2 pr-2">{t('estimateCustomer')}</th>
                  <th className="py-2 pr-2">{t('estimateStatus')}</th>
                  <th className="py-2 pr-2 text-right">{t('total')}</th>
                  <th className="py-2 pr-2">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((est) => (
                  <tr key={est.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-2 font-medium">{est.number}</td>
                    <td className="py-2 pr-2">{est.title}</td>
                    <td className="py-2 pr-2">{est.customerName}</td>
                    <td className="py-2 pr-2">{statusLabel(est.status, t)}</td>
                    <td className="py-2 pr-2 text-right">{formatMoney(est.total, est.currency)}</td>
                    <td className="py-2 pr-2">
                      <div className="flex flex-wrap gap-1">
                        <button type="button" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title={t('edit')} onClick={() => openEdit(est)}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title={t('exportCsv')} onClick={() => exportEstimate(est, 'csv')}>
                          <FileText className="w-4 h-4" />
                        </button>
                        <button type="button" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title={t('exportExcel')} onClick={() => exportEstimate(est, 'xlsx')}>
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button type="button" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title={t('exportPdf')} onClick={() => exportEstimate(est, 'pdf')}>
                          <Printer className="w-4 h-4" />
                        </button>
                        {hasPermissionFor('templates') && (
                          <button type="button" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title={t('archiveAsTemplate')} onClick={() => handleArchiveTemplate(est)}>
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermissionFor('delete') && (
                          <button type="button" className="p-1.5 rounded hover:bg-red-50 text-red-600" title={t('delete')} onClick={() => handleDelete(est.id)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
