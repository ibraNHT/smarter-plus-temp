
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../services/storeContext';
import { useTranslation } from '../services/i18nContext';
import { usePwaInstall } from '../contexts/PwaInstallContext';
import { UserRole } from '../types';
import { getToken } from '../services/apiService';
import { isWebAppSessionBlocked } from '../services/authRoles';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { LogOut, Sprout, ShoppingBasket, Tractor, ShoppingCart, Globe, Bell, X, User, MessageCircle, ChevronDown, Download } from 'lucide-react';

const marketplaceVisible = (user: { role?: UserRole } | null) =>
  !user || user.role === UserRole.CLIENT || user.role === UserRole.PRODUCER;

export const Navbar: React.FC = () => {
  const { user, producers, clients, logout, cart, notifications, markNotificationsAsRead, chats } = useStore();
  const token = typeof window !== 'undefined' ? getToken() : null;
  const staffWrongApp = isWebAppSessionBlocked(token, user);
  const { t, language, setLanguage } = useTranslation();
  const { canInstall, promptInstall } = usePwaInstall();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const performLogout = async () => {
    await logout();
    setLogoutConfirmOpen(false);
    navigate('/');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    if (user.role === UserRole.PRODUCER) {
      const p = producers.find(x => x.userId === user.id || x.id === user.producerId);
      if (p) {
        if (p.name) return p.name;
        if (p.firstName) return `${p.firstName} ${p.lastName || ''}`.trim();
      }
    }
    if (user.role === UserRole.CLIENT) {
      const c = clients.find(x => x.userId === user.id);
      if (c) {
        if (c.name) return c.name;
        if (c.firstName) return `${c.firstName} ${c.lastName || ''}`.trim();
      }
    }
    return user.name;
  };

  // Close notifications & profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
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

  /** Sum of unread messages across chats for the signed-in user (from API `unreadCounts`). */
  const unreadChatTotal = useMemo(() => {
    if (!user?.id) return 0;
    return chats.reduce((sum, c) => {
      const n = Number(c.unreadCounts?.[user.id]);
      return sum + (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
    }, 0);
  }, [chats, user?.id]);

  const isActive = (path: string) => location.pathname === path ? 'text-primary-600 font-semibold border-b-2 border-primary-600' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50';
  const linkClass = (path: string) => `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive(path)}`;

  const getHomeLink = () => {
    if (staffWrongApp) return '/';
    if (!user) return '/';
    if (user.role === UserRole.PRODUCER) return '/producer/dashboard';
    return '/market/producers';
  };

  if (staffWrongApp) {
    return (
      <>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <Sprout className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">AgriMarket Connect</span>
            </Link>
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              <LogOut className="h-5 w-5" />
              {t('nav.logout')}
            </button>
          </div>
        </nav>
        <LogoutConfirmModal
          open={logoutConfirmOpen}
          onClose={() => setLogoutConfirmOpen(false)}
          onConfirm={performLogout}
        />
      </>
    );
  }

  return (
    <>
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={getHomeLink()} className="flex-shrink-0 flex items-center cursor-pointer">
              <Sprout className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">AgriMarket Connect</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {/* Marketplace Links - Visible to Guests, Clients, and Producers */}
              {marketplaceVisible(user) && (
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
            {(marketplaceVisible(user)) && (
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
                <Link
                  to="/messages"
                  className="relative p-2 text-gray-600 hover:text-primary-600 focus:outline-none"
                  title={unreadChatTotal > 0 ? `${t('nav.messages')} (${unreadChatTotal})` : t('nav.messages')}
                  aria-label={
                    unreadChatTotal > 0
                      ? `${t('nav.messages')}, ${unreadChatTotal} ${t('nav.messagesUnreadAria')}`
                      : t('nav.messages')
                  }
                >
                  <MessageCircle className="h-6 w-6" />
                  {unreadChatTotal > 0 && (
                    <span className="absolute top-0 right-0 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center px-1 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full ring-2 ring-white pointer-events-none">
                      {unreadChatTotal > 99 ? '99+' : unreadChatTotal}
                    </span>
                  )}
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
                                <div onClick={() => {
                                  if (notif.link) {
                                    const dest = notif.link.startsWith('/chat/') ? notif.link.replace('/chat/', '/messages/') : notif.link;
                                    navigate(dest);
                                  }
                                  setShowNotifications(false);
                                }} className={`${notif.link ? 'cursor-pointer' : ''}`}>
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

                {/* Profile menu: profile link + Install app (after banner dismiss) */}
                {(user.role === UserRole.CLIENT || user.role === UserRole.PRODUCER) && (
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((o) => !o)}
                      className="flex items-center text-gray-600 hover:text-primary-600 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-expanded={profileMenuOpen}
                      aria-haspopup="true"
                      title={t('nav.profile')}
                    >
                      <User className="h-6 w-6" />
                      <ChevronDown className="h-4 w-4 ml-0.5 hidden sm:inline opacity-70" />
                    </button>
                    {profileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                        <Link
                          to={user.role === UserRole.CLIENT ? '/client/profile' : '/producer/profile'}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          {t('nav.profile')}
                        </Link>
                        {canInstall && (
                          <button
                            type="button"
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            onClick={() => {
                              void promptInstall();
                              setProfileMenuOpen(false);
                            }}
                          >
                            <Download className="h-4 w-4 flex-shrink-0" />
                            {t('pwa.installMenu')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900">{getUserDisplayName()}</span>
                  <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-100">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(true)}
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
            {marketplaceVisible(user) && (
              <>
                <Link to="/market/producers" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">{t('nav.producerMarket')}</Link>
                <Link to="/market/ati" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">{t('nav.atiStore')}</Link>
              </>
            )}
            {!user && canInstall && (
              <button
                type="button"
                onClick={() => void promptInstall()}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-primary-700 hover:bg-primary-50 border border-primary-200 mt-1"
              >
                <Download className="h-5 w-5 flex-shrink-0" />
                {t('pwa.installMenu')}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
    <LogoutConfirmModal
      open={logoutConfirmOpen}
      onClose={() => setLogoutConfirmOpen(false)}
      onConfirm={performLogout}
    />
    </>
  );
};
