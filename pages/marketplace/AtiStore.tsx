
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { MarketType, UserRole } from '../../types';
import { ShoppingBasket, Search, Star, Filter, Heart, Layers } from 'lucide-react';
import { SEO } from '../../components/SEO';

export const AtiStore: React.FC = () => {
  const { offers, toggleFavorite, user, clients, producers, compareList, addToCompare, removeFromCompare } = useStore();
  const { t } = useTranslation();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Base data
  const atiOffers = offers.filter(offer => offer.marketType === MarketType.ATI);

  // Get Favorites
  let favorites: string[] = [];
  if (user) {
    if (user.role === UserRole.CLIENT) {
      const c = clients.find(client => client.id === user.id);
      favorites = c?.favorites || [];
    } else if (user.role === UserRole.PRODUCER) {
      const p = producers.find(prod => prod.id === user.producerId);
      favorites = p?.favorites || [];
    }
  }

  const filteredOffers = atiOffers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) || offer.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || offer.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by Category
  const groupedOffers = filteredOffers.reduce((groups, offer) => {
    const category = offer.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(offer);
    return groups;
  }, {} as Record<string, typeof filteredOffers>);

  const sortedCategories = Object.keys(groupedOffers).sort();

  const categories = ['All', 'Cereals', 'Oils', 'Canned Goods', 'Spices', 'Processed foods', 'Vegetables', 'Fish Farming'];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="ATI Store | Premium Retail Agriculture"
        description="Shop premium processed foods, canned goods, spices, and more directly from the official ATI Store. Verified quality, fast delivery."
        url="/market/ati"
      />
      {/* Header */}
      <div className="bg-blue-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShoppingBasket className="h-8 w-8 text-blue-300" />
            <div>
              <h1 className="text-2xl font-bold">{t('landing.atiStore.title')}</h1>
              <p className="text-blue-100 text-sm">{t('landing.atiStore.desc')}</p>
            </div>
          </div>
          <div className="hidden md:block bg-blue-700 px-4 py-2 rounded-lg text-sm">
            Official ATI Products • Verified Quality • Fast Delivery
          </div>
        </div>
      </div>

      {/* Store Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <Filter className="w-4 h-4 mr-2" /> {t('form.category')}
              </h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <label key={cat} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded transition">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${selectedCategory === cat ? 'font-bold text-blue-700' : 'text-gray-700'}`}>
                      {cat === 'All' ? t('market.allCategories') : t(`category.${cat}`)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-8 relative">
              <input
                type="text"
                placeholder={t('market.searchPlaceholder')}
                className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>

            {/* Horizontal Categories */}
            {filteredOffers.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <ShoppingBasket className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">{t('market.noResults')}</p>
              </div>
            ) : (
              <div className="space-y-10">
                {sortedCategories.map(category => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h2 className="text-xl font-bold text-gray-900">{t(`category.${category}`)}</h2>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">{groupedOffers[category].length} Items</span>
                    </div>

                    <div className="flex overflow-x-auto pb-4 space-x-5 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-gray-50 px-1">
                      {groupedOffers[category].map((offer) => {
                        const isFav = favorites.includes(offer.id);
                        const isComparing = compareList.includes(offer.id);

                        return (
                          <div key={offer.id} className="relative min-w-[220px] w-[240px] flex-shrink-0">
                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 z-10 flex gap-1">
                              {(user?.role === UserRole.CLIENT || user?.role === UserRole.PRODUCER) && (
                                <button
                                  onClick={(e) => { e.preventDefault(); toggleFavorite(offer.id); }}
                                  className="p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
                                >
                                  <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (isComparing) removeFromCompare(offer.id);
                                  else addToCompare(offer.id);
                                }}
                                className={`p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors ${isComparing ? 'text-blue-600' : 'text-gray-400'}`}
                              >
                                <Layers className="h-4 w-4" />
                              </button>
                            </div>

                            <Link to={`/offer/${offer.id}`} className="group relative bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden hover:shadow-lg transition-all h-full">
                              <div className="aspect-w-1 aspect-h-1 bg-gray-200 h-36 relative">
                                <img
                                  src={offer.imageUrl}
                                  alt={offer.title}
                                  className="w-full h-full object-cover object-center group-hover:opacity-90 transition-opacity"
                                />
                                <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">ATI Choice</div>
                              </div>
                              <div className="flex-1 p-3 space-y-2 flex flex-col">
                                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 h-10">
                                  {offer.title}
                                </h3>
                                <div className="flex items-center mb-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                  ))}
                                  <span className="text-xs text-gray-400 ml-1">(4.8)</span>
                                </div>
                                <div className="flex flex-col pt-2 border-t border-gray-100 mt-auto">
                                  <span className="text-lg font-bold text-gray-900">{offer.price.toLocaleString()} XAF</span>
                                  <span className="text-xs text-gray-500">{t('market.per')} {offer.unit}</span>
                                </div>
                                <button className="w-full mt-2 bg-blue-600 text-white py-2 rounded-md text-xs font-bold uppercase tracking-wide hover:bg-blue-700 transition-colors">
                                  {t('market.view')}
                                </button>
                              </div>
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
