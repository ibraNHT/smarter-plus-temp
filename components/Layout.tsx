import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, DollarSign, Coins, Warehouse, Users, FileText, ClipboardPen, Shield, LogOut, Menu, ClipboardList, Bell, Sun, Moon, CreditCard, Building2
} from 'lucide-react';
import { getTranslated } from '../constants';
import { getAbsoluteImageUrl, apiFetch } from '../hooks/useAppData';
import { useTheme } from '../context/ThemeContext';

export const Sidebar = ({ page, setPage, isOpen, setIsOpen, user, logout, t, canAccessPage }: any) => {
  const allNavItems = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'income', icon: DollarSign },
    { id: 'expenses', icon: Coins },
    { id: 'inventory', icon: Warehouse },
    { id: 'hr', icon: Users },
    { id: 'reports', icon: FileText },
    { id: 'estimates', icon: ClipboardPen },
    { id: 'admin', icon: Shield },
    { id: 'organization', icon: Building2 },
    { id: 'billing', icon: CreditCard },
    { id: 'auditLogs', icon: ClipboardList },
  ];
  const navItems = typeof canAccessPage === 'function' ? allNavItems.filter((item) => canAccessPage(item.id)) : allNavItems;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-20 lg:hidden w-full h-full cursor-default border-0"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700 font-bold text-xl text-gray-900 dark:text-white">
          Smarter Panel
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setIsOpen(false); }}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${page === item.id ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {t(item.id)}
            </button>
          ))}
        </nav>
        {/* <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { setPage('profile'); setIsOpen(false); }}
            className="flex items-center gap-3 mb-4 w-full p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold shrink-0 overflow-hidden">
              {user?.profilePicUrl ? <img src={getAbsoluteImageUrl(user.profilePicUrl)} alt="User" className="w-full h-full object-cover" /> : user?.firstName?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 truncate">{t('profile')}</div>
            </div>
          </button>
          <button onClick={logout} className="w-full flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            {t('logout')}
          </button>
        </div> */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { setPage('profile'); setIsOpen(false); }}
            className="flex items-center gap-3 mb-0 w-full p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold shrink-0 overflow-hidden">
              {user?.profilePicUrl ? <img src={getAbsoluteImageUrl(user.profilePicUrl)} alt="User" className="w-full h-full object-cover" /> : user?.firstName?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 truncate">{t('profile')}</div>
            </div>
          </button>
          {/* Show the translator there for mobile devices only */}
          <div className="lg:hidden mb-2 flex items-center gap-6 w-auto">
            {/* <button onClick={logout} className="w-full flex items-center px-4 py-4 my-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <LogOut className="w-5 h-5 mr-3" />
              {t('logout')}
            </button> */}
            <select value={t('lang')} onChange={e => t.setLang(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-md text-sm p-2 mb-4 text-gray-900 dark:text-white">
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>
          </div>
          <button onClick={logout} className="w-full flex items-center px-4 py-0 mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            {t('logout')}
          </button>
        </div>
      </aside>
    </>
  );
};

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // ignore if AudioContext not supported
  }
}

export const Header = ({ setIsOpen, lang, setLang, currency, setCurrency, locations, locId, setLocId, t, isGlobalAdmin, hasMultiLoc, canViewNotifications }: any) => {
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; message?: string | null; createdAt: string; readAt?: string | null; location?: { id: string; en: string; fr: string }; actor?: { firstName: string; lastName: string } }>>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Fetch unread count for badge (unreadOnly=true); refetch when locId changes and every 60s
  useEffect(() => {
    if (!canViewNotifications) return;
    const fetchCount = () => {
      const params = new URLSearchParams({ limit: '1', page: '1', unreadOnly: 'true' });
      if (locId) params.set('locationId', locId);
      apiFetch(`/notifications?${params.toString()}`)
        .then((res: any) => setNotifCount(res?.pagination?.total ?? 0))
        .catch(() => setNotifCount(0));
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [canViewNotifications, locId]);

  useEffect(() => {
    if (!canViewNotifications || !notifOpen) return;
    setNotifLoading(true);
    const params = new URLSearchParams({ limit: '20' });
    if (locId) params.set('locationId', locId);
    apiFetch(`/notifications?${params.toString()}`)
      .then(async (res: any) => {
        const data = res?.data ?? [];
        setNotifications(data);
        if (data.length > 0) {
          playNotificationSound();
          const unreadIds = data.filter((n: any) => !n.readAt).map((n: any) => n.id);
          if (unreadIds.length > 0) {
            const now = new Date().toISOString();
            apiFetch('/notifications/mark-read', { method: 'POST', body: JSON.stringify({ ids: unreadIds }) })
              .then(() => {
                setNotifications((prev) => prev.map((n) => (unreadIds.includes(n.id) ? { ...n, readAt: now } : n)));
                const params = new URLSearchParams({ limit: '1', page: '1', unreadOnly: 'true' });
                if (locId) params.set('locationId', locId);
                return apiFetch(`/notifications?${params.toString()}`);
              })
              .then((r: any) => setNotifCount(r?.pagination?.total ?? 0))
              .catch(() => {});
          }
        }
      })
      .catch(() => setNotifications([]))
      .finally(() => setNotifLoading(false));
  }, [canViewNotifications, notifOpen, locId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    if (notifOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8 no-print">
      <button onClick={() => setIsOpen(true)} className="lg:hidden text-gray-600 dark:text-gray-400">
        <Menu className="w-6 h-6" />
      </button>
      <div className="hidden lg:flex items-center gap-3 text-lg font-medium text-gray-800 dark:text-gray-200">
        {locId === 'all' ? t('allLocations') : getTranslated(locations?.find((l: any) => l.id === locId), lang)}
        {!isOnline && (
          <span className="px-2 py-1 bg-yellow-600/20 text-yellow-500 text-xs font-semibold rounded-md border border-yellow-600/50 flex items-center gap-1">
            Offline Mode
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="relative p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500"
          aria-label={t('themeToggle')}
          title={theme === 'dark' ? t('lightMode') : t('darkMode')}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        {canViewNotifications && (
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              aria-label={t('notifications')}
            >
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold"
                  aria-label={`${notifCount} ${t('notifications')}`}
                >
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 sm:w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-medium text-sm text-gray-800 dark:text-gray-200">{t('notifications')}</div>
                {notifLoading ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-500 text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-500 text-sm">{t('noNotifications')}</div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((n) => {
                      const isUnread = !n.readAt;
                      return (
                        <li
                          key={n.id}
                          className={`p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 ${isUnread ? 'bg-blue-50 dark:bg-gray-700/30 border-l-2 border-l-blue-500' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            {isUnread && <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-hidden />}
                            <div className="min-w-0 flex-1">
                              <div className={`text-sm font-medium ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{n.title}</div>
                              {n.message && <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{n.message}</div>}
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {n.location ? getTranslated(n.location, lang) : ''} · {n.createdAt ? new Date(n.createdAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
        {!isOnline && (
          <span className="lg:hidden px-2 py-1 bg-yellow-600/20 text-yellow-500 text-xs font-semibold rounded-md border border-yellow-600/50">
            Offline
          </span>
        )}
        {hasMultiLoc && (
          <select
            value={locId || ''}
            onChange={e => setLocId(e.target.value)}
            className="bg-gray-100 dark:bg-gray-700 border-none rounded-md text-sm p-2 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
          >
            {isGlobalAdmin && <option value="all">{t('allLocations')}</option>}
            {locations?.map((l: any) => (
              <option key={l.id} value={l.id}>{getTranslated(l, lang)}</option>
            ))}
          </select>
        )}
        <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-gray-100 dark:bg-gray-700 border-none rounded-md text-sm p-2 text-gray-900 dark:text-white">
          <option value="XAF">XAF</option>
          <option value="USD">USD</option>
          <option value="CAD">CAD</option>
          <option value="EUR">EUR</option>
        </select>
        <select value={lang} onChange={e => setLang(e.target.value)} className="hidden lg:block bg-gray-100 dark:bg-gray-700 border-none rounded-md text-sm p-2 text-gray-900 dark:text-white">
          <option value="en">EN</option>
          <option value="fr">FR</option>
        </select>
      </div>
    </header>
  );
};