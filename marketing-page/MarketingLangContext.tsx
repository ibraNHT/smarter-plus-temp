// src/marketing-page/MarketingLangContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MarketingLangContextType {
  lang: string;
  setLang: (lang: string) => void;
}

const MarketingLangContext = createContext<MarketingLangContextType | undefined>(undefined);

export function MarketingLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState('en');
  return (
    <MarketingLangContext.Provider value={{ lang, setLang }}>
      {children}
    </MarketingLangContext.Provider>
  );
}

export function useMarketingLang() {
  const context = useContext(MarketingLangContext);
  if (!context) {
    throw new Error('useMarketingLang must be used within a MarketingLangProvider');
  }
  return context;
}