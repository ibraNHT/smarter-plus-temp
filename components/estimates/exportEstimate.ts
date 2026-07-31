import * as XLSX from 'xlsx';
import { formatCurrency } from '../../constants';
import type { Estimate, EstimateLineItem } from '../../types';

function lineItemsOf(estimate: Estimate): EstimateLineItem[] {
  return Array.isArray(estimate.lineItems) ? estimate.lineItems : [];
}

export function estimateToPlainText(estimate: Estimate, currency: string): string {
  const lines = lineItemsOf(estimate);
  const rows = [
    `${estimate.businessName}`,
    estimate.businessAddress || '',
    estimate.businessPhone || '',
    '',
    `Estimate: ${estimate.number}`,
    `Title: ${estimate.title}`,
    `Status: ${estimate.status}`,
    `Issue date: ${String(estimate.issueDate || '').slice(0, 10)}`,
    estimate.validUntil ? `Valid until: ${String(estimate.validUntil).slice(0, 10)}` : '',
    '',
    `Customer: ${estimate.customerName}`,
    estimate.customerEmail || '',
    estimate.customerPhone || '',
    estimate.customerAddress || '',
    '',
    'Line items:',
    ...lines.map(
      (li, i) =>
        `${i + 1}. ${li.description} — ${li.quantity}${li.unit ? ' ' + li.unit : ''} × ${formatCurrency(li.unitPrice, currency)} = ${formatCurrency(li.lineTotal, currency)}`
    ),
    '',
    `Subtotal: ${formatCurrency(estimate.subtotal, currency)}`,
    estimate.taxRate != null ? `Tax (${estimate.taxRate}%): ${formatCurrency(estimate.taxAmount, currency)}` : '',
    `Total: ${formatCurrency(estimate.total, currency)}`,
    '',
    estimate.notes ? `Notes: ${estimate.notes}` : '',
    estimate.terms ? `Terms: ${estimate.terms}` : '',
  ].filter((x) => x !== undefined);
  return rows.join('\n').trim();
}

export function downloadEstimateCsv(estimate: Estimate, currency: string) {
  const lines = lineItemsOf(estimate);
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const headerMeta = [
    ['Estimate Number', estimate.number],
    ['Title', estimate.title],
    ['Status', estimate.status],
    ['Business', estimate.businessName],
    ['Business Address', estimate.businessAddress || ''],
    ['Business Phone', estimate.businessPhone || ''],
    ['Customer', estimate.customerName],
    ['Issue Date', String(estimate.issueDate || '').slice(0, 10)],
    ['Valid Until', estimate.validUntil ? String(estimate.validUntil).slice(0, 10) : ''],
    ['Currency', currency],
    ['Subtotal', estimate.subtotal],
    ['Tax Rate', estimate.taxRate ?? ''],
    ['Tax Amount', estimate.taxAmount],
    ['Total', estimate.total],
    [],
    ['Description', 'Quantity', 'Unit', 'Unit Price', 'Line Total'],
  ];
  const itemRows = lines.map((li) => [
    li.description,
    li.quantity,
    li.unit ?? '',
    li.unitPrice,
    li.lineTotal,
  ]);
  const csv = [...headerMeta, ...itemRows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${estimate.number || 'estimate'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadEstimateXlsx(estimate: Estimate) {
  const lines = lineItemsOf(estimate);
  const wb = XLSX.utils.book_new();
  const summary = [
    ['Estimate Number', estimate.number],
    ['Title', estimate.title],
    ['Status', estimate.status],
    ['Business', estimate.businessName],
    ['Business Address', estimate.businessAddress || ''],
    ['Business Phone', estimate.businessPhone || ''],
    ['Customer', estimate.customerName],
    ['Customer Email', estimate.customerEmail || ''],
    ['Customer Phone', estimate.customerPhone || ''],
    ['Customer Address', estimate.customerAddress || ''],
    ['Issue Date', String(estimate.issueDate || '').slice(0, 10)],
    ['Valid Until', estimate.validUntil ? String(estimate.validUntil).slice(0, 10) : ''],
    ['Currency', estimate.currency],
    ['Subtotal', estimate.subtotal],
    ['Tax Rate %', estimate.taxRate ?? ''],
    ['Tax Amount', estimate.taxAmount],
    ['Total', estimate.total],
    ['Notes', estimate.notes || ''],
    ['Terms', estimate.terms || ''],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  const itemRows = lines.map((li) => ({
    Description: li.description,
    Quantity: li.quantity,
    Unit: li.unit ?? '',
    'Unit Price': li.unitPrice,
    'Line Total': li.lineTotal,
  }));
  const wsItems = XLSX.utils.json_to_sheet(itemRows.length ? itemRows : [{ Description: '', Quantity: '', Unit: '', 'Unit Price': '', 'Line Total': '' }]);
  XLSX.utils.book_append_sheet(wb, wsItems, 'Line Items');
  XLSX.writeFile(wb, `${estimate.number || 'estimate'}.xlsx`);
}
