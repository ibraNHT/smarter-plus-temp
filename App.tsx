
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
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

import { StoreProvider, useStore, useStoreOptional } from './services/storeContext';
import { I18nProvider } from './services/i18nContext';
import { PublicRoute } from './components/PublicRoute';
import { PwaInstallProvider } from './contexts/PwaInstallContext';
import { InstallAppBanner } from './components/InstallAppBanner';
import { getToken } from './services/apiService';
import { isWebAppSessionBlocked } from './services/authRoles';
import { UserRole } from './types';

const RoleScopeBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useStoreOptional();
  const token = typeof window !== 'undefined' ? getToken() : null;
  if (isWebAppSessionBlocked(token, store?.user)) {
    return (
      <main className="max-w-3xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Use the Admin Panel for this account</h1>
        <p className="mt-3 text-gray-600">
          This app is for guests, clients, and producers. Retail/admin/manager staff accounts should sign in to
          the admin applications instead.
        </p>
      </main>
    );
  }
  return <>{children}</>;
};

const roleHome = (role: UserRole): string => {
  if (role === UserRole.PRODUCER) return '/producer/dashboard';
  if (role === UserRole.CLIENT) return '/client/profile';
  return '/market/producers';
};

const GuardedRoute: React.FC<{ children: React.ReactNode; allowedRoles: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useStore();

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <I18nProvider>
      <StoreProvider>
        <PwaInstallProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
              <Navbar />
              <InstallAppBanner />
              <ToastContainer />
              <SupportChatWidget />
              <CompareWidget />
              <RoleScopeBoundary>
              <main className="flex-grow pb-16 md:pb-0">
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
                <Route path="/wallet" element={<GuardedRoute allowedRoles={[UserRole.CLIENT, UserRole.PRODUCER]}><WalletDashboard /></GuardedRoute>} />
                <Route path="/messages" element={<GuardedRoute allowedRoles={[UserRole.CLIENT, UserRole.PRODUCER]}><ChatPage /></GuardedRoute>} />
                <Route path="/messages/:chatId" element={<GuardedRoute allowedRoles={[UserRole.CLIENT, UserRole.PRODUCER]}><ChatPage /></GuardedRoute>} />
                <Route path="/client/profile" element={<GuardedRoute allowedRoles={[UserRole.CLIENT]}><ClientProfile /></GuardedRoute>} />

                {/* Producer Routes */}
                <Route path="/producer/dashboard" element={<GuardedRoute allowedRoles={[UserRole.PRODUCER]}><ProducerDashboard /></GuardedRoute>} />
                <Route path="/producer/profile" element={<GuardedRoute allowedRoles={[UserRole.PRODUCER]}><ProducerProfile /></GuardedRoute>} />
                <Route path="/producer/availability" element={<GuardedRoute allowedRoles={[UserRole.PRODUCER]}><ProducerAvailability /></GuardedRoute>} />
                <Route path="/producer/offers/new" element={<GuardedRoute allowedRoles={[UserRole.PRODUCER]}><CreateOffer /></GuardedRoute>} />
                <Route path="/producer/offers/edit/:offerId" element={<GuardedRoute allowedRoles={[UserRole.PRODUCER]}><CreateOffer /></GuardedRoute>} />

                {/* Footer Routes */}
                <Route path="/blog" element={<Blog />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </main>
              </RoleScopeBoundary>
              <Footer />
            </div>
          </Router>
        </PwaInstallProvider>
      </StoreProvider>
    </I18nProvider>
  );
};

export default App;
