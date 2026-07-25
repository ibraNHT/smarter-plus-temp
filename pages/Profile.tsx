import React, { useState, useEffect } from 'react';
import { Card, Input, Button } from '../components/UI';
import { useStorage, getAbsoluteImageUrl, apiFetch, queueOfflineApiAction } from '../hooks/useAppData';
import { User, Upload, Lock } from 'lucide-react';

/** Personal profile for every user (owner and invited members). */
export default function Profile({ t, user, onChangePassword, refreshUser, onComplete, onLogout, embedded = true }: any) {
  const { upload, uploading } = useStorage();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [infoSuccess, setInfoSuccess] = useState('');

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setPhone(user?.phone || '');
    setAddress(user?.address || '');
    setJobTitle(user?.jobTitle || '');
  }, [user?.id, user?.firstName, user?.lastName, user?.phone, user?.address, user?.jobTitle]);

  const persistLocalUser = (patch: Record<string, unknown>) => {
    try {
      const saved = localStorage.getItem('user_data');
      if (saved) {
        const u = { ...JSON.parse(saved), ...patch };
        localStorage.setItem('user_data', JSON.stringify(u));
      }
    } catch { /* ignore */ }
  };

  const handlePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    try {
      const result = await upload(file, `uploads/profile_pictures/${user.id}_${Date.now()}_${file.name}`);
      const url = result.url;
      if (!navigator.onLine || (result as any).offline) {
        await queueOfflineApiAction('/profile', 'PATCH', { profilePicUrl: url });
        persistLocalUser({ profilePicUrl: url });
        if (typeof refreshUser === 'function') await refreshUser();
        return;
      }
      const patched = await apiFetch('/profile', { method: 'PATCH', body: JSON.stringify({ profilePicUrl: url }) });
      const nextUrl = (patched as any)?.profilePicUrl || url;
      persistLocalUser({ profilePicUrl: nextUrl });
      if (typeof refreshUser === 'function') await refreshUser();
    } catch {
      // upload already notifies on failure
    }
  };

  const handleInfoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError('');
    setInfoSuccess('');
    setInfoLoading(true);
    try {
      const patched = await apiFetch('/profile', {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName, phone, address, jobTitle }),
      });
      persistLocalUser({
        firstName: (patched as any).firstName,
        lastName: (patched as any).lastName,
        phone: (patched as any).phone,
        address: (patched as any).address,
        jobTitle: (patched as any).jobTitle,
        profileCompletedAt: (patched as any).profileCompletedAt,
      });
      if (typeof refreshUser === 'function') await refreshUser();
      setInfoSuccess(t('personalProfileSaved') || 'Personal profile saved');
      if (onComplete && (patched as any).profileCompletedAt) onComplete();
    } catch (err: any) {
      setInfoError(err?.message || 'Could not save profile');
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPassError(t('passwordMismatch'));
      return;
    }
    if (!oldPass) {
      setPassError(t('oldPasswordRequired') || 'Old password is required');
      return;
    }
    setPassLoading(true);
    setPassError('');
    setPassSuccess('');
    try {
      if (onChangePassword) {
        await onChangePassword(oldPass, newPass);
      } else {
        await apiFetch('/update-password', {
          method: 'PUT',
          body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
        });
      }
      setPassSuccess(t('passwordChanged'));
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setPassError(err?.message || 'Password change failed');
    }
    setPassLoading(false);
  };

  const content = (
    <div className="space-y-6">
      {!embedded && (
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('personalProfileTitle')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('personalProfileSubtitle')}</p>
          </div>
          {typeof onLogout === 'function' && (
            <button
              type="button"
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white underline shrink-0"
            >
              {t('logout') || 'Sign out'}
            </button>
          )}
        </div>
      )}
      {embedded && <h2 className="text-2xl font-bold">{t('profile')}</h2>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 mb-4 overflow-hidden flex items-center justify-center border-4 border-gray-300 dark:border-gray-600 relative group">
            {user.profilePicUrl ? (
              <img src={getAbsoluteImageUrl(user.profilePicUrl)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-16 h-16 text-gray-600 dark:text-gray-400" />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <label className="cursor-pointer p-4 w-full h-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-900 dark:text-white" />
                <input type="file" className="hidden" onChange={handlePicUpload} disabled={uploading} />
              </label>
            </div>
          </div>
          <h3 className="text-xl font-bold">{user.firstName} {user.lastName}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{user.email}</p>
          {user.isOwner && (
            <p className="px-3 py-1 bg-blue-900/50 text-blue-200 rounded-full text-xs border border-blue-800 mb-2">
              {t('owner') || 'Owner'}
            </p>
          )}
          <p className="text-xs text-gray-500">{user.organization?.name}</p>
        </Card>

        <Card className="md:col-span-2" title={t('personalInfo')}>
          <form onSubmit={handleInfoSave} className="space-y-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Input label={t('firstName')} value={firstName} onChange={setFirstName} required />
              <Input label={t('lastName')} value={lastName} onChange={setLastName} required />
            </div>
            <Input label={t('jobTitle')} value={jobTitle} onChange={setJobTitle} required />
            <Input label={t('phone')} value={phone} onChange={setPhone} required />
            <Input label={t('address')} value={address} onChange={setAddress} />
            <Input label={t('email')} value={user.email || ''} onChange={() => {}} disabled />
            {infoError && <p className="text-red-400 text-sm mt-2">{infoError}</p>}
            {infoSuccess && <p className="text-green-400 text-sm mt-2">{infoSuccess}</p>}
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={infoLoading}>
                {infoLoading ? t('pleaseWait') : t('save')}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {embedded && (
        <Card title={t('changePassword')}>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
            <Input label={t('oldPassword') || 'Current Password'} type="password" value={oldPass} onChange={setOldPass} required />
            <Input label={t('newPassword')} type="password" value={newPass} onChange={setNewPass} required />
            <Input label={t('confirmPassword')} type="password" value={confirmPass} onChange={setConfirmPass} required />
            {passError && <p className="text-red-400 text-sm">{passError}</p>}
            {passSuccess && <p className="text-green-400 text-sm">{passSuccess}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={passLoading}>
                <Lock className="w-4 h-4 mr-2" /> {t('save')}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );

  if (!embedded) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-4xl w-full">{content}</div>
      </div>
    );
  }

  return <div className="max-w-4xl mx-auto">{content}</div>;
}
