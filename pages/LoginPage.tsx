
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../services/storeContext';
import { useTranslation } from '../services/i18nContext';
import { apiFetch } from '../services/apiService';
import { Sprout, Lock, Mail, X, Phone } from 'lucide-react';

const AFRICA_COUNTRY_CODES = [
  // Central Africa
  { code: '+237', country: 'Cameroon' },
  { code: '+236', country: 'Central African Rep' },
  { code: '+235', country: 'Chad' },
  { code: '+242', country: 'Congo Rep' },
  { code: '+243', country: 'DR Congo' },
  { code: '+240', country: 'Equatorial Guinea' },
  { code: '+241', country: 'Gabon' },
  // West Africa
  { code: '+234', country: 'Nigeria' },
  { code: '+233', country: 'Ghana' },
  { code: '+225', country: 'Ivory Coast' },
  { code: '+221', country: 'Senegal' },
  { code: '+223', country: 'Mali' },
  { code: '+226', country: 'Burkina Faso' },
  { code: '+227', country: 'Niger' },
  { code: '+228', country: 'Togo' },
  { code: '+229', country: 'Benin' },
  { code: '+224', country: 'Guinea' },
  // East Africa
  { code: '+254', country: 'Kenya' },
  { code: '+255', country: 'Tanzania' },
  { code: '+256', country: 'Uganda' },
  { code: '+250', country: 'Rwanda' },
  { code: '+257', country: 'Burundi' },
  { code: '+251', country: 'Ethiopia' },
  { code: '+252', country: 'Somalia' },
];

/** Matches backend RELAXED_PHONE_PATTERN (optional +, digits/spaces/hyphens, 4–32 chars). */
const RELAXED_PHONE_PATTERN = /^\+?[\d\s-]{4,32}$/;

function buildFullPhone(countryCode: string, local: string): string {
  const compactLocal = local.replace(/\s+/g, '').replace(/-/g, '');
  const cc = countryCode.trim().startsWith('+') ? countryCode.trim() : `+${countryCode.trim()}`;
  return `${cc}${compactLocal}`;
}

type ForgotStep = 'phone' | 'otp' | 'password';

export const LoginPage: React.FC = () => {
  const { login } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('+237');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [error, setError] = useState('');
  const [passwordResetBanner, setPasswordResetBanner] = useState('');

  const [forgotStep, setForgotStep] = useState<ForgotStep>('phone');
  const [forgotPhoneCode, setForgotPhoneCode] = useState('+237');
  const [forgotPhoneLocal, setForgotPhoneLocal] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const resetForgotModalState = () => {
    setForgotStep('phone');
    setForgotPhoneCode('+237');
    setForgotPhoneLocal('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotResetToken(null);
    setForgotError('');
    setForgotLoading(false);
  };

  const openForgotModal = () => {
    resetForgotModalState();
    if (loginMethod === 'phone') {
      setForgotPhoneCode(phoneCode);
      setForgotPhoneLocal(phone);
    }
    setIsForgotPasswordOpen(true);
  };

  const closeForgotModal = () => {
    setIsForgotPasswordOpen(false);
    resetForgotModalState();
  };

  const forgotFullPhone = () => buildFullPhone(forgotPhoneCode, forgotPhoneLocal);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordResetBanner('');
    setIsLoading(true);
    try {
      const identifier = loginMethod === 'email' ? email : `${phoneCode}${phone}`;
      const result = await login(identifier, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const requestForgotOtp = async () => {
    setForgotError('');
    const full = forgotFullPhone();
    if (forgotPhoneLocal.replace(/\s+/g, '').replace(/-/g, '').length < 6) {
      setForgotError(t('login.phoneLocalMin'));
      return;
    }
    if (!RELAXED_PHONE_PATTERN.test(full)) {
      setForgotError(t('login.invalidPhoneFormat'));
      return;
    }
    setForgotLoading(true);
    try {
      await apiFetch<void>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ phone: full }),
        silent401: true,
      });
      setForgotStep('otp');
    } catch (e) {
      setForgotError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  const verifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    const code = forgotOtp.trim();
    if (!code) {
      setForgotError(t('verify.invalid'));
      return;
    }
    setForgotLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; resetToken?: string; message: string }>(
        '/api/auth/forgot-password/verify-otp',
        {
          method: 'POST',
          body: JSON.stringify({ phone: forgotFullPhone(), code }),
          silent401: true,
        },
      );
      if (!res.success || !res.resetToken) {
        setForgotError(res.message || t('verify.invalid'));
        return;
      }
      setForgotResetToken(res.resetToken);
      setForgotStep('password');
    } catch (e) {
      setForgotError(e instanceof Error ? e.message : t('verify.invalid'));
    } finally {
      setForgotLoading(false);
    }
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (forgotNewPassword.length < 8) {
      setForgotError(t('login.passwordMinLength'));
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError(t('login.passwordsMustMatch'));
      return;
    }
    if (!forgotResetToken) {
      setForgotError(t('verify.invalid'));
      return;
    }
    setForgotLoading(true);
    try {
      await apiFetch<void>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: forgotResetToken, newPassword: forgotNewPassword }),
        silent401: true,
      });
      setPasswordResetBanner(t('login.passwordResetSuccess'));
      closeForgotModal();
    } catch (e) {
      setForgotError(e instanceof Error ? e.message : 'Reset failed.');
    } finally {
      setForgotLoading(false);
    }
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
            {/* Login Method Toggle */}
            <div className="flex rounded-md shadow-sm border border-gray-300 p-1 bg-gray-50 mb-4">
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 text-sm font-medium rounded-md flex justify-center items-center transition-colors ${loginMethod === 'phone' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Phone className="w-4 h-4 mr-2" /> Phone Num
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 text-sm font-medium rounded-md flex justify-center items-center transition-colors ${loginMethod === 'email' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Mail className="w-4 h-4 mr-2" /> Email
              </button>
            </div>

            <div className="rounded-md shadow-sm -space-y-px">
              {loginMethod === 'email' ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required={loginMethod === 'email'}
                    className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white"
                    placeholder={t('login.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              ) : (
                <div className="relative flex">
                  <select
                    className="w-24 sm:w-32 appearance-none rounded-none relative block px-2 py-3 border border-r-0 border-gray-300 text-gray-600 rounded-tl-md focus:outline-none focus:ring-primary-500 sm:text-sm bg-gray-50 overflow-hidden"
                    value={phoneCode}
                    onChange={e => setPhoneCode(e.target.value)}
                  >
                    {AFRICA_COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      required={loginMethod === 'phone'}
                      className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-tr-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white"
                      placeholder="612 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}
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

            {passwordResetBanner && (
              <div className="text-green-700 text-sm text-center font-medium bg-green-50 p-2 rounded border border-green-100">
                {passwordResetBanner}
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>
            )}

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <button type="button" onClick={openForgotModal} className="font-medium text-primary-600 hover:text-primary-500">
                  {t('login.forgotPassword')}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in…' : t('login.signIn')}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don't have an account? <Link to="/register" className="font-bold text-primary-600 hover:underline">Register here</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password — SMS OTP + reset (matches API) */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 relative shadow-xl">
            <button
              type="button"
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('login.resetTitle')}</h3>

            {forgotStep === 'phone' && (
              <>
                <p className="text-sm text-gray-500 mb-4">{t('login.resetDesc')}</p>
                {forgotError && (
                  <div className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{forgotError}</div>
                )}
                <div className="space-y-4">
                  <div className="flex rounded-md border border-gray-300 overflow-hidden">
                    <select
                      className="w-24 sm:w-32 shrink-0 px-2 py-2.5 border-0 border-r border-gray-200 text-gray-700 text-sm bg-gray-50"
                      value={forgotPhoneCode}
                      onChange={(e) => setForgotPhoneCode(e.target.value)}
                    >
                      {AFRICA_COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                    <div className="relative flex-1 min-w-0">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        required
                        className="w-full py-2.5 pl-8 pr-2 border-0 text-sm text-gray-900 focus:ring-0"
                        placeholder="612 345 678"
                        value={forgotPhoneLocal}
                        onChange={(e) => setForgotPhoneLocal(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={() => void requestForgotOtp()}
                    className="w-full bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-60"
                  >
                    {forgotLoading ? '…' : t('login.sendReset')}
                  </button>
                </div>
              </>
            )}

            {forgotStep === 'otp' && (
              <form onSubmit={(e) => void verifyForgotOtp(e)} className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">{t('login.forgotAfterSend')}</p>
                <p className="text-xs text-gray-400 mb-3 break-all">{forgotFullPhone()}</p>
                {forgotError && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{forgotError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('verify.label')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500 tracking-widest"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="123456"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-60"
                >
                  {forgotLoading ? '…' : t('otp.verify')}
                </button>
                <div className="flex flex-col gap-2 text-sm">
                  <button
                    type="button"
                    className="text-primary-600 hover:underline text-left"
                    disabled={forgotLoading}
                    onClick={() => void requestForgotOtp()}
                  >
                    {t('otp.sendCode')}
                  </button>
                  <button
                    type="button"
                    className="text-gray-600 hover:underline text-left"
                    onClick={() => {
                      setForgotStep('phone');
                      setForgotOtp('');
                      setForgotError('');
                    }}
                  >
                    {t('login.changePhoneNumber')}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'password' && (
              <form onSubmit={(e) => void submitNewPassword(e)} className="space-y-4">
                {forgotError && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{forgotError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.newPasswordLabel')}</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.confirmNewPasswordLabel')}</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-60"
                >
                  {forgotLoading ? '…' : t('login.saveNewPassword')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
