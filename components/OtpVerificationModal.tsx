import React, { useState } from 'react';
import { useFormik } from 'formik';
import { z } from 'zod';
import { Modal } from './Modal';
import { useTranslation } from '../services/i18nContext';

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
  title = '',
  sendCodeLabel = '',
  verifyLabel = '',
  codeSentMessage = '',
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const modalTitle = title || t('otp.verifyTitle');
  const modalSendCodeLabel = sendCodeLabel || t('otp.sendCode');
  const modalVerifyLabel = verifyLabel || t('otp.verify');
  const modalCodeSentMessage = codeSentMessage || t('otp.enterCode');

  const otpSchema = z.object({
    code: z
      .string()
      .regex(/^\d{6}$/, t('registerOtp.enterCode')),
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
          setError(res.message || t('registerOtp.invalidOrExpired'));
        }
      } catch (e: any) {
        setError(e?.message || t('registerOtp.verificationFailed'));
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
        setError(res.message || t('registerOtp.sendFailed'));
      }
    } catch (e: any) {
      setError(e?.message || t('registerOtp.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="sm" zIndex={60} panelClassName="p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{modalTitle}</h3>
      {step === 'request' && (
        <>
          <p className="text-sm text-gray-600 mb-4">
            {modalCodeSentMessage}
          </p>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading}
              className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? t('registerOtp.sending') : modalSendCodeLabel}
            </button>
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t('form.cancel')}
            </button>
          </div>
        </>
      )}
      {step === 'verify' && (
        <form onSubmit={otpFormik.handleSubmit}>
          <p className="text-sm text-gray-600 mb-3">{modalCodeSentMessage}</p>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <input
            name="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder={t('profile.otpCodePlaceholder')}
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
              {loading ? t('verify.verifying') : modalVerifyLabel}
            </button>
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t('form.cancel')}
            </button>
          </div>
          <button type="button" onClick={() => { setStep('request'); otpFormik.resetForm(); setError(''); }} className="mt-2 text-sm text-primary-600 hover:underline">
            {t('otp.requestNewCode')}
          </button>
        </form>
      )}
    </Modal>
  );
};
