
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { UserRole, OrderStatus, ClientProfile as ClientProfileType, Location, Order } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, Wallet, Shield, CheckCircle, AlertTriangle, CreditCard, Camera, MapPin, ArrowLeft, Tractor, Plus, Trash2, LogOut, Star, History, Archive, Heart, Search, X, ThumbsUp, Users, Eye, XCircle } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal';

const CAMEROON_LOCATIONS: Record<string, string[]> = {
   'West': ['Bafoussam', 'Dschang', 'Foumban', 'Mbouda', 'Bandjoun'],
   'Center': ['Yaoundé', 'Mbalmayo', 'Bafia', 'Obala', 'Eseka'],
   'Littoral': ['Douala', 'Edea', 'Nkongsamba', 'Loum', 'Mbanga'],
   'North West': ['Bamenda', 'Kumbo', 'Ndop', 'Wum', 'Mbengwi'],
   'South West': ['Buea', 'Limbe', 'Kumba', 'Tiko', 'Mamfe'],
   'Adamaoua': ['Ngaoundere', 'Meiganga', 'Tibati'],
   'North': ['Garoua', 'Guider', 'Figuil'],
   'Far North': ['Maroua', 'Kousseri', 'Mokolo'],
   'East': ['Bertoua', 'Batouri', 'Abong-Mbang'],
   'South': ['Ebolowa', 'Kribi', 'Sangmelima']
};

const PRODUCTION_TYPES = ['Agriculture', 'Livestock farming', 'Fish Farming', 'Vegetables', 'Processed foods', 'Equipment', 'Service'];

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
   const { user, orders, payForOrder, confirmReceipt, reportProblem, clients, producers, updateClientProfile, upgradeClientToProducer, logout, submitReview, offers, toggleFavorite, cancelOrder, getWallet, reviews, getAverageRating, myReferrals, refreshMyReferrals } = useStore();
   const { t } = useTranslation();
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'security' | 'favorites' | 'reputation' | 'referrals'>('orders');

   const [formData, setFormData] = useState<ClientProfileType | null>(null);
   const [showUpgradeModal, setShowUpgradeModal] = useState(false);
   const [newLoc, setNewLoc] = useState<Partial<Location>>({ region: '', city: '', address: '' });

   const [upgradeData, setUpgradeData] = useState({
      type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'BUSINESS',
      farmName: '',
      description: '',
      productionTypes: [] as string[]
   });

   const [showReviewModal, setShowReviewModal] = useState(false);
   const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
   const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);
   const [rating, setRating] = useState(5);
   const [comment, setComment] = useState('');

   const [showDisputeModal, setShowDisputeModal] = useState(false);
   const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
   const [disputeReason, setDisputeReason] = useState('');
   const [disputeFiles, setDisputeFiles] = useState<File[]>([]);

   const [showPaymentRecap, setShowPaymentRecap] = useState(false);
   const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);

   const [showPasswordModal, setShowPasswordModal] = useState(false);
   const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

   const currentClient = useMemo(
      () => (user?.id ? clients.find(c => c.userId === user.id || c.id === user.id) : undefined),
      [clients, user?.id],
   );
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

   const copyReferralLink = () => {
      if (!referralCodeDisplay) return;
      const link = `${window.location.origin}/#/register/client?ref=${referralCodeDisplay}`;
      void navigator.clipboard.writeText(link);
      alert('Referral link copied!');
   };

   const myReviews = user ? reviews.filter(r => r.targetId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
   const myAverageRating = user ? getAverageRating(user.id) : 0;

   useEffect(() => {
      const rowId = (currentClient as any)?.id;
      if (!currentClient || !rowId) {
         setFormData(null);
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
            referralCode: ((currentClient as any).referralCode ?? (clientUser as any)?.referralCode ?? '').toString(),
            referrals: Array.isArray((currentClient as any).referrals) ? (currentClient as any).referrals : [],
            searchHistory: Array.isArray((currentClient as any).searchHistory) ? (currentClient as any).searchHistory : [],
         } as ClientProfileType;
      });
   }, [currentClient, user]);

   if (!user) {
      return (
         <div className="max-w-7xl mx-auto py-8 px-4">
            <SEO title="Client Profile | AgriMarket" noindex={true} />
            <p className="p-8 text-center text-gray-600">Please log in to view your profile.</p>
         </div>
      );
   }

   if (user.role !== UserRole.CLIENT && user.role !== UserRole.PRODUCER) {
      return (
         <div className="max-w-7xl mx-auto py-8 px-4">
            <SEO title="Client Profile | AgriMarket" noindex={true} />
            <p className="p-8 text-center">Access Denied</p>
         </div>
      );
   }

   if (!currentClient?.id && user.role === UserRole.PRODUCER) {
      return (
         <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <SEO title="Delivery profile | AgriMarket" noindex={true} />
            <div className="p-8 text-center max-w-lg mx-auto space-y-4 bg-white rounded-lg shadow border border-gray-100">
               <p className="text-gray-700">Your buyer (delivery) profile could not be loaded yet.</p>
               <p className="text-sm text-gray-500">Try refreshing the page. If you just signed up, finish producer onboarding first.</p>
               <Link to="/producer/profile" className="inline-block text-primary-600 font-medium hover:underline">Go to producer profile</Link>
            </div>
         </div>
      );
   }

   if (!currentClient?.id && user.role === UserRole.CLIENT) {
      return (
         <div className="max-w-7xl mx-auto py-8 px-4">
            <SEO title="Client Profile | AgriMarket" noindex={true} />
            <div className="p-8 text-center max-w-lg mx-auto space-y-4">
               <p className="text-gray-700">No client profile was found for your account.</p>
               <Link to="/register/client" className="text-primary-600 font-medium hover:underline">Complete client registration</Link>
            </div>
         </div>
      );
   }

   const allMyOrders = orders.filter(o => o.clientId === currentClient?.id || o.clientId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
   const activeOrders = allMyOrders.filter(o => [OrderStatus.PENDING_VALIDATION, OrderStatus.CONFIRMED_AWAITING_PAYMENT, OrderStatus.PAID_IN_PREPARATION, OrderStatus.IN_TRANSIT, OrderStatus.DISPUTE].includes(o.status));
   const pastOrders = allMyOrders.filter(o => [OrderStatus.COMPLETED, OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(o.status));

   // Order lifecycle steps for timeline (booking → receiving)
   const ORDER_TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
      { status: OrderStatus.PENDING_VALIDATION, label: 'Booked' },
      { status: OrderStatus.CONFIRMED_AWAITING_PAYMENT, label: 'Confirmed' },
      { status: OrderStatus.PAID_IN_PREPARATION, label: 'Paid' },
      { status: OrderStatus.IN_TRANSIT, label: 'In transit' },
      { status: OrderStatus.DELIVERED, label: 'Delivered' },
      { status: OrderStatus.COMPLETED, label: 'Completed' },
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
   const confirmPayment = async () => { if (!paymentOrderId) return; const result = await payForOrder(paymentOrderId); if (!result.success && result.error === 'INSUFFICIENT_FUNDS') { alert(t('order.insufficient')); } setShowPaymentRecap(false); setPaymentOrderId(null); };
   const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { if (!formData) return; const { name, value } = e.target; setFormData({ ...formData, [name]: value ?? '' }); };
   const addLocation = () => { if (!formData || !newLoc.region || !newLoc.city || !newLoc.address) return; const locationToAdd: Location = { lat: 0, lng: 0, region: newLoc.region, city: newLoc.city, address: newLoc.address }; setFormData({ ...formData, locations: [...formData.locations, locationToAdd] }); setNewLoc({ region: '', city: '', address: '' }); };
   const removeLocation = (index: number) => { if (!formData) return; setFormData({ ...formData, locations: formData.locations.filter((_, i) => i !== index) }); };
   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (formData && e.target.files && e.target.files[0]) { const file = e.target.files[0]; const fakeUrl = URL.createObjectURL(file); setFormData({ ...formData, profileImageUrl: fakeUrl }); } };
   const savePersonalInfo = (e: React.FormEvent) => { e.preventDefault(); if (formData) { updateClientProfile({ ...formData, name: `${formData.firstName} ${formData.lastName}` }); } };
   const toggleUpgradeCategory = (cat: string) => { const current = upgradeData.productionTypes; if (current.includes(cat)) { setUpgradeData({ ...upgradeData, productionTypes: current.filter(c => c !== cat) }); } else { setUpgradeData({ ...upgradeData, productionTypes: [...current, cat] }); } };
   const handleUpgradeSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!user) return; upgradeClientToProducer(user.id, { type: upgradeData.type, name: upgradeData.type === 'BUSINESS' ? upgradeData.farmName : undefined, description: upgradeData.description, productionTypes: upgradeData.productionTypes }); setShowUpgradeModal(false); navigate('/producer/dashboard'); };
   const performLogout = async () => {
      await logout();
      setLogoutConfirmOpen(false);
      navigate('/');
   };
   const openReviewModal = (orderId: string, producerId: string) => { setReviewOrderId(orderId); setReviewTargetId(producerId); setRating(5); setComment(''); setShowReviewModal(true); };
   const handleSubmitReview = (e: React.FormEvent) => { e.preventDefault(); if (user && reviewOrderId && reviewTargetId) { submitReview({ orderId: reviewOrderId, reviewerId: user.id, targetId: reviewTargetId, rating, comment }); setShowReviewModal(false); } };
   const getProducerName = (producerId: string) => { const p = producers.find(prod => prod.id === producerId); return p ? (p.name || (p as any).user?.displayName || `${(p.firstName ?? '').trim()} ${(p.lastName ?? '').trim()}`.trim()) : 'Unknown Producer'; };
   const getProducerDisplayName = (order: Order) => order.producerDisplayName || getProducerName(order.producerId);
   const openDisputeModal = (orderId: string) => { setDisputeOrderId(orderId); setDisputeReason(''); setDisputeFiles([]); setShowDisputeModal(true); };
   const handleDisputeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { setDisputeFiles(Array.from(e.target.files)); } };
   const submitDispute = (e: React.FormEvent) => { e.preventDefault(); if (disputeOrderId && disputeReason) { reportProblem(disputeOrderId, disputeReason, disputeFiles); setShowDisputeModal(false); } };
   const getStatusBadge = (status: OrderStatus) => { const styles = { [OrderStatus.PENDING_VALIDATION]: 'bg-yellow-100 text-yellow-800', [OrderStatus.CONFIRMED_AWAITING_PAYMENT]: 'bg-blue-100 text-blue-800', [OrderStatus.PAID_IN_PREPARATION]: 'bg-purple-100 text-purple-800', [OrderStatus.IN_TRANSIT]: 'bg-indigo-100 text-indigo-800', [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800', [OrderStatus.COMPLETED]: 'bg-gray-100 text-gray-800', [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800', [OrderStatus.DISPUTE]: 'bg-red-100 text-red-800', }; return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>{status.replace(/_/g, ' ')}</span>; };

   const renderOrderList = (orderList: any[], emptyMsg: string) => {
      if (orderList.length === 0) {
         return <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100"><Package className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{emptyMsg}</p></div>;
      }
      return (
         <div className="space-y-4">
            {orderList.map((order) => (
               <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:border-primary-200 transition-colors">
                  <div className="p-4 sm:p-6" onClick={() => setSelectedOrder(order)}>
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <div className="cursor-pointer flex-1">
                           <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              Order #{order.id.substring(order.id.length - 6).toUpperCase()}
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 flex items-center font-normal"><Eye className="h-3 w-3 mr-1" /> {t('dash.viewDetails')}</span>
                           </h4>
                           <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()} • {order.items?.length ?? 0} items</p>
                        </div>
                        <div className="flex items-center gap-2">
                           {getStatusBadge(order.status)}
                        </div>
                     </div>
                     <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                        <div className="flex -space-x-2 overflow-hidden">
                           {(order.items || []).slice(0, 3).map((item: any, idx: number) => (
                              <img key={idx} className="inline-block h-10 w-10 rounded-md ring-2 ring-white object-cover" src={item.imageUrl} alt="" title={item.title} />
                           ))}
                           {(order.items?.length ?? 0) > 3 && (
                              <div className="flex items-center justify-center h-10 w-10 rounded-md ring-2 ring-white bg-gray-100 text-xs font-bold text-gray-500">+{(order.items?.length ?? 0) - 3}</div>
                           )}
                        </div>
                        <div className="text-right" onClick={e => e.stopPropagation()}>
                           <p className="text-sm font-bold text-gray-900 mb-2">{order.totalAmount?.toLocaleString?.() ?? order.totalAmount} XAF</p>
                           <div className="flex gap-2 flex-wrap justify-end">
                              {order.status === OrderStatus.CONFIRMED_AWAITING_PAYMENT && (
                                 <button onClick={() => initiatePayment(order.id)} className="bg-primary-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-primary-700 shadow-sm flex items-center gap-1"><CreditCard className="w-3 h-3" /> {t('order.payNow')}</button>
                              )}
                              {order.status === OrderStatus.IN_TRANSIT && (
                                 <button onClick={() => confirmReceipt(order.id)} className="bg-green-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 shadow-sm flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {t('order.confirmReceipt')}</button>
                              )}
                              {([OrderStatus.PENDING_VALIDATION, OrderStatus.CONFIRMED_AWAITING_PAYMENT].includes(order.status)) && (
                                 <button onClick={() => cancelOrder(order.id)} className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md text-xs font-medium border border-red-100">{t('order.cancel')}</button>
                              )}
                              {(order.status === OrderStatus.PAID_IN_PREPARATION || order.status === OrderStatus.IN_TRANSIT || order.status === OrderStatus.DELIVERED) && (
                                 <button onClick={() => openDisputeModal(order.id)} className="text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-md text-xs font-medium border border-orange-100 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t('order.reportProblem')}</button>
                              )}
                              {(order.status === OrderStatus.DELIVERED || order.status === OrderStatus.COMPLETED) && !order.clientReviewed && (
                                 <button onClick={() => openReviewModal(order.id, order.producerId)} className="bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-md text-xs font-bold hover:bg-yellow-200 border border-yellow-200 flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> {t('review.rate')}</button>
                              )}
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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
         <SEO title="Client Profile | AgriMarket" noindex={true} />
         <div className="mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-primary-600 transition-colors font-medium">
               <ArrowLeft className="h-5 w-5 mr-2" /> Back
            </button>
         </div>

         <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
            <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
               <nav className="space-y-1">
                  <button onClick={() => setActiveTab('info')} className={`${activeTab === 'info' ? 'bg-gray-50 text-primary-700 hover:text-primary-700 hover:bg-white' : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'} group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full`}>
                     <User className={`${activeTab === 'info' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 -ml-1 mr-3 h-6 w-6`} /> <span className="truncate">{t('profile.tabs.info')}</span>
                  </button>
                  <button onClick={() => setActiveTab('orders')} className={`${activeTab === 'orders' ? 'bg-gray-50 text-primary-700 hover:text-primary-700 hover:bg-white' : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'} group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full`}>
                     <Package className={`${activeTab === 'orders' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 -ml-1 mr-3 h-6 w-6`} /> <span className="truncate">{t('profile.tabs.orders')}</span>
                  </button>
                  <button onClick={() => setActiveTab('favorites')} className={`${activeTab === 'favorites' ? 'bg-gray-50 text-primary-700 hover:text-primary-700 hover:bg-white' : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'} group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full`}>
                     <Heart className={`${activeTab === 'favorites' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 -ml-1 mr-3 h-6 w-6`} /> <span className="truncate">{t('profile.tabs.favorites')}</span>
                  </button>
                  <button onClick={() => setActiveTab('reputation')} className={`${activeTab === 'reputation' ? 'bg-gray-50 text-primary-700 hover:text-primary-700 hover:bg-white' : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'} group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full`}>
                     <ThumbsUp className={`${activeTab === 'reputation' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 -ml-1 mr-3 h-6 w-6`} /> <span className="truncate">{t('profile.tabs.reputation')}</span>
                  </button>
                  <button onClick={() => setActiveTab('referrals')} className={`${activeTab === 'referrals' ? 'bg-gray-50 text-primary-700 hover:text-primary-700 hover:bg-white' : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'} group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full`}>
                     <Users className={`${activeTab === 'referrals' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 -ml-1 mr-3 h-6 w-6`} /> <span className="truncate">Referrals</span>
                  </button>
                  <Link to="/wallet" className="text-gray-900 hover:text-gray-900 hover:bg-gray-50 group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full">
                     <Wallet className="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-6 w-6" /> <span className="truncate">{t('nav.wallet')}</span>
                  </Link>
                  <button onClick={() => setActiveTab('security')} className={`${activeTab === 'security' ? 'bg-gray-50 text-primary-700 hover:text-primary-700 hover:bg-white' : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'} group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full`}>
                     <Shield className={`${activeTab === 'security' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} flex-shrink-0 -ml-1 mr-3 h-6 w-6`} /> <span className="truncate">{t('profile.tabs.security')}</span>
                  </button>
                  {user.role === UserRole.CLIENT && (
                     <div className="pt-6">
                        <button onClick={() => setShowUpgradeModal(true)} className="bg-primary-600 text-white group rounded-md px-3 py-3 flex items-center text-sm font-bold w-full hover:bg-primary-700 shadow-md transition-all">
                           <Tractor className="flex-shrink-0 -ml-1 mr-3 h-6 w-6" /> {t('profile.upgrade')}
                        </button>
                        <p className="text-xs text-gray-500 mt-2 px-1">{t('profile.upgradeDesc')}</p>
                     </div>
                  )}
                  <div className="pt-4 mt-4 border-t border-gray-200">
                     <button type="button" onClick={() => setLogoutConfirmOpen(true)} className="text-red-600 hover:bg-red-50 group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full transition-colors">
                        <LogOut className="flex-shrink-0 -ml-1 mr-3 h-6 w-6" /> <span className="truncate">{t('nav.logout')}</span>
                     </button>
                  </div>
               </nav>
            </aside>

            <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
               {activeTab === 'info' && !formData && currentClient?.id && (
                  <div className="shadow sm:rounded-md bg-white p-8 text-center text-gray-600">
                     Loading profile…
                  </div>
               )}
               {activeTab === 'info' && formData && (
                  <form onSubmit={savePersonalInfo} className="shadow sm:rounded-md sm:overflow-hidden bg-white p-6">
                     <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.tabs.info')}</h3>
                     <div className="flex items-center mb-6">
                        <div className="relative">
                           <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                              {formData.profileImageUrl ? (
                                 <img src={formData.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                              ) : (
                                 <User className="h-12 w-12 text-gray-400" />
                              )}
                           </div>
                           <label className="absolute bottom-0 right-0 bg-primary-600 p-1.5 rounded-full text-white cursor-pointer hover:bg-primary-700 shadow-sm">
                              <Camera className="h-4 w-4" />
                              <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileUpload} />
                           </label>
                        </div>
                        <div className="ml-4">
                           <p className="text-sm font-medium text-gray-700">{t('profile.uploadPhoto')}</p>
                           <p className="text-xs text-gray-500">JPG or PNG. Max 10MB.</p>
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
                              <option value="">Select Gender</option>
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
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
                           <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center"><MapPin className="h-4 w-4 mr-1 text-primary-600" /> My Locations</h4>
                           <div className="space-y-2 mb-4">
                              {(formData.locations || []).map((loc, idx) => (
                                 <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                                    <div>
                                       <p className="text-sm font-medium text-gray-900">{loc.address}</p>
                                       <p className="text-xs text-gray-500">{loc.city}, {loc.region}</p>
                                    </div>
                                    <button type="button" onClick={() => removeLocation(idx)} className="text-gray-400 hover:text-red-500">
                                       <Trash2 className="h-4 w-4" />
                                    </button>
                                 </div>
                              ))}
                           </div>
                           <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                              <p className="text-xs font-medium text-blue-700 mb-2">Add New Location</p>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                 <select
                                    value={newLoc.region ?? ''}
                                    onChange={e => setNewLoc({ ...newLoc, region: e.target.value, city: CAMEROON_LOCATIONS[e.target.value]?.[0] || '' })}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 bg-white text-gray-900"
                                 >
                                    <option value="">Region</option>
                                    {Object.keys(CAMEROON_LOCATIONS).map(r => <option key={r} value={r}>{r}</option>)}
                                 </select>
                                 <select
                                    value={newLoc.city ?? ''}
                                    onChange={e => setNewLoc({ ...newLoc, city: e.target.value })}
                                    disabled={!newLoc.region}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 disabled:bg-gray-100 bg-white text-gray-900"
                                 >
                                    <option value="">City</option>
                                    {newLoc.region && CAMEROON_LOCATIONS[newLoc.region]?.map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                                 <div className="flex gap-2">
                                    <input
                                       type="text"
                                       placeholder="Address"
                                       value={newLoc.address ?? ''}
                                       onChange={e => setNewLoc({ ...newLoc, address: e.target.value })}
                                       className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 bg-white text-gray-900"
                                    />
                                    <button
                                       type="button"
                                       onClick={addLocation}
                                       disabled={!newLoc.region || !newLoc.city || !newLoc.address}
                                       className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                                    >
                                       <Plus className="h-5 w-5" />
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="sm:col-span-6 pt-4 flex justify-end">
                           <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-md text-sm font-medium shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                              {t('form.save')}
                           </button>
                        </div>
                     </div>
                  </form>
               )}

               {activeTab === 'orders' && (
                  <div className="space-y-8">
                     {/* All orders — view any order from booking to receiving, including completed/cancelled */}
                     <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="px-4 py-5 border-b border-gray-200 bg-gray-50">
                           <h3 className="text-lg font-bold text-gray-900 flex items-center"><Package className="w-5 h-5 mr-2 text-gray-500" /> {t('dash.allOrders')}</h3>
                           <p className="text-sm text-gray-500 mt-1">{t('dash.allOrdersDesc')}</p>
                        </div>
                        <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                           {allMyOrders.length === 0 ? (
                              <li className="px-4 py-8 text-center text-gray-500">No orders yet.</li>
                           ) : (
                              allMyOrders.map(order => (
                                 <li key={order.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center" onClick={() => setSelectedOrder(order)}>
                                    <div>
                                       <p className="font-medium text-gray-900">Order #{order.id.substring(order.id.length - 6).toUpperCase()}</p>
                                       <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()} • {(order.items || []).length} items • {getProducerDisplayName(order)}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DISPUTE ? 'bg-red-100 text-red-800' : order.status === OrderStatus.DELIVERED || order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                       {order.status.replace(/_/g, ' ')}
                                    </span>
                                 </li>
                              ))
                           )}
                        </ul>
                     </section>
                     <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Archive className="w-5 h-5 mr-2 text-primary-600" /> {t('order.active')}</h3>
                        {renderOrderList(activeOrders, "No active orders.")}
                     </section>
                     <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><History className="w-5 h-5 mr-2 text-gray-400" /> {t('order.past')}</h3>
                        {renderOrderList(pastOrders, "No order history.")}
                     </section>
                  </div>
               )}

               {activeTab === 'favorites' && (
                  <div className="shadow sm:rounded-md sm:overflow-hidden bg-white p-6">
                     <div className="border-b border-gray-200 pb-4 mb-4">
                        <h3 className="text-lg font-medium text-gray-900">{t('profile.tabs.favorites')}</h3>
                     </div>
                     {unavailableFavoriteIds && unavailableFavoriteIds.length > 0 && (
                        <div className="mb-6 bg-yellow-50 p-4 rounded-md border border-yellow-100">
                           <h4 className="text-sm font-bold text-yellow-800 mb-2">Unavailable Items</h4>
                           <ul className="space-y-2">
                              {unavailableFavoriteIds.map(id => (
                                 <li key={id} className="flex items-center justify-between text-sm text-yellow-700">
                                    <span>Item #{id} is no longer available.</span>
                                    <div className="flex items-center gap-2"><button onClick={() => toggleFavorite(id)} className="text-xs text-red-600 hover:underline">{t('cart.remove')}</button><Link to="/market/producers" className="text-xs bg-yellow-200 px-2 py-1 rounded hover:bg-yellow-300 flex items-center"><Search className="w-3 h-3 mr-1" /> {t('profile.findSimilar')}</Link></div>
                                 </li>
                              ))}
                           </ul>
                        </div>
                     )}
                     {(!favoriteOffers || favoriteOffers.length === 0) ? (
                        <div className="text-center py-12 text-gray-500"><Heart className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p>{t('profile.favorites.empty')}</p></div>
                     ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {favoriteOffers.map((offer: any) => (
                              <div key={offer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex items-center">
                                 <img src={offer.imageUrl} className="w-16 h-16 rounded-md object-cover mr-4" />
                                 <div className="flex-1 min-w-0"><h4 className="font-bold text-gray-900 truncate">{offer.title}</h4><p className="text-sm text-gray-500">{offer.price} XAF / {offer.unit}</p></div>
                                 <div className="flex flex-col gap-2 ml-2">
                                    <Link to={`/offer/${offer.id}`} className="text-primary-600 hover:bg-primary-50 p-2 rounded-full"><ArrowLeft className="h-5 w-5 rotate-180" /></Link>
                                    <button onClick={() => toggleFavorite(offer.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full"><Trash2 className="h-5 w-5" /></button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'reputation' && (
                  <div className="shadow sm:rounded-md sm:overflow-hidden bg-white p-6">
                     <div className="border-b border-gray-200 pb-4 mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{t('profile.tabs.reputation')}</h3>
                        <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                           <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                           <span className="text-lg font-bold text-yellow-700">{myAverageRating}</span>
                           <span className="text-xs text-yellow-600 ml-1">/ 5</span>
                        </div>
                     </div>
                     {myReviews.length === 0 ? (
                        <div className="text-center py-12 text-gray-500"><Star className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p>{t('review.noReviews')}</p></div>
                     ) : (
                        <div className="space-y-4">
                           {myReviews.map(review => (
                              <div key={review.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                                 <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                       <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-2">{getProducerName(review.reviewerId).charAt(0)}</div>
                                       <div><p className="text-sm font-bold text-gray-900">{t('review.ratedBy')}: {getProducerName(review.reviewerId)}</p><p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p></div>
                                    </div>
                                    <div className="flex">{[...Array(5)].map((_, i) => (<Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />))}</div>
                                 </div>
                                 <p className="text-sm text-gray-700 italic">"{review.comment}"</p>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'referrals' && currentClient && (
                  <div className="shadow sm:rounded-md sm:overflow-hidden bg-white p-6">
                     <div className="border-b border-gray-200 pb-4 mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Referrals</h3>
                     </div>
                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800 mb-2 font-bold">Your Referral Link</p>
                        <div className="flex gap-2">
                           <input type="text" readOnly value={`${window.location.origin}/#/register/client?ref=${referralCodeDisplay}`} className="block w-full border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-700" />
                           <button type="button" onClick={copyReferralLink} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center">
                              Copy
                           </button>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">Share this link with friends to invite them to the platform.</p>
                     </div>
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
                     <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-sm font-bold text-gray-900">Your Impact</h4>
                           <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">{referralCount} Referrals</span>
                        </div>
                        {referralCount === 0 ? (
                           <div className="text-center py-8 text-gray-500">
                              <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                              <p>You haven&apos;t referred anyone yet.</p>
                           </div>
                        ) : (
                           <div className="space-y-3">
                              <p className="text-sm text-gray-600">You have successfully referred {referralCount} user{referralCount === 1 ? '' : 's'}.</p>
                              {referredPeople.length > 0 ? (
                                 <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white">
                                    {referredPeople.map((u) => (
                                       <li key={u.id} className="px-3 py-2 flex justify-between text-sm">
                                          <span className="font-medium text-gray-900">{u.displayName || 'User'}</span>
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
                  <div className="shadow sm:rounded-md sm:overflow-hidden bg-white p-6">
                     <h3 className="text-lg font-medium text-gray-900">{t('profile.tabs.security')}</h3>
                     <div className="mt-4">
                        <button onClick={() => setShowPasswordModal(true)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors">{t('profile.password')}</button>
                     </div>
                  </div>
               )}
            </div>
         </div>

         <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />

         {showUpgradeModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUpgradeModal(false)}></div>
                  <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                     <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.upgrade')}</h3>
                     <form onSubmit={handleUpgradeSubmit} className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">Producer Type</label>
                           <div className="flex space-x-4">
                              <label className="flex items-center"><input type="radio" name="upgradeType" value="INDIVIDUAL" checked={upgradeData.type === 'INDIVIDUAL'} onChange={() => setUpgradeData({ ...upgradeData, type: 'INDIVIDUAL' })} className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300" /><span className="ml-2 text-sm text-gray-700">Individual</span></label>
                              <label className="flex items-center"><input type="radio" name="upgradeType" value="BUSINESS" checked={upgradeData.type === 'BUSINESS'} onChange={() => setUpgradeData({ ...upgradeData, type: 'BUSINESS' })} className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300" /><span className="ml-2 text-sm text-gray-700">Business</span></label>
                           </div>
                        </div>
                        {upgradeData.type === 'BUSINESS' && (<div><label className="block text-sm font-medium text-gray-700">Farm/Business Name</label><input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" value={upgradeData.farmName} onChange={e => setUpgradeData({ ...upgradeData, farmName: e.target.value })} /></div>)}
                        <div><label className="block text-sm font-medium text-gray-700">Description</label><textarea required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900" rows={3} value={upgradeData.description} onChange={e => setUpgradeData({ ...upgradeData, description: e.target.value })} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Categories (Click to select)</label><div className="flex flex-wrap gap-2 border border-gray-200 p-3 rounded bg-white">{PRODUCTION_TYPES.map(cat => (<button key={cat} type="button" onClick={() => toggleUpgradeCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${upgradeData.productionTypes.includes(cat) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t(`category.${cat}`)}</button>))}</div></div>
                        <div className="mt-5 sm:mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowUpgradeModal(false)} className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm">Cancel</button><button type="submit" className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:text-sm">Upgrade Account</button></div>
                     </form>
                  </div>
               </div>
            </div>
         )}

         {showPaymentRecap && paymentOrderId && (() => {
            const payOrder = orders.find(o => o.id === paymentOrderId);
            if (!payOrder) return null;
            const producerName = getProducerDisplayName(payOrder);
            const walletBalance = wallet?.balance ?? 0;
            const newBalance = walletBalance - payOrder.totalAmount;
            const hasSufficientFunds = newBalance >= 0;

            return (
               <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                     <div className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity" onClick={() => setShowPaymentRecap(false)} />
                     <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                     <div className="inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">

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
                              <p className="text-xs text-gray-500">Sold by</p>
                              <p className="text-sm font-bold text-gray-900">{producerName}</p>
                           </div>
                        </div>

                        {/* Item List */}
                        <div className="mb-4">
                           <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('dash.items')}</h4>
                           <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {(payOrder.items || []).map((item: any, idx: number) => (
                                 <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                    {item.imageUrl && (
                                       <img src={item.imageUrl} alt={item.title} className="h-10 w-10 rounded-md object-cover flex-shrink-0 border border-gray-200" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                       <p className="text-sm font-medium text-gray-900 truncate">{item.title || item.description || 'Item'}</p>
                                       <p className="text-xs text-gray-500">
                                          {item.cartQuantity ?? item.quantity ?? 1} {item.unit || 'units'} × {(item.price ?? 0).toLocaleString()} XAF
                                       </p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                                       {((item.price ?? 0) * (item.cartQuantity ?? item.quantity ?? 1)).toLocaleString()} XAF
                                    </span>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4 space-y-2 text-sm">
                           <div className="flex justify-between text-gray-600">
                              <span>{t('cart.subtotal')}</span>
                              <span className="font-medium">{payOrder.subtotal.toLocaleString()} XAF</span>
                           </div>
                           <div className="flex justify-between text-gray-600">
                              <span>{t('cart.serviceFee')} (5%)</span>
                              <span className="font-medium">{payOrder.serviceFee.toLocaleString()} XAF</span>
                           </div>
                           {(payOrder.discountAmount ?? 0) > 0 && (
                              <div className="flex justify-between text-green-600 font-medium">
                                 <span>Discount Applied</span>
                                 <span>- {(payOrder.discountAmount ?? 0).toLocaleString()} XAF</span>
                              </div>
                           )}
                           <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
                              <span>{t('cart.total')}</span>
                              <span className="text-primary-600 text-base">{payOrder.totalAmount.toLocaleString()} XAF</span>
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
                              <span>Balance After Payment</span>
                              <span>{newBalance.toLocaleString()} XAF</span>
                           </div>
                        </div>

                        {!hasSufficientFunds && (
                           <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <div>
                                 <p className="text-xs font-bold text-red-700">{t('order.insufficient')}</p>
                                 <p className="text-xs text-red-600 mt-0.5">You need {(payOrder.totalAmount - walletBalance).toLocaleString()} XAF more.</p>
                                 <Link to="/wallet" className="text-xs text-red-700 underline font-medium mt-1 inline-block" onClick={() => setShowPaymentRecap(false)}>Top up wallet →</Link>
                              </div>
                           </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                           <button
                              onClick={confirmPayment}
                              disabled={!hasSufficientFunds}
                              className="w-full bg-primary-600 text-white rounded-lg py-3 font-bold hover:bg-primary-700 shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              <CreditCard className="h-4 w-4" />
                              {t('order.confirmPayment')} — {payOrder.totalAmount.toLocaleString()} XAF
                           </button>
                           <button onClick={() => setShowPaymentRecap(false)} className="w-full text-gray-500 text-sm hover:underline py-1">
                              {t('form.cancel')}
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            );
         })()}

         {/* Order Details Modal (booking → receiving, including completed/cancelled) */}
         {selectedOrder && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true" role="dialog">
               <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedOrder(null)} />
                  <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                     <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg leading-6 font-bold text-gray-900">{t('dash.orderDetails')} #{selectedOrder.id.substring(selectedOrder.id.length - 6).toUpperCase()}</h3>
                        <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-500"><XCircle className="h-6 w-6" /></button>
                     </div>

                     {/* Order timeline: booking → receiving */}
                     <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('dash.orderTimeline')}</h4>
                        <div className="flex flex-wrap gap-x-1 gap-y-1 items-center">
                           {ORDER_TIMELINE_STEPS.map((step, idx) => {
                              const isCurrent = selectedOrder.status === step.status;
                              const currentIdx = getOrderTimelineStepIndex(selectedOrder.status);
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
                           {(selectedOrder.status === OrderStatus.CANCELLED || selectedOrder.status === OrderStatus.DISPUTE) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 ml-1">
                                 {selectedOrder.status === OrderStatus.CANCELLED ? 'Cancelled' : 'Dispute'}
                              </span>
                           )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{t('dash.orderPlaced')}: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                     </div>

                     {/* Seller */}
                     <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <p className="text-sm font-medium text-gray-900">
                           {t('order.soldBy')}: <Link to={`/profile/producer/${selectedOrder.producerId}`} className="text-primary-600 hover:underline">{getProducerDisplayName(selectedOrder)}</Link>
                        </p>
                     </div>

                     {/* Items */}
                     <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">{t('dash.items')}</h4>
                        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                           {(selectedOrder.items || []).map((item: any, idx: number) => (
                              <li key={item.id || idx} className="p-3 flex justify-between items-center">
                                 <div className="flex items-center min-w-0">
                                    {item.imageUrl && <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden mr-3 flex-shrink-0"><img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /></div>}
                                    <div className="min-w-0">
                                       <p className="text-sm font-medium text-gray-900 truncate">{item.title || 'Item'}</p>
                                       <p className="text-xs text-gray-500">{(item.cartQuantity ?? item.quantity ?? 1)} {item.unit} × {(item.price ?? 0).toLocaleString()} XAF</p>
                                       {item.bookingDate && <p className="text-xs text-purple-600 font-bold mt-0.5">Booked: {new Date(item.bookingDate).toLocaleString()}</p>}
                                    </div>
                                 </div>
                                 <p className="text-sm font-bold text-gray-900 flex-shrink-0 ml-2">{((item.price ?? 0) * (item.cartQuantity ?? item.quantity ?? 1)).toLocaleString()} XAF</p>
                              </li>
                           ))}
                        </ul>
                     </div>

                     <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-base font-medium text-gray-900">Total</span>
                        <span className="text-xl font-bold text-primary-600">{(selectedOrder.totalAmount ?? 0).toLocaleString()} XAF</span>
                     </div>

                     <div className="mt-4 flex flex-wrap gap-2">
                        {selectedOrder.status === OrderStatus.CONFIRMED_AWAITING_PAYMENT && (
                           <button onClick={() => { initiatePayment(selectedOrder.id); setSelectedOrder(null); }} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-primary-700"><CreditCard className="w-4 h-4 inline mr-1" /> {t('order.payNow')}</button>
                        )}
                        {selectedOrder.status === OrderStatus.IN_TRANSIT && (
                           <button onClick={() => { confirmReceipt(selectedOrder.id); setSelectedOrder(null); }} className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-green-700"><CheckCircle className="w-4 h-4 inline mr-1" /> {t('order.confirmReceipt')}</button>
                        )}
                        {[OrderStatus.PENDING_VALIDATION, OrderStatus.CONFIRMED_AWAITING_PAYMENT].includes(selectedOrder.status) && (
                           <button onClick={() => { cancelOrder(selectedOrder.id); setSelectedOrder(null); }} className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-md text-sm font-medium border border-red-100">{t('order.cancel')}</button>
                        )}
                        {[OrderStatus.PAID_IN_PREPARATION, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED].includes(selectedOrder.status) && (
                           <button onClick={() => { openDisputeModal(selectedOrder.id); setSelectedOrder(null); }} className="text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-md text-sm font-medium border border-orange-100"><AlertTriangle className="w-4 h-4 inline mr-1" /> {t('order.reportProblem')}</button>
                        )}
                        {(selectedOrder.status === OrderStatus.DELIVERED || selectedOrder.status === OrderStatus.COMPLETED) && !selectedOrder.clientReviewed && (
                           <button onClick={() => { openReviewModal(selectedOrder.id, selectedOrder.producerId); setSelectedOrder(null); }} className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md text-sm font-bold hover:bg-yellow-200 border border-yellow-200"><Star className="w-4 h-4 inline mr-1 fill-current" /> {t('review.rate')}</button>
                        )}
                     </div>

                     <div className="mt-6">
                        <button onClick={() => setSelectedOrder(null)} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">
                           {t('dash.close')}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {showReviewModal && reviewOrderId && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowReviewModal(false)}></div>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                  <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
                     <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">{t('review.rate')}</h3>
                     <form onSubmit={handleSubmitReview}>
                        <div className="flex justify-center space-x-2 mb-6">
                           {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none"><Star className={`h-8 w-8 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} /></button>
                           ))}
                        </div>
                        <div className="mb-4">
                           <label className="block text-sm font-medium text-gray-700 mb-2">{t('review.comment')}</label>
                           <textarea rows={3} className="block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." />
                        </div>
                        <button type="submit" className="w-full bg-primary-600 text-white rounded-md py-2 text-sm font-bold hover:bg-primary-700">{t('review.submit')}</button>
                     </form>
                  </div>
               </div>
            </div>
         )}

         {showDisputeModal && disputeOrderId && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDisputeModal(false)}></div>
                  <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                     <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2"><h3 className="text-lg font-bold text-gray-900">{t('order.reportProblem')}</h3><button onClick={() => setShowDisputeModal(false)}><X className="h-5 w-5 text-gray-400" /></button></div>
                     <form onSubmit={submitDispute} className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('order.reason')}</label><textarea required rows={3} className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900" value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="What's the issue?" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('order.uploadFiles')}</label><input type="file" multiple accept="image/*,application/pdf" className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" onChange={handleDisputeFileChange} /></div>
                        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowDisputeModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">{t('form.cancel')}</button><button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-bold hover:bg-orange-700">{t('order.submitReport')}</button></div>
                     </form>
                  </div>
               </div>
            </div>
         )}

         <LogoutConfirmModal
            open={logoutConfirmOpen}
            onClose={() => setLogoutConfirmOpen(false)}
            onConfirm={performLogout}
         />
      </div>
   );
};
