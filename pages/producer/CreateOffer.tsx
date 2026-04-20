
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { OfferType, UnitOfMeasure, MarketType, Offer } from '../../types';
import { generateProductDescription } from '../../services/geminiService';
import { Sparkles, Loader2, Camera, MapPin, Clock } from 'lucide-react';

export const CreateOffer: React.FC = () => {
  const { createOffer, updateOffer, getOfferById, user, producers } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId: string }>();
  
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [existingOffer, setExistingOffer] = useState<Offer | undefined>(undefined);

  // Get current producer
  const currentProducer = producers.find(p => p.id === user?.producerId);
  const registeredLocation = currentProducer?.locations?.[0]?.address || '';
  
  // Get Categories from Producer Profile
  const producerProductionTypes = currentProducer?.productionTypes || [];
  // If producer has specific types, use them. Otherwise default to a broad list.
  const availableCategories = producerProductionTypes.length > 0 
      ? producerProductionTypes 
      : ['Agriculture', 'Livestock farming', 'Fish Farming', 'Vegetables', 'Processed foods', 'Equipment', 'Service'];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: availableCategories[0] || 'Agriculture',
    type: OfferType.PRODUCT,
    unit: UnitOfMeasure.KG,
    quantity: 0,
    minQuantity: 1,
    maxQuantity: 0, // 0 means unlimited (up to total stock)
    price: 0,
    features: '', // Used for AI prompt
    offerLocation: registeredLocation,
    isNegotiable: false,
    isDeliveryAvailable: true,
    serviceDuration: 1 // Default 1 hour
  });

  useEffect(() => {
    // Ensure location is set when producer data loads
    if (!formData.offerLocation && registeredLocation) {
      setFormData(prev => ({ ...prev, offerLocation: registeredLocation }));
    }
  }, [registeredLocation]);

  useEffect(() => {
    if (offerId) {
      const offer = getOfferById(offerId);
      if (offer) {
        if (offer.producerId !== user?.producerId) {
            navigate('/producer/dashboard'); // Security check
            return;
        }
        setExistingOffer(offer);
        setFormData({
          title: offer.title,
          description: offer.description,
          category: offer.category,
          type: offer.type,
          unit: offer.unit,
          quantity: offer.quantity,
          minQuantity: offer.minQuantity || 1,
          maxQuantity: offer.maxQuantity || 0,
          price: offer.price,
          features: '',
          offerLocation: offer.offerLocation || registeredLocation,
          isNegotiable: offer.isNegotiable,
          isDeliveryAvailable: offer.isDeliveryAvailable,
          serviceDuration: offer.serviceDuration || 1
        });
      }
    }
  }, [offerId, getOfferById, navigate, user?.producerId, registeredLocation]);

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.features) return;
    setLoadingAI(true);
    const desc = await generateProductDescription(formData.title, formData.category, formData.features);
    setFormData(prev => ({ ...prev, description: desc }));
    setLoadingAI(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (formData.maxQuantity > 0 && formData.maxQuantity < formData.minQuantity) {
      setSubmitError('Maximum order quantity cannot be less than Minimum order quantity.');
      return;
    }

    const offerData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      type: formData.type,
      unit: formData.unit,
      quantity: Number(formData.quantity),
      minQuantity: Number(formData.minQuantity),
      maxQuantity: Number(formData.maxQuantity) || undefined,
      price: Number(formData.price),
      offerLocation: formData.offerLocation,
      isNegotiable: formData.isNegotiable,
      isDeliveryAvailable: formData.isDeliveryAvailable,
      serviceDuration: formData.type === OfferType.SERVICE ? Number(formData.serviceDuration) : undefined
    };

    setSubmitting(true);
    try {
      if (existingOffer) {
        const result = await updateOffer({
          ...existingOffer,
          ...offerData
        });
        if (!result.success) {
          setSubmitError(result.error ?? 'Could not update the offer.');
          return;
        }
      } else {
        const result = await createOffer({
          ...offerData,
          marketType: MarketType.PRODUCER,
          imageUrl: `https://picsum.photos/400/300?random=${Date.now()}`,
        });
        if (!result.success) {
          setSubmitError(result.error ?? 'Could not publish the offer.');
          return;
        }
      }
      navigate('/producer/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  const isEditMode = !!existingOffer;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
       <h1 className="text-3xl font-bold text-gray-900 mb-8">{isEditMode ? t('form.editOffer') : t('nav.newOffer')}</h1>
       
       <form onSubmit={handleSubmit} aria-busy={submitting} className="space-y-8 divide-y divide-gray-200 bg-white p-8 shadow rounded-lg">
         {submitError && (
           <div className="rounded-md bg-red-50 p-4 border border-red-200 text-sm text-red-800" role="alert">
             {submitError}
           </div>
         )}
         <div className="space-y-6">
           
           <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
             <div className="sm:col-span-6">
               <label className="block text-sm font-medium text-gray-700 mb-2">Offer Type</label>
               <div className="flex space-x-4">
                  <label className={`flex-1 border rounded-md p-4 cursor-pointer hover:bg-gray-50 text-center ${formData.type === OfferType.PRODUCT ? 'ring-2 ring-primary-500 border-transparent bg-primary-50' : ''}`}>
                    <input 
                      type="radio" 
                      name="offerType" 
                      value={OfferType.PRODUCT}
                      checked={formData.type === OfferType.PRODUCT}
                      onChange={() => setFormData({ ...formData, type: OfferType.PRODUCT, unit: UnitOfMeasure.KG })}
                      className="sr-only"
                    />
                    <span className="font-bold block text-gray-900">Product</span>
                    <span className="text-xs text-gray-500">Physical goods with stock</span>
                  </label>
                  <label className={`flex-1 border rounded-md p-4 cursor-pointer hover:bg-gray-50 text-center ${formData.type === OfferType.SERVICE ? 'ring-2 ring-primary-500 border-transparent bg-primary-50' : ''}`}>
                    <input 
                      type="radio" 
                      name="offerType" 
                      value={OfferType.SERVICE}
                      checked={formData.type === OfferType.SERVICE}
                      onChange={() => setFormData({ ...formData, type: OfferType.SERVICE, unit: UnitOfMeasure.HOUR })}
                      className="sr-only"
                    />
                    <span className="font-bold block text-gray-900">Service</span>
                    <span className="text-xs text-gray-500">Time-based (Rental, Labor)</span>
                  </label>
               </div>
             </div>

             <div className="sm:col-span-4">
               <label className="block text-sm font-medium text-gray-700">Title</label>
               <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900" 
                 value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Organic Red Onions"
               />
             </div>

             {/* Category Dropdown - Filtered by Producer Profile */}
             <div className="sm:col-span-2">
               <label className="block text-sm font-medium text-gray-700">{t('form.category')}</label>
               <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                 value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
               >
                 {availableCategories.map(cat => (
                   <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
                 ))}
               </select>
             </div>

             {/* AI Section */}
             <div className="sm:col-span-6 bg-blue-50 p-4 rounded-md border border-blue-100">
               <div className="flex items-center justify-between mb-2">
                 <label className="block text-sm font-medium text-blue-900">AI Helper (Gemini)</label>
                 <Sparkles className="h-4 w-4 text-blue-500" />
               </div>
               <p className="text-xs text-blue-700 mb-3">Enter key features (comma separated) and let AI write your description.</p>
               <div className="flex gap-2">
                 <input type="text" className="block w-full border border-blue-200 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900" 
                    placeholder="e.g. sweet, crunchy, grown without pesticides, harvest 2023"
                    value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})}
                 />
                 <button type="button" onClick={handleGenerateDescription} disabled={loadingAI || !formData.features}
                   className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                 >
                   {loadingAI ? <Loader2 className="animate-spin h-4 w-4" /> : 'Generate'}
                 </button>
               </div>
             </div>

             <div className="sm:col-span-6">
               <label className="block text-sm font-medium text-gray-700">{t('form.desc')}</label>
               <textarea rows={3} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                 value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
               />
             </div>
             
             {/* SERVICE SPECIFIC FIELD */}
             {formData.type === OfferType.SERVICE && (
               <div className="sm:col-span-6 bg-yellow-50 p-4 rounded border border-yellow-200">
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                    <h4 className="text-sm font-bold text-yellow-800">Service Configuration</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-medium text-gray-700">Duration per Slot (Hours)</label>
                       <input type="number" min="1" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
                          value={formData.serviceDuration} onChange={e => setFormData({...formData, serviceDuration: Number(e.target.value)})}
                       />
                     </div>
                     <div>
                       <p className="text-xs text-gray-500 mt-5">Clients will book timeslots of this duration based on your Availability Calendar.</p>
                     </div>
                  </div>
               </div>
             )}

             <div className="sm:col-span-2">
               <label className="block text-sm font-medium text-gray-700">{t('form.price')} (XAF)</label>
               <input type="number" required min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                 value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})}
               />
             </div>

             <div className="sm:col-span-2">
               <label className="block text-sm font-medium text-gray-700">{formData.type === OfferType.SERVICE ? 'Available Slots/Capacity' : t('form.quantity')}</label>
               <input type="number" required min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                  value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
               />
             </div>

             <div className="sm:col-span-2">
               <label className="block text-sm font-medium text-gray-700">{t('form.unit')}</label>
               <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                 value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as UnitOfMeasure})}
               >
                 {Object.values(UnitOfMeasure).map(u => <option key={u} value={u}>{t(`unit.${u}`)}</option>)}
               </select>
             </div>

             {/* Order Limits */}
             <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">{t('form.minOrder')}</label>
                <input type="number" min="1" required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                  value={formData.minQuantity} onChange={e => setFormData({...formData, minQuantity: Number(e.target.value)})}
                />
                <p className="mt-1 text-xs text-gray-500">Minimum amount a client can buy.</p>
             </div>
             <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">{t('form.maxOrder')}</label>
                <input type="number" min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                  value={formData.maxQuantity} onChange={e => setFormData({...formData, maxQuantity: Number(e.target.value)})}
                />
                <p className="mt-1 text-xs text-gray-500">Maximum amount per client (0 = Unlimited).</p>
             </div>

             {/* Location Selection */}
             <div className="sm:col-span-6">
               <label className="block text-sm font-medium text-gray-700">{t('form.location')}</label>
               <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <MapPin className="h-5 w-5 text-gray-400" />
                 </div>
                 <select 
                   className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                   value={formData.offerLocation}
                   onChange={e => setFormData({...formData, offerLocation: e.target.value})}
                 >
                   <option value={registeredLocation}>My Location: {registeredLocation}</option>
                   {/* Future: Add more locations here */}
                 </select>
               </div>
               <p className="mt-1 text-xs text-gray-500">Select where this product is shipping from.</p>
             </div>

             {/* Toggles */}
             <div className="sm:col-span-3 flex items-center">
               <div className="flex items-center h-5">
                 <input
                   id="isNegotiable"
                   name="isNegotiable"
                   type="checkbox"
                   className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                   checked={formData.isNegotiable}
                   onChange={e => setFormData({...formData, isNegotiable: e.target.checked})}
                 />
               </div>
               <div className="ml-3 text-sm">
                 <label htmlFor="isNegotiable" className="font-medium text-gray-700">{t('form.negotiable')}</label>
                 <p className="text-gray-500">Allow clients to negotiate the price.</p>
               </div>
             </div>

             <div className="sm:col-span-3 flex items-center">
               <div className="flex items-center h-5">
                 <input
                   id="isDeliveryAvailable"
                   name="isDeliveryAvailable"
                   type="checkbox"
                   className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                   checked={formData.isDeliveryAvailable}
                   onChange={e => setFormData({...formData, isDeliveryAvailable: e.target.checked})}
                 />
               </div>
               <div className="ml-3 text-sm">
                 <label htmlFor="isDeliveryAvailable" className="font-medium text-gray-700">{t('form.deliveryAvailable')}</label>
                 <p className="text-gray-500">You can deliver this item/service.</p>
               </div>
             </div>

             {!isEditMode && (
               <div className="sm:col-span-6">
                 <label className="block text-sm font-medium text-gray-700">Product Image</label>
                 <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-white">
                   <div className="space-y-1 text-center">
                     <Camera className="mx-auto h-12 w-12 text-gray-400" />
                     <div className="flex text-sm text-gray-600">
                       <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                         <span>Upload a photo</span>
                         <input type="file" className="sr-only" />
                       </label>
                     </div>
                     <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                   </div>
                 </div>
               </div>
             )}

           </div>
         </div>

         <div className="pt-5">
           <div className="flex justify-end">
             <button
               type="button"
               onClick={() => navigate('/producer/dashboard')}
               disabled={submitting}
               className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {t('form.cancel')}
             </button>
             <button
               type="submit"
               disabled={submitting}
               className="ml-3 inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed min-w-[7rem]"
             >
               {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : isEditMode ? t('form.update') : t('form.publish')}
             </button>
           </div>
         </div>
       </form>
    </div>
  );
};
