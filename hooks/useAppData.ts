import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { useNotification } from '../context/NotificationContext';
import { User, Role, normalizePermissions } from '../types';
import { API_URL, UPLOAD_API_URL, USE_MOCKS, USE_HTTPONLY_COOKIES } from '../env';

const USE_API = !USE_MOCKS;

// --- HELPER FUNCTION ---
const OFFLINE_BLOB_PREFIX = 'offline-blob:';
const OFFLINE_BLOBS_KEY = 'offline_upload_blobs';
const offlineBlobUrlCache: Record<string, string> = {};

/** Recreate object URLs for pending offline uploads (survives page reload while offline). */
export const hydrateOfflineBlobUrls = async () => {
    try {
        const blobs: Record<string, any> = (await get(OFFLINE_BLOBS_KEY)) || {};
        for (const [blobId, meta] of Object.entries(blobs)) {
            const key = `${OFFLINE_BLOB_PREFIX}${blobId}`;
            if (offlineBlobUrlCache[key]) continue;
            const buffer = meta?.buffer;
            if (!buffer) continue;
            const blob = new Blob([buffer], { type: meta.type || 'application/octet-stream' });
            offlineBlobUrlCache[key] = URL.createObjectURL(blob);
        }
    } catch { /* ignore */ }
};

// Ensures image URLs are absolute (for handling both old relative URLs and new absolute URLs)
export const getAbsoluteImageUrl = (url: string | undefined): string => {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('data:')) return url;
    if (url.startsWith(OFFLINE_BLOB_PREFIX)) return offlineBlobUrlCache[url] || '';
    if (url.startsWith('http')) return url;
    return `${UPLOAD_API_URL}${url.startsWith('/') ? url : '/' + url}`;
};

// --- API HELPERS ---
const clearAuthAndReload = () => {
    if (!USE_HTTPONLY_COOKIES) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }
    window.location.reload();
};

export const apiFetch = async (endpoint: string, options: any = {}, on401?: () => void) => {
    const headers: any = {
        'Content-Type': 'application/json',
        ...(!USE_HTTPONLY_COOKIES && localStorage.getItem('auth_token')
            ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            : {})
    };
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    const fetchOptions: RequestInit = {
        ...options,
        headers,
        credentials: USE_HTTPONLY_COOKIES ? 'include' : 'same-origin',
    };
    const res = await fetch(fullUrl, fetchOptions);
    if (res.status === 401) {
        const handler = on401 ?? clearAuthAndReload;
        handler();
        throw new Error('Unauthorized');
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || err.error || 'API Request Failed');
    }
    return res.json();
};

// --- OFFLINE SYNC HANDLER ---
const makeOfflineId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `offline_${crypto.randomUUID()}`
        : `offline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/** Immediately reflect offline mutations in the IndexedDB list cache so UI stays consistent. */
const applyOptimisticCollectionWrite = async (
    collectionName: string,
    mutate: (list: any[]) => any[]
) => {
    const cached = (await get(`cache_${collectionName}`)) || [];
    const list = Array.isArray(cached) ? cached : [];
    const next = mutate(list);
    await set(`cache_${collectionName}`, next);
    invalidateCollection(collectionName);
};

const collectionFromEndpoint = (endpoint: string) => {
    const path = String(endpoint || '').replace(/^\//, '');
    return path.split('/')[0] || '';
};

const rewriteOfflineBlobRefs = (text: string, replacements: Record<string, string>) => {
    let out = text;
    for (const [from, to] of Object.entries(replacements)) {
        if (!from || !to) continue;
        out = out.split(from).join(to);
    }
    return out;
};

const rewriteCacheBlobUrls = async (replacements: Record<string, string>) => {
    if (!Object.keys(replacements).length) return;
    const collections = ['inventory', 'staff', 'users', 'estimates', 'estimate_templates'];
    for (const collectionName of collections) {
        const cached = await get(`cache_${collectionName}`);
        if (!Array.isArray(cached) || cached.length === 0) continue;
        let changed = false;
        const next = cached.map((item: any) => {
            let row = item;
            for (const field of ['imageUrl', 'profilePicUrl', 'logoUrl']) {
                const val = row?.[field];
                if (typeof val === 'string' && replacements[val]) {
                    if (row === item) row = { ...item };
                    row[field] = replacements[val];
                    changed = true;
                }
            }
            if (Array.isArray(row?.documents)) {
                let docsChanged = false;
                const docs = row.documents.map((d: any) => {
                    if (typeof d?.url === 'string' && replacements[d.url]) {
                        docsChanged = true;
                        return { ...d, url: replacements[d.url] };
                    }
                    return d;
                });
                if (docsChanged) {
                    if (row === item) row = { ...item };
                    row.documents = docs;
                    changed = true;
                }
            }
            return row;
        });
        if (changed) {
            await set(`cache_${collectionName}`, next);
            invalidateCollection(collectionName);
        }
    }
};

const performOnlineFileUpload = async (
    file: File,
    path: string,
    kind: 'profile' | 'inventory' | 'document' | 'estimate',
    docMeta?: { staffId: string; documentName: string; documentType: string }
) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    let endpoint = `${UPLOAD_API_URL}/upload/profile-picture`;
    if (kind === 'inventory') {
        endpoint = `${UPLOAD_API_URL}/upload/inventory-image`;
    } else if (kind === 'estimate') {
        endpoint = `${UPLOAD_API_URL}/upload/estimate-logo`;
    } else if (kind === 'document') {
        endpoint = `${UPLOAD_API_URL}/upload/document`;
        if (!docMeta?.staffId || !docMeta.documentName || !docMeta.documentType) {
            throw new Error('Document upload requires staffId, documentName, and documentType');
        }
        formData.append('staffId', docMeta.staffId);
        formData.append('documentName', docMeta.documentName);
        formData.append('documentType', docMeta.documentType);
    }
    const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: USE_HTTPONLY_COOKIES ? 'include' : 'same-origin',
        headers: USE_HTTPONLY_COOKIES ? {} : {
            ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {})
        }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data.message || data.error || data.details || `Upload failed (${res.status})`;
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    if (kind === 'document') {
        const doc = data.document ?? data;
        const rawUrl = doc.url ?? data.url ?? '';
        const url = rawUrl.startsWith('http') ? rawUrl : `${UPLOAD_API_URL}${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`;
        return {
            url,
            path: doc.path ?? data.path,
            id: doc.id ?? data.id,
            name: doc.name ?? data.name ?? docMeta?.documentName,
            type: doc.type ?? data.type ?? docMeta?.documentType,
            uploadedAt: doc.uploadedAt ?? data.uploadedAt,
        };
    }
    const absoluteUrl = data.url?.startsWith('http') ? data.url : `${UPLOAD_API_URL}${data.url}`;
    return { url: absoluteUrl, path: data.path ?? data.filename };
};

const persistOfflineFileUpload = async (
    file: File,
    path: string,
    kind: 'profile' | 'inventory' | 'document' | 'estimate',
    docMeta?: { staffId: string; documentName: string; documentType: string }
) => {
    const blobId = makeOfflineId().replace(/^offline_/, '');
    const placeholder = `${OFFLINE_BLOB_PREFIX}${blobId}`;
    const buffer = await file.arrayBuffer();
    const blobs: Record<string, any> = (await get(OFFLINE_BLOBS_KEY)) || {};
    blobs[blobId] = {
        buffer,
        name: file.name || 'upload.bin',
        type: file.type || 'application/octet-stream',
        kind,
        path,
        ...(kind === 'document' && docMeta ? docMeta : {}),
    };
    await set(OFFLINE_BLOBS_KEY, blobs);

    if (kind !== 'document') {
        const objectUrl = URL.createObjectURL(file);
        offlineBlobUrlCache[placeholder] = objectUrl;
    }

    const queue: any[] = (await get('offline_action_queue')) || [];
    queue.push({
        type: 'file_upload',
        kind,
        path,
        blobId,
        endpoint:
            kind === 'inventory'
                ? '/upload/inventory-image'
                : kind === 'estimate'
                    ? '/upload/estimate-logo'
                    : kind === 'document'
                        ? '/upload/document'
                        : '/upload/profile-picture',
        ...(kind === 'document' && docMeta ? docMeta : {}),
    });
    await set('offline_action_queue', queue);

    const docId = kind === 'document' ? `offline_doc_${blobId}` : undefined;
    return {
        url: placeholder,
        path,
        offline: true,
        blobId,
        id: docId,
        name: docMeta?.documentName,
        type: docMeta?.documentType,
        uploadedAt: new Date().toISOString(),
    };
};

/** Queue a JSON API mutation for sync when back online. */
export const queueOfflineApiAction = async (endpoint: string, method: string, body?: any) => {
    const queue: any[] = (await get('offline_action_queue')) || [];
    queue.push({
        endpoint,
        options: { method, body: body !== undefined ? JSON.stringify(body) : undefined },
    });
    await set('offline_action_queue', queue);
};

export const syncOfflineActions = async () => {
    if (!navigator.onLine) return;
    const queue: any[] = (await get('offline_action_queue')) || [];
    if (queue.length === 0) return;

    const uploadActions = queue.filter((a) => a?.type === 'file_upload');
    const otherActions = queue.filter((a) => a?.type !== 'file_upload');
    const remainingQueue: any[] = [];
    const syncedCollections = new Set<string>();
    const urlReplacements: Record<string, string> = {};

    for (const action of uploadActions) {
        try {
            const blobs: Record<string, any> = (await get(OFFLINE_BLOBS_KEY)) || {};
            const meta = blobs[action.blobId];
            if (!meta?.buffer) continue;
            const file = new File([meta.buffer], meta.name || 'upload.bin', {
                type: meta.type || 'application/octet-stream',
            });
            const kind = (meta.kind || action.kind || 'profile') as 'profile' | 'inventory' | 'document' | 'estimate';
            const uploaded = await performOnlineFileUpload(
                file,
                meta.path || action.path || 'uploads',
                kind,
                kind === 'document'
                    ? {
                        staffId: meta.staffId || action.staffId,
                        documentName: meta.documentName || action.documentName,
                        documentType: meta.documentType || action.documentType,
                    }
                    : undefined
            );
            const placeholder = `${OFFLINE_BLOB_PREFIX}${action.blobId}`;
            urlReplacements[placeholder] = uploaded.url;
            if (offlineBlobUrlCache[placeholder]) {
                try { URL.revokeObjectURL(offlineBlobUrlCache[placeholder]); } catch { /* ignore */ }
                delete offlineBlobUrlCache[placeholder];
            }
            delete blobs[action.blobId];
            await set(OFFLINE_BLOBS_KEY, blobs);
            if (kind === 'document') {
                syncedCollections.add('staff');
            } else if (kind === 'estimate') {
                syncedCollections.add('estimates');
                syncedCollections.add('estimate_templates');
            } else if (kind === 'inventory') {
                syncedCollections.add('inventory');
            }
        } catch (e: any) {
            if (e.message === 'Failed to fetch' || String(e.message || '').includes('Network')) {
                remainingQueue.push(action);
            }
        }
    }

    for (const action of otherActions) {
        try {
            let options = { ...(action.options || {}) };
            if (typeof options.body === 'string' && Object.keys(urlReplacements).length) {
                options = { ...options, body: rewriteOfflineBlobRefs(options.body, urlReplacements) };
            }
            await apiFetch(action.endpoint, options);
            const col = collectionFromEndpoint(action.endpoint);
            if (col) syncedCollections.add(col);
        } catch (e: any) {
            // If it failed due to a genuine network error, keep it in the queue for later
            if (e.message === 'Failed to fetch' || e.message.includes('Network')) {
                remainingQueue.push(action);
            }
        }
    }
    await set('offline_action_queue', remainingQueue);
    await rewriteCacheBlobUrls(urlReplacements);

    for (const col of syncedCollections) {
        invalidateCollection(col);
    }

    // After sync, alert user dynamically if things finished
    if (remainingQueue.length === 0 && queue.length > 0) {
        // Dispatch custom event to notify UI if needed
        window.dispatchEvent(new Event('offline-sync-complete'));
    }
};

if (typeof window !== 'undefined') {
    window.addEventListener('online', syncOfflineActions);
}

// --- AUTH HOOK ---
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showNotification } = useNotification();

    const applyAuthSuccess = (res: { token?: string; user: User; role?: Role }) => {
        const apiUser = res.user;
        if (!USE_HTTPONLY_COOKIES && res.token) {
            localStorage.setItem('auth_token', res.token);
            localStorage.setItem('user_data', JSON.stringify(apiUser));
        }
        setUser(apiUser);
        if (res.role) {
            const normalizedRole = {
                ...res.role,
                permissions: normalizePermissions(res.role.permissions),
            };
            setCurrentUserRole(normalizedRole);
            if (!USE_HTTPONLY_COOKIES) {
                localStorage.setItem('user_role', JSON.stringify(normalizedRole));
            }
        }
    };

    useEffect(() => {
        if (!USE_API) {
            setLoading(false);
            return;
        }
        if (USE_HTTPONLY_COOKIES) {
            apiFetch('/auth/session')
                .then((data: { user?: User; role?: Role }) => {
                    if (!data?.user) {
                        setLoading(false);
                        return;
                    }
                    applyAuthSuccess({ user: data.user, role: data.role });
                })
                .catch(() => { /* not authenticated or offline */ })
                .finally(() => setLoading(false));
            return;
        }
        const token = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('user_data');
        const savedRole = localStorage.getItem('user_role');
        if (!token || !savedUser) {
            setLoading(false);
            return;
        }
        const u = JSON.parse(savedUser);
        setUser(u);

        if (savedRole) {
            setCurrentUserRole(JSON.parse(savedRole));
        }

        if (navigator.onLine) {
            apiFetch(`/roles/${u.roleId || ''}`)
                .then((r: Role) => {
                    const normalizedRole = {
                        ...r,
                        permissions: normalizePermissions(r.permissions),
                    };
                    setCurrentUserRole(normalizedRole);
                    localStorage.setItem('user_role', JSON.stringify(normalizedRole));
                })
                .catch(() => { /* role fetch failed */ })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    /** Step 1: validate credentials and request OTP. Returns { email, devOtp? }. */
    const loginStart = async (e: string, p: string) => {
        const res = await apiFetch('/auth/login/start', {
            method: 'POST',
            body: JSON.stringify({ email: e, password: p }),
        }) as { otpRequired?: boolean; email: string; message?: string; devOtp?: string };
        showNotification(res.message || 'Verification code sent', 'success');
        return res;
    };

    /** Step 2: verify OTP and establish session. */
    const loginVerify = async (email: string, code: string) => {
        setLoading(true);
        try {
            const res = await apiFetch('/auth/login/verify', {
                method: 'POST',
                body: JSON.stringify({ email, code }),
            }) as { token?: string; user: User; role?: Role };
            applyAuthSuccess(res);
            if (!res.role && res.user?.roleId) {
                try {
                    const role: Role = await apiFetch(`/roles/${res.user.roleId}`);
                    applyAuthSuccess({ user: res.user, role, token: res.token });
                } catch { /* ignore */ }
            }
            setLoading(false);
            showNotification('Login successful', 'success');
        } catch (err: any) {
            setLoading(false);
            showNotification(err.message, 'error');
            throw err;
        }
    };

    /** Legacy: still used by old Login — starts OTP flow. Prefer loginStart + loginVerify. */
    const login = async (e: string, p: string) => {
        return loginStart(e, p);
    };

    const signupStart = async (payload: {
        email: string;
        password: string;
        organizationName: string;
        firstName?: string;
        lastName?: string;
    }) => {
        const res = await apiFetch('/auth/signup/start', {
            method: 'POST',
            body: JSON.stringify(payload),
        }) as { otpRequired?: boolean; email: string; message?: string; devOtp?: string };
        showNotification(res.message || 'Verification code sent', 'success');
        return res;
    };

    const signupVerify = async (email: string, code: string) => {
        setLoading(true);
        try {
            const res = await apiFetch('/auth/signup/verify', {
                method: 'POST',
                body: JSON.stringify({ email, code }),
            }) as { token?: string; user: User; role?: Role };
            applyAuthSuccess(res);
            setLoading(false);
            showNotification('Account created', 'success');
        } catch (err: any) {
            setLoading(false);
            showNotification(err.message, 'error');
            throw err;
        }
    };

    const resendOtp = async (email: string, purpose: 'signup' | 'login' | 'invite') => {
        const res = await apiFetch('/auth/otp/resend', {
            method: 'POST',
            body: JSON.stringify({ email, purpose }),
        }) as { message?: string; devOtp?: string };
        showNotification(res.message || 'Code resent', 'success');
        return res;
    };

    const inviteAcceptStart = async (payload: {
        token: string;
        password: string;
        firstName?: string;
        lastName?: string;
    }) => {
        const res = await apiFetch('/invites/accept/start', {
            method: 'POST',
            body: JSON.stringify(payload),
        }) as { otpRequired?: boolean; email: string; organizationName?: string; message?: string; devOtp?: string };
        showNotification(res.message || 'Verification code sent', 'success');
        return res;
    };

    const inviteAcceptVerify = async (email: string, code: string) => {
        setLoading(true);
        try {
            const res = await apiFetch('/invites/accept/verify', {
                method: 'POST',
                body: JSON.stringify({ email, code }),
            }) as { token?: string; user: User; role?: Role };
            applyAuthSuccess(res);
            setLoading(false);
            showNotification('Welcome to the organization', 'success');
        } catch (err: any) {
            setLoading(false);
            showNotification(err.message, 'error');
            throw err;
        }
    };

    const refreshUser = async () => {
        if (!USE_API || !user) return;
        try {
            const res = await apiFetch('/auth/session') as { user: User; role?: Role };
            applyAuthSuccess(res);
        } catch { /* ignore */ }
    };

    const logout = async () => {
        if (USE_API) {
            if (USE_HTTPONLY_COOKIES) {
                try {
                    await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
                } catch { /* ignore */ }
            } else {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_data');
                localStorage.removeItem('user_role');
            }
        }
        setUser(null);
        setCurrentUserRole(null);
        showNotification('Logged out', 'info');
        if (USE_API) window.location.reload();
    };

    const changePassword = async (oldPassword: string, newPassword: string) => {
        if (USE_API) {
            if (!user) return;
            await apiFetch('/update-password', {
                method: 'PUT',
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const updated = { ...user, passwordNeedsReset: false };
            setUser(updated);
            if (!USE_HTTPONLY_COOKIES) {
                localStorage.setItem('user_data', JSON.stringify(updated));
            }
            showNotification('Password updated', 'success');
            return;
        }
    };

    return {
        user,
        currentUserRole,
        loading,
        error,
        login,
        loginStart,
        loginVerify,
        signupStart,
        signupVerify,
        resendOtp,
        inviteAcceptStart,
        inviteAcceptVerify,
        refreshUser,
        logout,
        changePassword,
        isDemo: false,
    };
}

/** Dispatch this after add/update/remove so useData refetches the given collection. */
export function invalidateCollection(collection: string) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('data-invalidated', { detail: { collection } }));
    }
}

// --- DATA HOOK ---
export function useData(collectionName: string, locationId?: string | null) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Helper to filter local arrays for display optimization if API returns all
    const filterData = (items: any[]) => {
        if (locationId && locationId !== 'all') {
            if (collectionName === 'staff') {
                return items.filter((i: any) => {
                    if (i.locationIds && Array.isArray(i.locationIds) && i.locationIds.includes(locationId)) return true;
                    if (i.locations && Array.isArray(i.locations)) {
                        return i.locations.some((ln: any) =>
                            ln.locationId === locationId || (ln.location && ln.location.id === locationId)
                        );
                    }
                    return false;
                });
            } else if (['income', 'expenses', 'inventory', 'inventory_events', 'estimates'].includes(collectionName)) {
                return items.filter((i: any) => i.locationId === locationId);
            }
        }
        return items;
    };

    useEffect(() => {
        if (!collectionName) return () => {};

        let cancelled = false;

        const fetchLocal = async () => {
            const cached = await get(`cache_${collectionName}`);
            if (cached) setData(filterData(cached));
            setLoading(false);
        };

        const doFetch = () => {
            setLoading(true);
            if (!USE_API) {
                setLoading(false);
                return;
            }
            if (!navigator.onLine) {
                fetchLocal();
                return;
            }
            const query =
                collectionName === 'staff' && locationId && String(locationId).trim() && locationId !== 'all'
                    ? `?locationId=${encodeURIComponent(String(locationId).trim())}`
                    : '';
            apiFetch(`/${collectionName}${query}`)
                .then(async (items: any[]) => {
                    if (cancelled) return;
                    const list = Array.isArray(items) ? items : (items?.data ?? []);
                    await set(`cache_${collectionName}`, list);
                    setData(filterData(list));
                    setLoading(false);
                })
                .catch(() => {
                    if (!cancelled) fetchLocal();
                });
        };

        doFetch();

        const handler = (e: Event) => {
            const detail = (e as CustomEvent<{ collection: string }>).detail;
            if (detail?.collection === collectionName) doFetch();
        };
        window.addEventListener('data-invalidated', handler);
        return () => {
            cancelled = true;
            window.removeEventListener('data-invalidated', handler);
        };
    }, [collectionName, locationId]);

    return { data, loading };
}

// --- SUBMIT HOOK ---
export function useSubmit(collectionName: string) {
    const [submitting, setSubmitting] = useState(false);
    const { showNotification } = useNotification();

    const queueAction = async (endpoint: string, method: string, body?: any) => {
        const queue: any[] = (await get('offline_action_queue')) || [];
        queue.push({ endpoint, options: { method, body: body ? JSON.stringify(body) : undefined } });
        await set('offline_action_queue', queue);
    };

    const persistOfflineAdd = async (body: any) => {
        const now = new Date().toISOString();
        const offlineBody = {
            ...body,
            id: body.id || makeOfflineId(),
            createdAt: body.createdAt || now,
            updatedAt: now,
        };
        await queueAction(`/${collectionName}`, 'POST', offlineBody);
        await applyOptimisticCollectionWrite(collectionName, (list) => {
            if (list.some((i: any) => i.id === offlineBody.id)) return list;
            return [...list, offlineBody];
        });
        return { offline: true, id: offlineBody.id };
    };

    const persistOfflineUpdate = async (id: string, data: any) => {
        const patch = { ...data, updatedAt: new Date().toISOString() };
        await queueAction(`/${collectionName}/${id}`, 'PUT', data);
        await applyOptimisticCollectionWrite(collectionName, (list) =>
            list.map((i: any) => (i.id === id ? { ...i, ...patch } : i))
        );
        return true;
    };

    const persistOfflineRemove = async (id: string) => {
        await queueAction(`/${collectionName}/${id}`, 'DELETE');
        await applyOptimisticCollectionWrite(collectionName, (list) =>
            list.filter((i: any) => i.id !== id)
        );
        return true;
    };

    const add = async (data: any, customId?: string) => {
        setSubmitting(true);

        if (USE_API) {
            try {
                const body = { ...data, ...(customId ? { id: customId } : {}) };
                if (!navigator.onLine) {
                    const result = await persistOfflineAdd(body);
                    setSubmitting(false);
                    showNotification('Saved offline. Will sync when online.', 'info');
                    return result;
                }
                const res = await apiFetch(`/${collectionName}`, {
                    method: 'POST',
                    body: JSON.stringify(body)
                });

                setSubmitting(false);
                invalidateCollection(collectionName);
                showNotification(collectionName === 'users' ? 'User created successfully' : 'Saved', 'success');
                return res;
            } catch (e: any) {
                setSubmitting(false);
                if (e.message === 'Failed to fetch' || e.message.includes('Network')) {
                    const body = { ...data, ...(customId ? { id: customId } : {}) };
                    const result = await persistOfflineAdd(body);
                    showNotification('Network lost. Saved offline to sync later.', 'warning');
                    return result;
                }
                showNotification(e.message, 'error');
                return false;
            }
        }
        return false;
    };

    const update = async (id: string, data: any) => {
        setSubmitting(true);

        if (USE_API) {
            try {
                if (!navigator.onLine) {
                    await persistOfflineUpdate(id, data);
                    setSubmitting(false);
                    showNotification('Saved offline. Will sync when online.', 'info');
                    return true;
                }
                const result = await apiFetch(`/${collectionName}/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                setSubmitting(false);
                invalidateCollection(collectionName);
                showNotification('Updated', 'success');
                return result;
            } catch (e: any) {
                setSubmitting(false);
                if (e.message === 'Failed to fetch' || e.message.includes('Network')) {
                    await persistOfflineUpdate(id, data);
                    showNotification('Network lost. Saved offline to sync later.', 'warning');
                    return true;
                }
                showNotification(e.message || 'Update failed', 'error');
                return false;
            }
        }
        return false;
    };


    const remove = async (id: string) => {
        setSubmitting(true);

        if (USE_API) {
            try {
                if (!navigator.onLine) {
                    await persistOfflineRemove(id);
                    setSubmitting(false);
                    showNotification('Delete queued offline. Will sync when online.', 'info');
                    return true;
                }
                await apiFetch(`/${collectionName}/${id}`, { method: 'DELETE' });
                setSubmitting(false);
                invalidateCollection(collectionName);
                showNotification('Deleted', 'success');
                return true;
            } catch (e: any) {
                setSubmitting(false);
                if (e.message === 'Failed to fetch' || e.message.includes('Network')) {
                    await persistOfflineRemove(id);
                    showNotification('Network lost. Delete queued offline.', 'warning');
                    return true;
                }
                showNotification(e.message, 'error');
                return false;
            }
        }
        return false;
    };

    const removeDocument = async (id: string) => {
        // if (!window.confirm("Are you sure?")) return false;
        setSubmitting(true);

        if (USE_API) {
            try {
                await apiFetch(`/staff_documents/${id}`, { method: 'DELETE' });
                setSubmitting(false);
                invalidateCollection('staff');
                showNotification('Deleted', 'success');
                return true;
            } catch (e: any) {
                setSubmitting(false);
                showNotification(e.message, 'error');
                return false;
            }
        }
        return false;
    };

    return { add, update, remove, removeDocument, submitting };
}

// --- STORAGE HOOK ---
export function useStorage() {
    const [uploading, setUploading] = useState(false);
    const { showNotification } = useNotification();

    const upload = async (file: File, path: string, options?: { kind?: 'profile' | 'inventory' | 'estimate' }) => {
        setUploading(true);
        const kind = options?.kind === 'inventory' ? 'inventory' : options?.kind === 'estimate' ? 'estimate' : 'profile';

        if (USE_API) {
            try {
                if (!navigator.onLine) {
                    const result = await persistOfflineFileUpload(file, path, kind);
                    setUploading(false);
                    showNotification('Image saved offline. Will upload when online.', 'info');
                    return result;
                }
                const uploaded = await performOnlineFileUpload(file, path, kind);
                setUploading(false);
                return uploaded;
            } catch (e: any) {
                if (e.message === 'Failed to fetch' || String(e.message || '').includes('Network')) {
                    try {
                        const result = await persistOfflineFileUpload(file, path, kind);
                        setUploading(false);
                        showNotification('Network lost. Image saved offline to upload later.', 'warning');
                        return result;
                    } catch (offlineErr: any) {
                        setUploading(false);
                        showNotification(offlineErr?.message || 'Upload failed', 'error');
                        throw offlineErr;
                    }
                }
                setUploading(false);
                showNotification(e?.message || 'Upload failed', 'error');
                throw e;
            }
        }
        return { url: '', path: '' };
    };

    const uploadInventoryImage = async (file: File, path = 'inventory') =>
        upload(file, path, { kind: 'inventory' });

    const uploadEstimateLogo = async (file: File, path = 'estimates') =>
        upload(file, path, { kind: 'estimate' });

    /** Upload a staff document (HR). Uses same auth/credentials as upload so cookie and token auth work. */
    const uploadDocument = async (
        file: File,
        staffId: string,
        documentName: string,
        documentType: string,
        path: string
    ): Promise<{ url: string; path?: string; id?: string; name?: string; type?: string; uploadedAt?: string; offline?: boolean }> => {
        setUploading(true);
        const docMeta = { staffId, documentName, documentType };
        if (USE_API) {
            try {
                if (!navigator.onLine) {
                    const result = await persistOfflineFileUpload(file, path, 'document', docMeta);
                    setUploading(false);
                    showNotification('Document saved offline. Will upload when online.', 'info');
                    return result;
                }
                const uploaded = await performOnlineFileUpload(file, path, 'document', docMeta);
                setUploading(false);
                return uploaded;
            } catch (e: any) {
                if (e.message === 'Failed to fetch' || String(e.message || '').includes('Network')) {
                    try {
                        const result = await persistOfflineFileUpload(file, path, 'document', docMeta);
                        setUploading(false);
                        showNotification('Network lost. Document saved offline to upload later.', 'warning');
                        return result;
                    } catch (offlineErr: any) {
                        setUploading(false);
                        showNotification(offlineErr?.message || 'Upload failed', 'error');
                        throw offlineErr;
                    }
                }
                setUploading(false);
                showNotification(e?.message || 'Upload failed', 'error');
                throw e;
            }
        }
        setUploading(false);
        return { url: '', path: '' };
    };

    return { upload, uploadInventoryImage, uploadEstimateLogo, uploadDocument, uploading };
}
