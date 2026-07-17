
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { readReferralCodeFromLocation } from '../../utils/referralLink';
import { MapPin, X, Plus, Lock, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ProducerType, Location } from '../../types';
import { requestBrowserLocation, nominatimReverseGeocode } from '../../services/geolocation';
import { useFormik } from 'formik';
import { z } from 'zod';
import {
  AuthOnboardingLayout,
  AuthFormActions,
  authActionButtonPrimary,
  authActionButtonSecondary,
} from '../../components/AuthOnboardingLayout';
import { FieldError, inputErrorClasses, showFieldError } from '../../components/FieldError';
import { RegisterPhoneOtpModal } from '../../components/RegisterPhoneOtpModal';
import { buildRegisterPhone } from '../../utils/registerPhone';
import { SEO } from '../../components/SEO';
import { SEO_PAGE_META } from '../../services/seo/seoConfig';
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{4,}$/;

const AFRICA_COUNTRY_CODES = [
  // Central Africa
  { code: '+237', country: 'Cameroon' },
  { code: '+236', country: 'Central African Rep' },
  { code: '+235', country: 'Chad' },
  { code: '+242', country: 'Congo Rep' },
  { code: '+243', country: 'DR Congo' },
  { code: '+240', country: 'Equatorial Guinea' },
  { code: '+241', country: 'Gabon' },
  // West Africa
  { code: '+234', country: 'Nigeria' },
  { code: '+233', country: 'Ghana' },
  { code: '+225', country: 'Ivory Coast' },
  { code: '+221', country: 'Senegal' },
  { code: '+223', country: 'Mali' },
  { code: '+226', country: 'Burkina Faso' },
  { code: '+227', country: 'Niger' },
  { code: '+228', country: 'Togo' },
  { code: '+229', country: 'Benin' },
  // adsadd
  { code: '+224', country: 'Guinea' },
  // East Africa
  { code: '+254', country: 'Kenya' },
  { code: '+255', country: 'Tanzania' },
  { code: '+256', country: 'Uganda' },
  { code: '+250', country: 'Rwanda' },
  { code: '+257', country: 'Burundi' },
  { code: '+251', country: 'Ethiopia' },
  { code: '+252', country: 'Somalia' },
];

import { MARKETPLACE_CATEGORIES } from '../../data/categories';

const PRODUCTION_TYPES = MARKETPLACE_CATEGORIES;

export const RegisterProducer: React.FC = () => {
  const { registerProducer } = useStore();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = readReferralCodeFromLocation(searchParams);

  // Locations State
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLoc, setCurrentLoc] = useState({ region: '', city: '', address: '', lat: 0, lng: 0 });
  const [suggestions, setSuggestions] = useState<Array<{ address: string; city: string; region: string; lat: number; lng: number }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationsTouched, setLocationsTouched] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const pendingValuesRef = useRef<{
    type: ProducerType;
    name: string;
    email: string;
    phoneCode: string;
    phone: string;
    description: string;
    productionTypes: string[];
    taxIdentificationNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
  } | null>(null);
  const pendingPasswordRef = useRef('');
  const pendingLocationsRef = useRef<Location[]>([]);
  const verificationTokenRef = useRef('');

  const registerProducerSchema = z.object({
    type: z.enum(['BUSINESS', 'INDIVIDUAL']),
    name: z.string().trim().min(2, t('validation.farmNameRequired')),
    email: z.string().trim().email(t('validation.emailRequired')),
    password: z.string().min(1, t('validation.passwordRequired')).regex(PASSWORD_RULE, t('form.passwordRequirements')),
    confirmPassword: z.string().min(1, t('validation.confirmPassword')),
    phoneCode: z.string().min(1),
    phone: z.string().trim().min(1, t('validation.phoneRequired')).min(6, t('validation.phoneMin')),
    description: z.string().trim().min(10, t('validation.descriptionMin')),
    productionTypes: z.array(z.string()),
    taxIdentificationNumber: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    gender: z.string(),
    dateOfBirth: z.string(),
  }).superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: t('validation.passwordsMatch') });
    }
    if (!values.taxIdentificationNumber.trim()) {
      ctx.addIssue({ code: 'custom', path: ['taxIdentificationNumber'], message: t('validation.taxIdRequired') });
    }
    // Individual producers must provide personal identity details that
    // differentiate them from a business (business producers don't fill these).
    if (values.type === 'INDIVIDUAL') {
      if (!values.firstName.trim()) ctx.addIssue({ code: 'custom', path: ['firstName'], message: 'First name is required.' });
      if (!values.lastName.trim()) ctx.addIssue({ code: 'custom', path: ['lastName'], message: 'Last name is required.' });
      if (!values.gender) ctx.addIssue({ code: 'custom', path: ['gender'], message: 'Gender is required.' });
      if (!values.dateOfBirth) ctx.addIssue({ code: 'custom', path: ['dateOfBirth'], message: 'Date of birth is required.' });
    }
  });
  // console.log('🔄 RegisterProducer rendered with translations:', t('form.security'));

  const formik = useFormik({
    initialValues: {
      type: 'BUSINESS' as ProducerType,
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneCode: '+237',
      phone: '',
      description: '',
      productionTypes: [] as string[],
      taxIdentificationNumber: '',
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
    },
    validate: (values) => {
      const parsed = registerProducerSchema.safeParse(values);
      const nextErrors: Record<string, string> = {};
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? '');
          if (key && !nextErrors[key]) nextErrors[key] = issue.message;
        }
      }
      if (locations.length === 0) {
        nextErrors.locations = t('register.locationsError');
      }
      return nextErrors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      setRegisterError('');
      setLocationsTouched(true);
      if (locations.length === 0) {
        setSubmitting(false);
        return;
      }

      pendingValuesRef.current = values;
      pendingPasswordRef.current = values.password;
      pendingLocationsRef.current = locations;
      setOtpPhone(buildRegisterPhone(values.phoneCode, values.phone));
      setOtpEmail(values.email.trim());
      setOtpOpen(true);
      setSubmitting(false);
    },
  });

  const completeRegistration = async (phoneVerificationToken: string) => {
    const values = pendingValuesRef.current;
    if (!values) return;

    verificationTokenRef.current = phoneVerificationToken;
    setIsCreatingAccount(true);
    setRegisterError('');
    setIsSubmitting(true);
    try {
      const fullPhone = buildRegisterPhone(values.phoneCode, values.phone);
      const result = await registerProducer({
        type: values.type,
        name: values.name,
        email: values.email,
        phone: fullPhone,
        description: values.description,
        locations: pendingLocationsRef.current,
        certifications: [],
        productionTypes: values.productionTypes.length > 0 ? values.productionTypes : ['Agriculture'],
        referrerCode: refCode || undefined,
        taxIdentificationNumber: values.taxIdentificationNumber.trim() || undefined,
        // Individual producers supply their own identity details; business
        // producers leave these empty (registerProducer falls back for them).
        firstName: values.type === 'INDIVIDUAL' ? values.firstName.trim() : undefined,
        lastName: values.type === 'INDIVIDUAL' ? values.lastName.trim() : undefined,
        gender: values.type === 'INDIVIDUAL' ? values.gender : undefined,
        dateOfBirth: values.type === 'INDIVIDUAL' ? values.dateOfBirth : undefined,
        phoneVerificationToken,
      } as any, pendingPasswordRef.current);

      if (result.success) {
        setOtpOpen(false);
        navigate('/producer/dashboard?welcome=pending', { replace: true });
      } else {
        setRegisterError(result.message || t('register.registrationFailed'));
      }
    } finally {
      setIsCreatingAccount(false);
      setIsSubmitting(false);
    }
  };

  const handleUseMyLocationSignup = async () => {
    setGeoLoading(true);
    try {
      const { lat, lng } = await requestBrowserLocation();
      const rev = await nominatimReverseGeocode(lat, lng);
      setCurrentLoc({
        address: rev?.address || '',
        city: rev?.city || '',
        region: rev?.region || '',
        lat,
        lng,
      });
    } catch {
      setError(t('register.locationReadFailed'));
    } finally {
      setGeoLoading(false);
    }
  };

  useEffect(() => {
    const query = String(currentLoc.address ?? '').trim();
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`,
          {
            headers: { Accept: 'application/json' },
          },
        );
        if (!response.ok) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }
        const rows = await response.json();
        const mapped = Array.isArray(rows)
          ? rows.map((row: any) => {
              const addr = row?.address ?? {};
              const city = addr.city || addr.town || addr.village || addr.county || '';
              const region = addr.state || addr.region || addr.province || '';
              return {
                address: String(row?.display_name ?? ''),
                city: String(city),
                region: String(region),
                lat: Number(row?.lat ?? 0),
                lng: Number(row?.lon ?? 0),
              };
            }).filter((x: any) => x.address)
          : [];
        setSuggestions(mapped);
        setShowSuggestions(mapped.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [currentLoc.address]);

  const loadNearbySuggestions = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const reverseRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`,
            { headers: { Accept: 'application/json' } },
          );
          const reverseRow = reverseRes.ok ? await reverseRes.json() : null;
          const addr = reverseRow?.address ?? {};
          const city = addr.city || addr.town || addr.village || addr.county || '';
          const region = addr.state || addr.region || addr.province || '';
          const seed = [city, region].filter(Boolean).join(', ') || String(reverseRow?.display_name ?? '');
          if (!seed) {
            setIsNearbyLoading(false);
            return;
          }
          const searchRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(seed)}`,
            { headers: { Accept: 'application/json' } },
          );
          const rows = searchRes.ok ? await searchRes.json() : [];
          const mapped = Array.isArray(rows)
            ? rows.map((row: any) => {
                const a = row?.address ?? {};
                return {
                  address: String(row?.display_name ?? ''),
                  city: String(a.city || a.town || a.village || a.county || ''),
                  region: String(a.state || a.region || a.province || ''),
                  lat: Number(row?.lat ?? 0),
                  lng: Number(row?.lon ?? 0),
                };
              }).filter((x: any) => x.address)
            : [];
          setSuggestions(mapped);
          setShowSuggestions(mapped.length > 0);
        } catch {
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsNearbyLoading(false);
        }
      },
      () => setIsNearbyLoading(false),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 },
    );
  }, []);


  const addLocation = () => {
    const address = String(currentLoc.address ?? '').trim();
    if (!address) return;
    const addressParts = address.split(',').map((x) => x.trim()).filter(Boolean);
    const city = String(currentLoc.city ?? '').trim() || addressParts[1] || addressParts[0] || 'Unknown';
    const region = String(currentLoc.region ?? '').trim() || addressParts[2] || addressParts[1] || 'Unknown';
    setLocations([...locations, { ...currentLoc, address, city, region }]);
    setCurrentLoc({ region: '', city: '', address: '', lat: 0, lng: 0 });
    setLocationsTouched(false);
  };

  const showLocationsError =
    locations.length === 0 && (locationsTouched || formik.submitCount > 0);

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const toggleCategory = (cat: string) => {
    if (formik.values.productionTypes.includes(cat)) {
      formik.setFieldValue('productionTypes', formik.values.productionTypes.filter(c => c !== cat));
    } else {
      formik.setFieldValue('productionTypes', [...formik.values.productionTypes, cat]);
    }
  };

  return (
    <>
      <SEO
        title={SEO_PAGE_META.registerProducer.title}
        description={SEO_PAGE_META.registerProducer.description}
        url="/register/producer"
        locale={language}
      />
    <AuthOnboardingLayout
      maxWidth="3xl"
      reserveStickyActions
      backTo={{ href: refCode ? `/register?ref=${refCode}` : '/register', label: t('register.backToChoice') }}
      title={t('register.producer.title')}
      subtitle={t('register.producer.desc')}
    >
      <form onSubmit={formik.handleSubmit} className="space-y-6 sm:space-y-8 bg-white p-4 sm:p-6 md:p-8 shadow sm:rounded-xl border border-gray-100">

        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

          <div className="sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.type')}</label>
            <div className="flex  gap-3 flex-row sm:gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="BUSINESS"
                  checked={formik.values.type === 'BUSINESS'}
                  onChange={() => formik.setFieldValue('type', 'BUSINESS')}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{t('profile.business')}</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="INDIVIDUAL"
                  checked={formik.values.type === 'INDIVIDUAL'}
                  onChange={() => formik.setFieldValue('type', 'INDIVIDUAL')}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{t('profile.individual')}</span>
              </label>
            </div>
          </div>

          {formik.values.type === 'INDIVIDUAL' && (
            <>
              <div className="sm:col-span-3">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">{t('profile.firstName')}</label>
                <input type="text" name="firstName"
                  className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <FieldError formik={formik} name="firstName" />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">{t('profile.lastName')}</label>
                <input type="text" name="lastName"
                  className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <FieldError formik={formik} name="lastName" />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">{t('profile.gender')}</label>
                <select
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                  name="gender"
                  value={formik.values.gender}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                <FieldError formik={formik} name="gender" />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">{t('profile.dob')}</label>
                <input type="date"
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                  name="dateOfBirth"
                  value={formik.values.dateOfBirth}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <FieldError formik={formik} name="dateOfBirth" />
              </div>
            </>
          )}

          <div className="sm:col-span-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('form.farmName')}</label>
            <div className="mt-1">
              <input type="text" name="name" required
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              <FieldError formik={formik} name="name" />
            </div>
          </div>

          {/* NIU and certificates required for ALL producer types */}
          <div className="sm:col-span-6">
            <label htmlFor="tin" className="block text-sm font-medium text-gray-700">
              {t('profile.niuTaxId')} <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              {formik.values.type === 'BUSINESS'
                ? t('register.producer.niuBusinessHint')
                : t('register.producer.niuIndividualHint')}
            </p>
            <input
              id="tin"
              type="text"
              name="taxIdentificationNumber"
              required
              className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
              value={formik.values.taxIdentificationNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <FieldError formik={formik} name="taxIdentificationNumber" />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('form.email')}</label>
            <div className="mt-1">
              <input type="email" name="email" required
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            <FieldError formik={formik} name="email" />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">{t('form.phone')}</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <select
                className="w-24 sm:w-32 inline-flex items-center px-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm overflow-hidden"
                name="phoneCode"
                value={formik.values.phoneCode}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                {AFRICA_COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                ))}
              </select>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input type="tel" name="phone" required
                  className={inputErrorClasses(
                    showFieldError(formik, 'phone'),
                    'focus:ring-primary-500 focus:border-primary-500 flex-1 block w-full pl-10 rounded-none rounded-r-md sm:text-sm border-gray-300 p-2 border bg-white text-gray-900',
                  )}
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="612 345 678"
                />
              </div>
            </div>
            <FieldError formik={formik} name="phone" />
          </div>

          {/* Password Section */}
          <div className="sm:col-span-6 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <Lock className="h-4 w-4 mr-1 text-primary-600" /> {t('form.security')}
            </h3>
            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('form.password')}</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    className={inputErrorClasses(
                      showFieldError(formik, 'password'),
                      'block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900',
                    )}
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? t('register.hidePassword') : t('register.showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('form.passwordRequirements')}</p>
                <FieldError formik={formik} name="password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('form.confirmPassword')}</label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900"
                    name="confirmPassword"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                    aria-label={showConfirmPassword ? t('register.hideConfirmPassword') : t('register.showConfirmPassword')}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError formik={formik} name="confirmPassword" />
              </div>
            </div>
          </div>

          <div className="sm:col-span-6 border-t border-gray-200 pt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">{t('form.desc')}</label>
            <div className="mt-1">
              <textarea name="description" rows={3} required
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            <FieldError formik={formik} name="description" />
          </div>
        </div>

        {/* Categories (Chips) */}
        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.category')} ({t('register.multiSelect')})</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRODUCTION_TYPES.map(cat => {
              const isSelected = formik.values.productionTypes.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isSelected
                    ? 'bg-primary-100 text-primary-800 ring-2 ring-primary-500 ring-offset-1'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {t(`category.${cat}`)}
                  {isSelected && <X className="ml-1.5 h-3 w-3" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Location Manager */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary-600" /> {t('register.locationDetails')}
          </h3>

          {/* Add Location Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 space-y-3">
            <p className="text-xs text-gray-500">
              {t('register.locationHint')}
            </p>
            <button
              type="button"
              onClick={() => void handleUseMyLocationSignup()}
              disabled={geoLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
            >
              <MapPin className="h-4 w-4" />
              {geoLoading ? t('register.gettingLocation') : t('register.useActualLocation')}
            </button>
            {currentLoc.lat !== 0 && currentLoc.lng !== 0 ? (
              <p className="text-xs text-gray-600">
                {t('profile.coordinates')} {currentLoc.lat.toFixed(5)}, {currentLoc.lng.toFixed(5)}
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.address')}</label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  type="text"
                  placeholder={t('register.addressPlaceholder')}
                  className="flex-1 min-w-0 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 sm:text-sm bg-white text-gray-900"
                  value={currentLoc.address}
                  onChange={e => {
                    setCurrentLoc({ ...currentLoc, address: e.target.value });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                    else loadNearbySuggestions();
                  }}
                />
                <button
                  type="button"
                  onClick={addLocation}
                  disabled={!String(currentLoc.address ?? '').trim()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 min-h-[44px] sm:shrink-0"
                >
                  <Plus className="h-5 w-5" />
                  <span className="sm:hidden text-sm font-medium">{t('register.addLocation')}</span>
                </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.city')}</label>
                <input
                  type="text"
                  value={currentLoc.city}
                  onChange={(e) => setCurrentLoc(prev => ({ ...prev, city: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.regionOrState')}</label>
                <input
                  type="text"
                  value={currentLoc.region}
                  onChange={(e) => setCurrentLoc(prev => ({ ...prev, region: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900"
                />
              </div>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-md bg-white shadow-sm max-h-56 overflow-auto">
                {suggestions.map((item, idx) => (
                  <button
                    key={`${item.address}-${idx}`}
                    type="button"
                    onClick={() => {
                      setCurrentLoc({
                        address: item.address,
                        city: item.city || currentLoc.city,
                        region: item.region || currentLoc.region,
                        lat: item.lat,
                        lng: item.lng,
                      });
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <p className="text-sm text-gray-900">{item.address}</p>
                    <p className="text-xs text-gray-500">
                      {[item.city, item.region].filter(Boolean).join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            )}
            {isNearbyLoading && (
              <p className="mt-2 text-xs text-gray-500">{t('register.findingLocation')}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              {t('register.locationDescription')}
            </p>
          </div>

          {/* Locations List */}
          {locations.length > 0 ? (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white">
              {locations.map((loc, idx) => (
                <li key={idx} className="px-4 py-3 flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 break-words">{loc.address}</p>
                    <p className="text-xs text-gray-500">{loc.city}, {loc.region}</p>
                  </div>
                  <button type="button" onClick={() => removeLocation(idx)} className="text-gray-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-red-500 italic">{t('register.locationsRequired')}</p>
          )}
          {showLocationsError ? (
            <p className="text-sm text-red-600 mt-2 font-medium">
              {t('register.locationsError')}
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2" role="alert">
            {error}
          </p>
        ) : null}

        <AuthFormActions>
          <button type="button" onClick={() => navigate('/')} className={authActionButtonSecondary}>
            {t('form.cancel')}
          </button>
          <button
            type="submit"
            disabled={formik.isSubmitting || isSubmitting}
            className={authActionButtonPrimary}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isSubmitting ? t('ui.creating') : formik.isSubmitting ? t('register.producer.registering') : t('register.producer.btn')}
          </button>
        </AuthFormActions>
      </form>

      <RegisterPhoneOtpModal
        open={otpOpen}
        phone={otpPhone}
        email={otpEmail || formik.values.email.trim()}
        onVerified={(token) => void completeRegistration(token)}
        onCancel={() => {
          setOtpOpen(false);
          setIsSubmitting(false);
        }}
        isCreatingAccount={isCreatingAccount}
        registerError={registerError}
        onRetryRegister={() => {
          if (verificationTokenRef.current) {
            void completeRegistration(verificationTokenRef.current);
          }
        }}
      />
    </AuthOnboardingLayout>
    </>
  );
};
