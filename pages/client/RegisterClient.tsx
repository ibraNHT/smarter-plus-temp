
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { User, Mail, Phone, MapPin, Camera, Lock } from 'lucide-react';

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

export const RegisterClient: React.FC = () => {
  const { registerClient } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');

  const [formData, setFormData] = useState({
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
    profileImageUrl: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;
    setFormData({
      ...formData,
      region,
      city: CAMEROON_LOCATIONS[region]?.[0] || ''
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fakeUrl = URL.createObjectURL(file);
      setFormData({ ...formData, profileImageUrl: fakeUrl });
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

    setIsLoading(true);
    const result = await registerClient({
      name: `${formData.firstName} ${formData.lastName}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender as 'MALE' | 'FEMALE',
      dateOfBirth: formData.dateOfBirth,
      email: formData.email,
      phone: `${formData.phoneCode}${formData.phone}`,
      locations: [{
        lat: 0,
        lng: 0,
        address: formData.address,
        region: formData.region,
        city: formData.city
      }],
      profileImageUrl: formData.profileImageUrl,
      favorites: [],
      searchHistory: [],
      referrerCode: refCode || undefined
    }, formData.password);
    setIsLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Registration failed.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
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

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 shadow sm:rounded-lg">

        {/* Profile Picture Upload */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
              {formData.profileImageUrl ? (
                <img src={formData.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-primary-600 p-1.5 rounded-full text-white cursor-pointer hover:bg-primary-700 shadow-sm">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.firstName')}</label>
            <input type="text" required
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.lastName')}</label>
            <input type="text" required
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.gender')}</label>
            <select required
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.dob')}</label>
            <input type="date" required
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
              value={formData.dateOfBirth}
              onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('form.email')}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input type="email" name="email" required
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
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

          {/* Location Section */}
          <div className="sm:col-span-6 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Location Details</h4>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.region')}</label>
            <select required
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
              value={formData.region}
              onChange={handleRegionChange}
            >
              <option value="">Select Region</option>
              {Object.keys(CAMEROON_LOCATIONS).map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">{t('profile.city')}</label>
            <select required
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              disabled={!formData.region}
            >
              <option value="">Select City</option>
              {formData.region && CAMEROON_LOCATIONS[formData.region]?.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              {t('form.address')}
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input type="text" name="address" required placeholder="Neighborhood / Street..."
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border bg-white text-gray-900"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button type="button" onClick={() => navigate('/')} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
              {t('form.cancel')}
            </button>
            <button type="submit" disabled={isLoading} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60">
              {isLoading ? 'Creating…' : t('form.create')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
