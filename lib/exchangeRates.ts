const FX_URL = 'https://open.er-api.com/v6/latest/USD';
const CACHE_KEY = 'smarter-panel-fx-usd';
const CACHE_TTL_MS = 60 * 60 * 1000;

/** Last-resort USD-base rates if the network and cache are both unavailable. */
export const FALLBACK_USD_RATES: Record<string, number> = {
  USD: 1,
  CAD: 1.36,
  EUR: 0.92,
  GBP: 0.79,
  XAF: 606,
  XOF: 606,
  NGN: 1550,
};

type CachedRates = { rates: Record<string, number>; fetchedAt: number };

let memoryCache: CachedRates | null = null;
let inflight: Promise<Record<string, number>> | null = null;

function readLocalCache(): CachedRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRates;
    if (!parsed?.rates || typeof parsed.fetchedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalCache(entry: CachedRates) {
  memoryCache = entry;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore quota */
  }
}

export function convertAmount(
  amount: number,
  fromCode: string,
  toCode: string,
  rates?: Record<string, number> | null
): number {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  const from = (fromCode || 'XAF').toUpperCase();
  const to = (toCode || from).toUpperCase();
  if (from === to) return n;
  const table = rates && Object.keys(rates).length ? rates : FALLBACK_USD_RATES;
  const fromRate = table[from];
  const toRate = table[to];
  if (!fromRate || !toRate) return n;
  return n * (toRate / fromRate);
}

export async function fetchUsdRates(force = false): Promise<Record<string, number>> {
  const now = Date.now();
  const cached = memoryCache || readLocalCache();
  if (!force && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    memoryCache = cached;
    return cached.rates;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(FX_URL);
      if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
      const json = await res.json();
      const rates = json?.rates as Record<string, number> | undefined;
      if (json?.result !== 'success' || !rates || typeof rates.USD !== 'number') {
        throw new Error('Invalid FX payload');
      }
      const entry: CachedRates = { rates, fetchedAt: Date.now() };
      writeLocalCache(entry);
      return rates;
    } catch {
      if (cached?.rates) return cached.rates;
      return FALLBACK_USD_RATES;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
