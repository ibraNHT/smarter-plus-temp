
import React, { useState } from 'react';
import { useTranslation } from '../services/i18nContext';
import { X, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../services/storeContext';
import { useFormik } from 'formik';
import { z } from 'zod';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { changePassword } = useStore();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const schema = z
    .object({
      currentPassword: z.string().min(1, 'Current password is required.'),
      newPassword: z.string().min(8, 'New password must be at least 8 characters long.'),
      confirmPassword: z.string().min(8, 'Confirm your new password.'),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: 'New passwords do not match.',
      path: ['confirmPassword'],
    })
    .refine((v) => v.currentPassword !== v.newPassword, {
      message: 'New password cannot be the same as the old password.',
      path: ['newPassword'],
    });

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
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
      const result = await changePassword(values.currentPassword, values.newPassword);
      setLoading(false);

      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          onClose();
          formik.resetForm();
          setSuccess('');
        }, 2000);
      } else {
        setError(result.message);
      }
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
          <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <Lock className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {t('profile.password')}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-4">
                  Ensure your account is secure by using a strong password.
                </p>

                {error && (
                    <div className="mb-4 bg-red-50 p-3 rounded-md flex items-center text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 mr-2" /> {error}
                    </div>
                )}
                
                {success && (
                    <div className="mb-4 bg-green-50 p-3 rounded-md flex items-center text-sm text-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" /> {success}
                    </div>
                )}

                <form onSubmit={formik.handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Current Password</label>
                        <input 
                            name="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'} 
                            required
                            className="w-full border border-gray-300 rounded-md p-2 pr-10 text-sm focus:ring-primary-500 focus:border-primary-500"
                            value={formik.values.currentPassword}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((prev) => !prev)}
                          className="absolute right-2 top-7 text-gray-500 hover:text-gray-700"
                          aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        {formik.touched.currentPassword && formik.errors.currentPassword ? <p className="text-xs text-red-600 mt-1">{formik.errors.currentPassword}</p> : null}
                    </div>
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                        <input 
                            name="newPassword"
                            type={showNewPassword ? 'text' : 'password'} 
                            required
                            minLength={8}
                            className="w-full border border-gray-300 rounded-md p-2 pr-10 text-sm focus:ring-primary-500 focus:border-primary-500"
                            value={formik.values.newPassword}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          className="absolute right-2 top-7 text-gray-500 hover:text-gray-700"
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        {formik.touched.newPassword && formik.errors.newPassword ? <p className="text-xs text-red-600 mt-1">{formik.errors.newPassword}</p> : null}
                    </div>
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                        <input 
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'} 
                            required
                            className="w-full border border-gray-300 rounded-md p-2 pr-10 text-sm focus:ring-primary-500 focus:border-primary-500"
                            value={formik.values.confirmPassword}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-2 top-7 text-gray-500 hover:text-gray-700"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        {formik.touched.confirmPassword && formik.errors.confirmPassword ? <p className="text-xs text-red-600 mt-1">{formik.errors.confirmPassword}</p> : null}
                    </div>

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                        type="submit"
                        disabled={loading}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                        {loading ? 'Updating...' : 'Change Password'}
                        </button>
                        <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                        >
                        {t('form.cancel')}
                        </button>
                    </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
