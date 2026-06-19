
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { AppToastContainer } from './components/AppToastContainer';
import { SupportChatWidget } from './components/SupportChatWidget';
import { CompareWidget } from './components/CompareWidget'; // New
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { RegisterProducer } from './pages/producer/RegisterProducer';
import { RegisterClient } from './pages/client/RegisterClient';
import { ClientProfile } from './pages/client/ClientProfile';
import { ProducerProfile } from './pages/producer/ProducerProfile';
import { ProducerDashboard } from './pages/producer/ProducerDashboard';
import { ProducerAvailability } from './pages/producer/ProducerAvailability';
import { CreateOffer } from './pages/producer/CreateOffer';
import { ProducerMarket } from './pages/marketplace/ProducerMarket';
import { AtiStore } from './pages/marketplace/AtiStore';
import { ProductDetails } from './pages/marketplace/ProductDetails';
import { ShoppingCart } from './pages/marketplace/ShoppingCart';
import { ComparePage } from './pages/marketplace/ComparePage'; // New
import { WalletDashboard } from './pages/wallet/WalletDashboard';
import { ChatPage } from './pages/messages/ChatPage';
import { PublicProfile } from './pages/public/PublicProfile';
// Static Pages
import { Blog } from './pages/footer/Blog';
import { FAQ } from './pages/footer/FAQ';
import { Jobs, Partners } from './pages/footer/Company';
import { Terms, Privacy } from './pages/footer/Legal';
import { HelpCenterIndex } from './pages/footer/helpCenter/HelpCenterIndex';
import { HelpCenterArticle } from './pages/footer/helpCenter/HelpCenterArticle';

import { StoreProvider, useStore, useStoreOptional } from './services/storeContext';
import { I18nProvider } from './services/i18nContext';
import { PublicRoute } from './components/PublicRoute';
import { PwaInstallProvider } from './contexts/PwaInstallContext';
import { InstallAppBanner } from './components/InstallAppBanner';
import { ProducerPendingBanner } from './components/ProducerPendingBanner';
import { getToken } from './services/apiService';
import { isWebAppSessionBlocked } from './services/authRoles';
import { isProducerDashboardUser } from './services/producerSession';
import { UserRole } from './types';

const PRODUCER_ROUTE_ROLES = [UserRole.PRODUCER, UserRole.MANAGER];

const RoleScopeBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useStoreOptional();
  const token = typeof window !== 'undefined' ? getToken() : null;
  if (isWebAppSessionBlocked(token, store?.user)) {
    return (
      <main className="max-w-3xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Use the Admin Panel for this account</h1>
        <p className="mt-3 text-gray-600">
          This app is for guests, clients, producers, and account managers with an assigned producer.
          Platform administrators should sign in to the admin console instead.
        </p>
      </main>
    );
  }
  return <>{children}</>;
};

const roleHome = (role: UserRole, user?: { producerId?: string } | null): string => {
  if (role === UserRole.PRODUCER || (role === UserRole.MANAGER && user?.producerId)) {
    return '/producer/dashboard';
  }
  if (role === UserRole.CLIENT) return '/client/profile';
  return '/market/producers';
};

const GuardedRoute: React.FC<{ children: React.ReactNode; allowedRoles: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useStore();

  if (!user) return <Navigate to="/login" replace />;

  const allowed =
    allowedRoles.includes(user.role) ||
    (allowedRoles.includes(UserRole.PRODUCER) && isProducerDashboardUser(user));

  if (!allowed) return <Navigate to={roleHome(user.role, user)} replace />;
  return <>{children}</>;
};

/**
 * Routes that use a full-screen auth layout (no global navbar/footer).
 */
const AUTH_FULLSCREEN_PREFIXES = ['/login', '/register', '/verify-email'];

/**
 * Pages where the global Footer would push content below the fold (e.g. full-height chat).
 */
const FOOTER_HIDDEN_PREFIXES = ['/messages', ...AUTH_FULLSCREEN_PREFIXES];

/**
 * Notifications/emails link to `/orders/:id` (e.g. "your proposal was accepted",
 * dispute filed). There is no standalone order page, so route the user to the
 * orders view that matches their role: clients land on their profile orders tab,
 * producers/managers on the dashboard. Falls back to login when signed out.
 */
const OrderDeepLinkRedirect: React.FC = () => {
  const { user } = useStore();
  const { id } = useParams<{ id: string }>();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === UserRole.PRODUCER || (user.role === UserRole.MANAGER && user.producerId)) {
    return <Navigate to="/producer/dashboard" replace />;
  }
  // Carry the order id so the client profile can open that specific order
  // (and surface its Pay action) instead of dropping the user on a generic list.
  const target = id
    ? `/client/profile?tab=orders&order=${encodeURIComponent(id)}`
    : '/client/profile?tab=orders';
  return <Navigate to={target} replace />;
};

/** Opens AgriBot when the user lands with ?openSupport=1 (e.g. from admin email/notification). */
const SupportDeepLinkHandler: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, openSupportChat } = useStore();

  useEffect(() => {
    if (searchParams.get('openSupport') !== '1') return;
    if (user) openSupportChat();
    const next = new URLSearchParams(searchParams);
    next.delete('openSupport');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, user, openSupportChat]);

  return null;
};

const AppShell: React.FC = () => {
  const location = useLocation();
  const hideFooter = FOOTER_HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p));
  const authFullscreen = AUTH_FULLSCREEN_PREFIXES.some((p) => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col overflow-x-hidden">
      {!authFullscreen && <Navbar />}
      {!authFullscreen && <ProducerPendingBanner />}
      {!authFullscreen && <InstallAppBanner />}
      <ToastContainer />
      <AppToastContainer />
      {!authFullscreen && <SupportChatWidget />}
      {!authFullscreen && <CompareWidget />}
      <SupportDeepLinkHandler />
      <RoleScopeBoundary>
        <main className="flex-grow w-full min-w-0">
          <div key={location.key} className="agm-page-in">
          <Routes>
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

            {/* Registration Routes */}
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
            <Route path="/register/producer" element={<PublicRoute><RegisterProducer /></PublicRoute>} />
            <Route path="/register/client" element={<PublicRoute><RegisterClient /></PublicRoute>} />

            {/* Marketplaces */}
            <Route path="/market/producers" element={<ProducerMarket />} />
            <Route path="/market/ati" element={<AtiStore />} />
            <Route path="/offer/:offerId" element={<ProductDetails />} />
            <Route path="/cart" element={<ShoppingCart />} />
            <Route path="/compare" element={<ComparePage />} />

            {/* Public Profiles */}
            <Route path="/profile/producer/:id" element={<PublicProfile role="PRODUCER" />} />
            <Route path="/profile/client/:id" element={<PublicProfile role="CLIENT" />} />

            {/* User Feature Routes */}
            <Route path="/wallet" element={<GuardedRoute allowedRoles={[UserRole.CLIENT, UserRole.PRODUCER, UserRole.MANAGER]}><WalletDashboard /></GuardedRoute>} />
            <Route path="/messages" element={<GuardedRoute allowedRoles={[UserRole.CLIENT, UserRole.PRODUCER, UserRole.MANAGER]}><ChatPage /></GuardedRoute>} />
            <Route path="/messages/:chatId" element={<GuardedRoute allowedRoles={[UserRole.CLIENT, UserRole.PRODUCER, UserRole.MANAGER]}><ChatPage /></GuardedRoute>} />
            <Route path="/client/profile" element={<GuardedRoute allowedRoles={[UserRole.CLIENT]}><ClientProfile /></GuardedRoute>} />

            {/* Order notification deep links → role-appropriate orders view */}
            <Route path="/orders/:id" element={<OrderDeepLinkRedirect />} />

            {/* Producer Routes */}
            <Route path="/producer/dashboard" element={<GuardedRoute allowedRoles={PRODUCER_ROUTE_ROLES}><ProducerDashboard /></GuardedRoute>} />
            <Route path="/producer/profile/:tab?" element={<GuardedRoute allowedRoles={PRODUCER_ROUTE_ROLES}><ProducerProfile /></GuardedRoute>} />
            <Route path="/producer/availability" element={<GuardedRoute allowedRoles={PRODUCER_ROUTE_ROLES}><ProducerAvailability /></GuardedRoute>} />
            <Route path="/producer/offers/new" element={<GuardedRoute allowedRoles={PRODUCER_ROUTE_ROLES}><CreateOffer /></GuardedRoute>} />
            <Route path="/producer/offers/edit/:offerId" element={<GuardedRoute allowedRoles={PRODUCER_ROUTE_ROLES}><CreateOffer /></GuardedRoute>} />

            {/* Footer Routes */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/help" element={<HelpCenterIndex />} />
            <Route path="/help/:topicId" element={<HelpCenterArticle />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </div>
        </main>
      </RoleScopeBoundary>
      {!hideFooter && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <I18nProvider>
      <StoreProvider>
        <PwaInstallProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppShell />
          </Router>
        </PwaInstallProvider>
      </StoreProvider>
    </I18nProvider>
  );
};

export default App;
// sadsa?