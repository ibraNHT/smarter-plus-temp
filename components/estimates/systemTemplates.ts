import type { EstimateTemplate } from '../../types';

/** Bundled industry templates so Estimates stays usable when `estimate_templates` cache is empty (offline / first visit). */
export const FALLBACK_SYSTEM_TEMPLATES: EstimateTemplate[] = [
  {
    id: 'tpl_pharmacy',
    name: 'Pharmacy Estimate',
    industry: 'pharmacy',
    isSystem: true,
    primaryColor: '#0f766e',
    accentColor: '#14b8a6',
    layout: 'classic',
    footerNote: 'Medicines dispensed per prescription. Prices valid 14 days.',
    defaultLineItems: [
      { sortOrder: 0, description: 'Prescription fill / consultation', quantity: 1, unit: 'service', unitPrice: 5000, lineTotal: 5000 },
      { sortOrder: 1, description: 'OTC medication pack', quantity: 1, unit: 'pack', unitPrice: 3500, lineTotal: 3500 },
    ],
  },
  {
    id: 'tpl_construction',
    name: 'Construction Estimate',
    industry: 'construction',
    isSystem: true,
    primaryColor: '#92400e',
    accentColor: '#d97706',
    layout: 'modern',
    footerNote: 'Estimate based on stated scope. Material price changes may apply.',
    defaultLineItems: [
      { sortOrder: 0, description: 'Labor – skilled trades', quantity: 8, unit: 'hour', unitPrice: 8000, lineTotal: 64000 },
      { sortOrder: 1, description: 'Building materials', quantity: 1, unit: 'lot', unitPrice: 150000, lineTotal: 150000 },
      { sortOrder: 2, description: 'Site preparation', quantity: 1, unit: 'job', unitPrice: 45000, lineTotal: 45000 },
    ],
  },
  {
    id: 'tpl_mechanics',
    name: 'Mechanics / Auto Estimate',
    industry: 'mechanics',
    isSystem: true,
    primaryColor: '#1e3a5f',
    accentColor: '#2563eb',
    layout: 'compact',
    footerNote: 'Parts availability subject to supplier stock. Labor rates as quoted.',
    defaultLineItems: [
      { sortOrder: 0, description: 'Diagnostic fee', quantity: 1, unit: 'service', unitPrice: 15000, lineTotal: 15000 },
      { sortOrder: 1, description: 'Parts', quantity: 1, unit: 'set', unitPrice: 40000, lineTotal: 40000 },
      { sortOrder: 2, description: 'Labor', quantity: 2, unit: 'hour', unitPrice: 12000, lineTotal: 24000 },
    ],
  },
  {
    id: 'tpl_agriculture',
    name: 'Agriculture Estimate',
    industry: 'agriculture',
    isSystem: true,
    primaryColor: '#166534',
    accentColor: '#22c55e',
    layout: 'classic',
    footerNote: 'Seasonal availability applies. Quotation valid until valid-until date.',
    defaultLineItems: [
      { sortOrder: 0, description: 'Seed / planting stock', quantity: 1, unit: 'bag', unitPrice: 25000, lineTotal: 25000 },
      { sortOrder: 1, description: 'Fertilizer', quantity: 2, unit: 'bag', unitPrice: 18000, lineTotal: 36000 },
      { sortOrder: 2, description: 'Field labor', quantity: 5, unit: 'day', unitPrice: 7000, lineTotal: 35000 },
    ],
  },
  {
    id: 'tpl_general',
    name: 'General Business Estimate',
    industry: 'general',
    isSystem: true,
    primaryColor: '#1e3a5f',
    accentColor: '#64748b',
    layout: 'modern',
    footerNote: 'Thank you for your business. Payment terms as agreed.',
    defaultLineItems: [
      { sortOrder: 0, description: 'Professional services', quantity: 1, unit: 'service', unitPrice: 50000, lineTotal: 50000 },
      { sortOrder: 1, description: 'Materials / supplies', quantity: 1, unit: 'lot', unitPrice: 20000, lineTotal: 20000 },
    ],
  },
];
