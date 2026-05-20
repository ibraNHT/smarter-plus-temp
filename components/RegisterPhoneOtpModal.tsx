import React, { useEffect, useRef, useState } from 'react';
import { Phone, Mail, RefreshCw, ShieldCheck, X, Loader2 } from 'lucide-react';
import { apiFetch } from '../services/apiService';
import { API_ENDPOINTS } from '../client-api/endpoints';

interface RegisterPhoneOtpModalProps {
  open: boolean;
  /** The E.164 phone number the user just entered (e.g. "+237612345678"). */
  phone: string;
  /** The email the user just entered — also receives the same OTP code. */
  email: string;
  /** Called with the short-lived registration JWT once OTP is verified. */
  onVerified: (registrationToken: string) => void;
  /** Called when the user explicitly aborts (e.g. wrong number). */
  onCancel: () => void;
  /** Parent is finishing registration — keep modal open with a progress state. */
  isCreatingAccount?: boolean;
  /** Shown when OTP passed but POST /auth/register failed — modal stays open. */
  registerError?: string;
  /** Retry account creation after a register API error (OTP already verified). */
  onRetryRegister?: () => void;
}

const RESEND_COOLDOWN_SECONDS = 45;

/**
 * Pre-registration phone verification.
 *
 * Mount this modal once the user has filled in the registration form and
 * clicked "Create account". It will:
 *   1. Immediately POST to /auth/register/request-phone-otp (SMS + email).
 *   2. Show a 6-digit code input + resend button with countdown.
 *   3. POST to /auth/register/verify-phone-otp on submit.
 *   4. Call `onVerified(registrationToken)` on success, which the parent
 *      passes back into registerProducer / registerClient as
 *      `phoneVerificationToken`.
 *
 * Because rural cell networks can delay SMS by minutes, the same code is
 * also emailed. The user can use whichever code lands first.
 */
export const RegisterPhoneOtpModal: React.FC<RegisterPhoneOtpModalProps> = ({
  open,
  phone,
  email,
  onVerified,
  onCancel,
  isCreatingAccount = false,
  registerError = '',
  onRetryRegister,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const hasRequestedRef = useRef(false);
  const lastSentForRef = useRef<string>('');

  const requestCode = async (mode: 'initial' | 'resend') => {
    if (!phone) {
      setError('Phone number is required.');
      return;
    }
    setError('');
    setInfo('');
    setIsRequesting(true);
    try {
      const res = await apiFetch<{ success?: boolean; message?: string }>(
        API_ENDPOINTS.auth.registerRequestPhoneOtp,
        {
          method: 'POST',
          body: JSON.stringify({ phone, email: email || undefined }),
          silent401: true,
        } as any,
      );
      if (res?.success === false) {
        setError(res?.message || 'Could not send verification code. Try again in a moment.');
        return;
      }
      setInfo(
        mode === 'initial'
          ? `We sent a 6-digit code to ${phone}${email ? ` and ${email}` : ''}.`
          : `New code sent to ${phone}${email ? ` and ${email}` : ''}.`,
      );
      setCooldown(RESEND_COOLDOWN_SECONDS);
      lastSentForRef.current = phone;
    } catch (e: any) {
      const message: string =
        e?.message ||
        'Could not send verification code. Check your number and try again.';
      setError(message);
    } finally {
      setIsRequesting(false);
      // Mark this phone as attempted so the open-effect does not loop on API failure.
      lastSentForRef.current = phone;
    }
  };

  useEffect(() => {
    if (!open) {
      hasRequestedRef.current = false;
      lastSentForRef.current = '';
      setCode('');
      setError('');
      setInfo('');
      setCooldown(0);
      return;
    }
    if (isCreatingAccount) return;
    if (!phone) return;
    if (hasRequestedRef.current && lastSentForRef.current === phone) return;
    hasRequestedRef.current = true;
    lastSentForRef.current = phone;
    void requestCode('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phone, isCreatingAccount]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setError('');
    setIsVerifying(true);
    try {
      const res = await apiFetch<{
        success?: boolean;
        registrationToken?: string;
        message?: string;
      }>(API_ENDPOINTS.auth.registerVerifyPhoneOtp, {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
        silent401: true,
      } as any);
      if (res?.success && res.registrationToken) {
        onVerified(res.registrationToken);
        return;
      }
      setError(res?.message || 'Invalid or expired code. Please try again.');
    } catch (e: any) {
      setError(e?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!open) return null;

  const modalLocked = isCreatingAccount || isVerifying;

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto"
      aria-modal="true"
      role="dialog"
      aria-labelledby="register-phone-otp-title"
    >
      <div className="flex min-h-screen items-end sm:items-center justify-center p-2 sm:p-4">
        <div
          className="fixed inset-0 bg-black/50 agm-modal-backdrop-in"
          onClick={modalLocked ? undefined : onCancel}
          aria-hidden="true"
        />
        <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-7 max-h-[95vh] overflow-y-auto agm-modal-panel-in">
          {!isCreatingAccount && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isVerifying}
              className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {isCreatingAccount ? (
            <div className="py-10 px-2 text-center" aria-live="polite">
              <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating your account…</h3>
              <p className="text-sm text-gray-600">
                Almost there — we are setting up your profile. This only takes a moment.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <h3 id="register-phone-otp-title" className="text-lg font-semibold text-gray-900">
                  Verify your phone
                </h3>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                For security, we sent a 6-digit code to your email
                {email ? ` (${email})` : ''}. SMS is temporarily unavailable until our
                messaging number is active — check your inbox (and spam folder), then enter
                the code below.
              </p>

              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-4 text-sm text-gray-700 space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{phone || '—'}</span>
                </div>
                {email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{email}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label htmlFor="register-otp-code" className="block text-sm font-medium text-gray-700 mb-1">
                    Verification code
                  </label>
                  <input
                    id="register-otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-3 text-center text-2xl tracking-[0.5em] font-semibold focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    autoFocus
                    disabled={isRequesting}
                  />
                </div>

                {registerError && (
                  <div className="space-y-2">
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                      {registerError}
                    </p>
                    {onRetryRegister && (
                      <button
                        type="button"
                        onClick={onRetryRegister}
                        disabled={isVerifying || isRequesting}
                        className="w-full py-2.5 px-4 rounded-md border border-primary-600 text-primary-700 text-sm font-medium hover:bg-primary-50 disabled:opacity-50"
                      >
                        Try creating account again
                      </button>
                    )}
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}
                {!error && !registerError && info && (
                  <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
                    {info}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || isRequesting || code.length !== 6}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isVerifying ? 'Verifying…' : registerError ? 'Verify code again' : 'Verify & create account'}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => void requestCode('resend')}
                    disabled={cooldown > 0 || isRequesting || isVerifying}
                    className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRequesting ? 'animate-spin' : ''}`} />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : isRequesting ? 'Sending…' : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isVerifying}
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-40"
                  >
                    Change phone number
                  </button>
                </div>
              </form>

              <p className="mt-4 text-xs text-gray-400 leading-relaxed">
                By continuing you agree this number belongs to you. We use it only for
                account security and order updates — never for marketing without your
                permission.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
