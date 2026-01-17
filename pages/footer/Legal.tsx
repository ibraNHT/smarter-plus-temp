
import React from 'react';
import { useTranslation } from '../../services/i18nContext';
import { Shield, FileText } from 'lucide-react';

export const Terms: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 md:p-12 rounded-lg shadow-sm">
        <div className="flex items-center mb-8 border-b border-gray-200 pb-6">
           <FileText className="h-10 w-10 text-gray-400 mr-4" />
           <h1 className="text-3xl font-bold text-gray-900">{t('terms.title')}</h1>
        </div>
        
        <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
           <p>Welcome to AgriMarket Connect. By accessing our website and using our services, you agree to be bound by the following terms and conditions.</p>
           
           <h3 className="text-xl font-bold text-gray-800">1. User Accounts</h3>
           <p>You are responsible for maintaining the confidentiality of your account credentials. Any activity occurring under your account is your responsibility.</p>
           
           <h3 className="text-xl font-bold text-gray-800">2. Marketplace Transactions</h3>
           <p>AgriMarket Connect acts as an intermediary platform. While we vet producers, the quality of goods (unless sold via ATI Store) is the responsibility of the individual producer.</p>
           
           <h3 className="text-xl font-bold text-gray-800">3. Payments & Fees</h3>
           <p>All payments are processed securely. A 5% service fee applies to clients, and a 15% commission is deducted from producer earnings.</p>
           
           <h3 className="text-xl font-bold text-gray-800">4. Prohibited Conduct</h3>
           <p>Sharing personal contact information (phone numbers, emails) via chat prior to a confirmed payment is strictly prohibited and may result in account suspension.</p>
        </div>
      </div>
    </div>
  );
};

export const Privacy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 md:p-12 rounded-lg shadow-sm">
        <div className="flex items-center mb-8 border-b border-gray-200 pb-6">
           <Shield className="h-10 w-10 text-green-600 mr-4" />
           <h1 className="text-3xl font-bold text-gray-900">{t('privacy.title')}</h1>
        </div>
        
        <div className="prose prose-green max-w-none text-gray-600 space-y-6">
           <p>Your privacy is critically important to us. This policy explains how we collect, use, and protect your personal information.</p>
           
           <h3 className="text-xl font-bold text-gray-800">1. Information Collection</h3>
           <p>We collect information you provide directly to us, such as your name, email, phone number, and location data for delivery purposes.</p>
           
           <h3 className="text-xl font-bold text-gray-800">2. Data Usage</h3>
           <p>We use your data to facilitate orders, process payments, improve our services, and communicate with you about your account.</p>
           
           <h3 className="text-xl font-bold text-gray-800">3. Data Sharing</h3>
           <p>We do not sell your personal data. We share data only with third parties necessary to provide our services (e.g., payment processors, delivery partners).</p>
           
           <h3 className="text-xl font-bold text-gray-800">4. Security</h3>
           <p>We implement robust security measures, including encryption and secure servers, to protect your data from unauthorized access.</p>
        </div>
      </div>
    </div>
  );
};
