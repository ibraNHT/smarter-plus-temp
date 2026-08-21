import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CURRENCY_CODES, formatCurrency, isSupportedCurrency, type CurrencyCode } from '../constants';
import { convertAmount, fetchUsdRates } from '../lib/exchangeRates';

type LocationLike = { id: string; currency?: string | null };

interface CurrencyContextValue {
  displayCurrency: CurrencyCode;
  setDisplayCurrency: (code: string) => void;
  orgCurrency: CurrencyCode;
  workingCurrency: CurrencyCode;
  rates: Record<string, number> | null;
  formatMoney: (amount: number, fromCode?: string) => string;
  toDisplay: (amount: number, fromCode?: string) => number;
  bookCurrencyFor: (item: { locationId?: string; location?: LocationLike; currency?: string | null }) => CurrencyCode;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

function asCode(value: unknown, fallback: CurrencyCode = 'XAF'): CurrencyCode {
  return isSupportedCurrency(value) ? value : fallback;
}

export function CurrencyProvider({
  orgCurrency: orgCurrencyRaw,
  locationId,
  locations = [],
  children,
}: {
  orgCurrency?: string | null;
  locationId?: string | null;
  locations?: LocationLike[];
  children: React.ReactNode;
}) {
  const orgCurrency = asCode(orgCurrencyRaw, 'XAF');
  const selectedLocation = locationId && locationId !== 'all'
    ? locations.find((l) => l.id === locationId)
    : undefined;
  const workingCurrency = asCode(selectedLocation?.currency, orgCurrency);

  const [displayCurrency, setDisplayCurrencyState] = useState<CurrencyCode>(workingCurrency);
  const [rates, setRates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    setDisplayCurrencyState(workingCurrency);
  }, [workingCurrency]);

  useEffect(() => {
    let cancelled = false;
    fetchUsdRates().then((next) => {
      if (!cancelled) setRates(next);
    });
    return () => { cancelled = true; };
  }, []);

  const setDisplayCurrency = useCallback((code: string) => {
    setDisplayCurrencyState(asCode(code, workingCurrency));
  }, [workingCurrency]);

  const bookCurrencyFor = useCallback((item: { locationId?: string; location?: LocationLike; currency?: string | null }) => {
    if (isSupportedCurrency(item.currency)) return item.currency;
    const loc = item.location || locations.find((l) => l.id === item.locationId);
    return asCode(loc?.currency, orgCurrency);
  }, [locations, orgCurrency]);

  const formatMoney = useCallback((amount: number, fromCode?: string) => {
    return formatCurrency(amount, displayCurrency, fromCode || workingCurrency, rates);
  }, [displayCurrency, workingCurrency, rates]);

  const toDisplay = useCallback((amount: number, fromCode?: string) => {
    return convertAmount(amount, fromCode || workingCurrency, displayCurrency, rates);
  }, [displayCurrency, workingCurrency, rates]);

  const value = useMemo(
    () => ({
      displayCurrency,
      setDisplayCurrency,
      orgCurrency,
      workingCurrency,
      rates,
      formatMoney,
      toDisplay,
      bookCurrencyFor,
    }),
    [displayCurrency, setDisplayCurrency, orgCurrency, workingCurrency, rates, formatMoney, toDisplay, bookCurrencyFor]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

export const currencySelectOptions = CURRENCY_CODES.map((code) => ({ value: code, label: code }));
