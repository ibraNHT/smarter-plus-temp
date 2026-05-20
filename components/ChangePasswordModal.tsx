
import React, { useState } from 'react';
import { useTranslation } from '../services/i18nContext';
import { X, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../services/storeContext';
import { useFormik } from 'formik';
import { z } from 'zod';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{4,}$/;
const PASSWORD_RULE_MESSAGE = 'Password must be at least 4 characters with 1 letter, 1 number, and 1 special character.';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'password' | 'otp';

const passwordFields = {
  currentPassword: true,
  newPassword: true,
  confirmPassword: true,
} as const;

const inputErrorClass = (hasError: boolean) =>
  hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300';

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { changePassword, verifyCurrentPassword, requestOtp, verifyOtp } = useStore();

  const [step, setStep] = useState<Step>('password');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pendingPasswords, setPendingPasswords] = useState<{ current: string; next: string } | null>(null);

  const schema = z
    .object({
      currentPassword: z.string().min(1, 'Current password is required.'),
      newPassword: z.string().regex(PASSWORD_RULE, PASSWORD_RULE_MESSAGE),
      confirmPassword: z.string().min(1, 'Confirm your new password.'),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: 'New passwords do not match.',
      path: ['confirmPassword'],
    })
    .refine((v) => v.currentPassword !== v.newPassword, {
      message: 'New password cannot be the same as the old password.',
      path: ['newPassword'],
    });

  const resetModal = () => {
    setStep('password');
    setOtpCode('');
    setPendingPasswords(null);
    setError('');
    setSuccess('');
    formik.resetForm();
  };

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validateOnChange: true,
    validateOnBlur: true,
    validate: (values) => {
      const parsed = schema.safeParse(values);
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
      setSuccess('');
      setLoading(true);
      try {
        const verifyRes = await verifyCurrentPassword(values.currentPassword);
        if (!verifyRes.success) {
          const msg = verifyRes.message || 'Current password is incorrect.';
          formik.setFieldError('currentPassword', msg);
          setError(msg);
          return;
        }

        const otpRes = await requestOtp('PASSWORD_CHANGE');
        if (!otpRes.success) {
          setError(otpRes.message || 'Could not send verification code.');
          return;
        }
        setPendingPasswords({ current: values.currentPassword, next: values.newPassword });
        setStep('otp');
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Could not continue. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  const handlePasswordStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void formik.setTouched(passwordFields, true);
    void formik.validateForm().then((errors) => {
      if (Object.keys(errors).length > 0) {
        setError('Please fix the errors below before continuing.');
        return;
      }
      void formik.submitForm();
    });
  };

  const isWrongCurrentPasswordMessage = (message: string) =>
    /current password/i.test(message) || /incorrect/i.test(message);

  const handleVerifyAndChange = async () => {
    if (!pendingPasswords) return;
    const code = otpCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your phone or email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const verifyRes = await verifyOtp('PASSWORD_CHANGE', code);
      if (!verifyRes.success || !verifyRes.token) {
        setError(verifyRes.message || 'Invalid or expired code.');
        return;
      }
      const result = await changePassword(
        pendingPasswords.current,
        pendingPasswords.next,
        verifyRes.token,
      );
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          onClose();
          resetModal();
        }, 2000);
      } else {
        setError(result.message);
        if (isWrongCurrentPasswordMessage(result.message)) {
          setStep('password');
          setOtpCode('');
          setPendingPasswords(null);
          void formik.setFieldError('currentPassword', result.message);
          void formik.setTouched({ currentPassword: true }, false);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end sm:items-center justify-center min-h-screen p-2 sm:p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity agm-modal-backdrop-in" onClick={handleClose} />

        <div className="relative bg-white rounded-t-lg sm:rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 w-full sm:max-w-md sm:p-6 max-h-[90vh] overflow-y-auto agm-modal-panel-in">
          <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
            <button type="button" className="bg-white rounded-md text-gray-400 hover:text-gray-500" onClick={handleClose}>
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{t('profile.password')}</h3>

              {error && (
                <div className="mt-3 mb-2 bg-red-50 p-3 rounded-md flex items-center text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mr-2 shrink-0" /> {error}
                </div>
              )}
              {success && (
                <div className="mt-3 mb-2 bg-green-50 p-3 rounded-md flex items-center text-sm text-green-700">
                  <CheckCircle className="h-4 w-4 mr-2 shrink-0" /> {success}
                </div>
              )}

              {step === 'password' ? (
                <form onSubmit={handlePasswordStepSubmit} className="mt-4 space-y-4" noValidate>
                  <p className="text-sm text-gray-500">
                    We will verify your current password first, then send a code to your phone and email.
                  </p>
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Current Password</label>
                    <input
                      name="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className={`w-full border rounded-md p-2 pr-10 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${inputErrorClass(
                        Boolean(formik.touched.currentPassword && formik.errors.currentPassword),
                      )}`}
                      value={formik.values.currentPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <button type="button" onClick={() => setShowCurrentPassword((p) => !p)} className="absolute right-2 top-7 text-gray-500">
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {formik.touched.currentPassword && formik.errors.currentPassword ? (
                      <p className="text-xs text-red-600 mt-1">{formik.errors.currentPassword}</p>
                    ) : null}
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                    <input
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`w-full border rounded-md p-2 pr-10 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${inputErrorClass(
                        Boolean(formik.touched.newPassword && formik.errors.newPassword),
                      )}`}
                      value={formik.values.newPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <button type="button" onClick={() => setShowNewPassword((p) => !p)} className="absolute right-2 top-7 text-gray-500">
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {formik.touched.newPassword && formik.errors.newPassword ? (
                      <p className="text-xs text-red-600 mt-1">{formik.errors.newPassword}</p>
                    ) : null}
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`w-full border rounded-md p-2 pr-10 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${inputErrorClass(
                        Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword),
                      )}`}
                      value={formik.values.confirmPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-2 top-7 text-gray-500">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                      <p className="text-xs text-red-600 mt-1">{formik.errors.confirmPassword}</p>
                    ) : null}
                  </div>
                  <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button type="button" onClick={handleClose} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm">
                      {t('form.cancel')}
                    </button>
                    <button type="submit" disabled={loading} className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-md text-sm disabled:opacity-50 agm-btn-primary">
                      {loading ? 'Checking…' : 'Continue'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-gray-500">
                    Enter the 6-digit code sent to your registered phone and email.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full border border-gray-300 rounded-md p-2 text-center text-lg tracking-widest"
                    autoFocus
                  />
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('password');
                        setOtpCode('');
                        setError('');
                        setPendingPasswords(null);
                      }}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={loading || otpCode.length !== 6}
                      onClick={() => void handleVerifyAndChange()}
                      className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-md text-sm disabled:opacity-50 agm-btn-primary"
                    >
                      {loading ? 'Updating…' : 'Change Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
