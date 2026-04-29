
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { MapPin, X, Plus, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import { ProducerType, Location } from '../../types';
import { requestBrowserLocation, nominatimReverseGeocode } from '../../services/geolocation';
import { uploadDocument } from '../../services/uploadService';

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

  const [formData, setFormData] = useState({
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
    taxClearanceCertificateUrl: '',
  });

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
  const [taxDocUploading, setTaxDocUploading] = useState(false);

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

  const handleTaxDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tax document must be PNG, JPG, JPEG, or PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Tax document must be 10 MB or less.');
      return;
    }
    setError('');
    setTaxDocUploading(true);
    try {
      const url = await uploadDocument(file);
      setFormData(prev => ({ ...prev, taxClearanceCertificateUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tax document upload failed.');
    } finally {
      setTaxDocUploading(false);
    }
  };

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
    if (formData.productionTypes.includes(cat)) {
      setFormData(prev => ({ ...prev, productionTypes: prev.productionTypes.filter(c => c !== cat) }));
    } else {
      setFormData(prev => ({ ...prev, productionTypes: [...prev.productionTypes, cat] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Security Validations
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (locations.length === 0) {
      alert("Please add at least one location.");
      return;
    }
    if (taxDocUploading) {
      setError('Please wait for the tax document upload to finish.');
      return;
    }

    const result = await registerProducer({
      type: formData.type,
      name: formData.name,
      email: formData.email,
      phone: `${formData.phoneCode}${formData.phone}`,
      description: formData.description,
      locations: locations,
      certifications: [],
      productionTypes: formData.productionTypes.length > 0 ? formData.productionTypes : ['Agriculture'],
      referrerCode: refCode || undefined,
      ...(formData.type === 'BUSINESS'
        ? {
            taxIdentificationNumber: formData.taxIdentificationNumber.trim() || undefined,
            taxClearanceCertificateUrl: formData.taxClearanceCertificateUrl.trim() || undefined,
          }
        : {}),
    }, formData.password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
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

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 shadow sm:rounded-lg">

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
                  checked={formData.type === 'BUSINESS'}
                  onChange={() => setFormData({ ...formData, type: 'BUSINESS' })}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{t('profile.business')}</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="INDIVIDUAL"
                  checked={formData.type === 'INDIVIDUAL'}
                  onChange={() => setFormData({ ...formData, type: 'INDIVIDUAL' })}
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
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          {formData.type === 'BUSINESS' && (
            <>
              <div className="sm:col-span-6">
                <label htmlFor="tin" className="block text-sm font-medium text-gray-700">
                  Tax ID (TIN / NIU) 
                </label>
                <p className="text-xs text-gray-500 mt-0.5">Required for business accounts; validated by the platform.</p>
                <input
                  id="tin"
                  type="text"
                  name="taxIdentificationNumber"
                  required={formData.type === 'BUSINESS'}
                  className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                  value={formData.taxIdentificationNumber}
                  onChange={e => setFormData({ ...formData, taxIdentificationNumber: e.target.value })}
                />
              </div>
              <div className="sm:col-span-6">
                <label htmlFor="taxCert" className="block text-sm font-medium text-gray-700">
                  Tax clearance certificate (PNG, JPG, PDF)
                </label>
                <p className="text-xs text-gray-500 mt-0.5">Upload your Attestation de non-redevance document.</p>
                <input
                  id="taxCert"
                  type="file"
                  name="taxClearanceCertificateUrl"
                  accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                  className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900 disabled:opacity-50"
                  onChange={handleTaxDocumentUpload}
                  disabled={taxDocUploading}
                />
                {taxDocUploading && (
                  <p className="text-xs text-gray-500 mt-1">Uploading document…</p>
                )}
                {!taxDocUploading && formData.taxClearanceCertificateUrl && (
                  <p className="text-xs text-green-600 mt-1">
                    Document uploaded.{' '}
                    <a
                      href={formData.taxClearanceCertificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      View
                    </a>
                  </p>
                )}
              </div>
            </>
          )}

          <div className="sm:col-span-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('form.email')}</label>
            <div className="mt-1">
              <input type="email" name="email" required
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">{t('form.phone')}</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <select
                className="w-24 sm:w-32 inline-flex items-center px-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm overflow-hidden"
                value={formData.phoneCode}
                onChange={e => setFormData({ ...formData, phoneCode: e.target.value })}
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
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="612 345 678"
                />
              </div>
            </div>
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
                    minLength={8}
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
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
                <p className="text-xs text-gray-500 mt-1">Min 8 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
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
              </div>
            </div>
            {error && <p className="text-sm text-red-600 mt-2 font-medium">{error}</p>}
          </div>

          <div className="sm:col-span-6 border-t border-gray-200 pt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">{t('form.desc')}</label>
            <div className="mt-1">
              <textarea name="description" rows={3} required
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Categories (Chips) */}
        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.category')} (Multi-select)</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRODUCTION_TYPES.map(cat => {
              const isSelected = formData.productionTypes.includes(cat);
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
            <button type="submit" className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              {t('register.producer.btn')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
