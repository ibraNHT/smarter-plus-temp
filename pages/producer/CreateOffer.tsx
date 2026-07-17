
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { OfferType, UnitOfMeasure, MarketType, Offer } from '../../types';
import { generateProductDescription } from '../../services/geminiService';
import { uploadOfferImage } from '../../services/uploadService';
import { offerImageInBox } from '../../utils/offerImageDisplay';
import NumberStepper from '../../components/NumberStepper';
import { Sparkles, Loader2, Camera, MapPin, Clock, X, AlertTriangle } from 'lucide-react';
import { isProducerPendingApproval } from '../../utils/producerAccountStatus';
import { MARKETPLACE_CATEGORIES, isServiceCategory } from '../../data/categories';
import { useCurrency } from '../../contexts/CurrencyContext';
import { BASE_CURRENCY, SUPPORTED_CURRENCIES, currencyLabel } from '../../utils/formatMoney';
import { z } from 'zod';

const SERVICE_UNITS = new Set<UnitOfMeasure>([
  UnitOfMeasure.HOUR,
  UnitOfMeasure.DAY,
  UnitOfMeasure.JOB,
]);
const PRODUCT_DEFAULT_UNIT = UnitOfMeasure.KG;
const SERVICE_DEFAULT_UNIT = UnitOfMeasure.HOUR;
const createOfferSchema = (t: (key: string) => string) => z.object({
  title: z.string().trim().min(3, t('validation.titleMin')),
  description: z.string().trim().min(10, t('validation.descriptionMinTen')),
  category: z.string().trim().min(1, t('validation.categoryRequired')),
  unit: z.string().trim().min(1, t('validation.unitRequired')),
  price: z.number().min(1, t('validation.pricePositive')),
  quantity: z.number().min(1, t('validation.quantityMin')),
  minQuantity: z.number().min(1, t('validation.minOrderMin')),
  maxQuantity: z.number().min(0, t('validation.maxOrderNegative')),
  offerLocation: z.string().trim().min(2, t('validation.locationRequired')),
  imageUrl: z.string().trim().min(1, t('validation.imageRequired')),
  type: z.nativeEnum(OfferType),
  serviceDuration: z.number(),
}).superRefine((data, ctx) => {
  if (data.maxQuantity > 0 && data.maxQuantity < data.minQuantity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['maxQuantity'],
      message: t('validation.maxBelowMin'),
    });
  }
  if (data.type === OfferType.SERVICE && data.serviceDuration < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['serviceDuration'],
      message: t('validation.serviceDurationMin'),
    });
  }
});

const normalizeOfferType = (
  rawType: unknown,
  rawUnit: unknown,
  rawCategory: unknown,
  rawServiceDuration: unknown,
): OfferType => {
  const typeValue = String(rawType ?? '').toUpperCase();
  if (typeValue === OfferType.PRODUCT || typeValue === OfferType.SERVICE) {
    return typeValue as OfferType;
  }
  const hasServiceUnit = SERVICE_UNITS.has(rawUnit as UnitOfMeasure);
  const hasServiceCategory = isServiceCategory(String(rawCategory ?? '').trim());
  const serviceDuration = Number(rawServiceDuration ?? 0);
  if (hasServiceUnit || hasServiceCategory || serviceDuration > 0) {
    return OfferType.SERVICE;
  }
  return OfferType.PRODUCT;
};

export const CreateOffer: React.FC = () => {
  const { createOffer, updateOffer, getOfferById, user, producers } = useStore();
  const { t } = useTranslation();
  const { toXaf, rates, currency: preferredCurrency } = useCurrency();
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId: string }>();
  
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [existingOffer, setExistingOffer] = useState<Offer | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Get current producer
  const currentProducer = producers.find(p => p.id === user?.producerId);
  const registeredLocation = currentProducer?.locations?.[0]?.address || '';
  
  // Get Categories from Producer Profile
  const producerProductionTypes = currentProducer?.productionTypes || [];
  // If producer has specific types, use them. Otherwise default to a broad list.
  const allAvailableCategories = useMemo(
    () => {
      // An offer must belong to a sector the producer actually selected in their
      // profile — so list ONLY their registered production types, not the full
      // catalog. Fall back to the full list only when the producer has no sectors
      // yet, so they can still create an offer.
      return producerProductionTypes.length > 0
        ? Array.from(new Set(producerProductionTypes))
        : Array.from(MARKETPLACE_CATEGORIES);
    },
    [producerProductionTypes],
  );
  const productCategories = useMemo(
    () => allAvailableCategories.filter(cat => !isServiceCategory(cat)),
    [allAvailableCategories],
  );
  const serviceCategories = useMemo(
    () => allAvailableCategories.filter(cat => isServiceCategory(cat)),
    [allAvailableCategories],
  );
  const fallbackProductCategory = productCategories[0] || 'Agriculture';
  const fallbackServiceCategory = serviceCategories[0] || 'General Services';
  const selectableProductCategories = productCategories.length > 0 ? productCategories : [fallbackProductCategory];
  const selectableServiceCategories = serviceCategories.length > 0 ? serviceCategories : [fallbackServiceCategory];
  const hasInitializedEditForm = useRef(false);
  const firstFieldErrorRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: fallbackProductCategory,
    type: OfferType.PRODUCT,
    unit: PRODUCT_DEFAULT_UNIT,
    quantity: 0,
    minQuantity: 1,
    maxQuantity: 0, // 0 means unlimited (up to total stock)
    price: 0,
    listingCurrency: preferredCurrency || BASE_CURRENCY,
    features: '', // Used for AI prompt
    offerLocation: registeredLocation,
    isNegotiable: false,
    isDeliveryAvailable: true,
    serviceDuration: 1 // Default 1 hour
  });

  const estimatedXaf = useMemo(
    () => toXaf(Number(formData.price) || 0, formData.listingCurrency),
    [formData.price, formData.listingCurrency, toXaf, rates],
  );
  useEffect(() => {
    // Ensure location is set when producer data loads
    if (!formData.offerLocation && registeredLocation) {
      setFormData(prev => ({ ...prev, offerLocation: registeredLocation }));
    }
  }, [registeredLocation]);

  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      firstFieldErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [fieldErrors]);

  useEffect(() => {
    hasInitializedEditForm.current = false;
  }, [offerId]);

  useEffect(() => {
    if (offerId) {
      if (hasInitializedEditForm.current) return;
      const offer = getOfferById(offerId);
      if (offer) {
        if (offer.producerId !== user?.producerId) {
            navigate('/producer/dashboard'); // Security check
            return;
        }
        const normalizedType = normalizeOfferType(
          offer.type,
          offer.unit,
          offer.category,
          offer.serviceDuration,
        );
        const normalizedCategory =
          normalizedType === OfferType.SERVICE
            ? (selectableServiceCategories.includes(offer.category) ? offer.category : fallbackServiceCategory)
            : (selectableProductCategories.includes(offer.category) ? offer.category : fallbackProductCategory);
        const normalizedUnit =
          normalizedType === OfferType.SERVICE
            ? (SERVICE_UNITS.has(offer.unit) ? offer.unit : SERVICE_DEFAULT_UNIT)
            : (SERVICE_UNITS.has(offer.unit) ? PRODUCT_DEFAULT_UNIT : offer.unit);
        setExistingOffer(offer);
        setImageUrl(offer.imageUrl ?? '');
        setImageUrls(offer.imageUrls ?? []);
        setFormData({
          title: offer.title,
          description: offer.description,
          category: normalizedCategory,
          type: normalizedType,
          unit: normalizedUnit,
          quantity: offer.quantity,
          minQuantity: offer.minQuantity || 1,
          maxQuantity: offer.maxQuantity || 0,
          price: offer.listingPrice ?? offer.price,
          listingCurrency: offer.listingCurrency || BASE_CURRENCY,
          features: '',
          offerLocation: offer.offerLocation || registeredLocation,
          isNegotiable: offer.isNegotiable,
          isDeliveryAvailable: offer.isDeliveryAvailable,
          serviceDuration: normalizedType === OfferType.SERVICE ? (offer.serviceDuration || 1) : 0
        });
        hasInitializedEditForm.current = true;
      }
    }
  }, [offerId, getOfferById, navigate, user?.producerId, registeredLocation, fallbackProductCategory, fallbackServiceCategory, selectableProductCategories, selectableServiceCategories]);

  const allOfferImages = imageUrl ? [imageUrl, ...imageUrls] : [...imageUrls];

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setImageError(t('form.imageTypeAccepted'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError(t('form.imageSizeLimit'));
      return;
    }
    if (allOfferImages.length >= 3) {
      setImageError(t('form.maxImagesPerOffer'));
      return;
    }
    setImageError(null);
    setImageUploading(true);
    try {
      const url = await uploadOfferImage(file);
      if (!imageUrl) {
        setImageUrl(url);
      } else {
        setImageUrls(prev => [...prev, url]);
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : t('form.uploadFailed'));
    } finally {
      setImageUploading(false);
    }
  };

  const removeOfferImage = (index: number) => {
    if (index === 0 && imageUrl) {
      if (imageUrls.length > 0) {
        setImageUrl(imageUrls[0]);
        setImageUrls(prev => prev.slice(1));
      } else {
        setImageUrl('');
      }
    } else {
      const adjustedIdx = imageUrl ? index - 1 : index;
      setImageUrls(prev => prev.filter((_, i) => i !== adjustedIdx));
    }
  };

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
    setFieldErrors({});

    // Backend DTO requires `maxQuantity` as a number. Using `|| undefined` for 0 omitted the field
    // in JSON, which caused 400 validation errors for "unlimited" (0) max order.
    const maxQ = Math.max(0, Math.floor(Number(formData.maxQuantity) || 0));
    const offerLocation =
      String(formData.offerLocation ?? registeredLocation ?? '').trim() || t('form.locationNotSet');

    const listingPrice = Number(formData.price);
    const listingCurrency = formData.listingCurrency || BASE_CURRENCY;
    const offerData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      type: formData.type,
      unit: formData.unit,
      quantity: Number(formData.quantity),
      minQuantity: Number(formData.minQuantity),
      maxQuantity: maxQ,
      price: toXaf(listingPrice, listingCurrency),
      listingCurrency,
      listingPrice,
      offerLocation,
      isNegotiable: formData.isNegotiable,
      isDeliveryAvailable: formData.isDeliveryAvailable,
      serviceDuration: formData.type === OfferType.SERVICE ? Number(formData.serviceDuration) : 0
    };

    if (imageUploading) {
      setSubmitError(t('form.waitImageUpload'));
      return;
    }
    const validation = createOfferSchema(t).safeParse({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      unit: formData.unit,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      minQuantity: Number(formData.minQuantity),
      maxQuantity: Number(formData.maxQuantity),
      offerLocation,
      imageUrl,
      type: formData.type,
      serviceDuration: Number(formData.serviceDuration),
    });
    if (!validation.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (existingOffer) {
        const result = await updateOffer({
          ...existingOffer,
          ...offerData,
          imageUrl,
          imageUrls,
        });
        if (!result.success) {
          setSubmitError(result.error ?? t('form.updateOfferFailed'));
          return;
        }
      } else {
        const result = await createOffer({
          ...offerData,
          marketType: MarketType.PRODUCER,
          imageUrl,
          imageUrls,
        });
        if (!result.success) {
          setSubmitError(result.error ?? t('form.publishOfferFailed'));
          return;
        }
      }
      navigate('/producer/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  const isEditMode = !!existingOffer;
  const isPendingApproval = isProducerPendingApproval(user, currentProducer);

  if (isPendingApproval && !isEditMode) {
    return (
      <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 sm:p-8 text-center shadow-sm">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" aria-hidden />
          <h1 className="text-xl font-bold text-amber-900">{t('producerStatus.pendingTitle')}</h1>
          <p className="text-sm text-amber-800 mt-2 max-w-lg mx-auto">{t('producerStatus.cannotPublishYet')}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/producer/profile/info')}
              className="inline-flex justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              {t('producerStatus.completeVerification')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/producer/dashboard')}
              className="inline-flex justify-center rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50"
            >
              {t('producerStatus.goToDashboard')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
       <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">{isEditMode ? t('form.editOffer') : t('nav.newOffer')}</h1>

       <form onSubmit={handleSubmit} aria-busy={submitting} className="space-y-6 sm:space-y-8 divide-y divide-gray-200 bg-white p-4 sm:p-6 md:p-8 shadow rounded-lg">
        {submitError && (
           <div
             className="rounded-md bg-red-50 p-4 border border-red-200 text-sm text-red-800"
             role="alert"
           >
             {submitError}
           </div>
         )}
         <div className="space-y-6">
           
           <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
             <div className="sm:col-span-6">
               <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.offerType')}</label>
               <div className="flex space-x-4">
                  <label className={`flex-1 border rounded-md p-4 cursor-pointer hover:bg-gray-50 text-center ${formData.type === OfferType.PRODUCT ? 'ring-2 ring-primary-500 border-transparent bg-primary-50' : ''}`}>
                    <input 
                      type="radio" 
                      name="offerType" 
                      value={OfferType.PRODUCT}
                      checked={formData.type === OfferType.PRODUCT}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          type: OfferType.PRODUCT,
                          unit: PRODUCT_DEFAULT_UNIT,
                          category: selectableProductCategories.includes(formData.category)
                            ? formData.category
                            : fallbackProductCategory,
                          serviceDuration: 0,
                        })
                      }
                      className="sr-only"
                    />
                    <span className="font-bold block text-gray-900">{t('form.product')}</span>
                    <span className="text-xs text-gray-500">{t('form.productDesc')}</span>
                  </label>
                  <label className={`flex-1 border rounded-md p-4 cursor-pointer hover:bg-gray-50 text-center ${formData.type === OfferType.SERVICE ? 'ring-2 ring-primary-500 border-transparent bg-primary-50' : ''}`}>
                    <input 
                      type="radio" 
                      name="offerType" 
                      value={OfferType.SERVICE}
                      checked={formData.type === OfferType.SERVICE}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          type: OfferType.SERVICE,
                          unit: SERVICE_DEFAULT_UNIT,
                          category: selectableServiceCategories.includes(formData.category)
                            ? formData.category
                            : fallbackServiceCategory,
                          serviceDuration: formData.serviceDuration > 0 ? formData.serviceDuration : 1,
                        })
                      }
                      className="sr-only"
                    />
                    <span className="font-bold block text-gray-900">{t('form.service')}</span>
                    <span className="text-xs text-gray-500">{t('form.serviceDesc')}</span>
                  </label>
               </div>
             </div>

             <div className="sm:col-span-4">
               <label className="block text-sm font-medium text-gray-700">{t('form.title')}</label>
               <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900" 
                 value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder={t('form.titlePlaceholder')}
               />
              {fieldErrors.title && <p ref={firstFieldErrorRef} className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
             </div>

             {/* Category Dropdown - Filtered by Producer Profile */}
             <div className="sm:col-span-2">
               <label className="block text-sm font-medium text-gray-700">{t('form.category')}</label>
               <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                 value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
               >
                 {(formData.type === OfferType.SERVICE ? selectableServiceCategories : selectableProductCategories).map(cat => (
                   <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
                 ))}
               </select>
              {fieldErrors.category && <p className="mt-1 text-xs text-red-600">{fieldErrors.category}</p>}
             </div>

             {/* AI Section */}
             <div className="sm:col-span-6 bg-blue-50 p-4 rounded-md border border-blue-100">
               <div className="flex items-center justify-between mb-2">
                 <label className="block text-sm font-medium text-blue-900">{t('form.aiHelper')}</label>
                 <Sparkles className="h-4 w-4 text-blue-500" />
               </div>
               <p className="text-xs text-blue-700 mb-3">{t('form.aiHint')}</p>
               <div className="flex flex-col sm:flex-row gap-2">
                 <input type="text" className="block w-full min-w-0 border border-blue-200 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900" 
                    placeholder={t('form.featuresPlaceholder')}
                    value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})}
                 />
                 <button type="button" onClick={handleGenerateDescription} disabled={loadingAI || !formData.features}
                   className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 flex-shrink-0"
                 >
                   {loadingAI ? <Loader2 className="animate-spin h-4 w-4" /> : t('form.generate')}
                 </button>
               </div>
             </div>

             <div className="sm:col-span-6">
               <label className="block text-sm font-medium text-gray-700">{t('form.desc')}</label>
               <textarea rows={3} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                 value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
               />
              {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>}
             </div>
             
             {/* SERVICE SPECIFIC FIELD */}
             {formData.type === OfferType.SERVICE && (
               <div className="sm:col-span-6 bg-yellow-50 p-4 rounded border border-yellow-200">
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                    <h4 className="text-sm font-bold text-yellow-800">{t('form.serviceConfig')}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-medium text-gray-700">{t('form.durationPerSlot')}</label>
                       <NumberStepper min={1} required value={formData.serviceDuration}
                          onChange={n => setFormData({...formData, serviceDuration: n})}
                       />
                       {fieldErrors.serviceDuration && <p className="mt-1 text-xs text-red-600">{fieldErrors.serviceDuration}</p>}
                     </div>
                     <div>
                       <p className="text-xs text-gray-500 mt-5">{t('form.durationHint')}</p>
                     </div>
                  </div>
               </div>
             )}

             <div className="sm:col-span-2 space-y-3">
               <div>
                 <label className="block text-sm font-medium text-gray-700">{t('form.listingCurrency')}</label>
                 <select
                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
                   value={formData.listingCurrency}
                   onChange={e => setFormData({ ...formData, listingCurrency: e.target.value })}
                   aria-label={t('form.listingCurrencyAria')}
                 >
                   {SUPPORTED_CURRENCIES.map((code) => (
                     <option key={code} value={code}>
                       {code === 'XAF' || code === 'XOF' ? `${code} — ${currencyLabel(code)}` : `${code}`}
                     </option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">
                   {t('form.price')} ({formData.listingCurrency})
                 </label>
                 <NumberStepper
                   min={0}
                   required
                   value={formData.price}
                    placeholder={t('form.pricePlaceholder', { currency: formData.listingCurrency })}
                    ariaLabel={t('form.priceAriaLabel', { currency: formData.listingCurrency })}
                   onChange={n => setFormData({...formData, price: n})}
                 />
                 {formData.listingCurrency !== BASE_CURRENCY && Number(formData.price) > 0 && (
                   <p className="mt-1 text-xs text-gray-500">
                     ≈ {estimatedXaf.toLocaleString()} {currencyLabel(BASE_CURRENCY)} (platform settlement)
                   </p>
                 )}
                 {fieldErrors.price && <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>}
               </div>
             </div>

             <div className="sm:col-span-2">
               <label className="block text-sm font-medium text-gray-700">{formData.type === OfferType.SERVICE ? t('form.availableCapacity') : t('form.quantity')}</label>
               <NumberStepper min={1} required value={formData.quantity}
                  onChange={n => setFormData({...formData, quantity: n})}
               />
               {fieldErrors.quantity && <p className="mt-1 text-xs text-red-600">{fieldErrors.quantity}</p>}
             </div>

             <div className="sm:col-span-2">
               <label className="block text-sm font-medium text-gray-700">{t('form.unit')}</label>
               <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                 value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as UnitOfMeasure})}
               >
                 {Object.values(UnitOfMeasure)
                   .filter((u) =>
                     formData.type === OfferType.SERVICE
                       ? SERVICE_UNITS.has(u as UnitOfMeasure)
                       : !SERVICE_UNITS.has(u as UnitOfMeasure),
                   )
                   .map(u => <option key={u} value={u}>{t(`unit.${u}`)}</option>)}
               </select>
             </div>

             {/* Order Limits */}
             <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">{t('form.minOrder')}</label>
                <NumberStepper min={1} required value={formData.minQuantity}
                  onChange={n => setFormData({...formData, minQuantity: n})}
                />
                <p className="mt-1 text-xs text-gray-500">{t('form.minOrderHint')}</p>
                {fieldErrors.minQuantity && <p className="mt-1 text-xs text-red-600">{fieldErrors.minQuantity}</p>}
             </div>
             <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">{t('form.maxOrder')}</label>
                <NumberStepper min={0} value={formData.maxQuantity}
                  onChange={n => setFormData({...formData, maxQuantity: n})}
                />
                <p className="mt-1 text-xs text-gray-500">{t('form.maxOrderHint')}</p>
                {fieldErrors.maxQuantity && <p className="mt-1 text-xs text-red-600">{fieldErrors.maxQuantity}</p>}
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
                   <option value={registeredLocation}>{t('form.myLocation' + ' ')} {registeredLocation}</option>
                   {/* Future: Add more locations here */}
                 </select>
               </div>
               <p className="mt-1 text-xs text-gray-500">{t('form.locationHint')}</p>
              {fieldErrors.offerLocation && <p className="mt-1 text-xs text-red-600">{fieldErrors.offerLocation}</p>}
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
                 <p className="text-gray-500">{t('form.negotiateHint')}</p>
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
                 <p className="text-gray-500">{t('form.deliveryHint')}</p>
               </div>
             </div>

             <div className="sm:col-span-6">
               <label className="block text-sm font-medium text-gray-700">
                 {formData.type === OfferType.SERVICE ? t('form.services') : t('form.products')} <span className="text-gray-400 font-normal">({allOfferImages.length}/3)</span>
               </label>
               {allOfferImages.length > 0 ? (
                 <div className="mt-2 flex flex-wrap items-start gap-3">
                   {allOfferImages.map((url, idx) => (
                     <div key={url + idx} className="relative h-28 w-28 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                       <img src={url} alt={t('form.offerImageAlt', { number: idx + 1 })} className={offerImageInBox} />
                       <button
                         type="button"
                         onClick={() => removeOfferImage(idx)}
                         className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white hover:bg-black/75"
                         aria-label={t('form.removeImageAria')}
                       >
                         <X className="h-3 w-3" />
                       </button>
                       {idx === 0 && <span className="absolute left-1 bottom-1 bg-primary-600 text-white text-[10px] px-1 rounded">{t('form.mainImage')}</span>}
                     </div>
                   ))}
                   {allOfferImages.length < 3 && (
                     <label className={`flex h-28 w-28 flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors ${imageUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                       <Camera className="h-6 w-6 mb-1" />
                       <span className="text-xs">{imageUploading ? t('form.uploading') : t('form.addImage')}</span>
                       <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={imageUploading} onChange={handleImagePick} />
                     </label>
                   )}
                 </div>
               ) : (
                 <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-white">
                   <div className="space-y-1 text-center">
                     {imageUploading ? (
                       <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-500" />
                     ) : (
                       <Camera className="mx-auto h-12 w-12 text-gray-400" />
                     )}
                     <div className="flex text-sm text-gray-600">
                       <label className={`relative bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 ${imageUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
                         <span>{imageUploading ? t('form.uploading') : t('form.uploadPhotos')}</span>
                         <input
                           type="file"
                           accept="image/png,image/jpeg,image/webp"
                           className="sr-only"
                           disabled={imageUploading}
                           onChange={handleImagePick}
                         />
                       </label>
                     </div>
                     <p className="text-xs text-gray-500">{t('form.imageFormatHint')}</p>
                   </div>
                 </div>
               )}
               {imageError && (
                 <p className="mt-1 text-xs text-red-600">{imageError}</p>
               )}
              {fieldErrors.imageUrl && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.imageUrl}</p>
              )}
             </div>

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
