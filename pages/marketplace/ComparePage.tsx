
import React, { useEffect, useState } from 'react';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, X, ShoppingCart, Check, XCircle } from 'lucide-react';
import { MarketType, OfferType } from '../../types';
import { comparePageAddQuantity, effectiveMinOrder } from '../../utils/offerCart';
import { ComparePageSkeleton } from '../../components/skeletons/ComparePageSkeleton';
import { OfferImage } from '../../components/OfferImage';
import { offerImageInBox } from '../../utils/offerImageDisplay';
import { ConfirmModal } from '../../components/ConfirmModal';
import { showAppToast } from '../../services/appToast';
import { SEO } from '../../components/SEO';
import { SEO_PAGE_META } from '../../services/seo/seoConfig';
import { useCurrency } from '../../contexts/CurrencyContext';
import { unitLabel } from '../../utils/unitLabel';

export const ComparePage: React.FC = () => {
  const { compareList, offers, producers, getAverageRating, removeFromCompare, addToCart, clearCart, clearCompare, refreshOffers, refreshProducers } = useStore();
  const { t, language } = useTranslation();
  const { formatXaf } = useCurrency();
  const navigate = useNavigate();
//upadted
  const hasCachedCatalog = offers.length > 0 && producers.length > 0;
  const [pageLoading, setPageLoading] = useState(!hasCachedCatalog);
  useEffect(() => {
    let cancelled = false;
    if (!hasCachedCatalog) setPageLoading(true);
    Promise.all([refreshOffers(), refreshProducers()]).finally(() => {
      if (!cancelled) setPageLoading(false);
    });
    return () => { cancelled = true; };
  }, []);
  const [pendingClear, setPendingClear] = useState<{ offer: any; qty: number } | null>(null);

  const selectedOffers = compareList.map(id => offers.find(o => o.id === id)).filter(Boolean) as any[];
  const compareStillLoading =
    pageLoading && compareList.length > 0 && selectedOffers.length < compareList.length;

  if (compareStillLoading) {
    return (
      <ComparePageSkeleton onBack={() => navigate(-1)} title={t('compare.page.title')} />
    );
  }

  if (selectedOffers.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center agm-empty-wash px-4 text-center">
         <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">{t('compare.empty')}</h2>
         <p className="text-gray-500 text-sm mb-6 max-w-md">{t('compare.emptyHint')}</p>
         <div className="flex flex-col sm:flex-row gap-3">
           <button onClick={() => navigate('/market/producers')} className="agm-btn-primary px-5 py-2.5 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700">
              {t('compare.browseMarket')}
           </button>
           <button onClick={() => navigate(-1)} className="agm-btn-secondary px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">
              {t('product.back')}
           </button>
         </div>
      </div>
    );
  }

  const allOffersAreAti =
     selectedOffers.length > 0 && selectedOffers.every(o => o.marketType === MarketType.ATI);

  const getProducerName = (producerId: string) => {
     const p = producers.find(prod => prod.id === producerId);
     return p ? (p.type === 'BUSINESS' ? p.name : `${p.firstName} ${p.lastName}`) : t('compare.unknown');
  };

  const handleCompareAddToCart = (offer: (typeof selectedOffers)[number]) => {
    const canonical = offers.find((o) => o.id === offer.id) ?? offer;
    if (canonical.type === OfferType.SERVICE) {
      navigate(`/product/${canonical.id}`);
      return;
    }
    const qty = comparePageAddQuantity(canonical);
    const result = addToCart(canonical, qty);
    if (!result.success && result.error === 'OWN_OFFER') {
      showAppToast(t('compare.ownOfferError'), 'WARNING');
      return;
    }
    if (!result.success && result.error === 'PRODUCER_CONFLICT') {
      setPendingClear({ offer: canonical, qty });
    } else {
      navigate('/cart');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-32">
      <SEO
        title={SEO_PAGE_META.compare.title}
        description={SEO_PAGE_META.compare.description}
        url="/compare"
        noindex
        locale={language}
      />
       <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3 flex-wrap">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-primary-600 font-medium text-sm sm:text-base">
             <ArrowLeft className="h-5 w-5 mr-1 sm:mr-2" /> {t('product.back')}
          </button>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
             <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('compare.page.title')}</h1>
             <button onClick={clearCompare} className="text-sm text-red-600 hover:underline">{t('compare.clear')}</button>
          </div>
       </div>

       <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-lg bg-white">
          <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
                <tr>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      {t('compare.attribute')}
                   </th>
                   {selectedOffers.map(offer => (
                      <th key={offer.id} scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-900 min-w-[250px] relative group">
                         <button 
                           onClick={() => removeFromCompare(offer.id)}
                           className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <X className="h-5 w-5" />
                         </button>
                         <div className="h-32 mb-3 rounded overflow-hidden bg-gray-100 relative">
                            <OfferImage src={offer.imageUrl} alt={offer.title} size="card" className={offerImageInBox} />
                         </div>
                         <div className="line-clamp-2 h-10">{offer.title}</div>
                      </th>
                   ))}
                </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.price')}</td>
                   {selectedOffers.map(offer => (
                      <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-lg font-bold text-primary-600">
                         {formatXaf(offer.price)}
                      </td>
                   ))}
                </tr>
                <tr>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.unit')}</td>
                   {selectedOffers.map(offer => (
                      <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {unitLabel(t, offer.unit)}
                      </td>
                   ))}
                </tr>
                <tr>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.minOrder')}</td>
                   {selectedOffers.map(offer => (
                      <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {effectiveMinOrder(offer)} {unitLabel(t, offer.unit)}
                      </td>
                   ))}
                </tr>
                {/* Producer row is hidden when everything being compared comes from the
                    ATI store: those offers are first-party, so `getProducerName` resolves
                    to the staff member who created the listing — an internal name that
                    must never surface to buyers. In a mixed comparison the row stays (the
                    marketplace offers need it) but ATI columns show the store of record. */}
                {!allOffersAreAti && (
                   <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.producer')}</td>
                      {selectedOffers.map(offer => (
                         <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {offer.marketType === MarketType.ATI
                               ? t('product.atiStoreName')
                               : getProducerName(offer.producerId)}
                         </td>
                      ))}
                   </tr>
                )}
                <tr>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.rating')}</td>
                   {selectedOffers.map(offer => {
                      const rating = getAverageRating(offer.producerId);
                      return (
                         <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm text-yellow-500 flex items-center">
                            <Star className="h-4 w-4 fill-current mr-1" /> {rating > 0 ? rating : t('compare.ratingFallback')}
                         </td>
                      )
                   })}
                </tr>
                <tr>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.delivery')}</td>
                   {selectedOffers.map(offer => (
                      <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm">
                         {offer.isDeliveryAvailable ? (
                            <span className="text-green-600 flex items-center"><Check className="h-4 w-4 mr-1"/> {t('compare.available')}</span>
                         ) : (
                            <span className="text-gray-500 flex items-center"><XCircle className="h-4 w-4 mr-1"/> {t('compare.pickupOnly')}</span>
                         )}
                      </td>
                   ))}
                </tr>
                <tr>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.category')}</td>
                   {selectedOffers.map(offer => (
                      <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {offer.category}
                      </td>
                   ))}
                </tr>
                <tr>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.action')}</td>
                   {selectedOffers.map(offer => (
                      <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm">
                         <button 
                           type="button"
                           onClick={() => handleCompareAddToCart(offer)}
                           className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                         >
                            <ShoppingCart className="h-4 w-4 mr-2" /> {t('product.addToCart')}
                         </button>
                      </td>
                   ))}
                </tr>
             </tbody>
          </table>
       </div>

       <ConfirmModal
         open={pendingClear !== null}
         tone="warning"
         title={t('cart.confirmClearTitle')}
         description={t('cart.confirmClearBody')}
         confirmLabel={t('cart.confirmClearConfirm')}
         onClose={() => setPendingClear(null)}
         onConfirm={() => {
           if (!pendingClear) return;
           clearCart();
           addToCart(pendingClear.offer, pendingClear.qty);
           setPendingClear(null);
           navigate('/cart');
         }}
       />
    </div>
  );
};
