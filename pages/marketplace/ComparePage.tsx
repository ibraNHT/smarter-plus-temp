
import React from 'react';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, X, ShoppingCart, Check, XCircle } from 'lucide-react';

export const ComparePage: React.FC = () => {
  const { compareList, offers, producers, getAverageRating, removeFromCompare, addToCart, clearCompare } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const selectedOffers = compareList.map(id => offers.find(o => o.id === id)).filter(Boolean) as any[];

  if (selectedOffers.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50">
         <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('compare.empty')}</h2>
         <button onClick={() => navigate(-1)} className="text-primary-600 hover:underline font-medium">
            {t('product.back')}
         </button>
      </div>
    );
  }

  const getProducerName = (producerId: string) => {
     const p = producers.find(prod => prod.id === producerId);
     return p ? (p.type === 'BUSINESS' ? p.name : `${p.firstName} ${p.lastName}`) : 'Unknown';
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-32">
       <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-primary-600 font-medium">
             <ArrowLeft className="h-5 w-5 mr-2" /> {t('product.back')}
          </button>
          <div className="flex items-center gap-4">
             <h1 className="text-2xl font-bold text-gray-900">{t('compare.page.title')}</h1>
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
                         <div className="h-32 mb-3 rounded overflow-hidden bg-gray-100">
                            <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" />
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
                         {offer.price.toLocaleString()} XAF
                      </td>
                   ))}
                </tr>
                <tr>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.unit')}</td>
                   {selectedOffers.map(offer => (
                      <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {t(`unit.${offer.unit}`)}
                      </td>
                   ))}
                </tr>
                <tr>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.minOrder')}</td>
                   {selectedOffers.map(offer => (
                      <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {offer.minQuantity} {t(`unit.${offer.unit}`)}
                      </td>
                   ))}
                </tr>
                <tr>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.producer')}</td>
                   {selectedOffers.map(offer => (
                      <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {getProducerName(offer.producerId)}
                      </td>
                   ))}
                </tr>
                <tr>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.rating')}</td>
                   {selectedOffers.map(offer => {
                      const rating = getAverageRating(offer.producerId);
                      return (
                         <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm text-yellow-500 flex items-center">
                            <Star className="h-4 w-4 fill-current mr-1" /> {rating > 0 ? rating : 'N/A'}
                         </td>
                      )
                   })}
                </tr>
                <tr>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">{t('compare.delivery')}</td>
                   {selectedOffers.map(offer => (
                      <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm">
                         {offer.isDeliveryAvailable ? (
                            <span className="text-green-600 flex items-center"><Check className="h-4 w-4 mr-1"/> Available</span>
                         ) : (
                            <span className="text-gray-500 flex items-center"><XCircle className="h-4 w-4 mr-1"/> Pickup Only</span>
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
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 bg-gray-50">Action</td>
                   {selectedOffers.map(offer => (
                      <td key={offer.id} className="px-6 py-4 whitespace-nowrap text-sm">
                         <button 
                           onClick={() => addToCart(offer, offer.minQuantity || 1)}
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
    </div>
  );
};
