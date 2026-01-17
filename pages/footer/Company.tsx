
import React from 'react';
import { useTranslation } from '../../services/i18nContext';
import { Briefcase, Users, Award, Globe } from 'lucide-react';

export const Jobs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">{t('jobs.title')}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('jobs.subtitle')}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
           <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition bg-gray-50">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                 <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Logistics Coordinator</h3>
              <p className="text-gray-600 mb-4">Manage our network of focal points and delivery partners across Cameroon.</p>
              <button className="text-primary-600 font-bold hover:underline">Apply Now</button>
           </div>
           <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition bg-gray-50">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                 <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Community Manager</h3>
              <p className="text-gray-600 mb-4">Engage with our producers and clients to build a thriving community.</p>
              <button className="text-primary-600 font-bold hover:underline">Apply Now</button>
           </div>
           <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition bg-gray-50">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                 <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sales Representative</h3>
              <p className="text-gray-600 mb-4">Onboard new farmers and businesses to the AgriMarket platform.</p>
              <button className="text-primary-600 font-bold hover:underline">Apply Now</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export const Partners: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">{t('partners.title')}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">We collaborate with industry leaders to bring you the best services.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
           <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
              <Award className="h-16 w-16 text-orange-500 mb-4" />
              <span className="font-bold text-xl text-gray-800">Orange Money</span>
           </div>
           <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
              <Award className="h-16 w-16 text-yellow-500 mb-4" />
              <span className="font-bold text-xl text-gray-800">MTN Mobile Money</span>
           </div>
           <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
              <Award className="h-16 w-16 text-blue-600 mb-4" />
              <span className="font-bold text-xl text-gray-800">UBA Bank</span>
           </div>
           <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
              <Award className="h-16 w-16 text-green-600 mb-4" />
              <span className="font-bold text-xl text-gray-800">Min. of Agriculture</span>
           </div>
        </div>

        <div className="mt-20 bg-primary-900 rounded-2xl p-12 text-center text-white">
           <h2 className="text-3xl font-bold mb-4">Become a Partner</h2>
           <p className="text-primary-100 mb-8 max-w-2xl mx-auto">Interested in integrating your logistics, financial, or agricultural services with AgriMarket Connect?</p>
           <button className="bg-white text-primary-900 px-8 py-3 rounded-full font-bold hover:bg-primary-50 transition">Contact Partnerships</button>
        </div>
      </div>
    </div>
  );
};
