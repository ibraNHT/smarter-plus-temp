
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { MarketType, UserRole } from '../../types';
import { Tractor, Search, MapPin, ArrowLeft, MessageCircle, Truck, Heart, Star, Layers } from 'lucide-react';
import { SEO } from '../../components/SEO';

// Data for Autocomplete
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

// Flatten locations for easy searching: ["Bafoussam, West", "Yaoundé, Center", ...]
const FLAT_LOCATIONS = Object.entries(CAMEROON_LOCATIONS).flatMap(([region, cities]) =>
  cities.map(city => `${city}, ${region}`)
);

export const ProducerMarket: React.FC = () => {
  const { offers, producers, user, clients, trackUserSearch, toggleFavorite, getRecommendedOffers, getAverageRating, reviews, compareList, addToCompare, removeFromCompare } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [locationQuery, setLocationQuery] = useState('');

  // Autocomplete State
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationWrapperRef = useRef<HTMLDivElement>(null);

  // Get Current User Region and Favorites
  let clientRegion = '';
  let favorites: string[] = [];

  if (user) {
    if (user.role === UserRole.CLIENT) {
      const c = clients.find(
        client =>
          (user.clientId && client.id === user.clientId) ||
          (client as { userId?: string }).userId === user.id,
      );
      if (c) {
        clientRegion = c.locations.length > 0 ? c.locations[0].region : '';
        favorites = c.favorites || [];
      }
    } else if (user.role === UserRole.PRODUCER) {
      const p = producers.find(prod => prod.id === user.producerId);
      if (p) {
        clientRegion = p.locations.length > 0 ? p.locations[0].region : '';
        favorites = p.favorites || [];
      }
    }
  }

  // Base data
  const producerOffers = offers.filter(offer => offer.marketType === MarketType.PRODUCER);
  const recommendedOffers = getRecommendedOffers().filter(o => o.marketType === MarketType.PRODUCER);

  const getProducer = (id: string) => {
    return producers.find(p => p.id === id);
  };

  const getProducerName = (producer: ReturnType<typeof getProducer>) => {
    if (!producer) return 'Unknown Producer';
    if (producer.type === 'BUSINESS') return producer.name;
    return `${producer.firstName || ''} ${producer.lastName || ''}`.trim() || producer.name;
  };

  // Handle Search Input (Track on debounce or submit - simplified to effect here)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length > 2) {
        trackUserSearch(searchQuery);
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle Location Input Change
  const handleLocationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationQuery(val);

    if (val.length > 0) {
      const filtered = FLAT_LOCATIONS.filter(loc =>
        loc.toLowerCase().startsWith(val.toLowerCase()) ||
        loc.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setLocationSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectLocation = (loc: string) => {
    setLocationQuery(loc);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter Logic
  const filteredOffers = producerOffers.filter(offer => {
    const producer = getProducer(offer.producerId);
    const producerName = getProducerName(producer);

    // Search Text (Title, Description, OR Producer Name)
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch =
      offer.title.toLowerCase().includes(lowerQuery) ||
      offer.description.toLowerCase().includes(lowerQuery) ||
      producerName.toLowerCase().includes(lowerQuery);

    // Category
    const matchesCategory = selectedCategory === 'All' || offer.category === selectedCategory;

    // Location (Producer Addresses or Specific Offer Location)
    let matchesLocation = false;
    if (locationQuery === '') {
      matchesLocation = true;
    } else {
      const q = locationQuery.toLowerCase();
      // Check offer specific location
      if (offer.offerLocation && offer.offerLocation.toLowerCase().includes(q)) {
        matchesLocation = true;
      } else if (producer) {
        // Check ALL producer locations
        matchesLocation = producer.locations.some(loc =>
          loc.address.toLowerCase().includes(q) ||
          loc.city.toLowerCase().includes(q) ||
          loc.region.toLowerCase().includes(q) ||
          `${loc.city}, ${loc.region}`.toLowerCase().includes(q)
        );
      }
    }

    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Group by Category AND Sort within groups by Region Priority
  const groupedOffers = filteredOffers.reduce((groups, offer) => {
    const category = offer.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(offer);
    return groups;
  }, {} as Record<string, typeof filteredOffers>);

  // Sort Categories by Number of Results (Descending), then Alphabetically
  const sortedCategories = Object.keys(groupedOffers).sort((a, b) => {
    const countA = groupedOffers[a].length;
    const countB = groupedOffers[b].length;
    if (countA !== countB) return countB - countA; // More results first
    return a.localeCompare(b);
  });

  // Helper to sort offers within a category: Same Region First
  const sortOffersByRegion = (offersToSort: typeof filteredOffers) => {
    if (!clientRegion) return offersToSort;

    return offersToSort.sort((a, b) => {
      const prodA = getProducer(a.producerId);
      const prodB = getProducer(b.producerId);

      // Check if ANY of producer's locations match client region
      const regionAMatch = prodA?.locations.some(l => l.region === clientRegion);
      const regionBMatch = prodB?.locations.some(l => l.region === clientRegion);

      // A matches client region, B does not -> A comes first (-1)
      if (regionAMatch && !regionBMatch) return -1;
      // B matches client region, A does not -> B comes first (1)
      if (regionBMatch && !regionAMatch) return 1;
      // Otherwise maintain order
      return 0;
    });
  };

  // Get all unique categories from the ENTIRE dataset for the filter dropdown
  const allAvailableCategories = Array.from(new Set(producerOffers.map(o => o.category))).sort();

  const renderOfferCard = (offer: any) => {
    const producer = getProducer(offer.producerId);
    const isLocal = clientRegion && producer?.locations.some(l => l.region === clientRegion);
    const isFav = favorites.includes(offer.id);
    const rating = getAverageRating(offer.producerId);
    const reviewCount = reviews.filter(r => r.targetId === offer.producerId).length;

    const isComparing = compareList.includes(offer.id);

    const handleCompareToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      if (isComparing) removeFromCompare(offer.id);
      else addToCompare(offer.id);
    };

    return (
      <div key={offer.id} className={`group relative min-w-[280px] w-[300px] flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border ${isLocal ? 'border-green-300 ring-2 ring-green-50' : 'border-gray-100'} h-full flex flex-col`}>
        {/* Action Buttons Overlay */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
          {/* Favorite Button (Visible for Client AND Producer) */}
          {(user?.role === UserRole.CLIENT || user?.role === UserRole.PRODUCER) && (
            <button
              onClick={(e) => { e.preventDefault(); toggleFavorite(offer.id); }}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
              title="Save for later"
            >
              <Heart className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
            </button>
          )}

          {/* Compare Button */}
          <button
            onClick={handleCompareToggle}
            className={`p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors ${isComparing ? 'text-blue-600' : 'text-gray-400'}`}
            title={t('compare.select')}
          >
            <Layers className="h-5 w-5" />
          </button>
        </div>

        <Link to={`/offer/${offer.id}`} className="block h-full flex flex-col">
          <div className="relative h-44">
            <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

            {/* Badges Overlay */}
            <div className="absolute top-2 right-10 flex flex-col gap-1 items-end w-full pr-6 pointer-events-none">
              {offer.type === 'SERVICE' && (
                <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide shadow-sm">
                  Service
                </span>
              )}
              {offer.isNegotiable && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide shadow-sm flex items-center">
                  <MessageCircle className="h-3 w-3 mr-1" /> Negotiable
                </span>
              )}
            </div>

            {isLocal && (
              <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide shadow-sm flex items-center">
                <MapPin className="h-3 w-3 mr-1" /> Nearby
              </div>
            )}
          </div>

          <div className="p-4 flex flex-col flex-1">
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center justify-between">
                {getProducerName(producer)}
                {rating > 0 && (
                  <span className="flex items-center text-yellow-600 font-bold text-xs">
                    <Star className="w-3 h-3 fill-current mr-0.5" /> {rating} <span className="text-gray-400 font-normal ml-1">({reviewCount})</span>
                  </span>
                )}
              </p>
              <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">{offer.title}</h3>
            </div>

            <p className="text-gray-600 text-sm line-clamp-2 flex-1 mb-3">{offer.description}</p>

            {/* Delivery Status */}
            {offer.isDeliveryAvailable ? (
              <div className="flex items-center text-xs text-green-600 font-medium mb-3">
                <Truck className="h-3 w-3 mr-1" /> Delivery Available
              </div>
            ) : (
              <div className="flex items-center text-xs text-gray-400 font-medium mb-3">
                <MapPin className="h-3 w-3 mr-1" /> Pickup Only
              </div>
            )}

            <div className="mt-auto flex items-end justify-between pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">{t('market.per')} {t(`unit.${offer.unit}`)}</p>
                <p className="text-lg font-bold text-primary-700">{offer.price.toLocaleString()} XAF</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{t('market.available')}</p>
                <p className="text-sm font-semibold text-gray-900">{offer.quantity} {t(`unit.${offer.unit}`)}</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Producer Market | Wholesale Agriculture"
        description="Browse wholesale agricultural products directly from verified producers in your region. Buy onions, tomatoes, livestock, and more directly from the farm."
        url="/market/producers"
      />
      {/* Header */}
      <div className="bg-primary-900 text-white pt-8 pb-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => {
              if (window.history.length > 2) navigate(-1);
              else navigate('/producer/dashboard');
            }}
            className="absolute top-6 left-4 md:left-8 flex items-center text-primary-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" /> Back
          </button>

          <div className="mt-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-green-700 rounded-lg">
                <Tractor className="h-8 w-8 text-green-200" />
              </div>
              <h1 className="text-3xl font-bold">{t('landing.producerMarket.title')}</h1>
            </div>
            <p className="text-primary-100 text-lg max-w-2xl ml-14">
              {t('landing.producerMarket.desc')}
            </p>
            {clientRegion && (
              <div className="mt-4 ml-14 inline-flex items-center px-3 py-1 rounded-full bg-green-800 border border-green-600 text-sm text-green-100">
                <MapPin className="h-4 w-4 mr-1" /> Prioritizing offers in: <strong>{clientRegion}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col md:flex-row gap-4 items-center border border-gray-100 relative z-20">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products or producers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative w-full md:w-64" ref={locationWrapperRef}>
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t('market.locationPlaceholder')}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
              value={locationQuery}
              onChange={handleLocationInput}
              onFocus={() => locationQuery && setShowSuggestions(true)}
            />
            {/* Autocomplete Dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                {locationSuggestions.map((loc, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                    onClick={() => selectLocation(loc)}
                  >
                    {loc}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-primary-500 w-full"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">{t('market.allCategories')}</option>
              {allAvailableCategories.map(cat => (
                <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Recommended Section */}
        {recommendedOffers.length > 0 && searchQuery === '' && selectedCategory === 'All' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Star className="h-6 w-6 text-yellow-500 mr-2 fill-current" />
              {t('market.recommended')}
            </h2>
            <div className="flex overflow-x-auto pb-8 pt-2 space-x-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-1">
              {recommendedOffers.map(offer => renderOfferCard(offer))}
            </div>
          </div>
        )}

        {/* Results */}
        {filteredOffers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Tractor className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">{t('market.noResults')}</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setLocationQuery(''); }}
              className="mt-4 text-primary-600 font-medium hover:underline"
            >
              {t('market.clear')}
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {sortedCategories.map(category => {
              // Sort offers in this category: Client's region first
              const sortedCategoryOffers = sortOffersByRegion([...groupedOffers[category]]);

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                      <span className="bg-primary-100 text-primary-800 text-sm font-bold px-2 py-1 rounded mr-2 uppercase shadow-sm">
                        {t(`category.${category}`)}
                      </span>
                    </h2>
                    <span className="text-sm text-gray-500">{sortedCategoryOffers.length} results</span>
                  </div>

                  {/* Horizontal Scroll Container */}
                  <div className="flex overflow-x-auto pb-8 pt-2 space-x-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-1">
                    {sortedCategoryOffers.map((offer) => renderOfferCard(offer))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
