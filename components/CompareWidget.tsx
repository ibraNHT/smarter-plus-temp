
import React from 'react';
import { useStoreOptional } from '../services/storeContext';
import { useTranslation } from '../services/i18nContext';
import { Link } from 'react-router-dom';
import { OfferImage } from '../components/OfferImage';
import { offerImageInBox } from '../utils/offerImageDisplay';
import { Layers, X, ArrowRight } from 'lucide-react';

export const CompareWidget: React.FC = () => {
  const store = useStoreOptional();
  const { t } = useTranslation();
  if (!store || !store.compareList) return null;

  const { compareList, removeFromCompare, clearCompare, offers } = store;

  if (compareList.length === 0) return null;

  const selectedOffers = compareList.map(id => offers.find(o => o.id === id)).filter(Boolean);

  return (
    <div
      className="fixed left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40 px-3 pt-3 pb-0 sm:px-4 sm:pt-4 animate-slide-up agm-compare-bar"
      style={{ bottom: 'var(--agm-tabbar, 0px)' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">

        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto w-full sm:w-auto scrollbar-thin">
           <div className="flex-shrink-0 flex items-center text-primary-700 font-bold mr-1 sm:mr-2">
              <Layers className="h-5 w-5 sm:h-6 sm:w-6 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">{t('compare.bar.title')}</span>
              <span className="sm:hidden text-sm">{compareList.length}</span>
           </div>

           {selectedOffers.map((offer: any) => (
              <div key={offer.id} className="relative group flex-shrink-0 w-10 h-10 sm:w-16 sm:h-16 bg-gray-100 rounded border border-gray-300 overflow-hidden">
                 <OfferImage src={offer.imageUrl} alt={offer.title} size="thumb" className={offerImageInBox} />
                 <button
                   onClick={() => removeFromCompare(offer.id)}
                   className="absolute top-0 right-0 z-[3] bg-red-500 text-white p-0.5 rounded-bl sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                   aria-label="Remove from compare"
                 >
                    <X className="h-3 w-3" />
                 </button>
              </div>
           ))}

           {compareList.length < 3 && (
              <div className="w-10 h-10 sm:w-16 sm:h-16 flex-shrink-0 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-[10px] sm:text-xs text-center p-1">
                 +{3 - compareList.length}
              </div>
           )}
        </div>

        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
           <button
             onClick={clearCompare}
             className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 flex-1 sm:flex-none whitespace-nowrap"
           >
              {t('compare.clear')}
           </button>
           <Link
             to="/compare"
             className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold text-white bg-primary-600 rounded hover:bg-primary-700 flex items-center justify-center flex-1 sm:flex-none shadow-md whitespace-nowrap"
           >
              {t('compare.btn')} <ArrowRight className="ml-2 h-4 w-4" />
           </Link>
        </div>
      </div>
    </div>
  );
};
