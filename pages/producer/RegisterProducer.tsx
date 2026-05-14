
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { MapPin, X, Plus, Lock, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ProducerType, Location } from '../../types';
import { requestBrowserLocation, nominatimReverseGeocode } from '../../services/geolocation';
import { useFormik } from 'formik';
import { z } from 'zod';
import { RegisterPhoneOtpModal } from '../../components/RegisterPhoneOtpModal';
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{4,}$/;
const PASSWORD_RULE_MESSAGE = 'Password must be at least 4 characters with 1 letter, 1 number, and 1 special character.';

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

const PRODUCTION_TYPES = ['Agriculture', 'Livestock', 'Vegetables', 'Processed Goods', 'Equipment', 'Service'];

export const RegisterProducer: React.FC = () => {
  const { registerProducer } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');

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
  // Phone-verification gate — opens only after the form passes validation
  // AND at least one location is present. Holds the registration payload
  // until the SMS+email OTP is verified.
  const [otpOpen, setOtpOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const registerProducerSchema = z.object({
    type: z.enum(['BUSINESS', 'INDIVIDUAL']),
    name: z.string().trim().min(2, 'Farm/producer name is required.'),
    email: z.string().trim().email('Valid email is required.'),
    password: z.string().regex(PASSWORD_RULE, PASSWORD_RULE_MESSAGE),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
    phoneCode: z.string().min(1),
    phone: z.string().trim().min(6, 'Phone number is required.'),
    description: z.string().trim().min(10, 'Description should be at least 10 characters.'),
    productionTypes: z.array(z.string()),
    taxIdentificationNumber: z.string(),
  }).superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' });
    }
    if (!values.taxIdentificationNumber.trim()) {
      ctx.addIssue({ code: 'custom', path: ['taxIdentificationNumber'], message: 'NIU / Tax ID is required.' });
    }
  });

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
    },
    validate: (values) => {
      const parsed = registerProducerSchema.safeParse(values);
      if (parsed.success) return {};
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      return nextErrors;
    },
    onSubmit: (values) => {
      setError('');
      if (locations.length === 0) {
        setError('Please add at least one location before continuing.');
        return;
      }
      const fullPhone = `${values.phoneCode}${values.phone}`.replace(/\s+/g, '');
      setPendingPhone(fullPhone);
      setPendingEmail(values.email.trim());
      setOtpOpen(true);
    },
  });

  const submitWithToken = async (registrationToken: string) => {
    const values = formik.values;
    setOtpOpen(false);
    setIsSubmitting(true);
    setError('');
    try {
      const result = await registerProducer({
        type: values.type,
        name: values.name,
        email: values.email,
        phone: `${values.phoneCode}${values.phone}`,
        phoneVerificationToken: registrationToken,
        description: values.description,
        locations: locations,
        certifications: [],
        productionTypes: values.productionTypes.length > 0 ? values.productionTypes : ['Agriculture'],
        referrerCode: refCode || undefined,
        taxIdentificationNumber: values.taxIdentificationNumber.trim() || undefined,
      } as any, values.password);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } finally {
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
      setError('Could not read your location. Allow permission or enter the address manually.');
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
  };

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
    <div className="max-w-3xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('register.producer.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('register.producer.desc')}
          </p>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6 sm:space-y-8 bg-white p-4 sm:p-6 md:p-8 shadow sm:rounded-lg">

        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

          <div className="sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.type')}</label>
            <div className="flex space-x-4">
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

          <div className="sm:col-span-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('form.farmName')}</label>
            <div className="mt-1">
              <input type="text" name="name" required
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.name && formik.errors.name ? <p className="text-xs text-red-600 mt-1">{formik.errors.name}</p> : null}
            </div>
          </div>

          {/* NIU and certificates required for ALL producer types */}
          <div className="sm:col-span-6">
            <label htmlFor="tin" className="block text-sm font-medium text-gray-700">
              NIU / Tax ID <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              {formik.values.type === 'BUSINESS'
                ? 'Required for business accounts; validated by the platform.'
                : 'National Identification Number — required for all producers.'}
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
            {formik.touched.taxIdentificationNumber && formik.errors.taxIdentificationNumber ? <p className="text-xs text-red-600 mt-1">{formik.errors.taxIdentificationNumber}</p> : null}
          </div>

          <div className="sm:col-span-6">
            <p className="text-xs text-gray-400 mt-1">You can upload supporting documents (NIU certificate, ID) from your profile after registration.</p>
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
            {formik.touched.email && formik.errors.email ? <p className="text-xs text-red-600 mt-1">{formik.errors.email}</p> : null}
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
                  className="focus:ring-primary-500 focus:border-primary-500 flex-1 block w-full pl-10 rounded-none rounded-r-md sm:text-sm border-gray-300 p-2 border bg-white text-gray-900"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="612 345 678"
                />
              </div>
            </div>
            {formik.touched.phone && formik.errors.phone ? <p className="text-xs text-red-600 mt-1">{formik.errors.phone}</p> : null}
          </div>

          {/* Password Section */}
          <div className="sm:col-span-6 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <Lock className="h-4 w-4 mr-1 text-primary-600" /> Security
            </h3>
            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900"
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Min 4 chars: 1 letter, 1 number, 1 special</p>
                {formik.touched.password && formik.errors.password ? <p className="text-xs text-red-600 mt-1">{formik.errors.password}</p> : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
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
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formik.touched.confirmPassword && formik.errors.confirmPassword ? <p className="text-xs text-red-600 mt-1">{formik.errors.confirmPassword}</p> : null}
              </div>
            </div>
            {error && <p className="text-sm text-red-600 mt-2 font-medium">{error}</p>}
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
            {formik.touched.description && formik.errors.description ? <p className="text-xs text-red-600 mt-1">{formik.errors.description}</p> : null}
          </div>
        </div>

        {/* Categories (Chips) */}
        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.category')} (Multi-select)</label>
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
            <MapPin className="h-5 w-5 mr-2 text-primary-600" /> Location Details
          </h3>

          {/* Add Location Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 space-y-3">
            <p className="text-xs text-gray-500">
              Use your device location (browser permission). We do not load Google Places on signup. You can edit the address fields below.
            </p>
            <button
              type="button"
              onClick={() => void handleUseMyLocationSignup()}
              disabled={geoLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
            >
              <MapPin className="h-4 w-4" />
              {geoLoading ? 'Getting location…' : 'Use my current location'}
            </button>
            {currentLoc.lat !== 0 && currentLoc.lng !== 0 ? (
              <p className="text-xs text-gray-600">
                Coordinates: {currentLoc.lat.toFixed(5)}, {currentLoc.lng.toFixed(5)}
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Street, area, or full address"
                  className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm bg-white text-gray-900"
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
                  className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={currentLoc.city}
                  onChange={(e) => setCurrentLoc(prev => ({ ...prev, city: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region / State</label>
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
              <p className="mt-2 text-xs text-gray-500">Finding nearby locations...</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Type your full address, pick a suggestion, or drag the map pin. Click + to add this location.
            </p>
          </div>

          {/* Locations List */}
          {locations.length > 0 ? (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white">
              {locations.map((loc, idx) => (
                <li key={idx} className="px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{loc.address}</p>
                    <p className="text-xs text-gray-500">{loc.city}, {loc.region}</p>
                  </div>
                  <button type="button" onClick={() => removeLocation(idx)} className="text-gray-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-red-500 italic">At least one location is required.</p>
          )}
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button type="button" onClick={() => navigate('/')} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
              {t('form.cancel')}
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting || isSubmitting || otpOpen}
              className="ml-3 inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {(formik.isSubmitting || isSubmitting || otpOpen) && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting
                ? 'Creating…'
                : otpOpen
                  ? 'Verifying…'
                  : formik.isSubmitting
                    ? t('form.processing')
                    : t('register.producer.btn')}
            </button>
          </div>
        </div>
      </form>

      <RegisterPhoneOtpModal
        open={otpOpen}
        phone={pendingPhone}
        email={pendingEmail}
        onVerified={(token) => void submitWithToken(token)}
        onCancel={() => setOtpOpen(false)}
      />
    </div>
  );
};
