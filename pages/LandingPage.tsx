import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ShieldCheck, Truck, ShoppingBasket, Tractor } from 'lucide-react';
import { useTranslation } from '../services/i18nContext';
import { useStore } from '../services/storeContext';
import { SEO } from '../components/SEO';
import { SEO_PAGE_META } from '../services/seo/seoConfig';
import { buildOrganizationSchema, buildWebSiteSchema } from '../services/seo/schemaBuilders';
import { offerImageInBox } from '../utils/offerImageDisplay';
import { MarketType } from '../types';
import { getCategoryAvatar, CATEGORY_SCROLLER_ITEMS } from '../data/categoryVisuals';
import { useCurrency } from '../contexts/CurrencyContext';

const FEATURE_ICONS = [ShieldCheck, Truck, CheckCircle] as const;

export const LandingPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { offers, refreshOffers } = useStore();
  const { formatXaf } = useCurrency();
  const [catalogReady, setCatalogReady] = useState(offers.length > 0);

  useEffect(() => {
    let cancelled = false;
    refreshOffers().finally(() => {
      if (!cancelled) setCatalogReady(true);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only catalog warm
  }, []);

  const liveOffers = useMemo(() => {
    const published = offers.filter((o) => o.quantity > 0);
    const producers = published.filter((o) => o.marketType === MarketType.PRODUCER);
    const ati = published.filter((o) => o.marketType === MarketType.ATI);
    const mixed: typeof published = [];
    for (let i = 0; i < 6; i++) {
      if (producers[i]) mixed.push(producers[i]);
      if (mixed.length >= 6) break;
      if (ati[i]) mixed.push(ati[i]);
      if (mixed.length >= 6) break;
    }
    return mixed.slice(0, 6);
  }, [offers]);

  const categoryRibbon = useMemo(
    () => CATEGORY_SCROLLER_ITEMS.filter((c) => c !== 'All').slice(0, 8),
    [],
  );

  const features = [
    { nameKey: 'landing.features.verified', descKey: 'landing.features.verifiedDesc', icon: FEATURE_ICONS[0] },
    { nameKey: 'landing.features.logistics', descKey: 'landing.features.logisticsDesc', icon: FEATURE_ICONS[1] },
    { nameKey: 'landing.features.escrow', descKey: 'landing.features.escrowDesc', icon: FEATURE_ICONS[2] },
  ] as const;

  return (
    <div className="bg-white">
      <SEO
        title={SEO_PAGE_META.home.title}
        description={SEO_PAGE_META.home.description}
        url="/"
        locale={language}
        schema={[buildOrganizationSchema(), buildWebSiteSchema()]}
      />

      {/* Brand-first full-bleed hero */}
      <div className="relative min-h-[78vh] sm:min-h-[85vh] flex items-end sm:items-center bg-primary-950 overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="agm-hero-kenburns w-full h-full object-cover"
            src="/landing-hero.jpg"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950 via-primary-950/75 to-primary-900/40" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 pt-28 sm:py-24 lg:py-28">
          <p className="agm-page-in font-display text-green-300 text-sm sm:text-base font-semibold tracking-[0.2em] uppercase mb-3 sm:mb-4">
            {t('landing.brand')}
          </p>
          <h1 className="agm-page-in agm-stagger-1 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-3xl leading-[1.1]">
            {t('landing.hero.title')}
          </h1>
          <p className="agm-page-in agm-stagger-2 mt-4 sm:mt-5 text-base sm:text-lg text-primary-100 max-w-2xl">
            {t('landing.hero.subtitle')}
          </p>

          <div className="agm-page-in agm-stagger-3 mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <Link
              to="/market/producers"
              className="agm-btn-primary inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-400 text-primary-950 px-6 py-3.5 rounded-lg font-bold text-sm sm:text-base shadow-lg"
            >
              <Tractor className="h-5 w-5" aria-hidden />
              {t('landing.cta.browse')}
            </Link>
            <Link
              to="/market/ati"
              className="agm-btn-secondary inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 px-6 py-3.5 rounded-lg font-bold text-sm sm:text-base backdrop-blur-sm"
            >
              <ShoppingBasket className="h-5 w-5" aria-hidden />
              {t('landing.cta.shop')}
            </Link>
          </div>
        </div>
      </div>

      {/* Quiet category ribbon */}
      <div className="bg-primary-50/80 border-b border-primary-100 py-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-1">
            {categoryRibbon.map((cat) => (
              <Link
                key={cat}
                to={`/market/producers?category=${encodeURIComponent(cat)}`}
                className="flex-none flex flex-col items-center gap-1.5 w-16 group"
              >
                <img
                  src={getCategoryAvatar(cat)}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm group-hover:ring-primary-400 transition-all"
                />
                <span className="text-[10px] font-medium text-primary-800 text-center line-clamp-2 leading-tight">
                  {cat}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Live offers strip */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-primary-50/30 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">{t('landing.freshNearYou')}</h2>
              <p className="mt-1 text-sm sm:text-base text-gray-500">{t('landing.freshNearYouDesc')}</p>
            </div>
            <Link to="/market/producers" className="text-sm font-semibold text-primary-700 hover:text-primary-900 inline-flex items-center gap-1 agm-link-underline">
              {t('landing.seeAllOffers')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {!catalogReady && liveOffers.length === 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex-none w-56 h-64 rounded-xl agm-shimmer" />
              ))}
            </div>
          ) : liveOffers.length === 0 ? (
            <p className="text-gray-500 text-center py-10">{t('landing.noLiveOffers')}</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin">
              {liveOffers.map((offer) => (
                <Link
                  key={offer.id}
                  to={`/offer/${offer.id}`}
                  className="agm-card-lift flex-none snap-start w-56 sm:w-60 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-36 bg-gray-100 relative">
                    <img src={offer.imageUrl} alt="" className={offerImageInBox} />
                    <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                      offer.marketType === MarketType.ATI ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {offer.marketType === MarketType.ATI ? t('landing.card.retail') : t('landing.card.wholesale')}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[2.5rem]">{offer.title}</p>
                    <p className="mt-2 text-primary-700 font-bold">{formatXaf(offer.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features band — tinted, not generic white cards */}
      <section className="py-14 sm:py-20 bg-primary-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              {t('landing.features.title')}
            </h2>
            <p className="mt-3 text-primary-200 text-base sm:text-lg">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="mt-10 sm:mt-14 grid gap-8 sm:grid-cols-3">
            {features.map((item) => (
              <div key={item.nameKey} className="agm-page-in border-t border-primary-800 pt-6">
                <div className="flex items-center justify-center h-11 w-11 rounded-lg bg-primary-800 text-green-300">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-white">{t(item.nameKey)}</h3>
                <p className="mt-2 text-sm sm:text-base text-primary-200 leading-relaxed">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative py-14 sm:py-16 bg-primary-800 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(/categories/agriculture.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-primary-800/85" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {t('landing.closing.title')}
          </h2>
          <p className="mt-3 text-primary-100 text-sm sm:text-base">
            {t('landing.closing.subtitle')}
          </p>
          <Link
            to="/register"
            className="agm-btn-primary mt-8 inline-flex items-center justify-center gap-2 bg-white text-primary-900 px-6 py-3.5 rounded-lg font-bold text-sm sm:text-base shadow-lg hover:bg-primary-50"
          >
            {t('landing.createAccount')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
};
