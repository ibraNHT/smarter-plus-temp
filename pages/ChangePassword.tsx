import React, { useState } from 'react';
import { Card, Input, Button } from '../components/UI';
import { Lock, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ChangePassword({ t, onChangePassword, onBackToLogin }: any) {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass) {
      setError(t('oldPasswordRequired') || 'Current (temporary) password is required');
      return;
    }
    if (newPass !== confirmPass) {
      setError(t('passwordMismatch'));
      return;
    }
    if (newPass.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
    }
    
    setError('');
    setLoading(true);
    try {
      await onChangePassword(currentPass, newPass);
      // Reload to refresh auth state
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
            <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-200 p-4 rounded-lg mb-4 flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <p className="text-sm font-medium">{t('mandatoryReset')}</p>
            </div>
            <Card title={t('changePassword')}>
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Lock className="w-8 h-8 text-blue-400" />
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label={t('oldPassword') || 'Current (temporary) password'} type="password" value={currentPass} onChange={setCurrentPass} required />
                    <Input label={t('newPassword')} type="password" value={newPass} onChange={setNewPass} required />
                    <Input label={t('confirmPassword')} type="password" value={confirmPass} onChange={setConfirmPass} required />
                    
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    
                    <div className="flex flex-col gap-3 mt-4">
                      <Button type="submit" disabled={loading} className="w-full">{t('save')}</Button>
                      <button
                        type="button"
                        onClick={() => onBackToLogin ? onBackToLogin() : (window.location.href = '/')}
                        className="w-full px-4 py-2.5 rounded-md font-medium border border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        {t('backToLogin') || 'Back to login'}
                      </button>
                    </div>
                </form>
            </Card>
        </div>
    </div>
  );
}
