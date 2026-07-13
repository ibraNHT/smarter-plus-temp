
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { Mail, Lock } from 'lucide-react';
import { AuthOnboardingLayout } from '../../components/AuthOnboardingLayout';
import { SEO } from '../../components/SEO';
import { SEO_PAGE_META } from '../../services/seo/seoConfig';

export const VerifyEmail: React.FC = () => {
  const { pendingRegistration, verifyEmail } = useStore();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!pendingRegistration) {
    setTimeout(() => navigate('/register'), 100);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await verifyEmail(code);
    setIsLoading(false);
    if (success) {
      if (pendingRegistration!.role === 'PRODUCER') {
        navigate('/producer/dashboard');
      } else {
        navigate('/');
      }
    } else {
      setError(t('verify.invalid'));
    }
  };

  return (
    <>
      <SEO
        title={SEO_PAGE_META.verifyEmail.title}
        description={SEO_PAGE_META.verifyEmail.description}
        url="/verify-email"
        noindex
        locale={language}
      />
    <AuthOnboardingLayout centerContent maxWidth="md">
      <div className="w-full space-y-6 sm:space-y-8 bg-white p-5 sm:p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 sm:h-16 sm:w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {t('verify.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            {t('verify.desc')}
          </p>
          <p className="mt-3 text-xs font-mono bg-gray-100 px-3 py-2 rounded-lg inline-block text-gray-500 break-all max-w-full">
            {t('verify.sent_to')} {pendingRegistration.email}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 text-center mb-2">
              {t('verify.label')}
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="code"
                id="code"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 text-lg border-gray-300 rounded-md p-3 text-center tracking-[0.35em] bg-white text-gray-900"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length < 6}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md transition-colors disabled:opacity-60 min-h-[44px]"
          >
            {isLoading ? 'Verifying…' : t('verify.submit')}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 leading-relaxed">
          {t('verify.check')}
        </p>
      </div>
    </AuthOnboardingLayout>
    </>
  );
};
