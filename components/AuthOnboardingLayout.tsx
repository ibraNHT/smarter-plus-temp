import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { AuthMobileBrand } from './AuthMobileBrand';

type MaxWidth = 'md' | 'lg' | '2xl' | '3xl';

const maxWidthClass: Record<MaxWidth, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export interface AuthOnboardingLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  backTo?: { href: string; label: string };
  maxWidth?: MaxWidth;
  reserveStickyActions?: boolean;
  centerContent?: boolean;
}

/** Shared shell for register / verify onboarding routes (mobile-first). */
export const AuthOnboardingLayout: React.FC<AuthOnboardingLayoutProps> = ({
  children,
  title,
  subtitle,
  backTo,
  maxWidth = '2xl',
  reserveStickyActions = false,
  centerContent = false,
}) => (
  <div
    className={`min-h-[100dvh] bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 ${
      centerContent ? 'flex flex-col justify-center' : ''
    } ${reserveStickyActions ? 'auth-onboarding-reserve-actions' : ''}`}
  >
    <div className={`${maxWidthClass[maxWidth]} w-full mx-auto`}>
      <AuthMobileBrand />

      {backTo && (
        <Link
          to={backTo.href}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800 mt-3 mb-1 -ml-0.5 py-2 min-h-[44px]"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          {backTo.label}
        </Link>
      )}

      {(title || subtitle) && (
        <header className={backTo ? 'mt-2 mb-6' : 'mt-2 mb-6 sm:mb-8'}>
          {title && (
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{subtitle}</p>
          )}
        </header>
      )}

      {children}
    </div>
  </div>
);

export interface AuthFormActionsProps {
  children: React.ReactNode;
  stickyOnMobile?: boolean;
}

export const AuthFormActions: React.FC<AuthFormActionsProps> = ({
  children,
  stickyOnMobile = true,
}) => (
  <div className={stickyOnMobile ? 'auth-sticky-form-actions mt-6 sm:mt-0 pt-5' : 'pt-5'}>
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3 w-full">
      {children}
    </div>
  </div>
);

export const authActionButtonSecondary =
  'w-full sm:w-auto inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 min-h-[44px]';

export const authActionButtonPrimary =
  'w-full sm:w-auto inline-flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]';
