import React, { useState, useEffect } from 'react';
import { Landmark, AlertCircle, Sun, Moon } from 'lucide-react';
import { Input, Button } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { PwaInstallCta } from '../components/PwaInstallCta';

type AuthMode = 'login' | 'signup' | 'otp' | 'invite' | 'forgot' | 'forgot_reset';

export default function Login({
  loginStart,
  loginVerify,
  signupStart,
  signupVerify,
  resendOtp,
  inviteAcceptStart,
  inviteAcceptVerify,
  forgotPasswordStart,
  forgotPasswordVerify,
  t,
  lang,
  setLang,
}: any) {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<AuthMode>('login');
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'signup' | 'invite' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
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
    setInfo('');
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
    setInfo('');
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

  const handleForgotStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await forgotPasswordStart(email);
      setOtpPurpose('forgot');
      setDevOtp(res.devOtp || '');
      if (res.email) setEmail(res.email);
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setMode('forgot_reset');
    } catch (err: any) {
      setError(err?.message || 'Could not start password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const cleanedCode = code.replace(/\D/g, '');
    try {
      await forgotPasswordVerify(email, cleanedCode || code, newPassword);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCode('');
      setDevOtp('');
      setInfo(t('forgotSuccess'));
      setMode('login');
    } catch (err: any) {
      setError(err?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
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
    setInfo('');
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
      const purpose = mode === 'forgot_reset' ? 'forgot' : otpPurpose;
      const res = await resendOtp(email, purpose);
      setDevOtp(res.devOtp || '');
    } catch (err: any) {
      setError(err?.message || 'Could not resend code.');
    }
  };

  const title =
    mode === 'signup'
      ? t('signupTitle')
      : mode === 'otp'
        ? t('otpTitle')
        : mode === 'invite'
          ? t('inviteTitle')
          : mode === 'forgot'
            ? t('forgotPasswordTitle')
            : mode === 'forgot_reset'
              ? t('forgotResetTitle')
              : t('loginWelcome');

  const subtitle =
    mode === 'signup'
      ? t('signupSubtitle')
      : mode === 'otp'
        ? t('otpSubtitle')
        : mode === 'invite'
          ? t('inviteSubtitle')
          : mode === 'forgot'
            ? t('forgotPasswordSubtitle')
            : mode === 'forgot_reset'
              ? t('forgotResetSubtitle')
              : t('loginToAccess');

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="bg-gray-100 dark:bg-gray-700 border-none rounded-md text-sm p-2 text-gray-900 dark:text-white"
          aria-label="Language"
        >
          <option value="en">EN</option>
          <option value="fr">FR</option>
        </select>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label={t('themeToggle')}
          title={theme === 'dark' ? t('lightMode') : t('darkMode')}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <Landmark className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 rounded-md mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {info && !error && (
          <div className="bg-green-900/40 border border-green-800 text-green-200 p-3 rounded-md mb-6 text-sm">
            {info}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <Input label={t('email')} type="email" value={email} onChange={setEmail} required />
            <Input label={t('password')} type="password" value={password} onChange={setPassword} required />
            <div className="flex justify-end -mt-1 mb-1">
              <button
                type="button"
                className="text-sm text-blue-500 hover:underline"
                onClick={() => {
                  setMode('forgot');
                  setError('');
                  setInfo('');
                  setPassword('');
                }}
              >
                {t('forgotPassword')}
              </button>
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-4">
              {loading ? t('pleaseWait') : t('login')}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-4">
              {t('noAccount')}{' '}
              <button type="button" className="text-blue-500 hover:underline" onClick={() => { setMode('signup'); setError(''); setInfo(''); }}>
                {t('createOrganization')}
              </button>
            </p>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotStart}>
            <Input label={t('email')} type="email" value={email} onChange={setEmail} required />
            <Button type="submit" disabled={loading || typeof forgotPasswordStart !== 'function'} className="w-full mt-4">
              {loading ? t('pleaseWait') : t('sendResetCode')}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-4">
              <button type="button" className="text-blue-500 hover:underline" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
                {t('backToLogin')}
              </button>
            </p>
          </form>
        )}

        {mode === 'forgot_reset' && (
          <form onSubmit={handleForgotReset}>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{email}</p>
            <Input label={t('otpCode')} value={code} onChange={setCode} required />
            {devOtp && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                {t('devOtpHint')}: <strong>{devOtp}</strong>
              </p>
            )}
            <Input label={t('newPassword')} type="password" value={newPassword} onChange={setNewPassword} required />
            <Input label={t('confirmPassword')} type="password" value={confirmPassword} onChange={setConfirmPassword} required />
            <Button type="submit" disabled={loading || typeof forgotPasswordVerify !== 'function'} className="w-full mt-4">
              {loading ? t('pleaseWait') : t('resetPasswordSubmit')}
            </Button>
            <button type="button" className="w-full text-sm text-blue-500 mt-3 hover:underline" onClick={handleResend}>
              {t('resendOtp')}
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              <button type="button" className="text-blue-500 hover:underline" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
                {t('backToLogin')}
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
              <button type="button" className="text-blue-500 hover:underline" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
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
              <button type="button" className="text-blue-500 hover:underline" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
                {t('backToLogin')}
              </button>
            </p>
          </form>
        )}

        <PwaInstallCta t={t} variant="card" />
      </div>
    </div>
  );
}
