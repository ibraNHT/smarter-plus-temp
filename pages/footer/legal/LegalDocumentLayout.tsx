import React from 'react';
import type { LucideIcon } from 'lucide-react';

export const LEGAL_EFFECTIVE_DATE_EN = '16 August 2026';
export const LEGAL_EFFECTIVE_DATE_FR = '16 août 2026';
export const LEGAL_VERSION = '1.1';

export type LegalDocumentMeta = {
  effectiveDateLabel: string;
  lastUpdatedLabel: string;
  versionLabel: string;
  effectiveDate: string;
};

type Props = {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  subtitle: string;
  meta: LegalDocumentMeta;
  children: React.ReactNode;
};

export const LegalDocumentLayout: React.FC<Props> = ({
  icon: Icon,
  iconClassName = 'text-gray-400',
  title,
  subtitle,
  meta,
  children,
}) => (
  <div className="agm-selectable bg-gray-50 min-h-screen py-8 sm:py-12 md:py-16">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-5 sm:p-8 md:p-12 rounded-lg shadow-sm">
        <div className="flex items-start mb-6 sm:mb-8 border-b border-gray-200 pb-4 sm:pb-6 gap-3 sm:gap-4">
          <Icon className={`h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 ${iconClassName}`} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-sm text-gray-500">
              {meta.effectiveDateLabel}: {meta.effectiveDate} · {meta.lastUpdatedLabel}: {meta.effectiveDate} ·{' '}
              {meta.versionLabel}: {LEGAL_VERSION}
            </p>
          </div>
        </div>

        <div className="prose prose-sm sm:prose-base max-w-none text-gray-600 space-y-6 sm:space-y-8">
          <p className="text-gray-700">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  </div>
);

export const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="space-y-3">
    <h2 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h2>
    {children}
  </section>
);

export const LegalSubSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="space-y-2">
    <h3 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h3>
    {children}
  </div>
);

export const LegalList: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="list-disc pl-5 sm:pl-6 space-y-1">
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
);

export const LegalParagraph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p>{children}</p>
);
