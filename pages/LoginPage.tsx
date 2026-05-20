
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../services/storeContext';
import { useTranslation } from '../services/i18nContext';
import { apiFetch } from '../services/apiService';
import { API_ENDPOINTS } from '../client-api/endpoints';
import { Sprout, Lock, Mail, X, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthMobileBrand } from '../components/AuthMobileBrand';
import { FieldError, inputErrorClasses, showFieldError } from '../components/FieldError';
import { useFormik } from 'formik';
import { z } from 'zod';

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
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{4,}$/;

function buildFullPhone(countryCode: string, local: string): string {
  const compactLocal = local.replace(/\s+/g, '').replace(/-/g, '');
  const cc = countryCode.trim().startsWith('+') ? countryCode.trim() : `+${countryCode.trim()}`;
  return `${cc}${compactLocal}`;
}

type ForgotStep = 'contact' | 'otp' | 'password';
type ForgotChannel = 'phone' | 'email';
type LoginFormValues = {
  email: string;
  phoneCode: string;
  phone: string;
  password: string;
};

export const LoginPage: React.FC = () => {
  const { login } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [error, setError] = useState('');
  const [passwordResetBanner, setPasswordResetBanner] = useState('');

  const [forgotStep, setForgotStep] = useState<ForgotStep>('contact');
  const [forgotChannel, setForgotChannel] = useState<ForgotChannel>('phone');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const forgotPhoneFormik = useFormik({
    initialValues: { forgotPhoneCode: '+237', forgotPhoneLocal: '' },
    validate: (values) => {
      const schema = z.object({
        forgotPhoneCode: z.string().min(1),
        forgotPhoneLocal: z.string().trim().min(6, t('login.phoneLocalMin')),
      });
      const parsed = schema.safeParse(values);
      if (parsed.success) return {};
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !errs[key]) errs[key] = issue.message;
      }
      return errs;
    },
    onSubmit: async (values) => {
      setForgotError('');
      const full = buildFullPhone(values.forgotPhoneCode, values.forgotPhoneLocal);
      if (!RELAXED_PHONE_PATTERN.test(full)) {
        setForgotError(t('login.invalidPhoneFormat'));
        return;
      }
      setForgotLoading(true);
      try {
        await apiFetch<void>(API_ENDPOINTS.auth.forgotPassword, {
          method: 'POST',
          body: JSON.stringify({ phone: full }),
          silent401: true,
        });
        setForgotChannel('phone');
        setForgotStep('otp');
      } catch (e) {
        setForgotError(e instanceof Error ? e.message : 'Request failed.');
      } finally {
        setForgotLoading(false);
      }
    },
  });

  const forgotEmailFormik = useFormik({
    initialValues: { forgotEmail: '' },
    validate: (values) => {
      const parsed = z.object({ forgotEmail: z.string().trim().email('Please enter a valid email.') }).safeParse(values);
      if (parsed.success) return {};
      return { forgotEmail: parsed.error.issues[0]?.message || 'Invalid email' };
    },
    onSubmit: async (values) => {
      setForgotError('');
      setForgotLoading(true);
      try {
        await apiFetch<void>(API_ENDPOINTS.auth.forgotPassword, {
          method: 'POST',
          body: JSON.stringify({ email: values.forgotEmail.trim().toLowerCase() }),
          silent401: true,
        });
        setForgotChannel('email');
        setForgotStep('otp');
      } catch (e) {
        setForgotError(e instanceof Error ? e.message : 'Request failed.');
      } finally {
        setForgotLoading(false);
      }
    },
  });

  const forgotOtpFormik = useFormik({
    initialValues: { forgotOtp: '' },
    validate: (values) => {
      const parsed = z.object({ forgotOtp: z.string().trim().regex(/^\d{6}$/, t('verify.invalid')) }).safeParse(values);
      if (parsed.success) return {};
      return { forgotOtp: parsed.error.issues[0]?.message || t('verify.invalid') };
    },
    onSubmit: async (values) => {
      setForgotError('');
      setForgotLoading(true);
      try {
        const res = await apiFetch<{ success: boolean; resetToken?: string; message: string }>(
          API_ENDPOINTS.auth.forgotPasswordVerifyOtp,
          {
            method: 'POST',
            body: JSON.stringify(
              forgotChannel === 'email'
                ? { email: forgotEmailFormik.values.forgotEmail.trim().toLowerCase(), code: values.forgotOtp.trim() }
                : { phone: forgotFullPhone(), code: values.forgotOtp.trim() },
            ),
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
    },
  });

  const forgotPasswordFormik = useFormik({
    initialValues: { forgotNewPassword: '', forgotConfirmPassword: '' },
    validate: (values) => {
      const schema = z
        .object({
          forgotNewPassword: z.string().regex(PASSWORD_RULE, t('login.passwordMinLength')),
          forgotConfirmPassword: z.string().min(1, t('login.passwordMinLength')),
        })
        .refine((v) => v.forgotNewPassword === v.forgotConfirmPassword, {
          path: ['forgotConfirmPassword'],
          message: t('login.passwordsMustMatch'),
        });
      const parsed = schema.safeParse(values);
      if (parsed.success) return {};
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !errs[key]) errs[key] = issue.message;
      }
      return errs;
    },
    onSubmit: async (values) => {
      setForgotError('');
      if (!forgotResetToken) {
        setForgotError(t('verify.invalid'));
        return;
      }
      setForgotLoading(true);
      try {
        await apiFetch<void>(API_ENDPOINTS.auth.resetPassword, {
          method: 'POST',
          body: JSON.stringify({ token: forgotResetToken, newPassword: values.forgotNewPassword }),
          silent401: true,
        });
        setPasswordResetBanner(t('login.passwordResetSuccess'));
        closeForgotModal();
      } catch (e) {
        setForgotError(e instanceof Error ? e.message : 'Reset failed.');
      } finally {
        setForgotLoading(false);
      }
    },
  });
  const [forgotResetToken, setForgotResetToken] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const getLoginSchema = (method: 'email' | 'phone') =>
    z.object({
      email:
        method === 'email'
          ? z.string().trim().email('Please enter a valid email.')
          : z.string(),
      phoneCode: z.string().min(1),
      phone:
        method === 'phone'
          ? z.string().trim().min(1, 'Enter your phone number.').min(6, 'Enter a valid phone number (at least 6 digits).')
          : z.string(),
      password: z.string().trim().min(1, 'Enter your password.'),
    });
  const loginFormik = useFormik<LoginFormValues>({
    initialValues: {
      email: '',
      phoneCode: '+237',
      phone: '',
      password: '',
    },
    validate: (values) => {
      const parsed = getLoginSchema(loginMethod).safeParse(values);
      if (parsed.success) return {};
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !next[key]) next[key] = issue.message;
      }
      return next;
    },
    onSubmit: async (values) => {
      setError('');
      setPasswordResetBanner('');
      setIsLoading(true);
      try {
        const identifier =
          loginMethod === 'email'
            ? values.email
            : `${values.phoneCode}${values.phone}`;
        const result = await login(identifier, values.password);
        if (result.success) {
          // If the user was bounced to /login by a 401 elsewhere, send them back
          // to the page they were on after a successful sign-in.
          let redirectTo = '/';
          try {
            const saved = sessionStorage.getItem('postLoginRedirect');
            if (saved) {
              sessionStorage.removeItem('postLoginRedirect');
              if (!saved.startsWith('/login')) redirectTo = saved;
            }
          } catch { /* sessionStorage may be unavailable */ }
          navigate(redirectTo);
        } else {
          setError(result.message || 'Login failed. Please check your credentials.');
        }
      } catch {
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const resetForgotModalState = () => {
    setForgotStep('contact');
    setForgotChannel('phone');
    forgotPhoneFormik.resetForm({ values: { forgotPhoneCode: '+237', forgotPhoneLocal: '' } });
    forgotEmailFormik.resetForm();
    forgotOtpFormik.resetForm();
    forgotPasswordFormik.resetForm();
    setForgotResetToken(null);
    setForgotError('');
    setForgotLoading(false);
  };

  const openForgotModal = () => {
    resetForgotModalState();
    if (loginMethod === 'phone') {
      setForgotChannel('phone');
      forgotPhoneFormik.setValues({ forgotPhoneCode: loginFormik.values.phoneCode, forgotPhoneLocal: loginFormik.values.phone });
    } else {
      setForgotChannel('email');
      forgotEmailFormik.setValues({ forgotEmail: loginFormik.values.email });
    }
    setIsForgotPasswordOpen(true);
  };

  const closeForgotModal = () => {
    setIsForgotPasswordOpen(false);
    resetForgotModalState();
  };

  const forgotFullPhone = () => buildFullPhone(forgotPhoneFormik.values.forgotPhoneCode, forgotPhoneFormik.values.forgotPhoneLocal);

  const handleLoginMethodChange = (method: 'email' | 'phone') => {
    if (method === loginMethod) return;
    setLoginMethod(method);
    loginFormik.setErrors({});
    setError('');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-gray-50">

      {/* Left Side - Image/Branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary-900 items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover opacity-20"></div>
        <div className="relative z-10 text-center text-white">
          <Sprout className="h-16 w-16 lg:h-20 lg:w-20 mx-auto mb-6" />
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-4">AgriMarket Connect</h1>
          <p className="text-lg lg:text-xl text-primary-200">Bridging the gap between producers and consumers.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 md:p-12">
        <div className="max-w-md w-full space-y-8">
          <AuthMobileBrand />
          <div>
            <h2 className="mt-2 md:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
              {t('login.title')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {t('login.subtitle')}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={loginFormik.handleSubmit} noValidate>
            {/* Login Method Toggle */}
            <div className="flex rounded-md shadow-sm border border-gray-300 p-1 bg-gray-50 mb-4">
              <button
                type="button"
                onClick={() => handleLoginMethodChange('phone')}
                className={`flex-1 py-2 text-sm font-medium rounded-md flex justify-center items-center transition-colors ${loginMethod === 'phone' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Phone className="w-4 h-4 mr-2 shrink-0" /> Phone
              </button>
              <button
                type="button"
                onClick={() => handleLoginMethodChange('email')}
                className={`flex-1 py-2 text-sm font-medium rounded-md flex justify-center items-center transition-colors ${loginMethod === 'email' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Mail className="w-4 h-4 mr-2" /> Email
              </button>
            </div>

            <div className="space-y-3">
              {loginMethod === 'email' ? (
                <div>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      className={inputErrorClasses(
                        showFieldError(loginFormik, 'email'),
                        'block w-full rounded-md border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-primary-500 sm:text-sm bg-white',
                      )}
                      placeholder={t('login.emailPlaceholder')}
                      value={loginFormik.values.email}
                      onChange={loginFormik.handleChange}
                      onBlur={loginFormik.handleBlur}
                      name="email"
                    />
                  </div>
                  <FieldError formik={loginFormik} name="email" />
                </div>
              ) : (
                <div>
                  <div className="flex rounded-md shadow-sm">
                    <select
                      className="w-24 sm:w-32 shrink-0 rounded-l-md border border-r-0 border-gray-300 px-2 py-3 text-gray-600 sm:text-sm bg-gray-50"
                      value={loginFormik.values.phoneCode}
                      onChange={loginFormik.handleChange}
                      onBlur={loginFormik.handleBlur}
                      name="phoneCode"
                      aria-label="Country code"
                    >
                      {AFRICA_COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                    <div className="relative flex-1 min-w-0">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="login-phone"
                        type="tel"
                        autoComplete="tel"
                        className={inputErrorClasses(
                          showFieldError(loginFormik, 'phone'),
                          'block w-full rounded-r-md border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-primary-500 sm:text-sm bg-white',
                        )}
                        placeholder="612 345 678"
                        value={loginFormik.values.phone}
                        onChange={loginFormik.handleChange}
                        onBlur={loginFormik.handleBlur}
                        name="phone"
                      />
                    </div>
                  </div>
                  <FieldError formik={loginFormik} name="phone" />
                </div>
              )}

              <div>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={inputErrorClasses(
                      showFieldError(loginFormik, 'password'),
                      'block w-full rounded-md border border-gray-300 py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-primary-500 sm:text-sm bg-white',
                    )}
                    placeholder={t('login.passwordPlaceholder')}
                    value={loginFormik.values.password}
                    onChange={loginFormik.handleChange}
                    onBlur={loginFormik.handleBlur}
                    name="password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <FieldError formik={loginFormik} name="password" />
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
                className="group relative w-full inline-flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-t-lg sm:rounded-lg max-w-sm w-full p-5 sm:p-6 relative shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('login.resetTitle')}</h3>

            {forgotStep === 'contact' && (
              <>
                <p className="text-sm text-gray-500 mb-4">{t('login.resetDesc')}</p>
                <div className="flex rounded-md border border-gray-200 p-0.5 mb-4 text-sm">
                  <button type="button" onClick={() => setForgotChannel('phone')} className={`flex-1 py-2 rounded ${forgotChannel === 'phone' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}>Phone</button>
                  <button type="button" onClick={() => setForgotChannel('email')} className={`flex-1 py-2 rounded ${forgotChannel === 'email' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}>Email</button>
                </div>
                {forgotError && (
                  <div className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{forgotError}</div>
                )}
                {forgotChannel === 'phone' ? (
                <form className="space-y-4" onSubmit={forgotPhoneFormik.handleSubmit}>
                  <div className="flex rounded-md border border-gray-300 overflow-hidden">
                    <select
                      name="forgotPhoneCode"
                      className="w-24 sm:w-32 shrink-0 px-2 py-2.5 border-0 border-r border-gray-200 text-gray-700 text-sm bg-gray-50"
                      value={forgotPhoneFormik.values.forgotPhoneCode}
                      onChange={forgotPhoneFormik.handleChange}
                      onBlur={forgotPhoneFormik.handleBlur}
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
                        name="forgotPhoneLocal"
                        required
                        className="w-full py-2.5 pl-8 pr-2 border-0 text-sm text-gray-900 focus:ring-0"
                        placeholder="612 345 678"
                        value={forgotPhoneFormik.values.forgotPhoneLocal}
                        onChange={forgotPhoneFormik.handleChange}
                        onBlur={forgotPhoneFormik.handleBlur}
                      />
                    </div>
                  </div>
                  {forgotPhoneFormik.touched.forgotPhoneLocal && forgotPhoneFormik.errors.forgotPhoneLocal ? <p className="text-xs text-red-600">{forgotPhoneFormik.errors.forgotPhoneLocal}</p> : null}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-60"
                  >
                    {forgotLoading ? '…' : t('login.sendReset')}
                  </button>
                </form>
                ) : (
                <form className="space-y-4" onSubmit={forgotEmailFormik.handleSubmit}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="forgotEmail"
                      required
                      className="w-full py-2.5 pl-9 pr-2 border border-gray-300 rounded-md text-sm text-gray-900"
                      placeholder="you@example.com"
                      value={forgotEmailFormik.values.forgotEmail}
                      onChange={forgotEmailFormik.handleChange}
                      onBlur={forgotEmailFormik.handleBlur}
                    />
                  </div>
                  {forgotEmailFormik.touched.forgotEmail && forgotEmailFormik.errors.forgotEmail ? (
                    <p className="text-xs text-red-600">{forgotEmailFormik.errors.forgotEmail}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-60"
                  >
                    {forgotLoading ? '…' : t('login.sendReset')}
                  </button>
                </form>
                )}
              </>
            )}

            {forgotStep === 'otp' && (
              <form onSubmit={forgotOtpFormik.handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">{t('login.forgotAfterSend')}</p>
                <p className="text-xs text-gray-400 mb-3 break-all">
                  {forgotChannel === 'email'
                    ? forgotEmailFormik.values.forgotEmail
                    : forgotFullPhone()}
                </p>
                {forgotError && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{forgotError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('verify.label')}</label>
                  <input
                    type="text"
                    name="forgotOtp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500 tracking-widest"
                    value={forgotOtpFormik.values.forgotOtp}
                    onChange={(e) => forgotOtpFormik.setFieldValue('forgotOtp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onBlur={forgotOtpFormik.handleBlur}
                    placeholder="123456"
                  />
                  {forgotOtpFormik.touched.forgotOtp && forgotOtpFormik.errors.forgotOtp ? <p className="text-xs text-red-600 mt-1">{forgotOtpFormik.errors.forgotOtp}</p> : null}
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
                    onClick={() =>
                      void (forgotChannel === 'email'
                        ? forgotEmailFormik.submitForm()
                        : forgotPhoneFormik.submitForm())
                    }
                  >
                    {t('otp.sendCode')}
                  </button>
                  <button
                    type="button"
                    className="text-gray-600 hover:underline text-left"
                    onClick={() => {
                      setForgotStep('contact');
                      forgotOtpFormik.resetForm();
                      setForgotError('');
                    }}
                  >
                    {t('login.changePhoneNumber')}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'password' && (
              <form onSubmit={forgotPasswordFormik.handleSubmit} className="space-y-4">
                {forgotError && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{forgotError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.newPasswordLabel')}</label>
                  <div className="relative">
                    <input
                      name="forgotNewPassword"
                      type={showForgotNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={4}
                      className="w-full border border-gray-300 rounded-md py-2.5 pl-3 pr-11 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
                      value={forgotPasswordFormik.values.forgotNewPassword}
                      onChange={forgotPasswordFormik.handleChange}
                      onBlur={forgotPasswordFormik.handleBlur}
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                      aria-label={showForgotNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showForgotNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {forgotPasswordFormik.touched.forgotNewPassword && forgotPasswordFormik.errors.forgotNewPassword ? <p className="text-xs text-red-600">{forgotPasswordFormik.errors.forgotNewPassword}</p> : null}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.confirmNewPasswordLabel')}</label>
                  <div className="relative">
                    <input
                      name="forgotConfirmPassword"
                      type={showForgotConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={4}
                      className="w-full border border-gray-300 rounded-md py-2.5 pl-3 pr-11 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
                      value={forgotPasswordFormik.values.forgotConfirmPassword}
                      onChange={forgotPasswordFormik.handleChange}
                      onBlur={forgotPasswordFormik.handleBlur}
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                      aria-label={showForgotConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showForgotConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {forgotPasswordFormik.touched.forgotConfirmPassword && forgotPasswordFormik.errors.forgotConfirmPassword ? <p className="text-xs text-red-600">{forgotPasswordFormik.errors.forgotConfirmPassword}</p> : null}
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
