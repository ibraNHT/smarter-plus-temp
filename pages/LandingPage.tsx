import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../services/i18nContext';
import { ArrowRight, CheckCircle, BarChart3, Truck, ShoppingBasket, Tractor } from 'lucide-react';
import { SEO } from '../components/SEO';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      <SEO
        title="Wholesale & Retail Agricultural Products"
        description="AgriMarket Connect connects you to verified local farmers for wholesale supply and the ATI Store for premium retail agricultural products. Buy direct, buy secure."
        url="/"
      />
      {/* Hero Section */}
      <div className="relative bg-primary-900">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-20"
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
            alt="Farm fields"
          />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('landing.hero.title')}
          </h1>
          <p className="mt-6 text-xl text-primary-100 max-w-3xl mx-auto">
            {t('landing.hero.subtitle')}
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 max-w-4xl mx-auto">
            {/* Producer Market Option */}
            <div className="bg-white rounded-xl p-6 shadow-xl transform transition hover:scale-105 text-left border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Tractor className="h-8 w-8 text-green-700" />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded uppercase tracking-wide">{t('landing.card.wholesale')}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('landing.producerMarket.title')}</h3>
              <p className="text-gray-600 mb-6">{t('landing.producerMarket.desc')}</p>
              <Link to="/market/producers" className="inline-flex items-center text-green-600 font-semibold hover:text-green-800">
                {t('landing.cta.browse')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* ATI Store Option */}
            <div className="bg-white rounded-xl p-6 shadow-xl transform transition hover:scale-105 text-left border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingBasket className="h-8 w-8 text-blue-700" />
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wide">{t('landing.card.retail')}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('landing.atiStore.title')}</h3>
              <p className="text-gray-600 mb-6">{t('landing.atiStore.desc')}</p>
              <Link to="/market/ati" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-800">
                {t('landing.cta.shop')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-primary-200 text-sm uppercase tracking-wider mb-4">{t('landing.new')}</p>
            <div className="flex justify-center gap-4">
              <Link to="/register" className="bg-white text-primary-900 px-6 py-3 rounded-md font-bold hover:bg-primary-50 transition">
                {t('landing.createAccount')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="py-16 bg-gray-50 overflow-hidden lg:py-24">
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
          <div className="relative">
            <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Platform Features
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
              Connecting you to the source, however you choose to buy.
            </p>
          </div>

          <div className="relative mt-12 lg:mt-24 lg:grid lg:grid-cols-3 lg:gap-8">
            {[
              {
                name: 'Verified Sources',
                description: 'Both independent producers and ATI store items are vetted for quality assurance.',
                icon: CheckCircle,
              },
              {
                name: 'Flexible Logistics',
                description: 'Choose from home delivery or pickup from authorized focal points.',
                icon: Truck,
              },
              {
                name: 'Secure Payments',
                description: 'All transactions are protected via escrow until delivery is confirmed.',
                icon: BarChart3,
              },
            ].map((item) => (
              <div key={item.name} className="mt-10 lg:mt-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{item.name}</h3>
                  <p className="mt-2 text-base text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};