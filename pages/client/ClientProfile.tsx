
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore } from '../../services/storeContext';
import { clientProfileMatchesSession } from '../../services/clientProfileMatcher';
import { useTranslation } from '../../services/i18nContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { CurrencyPreferenceCard } from '../../components/CurrencyPreferenceCard';
import { UserRole, OrderStatus, ClientProfile as ClientProfileType, Location, Order, Review, OfferType, MarketType } from '../../types';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Package, Wallet, Shield, CheckCircle, AlertTriangle, CreditCard, Camera, MapPin, ArrowLeft, Tractor, Plus, Trash2, LogOut, Star, History, Archive, Heart, Search, X, ThumbsUp, Users, Eye, XCircle, Loader2, Calendar, Phone, Mail } from 'lucide-react';
import { useUpdateClientProfileMutation } from '../../client-api/hooks/useUpdateClientProfileMutation';
import { SEO } from '../../components/SEO';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Modal } from '../../components/Modal';
import { SectionLoader, ListSkeleton } from '../../components/Loaders';
import { ClientProfileSkeleton } from '../../components/skeletons/ClientProfileSkeleton';
import { requestBrowserLocation, nominatimReverseGeocode } from '../../services/geolocation';
import { LocationMapPicker } from '../../components/LocationMapPicker';
import { uploadAvatar } from '../../services/uploadService';
import { apiFetch } from '../../services/apiService';
import { API_ENDPOINTS } from '../../client-api/endpoints';
import { offerImageInBox } from '../../utils/offerImageDisplay';
import { PAYMENTS_ENABLED } from '../../utils/featureFlags';
import { orderHasService, orderIsRetail, orderIsServiceOnly, serviceLineCount, serviceSlotTotal } from '../../utils/orderLabels';
import { ORDER_STATUS_LABEL_KEY, ORDER_STATUS_PILL_CLASS } from '../../utils/orderStatusDisplay';
import {
  canCancelDirectly,
  canRequestCancellation,
  canReportProblem,
  canLeaveReview,
  isActiveOrderStatus,
} from '../../utils/orderActions';
import { useFormik } from 'formik';
import { z } from 'zod';
import { showAppToast } from '../../services/appToast';
import { buildClientReferralLink } from '../../utils/referralLink';
import { ServiceAppointmentPicker } from '../../components/ServiceAppointmentPicker';

import { MARKETPLACE_CATEGORIES } from '../../data/categories';

const PRODUCTION_TYPES = MARKETPLACE_CATEGORIES;

function normalizeClientLocations(raw: unknown): Location[] {
   if (!Array.isArray(raw)) return [];
   return raw.map((loc: any) => ({
      lat: Number(loc?.lat ?? loc?.latLng?.lat ?? 0),
      lng: Number(loc?.lng ?? loc?.latLng?.lng ?? 0),
      region: String(loc?.region ?? ''),
      city: String(loc?.city ?? ''),
      address: String(loc?.address ?? ''),
   }));
}

function normalizeDob(dobRaw: unknown): string {
   if (dobRaw == null || dobRaw === '') return '';
   if (typeof dobRaw === 'string') return dobRaw;
   if (dobRaw instanceof Date) return dobRaw.toISOString();
   return String(dobRaw);
}

export const ClientProfile: React.FC = () => {
   type ProfileTab = 'info' | 'orders' | 'security' | 'favorites' | 'reputation' | 'referrals' | 'payment';
   const isProfileTab = (v: string | null): v is ProfileTab =>
      v === 'info' || v === 'orders' || v === 'security' || v === 'favorites' || v === 'reputation' || v === 'referrals' || v === 'payment';

   const { user, orders, payForOrder, completeOrder, confirmReceipt, requestOrderCancellation, updateAppointment, reportProblem, clients, producers, upgradeClientToProducer, logout, submitReview, offers, toggleFavorite, cancelOrder, getWallet, reviews, getAverageRating, myReferrals, refreshMyReferrals, pickupPoints, revealContactInfo, refreshClients, refreshOrders, refreshOffers, refreshProducers, refreshAllReviews, refreshMyReviews, refreshWallet } = useStore();
   const updateClientMutation = useUpdateClientProfileMutation();
   const { t } = useTranslation();
   const { formatXaf } = useCurrency();
   const navigate = useNavigate();

   const [searchParams, setSearchParams] = useSearchParams();
   const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
      const tab = searchParams.get('tab');
      return isProfileTab(tab) ? tab : 'orders';
   });

   // ─── Per-tab lazy fetching ────────────────────────────────────────────
   //
   // Only the data the active tab actually renders is fetched. Switching
   // tabs (or hard-reloading on a deep-linked tab) fires just that tab's
   // refreshers; the React Query cache makes subsequent visits instant.
   // `tabLoading` is local so each tab shows its own scoped loader.
   const [tabLoading, setTabLoading] = useState(true);
   useEffect(() => {
      let cancelled = false;
      setTabLoading(true);

      // The profile shell (avatar, name) needs `currentClient` from the
      // `clients` array — always required regardless of active tab.
      const tasks: Promise<unknown>[] = [refreshClients()];

      switch (activeTab) {
         case 'orders':
            tasks.push(refreshOrders(), refreshOffers(), refreshProducers(), refreshAllReviews(), refreshWallet());
            break;
         case 'favorites':
            tasks.push(refreshOffers(), refreshProducers());
            break;
         case 'reputation':
            tasks.push(refreshMyReviews(), refreshAllReviews(), refreshProducers());
            break;
         case 'referrals':
            tasks.push(refreshMyReferrals());
            break;
         case 'info':
            // Info tab uses producer regions / production types for the
            // upgrade-to-producer form.
            tasks.push(refreshProducers());
            break;
         case 'security':
            // No remote data; only the password modal.
            break;
      }

      Promise.all(tasks).finally(() => {
         if (!cancelled) setTabLoading(false);
      });

      return () => { cancelled = true; };
   }, [activeTab]);

   useEffect(() => {
      const tab = searchParams.get('tab');
      if (isProfileTab(tab)) {
         setActiveTab((prev) => (prev === tab ? prev : tab));
         return;
      }
      if (tab && !isProfileTab(tab)) {
         setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('tab', 'orders');
            return next;
         }, { replace: true });
      }
   }, [searchParams, setSearchParams]);

   useEffect(() => {
      const tab = searchParams.get('tab');
      if (tab === activeTab) return;
      setSearchParams((prev) => {
         const next = new URLSearchParams(prev);
         next.set('tab', activeTab);
         return next;
      }, { replace: true });
   }, [activeTab, searchParams, setSearchParams]);

   // Deep link from order notifications (`/orders/:id` → `?order=<id>`): open that
   // specific order's detail modal so the customer can act on it (pay, confirm
   // receipt, review…) instead of hunting through the list. Runs once orders load.
   const handledDeepLinkOrderRef = useRef<string | null>(null);
   useEffect(() => {
      const orderId = searchParams.get('order');
      if (!orderId || orders.length === 0) return;
      if (handledDeepLinkOrderRef.current === orderId) return;
      const target = orders.find((o) => o.id === orderId);
      if (!target) return;
      handledDeepLinkOrderRef.current = orderId;
      setActiveTab('orders');
      setSelectedOrder(target);
      if (
         PAYMENTS_ENABLED &&
         searchParams.get('pay') === '1' &&
         target.status === OrderStatus.CONFIRMED_AWAITING_PAYMENT
      ) {
         initiatePayment(target.id);
      }
      setSearchParams((prev) => {
         const next = new URLSearchParams(prev);
         next.delete('order');
         next.delete('pay');
         return next;
      }, { replace: true });
   }, [searchParams, orders, setSearchParams]);

   const [formData, setFormData] = useState<ClientProfileType | null>(null);
   const [showUpgradeModal, setShowUpgradeModal] = useState(false);
   const [newLoc, setNewLoc] = useState<Partial<Location>>({ region: '', city: '', address: '', lat: 0, lng: 0 });
   const [locationSearch, setLocationSearch] = useState('');
   const [locationSuggestions, setLocationSuggestions] = useState<Array<{ address: string; city: string; region: string; lat: number; lng: number }>>([]);
   const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
   const [isNearbyLoading, setIsNearbyLoading] = useState(false);
   const [geoLoading, setGeoLoading] = useState(false);
   const [editingLocationIndex, setEditingLocationIndex] = useState<number | null>(null);

   const [showReviewModal, setShowReviewModal] = useState(false);
   const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
   const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);

   const [showDisputeModal, setShowDisputeModal] = useState(false);
   const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
   const [disputeFiles, setDisputeFiles] = useState<File[]>([]);

   const [showPaymentRecap, setShowPaymentRecap] = useState(false);
   const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
   const [paymentProcessing, setPaymentProcessing] = useState(false);

   const [showPasswordModal, setShowPasswordModal] = useState(false);
   const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
   const selectedOrderLive = useMemo(() => {
      if (!selectedOrder) return null;
      return orders.find((o) => o.id === selectedOrder.id) ?? selectedOrder;
   }, [selectedOrder, orders]);
   const [avatarUploading, setAvatarUploading] = useState(false);
   const [profileHydrating, setProfileHydrating] = useState(false);
   const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
   const [cancelingOrder, setCancelingOrder] = useState(false);
   const [completeOrderId, setCompleteOrderId] = useState<string | null>(null);
   const [completingOrder, setCompletingOrder] = useState(false);
   const [confirmReceiptOrderId, setConfirmReceiptOrderId] = useState<string | null>(null);
   const [confirmingReceipt, setConfirmingReceipt] = useState(false);
   const [cancelRequestOrderId, setCancelRequestOrderId] = useState<string | null>(null);
   const [cancelRequestReason, setCancelRequestReason] = useState('');
   const [requestingCancel, setRequestingCancel] = useState(false);
   const [rescheduleOrderId, setRescheduleOrderId] = useState<string | null>(null);
   const [rescheduleSlotIso, setRescheduleSlotIso] = useState<string | null>(null);
   const [reschedulingAppt, setReschedulingAppt] = useState(false);
   const [favoriteToRemove, setFavoriteToRemove] = useState<{ id: string; title?: string } | null>(null);
   const [locationToRemoveIdx, setLocationToRemoveIdx] = useState<number | null>(null);
   /** Seeds the map/address editor once per loaded profile — do not re-run when the user clears the form to add another address. */
   const lastSeededLocationFormForProfileId = useRef<string | null>(null);

   const upgradeFormik = useFormik({
      initialValues: {
         type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'BUSINESS',
         farmName: '',
         description: '',
         productionTypes: [] as string[],
         taxIdentificationNumber: '',
      },
      validate: (values) => {
         const schema = z.object({
            type: z.enum(['INDIVIDUAL', 'BUSINESS']),
            farmName: z.string(),
            description: z.string().trim().min(10, t('validation.descriptionMin')),
            productionTypes: z.array(z.string()),
            taxIdentificationNumber: z.string(),
         }).superRefine((v, ctx) => {
            if (v.type === 'BUSINESS' && !v.farmName.trim()) {
               ctx.addIssue({ code: 'custom', path: ['farmName'], message: t('validation.farmNameRequired') });
            }
            if (!v.taxIdentificationNumber.trim()) {
               ctx.addIssue({ code: 'custom', path: ['taxIdentificationNumber'], message: t('validation.taxIdRequired') });
            }
         });
         const parsed = schema.safeParse(values);
         if (parsed.success) return {};
         const errs: Record<string, string> = {};
         for (const issue of parsed.error.issues) {
            const key = String(issue.path[0] ?? '');
            if (key && !errs[key]) errs[key] = issue.message;
         }
         return errs;
      },
      onSubmit: async (values) => {
         if (!user || !currentClient?.id) return;
         const ok = await upgradeClientToProducer(currentClient.id, {
            type: values.type,
            name: values.type === 'BUSINESS' ? values.farmName : undefined,
            description: values.description,
            productionTypes: values.productionTypes,
            taxIdentificationNumber: values.taxIdentificationNumber || undefined,
            certifications: [],
         } as any);
         if (!ok) {
            showAppToast(t('client.upgradeFailed'), 'ERROR');
            return;
         }
         setShowUpgradeModal(false);
         navigate('/producer/dashboard?welcome=pending');
      },
   });

   const reviewFormik = useFormik({
      initialValues: { comment: '', rating: 5 },
      validate: (values) => {
         const parsed = z.object({
            comment: z.string().trim().min(2, t('validation.commentMin')),
            rating: z.number().min(1).max(5),
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
         if (user && reviewOrderId && reviewTargetId) {
            submitReview({ orderId: reviewOrderId, reviewerId: user.id, targetId: reviewTargetId, rating: values.rating, comment: values.comment });
            setShowReviewModal(false);
         }
      },
   });

   const disputeFormik = useFormik({
      initialValues: { disputeReason: '' },
      validate: (values) => {
         const parsed = z.object({ disputeReason: z.string().trim().min(5, t('validation.disputeReasonMin')) }).safeParse(values);
         if (parsed.success) return {};
         return { disputeReason: parsed.error.issues[0]?.message || t('validation.disputeReasonMin') };
      },
      onSubmit: (values, { setFieldError }) => {
         if (disputeOrderId) {
            if (disputeFiles.length === 0) {
               setFieldError('disputeReason', t('order.disputeFileRequired'));
               return;
            }
            reportProblem(disputeOrderId, values.disputeReason, disputeFiles);
            setShowDisputeModal(false);
         }
      },
   });

   const currentClient = useMemo(() => {
      if (!user?.id) return undefined;
      return clients.find((c) => clientProfileMatchesSession(c, user));
   }, [clients, user]);
   const wallet = user ? getWallet(user.id) : null;

   const referralCodeDisplay = useMemo(
      () => (myReferrals?.referralCode || (currentClient as any)?.referralCode || '').toString().trim(),
      [myReferrals?.referralCode, currentClient]
   );
   const referralCount = myReferrals?.totalReferred ?? currentClient?.referrals?.length ?? 0;
   const referredPeople = myReferrals?.referredUsers ?? [];

   useEffect(() => {
      if (activeTab === 'referrals') void refreshMyReferrals();
   }, [activeTab, refreshMyReferrals]);
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
         showAppToast(t('client.locationError'), 'WARNING');
      } finally {
         setGeoLoading(false);
      }
   };

   const copyReferralLink = () => {
      if (!referralCodeDisplay) return;
      const link = buildClientReferralLink(referralCodeDisplay);
      void navigator.clipboard.writeText(link);
      showAppToast(t('client.referralLinkCopied'), 'SUCCESS');
   };

   const myReviews = user ? reviews.filter(r => r.targetId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
   const myAverageRating = user ? getAverageRating(user.id) : 0;

   useEffect(() => {
      const rowId = (currentClient as any)?.id;
      if (!currentClient || !rowId) {
         return;
      }
      setFormData(prev => {
         if (prev?.id === rowId) return prev;
         const clientUser = (currentClient as any).user;
         const sessionEmail = (user as any)?.email ?? '';
         const sessionPhone = (user as any)?.phone ?? '';
         return {
            ...currentClient,
            id: String(rowId),
            firstName: (currentClient.firstName ?? '').toString(),
            lastName: (currentClient.lastName ?? '').toString(),
            email: (clientUser?.email ?? (currentClient as any).email ?? sessionEmail).toString(),
            phone: (clientUser?.phone ?? (currentClient as any).phone ?? sessionPhone).toString(),
            name: (clientUser?.displayName ?? (currentClient as any).name ?? (`${currentClient.firstName ?? ''} ${currentClient.lastName ?? ''}`.trim() || '')).toString(),
            gender: ((currentClient as any).gender === 'MALE' || (currentClient as any).gender === 'FEMALE' ? (currentClient as any).gender : undefined),
            dateOfBirth: normalizeDob((currentClient as any).dateOfBirth),
            locations: normalizeClientLocations(currentClient.locations),
            favorites: Array.isArray(currentClient.favorites) ? currentClient.favorites : [],
            profileImageUrl: (clientUser?.profileImageUrl ?? (currentClient as any).profileImageUrl ?? '').toString() || undefined,
            referralCode: ((currentClient as any).referralCode ?? (clientUser as any)?.referralCode ?? '').toString(),
            referrals: Array.isArray((currentClient as any).referrals) ? (currentClient as any).referrals : [],
            searchHistory: Array.isArray((currentClient as any).searchHistory) ? (currentClient as any).searchHistory : [],
         } as ClientProfileType;
      });
   }, [currentClient, user]);

   useEffect(() => {
      if (!user || user.role !== UserRole.CLIENT) return;
      let cancelled = false;
      const hydrateMyClientProfile = async () => {
         setProfileHydrating(true);
         try {
            const meClient = await apiFetch<any>(API_ENDPOINTS.profiles.meClient, { silent401: true } as any).catch(() =>
               apiFetch<any>(API_ENDPOINTS.clients.me, { silent401: true } as any).catch(() => null),
            );
            if (cancelled || !meClient?.id) return;
            const clientUser = (meClient as any).user;
            const normalized: ClientProfileType = {
               ...meClient,
               id: String(meClient.id),
               firstName: (meClient.firstName ?? '').toString(),
               lastName: (meClient.lastName ?? '').toString(),
               email: (clientUser?.email ?? meClient.email ?? (user as any)?.email ?? '').toString(),
               phone: (clientUser?.phone ?? meClient.phone ?? (user as any)?.phone ?? '').toString(),
               name: (clientUser?.displayName ?? meClient.name ?? (`${meClient.firstName ?? ''} ${meClient.lastName ?? ''}`.trim() || '')).toString(),
               gender: ((meClient as any).gender === 'MALE' || (meClient as any).gender === 'FEMALE' ? (meClient as any).gender : undefined),
               dateOfBirth: normalizeDob((meClient as any).dateOfBirth),
               locations: normalizeClientLocations(meClient.locations),
               favorites: Array.isArray(meClient.favorites) ? meClient.favorites : [],
               profileImageUrl: (clientUser?.profileImageUrl ?? meClient.profileImageUrl ?? '').toString() || undefined,
               referralCode: ((meClient as any).referralCode ?? (clientUser as any)?.referralCode ?? '').toString(),
               referrals: Array.isArray((meClient as any).referrals) ? (meClient as any).referrals : [],
               searchHistory: Array.isArray((meClient as any).searchHistory) ? (meClient as any).searchHistory : [],
            } as ClientProfileType;
            setFormData((prev) => (prev?.id === normalized.id ? prev : normalized));
         } finally {
            if (!cancelled) setProfileHydrating(false);
         }
      };
      void hydrateMyClientProfile();
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

   if (!user) {
      return (
         <div className="max-w-7xl mx-auto py-8 px-4">
            <SEO title="Client Profile" noindex={true} />
            <p className="p-8 text-center text-gray-600">{t('client.loginRequired')}</p>
         </div>
      );
   }

   if (user.role !== UserRole.CLIENT) {
      return (
         <div className="max-w-7xl mx-auto py-8 px-4">
            <SEO title="Client Profile" noindex={true} />
            <p className="p-8 text-center">{t('client.accessDenied')}</p>
         </div>
      );
   }

   /**
    * Note: we intentionally do NOT block the whole page with a full-screen
    * loader while the client profile or catalog is still being fetched.
    * The page shell (sidebar + active tab) is rendered immediately and each
    * tab is responsible for showing its own scoped loader / skeleton until
    * the data it needs becomes available. This keeps loaders contextual and
    * avoids the jarring "loading the whole app" experience on refresh.
    */
   const isClientProfileHydrating =
      !currentClient?.id &&
      user.role === UserRole.CLIENT &&
      (tabLoading || profileHydrating || Boolean(user.clientId));

   if (isClientProfileHydrating) {
      return (
         <>
            <SEO title="Client Profile" noindex={true} />
            <ClientProfileSkeleton />
         </>
      );
   }

   if (!currentClient?.id && user.role === UserRole.CLIENT) {
      return (
         <div className="max-w-7xl mx-auto py-8 px-4">
            <SEO title="Client Profile" noindex={true} />
            <div className="p-8 text-center max-w-lg mx-auto space-y-4">
               <p className="text-gray-700">{t('client NoProfileFound')}</p>
               <Link to="/register/client" className="text-primary-600 font-medium hover:underline">{t('client.completeRegistration')}</Link>
            </div>
         </div>
      );
   }

   const allMyOrders = orders.filter(o => o.clientId === currentClient?.id || o.clientId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
   const activeOrders = allMyOrders.filter(o => isActiveOrderStatus(o.status));
   const pastOrders = allMyOrders.filter(o => [OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status));

   // Order lifecycle steps for timeline (booking → receiving)
   const ORDER_TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
      { status: OrderStatus.PENDING_VALIDATION, label: t('orderTimeline.booked') },
      { status: OrderStatus.CONFIRMED_AWAITING_PAYMENT, label: t('orderTimeline.confirmed') },
      { status: OrderStatus.PAID_IN_PREPARATION, label: t('orderTimeline.paid') },
      { status: OrderStatus.IN_TRANSIT, label: t('orderTimeline.inTransit') },
      { status: OrderStatus.DELIVERED, label: t('orderTimeline.delivered') },
      { status: OrderStatus.COMPLETED, label: t('orderTimeline.completed') },
   ];
   const TERMINAL_STATUSES = [OrderStatus.CANCELLED, OrderStatus.DISPUTE];
   const getOrderTimelineStepIndex = (status: OrderStatus) => {
      if (TERMINAL_STATUSES.includes(status)) return -1;
      const i = ORDER_TIMELINE_STEPS.findIndex(s => s.status === status);
      return i >= 0 ? i : 0;
   };

   const favoriteOffers = currentClient?.favorites.map(id => offers.find(o => o.id === id)).filter(Boolean) as any[];
   const unavailableFavoriteIds = currentClient?.favorites.filter(id => !offers.find(o => o.id === id));

   const initiatePayment = (orderId: string) => { setPaymentOrderId(orderId); setShowPaymentRecap(true); };
   const confirmPayment = async () => {
      if (!paymentOrderId || paymentProcessing) return;
      setPaymentProcessing(true);
      try {
         const result = await payForOrder(paymentOrderId);
         if (!result.success && result.error === 'INSUFFICIENT_FUNDS') {
            showAppToast(t('order.insufficient'), 'ERROR');
         }
         setShowPaymentRecap(false);
         setPaymentOrderId(null);
      } finally {
         setPaymentProcessing(false);
      }
   };
   const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { if (!formData) return; const { name, value } = e.target; setFormData({ ...formData, [name]: value ?? '' }); };
  const persistLocations = (nextLocations: Location[]) => {
     if (!formData) return;
     const nextProfile = {
        ...formData,
        locations: nextLocations,
        name: `${formData.firstName} ${formData.lastName}`,
     };
     setFormData(nextProfile);
     updateClientMutation.mutate(nextProfile);
  };
   const startNewLocationEntry = () => {
      setEditingLocationIndex(null);
      setNewLoc({ region: '', city: '', address: '', lat: 0, lng: 0 });
      setLocationSearch('');
      setShowLocationSuggestions(false);
   };
   /** Exit "edit existing" mode so the next save appends, without clearing the form. */
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
      persistLocations(nextLocations);
      setNewLoc({ region: '', city: '', address: '', lat: 0, lng: 0 });
      setLocationSearch('');
      setEditingLocationIndex(null);
   };
   const removeLocation = (index: number) => {
      if (!formData) return;
      const nextLocations = formData.locations.filter((_, i) => i !== index);
      persistLocations(nextLocations);
      if (editingLocationIndex === index) {
         setEditingLocationIndex(null);
         setNewLoc({ region: '', city: '', address: '', lat: 0, lng: 0 });
         setLocationSearch('');
      } else if (editingLocationIndex != null && editingLocationIndex > index) {
         setEditingLocationIndex(editingLocationIndex - 1);
      }
   };
   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!formData || !file) return;
      const maxBytes = 2 * 1024 * 1024;
      if (file.size > maxBytes) {
         showAppToast(t('client.imageSizeError'), 'WARNING');
         return;
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
         showAppToast(t('client.imageTypeError'), 'WARNING');
         return;
      }
      setAvatarUploading(true);
      try {
         const url = await uploadAvatar(file);
         setFormData({ ...formData, profileImageUrl: url });
      } catch (err: unknown) {
         showAppToast(err instanceof Error ? err.message : t('client.uploadFailed'), 'ERROR');
      } finally {
         setAvatarUploading(false);
      }
   };
   const savePersonalInfo = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData) return;
      updateClientMutation.mutate({ ...formData, name: `${formData.firstName} ${formData.lastName}` });
   };
  const toggleUpgradeCategory = (cat: string) => {
   const current = upgradeFormik.values.productionTypes;
   if (current.includes(cat)) {
      void upgradeFormik.setFieldValue('productionTypes', current.filter(c => c !== cat));
   } else {
      void upgradeFormik.setFieldValue('productionTypes', [...current, cat]);
   }
 };
   const performLogout = async () => {
      await logout();
      setLogoutConfirmOpen(false);
      navigate('/');
   };
  const openReviewModal = (orderId: string, producerId: string) => { setReviewOrderId(orderId); setReviewTargetId(producerId); reviewFormik.setValues({ rating: 5, comment: '' }); setShowReviewModal(true); };
   const getProducerName = (producerId: string) => { const p = producers.find(prod => prod.id === producerId); return p ? (p.name || (p as any).user?.displayName || `${(p.firstName ?? '').trim()} ${(p.lastName ?? '').trim()}`.trim()) : t('market.unknownProducer'); };
   /** Prefer snapshot fields from GET /reviews/user/:id; fallback to catalog by reviewer user id. */
   const getReviewAuthorDisplay = (review: Review) => {
      const displayFromRow = (row: any) => {
         const name = (row?.name || row?.user?.displayName || `${(row?.firstName ?? '').trim()} ${(row?.lastName ?? '').trim()}`.trim()).trim();
         const avatar = (row?.profileImageUrl || row?.user?.profileImageUrl || '').trim() || undefined;
         return { name: name || t('review.reviewerFallback'), avatarUrl: avatar };
      };
      const fromCatalog = (reviewerUserId: string) => {
         const prod = producers.find((p) => p.userId === reviewerUserId);
         if (prod) return displayFromRow(prod);
         const cli = clients.find((c) => c.userId === reviewerUserId);
         if (cli) return displayFromRow(cli);
         return { name: t('review.reviewerFallback'), avatarUrl: undefined as string | undefined };
      };
      const apiName = (review.reviewerDisplayName ?? '').trim();
      const apiAvatar =
         typeof review.reviewerProfileImageUrl === 'string' && review.reviewerProfileImageUrl.trim()
            ? review.reviewerProfileImageUrl.trim()
            : undefined;
      const catalog = fromCatalog(review.reviewerId);
      return {
         name: apiName || catalog.name,
         avatarUrl: apiAvatar ?? catalog.avatarUrl,
      };
   };
   const getProducerDisplayName = (order: Order) => order.producerDisplayName || getProducerName(order.producerId);
   const getProducerContact = (producerId: string) => {
      const p = producers.find((prod) => prod.id === producerId) as any;
      return {
         phone: p?.phone || p?.user?.phone || null,
         email: p?.email || p?.user?.email || null,
      };
   };
   const getOrderItemImage = (item: any) => {
      if (item?.imageUrl) return item.imageUrl as string;
      const offerId = item?.offerId || item?.id;
      if (!offerId) return '';
      const offerMatch = offers.find((o) => o.id === offerId);
      return offerMatch?.imageUrl || '';
   };
   const clientOrderMetaLine = (order: Order) => {
      const date = new Date(order.createdAt).toLocaleDateString();
      if (orderIsServiceOnly(order)) {
         const lc = serviceLineCount(order);
         const st = serviceSlotTotal(order);
         return `${date} · ${lc} ${lc === 1 ? t('service.lineSingular') : t('service.linePlural')} · ${st} ${st === 1 ? t('service.slotSingular') : t('service.slotPlural')}`;
      }
      if (orderHasService(order)) {
         return `${date} · ${order.items?.length ?? 0} ${t('dash.itemsProduct')} · ${t('dash.mixedOrderHint')}`;
      }
      return `${date} · ${order.items?.length ?? 0} ${t('dash.itemsProduct')}`;
   };
  const openDisputeModal = (orderId: string) => { setDisputeOrderId(orderId); disputeFormik.setFieldValue('disputeReason', ''); setDisputeFiles([]); setShowDisputeModal(true); };
   /** Cap at 3 — the API's FilesInterceptor("files", 3) rejects the whole submission
    * beyond that, so an uncapped picker silently failed the entire dispute report. */
   const handleDisputeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { setDisputeFiles(Array.from(e.target.files).slice(0, 3)); } };
   /** Service appointments can be rescheduled until the order goes in transit. */
   const canRescheduleAppointment = (order: Order) =>
      orderHasService(order)
      && [OrderStatus.PENDING_VALIDATION, OrderStatus.CONFIRMED_AWAITING_PAYMENT, OrderStatus.PAID_IN_PREPARATION].includes(order.status);
   const firstServiceBookingIso = (order: Order): string | null => {
      const svc = (order.items || []).find((it: any) => String(it.type ?? '').toUpperCase() === 'SERVICE' && it.bookingDate);
      const raw = (svc as any)?.bookingDate || order.requestedDeliveryDate;
      if (!raw) return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
   };
   const openRescheduleModal = (order: Order) => {
      setRescheduleOrderId(order.id);
      setRescheduleSlotIso(firstServiceBookingIso(order));
   };
   const rescheduleOrder = rescheduleOrderId ? orders.find((o) => o.id === rescheduleOrderId) ?? null : null;
   const rescheduleServiceItem = rescheduleOrder
      ? (rescheduleOrder.items || []).find((it: any) => String(it.type ?? '').toUpperCase() === 'SERVICE')
      : null;
   const rescheduleDurationHours = Math.max(
      1,
      Number((rescheduleServiceItem as any)?.serviceDuration ?? 1) || 1,
   );
   const openCancelRequestModal = (orderId: string) => { setCancelRequestOrderId(orderId); setCancelRequestReason(''); };
   const getStatusBadge = (status: OrderStatus) => (
      <span
         className={`agm-order-status-pill ${ORDER_STATUS_PILL_CLASS[status] || 'bg-gray-100 text-gray-800 ring-1 ring-gray-200/80'}`}
         title={t(ORDER_STATUS_LABEL_KEY[status] || 'order.status')}
      >
         {t(ORDER_STATUS_LABEL_KEY[status] || 'order.status')}
      </span>
   );

   /** Shared order action buttons — used in list cards, all-orders panel, and detail modal. */
   const renderOrderActions = (order: Order, size: 'sm' | 'md' = 'sm', afterAction?: () => void) => {
      const btn = size === 'sm' ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2';
      const btnBold = size === 'sm' ? 'text-xs px-4 py-1.5' : 'text-sm px-4 py-2';
      const iconSm = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
      const wrap = (fn: () => void) => () => { fn(); afterAction?.(); };

      return (
         <>
            {PAYMENTS_ENABLED && order.status === OrderStatus.CONFIRMED_AWAITING_PAYMENT && (
               <button onClick={wrap(() => initiatePayment(order.id))} className={`bg-primary-600 text-white ${btnBold} rounded-md font-bold hover:bg-primary-700 shadow-sm flex items-center gap-1`}><CreditCard className={iconSm} /> {t('order.payNow')}</button>
            )}
            {canRescheduleAppointment(order) && (
               <button onClick={wrap(() => openRescheduleModal(order))} className={`text-purple-700 hover:bg-purple-50 ${btn} rounded-md font-medium border border-purple-200 flex items-center gap-1`}><Calendar className={iconSm} /> {t('order.reschedule')}</button>
            )}
            {order.status === OrderStatus.IN_TRANSIT && (
               order.clientConfirmedReceipt ? (
                  <span className={`text-emerald-700 bg-emerald-50 ${btn} rounded-md font-medium border border-emerald-100 flex items-center gap-1`}><CheckCircle className={iconSm} /> {t('order.awaitingSellerDelivery')}</span>
               ) : (
                  <button onClick={wrap(() => setConfirmReceiptOrderId(order.id))} className={`bg-emerald-600 text-white ${btnBold} rounded-md font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-1`}><CheckCircle className={iconSm} /> {t('order.confirmReceipt')}</button>
               )
            )}
            {order.status === OrderStatus.DELIVERED && (
               <button onClick={wrap(() => setCompleteOrderId(order.id))} className={`bg-green-600 text-white ${btnBold} rounded-md font-bold hover:bg-green-700 shadow-sm flex items-center gap-1`}><CheckCircle className={iconSm} /> {t('order.completeOrder')}</button>
            )}
            {canCancelDirectly(order) && (
               <button onClick={wrap(() => setCancelOrderId(order.id))} className={`text-red-600 hover:bg-red-50 ${btn} rounded-md font-medium border border-red-100`}>{t('order.cancel')}</button>
            )}
            {canRequestCancellation(order) && (
               order.cancellationRequested ? (
                  <span className={`text-gray-500 bg-gray-50 ${btn} rounded-md font-medium border border-gray-200`}>{t('order.cancellationPending')}</span>
               ) : (
                  <button onClick={wrap(() => openCancelRequestModal(order.id))} className={`text-red-600 hover:bg-red-50 ${btn} rounded-md font-medium border border-red-100`}>{t('order.requestCancellation')}</button>
               )
            )}
            {canReportProblem(order) && (
               <button onClick={wrap(() => openDisputeModal(order.id))} className={`text-orange-600 hover:bg-orange-50 ${btn} rounded-md font-medium border border-orange-100 flex items-center gap-1`}><AlertTriangle className={iconSm} /> {t('order.reportProblem')}</button>
            )}
            {canLeaveReview(order) && (
               <button onClick={wrap(() => openReviewModal(order.id, order.producerId))} className={`bg-yellow-100 text-yellow-800 ${btnBold} rounded-md font-bold hover:bg-yellow-200 border border-yellow-200 flex items-center gap-1`}><Star className={`${iconSm} fill-current`} /> {t('review.rate')}</button>
            )}
         </>
      );
   };

   const renderOrderList = (orderList: any[], emptyMsg: string) => {
      if (orderList.length === 0) {
         return <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100"><Package className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{emptyMsg}</p></div>;
      }
      return (
         <div className="space-y-4 agm-dash-scroll-cards scrollbar-thin pr-0.5">
            {orderList.map((order) => (
               <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:border-primary-200 transition-colors">
                  <div className="p-4 sm:p-6" onClick={() => setSelectedOrder(order)}>
                     <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                        <div className="cursor-pointer flex-1 min-w-0">
                           <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">
                                 {orderIsServiceOnly(order) ? t('service.booking') : t('order.label')}{' '}
                                 #{order.id.substring(order.id.length - 6).toUpperCase()}
                              </span>
                              {orderIsServiceOnly(order) && (
                                 <span className="text-[10px] sm:text-xs font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full shrink-0">{t('service.badge')}</span>
                              )}
                           </h4>
                           <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{clientOrderMetaLine(order)}</p>
                           {order.deliveryMethod === 'HOME' && order.shippingAddress && typeof order.shippingAddress === 'object' && (
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                 <MapPin className="h-3 w-3 shrink-0" />
                                 {[(order.shippingAddress as any).address, (order.shippingAddress as any).city, (order.shippingAddress as any).region].filter(Boolean).join(', ')}
                              </p>
                           )}
                           {order.deliveryMethod === 'PICKUP' && (
                              <p className="text-xs text-gray-500 mt-0.5">📦 {t('order.pickupDelivery')}</p>
                           )}
                        </div>
                        <div className="shrink-0">{getStatusBadge(order.status)}</div>
                     </div>
                     <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
                        <div className="flex -space-x-2 overflow-hidden flex-shrink-0">
                           {(order.items || []).slice(0, 3).map((item: any, idx: number) => (
                              <div key={idx} className="inline-block h-10 w-10 overflow-hidden rounded-md ring-2 ring-white bg-gray-100" title={item.title}>
                                 {getOrderItemImage(item) ? (
                                    <img src={getOrderItemImage(item)} alt="" className={offerImageInBox} />
                                 ) : (
                                    <div className="h-full w-full bg-gray-200" />
                                 )}
                              </div>
                           ))}
                           {(order.items?.length ?? 0) > 3 && (
                              <div className="flex items-center justify-center h-10 w-10 rounded-md ring-2 ring-white bg-gray-100 text-xs font-bold text-gray-500">+{(order.items?.length ?? 0) - 3}</div>
                           )}
                        </div>
                        <div className="w-full sm:w-auto sm:text-right" onClick={e => e.stopPropagation()}>
                           <p className="text-sm font-bold text-gray-900 mb-2">{formatXaf(Number(order.totalAmount ?? 0))}</p>
                           <div className="flex gap-2 flex-wrap sm:justify-end">
                              {renderOrderActions(order)}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      );
   };

   return (
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
         <SEO title="Client Profile" noindex={true} />
         <div className="mb-4 sm:mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-primary-600 transition-colors font-medium text-sm sm:text-base">
               <ArrowLeft className="h-5 w-5 mr-2" /> {t('profile.tabs.back')}
            </button>
         </div>

         <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
            <aside className="lg:col-span-3 mb-4 lg:mb-0">
               <nav className="agm-profile-nav">
                  <button onClick={() => setActiveTab('info')} className={`${activeTab === 'info' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
                     <User className={`${activeTab === 'info' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">{t('profile.tabs.info')}</span>
                  </button>
                  <button onClick={() => setActiveTab('orders')} className={`${activeTab === 'orders' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
                     <Package className={`${activeTab === 'orders' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">{t('profile.tabs.orders')}</span>
                  </button>
                  <button onClick={() => setActiveTab('favorites')} className={`${activeTab === 'favorites' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
                     <Heart className={`${activeTab === 'favorites' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">{t('profile.tabs.favorites')}</span>
                  </button>
                  <button onClick={() => setActiveTab('payment')} className={`${activeTab === 'payment' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
                     <CreditCard className={`${activeTab === 'payment' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">{t('profile.tabs.payment2')}</span>
                  </button>
                  <button onClick={() => setActiveTab('reputation')} className={`${activeTab === 'reputation' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
                     <ThumbsUp className={`${activeTab === 'reputation' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">{t('profile.tabs.reputation')}</span>
                  </button>
                  <button onClick={() => setActiveTab('referrals')} className={`${activeTab === 'referrals' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
                     <Users className={`${activeTab === 'referrals' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">{t('profile.tabs.referrals')}</span>
                  </button>
                  <Link to="/wallet" className="bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50 group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors">
                     <Wallet className="text-gray-400 group-hover:text-gray-500 flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6" /> <span className="truncate">{t('nav.wallet')}</span>
                  </Link>
                  <button onClick={() => setActiveTab('security')} className={`${activeTab === 'security' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 lg:ring-0 hover:text-primary-700 hover:bg-white' : 'bg-gray-50 lg:bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100 lg:hover:bg-gray-50'} group rounded-full lg:rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors`}>
                     <Shield className={`${activeTab === 'security' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 mr-2 lg:-ml-1 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6`} /> <span className="truncate">{t('profile.tabs.security')}</span>
                  </button>
                  <button type="button" onClick={() => setLogoutConfirmOpen(true)} className="hidden lg:flex text-red-600 hover:bg-red-50 group rounded-md px-3 py-2 items-center text-sm font-medium w-full transition-colors mt-4 pt-4 border-t border-gray-200">
                     <LogOut className="flex-shrink-0 -ml-1 mr-3 h-6 w-6" /> <span className="truncate">{t('nav.logout')}</span>
                  </button>
               </nav>
               {user.role === UserRole.CLIENT && (
                  <div className="mt-4 lg:mt-6 hidden lg:block">
                     <button onClick={() => setShowUpgradeModal(true)} className="bg-primary-600 text-white group rounded-md px-3 py-3 flex items-center text-sm font-bold w-full hover:bg-primary-700 shadow-md transition-all">
                        <Tractor className="flex-shrink-0 -ml-1 mr-3 h-6 w-6" /> {t('profile.upgrade')}
                     </button>
                     <p className="text-xs text-gray-500 mt-2 px-1">{t('profile.upgradeDesc')}</p>
                  </div>
               )}
            </aside>

            <div className="space-y-6 lg:col-span-9 min-w-0">
               {user.role === UserRole.CLIENT && (
                  <button onClick={() => setShowUpgradeModal(true)} className="lg:hidden bg-primary-600 text-white group rounded-md px-3 py-3 flex items-center justify-center text-sm font-bold w-full hover:bg-primary-700 shadow-md transition-all">
                     <Tractor className="flex-shrink-0 mr-2 h-5 w-5" /> {t('profile.upgrade')}
                  </button>
               )}
               {activeTab === 'payment' && (
                  <div className="shadow sm:rounded-md bg-white p-4 sm:p-6 space-y-4">
                     <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-primary-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">{t('profile.tabs.payment_reload')}</h3>
                     </div>
                     <CurrencyPreferenceCard />
                     <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">{t('order.walletBalance')}</p>
                        <p className="text-2xl font-extrabold text-gray-900">{(wallet?.balance ?? 0).toLocaleString()} XAF</p>
                     </div>
                     <p className="text-sm text-gray-600 leading-relaxed">
                        {t('profile.tabs.walletDescription')}
                     </p>
                     {PAYMENTS_ENABLED ? (
                        <Link to="/wallet" className="inline-flex items-center justify-center bg-primary-600 text-white px-5 py-2.5 rounded-md font-bold hover:bg-primary-700 shadow-sm">
                           <Plus className="h-5 w-5 mr-1" /> {t('profile.tabs.walleReload')}
                        </Link>
                     ) : (
                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md p-3">
                           Reloading is temporarily unavailable. Please check back soon.
                        </p>
                     )}
                  </div>
               )}
               {activeTab === 'info' && !formData && (
                  <div className="shadow sm:rounded-md bg-white p-4 sm:p-6">
                     <SectionLoader message={t('form.loading')} />
                  </div>
               )}
               {activeTab === 'info' && formData && (
                  <form onSubmit={savePersonalInfo} className="shadow sm:rounded-md sm:overflow-hidden bg-white p-4 sm:p-6">
                     <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.tabs.info')}</h3>
                     <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                        <div className="relative flex-shrink-0">
                           <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                              {formData.profileImageUrl ? (
                                 <img src={formData.profileImageUrl} alt={t('form.profileAlt')} className="h-full w-full object-cover" />
                              ) : (
                                 <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                              )}
                           </div>
                           <label className={`absolute bottom-0 right-0 bg-primary-600 p-1.5 rounded-full text-white shadow-sm ${avatarUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-primary-700'}`}>
                              <Camera className="h-4 w-4" />
                              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={avatarUploading} onChange={handleFileUpload} />
                           </label>
                        </div>
                        <div className="min-w-0">
                           <p className="text-sm font-medium text-gray-700">{t('profile.uploadPhoto')}</p>
                           <p className="text-xs text-gray-500">{avatarUploading ? t('profile.uploading') : t('profile.uploadHint')}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                           <label className="block text-sm font-medium text-gray-700">{t('profile.firstName')}</label>
                           <input type="text" name="firstName" value={formData.firstName ?? ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" />
                        </div>
                        <div className="sm:col-span-3">
                           <label className="block text-sm font-medium text-gray-700">{t('profile.lastName')}</label>
                           <input type="text" name="lastName" value={formData.lastName ?? ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" />
                        </div>
                        <div className="sm:col-span-3">
                           <label className="block text-sm font-medium text-gray-700">{t('profile.gender')}</label>
                           <select name="gender" value={formData.gender || ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900">
                              <option value="">{t('profile.selectGender')}</option>
                              <option value="MALE">{t('profile.male')}</option>
                              <option value="FEMALE">{t('profile.female')}</option>
                           </select>
                        </div>
                        <div className="sm:col-span-3">
                           <label className="block text-sm font-medium text-gray-700">{t('profile.dob')}</label>
                           <input type="date" name="dateOfBirth" value={typeof formData.dateOfBirth === 'string' && formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" />
                        </div>
                        <div className="sm:col-span-3">
                           <label className="block text-sm font-medium text-gray-700">{t('form.email')}</label>
                           <input type="email" name="email" value={formData.email ?? ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" />
                        </div>
                        <div className="sm:col-span-3">
                           <label className="block text-sm font-medium text-gray-700">{t('form.phone')}</label>
                           <input type="tel" name="phone" value={formData.phone ?? ''} onChange={handleInfoChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 bg-white text-gray-900" />
                        </div>
                        <div className="sm:col-span-6 border-t border-gray-100 pt-4 mt-2">
                           <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center"><MapPin className="h-4 w-4 mr-1 text-primary-600" /> {t('profile.myLocations')}</h4>
                           <div className="space-y-2 mb-4">
                              {(formData.locations || []).map((loc, idx) => (
                                 <div
                                    key={idx}
                                    className={`flex items-center justify-between bg-gray-50 p-3 rounded-md border cursor-pointer ${editingLocationIndex === idx ? 'border-primary-400 ring-1 ring-primary-300' : 'border-gray-200'}`}
                                    onClick={() => {
                                       setEditingLocationIndex(idx);
                                       setNewLoc({ ...loc });
                                       setLocationSearch(loc.address ?? '');
                                    }}
                                 >
                                    <div className="min-w-0 flex-1">
                                       <p className="text-sm font-medium text-gray-900 truncate" title={loc.address}>{loc.address}</p>
                                       <p className="text-xs text-gray-500">{loc.city}, {loc.region}</p>
                                    </div>
                                    <button
                                       type="button"
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          setLocationToRemoveIdx(idx);
                                       }}
                                       className="text-gray-400 hover:text-red-500"
                                       aria-label={t('location.removeTitle')}
                                    >
                                       <Trash2 className="h-4 w-4" />
                                    </button>
                                 </div>
                              ))}
                           </div>
                           <div className="bg-blue-50 p-3 rounded-md border border-blue-100 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                 <p className="text-xs font-medium text-blue-700">{t('profile.addOrUpdateAddress')}</p>
                                 {(formData.locations?.length ?? 0) > 0 && (
                                    <button
                                       type="button"
                                       onClick={startNewLocationEntry}
                                       className="text-xs font-semibold text-primary-700 hover:text-primary-900 underline"
                                    >
                                       {editingLocationIndex != null ? t('profile.newAddressKeep') : t('profile.addAnotherAddress')}
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
                                    {geoLoading ? t('location.gettingLocation') : t('location.useMyLocation')}
                                 </button>
                              </div>
                              <LocationMapPicker
                                 latitude={Number(newLoc.lat) || 0}
                                 longitude={Number(newLoc.lng) || 0}
                                 onPositionChange={handleProfileMapPositionChange}
                                 height="min(240px, 45vh)"
                              />
                              <p className="text-xs text-gray-500">
                                 {editingLocationIndex != null
                                    ? t('profile.updateLocation')
                                    : t('profile.mapPinHint')}
                              </p>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                 <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('location.searchAddress')}</label>
                                    <input
                                       type="text"
                                       placeholder={t('location.searchPlaceholder')}
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
                                             <p className="text-sm text-gray-900 truncate" title={item.address}>{item.address}</p>
                                             <p className="text-xs text-gray-500">{[item.city, item.region].filter(Boolean).join(', ')}</p>
                                          </button>
                                       ))}
                                    </div>
                                 )}
                                 {isNearbyLoading && (
                                    <p className="sm:col-span-2 text-xs text-gray-500">{t('location.findingNearby')}</p>
                                 )}
                                 <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('location.city')}</label>
                                    <input
                                       type="text"
                                       value={newLoc.city ?? ''}
                                       onChange={e => setNewLoc((prev) => ({ ...prev, city: e.target.value }))}
                                       className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900"
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('location.region')}</label>
                                    <input
                                       type="text"
                                       value={newLoc.region ?? ''}
                                       onChange={e => setNewLoc((prev) => ({ ...prev, region: e.target.value }))}
                                       className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900"
                                    />
                                 </div>
                                 <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('location.fullAddress')}</label>
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
                        <div className="sm:col-span-6 pt-4 flex justify-end">
                           <button
                              type="submit"
                              disabled={updateClientMutation.isPending}
                              className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-md text-sm font-medium shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
                           >
                              {updateClientMutation.isPending ? (
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

               {activeTab === 'orders' && (
                  <div className="space-y-8">
                     {/* All orders — view any order from booking to receiving, including completed/cancelled */}
                     <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="px-4 py-4 sm:py-5 border-b border-gray-200 bg-gray-50">
                           <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center"><Package className="w-5 h-5 mr-2 text-gray-500" /> {t('dash.allOrders')}</h3>
                           <p className="text-xs sm:text-sm text-gray-500 mt-1">{t('dash.allOrdersDesc')}</p>
                        </div>
                        <ul className="divide-y divide-gray-200 agm-dash-scroll-4 agm-dash-all-orders scrollbar-thin">
                           {(tabLoading || isClientProfileHydrating) && allMyOrders.length === 0 ? (
                              <li className="px-4 py-3"><ListSkeleton rows={4} /></li>
                           ) : allMyOrders.length === 0 ? (
                              <li className="px-4 py-8 text-center text-gray-500">{t('dash.noOrders')}</li>
                           ) : (
                              allMyOrders.map(order => (
                                 <li
                                    key={order.id}
                                    className="agm-dash-all-order-item cursor-pointer"
                                    onClick={() => setSelectedOrder(order)}
                                 >
                                    <div className="agm-dash-all-order-item__head">
                                       <p className="agm-dash-all-order-item__title flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                                          <span className="truncate">
                                             {orderIsServiceOnly(order) ? t('service.booking') : 'Order'}{' '}
                                             #{order.id.substring(order.id.length - 6).toUpperCase()}
                                          </span>
                                          {orderIsServiceOnly(order) && (
                                             <span className="text-[10px] sm:text-xs font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full shrink-0">
                                                {t('service.badge')}
                                             </span>
                                          )}
                                       </p>
                                       {getStatusBadge(order.status)}
                                    </div>
                                    <p className="agm-dash-all-order-item__meta">
                                       {clientOrderMetaLine(order)} · {getProducerDisplayName(order)}
                                    </p>
                                    <div className="agm-dash-all-order-item__foot">
                                       <span className="text-sm font-bold text-gray-900 tabular-nums">
                                          {formatXaf(order.totalAmount ?? 0)}
                                       </span>
                                       <span className="text-xs font-medium text-primary-600 flex items-center gap-0.5 shrink-0">
                                          <Eye className="h-3.5 w-3.5" />
                                          <span className="sm:inline">{t('dash.viewDetails')}</span>
                                       </span>
                                    </div>
                                    <div className="px-4 pb-4 flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                                       {renderOrderActions(order)}
                                    </div>
                                 </li>
                              ))
                           )}
                        </ul>
                     </section>
                     <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Archive className="w-5 h-5 mr-2 text-primary-600" /> {t('order.active')}</h3>
                        {(tabLoading || isClientProfileHydrating) && activeOrders.length === 0 ? (
                           <ListSkeleton rows={3} />
                        ) : (
                           renderOrderList(activeOrders, "No active orders.")
                        )}
                     </section>
                     <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><History className="w-5 h-5 mr-2 text-gray-400" /> {t('order.past')}</h3>
                        {(tabLoading || isClientProfileHydrating) && pastOrders.length === 0 ? (
                           <ListSkeleton rows={2} />
                        ) : (
                           renderOrderList(pastOrders, t('dash.noPastOrders'))
                        )}
                     </section>
                  </div>
               )}

               {activeTab === 'favorites' && (
                  <div className="shadow sm:rounded-md sm:overflow-hidden bg-white p-4 sm:p-6">
                     <div className="border-b border-gray-200 pb-4 mb-4">
                        <h3 className="text-lg font-medium text-gray-900">{t('profile.tabs.favorites')}</h3>
                     </div>
                     {unavailableFavoriteIds && unavailableFavoriteIds.length > 0 && (
                        <div className="mb-6 bg-yellow-50 p-4 rounded-md border border-yellow-100">
                           <h4 className="text-sm font-bold text-yellow-800 mb-2">{t('favorites.unavailableTitle')}</h4>
                           <ul className="space-y-2">
                              {unavailableFavoriteIds.map(id => (
                                 <li key={id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-yellow-700">
                                    <span>{t('favorites.itemUnavailable', { id })}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0"><button onClick={() => setFavoriteToRemove({ id, title: `Item #${id}` })} className="text-xs text-red-600 hover:underline">{t('cart.remove')}</button><Link to="/market/producers" className="text-xs bg-yellow-200 px-2 py-1 rounded hover:bg-yellow-300 flex items-center"><Search className="w-3 h-3 mr-1" /> {t('profile.findSimilar')}</Link></div>
                                 </li>
                              ))}
                           </ul>
                        </div>
                     )}
                     {(tabLoading || isClientProfileHydrating) && (!favoriteOffers || favoriteOffers.length === 0) ? (
                        <ListSkeleton rows={4} />
                     ) : (!favoriteOffers || favoriteOffers.length === 0) ? (
                        <div className="text-center py-12 text-gray-500"><Heart className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p>{t('profile.favorites.empty')}</p></div>
                     ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                           {favoriteOffers.map((offer: any) => (
                              <div key={offer.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow flex items-center gap-3">
                                 <div className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                                    <img src={offer.imageUrl} alt="" className={offerImageInBox} />
                                 </div>
                                 <div className="flex-1 min-w-0"><h4 className="font-bold text-gray-900 truncate">{offer.title}</h4><p className="text-sm text-gray-500">{formatXaf(offer.price)} / {offer.unit}</p></div>
                                 <div className="flex flex-col gap-1 sm:gap-2 flex-shrink-0">
                                    <Link to={`/offer/${offer.id}`} className="text-primary-600 hover:bg-primary-50 p-1.5 sm:p-2 rounded-full"><ArrowLeft className="h-5 w-5 rotate-180" /></Link>
                                    <button onClick={() => setFavoriteToRemove({ id: offer.id, title: offer.title })} className="text-red-500 hover:bg-red-50 p-1.5 sm:p-2 rounded-full" aria-label={t('favorites.removeTitle')}><Trash2 className="h-5 w-5" /></button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'reputation' && (
                  <div className="shadow sm:rounded-md sm:overflow-hidden bg-white p-4 sm:p-6">
                     <div className="border-b border-gray-200 pb-4 mb-6 flex flex-wrap gap-3 items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{t('profile.tabs.reputation')}</h3>
                        <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                           <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                           <span className="text-lg font-bold text-yellow-700">{myAverageRating}</span>
                           <span className="text-xs text-yellow-600 ml-1">/ 5</span>
                        </div>
                     </div>
                     {(tabLoading || isClientProfileHydrating) && myReviews.length === 0 ? (
                        <ListSkeleton rows={3} />
                     ) : myReviews.length === 0 ? (
                        <div className="text-center py-12 text-gray-500"><Star className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p>{t('review.noReviews')}</p></div>
                     ) : (
                        <div className="space-y-4">
                           {myReviews.map(review => {
                              const author = getReviewAuthorDisplay(review);
                              const initial = (author.name || '?').charAt(0).toUpperCase();
                              return (
                              <div key={review.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                                 <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center min-w-0">
                                       {author.avatarUrl ? (
                                          <img src={author.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover mr-2 shrink-0" />
                                       ) : (
                                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-2 shrink-0">{initial}</div>
                                       )}
                                       <div className="min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{t('review.ratedBy')}: {author.name}</p><p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p></div>
                                    </div>
                                    <div className="flex shrink-0">{[...Array(5)].map((_, i) => (<Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />))}</div>
                                 </div>
                                 <p className="text-sm text-gray-700 italic">"{review.comment}"</p>
                              </div>
                              );
                           })}
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'referrals' && !currentClient && (
                  <div className="shadow sm:rounded-md bg-white p-4 sm:p-6">
                     <SectionLoader message={t('form.loading')} />
                  </div>
               )}
               {activeTab === 'referrals' && currentClient && (
                  <div className="shadow sm:rounded-md sm:overflow-hidden bg-white p-4 sm:p-6">
                     <div className="border-b border-gray-200 pb-4 mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                           <h3 className="font-display text-lg font-semibold text-gray-900">{t('referrals.yourImpact')}</h3>
                           <p className="text-sm text-gray-500 mt-0.5">{t('referrals.inviteDesc')}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-3xl font-display font-bold text-primary-700 leading-none">{referralCount}</p>
                           <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 mt-1">{t('referrals.yourImpact')}</p>
                        </div>
                     </div>
                     <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-6">
                        <p className="text-sm text-primary-900 mb-1 font-bold">{t('referrals.yourInviteCode')}</p>
                        <p className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-primary-800 mb-4">
                           {referralCodeDisplay || '—'}
                        </p>
                        <p className="text-sm text-primary-800 mb-2 font-medium">{t('referrals.yourLink')}</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                           <input type="text" readOnly value={buildClientReferralLink(referralCodeDisplay)} className="block w-full min-w-0 border-primary-200 rounded-md shadow-sm p-2.5 text-sm bg-white text-gray-700" />
                           <button type="button" onClick={copyReferralLink} className="agm-btn-primary bg-primary-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-primary-700 flex items-center justify-center flex-shrink-0">
                              {t('referrals.copy')}
                           </button>
                        </div>
                        <p className="text-xs text-primary-700 mt-3">{t('referrals.rewardsApply')}</p>
                     </div>
                     {myReferrals?.activeProgram ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                           <h4 className="text-sm font-bold text-gray-900">{myReferrals.activeProgram.name}</h4>
                           {myReferrals.activeProgram.description ? (
                              <p className="text-sm text-gray-600 mt-1">{myReferrals.activeProgram.description}</p>
                           ) : null}
                           <ul className="mt-3 text-sm text-gray-800 space-y-1 list-disc list-inside">
                              <li>{t('referrals.referrerReward')} {myReferrals.activeProgram.currency} {Number(myReferrals.activeProgram.referrerRewardAmount).toFixed(2)}</li>
                              <li>{t('referrals.newUserReward')} {myReferrals.activeProgram.currency} {Number(myReferrals.activeProgram.refereeRewardAmount).toFixed(2)}</li>
                              <li>{t('referrals.minPayout')} {myReferrals.activeProgram.currency} {Number(myReferrals.activeProgram.minimumPayoutThreshold).toFixed(2)}</li>
                           </ul>
                           {myReferrals.activeProgram.termsUrl ? (
                              <a href={myReferrals.activeProgram.termsUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm font-medium mt-3 inline-block hover:underline">
                                 {t('referrals.termsTitle')}
                              </a>
                           ) : null}
                        </div>
                     ) : null}
                     <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-4">{t('referrals.peopleInvited')}</h4>
                        {referralCount === 0 ? (
                           <div className="text-center py-10 agm-empty-wash rounded-xl border border-primary-100">
                              <Users className="h-12 w-12 mx-auto text-primary-300 mb-2" />
                              <p className="text-gray-600 font-medium">{t('referrals.noReferrals')}</p>
                              <p className="text-sm text-gray-500 mt-1">{t('referrals.inviteHint')}</p>
                           </div>
                        ) : (
                           <div className="space-y-3">
                              <p className="text-sm text-gray-600">{t('referrals.referredCount', { count: referralCount })}</p>
                              {referredPeople.length > 0 ? (
                                 <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white">
                                    {referredPeople.map((u) => (
                                       <li key={u.id} className="px-3 py-2 flex justify-between text-sm">
                                          <span className="font-medium text-gray-900">{u.displayName || t('compare.unknown')}</span>
                                          <span className="text-gray-500">{u.joinedDate ? new Date(u.joinedDate).toLocaleDateString() : ''}</span>
                                       </li>
                                    ))}
                                 </ul>
                              ) : null}
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {activeTab === 'security' && (
                  <div className="shadow sm:rounded-md sm:overflow-hidden bg-white p-4 sm:p-6">
                     <h3 className="text-lg font-medium text-gray-900">{t('profile.tabs.security')}</h3>
                     <div className="mt-4">
                        <button onClick={() => setShowPasswordModal(true)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors w-full sm:w-auto">{t('profile.password')}</button>
                     </div>
                  </div>
               )}
            </div>
         </div>

         <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />

         <Modal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="lg" zIndex={50} panelClassName="p-4 sm:p-6">
                     <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.upgrade')}</h3>
                     <form onSubmit={upgradeFormik.handleSubmit} className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.producerType')}</label>
                           <div className="flex space-x-4">
                              <label className="flex items-center"><input type="radio" name="type" value="INDIVIDUAL" checked={upgradeFormik.values.type === 'INDIVIDUAL'} onChange={upgradeFormik.handleChange} className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300" /><span className="ml-2 text-sm text-gray-700">{t('profile.individual')}</span></label>
                              <label className="flex items-center"><input type="radio" name="type" value="BUSINESS" checked={upgradeFormik.values.type === 'BUSINESS'} onChange={upgradeFormik.handleChange} className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300" /><span className="ml-2 text-sm text-gray-700">{t('profile.business')}</span></label>
                           </div>
                        </div>
                        {upgradeFormik.values.type === 'BUSINESS' && (<div><label className="block text-sm font-medium text-gray-700">{t('profile.producerType')}<span className="text-red-500">*</span></label><input type="text" name="farmName" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" value={upgradeFormik.values.farmName} onChange={upgradeFormik.handleChange} onBlur={upgradeFormik.handleBlur} />{upgradeFormik.touched.farmName && upgradeFormik.errors.farmName ? <p className="text-xs text-red-600 mt-1">{upgradeFormik.errors.farmName}</p> : null}</div>)}
                        <div>
                           <label className="block text-sm font-medium text-gray-700">{t('profile.niuTaxId')} <span className="text-red-500">*</span></label>
                           <input type="text" name="taxIdentificationNumber" required placeholder="Enter your NIU" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" value={upgradeFormik.values.taxIdentificationNumber} onChange={upgradeFormik.handleChange} onBlur={upgradeFormik.handleBlur} />
                           {upgradeFormik.touched.taxIdentificationNumber && upgradeFormik.errors.taxIdentificationNumber ? <p className="text-xs text-red-600 mt-1">{upgradeFormik.errors.taxIdentificationNumber as string}</p> : null}
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700">{t('form.description')}<span className="text-red-500">*</span></label><textarea name="description" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" rows={3} value={upgradeFormik.values.description} onChange={upgradeFormik.handleChange} onBlur={upgradeFormik.handleBlur} />{upgradeFormik.touched.description && upgradeFormik.errors.description ? <p className="text-xs text-red-600 mt-1">{upgradeFormik.errors.description}</p> : null}</div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.categoriesClick')}</label><div className="flex flex-wrap gap-2 border border-gray-200 p-3 rounded bg-white">{PRODUCTION_TYPES.map(cat => (<button key={cat} type="button" onClick={() => toggleUpgradeCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${upgradeFormik.values.productionTypes.includes(cat) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t(`category.${cat}`)}</button>))}</div></div>
                        <div className="mt-5 sm:mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowUpgradeModal(false)} className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm">Cancel</button><button type="submit" className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:text-sm">{t('profile.upgradeAccount')}</button></div>
                     </form>
         </Modal>

         {showPaymentRecap && paymentOrderId && (() => {
            const payOrder = orders.find(o => o.id === paymentOrderId);
            if (!payOrder) return null;
            const producerName = getProducerDisplayName(payOrder);
            const walletBalance = wallet?.balance ?? 0;
            const newBalance = walletBalance - payOrder.totalAmount;
            const hasSufficientFunds = newBalance >= 0;

            return (
               <Modal open={showPaymentRecap} onClose={() => setShowPaymentRecap(false)} maxWidth="lg" zIndex={50} backdropClassName="bg-gray-900/60" panelClassName="p-4 sm:p-6">

                        {/* Header */}
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                           <div>
                              <h3 className="text-lg font-bold text-gray-900">{t('order.paymentRecap')}</h3>
                              <p className="text-xs text-gray-500 mt-0.5">Order #{payOrder.id.substring(payOrder.id.length - 6).toUpperCase()}</p>
                           </div>
                           <button onClick={() => setShowPaymentRecap(false)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                              <X className="h-5 w-5 text-gray-400" />
                           </button>
                        </div>

                        {/* Producer */}
                        <div className="flex items-center gap-3 mb-4 bg-primary-50 p-3 rounded-lg border border-primary-100">
                           <div className="h-9 w-9 rounded-full bg-primary-200 flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-primary-700" />
                           </div>
                           <div>
                              <p className="text-xs text-gray-500">{t('order.soldBy')}</p>
                              <p className="text-sm font-bold text-gray-900">{producerName}</p>
                           </div>
                        </div>

                        {/* Item List */}
                        <div className="mb-4">
                           <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('dash.items')}</h4>
                           <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {(payOrder.items || []).map((item: any, idx: number) => (
                                 <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                    {getOrderItemImage(item) && (
                                       <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                                          <img src={getOrderItemImage(item)} alt={item.title} className={offerImageInBox} />
                                       </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                       <p className="text-sm font-medium text-gray-900 truncate">{item.title || item.description || 'Item'}</p>
                                       <p className="text-xs text-gray-500">
                                          {item.cartQuantity ?? item.quantity ?? 1} {item.unit || 'units'} × {formatXaf(item.price ?? 0)}
                                       </p>
                                       {(String(item.type ?? '').toUpperCase() === 'SERVICE' || !!item.bookingDate) && item.bookingDate && (
                                          <p className="text-xs text-purple-800 font-semibold mt-1 flex items-center gap-1">
                                             <Calendar className="h-3 w-3 shrink-0" />
                                             {t('service.appointment')}: {new Date(item.bookingDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                          </p>
                                       )}
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                                       {formatXaf((item.price ?? 0) * (item.cartQuantity ?? item.quantity ?? 1))}
                                    </span>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4 space-y-2 text-sm">
                           <div className="flex justify-between text-gray-600">
                              <span>{t('cart.subtotal')}</span>
                              <span className="font-medium">{formatXaf(payOrder.subtotal)}</span>
                           </div>
                           <div className="flex justify-between text-gray-600">
                              <span>{t(payOrder.items?.some(i => i.marketType === MarketType.ATI) ? 'cart.serviceFeeRetail' : 'cart.serviceFee')}</span>
                              <span className="font-medium">{formatXaf(payOrder.serviceFee)}</span>
                           </div>
                           {(payOrder.discountAmount ?? 0) > 0 && (
                              <div className="flex justify-between text-green-600 font-medium">
                                 <span>Discount Applied</span>
                                 <span>- {formatXaf(payOrder.discountAmount ?? 0)}</span>
                              </div>
                           )}
                           <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
                              <span>{t('cart.total')}</span>
                              <span className="text-primary-600 text-base">{formatXaf(payOrder.totalAmount)}</span>
                           </div>
                        </div>

                        {/* Wallet Summary */}
                        <div className={`rounded-lg p-3 border mb-5 space-y-2 text-sm ${hasSufficientFunds ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                           <div className="flex justify-between text-gray-700">
                              <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" />{t('order.walletBalance')}</span>
                              <span className="font-medium">{walletBalance.toLocaleString()} XAF</span>
                           </div>
                           <div className="flex justify-between text-red-600">
                              <span>{t('order.orderTotal')}</span>
                              <span className="font-medium">- {payOrder.totalAmount.toLocaleString()} XAF</span>
                           </div>
                           <div className={`flex justify-between font-bold border-t pt-2 ${hasSufficientFunds ? 'border-blue-200 text-blue-800' : 'border-red-200 text-red-700'}`}>
                              <span>{t('order.balanceAfterPayment')}</span>
                              <span>{newBalance.toLocaleString()} XAF</span>
                           </div>
                        </div>

                        {!hasSufficientFunds && (
                           <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <div>
                                 <p className="text-xs font-bold text-red-700">{t('order.insufficient')}</p>
                                 <p className="text-xs text-red-600 mt-0.5">You need {(payOrder.totalAmount - walletBalance).toLocaleString()} XAF more.</p>
                                 <Link to="/wallet" className="text-xs text-red-700 underline font-medium mt-1 inline-block" onClick={() => setShowPaymentRecap(false)}>{t('wallet.topup')} →</Link>
                              </div>
                           </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                           <button
                              type="button"
                              onClick={() => void confirmPayment()}
                              disabled={!hasSufficientFunds || paymentProcessing}
                              className="w-full bg-primary-600 text-white rounded-lg py-3 font-bold hover:bg-primary-700 shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              {paymentProcessing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CreditCard className="h-4 w-4" />}
                              {paymentProcessing ? t('wallet.processing') : `${t('order.confirmPayment')} — ${formatXaf(payOrder.totalAmount)}`}
                           </button>
                           <button onClick={() => setShowPaymentRecap(false)} className="w-full text-gray-500 text-sm hover:underline py-1">
                              {t('form.cancel')}
                           </button>
                        </div>
               </Modal>
            );
         })()}

         {/* Order Details Modal (booking → receiving, including completed/cancelled) */}
         <Modal
            open={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            maxWidth="lg"
            zIndex={50}
            panelClassName="p-4 sm:p-6"
         >
            {selectedOrderLive && (
               <>
                     <div className="flex justify-between items-start mb-4 gap-2">
                        <div>
                           <h3 className="text-lg leading-6 font-bold text-gray-900">
                              {orderIsServiceOnly(selectedOrderLive) ? t('service.booking') : t('dash.orderDetails')}{' '}
                              #{selectedOrderLive.id.substring(selectedOrderLive.id.length - 6).toUpperCase()}
                           </h3>
                           {orderIsServiceOnly(selectedOrderLive) && (
                              <span className="inline-flex mt-1 text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{t('service.badge')}</span>
                           )}
                           {orderHasService(selectedOrderLive) && !orderIsServiceOnly(selectedOrderLive) && (
                              <p className="text-xs text-amber-700 mt-1">{t('dash.mixedOrderHint')}</p>
                           )}
                        </div>
                        <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-500 shrink-0"><XCircle className="h-6 w-6" /></button>
                     </div>

                     {/* Order timeline: booking → receiving */}
                     <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('dash.orderTimeline')}</h4>
                        <div className="flex flex-wrap gap-x-1 gap-y-1 items-center">
                           {ORDER_TIMELINE_STEPS.map((step, idx) => {
                              const isCurrent = selectedOrderLive.status === step.status;
                              const currentIdx = getOrderTimelineStepIndex(selectedOrderLive.status);
                              const isPast = currentIdx >= 0 && idx < currentIdx;
                              return (
                                 <span
                                    key={step.status}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isCurrent ? 'bg-primary-600 text-white' : isPast ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'}`}
                                 >
                                    {step.label}
                                    {idx < ORDER_TIMELINE_STEPS.length - 1 && <span className="ml-1 text-gray-400">→</span>}
                                 </span>
                              );
                           })}
                           {(selectedOrderLive.status === OrderStatus.CANCELLED || selectedOrderLive.status === OrderStatus.DISPUTE) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 ml-1">
                                 {selectedOrderLive.status === OrderStatus.CANCELLED ? t('order.cancelled') : t('order.status.dispute')}
                              </span>
                           )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{t('dash.orderPlaced')}: {new Date(selectedOrderLive.createdAt).toLocaleString()}</p>
                     </div>

                     {/* Seller */}
                     <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <p className="text-sm font-medium text-gray-900">
                           {t('order.soldBy')}: <Link to={`/profile/producer/${selectedOrderLive.producerId}`} className="text-primary-600 hover:underline">{getProducerDisplayName(selectedOrderLive)}</Link>
                        </p>
                     </div>

                     {/* Items / scheduled services */}
                     <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                           {orderHasService(selectedOrderLive) ? (
                              <>
                                 <Calendar className="h-4 w-4 text-purple-600" /> {t('service.scheduledServices')}
                              </>
                           ) : (
                              t('dash.items')
                           )}
                        </h4>
                        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                           {(selectedOrderLive.items || []).map((item: any, idx: number) => (
                              <li
                                 key={item.id || idx}
                                 className={`p-3 flex justify-between items-start gap-2 ${item.type === OfferType.SERVICE ? 'bg-purple-50/50 border-l-4 border-l-purple-400' : ''}`}
                              >
                                 <div className="flex items-start min-w-0">
                                    {getOrderItemImage(item) && <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden mr-3 flex-shrink-0"><img src={getOrderItemImage(item)} alt={item.title} className={offerImageInBox} /></div>}
                                    <div className="min-w-0">
                                       <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-sm font-medium text-gray-900 truncate">{item.title || 'Item'}</p>
                                          {item.type === OfferType.SERVICE && (
                                             <span className="text-[10px] font-bold uppercase bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded">{t('service.badge')}</span>
                                          )}
                                       </div>
                                       {item.type === OfferType.SERVICE ? (
                                          <>
                                             <p className="text-xs text-gray-600 mt-1">
                                                {t('service.bookedQty')}: {item.cartQuantity ?? item.quantity ?? 1} {t(`unit.${item.unit}`)} · {formatXaf(item.price ?? 0)} / {t(`unit.${item.unit}`)}
                                             </p>
                                             {item.bookingDate && (
                                                <p className="text-xs text-purple-800 font-semibold mt-1 flex items-center gap-1">
                                                   <Calendar className="h-3 w-3 shrink-0" />
                                                   {t('service.appointment')}: {new Date(item.bookingDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                             )}
                                             {item.serviceDuration != null && item.serviceDuration > 0 && (
                                                <p className="text-xs text-gray-500 mt-0.5">{item.serviceDuration} {t('service.perSlotHours')}</p>
                                             )}
                                          </>
                                       ) : (
                                          <p className="text-xs text-gray-500">{(item.cartQuantity ?? item.quantity ?? 1)} {item.unit} × {formatXaf(item.price ?? 0)}</p>
                                       )}
                                    </div>
                                 </div>
                                 <p className="text-sm font-bold text-gray-900 flex-shrink-0 ml-2">{formatXaf((item.price ?? 0) * (item.cartQuantity ?? item.quantity ?? 1))}</p>
                              </li>
                           ))}
                        </ul>
                     </div>

                     <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-base font-medium text-gray-900">Total</span>
                        <span className="text-xl font-bold text-primary-600">{formatXaf(selectedOrderLive.totalAmount ?? 0)}</span>
                     </div>

                     {/* Shipping / Delivery address */}
                     {selectedOrderLive.deliveryMethod === 'HOME' && selectedOrderLive.shippingAddress && typeof selectedOrderLive.shippingAddress === 'object' && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
                           <p className="font-medium text-gray-700 mb-1">{t('order.shippingAddressLabel')}</p>
                           <p className="text-gray-600">
                              {[
                                 (selectedOrderLive.shippingAddress as any).address,
                                 (selectedOrderLive.shippingAddress as any).city,
                                 (selectedOrderLive.shippingAddress as any).region,
                              ].filter(Boolean).join(', ')}
                           </p>
                        </div>
                     )}
                     {selectedOrderLive.deliveryMethod === 'PICKUP' && selectedOrderLive.pickupPointId && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
                           <p className="font-medium text-gray-700 mb-1">{t('order.pickupPointLabel')}</p>
                           {(() => {
                              const pp = pickupPoints.find(p => p.id === selectedOrderLive.pickupPointId);
                              const label = pp ? `${pp.name} — ${pp.address}, ${pp.city}` : selectedOrderLive.pickupPointId;
                              return <p className="text-gray-600 truncate" title={label}>{label}</p>;
                           })()}
                        </div>
                     )}

                     {/* Contact reveal for IN_TRANSIT marketplace orders. ATI retail
                         orders are sold by the platform, not a producer — there is no
                         seller profile to reveal, so the block is hidden for them. */}
                     {selectedOrderLive.status === OrderStatus.IN_TRANSIT && !orderIsRetail(selectedOrderLive) && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200 text-sm">
                           <p className="font-medium text-blue-800 mb-1 flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Producer Contact</p>
                           {selectedOrderLive.contactRevealed ? (
                              (() => {
                                 const contact = getProducerContact(selectedOrderLive.producerId);
                                 return (
                                    <div className="space-y-1 text-blue-700">
                                       {contact.phone ? (
                                          <p className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 shrink-0" /> {contact.phone}</p>
                                       ) : null}
                                       {contact.email ? (
                                          <p className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 shrink-0" /> {contact.email}</p>
                                       ) : null}
                                       {!contact.phone && !contact.email ? (
                                          <p>{t('order.contactNotAvailable')}</p>
                                       ) : null}
                                    </div>
                                 );
                              })()
                           ) : (
                              <button
                                 type="button"
                                 onClick={() => void revealContactInfo(selectedOrderLive.id)}
                                 className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-medium"
                              >
                                 {t('order.revealContact')}
                              </button>
                           )}
                        </div>
                     )}

                     <div className="mt-4 flex flex-wrap gap-2">
                        {renderOrderActions(selectedOrderLive, 'md', () => setSelectedOrder(null))}
                     </div>

                     <div className="mt-6">
                        <button onClick={() => setSelectedOrder(null)} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">
                           {t('dash.close')}
                        </button>
                     </div>
               </>
            )}
         </Modal>

         <Modal open={showReviewModal && !!reviewOrderId} onClose={() => setShowReviewModal(false)} maxWidth="sm" zIndex={50} panelClassName="p-4 sm:p-6">
                     <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">{t('review.rate')}</h3>
                     <form onSubmit={reviewFormik.handleSubmit}>
                        <div className="flex justify-center space-x-2 mb-6">
                           {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} type="button" onClick={() => { void reviewFormik.setFieldValue('rating', star); }} className="focus:outline-none"><Star className={`h-8 w-8 ${star <= reviewFormik.values.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} /></button>
                           ))}
                        </div>
                        <div className="mb-4">
                           <label className="block text-sm font-medium text-gray-700 mb-2">{t('review.comment')}</label>
                           <textarea name="comment" rows={3} className="block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500" value={reviewFormik.values.comment} onChange={reviewFormik.handleChange} onBlur={reviewFormik.handleBlur} placeholder={t('review.shareExperience')} />
                           {reviewFormik.touched.comment && reviewFormik.errors.comment ? <p className="text-xs text-red-600 mt-1">{reviewFormik.errors.comment}</p> : null}
                        </div>
                        <button type="submit" className="w-full bg-primary-600 text-white rounded-md py-2 text-sm font-bold hover:bg-primary-700">{t('review.submit')}</button>
                     </form>
         </Modal>

         <Modal open={showDisputeModal && !!disputeOrderId} onClose={() => setShowDisputeModal(false)} maxWidth="lg" zIndex={50} panelClassName="p-4 sm:p-6">
                     <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2"><h3 className="text-lg font-bold text-gray-900">{t('order.reportProblem')}</h3><button onClick={() => setShowDisputeModal(false)}><X className="h-5 w-5 text-gray-400" /></button></div>
                     <form onSubmit={disputeFormik.handleSubmit} className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('order.reason')}</label><textarea name="disputeReason" required rows={3} className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900" value={disputeFormik.values.disputeReason} onChange={disputeFormik.handleChange} onBlur={disputeFormik.handleBlur} placeholder={t('order.disputePlaceholder')} />{disputeFormik.touched.disputeReason && disputeFormik.errors.disputeReason ? <p className="text-xs text-red-600 mt-1">{disputeFormik.errors.disputeReason}</p> : null}</div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('order.uploadFiles')}</label><input type="file" multiple accept="image/*,application/pdf" className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" onChange={handleDisputeFileChange} /></div>
                        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowDisputeModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">{t('form.cancel')}</button><button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-bold hover:bg-orange-700">{t('order.submitReport')}</button></div>
                     </form>
         </Modal>

         <Modal open={rescheduleOrderId !== null} onClose={() => { if (!reschedulingAppt) setRescheduleOrderId(null); }} maxWidth="sm" zIndex={50} panelClassName="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
               <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-600" /> {t('order.reschedule')}</h3>
               <button onClick={() => { if (!reschedulingAppt) setRescheduleOrderId(null); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">{t('order.rescheduleHint')}</p>
            {rescheduleOrder?.producerId ? (
               <ServiceAppointmentPicker
                  producerId={rescheduleOrder.producerId}
                  durationHours={rescheduleDurationHours}
                  selectedSlotIso={rescheduleSlotIso}
                  onSelectSlot={setRescheduleSlotIso}
                  clientId={user?.clientId}
                  orders={orders}
                  currentBookingIso={firstServiceBookingIso(rescheduleOrder) ?? undefined}
               />
            ) : (
               <p className="text-sm text-red-600">{t('order.appointmentLoadError')}</p>
            )}
            <div className="flex justify-end gap-3 pt-4">
               <button type="button" onClick={() => setRescheduleOrderId(null)} disabled={reschedulingAppt} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50">{t('form.cancel')}</button>
               <button
                  type="button"
                  disabled={!rescheduleSlotIso || reschedulingAppt}
                  onClick={async () => {
                     if (!rescheduleOrderId || !rescheduleSlotIso) return;
                     try {
                        setReschedulingAppt(true);
                        const ok = await updateAppointment(rescheduleOrderId, rescheduleSlotIso);
                        if (ok) setRescheduleOrderId(null);
                     } finally {
                        setReschedulingAppt(false);
                     }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
               >
                  {reschedulingAppt ? t('wallet.processing') : t('order.saveAppointment')}
               </button>
            </div>
         </Modal>

         <Modal open={cancelRequestOrderId !== null} onClose={() => { if (!requestingCancel) setCancelRequestOrderId(null); }} maxWidth="sm" zIndex={50} panelClassName="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
               <h3 className="text-lg font-bold text-gray-900">{t('order.requestCancellation')}</h3>
               <button onClick={() => { if (!requestingCancel) setCancelRequestOrderId(null); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">{t('order.requestCancellationHint')}</p>
            <textarea
               rows={3}
               value={cancelRequestReason}
               onChange={(e) => setCancelRequestReason(e.target.value)}
               placeholder={t('order.reason')}
               className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="flex justify-end gap-3 pt-4">
               <button type="button" onClick={() => setCancelRequestOrderId(null)} disabled={requestingCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50">{t('order.cancelKeep')}</button>
               <button
                  type="button"
                  disabled={requestingCancel}
                  onClick={async () => {
                     if (!cancelRequestOrderId) return;
                     try {
                        setRequestingCancel(true);
                        await requestOrderCancellation(cancelRequestOrderId, cancelRequestReason.trim());
                        setCancelRequestOrderId(null);
                     } finally {
                        setRequestingCancel(false);
                     }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 disabled:opacity-50"
               >
                  {requestingCancel ? t('wallet.processing') : t('order.submitCancellation')}
               </button>
            </div>
         </Modal>

         <LogoutConfirmModal
            open={logoutConfirmOpen}
            onClose={() => setLogoutConfirmOpen(false)}
            onConfirm={performLogout}
         />

         <ConfirmModal
            open={cancelOrderId !== null}
            tone="danger"
            title={t('order.cancelConfirmTitle')}
            description={t('order.cancelConfirmBody')}
            confirmLabel={t('order.cancel')}
            cancelLabel={t('order.cancelKeep')}
            busy={cancelingOrder}
            onClose={() => { if (!cancelingOrder) setCancelOrderId(null); }}
            onConfirm={async () => {
               if (!cancelOrderId) return;
               try {
                  setCancelingOrder(true);
                  await cancelOrder(cancelOrderId);
               } finally {
                  setCancelingOrder(false);
                  setCancelOrderId(null);
               }
            }}
         />

         <ConfirmModal
            open={completeOrderId !== null}
            tone="info"
            title={t('order.completeConfirmTitle')}
            description={t('order.completeConfirmBody')}
            confirmLabel={t('order.completeOrder')}
            busy={completingOrder}
            onClose={() => { if (!completingOrder) setCompleteOrderId(null); }}
            onConfirm={async () => {
               if (!completeOrderId) return;
               try {
                  setCompletingOrder(true);
                  await completeOrder(completeOrderId);
               } finally {
                  setCompletingOrder(false);
                  setCompleteOrderId(null);
               }
            }}
         />

         <ConfirmModal
            open={confirmReceiptOrderId !== null}
            tone="info"
            title={t('order.receiptConfirmTitle')}
            description={t('order.receiptConfirmBody')}
            confirmLabel={t('order.confirmReceipt')}
            busy={confirmingReceipt}
            onClose={() => { if (!confirmingReceipt) setConfirmReceiptOrderId(null); }}
            onConfirm={async () => {
               if (!confirmReceiptOrderId) return;
               try {
                  setConfirmingReceipt(true);
                  await confirmReceipt(confirmReceiptOrderId);
               } finally {
                  setConfirmingReceipt(false);
                  setConfirmReceiptOrderId(null);
               }
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
      </div>
   );
};
