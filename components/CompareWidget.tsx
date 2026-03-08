
import React from 'react';
import { useStoreOptional } from '../services/storeContext';
import { useTranslation } from '../services/i18nContext';
import { Link } from 'react-router-dom';
import { Layers, X, ArrowRight } from 'lucide-react';

export const CompareWidget: React.FC = () => {
  const store = useStoreOptional();
  const { t } = useTranslation();
  if (!store || !store.compareList) return null;

  const { compareList, removeFromCompare, clearCompare, offers } = store;

  if (compareList.length === 0) return null;

  const selectedOffers = compareList.map(id => offers.find(o => o.id === id)).filter(Boolean);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40 p-4 animate-slide-up">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
           <div className="flex-shrink-0 flex items-center text-primary-700 font-bold mr-2">
              <Layers className="h-6 w-6 mr-2" />
              <span className="hidden sm:inline">{t('compare.bar.title')}</span>
              <span className="sm:hidden">Compare ({compareList.length})</span>
           </div>
           
           {selectedOffers.map((offer: any) => (
              <div key={offer.id} className="relative group flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded border border-gray-300 overflow-hidden">
                 <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" />
                 <button 
                   onClick={() => removeFromCompare(offer.id)}
                   className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                    <X className="h-3 w-3" />
                 </button>
              </div>
           ))}
           
           {compareList.length < 3 && (
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs text-center p-1">
                 {3 - compareList.length} left
              </div>
           )}
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
           <button 
             onClick={clearCompare}
             className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 flex-1 sm:flex-none"
           >
              {t('compare.clear')}
           </button>
           <Link 
             to="/compare"
             className="px-6 py-2 text-sm font-bold text-white bg-primary-600 rounded hover:bg-primary-700 flex items-center justify-center flex-1 sm:flex-none shadow-md"
           >
              {t('compare.btn')} <ArrowRight className="ml-2 h-4 w-4" />
           </Link>
        </div>
      </div>
    </div>
  );
};
