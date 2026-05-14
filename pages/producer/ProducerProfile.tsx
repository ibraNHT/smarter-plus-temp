
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { UserRole, ProducerProfile as ProducerProfileType, Location, Portfolio } from '../../types';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { User, Wallet, Shield, Tractor, CreditCard, Trash2, Plus, Camera, Upload, MapPin, FileText, X, LogOut, Image as ImageIcon, Video, Eye, Edit, CheckCircle, Heart, ArrowLeft, Search, Users, Copy, Loader2 } from 'lucide-react';
import { useUpdateProducerProfileMutation } from '../../client-api/hooks/useUpdateProducerProfileMutation';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal';
import { OtpVerificationModal } from '../../components/OtpVerificationModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SectionLoader } from '../../components/Loaders';
import { requestBrowserLocation, nominatimReverseGeocode } from '../../services/geolocation';
import { LocationMapPicker } from '../../components/LocationMapPicker';
import { uploadAvatar, uploadDocument, uploadPortfolioImage, uploadPortfolioVideo } from '../../services/uploadService';
import { apiFetch } from '../../services/apiService';
import { API_ENDPOINTS } from '../../client-api/endpoints';
import { offerImageHero, offerImageInBox } from '../../utils/offerImageDisplay';
import { useFormik } from 'formik';
import { z } from 'zod';

const PRODUCTION_TYPES = ['Agriculture', 'Livestock farming', 'Fish Farming', 'Vegetables', 'Processed foods', 'Equipment', 'Service'];

function portfolioCategoryLabel(category: string, translate: (key: string) => string): string {
  const raw = String(category ?? '').trim();
  if (!raw) return '';
  const key = `category.${raw}`;
  const out = translate(key);
  return out === key ? raw : out;
}

function isHostedHttpUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url.trim());
}

export const ProducerProfile: React.FC = () => {
  const { user, producers, saveProducerPaymentMethod, deleteProducerPaymentMethod, requestOtp, verifyOtp, logout, getProducerPortfolios, addPortfolio, updatePortfolio, deletePortfolio, offers, toggleFavorite, myReferrals, refreshMyReferrals, refreshProducers, refreshOffers, refreshMyPortfolios } = useStore();
  const updateProducerMutation = useUpdateProducerProfileMutation();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  type ProducerProfileTab = 'info' | 'security' | 'payment' | 'portfolio' | 'favorites' | 'referrals';
  const isProducerProfileTab = (value: string | undefined): value is ProducerProfileTab =>
    value === 'info' ||
    value === 'security' ||
    value === 'payment' ||
    value === 'portfolio' ||
    value === 'favorites' ||
    value === 'referrals';
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'payment' | 'portfolio' | 'favorites' | 'referrals'>('info');
  const navigateToTab = (nextTab: ProducerProfileTab) => {
    setActiveTab(nextTab);
    navigate(`/producer/profile/${nextTab}`);
  };

  // ─── Per-tab lazy fetching ──────────────────────────────────────────────
  //
  // Only the slices the active tab renders are fetched. Switching tabs after
  // the first visit hits the React Query cache and is instant. `tabLoading`
  // is local so each tab shows its own scoped loader.
  const [tabLoading, setTabLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setTabLoading(true);

    // The profile shell (avatar, sidebar, header) needs `currentProducer`
    // from the `producers` array — always required regardless of active tab.
    const tasks: Promise<unknown>[] = [refreshProducers()];

    switch (activeTab) {
      case 'portfolio':
        tasks.push(refreshMyPortfolios());
        break;
      case 'favorites':
        tasks.push(refreshOffers());
        break;
      case 'referrals':
        tasks.push(refreshMyReferrals());
        break;
      case 'info':
      case 'payment':
      case 'security':
        // Use the producer record already fetched above.
        break;
    }

    Promise.all(tasks).finally(() => {
      if (!cancelled) setTabLoading(false);
    });

    return () => { cancelled = true; };
  }, [activeTab]);

  // New Payment Method Form State
  const [showAddPayment, setShowAddPayment] = useState(false);
  const paymentFormik = useFormik({
    initialValues: { provider: 'ORANGE', accountNumber: '', accountName: '' },
    validate: (values) => {
      const parsed = z.object({
        provider: z.enum(['ORANGE', 'MTN', 'BANK']),
        accountNumber: z.string().trim().min(3, 'Account number is required.'),
        accountName: z.string().trim().min(2, 'Account name is required.'),
      }).safeParse(values);
      if (parsed.success) return {};
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !errs[key]) errs[key] = issue.message;
      }
      return errs;
    },
    onSubmit: (values) => {
      if (!user?.producerId) return;
      saveProducerPaymentMethod(user.producerId, {
        id: `pm-${Date.now()}`,
        provider: values.provider as any,
        accountNumber: values.accountNumber.trim(),
        accountName: values.accountName.trim(),
      });
      setShowAddPayment(false);
      paymentFormik.resetForm({ values: { provider: 'ORANGE', accountNumber: '', accountName: '' } });
    },
  });

  // Personal Info Form State
  const [formData, setFormData] = useState<ProducerProfileType | null>(null);

  // Temp Location State for adding new ones
  const [newLoc, setNewLoc] = useState<Partial<Location>>({ region: '', city: '', address: '', lat: 0, lng: 0 });
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ address: string; city: string; region: string; lat: number; lng: number }>>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [editingLocationIndex, setEditingLocationIndex] = useState<number | null>(null);

  // Portfolio State
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showPortfolioPreview, setShowPortfolioPreview] = useState<Portfolio | null>(null);
  const [portfolioForm, setPortfolioForm] = useState<Partial<Portfolio>>({
    title: '', description: '', category: '', imageUrls: [], isPublished: false
  });
  const [portfolioPendingDelete, setPortfolioPendingDelete] = useState<Portfolio | null>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [paymentToRemove, setPaymentToRemove] = useState<{ id: string; provider: string; accountNumber: string } | null>(null);
  const [locationToRemoveIdx, setLocationToRemoveIdx] = useState<number | null>(null);
  const [favoriteToRemove, setFavoriteToRemove] = useState<{ id: string; title?: string } | null>(null);
  const [deletingPortfolio, setDeletingPortfolio] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState(false);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  // OTP for profile name/phone change
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingProfileUpdate, setPendingProfileUpdate] = useState<ProducerProfileType | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [certUploading, setCertUploading] = useState(false);
  const [profileHydrating, setProfileHydrating] = useState(false);
  const lastSeededLocationFormForProfileId = useRef<string | null>(null);

  // ... [Existing Logic for form init, favorites, handlers] ...
  const currentProducer = producers.find(p => p.id === user?.producerId || p.userId === user?.id);
  const myPortfolios = user?.producerId ? getProducerPortfolios(user.producerId) : [];

  const referralCodeDisplay = useMemo(
    () => (myReferrals?.referralCode || currentProducer?.referralCode || '').trim(),
    [myReferrals?.referralCode, currentProducer?.referralCode]
  );
  const referralCount = myReferrals?.totalReferred ?? currentProducer?.referrals?.length ?? 0;
  const referredPeople = myReferrals?.referredUsers ?? [];

  useEffect(() => {
    if (isProducerProfileTab(tab)) {
      setActiveTab(tab);
      return;
    }
    if (!tab) setActiveTab('info');
  }, [tab]);
  useEffect(() => {
    if (activeTab === 'referrals') void refreshMyReferrals();
  }, [activeTab, refreshMyReferrals]);
  useEffect(() => {
    if (!currentProducer) return;
    const producerUser = (currentProducer as any).user;
    const sessionEmail = (user as any)?.email ?? '';
    const sessionPhone = (user as any)?.phone ?? '';
    const normalized: ProducerProfileType = {
      ...currentProducer,
      email: (producerUser?.email ?? (currentProducer as any).email ?? sessionEmail).toString(),
      phone: (producerUser?.phone ?? (currentProducer as any).phone ?? sessionPhone).toString(),
      name: (producerUser?.displayName ?? (currentProducer as any).name ?? ((currentProducer.type === 'INDIVIDUAL' ? `${currentProducer.firstName ?? ''} ${currentProducer.lastName ?? ''}`.trim() : currentProducer.name) || '')).toString(),
      firstName: (currentProducer.firstName ?? '').toString(),
      lastName: (currentProducer.lastName ?? '').toString(),
      description: (currentProducer.description ?? '').toString(),
      profileImageUrl: (producerUser?.profileImageUrl ?? (currentProducer as any).profileImageUrl ?? '').toString() || undefined,
      locations: Array.isArray(currentProducer.locations) ? currentProducer.locations : [],
      productionTypes: Array.isArray(currentProducer.productionTypes) ? currentProducer.productionTypes : [],
      certifications: Array.isArray(currentProducer.certifications) ? currentProducer.certifications : [],
      favorites: Array.isArray(currentProducer.favorites) ? currentProducer.favorites : [],
      taxIdentificationNumber: (currentProducer as any).taxIdentificationNumber ?? '',
    };
    setFormData((prev) => {
      if (!prev) return normalized;
      if (prev.id !== normalized.id) return normalized;
      return prev;
    });
  }, [currentProducer, user]);
  useEffect(() => {
    if (!user || user.role !== UserRole.PRODUCER) return;
    let cancelled = false;
    const hydrateMyProducerProfile = async () => {
      setProfileHydrating(true);
      try {
        const rows = await apiFetch<any[]>(API_ENDPOINTS.producers.list, { silent401: true } as any).catch(() => []);
        if (cancelled || !Array.isArray(rows)) return;
        const mine = rows.find((p: any) => p?.id === user.producerId || p?.userId === user.id);
        if (!mine) return;
        const producerUser = (mine as any).user;
        const sessionEmail = (user as any)?.email ?? '';
        const sessionPhone = (user as any)?.phone ?? '';
        const normalized: ProducerProfileType = {
          ...mine,
          email: (producerUser?.email ?? (mine as any).email ?? sessionEmail).toString(),
          phone: (producerUser?.phone ?? (mine as any).phone ?? sessionPhone).toString(),
          name: (producerUser?.displayName ?? (mine as any).name ?? ((mine.type === 'INDIVIDUAL' ? `${mine.firstName ?? ''} ${mine.lastName ?? ''}`.trim() : mine.name) || '')).toString(),
          firstName: (mine.firstName ?? '').toString(),
          lastName: (mine.lastName ?? '').toString(),
          description: (mine.description ?? '').toString(),
          profileImageUrl: (producerUser?.profileImageUrl ?? (mine as any).profileImageUrl ?? '').toString() || undefined,
          locations: Array.isArray(mine.locations) ? mine.locations : [],
          productionTypes: Array.isArray(mine.productionTypes) ? mine.productionTypes : [],
          certifications: Array.isArray(mine.certifications) ? mine.certifications : [],
          favorites: Array.isArray(mine.favorites) ? mine.favorites : [],
          taxIdentificationNumber: (mine as any).taxIdentificationNumber ?? '',
        } as ProducerProfileType;
        setFormData((prev) => (prev?.id === normalized.id ? prev : normalized));
      } finally {
        if (!cancelled) setProfileHydrating(false);
      }
    };
    void hydrateMyProducerProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);
  useEffect(() => {
    if (!formData?.id) {
      lastSeededLocationFormForProfileId.current = null;
      return;
    }
    if (formData.locations.length === 0) return;
    if (lastSeededLocationFormForProfileId.current === formData.id) return;
    const first = formData.locations[0];
    setNewLoc({
      lat: first.lat,
      lng: first.lng,
      region: first.region,
      city: first.city,
      address: first.address,
    });
    setLocationSearch(first.address ?? '');
    setEditingLocationIndex(0);
    lastSeededLocationFormForProfileId.current = formData.id;
  }, [formData]);
  const favoriteOffers = currentProducer?.favorites.map(id => offers.find(o => o.id === id)).filter(Boolean) as any[];
  const unavailableFavoriteIds = currentProducer?.favorites.filter(id => !offers.find(o => o.id === id));
  const performLogout = async () => {
    await logout();
    setLogoutConfirmOpen(false);
    navigate('/');
  };
  const handleAddPayment = (e: React.FormEvent) => { e.preventDefault(); void paymentFormik.submitForm(); };
  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { if (!formData) return; const { name, value } = e.target; setFormData(prev => prev ? ({ ...prev, [name]: value }) : null); };
  const toggleCategory = (cat: string) => { if (!formData) return; if (formData.productionTypes.includes(cat)) { setFormData({ ...formData, productionTypes: formData.productionTypes.filter(c => c !== cat) }); } else { setFormData({ ...formData, productionTypes: [...formData.productionTypes, cat] }); } };
  const startNewLocationEntry = () => {
    setEditingLocationIndex(null);
    setNewLoc({ region: '', city: '', address: '', lat: 0, lng: 0 });
    setLocationSearch('');
    setShowLocationSuggestions(false);
  };
  const addCurrentFieldsAsNewAddress = () => {
    setEditingLocationIndex(null);
  };
  const addLocation = () => {
    if (!formData || !newLoc.address) return;
    const address = String(newLoc.address).trim();
    if (!address) return;
    const city = String(newLoc.city ?? '').trim();
    const region = String(newLoc.region ?? '').trim();
    const fallbackParts = address.split(',').map((x) => x.trim()).filter(Boolean);
    const inferredCity = city || fallbackParts[1] || fallbackParts[0] || 'Unknown';
    const inferredRegion = region || fallbackParts[2] || fallbackParts[1] || 'Unknown';
    const locationToAdd: Location = {
      lat: Number(newLoc.lat ?? 0),
      lng: Number(newLoc.lng ?? 0),
      region: inferredRegion,
      city: inferredCity,
      address,
    };
    const nextLocations =
      editingLocationIndex != null && editingLocationIndex >= 0 && editingLocationIndex < formData.locations.length
        ? formData.locations.map((loc, idx) => (idx === editingLocationIndex ? locationToAdd : loc))
        : [...formData.locations, locationToAdd];
    setFormData({ ...formData, locations: nextLocations });
    setNewLoc({ region: '', city: '', address: '', lat: 0, lng: 0 });
    setLocationSearch('');
    setEditingLocationIndex(null);
  };
  const removeLocation = (index: number) => {
    if (!formData) return;
    setFormData({ ...formData, locations: formData.locations.filter((_, i) => i !== index) });
    if (editingLocationIndex === index) {
      setEditingLocationIndex(null);
      setNewLoc({ region: '', city: '', address: '', lat: 0, lng: 0 });
      setLocationSearch('');
    } else if (editingLocationIndex != null && editingLocationIndex > index) {
      setEditingLocationIndex(editingLocationIndex - 1);
    }
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'profileImageUrl' | 'certifications') => {
    if (!formData || !e.target.files?.length) return;
    const file = e.target.files[0];
    if (field === 'profileImageUrl') {
      const maxBytes = 2 * 1024 * 1024;
      if (file.size > maxBytes) {
        alert('Image must be 2 MB or less.');
        return;
      }
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PNG, JPG, and WebP are allowed for profile photos.');
        return;
      }
      setAvatarUploading(true);
      try {
        const url = await uploadAvatar(file);
        setFormData({ ...formData, profileImageUrl: url });
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Upload failed.');
      } finally {
        setAvatarUploading(false);
      }
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PNG, JPG, and PDF formats are allowed.');
      return;
    }
    setCertUploading(true);
    try {
      const url = await uploadDocument(file);
      setFormData({ ...formData, certifications: [...formData.certifications, url] });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setCertUploading(false);
    }
  };
  const savePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    const parsed = z.object({
      type: z.enum(['BUSINESS', 'INDIVIDUAL']),
      description: z.string().trim().min(2, 'Description is required.'),
      phone: z.string().trim().min(6, 'Phone is required.'),
      email: z.string().trim().email('Valid email is required.'),
    }).safeParse({
      type: formData.type,
      description: formData.description ?? '',
      phone: formData.phone ?? '',
      email: formData.email ?? '',
    });
    if (!parsed.success) {
      alert(parsed.error.issues[0]?.message || 'Please fix profile form errors.');
      return;
    }
    let displayName = formData.name;
    if (formData.type === 'INDIVIDUAL' && formData.firstName && formData.lastName) displayName = `${formData.firstName} ${formData.lastName}`;
    const payload = { ...formData, name: displayName };
    if (import.meta.env.PROD) {
      setPendingProfileUpdate(payload);
      setShowOtpModal(true);
      return;
    }
    updateProducerMutation.mutate({ producer: payload });
  };
  const handleOtpVerifiedForProfile = (token: string) => {
    if (!pendingProfileUpdate) return;
    updateProducerMutation.mutate(
      { producer: pendingProfileUpdate, otpToken: token },
      {
        onSuccess: (ok) => {
          if (ok) {
            setPendingProfileUpdate(null);
            setShowOtpModal(false);
          }
        },
      },
    );
  };
  const copyReferralLink = () => {
    if (!referralCodeDisplay) return;
    const link = `${window.location.origin}/#/register?ref=${referralCodeDisplay}`;
    void navigator.clipboard.writeText(link);
    alert('Referral link copied!');
  };
  useEffect(() => {
    const query = String(locationSearch ?? '').trim();
    if (query.length < 3) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`,
          { headers: { Accept: 'application/json' } },
        );
        if (!response.ok) {
          setLocationSuggestions([]);
          setShowLocationSuggestions(false);
          return;
        }
        const rows = await response.json();
        const mapped = Array.isArray(rows)
          ? rows.map((row: any) => {
              const addr = row?.address ?? {};
              const city = addr.city || addr.town || addr.village || addr.county || '';
              const region = addr.state || addr.region || addr.province || '';
              return {
                address: String(row?.display_name ?? ''),
                city: String(city),
                region: String(region),
                lat: Number(row?.lat ?? 0),
                lng: Number(row?.lon ?? 0),
              };
            }).filter((x: any) => x.address)
          : [];
        setLocationSuggestions(mapped);
        setShowLocationSuggestions(mapped.length > 0);
      } catch {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [locationSearch]);
  const loadNearbySuggestions = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const reverseRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`,
            { headers: { Accept: 'application/json' } },
          );
          const reverseRow = reverseRes.ok ? await reverseRes.json() : null;
          const addr = reverseRow?.address ?? {};
          const city = addr.city || addr.town || addr.village || addr.county || '';
          const region = addr.state || addr.region || addr.province || '';
          const seed = [city, region].filter(Boolean).join(', ') || String(reverseRow?.display_name ?? '');
          if (!seed) {
            setIsNearbyLoading(false);
            return;
          }
          const searchRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(seed)}`,
            { headers: { Accept: 'application/json' } },
          );
          const rows = searchRes.ok ? await searchRes.json() : [];
          const mapped = Array.isArray(rows)
            ? rows.map((row: any) => {
                const a = row?.address ?? {};
                return {
                  address: String(row?.display_name ?? ''),
                  city: String(a.city || a.town || a.village || a.county || ''),
                  region: String(a.state || a.region || a.province || ''),
                  lat: Number(row?.lat ?? 0),
                  lng: Number(row?.lon ?? 0),
                };
              }).filter((x: any) => x.address)
            : [];
          setLocationSuggestions(mapped);
          setShowLocationSuggestions(mapped.length > 0);
        } catch {
          setLocationSuggestions([]);
          setShowLocationSuggestions(false);
        } finally {
          setIsNearbyLoading(false);
        }
      },
      () => setIsNearbyLoading(false),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 },
    );
  }, []);

  const handleProfileMapPositionChange = useCallback(async (lat: number, lng: number) => {
    setNewLoc((prev) => ({ ...prev, lat, lng }));
    const rev = await nominatimReverseGeocode(lat, lng);
    if (!rev) return;
    setNewLoc((prev) => ({
      ...prev,
      lat,
      lng,
      address: rev.address || prev.address,
      city: rev.city || prev.city,
      region: rev.region || prev.region,
    }));
    setLocationSearch(rev.address);
  }, []);

  const handleUseMyLocationProfile = async () => {
    setGeoLoading(true);
    try {
      const { lat, lng } = await requestBrowserLocation();
      const rev = await nominatimReverseGeocode(lat, lng);
      setNewLoc({
        address: rev?.address || '',
        city: rev?.city || '',
        region: rev?.region || '',
        lat,
        lng,
      });
      setLocationSearch(rev?.address || '');
    } catch {
      alert('Could not read your location. Allow permission or set the pin on the map.');
    } finally {
      setGeoLoading(false);
    }
  };

  const [portfolioImageUploading, setPortfolioImageUploading] = useState(false);
  const [portfolioVideoUploading, setPortfolioVideoUploading] = useState(false);
  const handlePortfolioImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    e.target.value = '';
    if (files.length === 0) return;
    if ((portfolioForm.imageUrls?.length || 0) + files.length > 10) {
      alert('Maximum 10 images allowed.');
      return;
    }
    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max 5MB.`);
        continue;
      }
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        alert(`File ${file.name} is invalid format. PNG, JPG, or WebP only.`);
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length === 0) return;
    setPortfolioImageUploading(true);
    try {
      const uploaded = await Promise.all(validFiles.map((f) => uploadPortfolioImage(f)));
      setPortfolioForm(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...uploaded] }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Portfolio image upload failed.');
    } finally {
      setPortfolioImageUploading(false);
    }
  };
  const handlePortfolioVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('Video file too large. Max 50MB.');
      return;
    }
    setPortfolioVideoUploading(true);
    try {
      const url = await uploadPortfolioVideo(file);
      setPortfolioForm(prev => ({ ...prev, videoUrl: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Video upload failed.');
    } finally {
      setPortfolioVideoUploading(false);
    }
  };
  const openPortfolioModal = (portfolio?: Portfolio) => { if (portfolio) { setPortfolioForm({ ...portfolio }); } else { setPortfolioForm({ title: '', description: '', category: currentProducer?.productionTypes[0] || '', imageUrls: [], isPublished: true }); } setShowPortfolioModal(true); };
  const savePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.producerId) return;
    const parsed = z.object({
      title: z.string().trim().min(2, 'Title is required.'),
      category: z.string().trim().min(1, 'Category is required.'),
      description: z.string().trim().min(5, 'Description is required.'),
    }).safeParse({
      title: portfolioForm.title ?? '',
      category: portfolioForm.category ?? '',
      description: portfolioForm.description ?? '',
    });
    if (!parsed.success) {
      alert(parsed.error.issues[0]?.message || 'Please fix portfolio form errors.');
      return;
    }
    if (portfolioImageUploading || portfolioVideoUploading) {
      alert('Please wait for media uploads to finish.');
      return;
    }
    const chosenCategory = (portfolioForm.category ?? '').trim();
    if (!portfolioForm.id && myPortfolios.some(p => p.category === chosenCategory)) {
      alert(`You already have a portfolio for the "${portfolioCategoryLabel(chosenCategory, t)}" category. You can edit the existing one instead.`);
      return;
    }
    const data = {
      producerId: user.producerId,
      title: portfolioForm.title!,
      description: portfolioForm.description!,
      category: portfolioForm.category!,
      imageUrls: portfolioForm.imageUrls || [],
      videoUrl: portfolioForm.videoUrl,
      isPublished: portfolioForm.isPublished || false,
    };
    if (portfolioForm.id) {
      updatePortfolio({ ...data, id: portfolioForm.id, createdAt: (portfolioForm as Portfolio).createdAt });
    } else {
      addPortfolio(data);
    }
    setShowPortfolioModal(false);
  };
  const confirmDeletePortfolio = async () => {
    if (!portfolioPendingDelete) return;
    try {
      setDeletingPortfolio(true);
      await deletePortfolio(portfolioPendingDelete.id);
      setShowPortfolioPreview((prev) => (prev?.id === portfolioPendingDelete.id ? null : prev));
    } finally {
      setDeletingPortfolio(false);
      setPortfolioPendingDelete(null);
    }
  };

  if (!user || user.role !== UserRole.PRODUCER) {
    return <div className="p-8 text-center">Access Denied</div>;
  }
  /**
   * Note: we deliberately avoid blocking the full page with a "Loading your
   * profile..." takeover. The page shell (back button + sidebar tabs) is
   * rendered immediately, and the active tab shows its own scoped loader
   * until `formData` / `currentProducer` is hydrated. See `isProducerHydrating`.
   */
  const isProducerHydrating = !currentProducer || !formData;
  if (!currentProducer && !tabLoading && !profileHydrating) {
    return (
      <div className="p-8 text-center text-gray-700">
        No producer profile was found for your account.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* ... [Navigation Sidebar Logic] ... */}
      <div className="mb-4 sm:mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-primary-600 transition-colors font-medium text-sm sm:text-base">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
        <aside className="lg:col-span-3 mb-4 lg:mb-0">
          <nav className="agm-profile-nav">
            <button onClick={() => navigateToTab('info')} className={`${activeTab === 'info' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
              <User className={`${activeTab === 'info' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">{t('profile.tabs.info')}</span>
            </button>
            <Link to="/producer/dashboard" className="bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50 group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors">
              <Tractor className="text-gray-400 group-hover:text-gray-500 flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6" /> <span className="truncate">{t('nav.dashboard')}</span>
            </Link>
            <button onClick={() => navigateToTab('favorites')} className={`${activeTab === 'favorites' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
              <Heart className={`${activeTab === 'favorites' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">{t('profile.tabs.favorites')}</span>
            </button>
            <button onClick={() => navigateToTab('portfolio')} className={`${activeTab === 'portfolio' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
              <ImageIcon className={`${activeTab === 'portfolio' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">{t('profile.tabs.portfolio')}</span>
            </button>
            <button onClick={() => navigateToTab('referrals')} className={`${activeTab === 'referrals' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
              <Users className={`${activeTab === 'referrals' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">Referrals</span>
            </button>
            <Link to="/wallet" className="bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50 group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors">
              <Wallet className="text-gray-400 group-hover:text-gray-500 flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6" /> <span className="truncate">{t('nav.wallet')}</span>
            </Link>
            <button onClick={() => navigateToTab('payment')} className={`${activeTab === 'payment' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
              <CreditCard className={`${activeTab === 'payment' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">{t('profile.tabs.payment')}</span>
            </button>
            <button onClick={() => navigateToTab('security')} className={`${activeTab === 'security' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
              <Shield className={`${activeTab === 'security' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">{t('profile.tabs.security')}</span>
            </button>
            <button type="button" onClick={() => setLogoutConfirmOpen(true)} className="hidden lg:flex text-red-600 hover:bg-red-50 group rounded-md px-3 py-2 items-center text-sm font-medium w-full transition-colors mt-4 pt-4 border-t border-gray-200">
              <LogOut className="flex-shrink-0 -ml-1 mr-3 h-6 w-6" /> <span className="truncate">{t('nav.logout')}</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="space-y-6 lg:col-span-9 min-w-0">

          {isProducerHydrating && (
            <div className="shadow sm:rounded-md bg-white p-4 sm:p-6">
              <SectionLoader message={t('form.loading')} />
            </div>
          )}

          {!isProducerHydrating && formData && activeTab === 'info' && (
            <form onSubmit={savePersonalInfo} className="shadow sm:rounded-md sm:overflow-hidden bg-white p-4 sm:p-6">
              {/* ... [Existing Info Form Code] ... */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4"><h3 className="text-lg font-medium text-gray-900">{t('profile.tabs.info')}</h3></div>
              <div className={`mb-4 rounded-md border p-3 ${formData.status === 'VALIDATED' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                <p className={`text-sm font-bold ${formData.status === 'VALIDATED' ? 'text-green-800' : 'text-yellow-800'}`}>
                  Producer status: {formData.status === 'VALIDATED' ? 'Approved Producer' : 'Pending Approval'}
                </p>
                <p className={`text-xs mt-1 ${formData.status === 'VALIDATED' ? 'text-green-700' : 'text-yellow-700'}`}>
                  {formData.status === 'VALIDATED'
                    ? 'Your producer account is approved. You can publish offers normally.'
                    : 'Your producer account is pending admin approval. Once approved, your status will change to Approved Producer.'}
                </p>
              </div>
              {/* Simplified view for brevity, functionality preserved */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6"><div className="relative flex-shrink-0"><div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">{formData.profileImageUrl ? (<img src={formData.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />) : (<User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />)}</div><label className={`absolute bottom-0 right-0 bg-primary-600 p-1.5 rounded-full text-white shadow-sm ${avatarUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-primary-700'}`}><Camera className="h-4 w-4" /><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={avatarUploading} onChange={(e) => void handleFileUpload(e, 'profileImageUrl')} /></label></div><div className="min-w-0"><p className="text-sm font-medium text-gray-700">{t('profile.uploadPhoto')}</p><p className="text-xs text-gray-500">{avatarUploading ? 'Uploading…' : 'JPG, PNG, or WebP. Max 2 MB.'}</p></div></div>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6"><label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.type')}</label><div className="flex space-x-4"><span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800">{formData.type === 'BUSINESS' ? t('profile.business') : t('profile.individual')}</span><span className="text-xs text-gray-400 self-center ml-2">Cannot be changed after registration</span></div></div>
                {formData.type === 'BUSINESS' ? (<><div className="sm:col-span-6"><label className="block text-sm font-medium text-gray-700">{t('form.farmName')}</label><input type="text" name="name" value={formData.name ?? ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" /></div><div className="sm:col-span-6"><label className="block text-sm font-medium text-gray-700">Tax ID (TIN / NIU) <span className="text-red-500">*</span></label><input type="text" name="taxIdentificationNumber" value={formData.taxIdentificationNumber ?? ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" /></div><div className="sm:col-span-6"><label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>{Array.isArray(formData.certifications) && formData.certifications.length > 0 && (<div className="flex flex-wrap gap-2 mb-2">{formData.certifications.map((url, i) => (<a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-primary-700 bg-primary-50 px-2 py-1 rounded hover:underline">Document {i + 1}</a>))}</div>)}<label className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 ${certUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-50'}`}>{certUploading ? 'Uploading…' : 'Upload certificate (PDF, JPG, PNG)'}<input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={certUploading} onChange={(e) => void handleFileUpload(e, 'certifications')} /></label><p className="text-xs text-gray-500 mt-1">NIU certificate, business registration, or other compliance documents</p></div></>) : (<><div className="sm:col-span-3"><label className="block text-sm font-medium text-gray-700">{t('profile.firstName')}</label><input type="text" name="firstName" value={formData.firstName || ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" /></div><div className="sm:col-span-3"><label className="block text-sm font-medium text-gray-700">{t('profile.lastName')}</label><input type="text" name="lastName" value={formData.lastName || ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" /></div><div className="sm:col-span-3"><label className="block text-sm font-medium text-gray-700">{t('profile.gender')}</label><select name="gender" value={formData.gender || ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900"><option value="">Select Gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></div><div className="sm:col-span-3"><label className="block text-sm font-medium text-gray-700">{t('profile.dob')}</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" /></div><div className="sm:col-span-6"><label className="block text-sm font-medium text-gray-700">Tax ID (TIN / NIU) <span className="text-red-500">*</span></label><input type="text" name="taxIdentificationNumber" value={formData.taxIdentificationNumber ?? ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" /></div><div className="sm:col-span-6"><label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>{Array.isArray(formData.certifications) && formData.certifications.length > 0 && (<div className="flex flex-wrap gap-2 mb-2">{formData.certifications.map((url, i) => (<a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-primary-700 bg-primary-50 px-2 py-1 rounded hover:underline">Document {i + 1}</a>))}</div>)}<label className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 ${certUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-50'}`}>{certUploading ? 'Uploading…' : 'Upload certificate (PDF, JPG, PNG)'}<input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={certUploading} onChange={(e) => void handleFileUpload(e, 'certifications')} /></label><p className="text-xs text-gray-500 mt-1">NIU certificate, ID, or other compliance documents</p></div></>)}
                <div className="sm:col-span-3"><label className="block text-sm font-medium text-gray-700">{t('form.phone')}</label><input type="tel" name="phone" value={formData.phone ?? ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" /></div>
                <div className="sm:col-span-3"><label className="block text-sm font-medium text-gray-700">{t('form.email')}</label><input type="email" name="email" value={formData.email ?? ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" /></div>
                <div className="sm:col-span-6"><label className="block text-sm font-medium text-gray-700 mb-2">{t('form.category')} (Multi-select)</label><div className="flex flex-wrap gap-2 border border-gray-200 p-3 rounded-md bg-white">{PRODUCTION_TYPES.map(cat => { const isSelected = formData.productionTypes.includes(cat); return (<button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isSelected ? 'bg-primary-100 text-primary-800 ring-2 ring-primary-500 ring-offset-1' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t(`category.${cat}`)}{isSelected && <X className="ml-1.5 h-3 w-3" />}</button>) })}</div></div>
                <div className="sm:col-span-6 border-t border-gray-100 pt-4 mt-2">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-primary-600" /> Operating Locations
                  </h4>
                  <div className="space-y-2 mb-4">
                    {formData.locations.map((loc, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between bg-gray-50 p-3 rounded-md border cursor-pointer ${editingLocationIndex === idx ? 'border-primary-400 ring-1 ring-primary-300' : 'border-gray-200'}`}
                        onClick={() => {
                          setEditingLocationIndex(idx);
                          setNewLoc({ ...loc });
                          setLocationSearch(loc.address ?? '');
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{loc.address}</p>
                          <p className="text-xs text-gray-500">{loc.city}, {loc.region}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={t('location.removeTitle')}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocationToRemoveIdx(idx);
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-blue-700">Add or update an address</p>
                      {formData.locations.length > 0 && (
                        <button
                          type="button"
                          onClick={startNewLocationEntry}
                          className="text-xs font-semibold text-primary-700 hover:text-primary-900 underline"
                        >
                          {editingLocationIndex != null ? 'New address (keep existing)' : 'Add another address'}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleUseMyLocationProfile()}
                        disabled={geoLoading}
                        className="text-sm px-3 py-1.5 rounded-md border border-primary-200 bg-white text-primary-700 hover:bg-primary-50 disabled:opacity-50"
                      >
                        {geoLoading ? 'Getting location…' : 'Use my current location'}
                      </button>
                    </div>
                    <LocationMapPicker
                      latitude={Number(newLoc.lat) || 0}
                      longitude={Number(newLoc.lng) || 0}
                      onPositionChange={handleProfileMapPositionChange}
                      height="min(240px, 45vh)"
                    />
                    <p className="text-xs text-gray-500">Drag the pin or tap the map to set coordinates. Address fields update from the pin when possible.</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Search address</label>
                        <input
                          type="text"
                          placeholder="Type to search (OpenStreetMap)"
                          value={locationSearch}
                          onChange={e => {
                            const value = e.target.value;
                            setLocationSearch(value);
                            setNewLoc((prev) => ({ ...prev, address: value }));
                            setShowLocationSuggestions(true);
                          }}
                          onFocus={() => {
                            if (locationSuggestions.length > 0) setShowLocationSuggestions(true);
                            else loadNearbySuggestions();
                          }}
                          className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 bg-white text-gray-900"
                        />
                      </div>
                      {showLocationSuggestions && locationSuggestions.length > 0 && (
                        <div className="sm:col-span-2 border border-gray-200 rounded-md bg-white shadow-sm max-h-56 overflow-auto">
                          {locationSuggestions.map((item, idx) => (
                            <button
                              key={`${item.address}-${idx}`}
                              type="button"
                              onClick={() => {
                                setLocationSearch(item.address);
                                setNewLoc({
                                  address: item.address,
                                  city: item.city || '',
                                  region: item.region || '',
                                  lat: item.lat,
                                  lng: item.lng,
                                });
                                setShowLocationSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <p className="text-sm text-gray-900">{item.address}</p>
                              <p className="text-xs text-gray-500">{[item.city, item.region].filter(Boolean).join(', ')}</p>
                            </button>
                          ))}
                        </div>
                      )}
                      {isNearbyLoading && (
                        <p className="sm:col-span-2 text-xs text-gray-500">Finding nearby locations...</p>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                        <input
                          type="text"
                          value={newLoc.city ?? ''}
                          onChange={e => setNewLoc((prev) => ({ ...prev, city: e.target.value }))}
                          className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
                        <input
                          type="text"
                          value={newLoc.region ?? ''}
                          onChange={e => setNewLoc((prev) => ({ ...prev, region: e.target.value }))}
                          className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Full address</label>
                        <input
                          type="text"
                          value={newLoc.address ?? ''}
                          onChange={e => {
                            const v = e.target.value;
                            setNewLoc((prev) => ({ ...prev, address: v }));
                            setLocationSearch(v);
                          }}
                          className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={addLocation}
                        disabled={!String(newLoc.address ?? '').trim()}
                        className="inline-flex items-center gap-1 px-3 py-2 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        {editingLocationIndex != null ? 'Update location' : 'Add to list'}
                      </button>
                      {editingLocationIndex != null && (
                        <button
                          type="button"
                          onClick={addCurrentFieldsAsNewAddress}
                          className="text-sm text-gray-600 hover:text-gray-900 underline"
                        >
                          Add as new address (keep fields below)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-6"><label className="block text-sm font-medium text-gray-700">{t('form.desc')}</label><textarea name="description" rows={3} value={formData.description} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" /></div>
                <div className="sm:col-span-6 border-t border-gray-100 pt-4"><h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center"><FileText className="h-4 w-4 mr-1 text-primary-600" /> Documents</h4><label className="block text-sm font-medium text-gray-700">{t('profile.uploadDocs')}</label><div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors bg-white"><div className="space-y-1 text-center"><Upload className="mx-auto h-12 w-12 text-gray-400" /><div className="flex text-sm text-gray-600"><label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"><span>Upload a file</span><input type="file" className="sr-only" accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf" onChange={(e) => handleFileUpload(e, 'certifications')} /></label><p className="pl-1">or drag and drop</p></div><p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p></div></div>{formData.certifications.length > 0 && (<ul className="mt-3 border border-gray-200 rounded-md divide-y divide-gray-200 bg-white">{formData.certifications.map((cert, idx) => (<li key={idx} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"><div className="w-0 flex-1 flex items-center"><FileText className="flex-shrink-0 h-5 w-5 text-gray-400" /><span className="ml-2 flex-1 w-0 truncate text-gray-900">{cert}</span></div></li>))}</ul>)}</div>
                <div className="sm:col-span-6 pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProducerMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-md text-sm font-medium shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {updateProducerMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                        {t('form.saving')}
                      </>
                    ) : (
                      t('form.save')
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {!isProducerHydrating && activeTab === 'referrals' && currentProducer && (
            <div className="shadow sm:rounded-md sm:overflow-hidden bg-white p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center"><Users className="h-5 w-5 mr-2 text-primary-600" /> Referrals</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"><p className="text-sm text-blue-800 mb-2 font-bold">Your Referral Link</p><div className="flex flex-col sm:flex-row gap-2"><input type="text" readOnly value={`${window.location.origin}/#/register?ref=${referralCodeDisplay}`} className="block w-full min-w-0 border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-700" /><button type="button" onClick={copyReferralLink} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center flex-shrink-0"><Copy className="h-4 w-4 mr-2" /> Copy</button></div><p className="text-xs text-blue-600 mt-2">Share this link with friends to invite them to the platform.</p></div>
              {myReferrals?.activeProgram ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-bold text-gray-900">{myReferrals.activeProgram.name}</h4>
                  {myReferrals.activeProgram.description ? (
                    <p className="text-sm text-gray-600 mt-1">{myReferrals.activeProgram.description}</p>
                  ) : null}
                  <ul className="mt-3 text-sm text-gray-800 space-y-1 list-disc list-inside">
                    <li>Referrer reward: {myReferrals.activeProgram.currency} {Number(myReferrals.activeProgram.referrerRewardAmount).toFixed(2)}</li>
                    <li>New user reward: {myReferrals.activeProgram.currency} {Number(myReferrals.activeProgram.refereeRewardAmount).toFixed(2)}</li>
                    <li>Minimum payout: {myReferrals.activeProgram.currency} {Number(myReferrals.activeProgram.minimumPayoutThreshold).toFixed(2)}</li>
                  </ul>
                  {myReferrals.activeProgram.termsUrl ? (
                    <a href={myReferrals.activeProgram.termsUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm font-medium mt-3 inline-block hover:underline">
                      Terms &amp; conditions
                    </a>
                  ) : null}
                </div>
              ) : null}
              <div className="border-t border-gray-200 pt-4"><div className="flex items-center justify-between mb-4"><h4 className="text-sm font-bold text-gray-900">Your Impact</h4><span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">{referralCount} Referrals</span></div>{referralCount === 0 ? (<div className="text-center py-8 text-gray-500"><Users className="h-12 w-12 mx-auto text-gray-300 mb-2" /><p>You haven&apos;t referred anyone yet.</p></div>) : (<div className="space-y-3"><p className="text-sm text-gray-600">You have successfully referred {referralCount} user{referralCount === 1 ? '' : 's'}.</p>{referredPeople.length > 0 ? (<ul className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white">{referredPeople.map((u) => (<li key={u.id} className="px-3 py-2 flex justify-between text-sm"><span className="font-medium text-gray-900">{u.displayName || 'User'}</span><span className="text-gray-500">{u.joinedDate ? new Date(u.joinedDate).toLocaleDateString() : ''}</span></li>))}</ul>) : null}</div>)}</div>
            </div>
          )}

          {!isProducerHydrating && activeTab === 'portfolio' && (
            <div className="bg-white shadow sm:rounded-md sm:overflow-hidden p-4 sm:p-6">
              <div className="flex flex-wrap gap-3 justify-between items-center border-b border-gray-200 pb-4 mb-4"><h3 className="text-lg font-medium text-gray-900">{t('portfolio.title')}</h3><button onClick={() => openPortfolioModal()} className="flex items-center bg-primary-600 text-white px-3 py-2 rounded-md text-sm hover:bg-primary-700"><Plus className="h-4 w-4 mr-1" /> {t('portfolio.add')}</button></div>
              {myPortfolios.length === 0 ? (<div className="text-center py-12 text-gray-500"><ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p>{t('portfolio.empty')}</p></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">{myPortfolios.map(p => (<div key={p.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"><div className="h-40 bg-gray-100 relative">{(p.imageUrls?.length ?? 0) > 0 ? (<img src={p.imageUrls?.[0] ?? ''} alt={p.title} className={offerImageInBox} />) : (<div className="flex items-center justify-center h-full text-gray-400"><ImageIcon className="h-8 w-8" /></div>)}<span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded ${p.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{p.isPublished ? t('portfolio.published') : t('portfolio.draft')}</span><span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">{portfolioCategoryLabel(p.category, t)}</span></div><div className="p-4"><h4 className="font-bold text-gray-900 mb-1 line-clamp-2 break-words">{p.title}</h4><p className="text-xs text-gray-500 mb-3 line-clamp-2 break-words">{p.description}</p><div className="flex justify-between items-center pt-3 border-t border-gray-100"><div className="flex space-x-2"><span className="flex items-center text-xs text-gray-500"><ImageIcon className="w-3 h-3 mr-1" /> {p.imageUrls?.length ?? 0}</span>{p.videoUrl && <span className="flex items-center text-xs text-gray-500"><Video className="w-3 h-3 mr-1" /> 1</span>}</div><div className="flex space-x-2"><button onClick={() => setShowPortfolioPreview(p)} className="text-blue-600 hover:text-blue-800"><Eye className="h-4 w-4" /></button><button onClick={() => openPortfolioModal(p)} className="text-gray-600 hover:text-primary-600"><Edit className="h-4 w-4" /></button><button type="button" onClick={() => setPortfolioPendingDelete(p)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button></div></div></div></div>))}</div>)}
            </div>
          )}

          {!isProducerHydrating && activeTab === 'favorites' && (
            <div className="shadow sm:rounded-md sm:overflow-hidden bg-white p-4 sm:p-6">
              <div className="border-b border-gray-200 pb-4 mb-4"><h3 className="text-lg font-medium text-gray-900">{t('profile.tabs.favorites')}</h3></div>
              {unavailableFavoriteIds && unavailableFavoriteIds.length > 0 && (<div className="mb-6 bg-yellow-50 p-4 rounded-md border border-yellow-100"><h4 className="text-sm font-bold text-yellow-800 mb-2">Unavailable Items</h4><ul className="space-y-2">{unavailableFavoriteIds.map(id => (<li key={id} className="flex items-center justify-between text-sm text-yellow-700"><span>Item #{id} is no longer available.</span><div className="flex items-center gap-2"><button onClick={() => setFavoriteToRemove({ id, title: `Item #${id}` })} className="text-xs text-red-600 hover:underline">{t('cart.remove')}</button><Link to="/market/producers" className="text-xs bg-yellow-200 px-2 py-1 rounded hover:bg-yellow-300 flex items-center"><Search className="w-3 h-3 mr-1" /> {t('profile.findSimilar')}</Link></div></li>))}</ul></div>)}
              {tabLoading && (!favoriteOffers || favoriteOffers.length === 0) ? (<SectionLoader message={t('form.loading')} />) : (!favoriteOffers || favoriteOffers.length === 0) ? (<div className="text-center py-12 text-gray-500"><Heart className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p>{t('profile.favorites.empty')}</p></div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{favoriteOffers.map((offer: any) => (<div key={offer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex items-center"><div className="mr-4 h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100"><img src={offer.imageUrl} alt="" className={offerImageInBox} /></div><div className="flex-1 min-w-0"><h4 className="font-bold text-gray-900 truncate">{offer.title}</h4><p className="text-sm text-gray-500">{offer.price} XAF / {offer.unit}</p></div><div className="flex flex-col gap-2 ml-2"><Link to={`/offer/${offer.id}`} className="text-primary-600 hover:bg-primary-50 p-2 rounded-full"><ArrowLeft className="h-5 w-5 rotate-180" /></Link><button onClick={() => setFavoriteToRemove({ id: offer.id, title: offer.title })} className="text-red-500 hover:bg-red-50 p-2 rounded-full" aria-label={t('favorites.removeTitle')}><Trash2 className="h-5 w-5" /></button></div></div>))}</div>)}
            </div>
          )}

          {!isProducerHydrating && activeTab === 'payment' && (
            <div className="shadow sm:rounded-md sm:overflow-hidden bg-white p-4 sm:p-6">
              <div className="flex flex-wrap gap-3 justify-between items-center mb-6"><h3 className="text-lg font-medium text-gray-900">{t('profile.payment.saved')}</h3><button onClick={() => setShowAddPayment(true)} className="flex items-center text-sm bg-primary-600 text-white px-3 py-2 rounded-md hover:bg-primary-700"><Plus className="h-4 w-4 mr-1" /> {t('form.add')}</button></div>
              <ul className="divide-y divide-gray-200 mb-6">{(!currentProducer?.paymentMethods || currentProducer.paymentMethods.length === 0) ? (<li className="py-4 text-gray-500 italic">{t('profile.payment.none')}</li>) : (currentProducer.paymentMethods.map(pm => (<li key={pm.id} className="py-4 flex justify-between items-center"><div className="flex items-center"><div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${pm.provider === 'ORANGE' ? 'bg-orange-100 text-orange-600' : pm.provider === 'MTN' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}><CreditCard className="h-5 w-5" /></div><div><p className="text-sm font-medium text-gray-900">{pm.provider} - {pm.accountNumber}</p><p className="text-xs text-gray-500">{pm.accountName}</p></div></div><button onClick={() => setPaymentToRemove({ id: pm.id, provider: pm.provider, accountNumber: pm.accountNumber })} className="text-red-600 hover:text-red-800 p-2" aria-label={t('payment.removeTitle')}><Trash2 className="h-5 w-5" /></button></li>)))}</ul>
              {showAddPayment && (<div className="bg-gray-50 p-4 rounded-md border border-gray-200 animate-fade-in"><h4 className="text-sm font-bold text-gray-700 mb-3">{t('profile.payment.add')}</h4><form onSubmit={handleAddPayment} className="space-y-4"><div><label className="block text-xs font-medium text-gray-500">{t('profile.payment.provider')}</label><select name="provider" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900" value={paymentFormik.values.provider} onChange={paymentFormik.handleChange} onBlur={paymentFormik.handleBlur}><option value="ORANGE">Orange Money</option><option value="MTN">MTN Mobile Money</option><option value="BANK">Bank Transfer</option></select></div><div><label className="block text-xs font-medium text-gray-500">{t('profile.payment.accNum')}</label><input type="text" name="accountNumber" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900" placeholder={paymentFormik.values.provider === 'BANK' ? 'IBAN / Account No' : '6...'} value={paymentFormik.values.accountNumber} onChange={paymentFormik.handleChange} onBlur={paymentFormik.handleBlur} />{paymentFormik.touched.accountNumber && paymentFormik.errors.accountNumber ? <p className="text-xs text-red-600 mt-1">{paymentFormik.errors.accountNumber}</p> : null}</div><div><label className="block text-xs font-medium text-gray-500">{t('profile.payment.accName')}</label><input type="text" name="accountName" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900" placeholder="Full Name on Account" value={paymentFormik.values.accountName} onChange={paymentFormik.handleChange} onBlur={paymentFormik.handleBlur} />{paymentFormik.touched.accountName && paymentFormik.errors.accountName ? <p className="text-xs text-red-600 mt-1">{paymentFormik.errors.accountName}</p> : null}</div><div className="flex justify-end space-x-3 mt-4"><button type="button" onClick={() => setShowAddPayment(false)} className="text-gray-600 text-sm hover:text-gray-800">{t('form.cancel')}</button><button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700">{t('form.save')}</button></div></form></div>)}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="shadow sm:rounded-md sm:overflow-hidden bg-white p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">{t('profile.tabs.security')}</h3>
              <div className="mt-4">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors w-full sm:w-auto"
                >
                  {t('profile.password')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {import.meta.env.PROD && (
        <OtpVerificationModal
          open={showOtpModal}
          onClose={() => { setShowOtpModal(false); setPendingProfileUpdate(null); }}
          action="PROFILE_UPDATE"
          onRequestOtp={requestOtp}
          onVerifyOtp={verifyOtp}
          onVerified={handleOtpVerifiedForProfile}
          title={t('otp.verifyProfileTitle')}
          sendCodeLabel={t('otp.sendCode')}
          verifyLabel={t('otp.verify')}
          codeSentMessage={t('otp.enterCode')}
        />
      )}

      {/* Portfolio Edit/Add Modal (Omitted code block for brevity but functional logic is above) */}
      {showPortfolioModal && (<div className="fixed inset-0 z-50 overflow-y-auto"><div className="flex items-end sm:items-center justify-center min-h-screen p-2 sm:p-4"><div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPortfolioModal(false)}></div><div className="relative bg-white rounded-t-lg sm:rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 w-full sm:max-w-lg sm:p-6 max-h-[90vh] overflow-y-auto"><h3 className="text-lg font-medium text-gray-900 mb-4">{portfolioForm.id ? 'Edit' : 'Add'} Portfolio Item</h3><form onSubmit={savePortfolio} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700">{t('form.title')}</label><input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900" value={portfolioForm.title} onChange={e => setPortfolioForm({ ...portfolioForm, title: e.target.value })} /></div><div><label className="block text-sm font-medium text-gray-700">{t('form.category')}</label><select required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900" value={portfolioForm.category} onChange={e => setPortfolioForm({ ...portfolioForm, category: e.target.value })}><option value="">Select Category</option>{currentProducer?.productionTypes.map(t => <option key={t} value={t}>{t}</option>)}</select><p className="text-xs text-gray-500 mt-1">{t('portfolio.categoryTip')}</p></div><div><label className="block text-sm font-medium text-gray-700">{t('form.desc')}</label><textarea required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900" value={portfolioForm.description} onChange={e => setPortfolioForm({ ...portfolioForm, description: e.target.value })} /></div><div className="bg-gray-50 p-3 rounded border border-gray-200"><label className="block text-sm font-medium text-gray-700 mb-2">Media</label><div className="mb-3"><label className={`flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 ${portfolioImageUploading ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}><ImageIcon className="h-4 w-4" /><span>{portfolioImageUploading ? 'Uploading…' : 'Add Images (Max 10)'}</span><input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" disabled={portfolioImageUploading} onChange={handlePortfolioImageUpload} /></label><div className="flex flex-wrap gap-2 mt-2">{portfolioForm.imageUrls?.map((url, idx) => (<div key={idx} className="relative w-16 h-16 border rounded overflow-hidden group bg-gray-100"><img src={url} alt="" className={offerImageInBox} /><button type="button" onClick={() => setPortfolioForm(prev => ({ ...prev, imageUrls: prev.imageUrls?.filter((_, i) => i !== idx) }))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button></div>))}</div><p className="text-xs text-gray-500 mt-1">{t('portfolio.maxImages')}</p></div><div><label className={`flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 ${portfolioVideoUploading ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}><Video className="h-4 w-4" /><span>{portfolioVideoUploading ? 'Uploading…' : (portfolioForm.videoUrl ? 'Replace Video' : 'Add Video')}</span><input type="file" accept="video/*" className="hidden" disabled={portfolioVideoUploading} onChange={handlePortfolioVideoUpload} /></label>{portfolioForm.videoUrl && (<div className="mt-2 text-xs text-green-600 flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> Video attached<button type="button" onClick={() => setPortfolioForm(prev => ({ ...prev, videoUrl: undefined }))} className="ml-2 text-red-500 hover:underline">Remove</button></div>)}<p className="text-xs text-gray-500 mt-1">{t('portfolio.video')}</p></div></div><div className="flex items-center"><input type="checkbox" id="publish" className="h-4 w-4 text-primary-600 border-gray-300 rounded" checked={portfolioForm.isPublished} onChange={e => setPortfolioForm({ ...portfolioForm, isPublished: e.target.checked })} /><label htmlFor="publish" className="ml-2 block text-sm text-gray-900">{t('form.publish')}</label></div><div className="flex justify-end space-x-3"><button type="button" onClick={() => setShowPortfolioModal(false)} className="text-gray-600 hover:text-gray-900">{t('form.cancel')}</button><button type="submit" disabled={portfolioImageUploading || portfolioVideoUploading} className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed">{portfolioImageUploading || portfolioVideoUploading ? 'Uploading…' : t('form.save')}</button></div></form></div></div></div>)}

      {/* Portfolio Preview Modal */}
      {showPortfolioPreview && (() => {
        const p = showPortfolioPreview;
        const images = p.imageUrls ?? [];
        const hero = images[0];
        const gallery = images.slice(1);
        const videoUrl = p.videoUrl?.trim();
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <button
              type="button"
              className="fixed inset-0 bg-gray-900/90 transition-opacity"
              aria-label="Close preview"
              onClick={() => setShowPortfolioPreview(null)}
            />
            <div
              className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="portfolio-preview-title"
            >
              <button
                type="button"
                onClick={() => setShowPortfolioPreview(null)}
                className="absolute right-3 top-3 z-20 rounded-full bg-black/55 p-2 text-white hover:bg-black/75"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {hero ? (
                  <div className="relative flex h-52 w-full shrink-0 items-center justify-center bg-gray-100 p-3 sm:h-64 sm:p-4">
                    <img src={hero} alt="" className={offerImageHero} />
                  </div>
                ) : null}
                <div className="p-6 pt-10 sm:pt-8">
                  <div className="mb-3 flex flex-wrap items-center gap-2 pr-10">
                    <span className="inline-flex items-center rounded-md bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-800">
                      {portfolioCategoryLabel(p.category, t)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${
                        p.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {p.isPublished ? t('portfolio.published') : t('portfolio.draft')}
                    </span>
                  </div>
                  <h2
                    id="portfolio-preview-title"
                    className="break-words text-xl font-bold leading-snug text-gray-900 sm:text-2xl"
                  >
                    {p.title}
                  </h2>
                  <p className="mt-4 max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 sm:text-base">
                    {p.description}
                  </p>
                  {videoUrl ? (
                    isHostedHttpUrl(videoUrl) ? (
                      <div className="mt-6 overflow-hidden rounded-lg bg-black">
                        <video
                          controls
                          playsInline
                          className="max-h-72 w-full"
                          src={videoUrl}
                        />
                      </div>
                    ) : (
                      <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        Video uses a temporary local URL and cannot be played here after reload. Edit this item and upload again, or use a public <code className="rounded bg-amber-100 px-1">https://</code> link.
                      </p>
                    )
                  ) : null}
                  {gallery.length > 0 ? (
                    <div className="mt-6">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {gallery.length === 1 ? '1 more image' : `${gallery.length} more images`}
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {gallery.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="overflow-hidden rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                          >
                            <img
                              src={url}
                              alt=""
                              className="h-36 w-full object-contain object-center bg-gray-100 transition-opacity hover:opacity-90 sm:h-40"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <ConfirmModal
        open={portfolioPendingDelete !== null}
        tone="danger"
        title={t('portfolio.deleteConfirmTitle')}
        description={
          <>
            <p>{t('portfolio.deleteConfirmBody')}</p>
            {portfolioPendingDelete?.title && (
              <p className="mt-2 break-words text-sm font-semibold text-gray-900">{portfolioPendingDelete.title}</p>
            )}
          </>
        }
        confirmLabel={t('form.delete')}
        busy={deletingPortfolio}
        onClose={() => { if (!deletingPortfolio) setPortfolioPendingDelete(null); }}
        onConfirm={confirmDeletePortfolio}
      />

      <ConfirmModal
        open={paymentToRemove !== null}
        tone="danger"
        title={t('payment.removeTitle')}
        description={
          <>
            <p>{t('payment.removeBody')}</p>
            {paymentToRemove && (
              <p className="mt-2 break-words text-sm font-semibold text-gray-900">{paymentToRemove.provider} — {paymentToRemove.accountNumber}</p>
            )}
          </>
        }
        confirmLabel={t('form.delete')}
        busy={deletingPayment}
        onClose={() => { if (!deletingPayment) setPaymentToRemove(null); }}
        onConfirm={async () => {
          if (!paymentToRemove || !user?.producerId) return;
          try {
            setDeletingPayment(true);
            await deleteProducerPaymentMethod(user.producerId, paymentToRemove.id);
          } finally {
            setDeletingPayment(false);
            setPaymentToRemove(null);
          }
        }}
      />

      <ConfirmModal
        open={locationToRemoveIdx !== null}
        tone="danger"
        title={t('location.removeTitle')}
        description={t('location.removeBody')}
        confirmLabel={t('form.delete')}
        onClose={() => setLocationToRemoveIdx(null)}
        onConfirm={() => {
          if (locationToRemoveIdx === null) return;
          removeLocation(locationToRemoveIdx);
          setLocationToRemoveIdx(null);
        }}
      />

      <ConfirmModal
        open={favoriteToRemove !== null}
        tone="danger"
        title={t('favorites.removeTitle')}
        description={favoriteToRemove?.title ? <><span className="font-medium text-gray-900">{favoriteToRemove.title}</span> — {t('favorites.removeBody')}</> : t('favorites.removeBody')}
        confirmLabel={t('cart.remove')}
        onClose={() => setFavoriteToRemove(null)}
        onConfirm={async () => {
          if (!favoriteToRemove) return;
          await toggleFavorite(favoriteToRemove.id);
          setFavoriteToRemove(null);
        }}
      />

      <LogoutConfirmModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={performLogout}
      />
    </div>
  );
};
