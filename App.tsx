import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth, useData, hydrateOfflineBlobUrls } from './hooks/useAppData';
import { Sidebar, Header } from './components/Layout';
import { SupportWidget } from './components/SupportWidget';
import { TRANSLATIONS } from './constants';
import { CurrencyProvider } from './context/CurrencyContext';
import { Spinner } from './components/UI';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import MarketingPage from './marketing-page/MarketingPage';
import HelpCenterPage from './marketing-page/components/HelpCenterPage';
import PrivacyPolicyPage from './marketing-page/components/PrivacyPolicyPage';
import TermsPage from './marketing-page/components/TermsPage';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import OrgProfile from './pages/OrgProfile';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Income = lazy(() => import('./pages/Income'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Inventory = lazy(() => import('./pages/Inventory'));
const HR = lazy(() => import('./pages/HR'));
const Reports = lazy(() => import('./pages/Reports'));
const Estimates = lazy(() => import('./pages/Estimates'));
const Admin = lazy(() => import('./pages/Admin'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Profile = lazy(() => import('./pages/Profile'));
const Billing = lazy(() => import('./pages/Billing'));

function isSuperAdminRole(role: { id?: string; key?: string } | null | undefined) {
  return role?.key === 'super_admin' || role?.id === 'super_admin';
}

const MainApp = () => {
  const {
    user,
    currentUserRole,
    loading,
    loginStart,
    loginVerify,
    signupStart,
    signupVerify,
    resendOtp,
    inviteAcceptStart,
    inviteAcceptVerify,
    forgotPasswordStart,
    forgotPasswordVerify,
    refreshUser,
    logout,
    changePassword,
  } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [lang, setLang] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [orgProfileDone, setOrgProfileDone] = useState(false);
  const [userProfileDone, setUserProfileDone] = useState(false);

  const { data: locations } = useData(user ? 'locations' : '');

  useEffect(() => {
    hydrateOfflineBlobUrls();
  }, []);

  const hasAllLocs = user?.locationId === 'all' ||
    (Array.isArray(user?.locationIds) && user.locationIds.includes('all')) ||
    (currentUserRole?.permissions && currentUserRole.permissions.includes('perm_allLocations'));

  const isGlobalAdmin = isSuperAdminRole(currentUserRole) && hasAllLocs;
  const isLocationAdmin = isSuperAdminRole(currentUserRole) && !hasAllLocs;

  const isLocationManager = (locationId: string | null) => {
    return currentUserRole?.id === 'manager' || currentUserRole?.key === 'manager'
      ? (user?.locationId === locationId || (Array.isArray(user?.locationIds) && user.locationIds.includes(locationId as string)))
      : false;
  };
  void isLocationManager;

  const userLocationIds = user?.locationIds || [user?.locationId].filter(Boolean);
  const selectableLocations = hasAllLocs ? locations : (locations || []).filter((l: any) => userLocationIds.includes(l.id));
  const hasMultiLoc = hasAllLocs || selectableLocations.length > 1;

  const effectiveLocationId = locationId ?? (user ? (isGlobalAdmin ? 'all' : user.locationId) : null);

  const canViewNotifications = isGlobalAdmin || (Array.isArray(currentUserRole?.permissions) && currentUserRole!.permissions.includes('perm_viewNotifications'));

  const canHaveAccessTo = (page: string) => {
    if (page === 'billing') return Boolean(user?.isOwner);
    if (page === 'organization') return Boolean(user?.isOwner);
    if (isGlobalAdmin) return true;
    if (page === 'auditLogs' && isSuperAdminRole(currentUserRole)) return true;
    const accessRules: Record<string, string> = {
      'dashboard': 'perm_viewDashboard',
      'income': 'perm_viewIncome',
      'expenses': 'perm_viewExpenses',
      'inventory': 'perm_viewInventory',
      'hr': 'perm_viewHR',
      'reports': 'perm_viewReports',
      'estimates': 'perm_viewEstimates',
      'admin': 'perm_viewAdmin',
      'auditLogs': 'perm_viewAuditLogs',
    };
    const required = accessRules[page];
    const perms = Array.isArray(currentUserRole?.permissions) ? currentUserRole!.permissions : [];
    return required != null && perms.includes(required);
  };

  useEffect(() => {
    if (user && !locationId) {
      setLocationId(isGlobalAdmin ? 'all' : user.locationId);
    }
  }, [user, currentUserRole, locationId, isGlobalAdmin]);

  const t = (key: string) => TRANSLATIONS[lang][key] || key;

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900"><Spinner /></div>;

  if (!user) {
    return (
      <Login
        loginStart={loginStart}
        loginVerify={loginVerify}
        signupStart={signupStart}
        signupVerify={signupVerify}
        resendOtp={resendOtp}
        inviteAcceptStart={inviteAcceptStart}
        inviteAcceptVerify={inviteAcceptVerify}
        forgotPasswordStart={forgotPasswordStart}
        forgotPasswordVerify={forgotPasswordVerify}
        t={t}
      />
    );
  }

  if (user.passwordNeedsReset) {
    return <ChangePassword t={t} onChangePassword={changePassword} onBackToLogin={logout} />;
  }

  const needsOrgProfile =
    user.isOwner &&
    !user.organization?.profileCompletedAt &&
    !orgProfileDone;

  if (needsOrgProfile) {
    return (
      <OrgProfile
        t={t}
        refreshUser={refreshUser}
        onComplete={() => setOrgProfileDone(true)}
        onLogout={logout}
      />
    );
  }

  const needsPersonalProfile = !user.profileCompletedAt && !userProfileDone;
  if (needsPersonalProfile) {
    return (
      <Profile
        t={t}
        user={user}
        refreshUser={refreshUser}
        onChangePassword={changePassword}
        embedded={false}
        onComplete={() => setUserProfileDone(true)}
        onLogout={logout}
      />
    );
  }

  const userWithRole = user ? { ...user, role: currentUserRole } : user;
  const commonProps = { t, lang, locationId: effectiveLocationId, user: userWithRole, isGlobalAdmin, isLocationAdmin };

  return (
    <CurrencyProvider
      orgCurrency={user.organization?.currency}
      locationId={effectiveLocationId}
      locations={locations || []}
    >
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-inter">
      <Sidebar
        page={page}
        setPage={setPage}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        logout={logout}
        t={t}
        canAccessPage={canHaveAccessTo}
      />

      <div className="flex-1 flex flex-col w-full lg:ml-64 transition-all duration-300">
        {user.subscription?.status === 'probation' && user.isOwner && (
          <div className="bg-amber-600 text-white text-sm px-4 py-2 text-center">
            {t('probationBanner')}{' '}
            <button type="button" className="underline font-medium" onClick={() => setPage('billing')}>
              {t('billing')}
            </button>
          </div>
        )}
        <Header
          setIsOpen={setSidebarOpen}
          lang={lang}
          setLang={setLang}
          locations={selectableLocations}
          locId={effectiveLocationId}
          setLocId={setLocationId}
          t={t}
          isGlobalAdmin={hasAllLocs}
          hasMultiLoc={hasMultiLoc}
          canViewNotifications={canViewNotifications}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-100 dark:bg-gray-900 print-friendly">
          <Suspense fallback={<div className="flex items-center justify-center p-12"><Spinner /></div>}>
            {page === 'dashboard' && (canHaveAccessTo('dashboard') ? <Dashboard {...commonProps} /> : <div className="p-8 text-center">Access to the Dashboard is Denied</div>)}
            {page === 'income' && (canHaveAccessTo('income') ? <Income {...commonProps} /> : <div className="p-8 text-center">Access to Income is Denied</div>)}
            {page === 'expenses' && (canHaveAccessTo('expenses') ? <Expenses {...commonProps} /> : <div className="p-8 text-center">Access to Expenses is Denied</div>)}
            {page === 'inventory' && (canHaveAccessTo('inventory') ? <Inventory {...commonProps} /> : <div className="p-8 text-center">Access to Inventory is Denied</div>)}
            {page === 'hr' && (canHaveAccessTo('hr') ? <HR {...commonProps} /> : <div className="p-8 text-center">Access to HR is Denied</div>)}
            {page === 'reports' && (canHaveAccessTo('reports') ? <Reports {...commonProps} /> : <div className="p-8 text-center">Access to Reports is Denied</div>)}
            {page === 'estimates' && (canHaveAccessTo('estimates') ? <Estimates {...commonProps} /> : <div className="p-8 text-center">Access to Estimates is Denied</div>)}
            {page === 'admin' && (canHaveAccessTo('admin') ? <Admin {...commonProps} /> : <div className="p-8 text-center">Access Denied</div>)}
            {page === 'auditLogs' && (canHaveAccessTo('auditLogs') ? <AuditLogs {...commonProps} /> : <div className="p-8 text-center">Access Denied</div>)}
            {page === 'billing' && (canHaveAccessTo('billing') ? <Billing {...commonProps} refreshUser={refreshUser} /> : <div className="p-8 text-center">Access Denied</div>)}
            {page === 'organization' && (canHaveAccessTo('organization') ? <OrgProfile t={t} refreshUser={refreshUser} embedded /> : <div className="p-8 text-center">Access Denied</div>)}
            {page === 'profile' && <Profile {...commonProps} onChangePassword={changePassword} refreshUser={refreshUser} embedded />}
          </Suspense>
        </main>
        <SupportWidget t={t} />
      </div>
    </div>
    </CurrencyProvider>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/home" element={<MarketingPage />} />
        <Route path="/help" element={<HelpCenterPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route
          path="*"
          element={
            <ThemeProvider>
              <NotificationProvider>
                <MainApp />
              </NotificationProvider>
            </ThemeProvider>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
