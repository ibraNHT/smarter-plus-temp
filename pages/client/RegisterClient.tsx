
import React, { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { User, Mail, Phone, MapPin, Camera, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { requestBrowserLocation, nominatimReverseGeocode } from '../../services/geolocation';
import { useFormik } from 'formik';
import { z } from 'zod';
import { RegisterPhoneOtpModal } from '../../components/RegisterPhoneOtpModal';
import { buildRegisterPhone } from '../../utils/registerPhone';

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  // Phone-verification gate — opens AFTER the form passes validation so we
  // never spam SMS for incomplete forms. Holds the in-flight payload until
  // the OTP token comes back, then submits the registration.
  const [otpOpen, setOtpOpen] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpRegisterError, setOtpRegisterError] = useState('');
  const registrationTokenRef = useRef<string | null>(null);

  const avatarFileRef = useRef<File | null>(null);

  const registerClientSchema = z
    .object({
      firstName: z.string().trim().min(2, 'First name is required.'),
      lastName: z.string().trim().min(2, 'Last name is required.'),
      gender: z.string().min(1, 'Gender is required.'),
      dateOfBirth: z.string().min(1, 'Date of birth is required.'),
      email: z.string().trim().email('Valid email is required.'),
      password: z.string().regex(PASSWORD_RULE, PASSWORD_RULE_MESSAGE),
      confirmPassword: z.string().min(1, 'Confirm your password.'),
      phoneCode: z.string().min(1),
      phone: z.string().trim().min(6, 'Phone number is required.'),
      address: z.string().trim().min(5, 'Address is required.'),
      region: z.string().trim().min(2, 'Region is required.'),
      city: z.string().trim().min(2, 'City is required.'),
      lat: z.number(),
      lng: z.number(),
      profileImageUrl: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match.',
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
    // Form submit only OPENS the OTP modal. The actual register API call is
    // gated behind `submitWithToken`, which is invoked by the OTP modal once
    // the user proves they control the phone (and/or email).
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      setOtpRegisterError('');
      try {
        const fullPhone = buildRegisterPhone(values.phoneCode, values.phone);
        setPendingPhone(fullPhone);
        setPendingEmail(values.email.trim());
        setOtpOpen(true);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const submitWithToken = async (registrationToken: string) => {
    const values = formik.values;
    const address = String(values.address ?? '').trim();
    const addressParts = address.split(',').map((x) => x.trim()).filter(Boolean);
    const inferredCity = String(values.city ?? '').trim() || addressParts[1] || addressParts[0] || 'Unknown';
    const inferredRegion = String(values.region ?? '').trim() || addressParts[2] || addressParts[1] || 'Unknown';

    registrationTokenRef.current = registrationToken;
    setIsCreatingAccount(true);
    setIsLoading(true);
    setError('');
    setOtpRegisterError('');
    try {
      const result = await registerClient({
        name: `${values.firstName} ${values.lastName}`,
        firstName: values.firstName,
        lastName: values.lastName,
        gender: values.gender as 'MALE' | 'FEMALE',
        dateOfBirth: values.dateOfBirth,
        email: values.email,
        phone: pendingPhone,
        phoneVerificationToken: registrationToken,
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
      }, values.password, avatarFileRef.current);

      if (result.success) {
        setOtpOpen(false);
        navigate('/client/profile?tab=orders', { replace: true });
      } else {
        const msg = result.message || 'Registration failed.';
        setOtpRegisterError(msg);
        setError(msg);
      }
    } finally {
      setIsLoading(false);
      setIsCreatingAccount(false);
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
      setGeoError(e instanceof Error ? e.message : 'Could not get your location.');
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
    <div className="max-w-2xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('register.client.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('register.client.desc')}
          </p>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-5 sm:space-y-6 bg-white p-5 sm:p-8 shadow sm:rounded-lg">

        {/* Profile Picture Upload */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
              {formik.values.profileImageUrl ? (
                <img src={formik.values.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
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
            {formik.touched.firstName && formik.errors.firstName ? <p className="text-xs text-red-600 mt-1">{formik.errors.firstName}</p> : null}
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
            {formik.touched.lastName && formik.errors.lastName ? <p className="text-xs text-red-600 mt-1">{formik.errors.lastName}</p> : null}
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.gender')}</label>
            <select required
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
            {formik.touched.gender && formik.errors.gender ? <p className="text-xs text-red-600 mt-1">{formik.errors.gender}</p> : null}
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.dob')}</label>
            <input type="date" required
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
              name="dateOfBirth"
              value={formik.values.dateOfBirth}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.dateOfBirth && formik.errors.dateOfBirth ? <p className="text-xs text-red-600 mt-1">{formik.errors.dateOfBirth}</p> : null}
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
                placeholder="you@example.com"
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

          {/* Location Section */}
          <div className="sm:col-span-6 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Location Details</h4>
            <p className="text-xs text-gray-500 mb-3">
              Use your device location (browser permission). We do not load Google Places on signup. You can edit the address fields below.
            </p>
            <button
              type="button"
              onClick={() => void handleUseMyLocation()}
              disabled={geoLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
            >
              <MapPin className="h-4 w-4" />
              {geoLoading ? 'Getting location…' : 'Use my current location'}
            </button>
            {geoError ? <p className="mt-2 text-xs text-red-600">{geoError}</p> : null}
            {formik.values.lat !== 0 && formik.values.lng !== 0 && (
              <p className="mt-2 text-xs text-gray-600">
                Coordinates: {formik.values.lat.toFixed(5)}, {formik.values.lng.toFixed(5)}
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
                placeholder="Street, area, or full address"
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            {formik.touched.address && formik.errors.address ? <p className="text-xs text-red-600 mt-1">{formik.errors.address}</p> : null}
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
              name="city"
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.city && formik.errors.city ? <p className="text-xs text-red-600 mt-1">{formik.errors.city}</p> : null}
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Region / State</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
              name="region"
              value={formik.values.region}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.region && formik.errors.region ? <p className="text-xs text-red-600 mt-1">{formik.errors.region}</p> : null}
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button type="button" onClick={() => navigate('/')} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
              {t('form.cancel')}
            </button>
            <button type="submit" disabled={isLoading || otpOpen} className="ml-3 inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isLoading ? 'Creating…' : t('form.create')}
            </button>
          </div>
        </div>
      </form>

      <RegisterPhoneOtpModal
        open={otpOpen}
        phone={pendingPhone}
        email={pendingEmail}
        isCreatingAccount={isCreatingAccount}
        registerError={otpRegisterError}
        onRetryRegister={() => {
          if (registrationTokenRef.current) {
            void submitWithToken(registrationTokenRef.current);
          }
        }}
        onVerified={(token) => void submitWithToken(token)}
        onCancel={() => {
          if (isCreatingAccount) return;
          setOtpOpen(false);
          setOtpRegisterError('');
          registrationTokenRef.current = null;
        }}
      />
    </div>
  );
};
