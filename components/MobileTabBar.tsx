import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, ShoppingBasket, Tractor, User, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '../services/i18nContext';
import { UserRole } from '../types';
import { isProducerDashboardUser } from '../services/producerSession';

const marketplaceVisible = (user: { role?: UserRole } | null) =>
  !user || user.role === UserRole.CLIENT || isProducerDashboardUser(user);

type Tab = {
  to: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  badge?: number;
};

type MobileTabBarProps = {
  user: { role?: UserRole } | null;
  unreadChatTotal: number;
};

const pathActive = (pathname: string, to: string) => {
  if (to === '/messages') return pathname === '/messages' || pathname.startsWith('/messages/');
  if (to.startsWith('/producer/profile')) return pathname.startsWith('/producer/profile');
  if (to === '/client/profile') return pathname.startsWith('/client/profile');
  if (to === '/login') return pathname === '/login' || pathname.startsWith('/register');
  return pathname === to;
};

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ user, unreadChatTotal }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const tabs: Tab[] = [];
  if (marketplaceVisible(user)) {
    tabs.push(
      {
        to: '/market/producers',
        icon: Tractor,
        label: t('nav.producerMarket'),
        active: pathActive(pathname, '/market/producers'),
      },
      {
        to: '/market/ati',
        icon: ShoppingBasket,
        label: t('nav.atiStore'),
        active: pathActive(pathname, '/market/ati'),
      },
    );
  }
  if (user) {
    tabs.push({
      to: '/messages',
      icon: MessageCircle,
      label: t('nav.messages'),
      active: pathActive(pathname, '/messages'),
      badge: unreadChatTotal,
    });
    if (user.role === UserRole.CLIENT || isProducerDashboardUser(user)) {
      tabs.push({
        to: '/wallet',
        icon: Wallet,
        label: t('nav.wallet'),
        active: pathActive(pathname, '/wallet'),
      });
    }
    tabs.push({
      to: user.role === UserRole.CLIENT ? '/client/profile' : '/producer/profile/info',
      icon: User,
      label: t('nav.profile'),
      active: pathActive(
        pathname,
        user.role === UserRole.CLIENT ? '/client/profile' : '/producer/profile/info',
      ),
    });
  } else {
    tabs.push({
      to: '/login',
      icon: User,
      label: t('nav.login'),
      active: pathActive(pathname, '/login'),
    });
  }

  if (tabs.length === 0) return null;

  return (
    <nav
      className="agm-tab-bar md:hidden fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      aria-label="Primary"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch min-h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex-1 min-w-0">
              <Link
                to={tab.to}
                aria-current={tab.active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-11 px-1 py-1.5 text-center ${
                  tab.active ? 'text-primary-600' : 'text-gray-500'
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden />
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 inline-flex min-h-[1rem] min-w-[1rem] items-center justify-center px-1 text-[9px] font-bold leading-none text-white bg-red-600 rounded-full">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </span>
                <span className="text-[10px] leading-tight font-medium line-clamp-2 px-0.5">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
