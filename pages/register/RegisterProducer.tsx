
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { MapPin, X, Plus, Lock, Phone } from 'lucide-react';
import { ProducerType, Location } from '../../types';

// Mock Data for Regions/Cities
const CAMEROON_LOCATIONS: Record<string, string[]> = {
  'West': ['Bafoussam', 'Dschang', 'Foumban', 'Mbouda', 'Bandjoun'],
  'Center': ['Yaoundé', 'Mbalmayo', 'Bafia', 'Obala', 'Eseka'],
  'Littoral': ['Douala', 'Edea', 'Nkongsamba', 'Loum', 'Mbanga'],
  'North West': ['Bamenda', 'Kumbo', 'Ndop', 'Wum', 'Mbengwi'],
  'South West': ['Buea', 'Limbe', 'Kumba', 'Tiko', 'Mamfe'],
  'Adamaoua': ['Ngaoundere', 'Meiganga', 'Tibati'],
  'North': ['Garoua', 'Guider', 'Figuil'],
  'Far North': ['Maroua', 'Kousseri', 'Mokolo'],
  'East': ['Bertoua', 'Batouri', 'Abong-Mbang'],
  'South': ['Ebolowa', 'Kribi', 'Sangmelima']
};

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

const PRODUCTION_TYPES = ['Agriculture', 'Livestock', 'Vegetables', 'Processed Goods', 'Equipment', 'Service'];

export const RegisterProducer: React.FC = () => {
  const { registerProducer } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

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

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Locations State
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLoc, setCurrentLoc] = useState({ region: '', city: '', address: '' });

  const addLocation = () => {
    if (currentLoc.region && currentLoc.city && currentLoc.address) {
      setLocations([...locations, { ...currentLoc, lat: 0, lng: 0 }]);
      setCurrentLoc({ region: '', city: '', address: '' });
    }
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
      alert('Please add at least one location.');
      return;
    }

    setIsLoading(true);
    const result = await registerProducer({
      type: formData.type,
      name: formData.name,
      email: formData.email,
      phone: `${formData.phoneCode}${formData.phone}`,
      description: formData.description,
      locations: locations,
      certifications: [],
      productionTypes: formData.productionTypes.length > 0 ? formData.productionTypes : ['Agriculture'],
      ...(formData.type === 'BUSINESS'
        ? {
            taxIdentificationNumber: formData.taxIdentificationNumber.trim() || undefined,
            taxClearanceCertificateUrl: formData.taxClearanceCertificateUrl.trim() || undefined,
          }
        : {}),
    }, formData.password);
    setIsLoading(false);

    if (result.success) {
      navigate('/verify-email');
    } else {
      setError(result.message || 'Registration failed.');
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
                  Tax clearance certificate URL
                </label>
                <p className="text-xs text-gray-500 mt-0.5">Link to your uploaded Attestation de non-redevance.</p>
                <input
                  id="taxCert"
                  type="url"
                  name="taxClearanceCertificateUrl"
                  placeholder="https://..."
                  className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                  value={formData.taxClearanceCertificateUrl}
                  onChange={e => setFormData({ ...formData, taxClearanceCertificateUrl: e.target.value })}
                />
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
                <input type="password" required minLength={8}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Min 8 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input type="password" required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
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
                  {cat}
                  {isSelected && <X className="ml-1.5 h-3 w-3" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Location Manager */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary-600" /> Operating Locations
          </h3>

          {/* Add Location Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <select
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 sm:text-sm text-gray-900"
                  value={currentLoc.region}
                  onChange={e => setCurrentLoc({ ...currentLoc, region: e.target.value, city: CAMEROON_LOCATIONS[e.target.value]?.[0] || '' })}
                >
                  <option value="">Select Region</option>
                  {Object.keys(CAMEROON_LOCATIONS).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <select
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 sm:text-sm text-gray-900"
                  value={currentLoc.city}
                  onChange={e => setCurrentLoc({ ...currentLoc, city: e.target.value })}
                  disabled={!currentLoc.region}
                >
                  <option value="">Select City</option>
                  {currentLoc.region && CAMEROON_LOCATIONS[currentLoc.region]?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Address/Street"
                  className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm bg-white text-gray-900"
                  value={currentLoc.address}
                  onChange={e => setCurrentLoc({ ...currentLoc, address: e.target.value })}
                />
                <button
                  type="button"
                  onClick={addLocation}
                  disabled={!currentLoc.region || !currentLoc.city || !currentLoc.address}
                  className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
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
            <button type="submit" disabled={isLoading} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60">
              {isLoading ? 'Registering…' : t('register.producer.btn')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
