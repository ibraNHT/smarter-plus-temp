import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { AppToastContainer } from './components/AppToastContainer';
import { SupportChatWidget } from './components/SupportChatWidget';
import { CompareWidget } from './components/CompareWidget';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Register } from './pages/Register';
import { ProducerMarket } from './pages/marketplace/ProducerMarket';
import { AtiStore } from './pages/marketplace/AtiStore';
import { ProductDetails } from './pages/marketplace/ProductDetails';
import { ShoppingCart } from './pages/marketplace/ShoppingCart';
import { ComparePage } from './pages/marketplace/ComparePage';
import { StoreProvider, useStore, useStoreOptional } from './services/storeContext';
import { I18nProvider } from './services/i18nContext';
import { PublicRoute } from './components/PublicRoute';
import { PwaInstallProvider } from './contexts/PwaInstallContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { InstallAppBanner } from './components/InstallAppBanner';
import { ProducerPendingBanner } from './components/ProducerPendingBanner';
import { NativeRuntime } from './components/NativeRuntime';
import { getToken } from './services/apiService';
import { isWebAppSessionBlocked } from './services/authRoles';
import { isProducerDashboardUser } from './services/producerSession';
import { UserRole } from './types';
import { Spinner } from './components/Spinner';

const VerifyEmail = lazy(() =>
  import('./pages/auth/VerifyEmail').then((m) => ({ default: m.VerifyEmail })),
);
const RegisterProducer = lazy(() =>
  import('./pages/producer/RegisterProducer').then((m) => ({ default: m.RegisterProducer })),
);
const RegisterClient = lazy(() =>
  import('./pages/client/RegisterClient').then((m) => ({ default: m.RegisterClient })),
);
const ClientProfile = lazy(() =>
  import('./pages/client/ClientProfile').then((m) => ({ default: m.ClientProfile })),
);
const ProducerProfile = lazy(() =>
  import('./pages/producer/ProducerProfile').then((m) => ({ default: m.ProducerProfile })),
);
const ProducerDashboard = lazy(() =>
  import('./pages/producer/ProducerDashboard').then((m) => ({ default: m.ProducerDashboard })),
);
const ProducerAvailability = lazy(() =>
  import('./pages/producer/ProducerAvailability').then((m) => ({ default: m.ProducerAvailability })),
);
const CreateOffer = lazy(() =>
  import('./pages/producer/CreateOffer').then((m) => ({ default: m.CreateOffer })),
);
const WalletDashboard = lazy(() =>
  import('./pages/wallet/WalletDashboard').then((m) => ({ default: m.WalletDashboard })),
);
const ChatPage = lazy(() =>
  import('./pages/messages/ChatPage').then((m) => ({ default: m.ChatPage })),
);
const PublicProfile = lazy(() =>
  import('./pages/public/PublicProfile').then((m) => ({ default: m.PublicProfile })),
);
const Blog = lazy(() => import('./pages/footer/Blog').then((m) => ({ default: m.Blog })));
const FAQ = lazy(() => import('./pages/footer/FAQ').then((m) => ({ default: m.FAQ })));
const Jobs = lazy(() => import('./pages/footer/Company').then((m) => ({ default: m.Jobs })));
const Partners = lazy(() =>
  import('./pages/footer/Company').then((m) => ({ default: m.Partners })),
);
const Agents = lazy(() =>
  import('./pages/footer/Company').then((m) => ({ default: m.Agents })),
);
const Terms = lazy(() => import('./pages/footer/Legal').then((m) => ({ default: m.Terms })));
const Privacy = lazy(() => import('./pages/footer/Legal').then((m) => ({ default: m.Privacy })));
const AccountDeletion = lazy(() =>
  import('./pages/footer/AccountDeletion').then((m) => ({ default: m.AccountDeletion })),
);
const HelpCenterIndex = lazy(() =>
  import('./pages/footer/helpCenter/HelpCenterIndex').then((m) => ({ default: m.HelpCenterIndex })),
);
const HelpCenterArticle = lazy(() =>
  import('./pages/footer/helpCenter/HelpCenterArticle').then((m) => ({
    default: m.HelpCenterArticle,
  })),
);

const PRODUCER_ROUTE_ROLES = [UserRole.PRODUCER, UserRole.MANAGER];

const RouteFallback: React.FC = () => (
  <div className="flex justify-center items-center min-h-[40vh] py-16" role="status" aria-live="polite">
    <Spinner />
  </div>
);

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

const AUTH_FULLSCREEN_PREFIXES = ['/login', '/register', '/verify-email'];
const FOOTER_HIDDEN_PREFIXES = ['/messages', ...AUTH_FULLSCREEN_PREFIXES];

const OrderDeepLinkRedirect: React.FC = () => {
  const { user } = useStore();
  const { id } = useParams<{ id: string }>();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === UserRole.PRODUCER || (user.role === UserRole.MANAGER && user.producerId)) {
    return <Navigate to="/producer/dashboard" replace />;
  }
  const target = id
    ? `/client/profile?tab=orders&order=${encodeURIComponent(id)}`
    : '/client/profile?tab=orders';
  return <Navigate to={target} replace />;
};

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

const LegacyHashRouteRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const rewrite = () => {
      const raw = window.location.hash || '';
      if (!raw.startsWith('#/')) return;
      const withoutHash = raw.slice(1);
      const qIndex = withoutHash.indexOf('?');
      const pathPart = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;
      const queryPart = qIndex >= 0 ? withoutHash.slice(qIndex) : '';
      if (!pathPart.startsWith('/')) return;
      if (
        !pathPart.startsWith('/register') &&
        !pathPart.startsWith('/login') &&
        !pathPart.startsWith('/offer/') &&
        !pathPart.startsWith('/market/')
      ) {
        return;
      }
      const target = `${pathPart}${queryPart}`;
      window.history.replaceState(null, '', target);
      navigate(target, { replace: true });
    };
    rewrite();
    window.addEventListener('hashchange', rewrite);
    return () => window.removeEventListener('hashchange', rewrite);
  }, [navigate]);

  return null;
};

const AppShell: React.FC = () => {
  const location = useLocation();
  const hideFooter = FOOTER_HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p));
  const authFullscreen = AUTH_FULLSCREEN_PREFIXES.some((p) => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col overflow-x-hidden pb-[var(--agm-tabbar,0px)]">
      {!authFullscreen && <Navbar />}
      {!authFullscreen && <ProducerPendingBanner />}
      {!authFullscreen && <InstallAppBanner />}
      <ToastContainer />
      <AppToastContainer />
      {!authFullscreen && <SupportChatWidget />}
      {!authFullscreen && <CompareWidget />}
      <SupportDeepLinkHandler />
      <LegacyHashRouteRedirect />
      <RoleScopeBoundary>
        <main className="flex-grow w-full min-w-0">
          <div key={location.key} className="agm-page-in">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
                <Route path="/register/producer" element={<PublicRoute><RegisterProducer /></PublicRoute>} />
                <Route path="/register/client" element={<PublicRoute><RegisterClient /></PublicRoute>} />

                <Route path="/market/producers" element={<ProducerMarket />} />
                <Route path="/market/ati" element={<AtiStore />} />
                <Route path="/offer/:offerId" element={<ProductDetails />} />
                <Route path="/cart" element={<ShoppingCart />} />
                <Route path="/compare" element={<ComparePage />} />

                <Route path="/profile/producer/:id" element={<PublicProfile role="PRODUCER" />} />
                <Route path="/profile/client/:id" element={<PublicProfile role="CLIENT" />} />

                <Route path="/wallet" element={<GuardedRoute allowedRoles={[UserRole.CLIENT, UserRole.PRODUCER, UserRole.MANAGER]}><WalletDashboard /></GuardedRoute>} />
                <Route path="/messages" element={<GuardedRoute allowedRoles={[UserRole.CLIENT, UserRole.PRODUCER, UserRole.MANAGER]}><ChatPage /></GuardedRoute>} />
                <Route path="/messages/:chatId" element={<GuardedRoute allowedRoles={[UserRole.CLIENT, UserRole.PRODUCER, UserRole.MANAGER]}><ChatPage /></GuardedRoute>} />
                <Route path="/client/profile" element={<GuardedRoute allowedRoles={[UserRole.CLIENT]}><ClientProfile /></GuardedRoute>} />

                <Route path="/orders/:id" element={<OrderDeepLinkRedirect />} />

                <Route path="/producer/dashboard" element={<GuardedRoute allowedRoles={PRODUCER_ROUTE_ROLES}><ProducerDashboard /></GuardedRoute>} />
                <Route path="/producer/profile/:tab?" element={<GuardedRoute allowedRoles={PRODUCER_ROUTE_ROLES}><ProducerProfile /></GuardedRoute>} />
                <Route path="/producer/availability" element={<GuardedRoute allowedRoles={PRODUCER_ROUTE_ROLES}><ProducerAvailability /></GuardedRoute>} />
                <Route path="/producer/offers/new" element={<GuardedRoute allowedRoles={PRODUCER_ROUTE_ROLES}><CreateOffer /></GuardedRoute>} />
                <Route path="/producer/offers/edit/:offerId" element={<GuardedRoute allowedRoles={PRODUCER_ROUTE_ROLES}><CreateOffer /></GuardedRoute>} />

                <Route path="/blog" element={<Blog />} />
                <Route path="/help" element={<HelpCenterIndex />} />
                <Route path="/help/:topicId" element={<HelpCenterArticle />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/account-deletion" element={<AccountDeletion />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
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
        <CurrencyProvider>
          <PwaInstallProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <NativeRuntime />
              <AppShell />
            </Router>
          </PwaInstallProvider>
        </CurrencyProvider>
      </StoreProvider>
    </I18nProvider>
  );
};

export default App;
