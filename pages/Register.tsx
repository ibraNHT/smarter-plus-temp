
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../services/i18nContext';
import { Tractor, ShoppingBag } from 'lucide-react';

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');

  // Build links preserving the ref param if present
  const producerLink = refCode ? `/register/producer?ref=${refCode}` : '/register/producer';
  const clientLink = refCode ? `/register/client?ref=${refCode}` : '/register/client';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t('register.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('register.subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Producer Card */}
          <Link to={producerLink} className="group relative rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-primary-500 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
              <Tractor className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">{t('register.producer.title')}</h3>
            <p className="mt-2 text-sm text-gray-500">
              {t('register.producer.desc')}
            </p>
            <span className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 group-hover:bg-primary-600 group-hover:text-white">
              {t('register.producer.btn')}
            </span>
          </Link>

          {/* Client Card */}
          <Link to={clientLink} className="group relative rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-500 flex flex-col items-center text-center">
             <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">{t('register.client.title')}</h3>
            <p className="mt-2 text-sm text-gray-500">
              {t('register.client.desc')}
            </p>
            <span className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 group-hover:bg-blue-600 group-hover:text-white">
              {t('register.client.btn')}
            </span>
          </Link>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {t('register.loginLink')}{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              {t('register.loginHere')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
