
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { Mail, Lock } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const { pendingRegistration, verifyEmail } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!pendingRegistration) {
    // Redirect if no pending registration found
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {t('verify.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('verify.desc')}
          </p>
          <p className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded inline-block text-gray-500">
            Sent to: {pendingRegistration.email}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-lg border-gray-300 rounded-md p-3 text-center tracking-widest bg-white text-gray-900"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md transition-colors disabled:opacity-60"
            >
              {isLoading ? 'Verifying…' : t('verify.submit')}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Check your email for the verification code.
          </p>
        </div>
      </div>
    </div>
  );
};
