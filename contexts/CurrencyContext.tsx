import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiFetch } from '../services/apiService';
import { API_ENDPOINTS } from '../client-api/endpoints';
import {
  BASE_CURRENCY,
  CURRENCY_LABELS,
  DEFAULT_RATES,
  SUPPORTED_CURRENCIES,
  fetchLiveRatesToXaf,
  formatMoney,
  fromXaf,
  toXaf,
  type RatesMap,
  type SupportedCurrency,
} from '../utils/formatMoney';
import { useStoreOptional } from '../services/storeContext';

const STORAGE_KEY = 'agm.preferredCurrency';
/** Refresh live FX about once per session hour (provider updates daily). */
const LIVE_FX_REFRESH_MS = 60 * 60 * 1000;

type ExchangeRatesPayload = {
  baseCurrency: string;
  supported: string[];
  rates: RatesMap;
  updatedAt: string | null;
};

type CurrencyContextValue = {
  currency: string;
  rates: RatesMap;
  supported: readonly string[];
  ratesReady: boolean;
  setCurrency: (code: string) => Promise<void>;
  formatXaf: (amountXaf: number, opts?: { amountOnly?: boolean }) => string;
  toXaf: (amount: number, fromCurrency?: string) => number;
  fromXaf: (amountXaf: number, toCurrency?: string) => number;
  currencyLabel: (code?: string) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readStoredCurrency(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && SUPPORTED_CURRENCIES.includes(v as SupportedCurrency)) return v;
  } catch {
    /* ignore */
  }
  return BASE_CURRENCY;
}

function patchLocalSessionCurrency(code: string) {
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return;
    const u = JSON.parse(raw);
    if (u && typeof u === 'object') {
      u.preferredCurrency = code;
      localStorage.setItem('currentUser', JSON.stringify(u));
    }
  } catch {
    /* ignore */
  }
}

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useStoreOptional();
  const user = store?.user ?? null;
  const [currency, setCurrencyState] = useState<string>(readStoredCurrency);
  const [rates, setRates] = useState<RatesMap>({ ...DEFAULT_RATES });
  const [supported, setSupported] = useState<readonly string[]>(SUPPORTED_CURRENCIES);
  const [ratesReady, setRatesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadRates = async () => {
      let next: RatesMap = { ...DEFAULT_RATES };

      // 1) Live FX (EUR peg → XAF) so conversion works even if admin API is down.
      try {
        const live = await fetchLiveRatesToXaf();
        if (live?.rates) {
          next = { ...next, ...live.rates, [BASE_CURRENCY]: 1 };
        }
      } catch {
        /* keep defaults */
      }

      // 2) Admin/API rates override live when available.
      try {
        const data = await apiFetch<ExchangeRatesPayload>(API_ENDPOINTS.exchangeRates.list, {
          silent401: true,
        } as any);
        if (data?.rates) {
          next = { ...next, ...data.rates, [BASE_CURRENCY]: 1 };
        }
        if (Array.isArray(data?.supported) && data.supported.length) {
          const merged = Array.from(
            new Set([...SUPPORTED_CURRENCIES, ...data.supported.map((s) => s.toUpperCase())]),
          );
          if (!cancelled) setSupported(merged);
        }
      } catch {
        /* keep live/defaults */
      }

      if (!cancelled) {
        setRates(next);
        setRatesReady(true);
      }
    };

    void loadRates();
    const timer = window.setInterval(() => {
      void loadRates();
    }, LIVE_FX_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  // Sync from logged-in user preference when available.
  useEffect(() => {
    const pref = user?.preferredCurrency;
    if (pref && SUPPORTED_CURRENCIES.includes(pref.toUpperCase() as SupportedCurrency)) {
      const code = pref.toUpperCase();
      setCurrencyState(code);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        /* ignore */
      }
    }
  }, [user?.id, user?.preferredCurrency]);

  const setCurrency = useCallback(
    async (code: string) => {
      const next = code.toUpperCase();
      if (!SUPPORTED_CURRENCIES.includes(next as SupportedCurrency)) return;
      setCurrencyState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      patchLocalSessionCurrency(next);
      if (user?.id) {
        try {
          await apiFetch(API_ENDPOINTS.users.update(user.id), {
            method: 'PUT',
            body: JSON.stringify({ preferredCurrency: next }),
          });
        } catch {
          /* preference still applied locally */
        }
      }
    },
    [user?.id],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      rates,
      supported,
      ratesReady,
      setCurrency,
      formatXaf: (amountXaf, opts) =>
        formatMoney(amountXaf, { currency, rates, amountOnly: opts?.amountOnly }),
      toXaf: (amount, fromCurrency) => toXaf(amount, fromCurrency || currency, rates),
      fromXaf: (amountXaf, toCurrency) => fromXaf(amountXaf, toCurrency || currency, rates),
      currencyLabel: (code) => CURRENCY_LABELS[(code || currency).toUpperCase()] ?? (code || currency),
    }),
    [currency, rates, supported, ratesReady, setCurrency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return ctx;
}

/** Safe hook when provider may be absent (tests). */
export function useCurrencyOptional(): CurrencyContextValue | null {
  return useContext(CurrencyContext);
}
