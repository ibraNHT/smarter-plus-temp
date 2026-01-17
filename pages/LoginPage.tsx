
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../services/storeContext';
import { useTranslation } from '../services/i18nContext';
import { UserRole } from '../types';
import { Sprout, Lock, Mail, X, Tractor, ShoppingBag, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, clients, producers } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check Clients
    const client = clients.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (client) {
        login(UserRole.CLIENT, client.name, client.id);
        navigate('/');
        return;
    }

    // Check Producers
    const producer = producers.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (producer) {
        login(UserRole.PRODUCER, producer.name, producer.id);
        navigate('/producer/dashboard');
        return;
    }

    setError('User not found. Please register.');
  };

  const handleResetPassword = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Reset link sent to ${resetEmail}`);
      setIsForgotPasswordOpen(false);
      setResetEmail('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-gray-50">
      
      {/* Left Side - Image/Branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary-900 items-center justify-center p-12 relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover opacity-20"></div>
         <div className="relative z-10 text-center text-white">
            <Sprout className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl font-extrabold mb-4">AgriMarket Connect</h1>
            <p className="text-xl text-primary-200">Bridging the gap between producers and consumers.</p>
         </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {t('login.title')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {t('login.subtitle')}
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleStandardLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white"
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>
            )}

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="font-medium text-primary-600 hover:text-primary-500">
                  {t('login.forgotPassword')}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md transition-colors"
              >
                {t('login.signIn')}
              </button>
            </div>
          </form>

          {/* Demo Accounts Section (Restored) */}
          <div className="border-t border-gray-200 pt-6 mt-6">
             <h3 className="text-center text-sm font-bold text-gray-500 mb-4">{t('login.demo')}</h3>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { login(UserRole.PRODUCER, 'Green Valley Farms', 'prod-1'); navigate('/producer/dashboard'); }} className="flex items-center justify-center px-4 py-2 border border-green-200 rounded-md shadow-sm text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100">
                   <Tractor className="h-4 w-4 mr-2" /> Producer 1
                </button>
                <button onClick={() => { login(UserRole.PRODUCER, 'John Highland', 'prod-2'); navigate('/producer/dashboard'); }} className="flex items-center justify-center px-4 py-2 border border-green-200 rounded-md shadow-sm text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100">
                   <Tractor className="h-4 w-4 mr-2" /> Producer 2
                </button>
                <button onClick={() => { login(UserRole.CLIENT, 'Jane Doe', 'client-demo'); navigate('/'); }} className="flex items-center justify-center px-4 py-2 border border-blue-200 rounded-md shadow-sm text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                   <ShoppingBag className="h-4 w-4 mr-2" /> Client
                </button>
             </div>
          </div>

          <div className="relative my-6">
             <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
             </div>
             <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or</span>
             </div>
          </div>
          
          <div className="text-center mt-4">
             <p className="text-sm text-gray-600">
                Don't have an account? <Link to="/register" className="font-bold text-primary-600 hover:underline">Register here</Link>
             </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-sm w-full p-6 relative shadow-xl">
               <button onClick={() => setIsForgotPasswordOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5"/></button>
               <h3 className="text-lg font-bold text-gray-900 mb-2">{t('login.resetTitle')}</h3>
               <p className="text-sm text-gray-500 mb-4">{t('login.resetDesc')}</p>
               <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                     <input 
                        type="email" required 
                        className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                     />
                  </div>
                  <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700">
                     {t('login.sendReset')}
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};
