
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../services/i18nContext';
import { Sprout, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-primary-900 text-white border-t border-primary-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Sprout className="h-8 w-8 text-green-400" />
              <span className="ml-2 text-xl font-bold text-white">AgriMarket Connect</span>
            </div>
            <p className="text-primary-200 text-sm">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-primary-300 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-300 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-300 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-300 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Marketplace Column */}
          <div>
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4">
              {t('footer.col.markets')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/market/producers" className="text-base text-primary-100 hover:text-white transition-colors">
                  {t('nav.producerMarket')}
                </Link>
              </li>
              <li>
                <Link to="/market/ati" className="text-base text-primary-100 hover:text-white transition-colors">
                  {t('nav.atiStore')}
                </Link>
              </li>
              <li>
                <Link to="/register/producer" className="text-base text-primary-100 hover:text-white transition-colors">
                  {t('register.producer.btn')}
                </Link>
              </li>
              <li>
                <Link to="/register/client" className="text-base text-primary-100 hover:text-white transition-colors">
                  {t('register.client.btn')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4">
              {t('footer.col.company')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/partners" className="text-base text-primary-100 hover:text-white transition-colors">
                  {t('footer.link.partners')}
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="text-base text-primary-100 hover:text-white transition-colors">
                  {t('footer.link.jobs')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-base text-primary-100 hover:text-white transition-colors">
                  {t('footer.link.blog')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal Column */}
          <div>
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4">
              {t('footer.col.support')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-base text-primary-100 hover:text-white transition-colors">
                  {t('footer.link.faq')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-base text-primary-100 hover:text-white transition-colors">
                  {t('footer.link.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-base text-primary-100 hover:text-white transition-colors">
                  {t('footer.link.privacy')}
                </Link>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="mt-12 border-t border-primary-800 pt-8">
          <p className="text-base text-primary-300 text-center">
            &copy; {new Date().getFullYear()} AgriMarket Connect. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};
