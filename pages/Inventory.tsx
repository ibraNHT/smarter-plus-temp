import React, { useMemo, useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { useData, useSubmit, useStorage, apiFetch, invalidateCollection, getAbsoluteImageUrl } from '../hooks/useAppData';
import { Card, Input, Button, Select, SuggestInput } from '../components/UI';
import {
  formatCurrency,
  getTranslated,
  isLockedAfter24Hours,
  deriveInventoryStatus,
  statusAfterIncident,
  isExpiringSoon,
  isInventoryLossReason,
} from '../constants';
import type { InventoryEventReason, InventoryItem, InventoryStatus } from '../types';
import { Edit2, Trash2, AlertTriangle, ImageIcon } from 'lucide-react';

const STATUS_BADGE: Record<InventoryStatus, string> = {
  available: 'bg-green-900/50 text-green-300 border-green-700',
  damaged: 'bg-orange-900/40 text-orange-300 border-orange-700',
  expired: 'bg-yellow-900/40 text-yellow-200 border-yellow-700',
  missing: 'bg-red-900/40 text-red-300 border-red-700',
};

const LOSS_REASONS: InventoryEventReason[] = ['damaged', 'expired', 'stolen'];

export default function Inventory({ t, locationId, user, currency, lang }: any) {
  const { data: items, loading } = useData('inventory', locationId);
  const { data: events = [] } = useData('inventory_events', locationId);
  const { data: types } = useData('inventory_types');
  const { data: locations = [] } = useData('locations');
  const { data: storagePlaces = [] } = useData('storage_places');
  const { add, remove, update, submitting } = useSubmit('inventory');
  const { uploadInventoryImage, uploading } = useStorage();

  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [qty, setQty] = useState('');
  const [val, setVal] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [notes, setNotes] = useState('');
  const [storagePlace, setStoragePlace] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [removeModal, setRemoveModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [incidentModal, setIncidentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    typeId: '',
    value: '',
    expiresOn: '',
    notes: '',
    storagePlace: '',
    imageUrl: '' as string,
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [incidentForm, setIncidentForm] = useState({ reason: 'damaged' as InventoryEventReason, quantity: '1', note: '' });
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false);

  const { showNotification } = useNotification();

  const hasPermissionFor = (action: string) => {
    const permissionMap: Record<string, string> = {
      view: 'perm_viewInventory',
      add: 'perm_addInventory',
      update: 'perm_updateInventory',
      delete: 'perm_deleteInventory',
    };
    const perms = user?.role?.permissions;
    const list = Array.isArray(perms) ? perms : [];
    return list.includes(permissionMap[action]);
  };

  const health = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const ev = Array.isArray(events) ? events : [];
    const availableValue = list.reduce((a: number, i: InventoryItem) => a + (i.value ?? 0) * (i.quantity ?? 0), 0);
    const byReason = (reason: string) =>
      ev.filter((e: any) => e.reason === reason).reduce((a: number, e: any) => a + (Number(e.quantity) || 0), 0);
    const damaged = byReason('damaged');
    const expired = byReason('expired');
    const stolen = byReason('stolen');
    const lossValue = ev
      .filter((e: any) => LOSS_REASONS.includes(e.reason))
      .reduce((a: number, e: any) => {
        const item = list.find((i: InventoryItem) => i.id === e.inventoryId);
        const unit = e.unitValue ?? item?.value ?? 0;
        return a + unit * (Number(e.quantity) || 0);
      }, 0);
    const expiringSoon = list.filter((i: InventoryItem) => isExpiringSoon(i.expiresOn)).length;
    return { availableValue, damaged, expired, stolen, lossValue, expiringSoon };
  }, [items, events]);

  const filteredItems = useMemo(() => {
    let list: InventoryItem[] = Array.isArray(items) ? items : [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) => (i.name || '').toLowerCase().includes(q));
    }
    if (filterType !== 'all') list = list.filter((i) => i.typeId === filterType);
    if (filterStatus !== 'all') {
      list = list.filter((i) => deriveInventoryStatus(i) === filterStatus);
    }
    if (expiringSoonOnly) list = list.filter((i) => isExpiringSoon(i.expiresOn));
    return list;
  }, [items, search, filterType, filterStatus, expiringSoonOnly]);

  const resetCreateForm = () => {
    setName('');
    setQty('');
    setVal('');
    setTypeId('');
    setExpiresOn('');
    setNotes('');
    setStoragePlace('');
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const onCreateImageChange = (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || locationId === 'all') return alert(t('errorNoLocation'));

    if (!hasPermissionFor('add')) {
      showNotification(t('inventoryNoPermAdd'), 'error');
      return;
    }

    const quantity = parseInt(qty, 10);
    const value = parseFloat(val);
    let imageUrl: string | undefined;
    if (imageFile) {
      try {
        const uploaded = await uploadInventoryImage(imageFile);
        imageUrl = uploaded.url || undefined;
      } catch {
        showNotification(t('inventoryImageUploadFailed'), 'error');
        return;
      }
    }

    await add({
      name,
      typeId,
      quantity,
      value,
      locationId,
      userId: user.id,
      date: new Date().toISOString(),
      status: 'available',
      expiresOn: expiresOn || null,
      notes: notes || undefined,
      storagePlace: storagePlace.trim() || undefined,
      imageUrl: imageUrl || undefined,
    });
    showNotification(t('inventoryAdded'), 'success');
    resetCreateForm();
  };

  const openRemoveModal = (item: InventoryItem) => {
    if (isLockedAfter24Hours(item?.createdAt)) {
      showNotification(t('locked24hMessage'), 'error');
      return;
    }
    setSelectedItem(item);
    setRemoveModal(true);
  };

  const openUpdateModal = (item: InventoryItem) => {
    if (isLockedAfter24Hours(item?.createdAt)) {
      showNotification(t('locked24hMessage'), 'error');
      return;
    }
    setSelectedItem(item);
    setEditForm({
      name: item.name || '',
      typeId: item.typeId || '',
      value: String(item.value ?? ''),
      expiresOn: item.expiresOn ? String(item.expiresOn).slice(0, 10) : '',
      notes: item.notes || '',
      storagePlace: item.storagePlace || '',
      imageUrl: item.imageUrl || '',
    });
    setEditImageFile(null);
    setEditImagePreview(null);
    setUpdateModal(true);
  };

  const openIncidentModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIncidentForm({ reason: 'damaged', quantity: '1', note: '' });
    setIncidentModal(true);
  };

  const handleRemove = async () => {
    if (!selectedItem) {
      alert(t('errorNoInventory'));
      return;
    }
    if (!hasPermissionFor('delete')) {
      showNotification(t('inventoryNoPermDelete'), 'error');
      setRemoveModal(false);
      setSelectedItem(null);
      return;
    }
    const result = await remove(selectedItem.id);
    if (result) showNotification(t('inventoryRemoved'), 'success');
    else showNotification(t('inventoryIncidentFailed'), 'error');
    setRemoveModal(false);
    setSelectedItem(null);
  };

  const handleUpdate = async () => {
    if (!selectedItem) {
      alert(t('errorNoInventory'));
      return;
    }
    if (!hasPermissionFor('update')) {
      showNotification(t('inventoryNoPermUpdate'), 'error');
      setUpdateModal(false);
      setSelectedItem(null);
      return;
    }
    const payload: Record<string, unknown> = {
      name: editForm.name,
      typeId: editForm.typeId,
      value: parseFloat(editForm.value),
      expiresOn: editForm.expiresOn || null,
      notes: editForm.notes || undefined,
      storagePlace: editForm.storagePlace.trim() || null,
      status: deriveInventoryStatus({
        quantity: selectedItem.quantity,
        status: selectedItem.status,
        expiresOn: editForm.expiresOn || null,
      }),
    };
    if (editImageFile) {
      try {
        const uploaded = await uploadInventoryImage(editImageFile);
        payload.imageUrl = uploaded.url || null;
      } catch {
        showNotification(t('inventoryImageUploadFailed'), 'error');
        return;
      }
    } else if (editForm.imageUrl) {
      payload.imageUrl = editForm.imageUrl;
    }
    const result = await update(selectedItem.id, payload);
    if (result) showNotification(t('inventoryUpdated'), 'success');
    setUpdateModal(false);
    setSelectedItem(null);
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const handleIncident = async () => {
    if (!selectedItem) {
      alert(t('errorNoInventory'));
      return;
    }
    if (!hasPermissionFor('update')) {
      showNotification(t('inventoryNoPermUpdate'), 'error');
      return;
    }
    if (!locationId || locationId === 'all') {
      alert(t('errorNoLocation'));
      return;
    }

    const reason = incidentForm.reason;
    const qtyNum = parseInt(incidentForm.quantity, 10);
    if (!qtyNum || qtyNum < 1) {
      showNotification(t('inventoryIncidentQtyInvalid'), 'error');
      return;
    }
    if ((reason === 'stolen' || reason === 'damaged') && !incidentForm.note.trim()) {
      showNotification(t('inventoryIncidentNoteRequired'), 'error');
      return;
    }

    const onHand = selectedItem.quantity ?? 0;
    let nextQty = onHand;
    if (isInventoryLossReason(reason)) {
      if (qtyNum > onHand) {
        showNotification(t('inventoryIncidentQtyInvalid'), 'error');
        return;
      }
      nextQty = onHand - qtyNum;
    } else {
      nextQty = onHand + qtyNum;
    }

    const nextStatus = statusAfterIncident(reason, nextQty, selectedItem.expiresOn);

    setIncidentSubmitting(true);
    try {
      await apiFetch('/inventory_events', {
        method: 'POST',
        body: JSON.stringify({
          inventoryId: selectedItem.id,
          locationId,
          reason,
          quantity: qtyNum,
          note: incidentForm.note.trim() || undefined,
          userId: user.id,
          createdAt: new Date().toISOString(),
          unitValue: selectedItem.value,
        }),
      });
      await apiFetch(`/inventory/${selectedItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...selectedItem,
          quantity: nextQty,
          status: nextStatus,
        }),
      });
      invalidateCollection('inventory_events');
      invalidateCollection('inventory');
      showNotification(t('inventoryIncidentSuccess'), 'success');
      setIncidentModal(false);
      setSelectedItem(null);
    } catch (err: any) {
      showNotification(err?.message || t('inventoryIncidentFailed'), 'error');
    } finally {
      setIncidentSubmitting(false);
    }
  };

  const typeOptions = [
    { value: '', label: '...', disabled: true },
    ...(types || []).map((c: any) => ({ value: c.id, label: getTranslated(c, lang) })),
  ];

  const storagePlaceOptions = useMemo(
    () =>
      (storagePlaces || []).map((p: any) => {
        const label = getTranslated(p, lang);
        return { value: label, label };
      }),
    [storagePlaces, lang]
  );

  const siteLabel = locationId && locationId !== 'all'
    ? getTranslated(locations.find((l: any) => l.id === locationId), lang)
    : t('allLocations');

  return (
    <div className="space-y-6">
      {/* Health strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('inventoryAvailableValue')}</p>
          <p className="text-lg font-semibold text-green-400">{formatCurrency(health.availableValue, currency)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('inventoryLossValue')}</p>
          <p className="text-lg font-semibold text-red-400">{formatCurrency(health.lossValue, currency)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('inventoryDamagedUnits')}</p>
          <p className="text-lg font-semibold text-orange-400">{health.damaged}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('inventoryExpiredUnits')}</p>
          <p className="text-lg font-semibold text-yellow-500">{health.expired}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('inventoryStolenUnits')}</p>
          <p className="text-lg font-semibold text-red-400">{health.stolen}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('inventoryExpiringSoonCount')}</p>
          <p className="text-lg font-semibold text-blue-400">{health.expiringSoon}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-3">
          <Card title={t('add')}>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('inventorySiteLabel')}</label>
                <div className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600">
                  {siteLabel}
                </div>
              </div>
              <Input label={t('item')} value={name} onChange={setName} required />
              <Select label={t('type')} value={typeId} onChange={setTypeId} required options={typeOptions} />
              <Input label={t('quantity')} type="number" value={qty} onChange={setQty} required />
              <Input label={t('value')} type="number" value={val} onChange={setVal} required />
              <SuggestInput
                label={t('inventoryStoragePlace')}
                value={storagePlace}
                onChange={setStoragePlace}
                options={storagePlaceOptions}
                listId="inventory-storage-place-list"
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 -mt-2 mb-3">{t('inventoryStoragePlaceHint')}</p>
              <Input label={t('inventoryExpiresOn')} type="date" value={expiresOn} onChange={setExpiresOn} />
              <Input label={t('inventoryNotes')} value={notes} onChange={setNotes} />
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('inventoryImage')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onCreateImageChange(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white file:text-sm"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="" className="mt-2 h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600" />
                )}
              </div>
              <Button type="submit" disabled={submitting || uploading} className="w-full">{t('add')}</Button>
            </form>
          </Card>
        </div>

        <div className="xl:col-span-9 space-y-4 min-w-0">
          <Card title={t('inventory')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <Input label={t('inventorySearch')} value={search} onChange={setSearch} />
              <Select
                label={t('inventoryFilterStatus')}
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: 'all', label: t('inventoryFilterAll') },
                  { value: 'available', label: t('inventoryStatus_available') },
                  { value: 'damaged', label: t('inventoryStatus_damaged') },
                  { value: 'expired', label: t('inventoryStatus_expired') },
                  { value: 'missing', label: t('inventoryStatus_missing') },
                ]}
              />
              <Select
                label={t('inventoryFilterType')}
                value={filterType}
                onChange={setFilterType}
                options={[
                  { value: 'all', label: t('inventoryFilterAll') },
                  ...(types || []).map((c: any) => ({ value: c.id, label: getTranslated(c, lang) })),
                ]}
              />
              <label className="flex items-end gap-2 pb-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={expiringSoonOnly}
                  onChange={(e) => setExpiringSoonOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('inventoryExpiringSoon')}</span>
              </label>
            </div>

            {loading ? (
              <p className="py-4 text-sm text-gray-500">...</p>
            ) : filteredItems.length === 0 ? (
              <p className="py-4 text-sm text-gray-500">{t('inventoryNoItems')}</p>
            ) : (
              <>
                {/* Mobile / tablet: labeled cards so each value stays tied to its field */}
                <div className="space-y-3 lg:hidden">
                  {filteredItems.map((item: InventoryItem) => {
                    const type = (types || []).find((c: any) => c.id === item.typeId);
                    const status = deriveInventoryStatus(item);
                    const locked = isLockedAfter24Hours(item.createdAt);
                    const thumb = item.imageUrl ? getAbsoluteImageUrl(item.imageUrl) : '';
                    const lastUpdated = item.updatedAt || item.createdAt;
                    return (
                      <article
                        key={item.id}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 p-3"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {thumb ? (
                            <img src={thumb} alt="" className="h-12 w-12 shrink-0 object-cover rounded-md border border-gray-300 dark:border-gray-600" />
                          ) : (
                            <div className="h-12 w-12 shrink-0 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                              <ImageIcon size={18} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{getTranslated(type, lang) || '—'}</p>
                            <span className={`mt-1 inline-block px-2 py-0.5 rounded border text-[11px] font-medium ${STATUS_BADGE[status]}`}>
                              {t(`inventoryStatus_${status}`)}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button type="button" onClick={() => openIncidentModal(item)} className="p-1.5 text-gray-500 hover:text-orange-400" title={t('inventoryReportIncident')} disabled={!hasPermissionFor('update')}>
                              <AlertTriangle size={15} />
                            </button>
                            <button type="button" onClick={() => openUpdateModal(item)} className={`p-1.5 ${locked ? 'text-gray-600 cursor-not-allowed opacity-50' : 'text-gray-500 hover:text-blue-500'}`} title={locked ? t('locked24hMessage') : t('edit')} disabled={locked}>
                              <Edit2 size={15} />
                            </button>
                            <button type="button" onClick={() => openRemoveModal(item)} className={`p-1.5 ${locked ? 'text-gray-600 cursor-not-allowed opacity-50' : 'text-gray-500 hover:text-red-500'}`} title={locked ? t('locked24hMessage') : t('delete')} disabled={locked}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                          <div>
                            <dt className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-500">{t('inventoryStoragePlace')}</dt>
                            <dd className="text-xs text-gray-800 dark:text-gray-200 break-words">{item.storagePlace || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-500">{t('inventoryOnHand')}</dt>
                            <dd className="text-xs font-medium tabular-nums text-gray-900 dark:text-white">{item.quantity}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-500">{t('inventoryUnitValue')}</dt>
                            <dd className="text-xs tabular-nums text-gray-800 dark:text-gray-200">{formatCurrency(item.value, currency)}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-500">{t('inventoryTotal')}</dt>
                            <dd className="text-xs font-medium tabular-nums text-blue-500">{formatCurrency(item.value * item.quantity, currency)}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-500">{t('inventoryExpiry')}</dt>
                            <dd className="text-xs text-gray-800 dark:text-gray-200">
                              {item.expiresOn ? String(item.expiresOn).slice(0, 10) : '—'}
                              {isExpiringSoon(item.expiresOn) && <span className="ml-1 text-yellow-500">(!)</span>}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-500">{t('inventoryLastUpdated')}</dt>
                            <dd className="text-xs text-gray-800 dark:text-gray-200">
                              {lastUpdated
                                ? new Date(lastUpdated).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
                                : '—'}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    );
                  })}
                </div>

                {/* Desktop: denser table with clear headers and fitting type scale */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full min-w-[980px] table-fixed text-left">
                    <colgroup>
                      <col className="w-[44px]" />
                      <col className="w-[15%]" />
                      <col className="w-[7%]" />
                      <col className="w-[9%]" />
                      <col className="w-[5%]" />
                      <col className="w-[12%]" />
                      <col className="w-[13%]" />
                      <col className="w-[11%]" />
                      <col className="w-[8%]" />
                      <col className="w-[10%]" />
                      <col className="w-[80px]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-2 pr-1 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400" scope="col">
                          <span className="sr-only">{t('inventoryImage')}</span>
                        </th>
                        <th className="pb-2 px-1.5 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400" scope="col" title={t('item')}>{t('item')}</th>
                        <th className="pb-2 px-1.5 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400" scope="col" title={t('type')}>{t('type')}</th>
                        <th className="pb-2 px-1.5 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400" scope="col" title={t('inventoryStoragePlace')}>{t('inventoryStoragePlaceShort')}</th>
                        <th className="pb-2 px-1.5 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-right" scope="col" title={t('inventoryOnHand')}>{t('inventoryOnHandShort')}</th>
                        <th className="pb-2 px-1.5 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-right border-l border-gray-200/80 dark:border-gray-700/80" scope="col" title={t('inventoryUnitValue')}>{t('inventoryUnitValueShort')}</th>
                        <th className="pb-2 px-1.5 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-right" scope="col" title={t('inventoryTotal')}>{t('inventoryTotalShort')}</th>
                        <th className="pb-2 px-1.5 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-l border-gray-200/80 dark:border-gray-700/80" scope="col" title={t('inventoryStatus')}>{t('inventoryStatus')}</th>
                        <th className="pb-2 px-1.5 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400" scope="col" title={t('inventoryExpiry')}>{t('inventoryExpiry')}</th>
                        <th className="pb-2 px-1.5 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400" scope="col" title={t('inventoryLastUpdated')}>{t('inventoryLastUpdatedShort')}</th>
                        <th className="pb-2 pl-1" scope="col"><span className="sr-only">{t('edit')}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item: InventoryItem) => {
                        const type = (types || []).find((c: any) => c.id === item.typeId);
                        const status = deriveInventoryStatus(item);
                        const locked = isLockedAfter24Hours(item.createdAt);
                        const thumb = item.imageUrl ? getAbsoluteImageUrl(item.imageUrl) : '';
                        const lastUpdated = item.updatedAt || item.createdAt;
                        return (
                          <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/80">
                            <td className="py-2.5 pr-1 align-middle">
                              {thumb ? (
                                <img src={thumb} alt="" className="h-9 w-9 object-cover rounded-md border border-gray-300 dark:border-gray-600" />
                              ) : (
                                <div className="h-9 w-9 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                  <ImageIcon size={14} />
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-1.5 align-middle text-xs xl:text-sm font-medium text-gray-900 dark:text-white truncate" title={item.name}>{item.name}</td>
                            <td className="py-2.5 px-1.5 align-middle text-[11px] xl:text-xs text-gray-700 dark:text-gray-300 truncate" title={getTranslated(type, lang)}>{getTranslated(type, lang)}</td>
                            <td className="py-2.5 px-1.5 align-middle text-[11px] xl:text-xs text-gray-600 dark:text-gray-400 truncate" title={item.storagePlace || undefined}>{item.storagePlace || '—'}</td>
                            <td className="py-2.5 px-1 align-middle text-xs xl:text-sm text-right tabular-nums text-gray-900 dark:text-white">{item.quantity}</td>
                            <td className="py-2.5 px-1.5 align-middle text-[11px] xl:text-xs text-right tabular-nums whitespace-nowrap text-gray-700 dark:text-gray-300 border-l border-gray-200/80 dark:border-gray-700/80">{formatCurrency(item.value, currency)}</td>
                            <td className="py-2.5 px-1.5 align-middle text-[11px] xl:text-xs text-right tabular-nums whitespace-nowrap font-medium text-blue-500">{formatCurrency(item.value * item.quantity, currency)}</td>
                            <td className="py-2.5 px-1.5 align-middle border-l border-gray-200/80 dark:border-gray-700/80">
                              <span className={`inline-block max-w-full truncate px-1.5 py-0.5 rounded border text-[10px] xl:text-[11px] font-medium ${STATUS_BADGE[status]}`} title={t(`inventoryStatus_${status}`)}>
                                {t(`inventoryStatus_${status}`)}
                              </span>
                            </td>
                            <td className="py-2.5 px-1.5 align-middle text-[11px] xl:text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              {item.expiresOn ? String(item.expiresOn).slice(0, 10) : '—'}
                              {isExpiringSoon(item.expiresOn) && <span className="ml-0.5 text-yellow-500">(!)</span>}
                            </td>
                            <td className="py-2.5 px-1.5 align-middle text-[10px] xl:text-[11px] leading-snug text-gray-600 dark:text-gray-400">
                              {lastUpdated
                                ? new Date(lastUpdated).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
                                : '—'}
                            </td>
                            <td className="py-2.5 pl-1 align-middle">
                              <div className="flex items-center justify-end gap-1">
                                <button type="button" onClick={() => openIncidentModal(item)} className="p-1 text-gray-500 dark:text-gray-500 hover:text-orange-400" title={t('inventoryReportIncident')} disabled={!hasPermissionFor('update')}>
                                  <AlertTriangle size={14} />
                                </button>
                                <button type="button" onClick={() => openUpdateModal(item)} className={`p-1 ${locked ? 'text-gray-600 cursor-not-allowed opacity-50' : 'text-gray-500 dark:text-gray-500 hover:text-blue-500'}`} title={locked ? t('locked24hMessage') : t('edit')} disabled={locked}>
                                  <Edit2 size={14} />
                                </button>
                                <button type="button" onClick={() => openRemoveModal(item)} className={`p-1 ${locked ? 'text-gray-600 cursor-not-allowed opacity-50' : 'text-gray-500 dark:text-gray-500 hover:text-red-500'}`} title={locked ? t('locked24hMessage') : t('delete')} disabled={locked}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Delete modal */}
      {removeModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('inventoryDeleteConfirm')}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{t('inventoryDeleteConfirmMsg')}</p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => { setRemoveModal(false); setSelectedItem(null); }}>{t('cancel')}</Button>
              <Button variant="danger" onClick={handleRemove}>
                <Trash2 size={16} className="inline mr-1" />
                {t('delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {updateModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('inventoryUpdateTitle')}</h3>
            <Input label={t('item')} value={editForm.name} onChange={(v: string) => setEditForm((f) => ({ ...f, name: v }))} required />
            <Select
              label={t('type')}
              value={editForm.typeId}
              onChange={(v: string) => setEditForm((f) => ({ ...f, typeId: v }))}
              required
              options={typeOptions}
            />
            <Input label={t('inventoryUnitValue')} type="number" value={editForm.value} onChange={(v: string) => setEditForm((f) => ({ ...f, value: v }))} required />
            <SuggestInput
              label={t('inventoryStoragePlace')}
              value={editForm.storagePlace}
              onChange={(v: string) => setEditForm((f) => ({ ...f, storagePlace: v }))}
              options={storagePlaceOptions}
              listId="inventory-storage-place-edit-list"
            />
            <Input label={t('inventoryExpiresOn')} type="date" value={editForm.expiresOn} onChange={(v: string) => setEditForm((f) => ({ ...f, expiresOn: v }))} />
            <Input label={t('inventoryNotes')} value={editForm.notes} onChange={(v: string) => setEditForm((f) => ({ ...f, notes: v }))} />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('inventoryImage')}</label>
              {(editImagePreview || editForm.imageUrl) && (
                <img
                  src={editImagePreview || getAbsoluteImageUrl(editForm.imageUrl)}
                  alt=""
                  className="mb-2 h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (editImagePreview) URL.revokeObjectURL(editImagePreview);
                  setEditImageFile(file);
                  setEditImagePreview(file ? URL.createObjectURL(file) : null);
                }}
                className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white file:text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{t('inventoryChangeImage')}</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              {t('inventoryOnHand')}: {selectedItem.quantity} — {t('inventoryReason_adjustment')}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => { setUpdateModal(false); setSelectedItem(null); setEditImageFile(null); setEditImagePreview(null); }}>{t('cancel')}</Button>
              <Button onClick={handleUpdate} disabled={submitting || uploading}>{t('save')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Incident modal */}
      {incidentModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('inventoryReportIncident')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {selectedItem.name} — {t('inventoryOnHand')}: {selectedItem.quantity}
            </p>
            <Select
              label={t('inventoryIncidentReason')}
              value={incidentForm.reason}
              onChange={(v: string) => setIncidentForm((f) => ({ ...f, reason: v as InventoryEventReason }))}
              options={[
                { value: 'damaged', label: t('inventoryReason_damaged') },
                { value: 'expired', label: t('inventoryReason_expired') },
                { value: 'stolen', label: t('inventoryReason_stolen') },
                { value: 'restored', label: t('inventoryReason_restored') },
                { value: 'adjustment', label: t('inventoryReason_adjustment') },
              ]}
            />
            <Input
              label={t('inventoryIncidentQty')}
              type="number"
              value={incidentForm.quantity}
              onChange={(v: string) => setIncidentForm((f) => ({ ...f, quantity: v }))}
              required
            />
            <Input
              label={t('inventoryIncidentNote')}
              value={incidentForm.note}
              onChange={(v: string) => setIncidentForm((f) => ({ ...f, note: v }))}
            />
            <div className="flex gap-3 justify-end mt-2">
              <Button variant="secondary" onClick={() => { setIncidentModal(false); setSelectedItem(null); }}>{t('cancel')}</Button>
              <Button onClick={handleIncident} disabled={incidentSubmitting}>
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
