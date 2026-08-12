/** Platform base / ledger currency (Central African CFA / FCFA). */
export const BASE_CURRENCY = 'XAF';

/**
 * Official EUR peg for CFA francs (XAF and XOF). Used when deriving rateToXaf
 * from live EUR-based FX feeds.
 */
export const EUR_TO_XAF = 655.957;

/**
 * Unique ISO currencies for the supported country list:
 * BJ/BF/CI/GW/ML/NE/SN/TG → XOF; CM/TD/CG/GQ/GA → XAF; CD → CDF; FR → EUR;
 * GH → GHS; GN → GNF; JP → JPY; KE → KES; NG → NGN; RW → RWF; ZA → ZAR;
 * GB → GBP; US → USD; ZM → ZMW.
 */
export const SUPPORTED_CURRENCIES = [
  'XAF',
  'XOF',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'NGN',
  'GHS',
  'GNF',
  'CDF',
  'KES',
  'RWF',
  'ZAR',
  'ZMW',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Currencies editable in admin (everything except base XAF). */
export const EDITABLE_CURRENCIES = SUPPORTED_CURRENCIES.filter(
  (c) => c !== BASE_CURRENCY,
) as readonly string[];

/** Display labels (XAF / XOF shown as CFA for users). */
export const CURRENCY_LABELS: Record<string, string> = {
  XAF: 'FCFA (XAF)',
  XOF: 'CFA (XOF)',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  JPY: 'JPY',
  NGN: 'NGN',
  GHS: 'GHS',
  GNF: 'GNF',
  CDF: 'CDF',
  KES: 'KES',
  RWF: 'RWF',
  ZAR: 'ZAR',
  ZMW: 'ZMW',
};

/** Country → currency for the requested coverage list. */
export const COUNTRY_CURRENCY: Record<string, SupportedCurrency> = {
  BJ: 'XOF',
  BF: 'XOF',
  CM: 'XAF',
  TD: 'XAF',
  CG: 'XAF',
  CD: 'CDF',
  CI: 'XOF',
  GQ: 'XAF',
  FR: 'EUR',
  GA: 'XAF',
  GH: 'GHS',
  GN: 'GNF',
  GW: 'XOF',
  JP: 'JPY',
  KE: 'KES',
  ML: 'XOF',
  NE: 'XOF',
  NG: 'NGN',
  RW: 'RWF',
  SN: 'XOF',
  ZA: 'ZAR',
  TG: 'XOF',
  GB: 'GBP',
  US: 'USD',
  ZM: 'ZMW',
};

/** rates[currency] = how many XAF equal 1 unit of that currency. XAF is always 1. */
export type RatesMap = Record<string, number>;

/**
 * Fallback rates (1 foreign unit = N XAF) used until live FX / admin rates load.
 * Approximate mid-2026 values; live feed overrides these.
 */
export const DEFAULT_RATES: RatesMap = {
  [BASE_CURRENCY]: 1,
  XOF: 1,
  USD: 575,
  EUR: EUR_TO_XAF,
  GBP: 770,
  JPY: 3.55,
  NGN: 0.42,
  GHS: 50,
  GNF: 0.065,
  CDF: 0.25,
  KES: 4.44,
  RWF: 0.39,
  ZAR: 35,
  ZMW: 32,
};

export function currencyLabel(code: string): string {
  const c = (code || BASE_CURRENCY).toUpperCase();
  return CURRENCY_LABELS[c] ?? c;
}

function resolveRate(currency: string, rates: RatesMap): number | null {
  const c = (currency || BASE_CURRENCY).toUpperCase();
  if (c === BASE_CURRENCY) return 1;
  const fromLive = Number(rates[c]);
  if (Number.isFinite(fromLive) && fromLive > 0) return fromLive;
  const fromDefault = Number(DEFAULT_RATES[c]);
  if (Number.isFinite(fromDefault) && fromDefault > 0) return fromDefault;
  return null;
}

export function toXaf(amount: number, currency: string, rates: RatesMap): number {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  const c = (currency || BASE_CURRENCY).toUpperCase();
  if (c === BASE_CURRENCY) return Math.round(n * 100) / 100;
  const rate = resolveRate(c, rates);
  if (rate == null) return Math.round(n * 100) / 100;
  return Math.round(n * rate * 100) / 100;
}

export function fromXaf(amountXaf: number, currency: string, rates: RatesMap): number {
  const n = Number(amountXaf);
  if (!Number.isFinite(n)) return 0;
  const c = (currency || BASE_CURRENCY).toUpperCase();
  if (c === BASE_CURRENCY) return Math.round(n * 100) / 100;
  const rate = resolveRate(c, rates);
  if (rate == null) return Math.round(n * 100) / 100;
  return Math.round((n / rate) * 100) / 100;
}

const ZERO_DECIMAL = new Set(['XAF', 'XOF', 'NGN', 'CDF', 'GNF', 'RWF', 'JPY']);

/**
 * Build rateToXaf map from an EUR-based rates object (1 EUR = N units of currency).
 */
export function ratesFromEurFeed(eurRates: Record<string, number>): RatesMap {
  const out: RatesMap = { [BASE_CURRENCY]: 1 };
  for (const code of SUPPORTED_CURRENCIES) {
    if (code === BASE_CURRENCY) continue;
    const perEur = Number(eurRates[code]);
    if (!Number.isFinite(perEur) || perEur <= 0) continue;
    out[code] = Math.round((EUR_TO_XAF / perEur) * 1e6) / 1e6;
  }
  // CFA francs share the same EUR peg → 1 XOF = 1 XAF
  if (out.XOF == null && Number(eurRates.XOF) > 0) {
    out.XOF = 1;
  } else if (out.XOF != null && Math.abs(out.XOF - 1) < 0.01) {
    out.XOF = 1;
  }
  out.EUR = EUR_TO_XAF;
  return out;
}

/**
 * Format an amount that is stored in XAF into the user's display currency.
 */
export function formatMoney(
  amountXaf: number,
  opts?: {
    currency?: string;
    rates?: RatesMap;
    /** When true, omit the currency suffix. */
    amountOnly?: boolean;
    maximumFractionDigits?: number;
  },
): string {
  const currency = (opts?.currency || BASE_CURRENCY).toUpperCase();
  const rates = opts?.rates ?? DEFAULT_RATES;
  const value = fromXaf(amountXaf, currency, rates);
  const explicitDigits = opts?.maximumFractionDigits;
  let digits = explicitDigits ?? (ZERO_DECIMAL.has(currency) ? 0 : 2);
  // XAF has no minor unit in circulation, so whole numbers suit ordinary amounts —
  // but percentage-derived amounts are legitimately fractional. Rounding them hides
  // money the customer is actually charged: a 16% fee of 2.4 showed as "2" while the
  // order total beside it showed 17.4, so the column did not add up. Reveal decimals
  // whenever rounding would change the number; whole amounts are untouched.
  if (explicitDigits == null && digits === 0 && !Number.isInteger(value)) {
    digits = 2;
  }
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
  if (opts?.amountOnly) return formatted;
  return `${formatted} ${currencyLabel(currency)}`;
}

const LIVE_FX_URL = 'https://open.er-api.com/v6/latest/EUR';

/**
 * Fetch live FX (EUR base) and convert to rateToXaf for supported currencies.
 * Attribution: exchangerate-api.com (open access endpoint).
 */
export async function fetchLiveRatesToXaf(): Promise<{
  rates: RatesMap;
  updatedAt: string | null;
} | null> {
  const res = await fetch(LIVE_FX_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Live FX HTTP ${res.status}`);
  const data = (await res.json()) as {
    result?: string;
    rates?: Record<string, number>;
    time_last_update_utc?: string;
  };
  if (data.result !== 'success' || !data.rates) return null;
  return {
    rates: ratesFromEurFeed(data.rates),
    updatedAt: data.time_last_update_utc ?? null,
  };
}
