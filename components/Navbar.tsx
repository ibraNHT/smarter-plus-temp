
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../services/storeContext';
import { useTranslation } from '../services/i18nContext';
import { UserRole } from '../types';
import { LogOut, Sprout, ShoppingBasket, Tractor, ShoppingCart, Globe, Wallet, Bell, X, User, MessageCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, cart, notifications, markNotificationsAsRead, chats } = useStore();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleNotifications = () => {
    if (!showNotifications) {
      markNotificationsAsRead();
    }
    setShowNotifications(!showNotifications);
  };

  const cartItemCount = cart.reduce((acc, item) => acc + item.cartQuantity, 0);
  
  // Filter user notifications
  const myNotifications = notifications.filter(n => n.userId === user?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  // Unread Chats (Very basic mock implementation for badge)
  const unreadChats = user ? chats.filter(c => c.participants.includes(user.id)).length : 0; // Simplified for demo

  const isActive = (path: string) => location.pathname === path ? 'text-primary-600 font-semibold border-b-2 border-primary-600' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50';
  const linkClass = (path: string) => `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive(path)}`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer">
              <Sprout className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">AgriMarket Connect</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {/* Marketplace Links - Visible to Guests, Clients, and Producers */}
              {(!user || user.role === UserRole.CLIENT || user.role === UserRole.PRODUCER) && (
                <>
                   <Link to="/market/producers" className={`flex items-center space-x-1 ${linkClass('/market/producers')}`}>
                      <Tractor className="h-4 w-4" />
                      <span>{t('nav.producerMarket')}</span>
                   </Link>
                   <Link to="/market/ati" className={`flex items-center space-x-1 ${linkClass('/market/ati')}`}>
                      <ShoppingBasket className="h-4 w-4" />
                      <span>{t('nav.atiStore')}</span>
                   </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <button 
              onClick={toggleLanguage} 
              className="flex items-center text-gray-500 hover:text-primary-600 px-2 py-1 rounded-md transition-colors"
            >
              <Globe className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium uppercase">{language}</span>
            </button>

            {/* Shopping Cart Icon - Visible to Clients/Producers (Hide for Guests until they add something, or keep visible to prompt login) */}
            {(user?.role === UserRole.CLIENT || user?.role === UserRole.PRODUCER || !user) && (
               <Link to="/cart" className="relative p-2 text-gray-400 hover:text-primary-600 transition-colors">
                 <ShoppingCart className="h-6 w-6" />
                 {cartItemCount > 0 && (
                   <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                     {cartItemCount}
                   </span>
                 )}
               </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-4">
                {/* Messages Link */}
                <Link to="/messages" className="relative p-2 text-gray-600 hover:text-primary-600 focus:outline-none" title={t('nav.messages')}>
                    <MessageCircle className="h-6 w-6" />
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={toggleNotifications}
                    className="relative p-2 text-gray-600 hover:text-primary-600 focus:outline-none"
                  >
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                         <h3 className="text-sm font-semibold text-gray-700">{t('nav.notifications')}</h3>
                         <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-500">
                           <X className="h-4 w-4" />
                         </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {myNotifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-gray-500">
                            {t('nav.noNotifs')}
                          </div>
                        ) : (
                          <ul>
                            {myNotifications.map((notif) => (
                              <li key={notif.id} className={`px-4 py-3 border-b border-gray-100 text-sm ${notif.isRead ? 'bg-white' : 'bg-blue-50'}`}>
                                <div onClick={() => { if(notif.link) navigate(notif.link); setShowNotifications(false); }} className={`${notif.link ? 'cursor-pointer' : ''}`}>
                                  <p className={`text-gray-800 ${!notif.isRead && 'font-semibold'}`}>{notif.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Link (replaces simple user name text) */}
                {user.role === UserRole.CLIENT && (
                  <Link to="/client/profile" className="flex items-center text-gray-600 hover:text-primary-600" title={t('nav.profile')}>
                    <User className="h-6 w-6" />
                  </Link>
                )}
                {user.role === UserRole.PRODUCER && (
                  <Link to="/producer/profile" className="flex items-center text-gray-600 hover:text-primary-600" title={t('nav.profile')}>
                    <User className="h-6 w-6" />
                  </Link>
                )}

                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-100">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                  title={t('nav.logout')}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium shadow-sm">
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile menu (basic implementation) */}
        <div className="sm:hidden border-t border-gray-200 pt-2 pb-2">
          <div className="flex flex-col space-y-1">
            {(!user || user.role === UserRole.CLIENT || user.role === UserRole.PRODUCER) && (
              <>
                <Link to="/market/producers" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">{t('nav.producerMarket')}</Link>
                <Link to="/market/ati" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">{t('nav.atiStore')}</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
