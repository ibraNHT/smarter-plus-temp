import React from 'react';
import { getAbsoluteImageUrl } from '../../hooks/useAppData';
import { useCurrency } from '../../context/CurrencyContext';
import type { Estimate, EstimateLineItem } from '../../types';

type Props = {
  estimate: Estimate;
  t: (key: string) => string;
};

export function EstimatePreview({ estimate, t }: Props) {
  const { formatMoney } = useCurrency();
  const from = estimate.currency;
  const lines: EstimateLineItem[] = Array.isArray(estimate.lineItems) ? estimate.lineItems : [];
  const layout = estimate.layout || 'classic';
  const logoUrl = estimate.logoUrl ? getAbsoluteImageUrl(estimate.logoUrl) : '';

  const wrapperClass =
    layout === 'modern'
      ? 'estimate-preview estimate-layout-modern border-t-4'
      : layout === 'compact'
        ? 'estimate-preview estimate-layout-compact text-sm'
        : 'estimate-preview estimate-layout-classic';

  return (
    <div
      id="estimate-print-root"
      className={`${wrapperClass} bg-white text-gray-900 p-6 md:p-8 rounded-lg shadow print:shadow-none print:rounded-none`}
      style={
        {
          ['--est-primary' as string]: estimate.primaryColor || '#1e3a5f',
          ['--est-accent' as string]: estimate.accentColor || '#2563eb',
          borderColor: estimate.primaryColor || '#1e3a5f',
        } as React.CSSProperties
      }
    >
      <div className="estimate-letterhead flex flex-wrap items-start justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--est-primary)' }}>
        <div className="flex items-start gap-3 min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-14 w-14 object-contain shrink-0" />
          ) : null}
          <div className="min-w-0">
            <h2 className="text-xl font-bold truncate" style={{ color: 'var(--est-primary)' }}>
              {estimate.businessName}
            </h2>
            {estimate.businessAddress ? <p className="text-sm text-gray-600 whitespace-pre-line">{estimate.businessAddress}</p> : null}
            {estimate.businessPhone ? <p className="text-sm text-gray-600">{estimate.businessPhone}</p> : null}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-gray-500">{t('estimates')}</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--est-accent)' }}>{estimate.number}</p>
          <p className="text-sm text-gray-700">{estimate.title}</p>
          <p className="text-xs text-gray-500 mt-1">
            {t('issueDate')}: {String(estimate.issueDate || '').slice(0, 10)}
            {estimate.validUntil ? ` · ${t('validUntil')}: ${String(estimate.validUntil).slice(0, 10)}` : ''}
          </p>
        </div>
      </div>

      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--est-accent)' }}>{t('estimateCustomer')}</h3>
        <p className="font-medium">{estimate.customerName}</p>
        {estimate.customerEmail ? <p className="text-sm text-gray-600">{estimate.customerEmail}</p> : null}
        {estimate.customerPhone ? <p className="text-sm text-gray-600">{estimate.customerPhone}</p> : null}
        {estimate.customerAddress ? <p className="text-sm text-gray-600 whitespace-pre-line">{estimate.customerAddress}</p> : null}
      </section>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ backgroundColor: 'color-mix(in srgb, var(--est-primary) 12%, white)' }}>
              <th className="py-2 px-2 text-sm font-semibold">{t('description')}</th>
              <th className="py-2 px-2 text-sm font-semibold text-right">{t('quantity')}</th>
              <th className="py-2 px-2 text-sm font-semibold">{t('unit')}</th>
              <th className="py-2 px-2 text-sm font-semibold text-right">{t('unitPrice')}</th>
              <th className="py-2 px-2 text-sm font-semibold text-right">{t('lineTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((li, idx) => (
              <tr key={li.id || idx} className="border-b border-gray-100">
                <td className="py-2 px-2">{li.description}</td>
                <td className="py-2 px-2 text-right">{li.quantity}</td>
                <td className="py-2 px-2">{li.unit || '—'}</td>
                <td className="py-2 px-2 text-right">{formatMoney(li.unitPrice, from)}</td>
                <td className="py-2 px-2 text-right font-medium">{formatMoney(li.lineTotal, from)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-6">
        <dl className="text-sm space-y-1 min-w-[12rem]">
          <div className="flex justify-between gap-6">
            <dt className="text-gray-600">{t('subtotal')}</dt>
            <dd>{formatMoney(estimate.subtotal, from)}</dd>
          </div>
          {estimate.taxRate != null && Number(estimate.taxRate) > 0 ? (
            <div className="flex justify-between gap-6">
              <dt className="text-gray-600">{t('taxAmount')} ({estimate.taxRate}%)</dt>
              <dd>{formatMoney(estimate.taxAmount, from)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-6 pt-2 border-t font-bold text-base" style={{ borderColor: 'var(--est-primary)', color: 'var(--est-primary)' }}>
            <dt>{t('total')}</dt>
            <dd>{formatMoney(estimate.total, from)}</dd>
          </div>
        </dl>
      </div>

      {estimate.notes ? (
        <section className="mb-3">
          <h3 className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--est-accent)' }}>{t('notes')}</h3>
          <p className="text-sm whitespace-pre-line text-gray-700">{estimate.notes}</p>
        </section>
      ) : null}
      {estimate.terms ? (
        <section>
          <h3 className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--est-accent)' }}>{t('terms')}</h3>
          <p className="text-sm whitespace-pre-line text-gray-700">{estimate.terms}</p>
        </section>
      ) : null}
    </div>
  );
}
