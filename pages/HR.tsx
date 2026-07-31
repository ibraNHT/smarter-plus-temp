
import React, { useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { useData, useSubmit, useStorage, getAbsoluteImageUrl, invalidateCollection } from '../hooks/useAppData';
import { Card, Input, Button, Select, MultiSelectBox, Modal, TempPasswordModal } from '../components/UI';
import { UPLOAD_API_URL } from '../env';
import { getTranslated } from '../constants';
import { Trash2, Upload, User, FileText, ArrowLeft, Calendar, MapPin, Phone, Mail, Map, Download, View, LayoutList, LayoutGrid } from 'lucide-react';

export default function HR({ t, locationId, lang, user }: any) {
    const { data: staff, loading } = useData('staff', locationId);
    const { data: positions } = useData('positions');
    const { data: locations } = useData('locations'); // Need all locations for assignment
    const { add, update, remove, removeDocument, submitting } = useSubmit('staff');
    const { upload, uploadDocument, uploading } = useStorage();
    
    const [view, setView] = useState<'list' | 'edit' | 'profile'>('list');
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [file, setFile] = useState<File | null>(null);
    const [docUploadModal, setDocUploadModal] = useState(false);
    const [docFile, setDocFile] = useState<File | null>(null);
    const [docName, setDocName] = useState('');
    const [docType, setDocType] = useState('identification');
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
    const { showNotification } = useNotification();

    // Implement handleRemove and handleUpdate in a modal view for confirmation before deletion to prevent accidental loss of data
    const [removeModal, setRemoveModal] = useState<boolean>(false);
    const [removeDocModal, setRemoveDocModal] = useState<boolean>(false);
    const [removeDocId, setRemoveDocId] = useState<any>(null);
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
    const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);
    const [nameSearch, setNameSearch] = useState('');
    const [positionFilterId, setPositionFilterId] = useState<string>('');
    const [staffLayout, setStaffLayout] = useState<'list' | 'grid'>('grid');

    const hasPermissionFor = (action: string) => {
        const permissionMap: Record<string, string> = {
        'view': 'perm_viewHR',
        'add': 'perm_addHR',
        'update': 'perm_updateHR',
        'delete': 'perm_deleteHR',
        'manageUploads': 'perm_manageHRUploads',
        };
        return user?.role?.permissions.includes(permissionMap[action]);
    };

    // --- Handlers ---
    const openAdd = () => {
        if (hasPermissionFor('add')) {
            // Default to current location if not global, otherwise empty array
        const initialLocs = (locationId && locationId !== 'all') ? [locationId] : [];
        setFormData({ status: 'active', locationIds: initialLocs, gender: 'male' });
        setSelectedStaff(null);
        setView('edit');
        } else {
            showNotification('You do not have permission to add staff members. Please contact your administrator', 'error');
        }
    };

    const openProfile = (s: any) => {
        setSelectedStaff(s);
        setFormData({ ...s });
        setView('profile');
    };

    const handleSave = async (e: React.FormEvent) => {
        if (hasPermissionFor('update')) {
            e.preventDefault();
        
            if (!formData.locationIds || formData.locationIds.length === 0) {
                alert("Please assign at least one location.");
                return;
            }
            
            const updatedData = { ...formData };
            
            // Upload Profile Pic if selected
            if (file) {
                const { url } = await upload(file, `uploads/profile_pictures/${Date.now()}_avatar_${file.name}`);
                updatedData.profilePicUrl = url;
            }

            if (selectedStaff) {
                if (updatedData.terminationDate === '' || updatedData.terminationDate === undefined) updatedData.terminationDate = null;
                const updatedStaff = await update(selectedStaff.id, updatedData);
                if (updatedStaff && typeof updatedStaff === 'object') {
                    setSelectedStaff({ ...selectedStaff, ...updatedStaff, positionId: updatedStaff.positionId ?? updatedStaff.position?.id });
                }
            } else {
                // Transform locationIds array into nested { create: [...] } structure
                const locationsPayload = (updatedData.locationIds || []).map((locId: string) => ({
                    locationId: locId
                }));

            // Build staff creation payload matching backend schema
            const payload = {
                firstName: updatedData.firstName,
                lastName: updatedData.lastName,
                email: updatedData.email,
                positionId: updatedData.positionId,
                status: updatedData.status,
                hireDate: updatedData.hireDate ? new Date(updatedData.hireDate).toISOString() : new Date().toISOString(),
                terminationDate: updatedData.terminationDate ? new Date(updatedData.terminationDate).toISOString() : null,
                dob: updatedData.dob ? new Date(updatedData.dob).toISOString() : null,
                gender: updatedData.gender,
                address: updatedData.address,
                phone: updatedData.phone,
                profilePicUrl: updatedData.profilePicUrl,
                locations: { create: locationsPayload },
                documents: { create: [] }
            };

            const res: any = await add(payload);

            if (res && (res.tempPassword || res.temp_password)) {
                setTempPasswordModal(res.tempPassword || res.temp_password);
            }

        }
        
        setView('list');
        setFile(null);
        } else {
        showNotification('You do not have permission to update staff members. Please contact your administrator', 'error');
        }
  };

    const openRemoveModal = (id: string) => {
        setSelectedStaffId(id);
        setRemoveModal(true);
    };

    const handleRemove = async () => {
    if (!selectedStaffId) { 
        alert(t('errorNoStaff'));
        return;
        } // Guard clause

    // Some APIs need the parent ID (locationId) to find the record
    if (hasPermissionFor('delete')) {
        const result = await remove(selectedStaffId); 

        if (result) {
            showNotification('Staff member removed successfully', 'success');
        } else {
            showNotification('Failed to remove staff', 'error');
        }
    } else showNotification('You do not have permission to delete staff members.     Please contact your administrator', 'error');

    // Always clean up state
    setRemoveModal(false);
    setSelectedStaffId(null);
};

  const openDocUploadModal = () => {
      setDocUploadModal(true);
      setDocFile(null);
      setDocName('');
      setDocType('identification');
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0] || !selectedStaff?.id) return;
      const file = e.target.files[0];
      e.target.value = '';
      try {
          const { url } = await upload(file, `uploads/profile_pictures/${selectedStaff.id}_${Date.now()}_${file.name}`);
          await update(selectedStaff.id, { profilePicUrl: url });
          setSelectedStaff({ ...selectedStaff, profilePicUrl: url });
          showNotification(t('saved') || 'Profile picture updated', 'success');
      } catch (error: any) {
          showNotification(error?.message || 'Profile picture upload failed', 'error');
      }
  };

  const handleDocUpload = async () => {
      if (!docFile || !docName?.trim() || !selectedStaff?.id) {
          showNotification(t('documentName') ? 'Please enter a document name and select a file' : 'Please select a file and enter a document name', 'error');
          return;
      }
      try {
          const path = `uploads/documents/${selectedStaff.id}_${Date.now()}_${docFile.name}`;
          const data = await uploadDocument(docFile, selectedStaff.id, docName.trim(), docType, path);
          const url = data.url?.startsWith('http') || data.url?.startsWith('offline-blob:') || data.url?.startsWith('blob:')
              ? data.url
              : `${UPLOAD_API_URL}${data.url?.startsWith('/') ? data.url : '/' + (data.url || '')}`;
          const newDoc = {
              id: data.id || `offline_doc_${Date.now()}`,
              name: data.name ?? docName.trim(),
              url,
              type: data.type ?? docType,
              path: data.path ?? path,
              uploadedAt: data.uploadedAt ?? new Date().toISOString()
          };
          const updatedDocs = [...(selectedStaff.documents || []), newDoc];
          // Online upload already creates StaffDocument; still refresh local list.
          // Offline: skip staff PUT (document sync creates the record); keep optimistic UI/cache.
          if (!data.offline) {
              await update(selectedStaff.id, { documents: updatedDocs });
          } else {
              const { get: idbGet, set: idbSet } = await import('idb-keyval');
              const cached = (await idbGet('cache_staff')) || [];
              if (Array.isArray(cached)) {
                  await idbSet(
                      'cache_staff',
                      cached.map((s: any) =>
                          s.id === selectedStaff.id ? { ...s, documents: updatedDocs } : s
                      )
                  );
              }
          }
          setSelectedStaff({ ...selectedStaff, documents: updatedDocs });
          invalidateCollection('staff');
          setDocUploadModal(false);
          setDocFile(null);
          setDocName('');
          showNotification(
              data.offline
                  ? (t('saved') || 'Document saved offline. Will upload when online.')
                  : (t('saved') || 'Document uploaded'),
              data.offline ? 'info' : 'success'
          );
      } catch (error: any) {
          showNotification(error?.message || 'Document upload failed', 'error');
      }
  };

  const removeDoc = async (docIdx: string) => {
    //  if(!window.confirm(t('delete') + '?')) return;
    //   const updatedDocs = selectedStaff.documents.filter((_:any, i:number) => i !== docIdx);
    //   await update(selectedStaff.id, { documents: updatedDocs });
    //   setSelectedStaff({ ...selectedStaff, documents: updatedDocs });
        const result = await removeDocument(docIdx);

        if (result) {
            showNotification('Document removed successfully', 'success');
        } else {
            showNotification('Failed to remove document', 'error');
        } 
  };

  // Filter staff by name and position (staff list is already scoped by location from useData)
  const filteredStaff = (staff || []).filter((s: any) => {
    const matchName = !nameSearch.trim() || (() => {
      const q = nameSearch.trim().toLowerCase();
      const full = `${(s.firstName || '')} ${(s.lastName || '')}`.toLowerCase();
      const email = (s.email || '').toLowerCase();
      return full.includes(q) || email.includes(q);
    })();
    const matchPosition = !positionFilterId || s.positionId === positionFilterId;
    return matchName && matchPosition;
  });

  // --- Views ---

  return (
    <>
      <TempPasswordModal
        isOpen={!!tempPasswordModal}
        onClose={() => setTempPasswordModal(null)}
        tempPassword={tempPasswordModal || ''}
        title="Temporary password"
      />
        {view === 'list' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">{t('hr')}</h2>
                    <Button onClick={openAdd}>{t('add')}</Button>
                </div>
                <div className="flex flex-wrap gap-4 items-center p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <input
                        type="text"
                        placeholder={t('searchByName')}
                        value={nameSearch}
                        onChange={(e) => setNameSearch(e.target.value)}
                        className="rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 min-w-[180px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                        value={positionFilterId}
                        onChange={(e) => setPositionFilterId(e.target.value)}
                        className="rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 min-w-[160px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">{t('allPositions')}</option>
                        {(positions || []).map((p: any) => (
                            <option key={p.id} value={p.id}>{getTranslated(p, lang)}</option>
                        ))}
                    </select>
                    <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                        <button
                            type="button"
                            onClick={() => setStaffLayout('list')}
                            className={`p-2 ${staffLayout === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                            title={t('listView')}
                            aria-label={t('listView')}
                        >
                            <LayoutList className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setStaffLayout('grid')}
                            className={`p-2 ${staffLayout === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                            title={t('gridView')}
                            aria-label={t('gridView')}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {staffLayout === 'list' ? (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-4 py-3 font-medium">{t('firstName')} / {t('lastName')}</th>
                                    <th className="px-4 py-3 font-medium">{t('position')}</th>
                                    <th className="px-4 py-3 font-medium">{t('status')}</th>
                                    <th className="px-4 py-3 font-medium">{t('allLocations')}</th>
                                    <th className="px-4 py-3 text-right font-medium">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="px-4 py-6 text-gray-600 dark:text-gray-400">Loading...</td></tr>
                                ) : filteredStaff.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-6 text-gray-600 dark:text-gray-400">No staff found.</td></tr>
                                ) : (
                                    filteredStaff.map((s: any) => {
                                        const pos = positions?.find((p: any) => p.id === s.positionId);
                                        const assignedLocNames = (locations || []).filter((l: any) => s.locationIds?.includes(l.id)).map((l: any) => getTranslated(l, lang)).join(', ') || '—';
                                        return (
                                            <tr key={s.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                                            {s.profilePicUrl ? (
                                                                <img src={getAbsoluteImageUrl(s.profilePicUrl)} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-900 dark:text-white">{s.firstName} {s.lastName}</span>
                                                            {s.email && <div className="text-xs text-gray-500 dark:text-gray-500 truncate max-w-[200px]">{s.email}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{getTranslated(pos, lang) || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${s.status === 'active' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                                                        {t(s.status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs max-w-[180px] truncate" title={assignedLocNames}>{assignedLocNames}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button variant="outline" onClick={() => openProfile(s)} className="text-xs mr-1">{t('view')}</Button>
                                                    <Button variant="danger" onClick={() => openRemoveModal(s.id)} className="text-xs">{t('delete')}</Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? <p>Loading...</p> : filteredStaff.map((s: any) => {
                        const pos = positions.find((p:any) => p.id === s.positionId);
                        const locCount = s.locationIds?.length || 0;
                        return (
                            <Card key={s.id} className="hover:bg-gray-750 transition-colors cursor-pointer relative group" >
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-300 dark:border-gray-600 shrink-0">
                                        {s.profilePicUrl ? (
                                            <img src={getAbsoluteImageUrl(s.profilePicUrl)} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-lg truncate">{s.firstName} {s.lastName}</h3>
                                        <p className="text-blue-400 text-sm truncate">{getTranslated(pos, lang)}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${s.status === 'active' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                                                {t(s.status)}
                                            </span>
                                            {locCount > 1 && (
                                                <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-600 text-gray-800 dark:text-gray-200 flex items-center gap-1">
                                                    <Map className="w-3 h-3" /> {locCount} Locs
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Button variant="outline" onClick={() => openProfile(s)} className="text-xs">{t('view')}</Button>
                                    <Button variant="danger" onClick={(e:any) => { e.stopPropagation(); openRemoveModal(s.id) }} className="text-xs">
                                        {t('delete')}
                                    </Button>
                                </div>
                            </Card>
                        )
                    })}
                </div>
                )}
            </div>
            )}
  

        {view === 'profile' && selectedStaff && (() => {
            const pos = positions.find((p:any) => p.id === selectedStaff.positionId);
            const assignedLocations = locations.filter((l:any) => selectedStaff.locationIds?.includes(l.id));
            
            return (
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <Button variant="outline" onClick={() => setView('list')}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> {t('back')}
                        </Button>
                        <Button onClick={() => {
                            setFormData({
                                ...selectedStaff,
                                positionId: selectedStaff.positionId ?? selectedStaff.position?.id ?? '',
                                locationIds: selectedStaff.locationIds ?? (selectedStaff.locations || []).map((l: any) => l.locationId ?? l.location?.id).filter(Boolean),
                            });
                            setView('edit');
                        }}>
                            {t('edit')}
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Profile Info */}
                        <Card className="md:col-span-1 text-center">
                                <div className="w-32 h-32 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-gray-300 dark:border-gray-600 mb-4 relative group">
                                    {selectedStaff.profilePicUrl ? (
                                        <img src={getAbsoluteImageUrl(selectedStaff.profilePicUrl)} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 text-gray-600 dark:text-gray-400" />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <label className="cursor-pointer p-4 w-full h-full flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-gray-900 dark:text-white" />
                                            <input type="file" className="hidden" onChange={handleProfilePicUpload} disabled={uploading} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold break-words">{selectedStaff.firstName} {selectedStaff.lastName}</h2>
                                <p className="text-blue-400 mb-4">{getTranslated(pos, lang)}</p>
                                
                                <div className="text-left space-y-3 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex items-center gap-2 overflow-hidden"><Mail className="w-4 h-4 shrink-0"/> <span className="truncate">{selectedStaff.email}</span></div>
                                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0"/> {selectedStaff.phone || 'N/A'}</div>
                                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0"/> {selectedStaff.address || 'N/A'}</div>
                                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 shrink-0"/> {t('hireDate')}: {selectedStaff.hireDate ? String(selectedStaff.hireDate).slice(0, 10) : 'N/A'}</div>
                                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 shrink-0"/> {t('terminationDate')}: {selectedStaff.terminationDate ? String(selectedStaff.terminationDate).slice(0, 10) : '—'}</div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-left">
                                    <p className="text-xs text-gray-500 dark:text-gray-500 uppercase mb-2">Assigned Locations</p>
                                    <div className="flex flex-wrap gap-2">
                                        {assignedLocations.map((l:any) => (
                                            <span key={l.id} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs border border-gray-300 dark:border-gray-600">
                                                {getTranslated(l, lang)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                        </Card>

                        {/* Documents */}
                        <Card className="md:col-span-2" title={t('documents')}>
                            <div className="mb-4">
                                <Button onClick={openDocUploadModal}>
                                    <Upload className="w-4 h-4 mr-2"/> {t('upload')}
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {(selectedStaff.documents || []).map((doc: any, idx: number) => (
                                    <div key={doc.id ? `doc-${doc.id}` : `doc-${idx}-${doc.name ?? ''}`} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText className="w-5 h-5 text-blue-400 shrink-0"/>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">{doc.uploadedAt?.split('T')[0]}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><View className="w-4 h-4"/></a>
                                            <a href={doc.url} download target="_blank" rel="noreferrer" className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><Download className="w-4 h-4"/></a>
                                            <button onClick={() => { setRemoveDocId(doc.id); setRemoveDocModal(true); }} className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ))}
                                {(!selectedStaff.documents || selectedStaff.documents.length === 0) && (
                                    <p className="text-gray-500 dark:text-gray-500 italic">{t('noDocuments')}</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            );
            }) ()
        }

        {view === 'edit' && (
        <div className="max-w-2xl mx-auto">
            <Card title={selectedStaff ? t('edit') : t('add')}>
                <form onSubmit={handleSave}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label={t('firstName')} value={formData.firstName || ''} onChange={(v:string) => setFormData({...formData, firstName: v})} required />
                        <Input label={t('lastName')} value={formData.lastName || ''} onChange={(v:string) => setFormData({...formData, lastName: v})} required />
                    </div>
                    <Input label={t('email')} type="email" value={formData.email || ''} onChange={(v:string) => setFormData({...formData, email: v})} required />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label={t('phone')} value={formData.phone || ''} onChange={(v:string) => setFormData({...formData, phone: v})} />
                                            <Input label={t('dob')} type="date" value={formData.dob ? String(formData.dob).slice(0, 10) : ''} onChange={(v:string) => setFormData({...formData, dob: v})} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label={t('hireDate')} type="date" value={formData.hireDate ? String(formData.hireDate).slice(0, 10) : ''} onChange={(v:string) => setFormData({...formData, hireDate: v})} />
                        <Input label={t('terminationDate')} type="date" value={formData.terminationDate ? String(formData.terminationDate).slice(0, 10) : ''} onChange={(v:string) => setFormData({...formData, terminationDate: v || undefined})} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                            label={t('gender') || 'Gender'}
                            value={formData.gender || 'male'}
                            onChange={(v:string) => setFormData({...formData, gender: v})}
                            options={[
                                { value: 'male', label: 'Male' },
                                { value: 'female', label: 'Female' },
                                { value: 'other', label: 'Other' }
                            ]}
                        />
                    </div>
                    <Input label={t('address')} value={formData.address || ''} onChange={(v:string) => setFormData({...formData, address: v})} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <Select 
                            label={t('position')}
                            value={formData.positionId || ''}
                            onChange={(v:string) => setFormData({...formData, positionId: v})}
                            required
                            options={[
                                { value:'', label: '...', disabled: true },
                                ...positions.map((p: any) => ({ value: p.id, label: getTranslated(p, lang) }))
                            ]}
                        />
                        <Select 
                            label={t('status')}
                            value={formData.status}
                            onChange={(v:string) => setFormData({...formData, status: v})}
                            options={[
                                { value:'active', label: 'Active' },
                                { value:'inactive', label: 'Inactive' }
                            ]}
                        />
                    </div>

                    {/* Multi-Location Select */}
                    <MultiSelectBox 
                        label={t('locationManagement')}
                        options={locations.map((l:any) => ({ value: l.id, label: getTranslated(l, lang) }))}
                        selectedValues={formData.locationIds || []}
                        onChange={(newLocs: string[]) => setFormData({ ...formData, locationIds: newLocs })}
                    />

                    <div className="mb-6">
                        <label htmlFor="profile-pic-upload" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Profile Picture</label>
                        <input id="profile-pic-upload" type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="text-sm text-gray-600 dark:text-gray-400" accept="image/*" />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setView('list')}>{t('cancel')}</Button>
                        <Button type="submit" disabled={submitting || uploading}>{t('save')}</Button>
                    </div>
                </form>
            </Card>

            
        </div>
        )}
        <Modal
                isOpen={docUploadModal}
                onClose={() => setDocUploadModal(false)}
                title={t('uploadDocument') || 'Upload Document'}
                onConfirm={handleDocUpload}
                confirmText={t('upload') || 'Upload'}
                cancelText={t('cancel') || 'Cancel'}
                confirmVariant="primary"
            >
                <div className="space-y-4">
                    <Input
                        label={t('documentName') || 'Document Name'}
                        value={docName}
                        onChange={setDocName}
                        placeholder="e.g., Driver License"
                        required
                    />
                    <Select
                        label={t('documentType') || 'Document Type'}
                        value={docType}
                        onChange={setDocType}
                        options={[
                            { value: 'identification', label: 'Identification' },
                            { value: 'certification', label: 'Certification' },
                            { value: 'contract', label: 'Contract' },
                            { value: 'other', label: 'Other' }
                        ]}
                    />
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('selectFile') || 'Select File'}</label>
                        <input
                            type="file"
                            onChange={e => setDocFile(e.target.files ? e.target.files[0] : null)}
                            className="text-sm text-gray-600 dark:text-gray-400"
                        />
                    </div>
                </div>
            </Modal>
                {/* Remove Confirmation Modal */}
                {removeModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('Staff delete confirmation')}</h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-6">{t('Are you sure you want to delete this staff member?')}</p>
                            <div className="flex gap-3 justify-end">
                                <Button variant="secondary" onClick={() => setRemoveModal(false)}>{t('cancel')}</Button>
                                <Button 
                                    variant="danger" 
                                    onClick={handleRemove} 
                                    >
                                        <Trash2 size={16} className="inline mr-1"/>
                                        {t('delete')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Remove Doc Confirmation Modal */}
                {removeDocModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('Document delete confirmation')}</h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-6">{t('Are you sure you want to delete this document?')}</p>
                            <div className="flex gap-3 justify-end">
                                <Button variant="secondary" onClick={() => setRemoveDocModal(false)}>{t('cancel')}</Button>
                                <Button 
                                    variant="danger" 
                                    onClick={() => removeDoc(removeDocId)} 
                                    >
                                        <Trash2 size={16} className="inline mr-1"/>
                                        {t('delete')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
  </>
  )
}