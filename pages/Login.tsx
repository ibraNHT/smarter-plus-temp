import React, { useState, useEffect } from 'react';
import { Landmark, AlertCircle, Sun, Moon } from 'lucide-react';
import { Input, Button } from '../components/UI';
import { useTheme } from '../context/ThemeContext';

type AuthMode = 'login' | 'signup' | 'otp' | 'invite';

export default function Login({
  loginStart,
  loginVerify,
  signupStart,
  signupVerify,
  resendOtp,
  inviteAcceptStart,
  inviteAcceptVerify,
  t,
}: any) {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<AuthMode>('login');
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'signup' | 'invite'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      setInviteToken(invite);
      setMode('invite');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginStart(email, password);
      setOtpPurpose('login');
      setDevOtp(res.devOtp || '');
      if (res.email) setEmail(res.email);
      setCode('');
      setMode('otp');
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signupStart({
        email,
        password,
        organizationName,
        firstName,
        lastName,
      });
      setOtpPurpose('signup');
      setDevOtp(res.devOtp || '');
      setMode('otp');
    } catch (err: any) {
      setError(err?.message || 'Could not start signup.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const cleanedCode = code.replace(/\D/g, '');
    try {
      if (otpPurpose === 'signup') await signupVerify(email, cleanedCode || code);
      else if (otpPurpose === 'invite') await inviteAcceptVerify(email, cleanedCode || code);
      else await loginVerify(email, cleanedCode || code);
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code.');
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await inviteAcceptStart({
        token: inviteToken,
        password,
        firstName,
        lastName,
      });
      setEmail(res.email);
      setOtpPurpose('invite');
      setDevOtp(res.devOtp || '');
      setMode('otp');
    } catch (err: any) {
      setError(err?.message || 'Could not accept invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      const res = await resendOtp(email, otpPurpose);
      setDevOtp(res.devOtp || '');
    } catch (err: any) {
      setError(err?.message || 'Could not resend code.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4 relative">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label={t('themeToggle')}
        title={theme === 'dark' ? t('lightMode') : t('darkMode')}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <Landmark className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'signup'
              ? t('signupTitle')
              : mode === 'otp'
                ? t('otpTitle')
                : mode === 'invite'
                  ? t('inviteTitle')
                  : t('loginWelcome')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {mode === 'signup'
              ? t('signupSubtitle')
              : mode === 'otp'
                ? t('otpSubtitle')
                : mode === 'invite'
                  ? t('inviteSubtitle')
                  : t('loginToAccess')}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 rounded-md mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <Input label={t('email')} type="email" value={email} onChange={setEmail} required />
            <Input label={t('password')} type="password" value={password} onChange={setPassword} required />
            <Button type="submit" disabled={loading} className="w-full mt-4">
              {loading ? t('pleaseWait') : t('login')}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-4">
              {t('noAccount')}{' '}
              <button type="button" className="text-blue-500 hover:underline" onClick={() => { setMode('signup'); setError(''); }}>
                {t('createOrganization')}
              </button>
            </p>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup}>
            <Input label={t('organizationName')} value={organizationName} onChange={setOrganizationName} required />
            <Input label={t('firstName')} value={firstName} onChange={setFirstName} />
            <Input label={t('lastName')} value={lastName} onChange={setLastName} />
            <Input label={t('email')} type="email" value={email} onChange={setEmail} required />
            <Input label={t('password')} type="password" value={password} onChange={setPassword} required />
            <Button type="submit" disabled={loading} className="w-full mt-4">
              {loading ? t('pleaseWait') : t('createAccount')}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-4">
              {t('haveAccount')}{' '}
              <button type="button" className="text-blue-500 hover:underline" onClick={() => { setMode('login'); setError(''); }}>
                {t('login')}
              </button>
            </p>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleOtp}>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{email}</p>
            <Input label={t('otpCode')} value={code} onChange={setCode} required />
            {devOtp && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                {t('devOtpHint')}: <strong>{devOtp}</strong>
              </p>
            )}
            <Button type="submit" disabled={loading} className="w-full mt-4">
              {loading ? t('pleaseWait') : t('verifyOtp')}
            </Button>
            <button type="button" className="w-full text-sm text-blue-500 mt-3 hover:underline" onClick={handleResend}>
              {t('resendOtp')}
            </button>
          </form>
        )}

        {mode === 'invite' && (
          <form onSubmit={handleInvite}>
            <Input label={t('inviteToken')} value={inviteToken} onChange={setInviteToken} required />
            <Input label={t('firstName')} value={firstName} onChange={setFirstName} />
            <Input label={t('lastName')} value={lastName} onChange={setLastName} />
            <Input label={t('password')} type="password" value={password} onChange={setPassword} required />
            <Button type="submit" disabled={loading} className="w-full mt-4">
              {loading ? t('pleaseWait') : t('acceptInvite')}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-4">
              <button type="button" className="text-blue-500 hover:underline" onClick={() => { setMode('login'); setError(''); }}>
                {t('backToLogin')}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
