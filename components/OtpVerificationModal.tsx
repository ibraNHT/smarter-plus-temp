import React, { useState } from 'react';
import { useFormik } from 'formik';
import { z } from 'zod';

type OtpAction = 'PROFILE_UPDATE' | 'WITHDRAWAL' | 'PASSWORD_CHANGE';

interface OtpVerificationModalProps {
  open: boolean;
  onClose: () => void;
  action: OtpAction;
  onRequestOtp: (action: OtpAction) => Promise<{ success: boolean; message: string }>;
  onVerifyOtp: (action: OtpAction, code: string) => Promise<{ success: boolean; token?: string; message: string }>;
  onVerified: (token: string) => void;
  title?: string;
  sendCodeLabel?: string;
  verifyLabel?: string;
  codeSentMessage?: string;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  open,
  onClose,
  action,
  onRequestOtp,
  onVerifyOtp,
  onVerified,
  title = 'Verify with OTP',
  sendCodeLabel = 'Send code to my phone',
  verifyLabel = 'Verify',
  codeSentMessage = 'Enter the 6-digit code sent to your registered phone and email.',
}) => {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const otpSchema = z.object({
    code: z
      .string()
      .regex(/^\d{6}$/, 'Please enter a 6-digit code.'),
  });

  const otpFormik = useFormik({
    initialValues: { code: '' },
    validate: (values) => {
      const parsed = otpSchema.safeParse(values);
      if (parsed.success) return {};
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      return nextErrors;
    },
    onSubmit: async (values) => {
      setError('');
      setLoading(true);
      try {
        const res = await onVerifyOtp(action, values.code);
        if (res.success && res.token) {
          onVerified(res.token);
        } else {
          setError(res.message || 'Invalid or expired code');
        }
      } catch (e: any) {
        setError(e?.message || 'Verification failed');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleSendCode = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await onRequestOtp(action);
      if (res.success) {
        setStep('verify');
      } else {
        setError(res.message || 'Failed to send code');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" aria-modal="true" role="dialog">
      <div className="flex min-h-screen items-end sm:items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/50 agm-modal-backdrop-in" onClick={onClose} />
        <div className="relative bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-sm p-5 sm:p-6 max-h-[90vh] overflow-y-auto agm-modal-panel-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          {step === 'request' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                A 6-digit code will be sent to your registered phone and email to confirm this action.
              </p>
              {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading}
                  className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Sending…' : sendCodeLabel}
                </button>
                <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </>
          )}
          {step === 'verify' && (
            <form onSubmit={otpFormik.handleSubmit}>
              <p className="text-sm text-gray-600 mb-3">{codeSentMessage}</p>
              {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
              <input
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otpFormik.values.code}
                onChange={(e) => otpFormik.setFieldValue('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                onBlur={otpFormik.handleBlur}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-lg tracking-widest focus:border-primary-500 focus:ring-primary-500"
                autoFocus
              />
              {otpFormik.touched.code && otpFormik.errors.code ? <p className="text-sm text-red-600 mt-2">{otpFormik.errors.code}</p> : null}
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={loading || otpFormik.values.code.length !== 6}
                  className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying…' : verifyLabel}
                </button>
                <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
              <button type="button" onClick={() => { setStep('request'); otpFormik.resetForm(); setError(''); }} className="mt-2 text-sm text-primary-600 hover:underline">
                Request new code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
