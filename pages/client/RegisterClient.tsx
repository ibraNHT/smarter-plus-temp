
import React, { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { readReferralCodeFromLocation } from '../../utils/referralLink';
import { User, Mail, Phone, MapPin, Camera, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
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

export const RegisterClient: React.FC = () => {
  const { registerClient } = useStore();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = readReferralCodeFromLocation(searchParams);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const avatarFileRef = useRef<File | null>(null);
  const pendingValuesRef = useRef<{
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    email: string;
    phoneCode: string;
    phone: string;
    address: string;
    region: string;
    city: string;
    lat: number;
    lng: number;
  } | null>(null);
  const pendingPasswordRef = useRef('');
  const verificationTokenRef = useRef('');

  const registerClientSchema = z
    .object({
      firstName: z.string().trim().min(2, t('validation.firstNameRequired')),
      lastName: z.string().trim().min(2, t('validation.lastNameRequired')),
      gender: z.string().min(1, t('validation.genderRequired')),
      dateOfBirth: z.string().min(1, t('validation.dobRequired')),
      email: z.string().trim().email(t('validation.emailRequired')),
      password: z.string().min(1, t('validation.passwordRequired')).regex(PASSWORD_RULE, t('form.passwordRequirements')),
      confirmPassword: z.string().min(1, t('validation.confirmPassword')),
      phoneCode: z.string().min(1),
      phone: z.string().trim().min(1, t('validation.phoneRequired')).min(6, t('validation.phoneMin')),
      address: z.string().trim().min(5, t('validation.addressRequired')),
      region: z.string().trim().min(2, t('validation.regionRequired')),
      city: z.string().trim().min(2, t('validation.cityRequired')),
      lat: z.number(),
      lng: z.number(),
      profileImageUrl: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMatch'),
      path: ['confirmPassword'],
    });

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneCode: '+237',
      phone: '',
      address: '',
      region: '',
      city: '',
      lat: 0,
      lng: 0,
      profileImageUrl: '',
    },
    validate: (values) => {
      const parsed = registerClientSchema.safeParse(values);
      if (parsed.success) return {};
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      return nextErrors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      setRegisterError('');
      pendingValuesRef.current = values;
      pendingPasswordRef.current = values.password;
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
    setIsLoading(true);
    try {
      const fullPhone = buildRegisterPhone(values.phoneCode, values.phone);
      const address = String(values.address ?? '').trim();
      const addressParts = address.split(',').map((x) => x.trim()).filter(Boolean);
      const inferredCity = String(values.city ?? '').trim() || addressParts[1] || addressParts[0] || 'Unknown';
      const inferredRegion = String(values.region ?? '').trim() || addressParts[2] || addressParts[1] || 'Unknown';

      const result = await registerClient({
        name: `${values.firstName} ${values.lastName}`,
        firstName: values.firstName,
        lastName: values.lastName,
        gender: values.gender as 'MALE' | 'FEMALE',
        dateOfBirth: values.dateOfBirth,
        email: values.email,
        phone: fullPhone,
        locations: [{
          lat: Number(values.lat) || 0,
          lng: Number(values.lng) || 0,
          address,
          region: inferredRegion,
          city: inferredCity,
        }],
        favorites: [],
        searchHistory: [],
        referrerCode: refCode || undefined,
        phoneVerificationToken,
      }, pendingPasswordRef.current, avatarFileRef.current);

      if (result.success) {
        setOtpOpen(false);
        navigate('/client/profile?tab=orders', { replace: true });
      } else {
        setRegisterError(result.message || t('register.registrationFailed'));
      }
    } finally {
      setIsCreatingAccount(false);
      setIsLoading(false);
    }
  };

  const fillLocationFromCoords = async (lat: number, lng: number) => {
    const rev = await nominatimReverseGeocode(lat, lng);
    formik.setValues({
      ...formik.values,
      lat,
      lng,
      address: rev?.address || formik.values.address,
      city: rev?.city || formik.values.city,
      region: rev?.region || formik.values.region,
    });
  };

  const handleUseMyLocation = async () => {
    setGeoError('');
    setGeoLoading(true);
    try {
      const { lat, lng } = await requestBrowserLocation();
      await fillLocationFromCoords(lat, lng);
    } catch (e: unknown) {
      setGeoError(e instanceof Error ? e.message : t('client.locationError'));
    } finally {
      setGeoLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    avatarFileRef.current = file;
    // `data:` preview URL — works with strict CSPs that allow `data:` in img-src
    // (Vercel/cached builds may omit `blob:`). Avoids `blob:` which some policies block.
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (dataUrl) formik.setFieldValue('profileImageUrl', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <SEO
        title={SEO_PAGE_META.registerClient.title}
        description={SEO_PAGE_META.registerClient.description}
        url="/register/client"
        locale={language}
      />
    <AuthOnboardingLayout
      maxWidth="2xl"
      reserveStickyActions
      backTo={{ href: refCode ? `/register?ref=${refCode}` : '/register', label: t('register.backToChoice') }}
      title={t('register.client.title')}
      subtitle={t('register.client.desc')}
    >
      <form onSubmit={formik.handleSubmit} className="space-y-5 sm:space-y-6 bg-white p-4 sm:p-8 shadow sm:rounded-xl border border-gray-100">

        {/* Profile Picture Upload */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
              {formik.values.profileImageUrl ? (
                <img src={formik.values.profileImageUrl} alt={t('ui.profile')} className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-primary-600 p-1.5 rounded-full text-white cursor-pointer hover:bg-primary-700 shadow-sm">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.firstName')}</label>
            <input type="text" required
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
              name="firstName"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <FieldError formik={formik} name="firstName" />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.lastName')}</label>
            <input type="text" required
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
              name="lastName"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <FieldError formik={formik} name="lastName" />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.gender')} <span className="text-red-500">*</span></label>
            <select required
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
              name="gender"
              value={formik.values.gender}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <option value="">{t('profile.selectGender')}</option>
              <option value="MALE">{t('profile.male')}</option>
              <option value="FEMALE">{t('profile.female')}</option>
            </select>
            <FieldError formik={formik} name="gender" />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.dob')} <span className="text-red-500">*</span></label>
            <input type="date" required
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
              name="dateOfBirth"
              value={formik.values.dateOfBirth}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <FieldError formik={formik} name="dateOfBirth" />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('form.email')}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input type="email" name="email" required
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder={t('ui.emailPlaceholder')}
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
                  placeholder={t('ui.phonePlaceholder')}
                />
              </div>
            </div>
            <FieldError formik={formik} name="phone" />
          </div>

          {/* Password Section */}
          <div className="sm:col-span-6 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <Lock className="h-4 w-4 mr-1 text-primary-600" /> {t('register.security')}
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
                    aria-label={showPassword ? t('ui.hidePassword') : t('ui.showPassword')}
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
                    aria-label={showConfirmPassword ? t('ui.hideConfirmPassword') : t('ui.showConfirmPassword')}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError formik={formik} name="confirmPassword" />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="sm:col-span-6 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">{t('profile.locationDetails')}</h4>
            <p className="text-xs text-gray-500 mb-3">
              {t('profile.locationHint')}
            </p>
            <button
              type="button"
              onClick={() => void handleUseMyLocation()}
              disabled={geoLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60 min-h-[44px]"
            >
              <MapPin className="h-4 w-4" />
              {geoLoading ? t('profile.gettingLocation') : t('profile.useMyLocation')}
            </button>
            {geoError ? <p className="mt-2 text-xs text-red-600">{geoError}</p> : null}
            {formik.values.lat !== 0 && formik.values.lng !== 0 && (
              <p className="mt-2 text-xs text-gray-600">
                {t('profile.coordinates')} {formik.values.lat.toFixed(5)}, {formik.values.lng.toFixed(5)}
              </p>
            )}
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              {t('form.address')}
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="address"
                required
                placeholder={t('profile.addressPlaceholder')}
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            <FieldError formik={formik} name="address" />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.city')} <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
              name="city"
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <FieldError formik={formik} name="city" />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.region')} <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
              name="region"
              value={formik.values.region}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <FieldError formik={formik} name="region" />
          </div>
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
          <button type="submit" disabled={isLoading} className={authActionButtonPrimary}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isLoading ? t('ui.creating') : t('form.create')}
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
          setIsLoading(false);
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
