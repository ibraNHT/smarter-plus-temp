import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';

import { useStore } from '../services/storeContext';
import { useTranslation } from '../services/i18nContext';
import {
  findProducerForUser,
  isProducerPendingApproval,
  isProducerRejected,
} from '../utils/producerAccountStatus';

/**
 * Site-wide alert for producers whose account is not yet approved (or was
 * rejected). Shown below the navbar on every page so users always know the
 * state of their seller account — not only on the dashboard.
 */
export const ProducerPendingBanner: React.FC = () => {
  const { user, producers } = useStore();
  const { t } = useTranslation();

  const producer = findProducerForUser(producers, user);
  const pending = isProducerPendingApproval(user, producer);
  const rejected = isProducerRejected(user, producer);

  if (!pending && !rejected) return null;

  const isRejected = rejected;
  const border = isRejected ? 'border-red-400' : 'border-amber-400';
  const bg = isRejected ? 'bg-red-50' : 'bg-amber-50';
  const titleColor = isRejected ? 'text-red-900' : 'text-amber-900';
  const bodyColor = isRejected ? 'text-red-800' : 'text-amber-800';
  const Icon = isRejected ? XCircle : Clock;

  return (
    <div
      className={`${bg} border-b-4 ${border} shadow-sm`}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex flex-shrink-0 items-start gap-3 min-w-0 flex-1">
            <Icon
              className={`h-6 w-6 flex-shrink-0 mt-0.5 ${isRejected ? 'text-red-500' : 'text-amber-500'}`}
              aria-hidden
            />
            <div className="min-w-0">
              <p className={`text-sm sm:text-base font-bold ${titleColor}`}>
                {isRejected
                  ? t('producerStatus.rejectedTitle')
                  : t('producerStatus.pendingTitle')}
              </p>
              <p className={`text-sm mt-1 ${bodyColor}`}>
                {isRejected
                  ? t('producerStatus.rejectedMsg')
                  : t('producerStatus.pendingMsg')}
              </p>
              {!isRejected && (
                <p className={`text-xs mt-2 flex items-start gap-1.5 ${bodyColor} opacity-90`}>
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" aria-hidden />
                  {t('producerStatus.pendingHint')}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0 sm:pt-0.5 pl-9 sm:pl-0">
            <Link
              to="/producer/profile/info"
              className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isRejected
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
              }`}
            >
              {isRejected
                ? t('producerStatus.viewProfile')
                : t('producerStatus.completeVerification')}
            </Link>
            <Link
              to="/producer/dashboard"
              className={`inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isRejected
                  ? 'border-red-300 text-red-800 hover:bg-red-100 focus:ring-red-400'
                  : 'border-amber-300 text-amber-900 hover:bg-amber-100 focus:ring-amber-400'
              }`}
            >
              {t('producerStatus.goToDashboard')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
