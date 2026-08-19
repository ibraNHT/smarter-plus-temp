import React, { useState, useEffect } from 'react';
import { useData, useSubmit, apiFetch } from '../hooks/useAppData';
import { Card, Input, Select, MultiSelectBox, Button, Tabs, Checkbox, TempPasswordModal, Modal } from '../components/UI';
import { getTranslated, CURRENCY_CODES } from '../constants';
import { PERMISSIONS, normalizePermissions } from '../types';
import { useNotification } from '../context/NotificationContext';
import { API_URL } from '../env';
import { Trash2, Lock, RefreshCw, Pencil } from 'lucide-react';

// --- Sub-Component: User Management ---
const UserManagement = ({ t, lang, users, staff, roles, locations, addUser, updateUser, removeUser, isGlobalAdmin, currentUser }: any) => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [roleId, setRoleId] = useState('');
    const [isStaff, setIsStaff] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const initialUserLocs = Array.isArray(currentUser.locationIds) && currentUser.locationIds.length > 0
        ? currentUser.locationIds
        : [currentUser.locationId].filter(Boolean);
    const [locationIds, setLocationIds] = useState<string[]>(isGlobalAdmin ? [] : initialUserLocs);
    const [loading, setLoading] = useState(false);
    const [pendingInvites, setPendingInvites] = useState<any[]>([]);
    const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);
    const [resetPasswordTemp, setResetPasswordTemp] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editRoleId, setEditRoleId] = useState('');
    const [editLocationIds, setEditLocationIds] = useState<string[]>([]);
    const [editSaving, setEditSaving] = useState(false);
    const { showNotification } = useNotification();
    const perms = currentUser?.role?.permissions ?? [];
    const isGlobalAdminUser = isGlobalAdmin === true;
    const canDeactivate = isGlobalAdminUser || (Array.isArray(perms) && (perms.includes('perm_deactivateUser') || perms.includes('manage_users')));
    const canRemove = isGlobalAdminUser || (Array.isArray(perms) && (perms.includes('perm_removeUser') || perms.includes('manage_users')));
    const canEditUser = isGlobalAdminUser || (Array.isArray(perms) && (perms.includes('perm_manageAdminUsers') || perms.includes('manage_users')));

    // Staff list passed in; filter staff that have a userId valuee equal to null (not yet invited) or equal to the current user's id (to allow re-inviting self)
    const availableStaff = (staff || []).filter((s: any) => !s.userId || s.userId === currentUser.id);

    const staffOptions = availableStaff.map((s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }));

    const hasAllLocs = initialUserLocs.includes('all') || (currentUser.role?.permissions && currentUser.role.permissions.includes('perm_allLocations'));

    const visibleUsers = isGlobalAdmin || hasAllLocs
        ? users
        : users.filter((u: any) => initialUserLocs.includes(u.locationId) || (u.locationIds && u.locationIds.some((id: string) => initialUserLocs.includes(id))));

    const inviteLocations = isGlobalAdmin || hasAllLocs
        ? [...locations.map((l: any) => ({ value: l.id, label: getTranslated(l, lang) }))]
        : locations.filter((l: any) => initialUserLocs.includes(l.id)).map((l: any) => ({ value: l.id, label: getTranslated(l, lang) }));

    const loadInvites = async () => {
        try {
            const list: any = await apiFetch('/invites');
            const rows = Array.isArray(list) ? list : [];
            setPendingInvites(rows.filter((i: any) => i.status === 'pending'));
        } catch {
            setPendingInvites([]);
        }
    };

    useEffect(() => {
        loadInvites();
    }, []);

    // When a staff member is selected, prefill available fields from that staff record
    const onSelectStaff = (id: string) => {
        setSelectedStaffId(id);
        const s = (staff || []).find((x: any) => x.id === id);
        if (s) {
            setFirstName(s.firstName || '');
            setLastName(s.lastName || '');
            setEmail(s.email || '');
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let inviteEmail = email.trim().toLowerCase();
            let locs = Array.isArray(locationIds) ? locationIds : [locationIds].filter(Boolean);

            if (isStaff) {
                if (!selectedStaffId) throw new Error('Select a staff member');
                const s = (staff || []).find((x: any) => x.id === selectedStaffId);
                if (!s?.email?.trim()) throw new Error('Selected staff has no email address');
                inviteEmail = String(s.email).trim().toLowerCase();
                setEmail(inviteEmail);
                if (!locs.length && Array.isArray(s.locations) && s.locations.length) {
                    locs = s.locations.map((lr: any) => lr.locationId || lr).filter(Boolean);
                }
            }

            if (!inviteEmail || !roleId) throw new Error('Email and role are required');

            const inviteRes: any = await apiFetch('/invites', {
                method: 'POST',
                body: JSON.stringify({
                    email: inviteEmail,
                    roleId,
                    locationIds: locs,
                }),
            });

            showNotification(
                inviteRes?.emailSent
                    ? (t('inviteSent') || 'Invitation sent')
                    : `${t('inviteSent') || 'Invitation saved'} (${t('inviteEmailFailed') || 'email not sent'})`,
                inviteRes?.emailSent ? 'success' : 'error'
            );
            setEmail(''); setFirstName(''); setLastName(''); setRoleId(''); setSelectedStaffId('');
            if (isGlobalAdmin) setLocationIds([]);
            await loadInvites();
        } catch (err: any) {
            showNotification(err?.message || String(err), 'error');
        }
        setLoading(false);
    };

    const handleResendInvite = async (invite: any) => {
        try {
            const res: any = await apiFetch(`/invites/${invite.id}/resend`, { method: 'POST' });
            showNotification(
                res?.emailSent
                    ? (t('inviteResent') || 'Invitation resent')
                    : (t('inviteEmailFailed') || 'Email not sent'),
                res?.emailSent ? 'success' : 'error'
            );
            await loadInvites();
        } catch (err: any) {
            showNotification(err?.message || String(err), 'error');
        }
    };

    const handleResetPassword = async (user: any) => {
        if (!confirm(t('resetPassword') + ` for ${user.firstName}?`)) return;
        const tempPass = Math.random().toString(36).slice(-8);
        try {
            await apiFetch(`/users/${user.id}/reset-password`, {
                method: 'PUT',
                body: JSON.stringify({ newPassword: tempPass })
            });
            setResetPasswordTemp(tempPass);
            showNotification(t('resetSuccess')?.replace(/:\s*$/, '') || 'Password reset. Share the temporary password with the user.', 'success');
        } catch (err: any) {
            showNotification(err?.message || 'Reset failed', 'error');
        }
    };

    const handleDeactivate = async (user: any) => {
        if (user.id === currentUser?.id) {
            showNotification('You cannot deactivate yourself', 'error');
            return;
        }
        if (!confirm(t('confirmDeactivateUser'))) return;
        try {
            const ok = await updateUser(user.id, { active: false });
            if (ok) showNotification(t('userDeactivated'), 'success');
        } catch (err: any) {
            showNotification(err?.message || 'Deactivate failed', 'error');
        }
    };

    const handleRemove = async (user: any) => {
        if (user.id === currentUser?.id) {
            showNotification('You cannot remove yourself', 'error');
            return;
        }
        if (!confirm(t('confirmRemoveUser'))) return;
        try {
            const ok = removeUser && (await removeUser(user.id));
            if (ok) showNotification(t('userRemoved'), 'success');
        } catch (err: any) {
            showNotification(err?.message || 'Remove failed', 'error');
        }
    };

    const handleReactivate = async (user: any) => {
        if (user.id === currentUser?.id) return;
        try {
            const ok = await updateUser(user.id, { active: true });
            if (ok) showNotification(t('userReactivated'), 'success');
        } catch (err: any) {
            showNotification(err?.message || 'Reactivate failed', 'error');
        }
    };

    const openEditUser = (user: any) => {
        setEditingUser(user);
        setEditRoleId(user.roleId || '');
        const locIds = Array.isArray(user.locationIds) && user.locationIds.length > 0
            ? user.locationIds
            : (user.locationId ? [user.locationId] : []);
        setEditLocationIds(locIds);
    };

    const closeEditUser = () => {
        setEditingUser(null);
        setEditRoleId('');
        setEditLocationIds([]);
    };

    const handleSaveEditUser = async () => {
        if (!editingUser) return;
        if (!editRoleId?.trim()) {
            showNotification(t('selectRole') || 'Select a role', 'error');
            return;
        }
        if (editLocationIds.length === 0) {
            showNotification(t('assignAtLeastOneLocation') || 'Assign at least one location', 'error');
            return;
        }
        setEditSaving(true);
        try {
            const payload: Record<string, unknown> = { roleId: editRoleId.trim(), locationIds: editLocationIds };
            if (editLocationIds.length === 1) payload.locationId = editLocationIds[0];
            const ok = await updateUser(editingUser.id, payload);
            if (ok) {
                showNotification(t('saved') || 'Saved', 'success');
                closeEditUser();
            }
        } catch (err: any) {
            showNotification(err?.message || 'Update failed', 'error');
        }
        setEditSaving(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TempPasswordModal
                isOpen={!!tempPasswordModal}
                onClose={() => setTempPasswordModal(null)}
                tempPassword={tempPasswordModal || ''}
                title={t('resetSuccess')?.replace(/:\s*$/, '') || 'Temporary password'}
            />
            <TempPasswordModal
                isOpen={!!resetPasswordTemp}
                onClose={() => setResetPasswordTemp(null)}
                tempPassword={resetPasswordTemp || ''}
                title={t('resetPassword') || 'Reset password'}
            />
            <Modal
                isOpen={!!editingUser}
                onClose={closeEditUser}
                title={editingUser ? `${t('editUser')}: ${editingUser.firstName} ${editingUser.lastName}` : ''}
                onConfirm={handleSaveEditUser}
                confirmText={t('saveChanges')}
                cancelText={t('cancel')}
                confirmVariant="primary"
            >
                {editingUser && (
                    <div className="space-y-4">
                        <Select
                            label={t('roleName') || 'Role'}
                            value={editRoleId}
                            onChange={setEditRoleId}
                            options={[{ value: '', label: '...' }, ...(roles || []).map((r: any) => ({ value: r.id, label: r.name }))]}
                        />
                        <MultiSelectBox
                            label={t('locationManagement')}
                            selectedValues={editLocationIds}
                            onChange={setEditLocationIds}
                            options={inviteLocations}
                        />
                        {editSaving && <p className="text-sm text-gray-600 dark:text-gray-400">Saving…</p>}
                    </div>
                )}
            </Modal>
            <Card title={t('userManagement')} className="lg:col-span-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('inviteEmailHint')}</p>
                <form onSubmit={handleInvite}>
                    <label className="flex items-center gap-2 mb-3">
                        <input type="checkbox" checked={isStaff} onChange={e => setIsStaff(e.target.checked)} />
                        <span className="text-sm">{t('inviteFromStaff') || 'Invite from staff'}</span>
                    </label>

                    {isStaff && (
                        <Select
                            label={t('hr') || 'Staff'}
                            value={selectedStaffId}
                            onChange={onSelectStaff}
                            required
                            options={[{ value: '', label: '...' }, ...staffOptions]}
                        />
                    )}

                    <Input
                        label={t('email')}
                        type="email"
                        value={email}
                        onChange={setEmail}
                        required={!isStaff}
                        disabled={isStaff}
                    />
                    {!isStaff && (
                        <>
                            <Input label={t('firstName')} value={firstName} onChange={setFirstName} />
                            <Input label={t('lastName')} value={lastName} onChange={setLastName} />
                        </>
                    )}
                    <Select
                        label={t('roleName') || 'Role'}
                        value={roleId}
                        onChange={setRoleId}
                        required
                        options={[{ value: '', label: '...' }, ...roles.map((r: any) => ({ value: r.id, label: r.name }))]}
                    />
                    <MultiSelectBox
                        label={t('locationManagement')}
                        selectedValues={locationIds}
                        onChange={setLocationIds}
                        options={inviteLocations}
                    />
                    <Button type="submit" disabled={loading} className="w-full">{t('sendInvite') || 'Send invite'}</Button>
                </form>
            </Card>
            <div className="lg:col-span-2 space-y-6">
            {pendingInvites.length > 0 && (
                <Card title={t('pendingInvites') || 'Pending invitations'}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="pb-2">Email</th>
                                    <th className="pb-2">Role</th>
                                    <th className="pb-2">{t('dueDate') || 'Expires'}</th>
                                    <th className="pb-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingInvites.map((inv: any) => (
                                    <tr key={inv.id} className="border-b border-gray-200 dark:border-gray-800">
                                        <td className="py-2 text-xs">{inv.email}</td>
                                        <td className="py-2">{inv.role?.name || roles.find((r: any) => r.id === inv.roleId)?.name || '—'}</td>
                                        <td className="py-2 text-xs">{inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '—'}</td>
                                        <td className="py-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleResendInvite(inv)}
                                                className="text-blue-500 hover:text-blue-400 text-xs underline"
                                            >
                                                {t('resendInvite') || 'Resend'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
            <Card title="Active Users">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="pb-2">Name</th>
                                <th className="pb-2">Email</th>
                                <th className="pb-2">Role</th>
                                <th className="pb-2">{t('locationManagement')}</th>
                                <th className="pb-2">Status</th>
                                <th className="pb-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleUsers.map((u: any) => {
                                const isSelf = u.id === currentUser?.id;
                                const isActive = u.active !== false;
                                const userLocIds = Array.isArray(u.locationIds) && u.locationIds.length > 0 ? u.locationIds : (u.locationId ? [u.locationId] : []);
                                const userLocNames = userLocIds.map((lid: string) => (locations || []).find((l: any) => l.id === lid)).filter(Boolean).map((l: any) => getTranslated(l, lang)).join(', ') || '—';
                                return (
                                <tr key={u.id} className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 ${!isActive ? 'opacity-60' : ''}`}>
                                    <td className="py-2">{u.firstName} {u.lastName}</td>
                                    <td className="py-2 text-gray-600 dark:text-gray-400 text-xs">{u.email}</td>
                                    <td className="py-2">{roles.find((r: any) => r.id === u.roleId)?.name}</td>
                                    <td className="py-2 text-gray-600 dark:text-gray-400 text-xs max-w-[140px] truncate" title={userLocNames}>{userLocNames}</td>
                                    <td className="py-2">
                                        <span className={isActive ? 'text-green-400' : 'text-gray-500 dark:text-gray-500'}>{isActive ? t('active') : t('inactive')}</span>
                                    </td>
                                    <td className="py-2 text-right flex flex-wrap gap-1 justify-end">
                                        {canEditUser && !isSelf && (
                                            <button type="button" onClick={() => openEditUser(u)} className="text-blue-400 hover:text-blue-300 p-1 rounded" title={t('editUser')} aria-label={t('editUser')}>
                                                <Pencil size={16} />
                                            </button>
                                        )}
                                        <button type="button" onClick={() => handleResetPassword(u)} className="text-yellow-500 hover:text-yellow-400 p-1 rounded" title={t('resetPassword')} aria-label={t('resetPassword')}>
                                            <RefreshCw size={16} />
                                        </button>
                                        {canDeactivate && !isSelf && isActive && (
                                            <button type="button" onClick={() => handleDeactivate(u)} className="text-orange-500 hover:text-orange-400 p-1 rounded text-xs" title={t('deactivate')} aria-label={t('deactivate')}>
                                                {t('deactivate')}
                                            </button>
                                        )}
                                        {canDeactivate && !isSelf && !isActive && (
                                            <button type="button" onClick={() => handleReactivate(u)} className="text-green-500 hover:text-green-400 p-1 rounded text-xs" title={t('reactivate')} aria-label={t('reactivate')}>
                                                {t('reactivate')}
                                            </button>
                                        )}
                                        {canRemove && !isSelf && (
                                            <button type="button" onClick={() => handleRemove(u)} className="text-red-500 hover:text-red-400 p-1 rounded text-xs" title={t('remove')} aria-label={t('remove')}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
            </div>
        </div>
    );
};

// --- Sub-Component: Role Management ---
const RoleManagement = ({ t, roles }: any) => {
    const { add, update, remove } = useSubmit('roles');
    const { showNotification } = useNotification();
    const [name, setName] = useState('');
    const [selectedRole, setSelectedRole] = useState<any>(null);
    const [originalPermissions, setOriginalPermissions] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [parsedRoles, setParsedRoles] = useState<any[]>([]);

    // Parse permissions in all roles when roles data changes
    React.useEffect(() => {
        const parsed = roles.map((role: any) => ({
            ...role,
            permissions: normalizePermissions(role.permissions),
        }));
        setParsedRoles(parsed);
        if (selectedRole) {
            const updatedRole = parsed.find((r: any) => r.id === selectedRole.id);
            if (updatedRole && !hasChanges) {
                setSelectedRole(updatedRole);
                setOriginalPermissions([...updatedRole.permissions]);
            }
        }
    }, [roles]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = name.toLowerCase().replace(/\s+/g, '_');
        await add({ name, permissions: [] }, id);
        setName('');
    };

    const selectRole = (role: any) => {
        setSelectedRole(role);
        setOriginalPermissions([...normalizePermissions(role.permissions)]);
        setHasChanges(false);
    };

    const togglePerm = (perm: string) => {
        if (!selectedRole) return;
        const current = selectedRole.permissions || [];
        const updated = current.includes(perm) ? current.filter((p: string) => p !== perm) : [...current, perm];
        setSelectedRole({ ...selectedRole, permissions: updated });

        // Check if permissions have changed
        const changed = JSON.stringify(updated.sort()) !== JSON.stringify(originalPermissions.sort());
        setHasChanges(changed);
    };

    const handleUpdatePermissions = async () => {
        if (!selectedRole || !hasChanges) return;

        try {
            const response = await fetch(`${API_URL}/roles/${selectedRole.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ permissions: selectedRole.permissions })
            });
            if (!response.ok) throw new Error('Update failed');
            setOriginalPermissions([...selectedRole.permissions]);
            setHasChanges(false);
            showNotification(t('saved') || 'Permissions updated successfully', 'success');
        } catch (error: any) {
            showNotification(error?.message || 'Update failed', 'error');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card title={t('roleManagement')}>
                    <form onSubmit={handleCreate} className="flex gap-2 mb-4">
                        <Input value={name} onChange={setName} placeholder={t('roleName')} required />
                        <Button type="submit" className="mb-4">{t('add')}</Button>
                    </form>
                    <div className="space-y-2" role="list">
                        {parsedRoles.map((r: any) => (
                            <div
                                key={r.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => selectRole(r)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRole(r); } }}
                                className={`p-3 rounded cursor-pointer flex justify-between items-center ${selectedRole?.id === r.id ? 'bg-blue-900 border border-blue-700' : 'bg-gray-100 dark:bg-gray-700'}`}
                            >
                                <div className="flex flex-col">
                                    <span>{r.name}</span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">{r.permissions?.length || 0} permissions</span>
                                </div>
                                {r.id !== 'super_admin' && <button type="button" className="p-1 hover:opacity-80" onClick={(ev) => { ev.stopPropagation(); if (confirm('Delete?')) remove(r.id); }} aria-label="Delete role"><Trash2 size={16} aria-hidden /></button>}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card title={selectedRole ? `${t('managePermissions')}: ${selectedRole.name}` : t('permissions')}>
                    {selectedRole ? (
                        <>
                            <div className="mb-4 p-3 bg-gray-100/80 dark:bg-gray-700/50 rounded-md border border-gray-300 dark:border-gray-600">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">{selectedRole.permissions?.length || 0}</span> {t('permissionsSelected') || 'permissions selected'} out of {PERMISSIONS.length}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                {PERMISSIONS.map(perm => {
                                    const permArray = selectedRole.permissions || [];
                                    const isChecked = Array.isArray(permArray) && permArray.includes(perm);
                                    return (
                                        <Checkbox
                                            key={perm}
                                            label={t(perm)}
                                            checked={isChecked}
                                            onChange={() => togglePerm(perm)}
                                        />
                                    );
                                })}
                            </div>
                            {hasChanges && (
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                    <Button onClick={handleUpdatePermissions}>
                                        {t('updatePermissions') || 'Update Permissions'}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : <p className="text-gray-500 dark:text-gray-500">Select a role to edit permissions.</p>}
                </Card>
            </div>
        </div>
    );
};

// --- Sub-Component: Config Management (Locations, Categories, Types) ---
const ConfigList = ({ title, data, collection, t, lang, user }: any) => {
    const { add, remove, update } = useSubmit(collection);
    const [en, setEn] = useState('');
    const [fr, setFr] = useState('');
    const isLocations = collection === 'locations';
    const orgCurrency = user?.organization?.currency || 'XAF';
    const [currency, setCurrency] = useState(orgCurrency);

    useEffect(() => {
        setCurrency(orgCurrency);
    }, [orgCurrency]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = en.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4);
        await add({ en, fr, ...(isLocations ? { currency } : {}) }, id);
        setEn(''); setFr('');
        if (isLocations) setCurrency(orgCurrency);
    };

    return (
        <Card title={title} className="h-full">
            <form onSubmit={handleAdd} className="space-y-2 mb-4">
                <Input placeholder={t('name')} value={en} onChange={setEn} required />
                <Input placeholder={t('nameFr')} value={fr} onChange={setFr} required />
                {isLocations && (
                    <Select
                        label={t('locationCurrency')}
                        value={currency}
                        onChange={setCurrency}
                        options={CURRENCY_CODES.map((code) => ({ value: code, label: code }))}
                    />
                )}
                <Button type="submit" className="w-full">{t('add')}</Button>
            </form>
            {isLocations && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('locationCurrencyHint')}</p>}
            <div className="max-h-60 overflow-y-auto space-y-2">
                {data.map((item: any) => (
                    <div key={item.id} className="flex justify-between gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm items-center">
                        <span className="min-w-0 truncate">{getTranslated(item, lang)}</span>
                        <div className="flex items-center gap-2 shrink-0">
                            {isLocations && (
                                <select
                                    value={item.currency || orgCurrency}
                                    onChange={(e) => update(item.id, { currency: e.target.value })}
                                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs p-1"
                                    aria-label={t('locationCurrency')}
                                >
                                    {CURRENCY_CODES.map((code) => (
                                        <option key={code} value={code}>{code}</option>
                                    ))}
                                </select>
                            )}
                            <button type="button" onClick={() => { if (confirm('Delete?')) remove(item.id); }} className="text-red-400"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default function Admin(props: any) {
    const { isGlobalAdmin, t, user } = props;
    const [tab, setTab] = useState('users');
    const { data: users } = useData('users');
    const { data: staff } = useData('staff');
    const { data: roles } = useData('roles');
    const { data: locations } = useData('locations');
    const { data: cats } = useData('expense_categories');
    const { data: types } = useData('inventory_types');
    const { data: positions } = useData('positions');
    const { data: incomeSources } = useData('income_sources');
    const { data: expenseDescriptions } = useData('expense_descriptions');
    const { data: storagePlaces } = useData('storage_places');
    const { add: addUser, update: updateUser, remove: removeUser } = useSubmit('users');

    const perms = user?.role?.permissions ?? [];
    const permList = Array.isArray(perms) ? perms : [];
    const canManageUsers = isGlobalAdmin || permList.includes('perm_manageAdminUsers') || permList.includes('manage_users');
    const canManageRoles = isGlobalAdmin || permList.includes('perm_manageAdminRoles');
    const canManageConfig = isGlobalAdmin || permList.includes('perm_manageAdminConfig');

    const tabs = [
        ...(canManageUsers ? [{ id: 'users' as const, label: t('userManagement') }] : []),
        ...(canManageRoles ? [{ id: 'roles' as const, label: t('roleManagement') }] : []),
        ...(canManageConfig ? [{ id: 'configs' as const, label: t('configManagement') }] : []),
    ];

    const activeTab = tabs.some((x) => x.id === tab) ? tab : tabs[0]?.id ?? 'users';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{t('admin')}</h2>
                {!isGlobalAdmin && (
                    <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-xs border border-blue-700 flex items-center gap-2">
                        <Lock className="w-3 h-3" /> Location Admin
                    </span>
                )}
            </div>

            {tabs.length === 0 ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                    {t('adminNoSubPermission') || "You don't have permission to manage any settings. Contact an administrator to get access to User Management, Role Management, or Config."}
                </div>
            ) : (
                <>
                    <Tabs tabs={tabs} activeTab={activeTab} onChange={setTab} label={t('admin')} />

                    {activeTab === 'users' && canManageUsers && <UserManagement {...props} staff={staff} users={users} roles={roles} locations={locations} addUser={addUser} updateUser={updateUser} removeUser={removeUser} currentUser={user} />}

                    {activeTab === 'roles' && canManageRoles && <RoleManagement {...props} roles={roles} />}
                    {activeTab === 'configs' && canManageConfig && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ConfigList title={t('locationManagement')} data={locations} collection="locations" {...props} />
                            <ConfigList title={t('expenseCategories')} data={cats} collection="expense_categories" {...props} />
                            <ConfigList title={t('inventoryTypes')} data={types} collection="inventory_types" {...props} />
                            <ConfigList title={t('positions') || 'Positions'} data={positions} collection="positions" {...props} />
                            <ConfigList title={t('incomeSources')} data={incomeSources} collection="income_sources" {...props} />
                            <ConfigList title={t('expenseDescriptions')} data={expenseDescriptions} collection="expense_descriptions" {...props} />
                            <ConfigList title={t('storagePlaces')} data={storagePlaces} collection="storage_places" {...props} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
