
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

import { StoreProvider } from './services/storeContext';
import { I18nProvider } from './services/i18nContext';
import { PublicRoute } from './components/PublicRoute';
import { PwaInstallProvider } from './contexts/PwaInstallContext';
import { InstallAppBanner } from './components/InstallAppBanner';

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
                <Route path="/wallet" element={<WalletDashboard />} />
                <Route path="/messages" element={<ChatPage />} />
                <Route path="/messages/:chatId" element={<ChatPage />} />
                <Route path="/client/profile" element={<ClientProfile />} />

                {/* Producer Routes */}
                <Route path="/producer/dashboard" element={<ProducerDashboard />} />
                <Route path="/producer/profile" element={<ProducerProfile />} />
                <Route path="/producer/availability" element={<ProducerAvailability />} />
                <Route path="/producer/offers/new" element={<CreateOffer />} />
                <Route path="/producer/offers/edit/:offerId" element={<CreateOffer />} />

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
              <Footer />
            </div>
          </Router>
        </PwaInstallProvider>
      </StoreProvider>
    </I18nProvider>
  );
};

export default App;
