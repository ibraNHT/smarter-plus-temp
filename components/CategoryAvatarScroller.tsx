import React, { useEffect, useRef, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useTranslation } from '../services/i18nContext';
import { CATEGORY_SCROLLER_ITEMS, getCategoryAvatar } from '../data/categoryVisuals';
import { offerImageThumb } from '../utils/offerImageDisplay';

type CategoryAvatarScrollerProps = {
  selected: string;
  onSelect: (category: string) => void;
  /** When omitted, uses All + MARKETPLACE_CATEGORIES. Pass without "All". */
  categories?: readonly string[];
  /** Optional name→imageUrl map (e.g. retail/ATI categories from the backend). */
  categoryImages?: Record<string, string | undefined>;
  /**
   * Optional name→label overrides for the CURRENT language. Retail/ATI
   * categories are created by staff in AgriAdmin and have no static
   * `category.*` translation key, so their localized wording is supplied here.
   * Names absent from the map fall back to the static translations.
   */
  categoryLabels?: Record<string, string | undefined>;
  className?: string;
  sticky?: boolean;
};

/**
 * "All Categories" is a filter, not a product type — never show a product photo
 * (the old /categories/all.webp vegetable shot looked like a random pick).
 */
const AllCategoriesAvatar: React.FC<{ isSelected: boolean }> = ({ isSelected }) => (
  <span
    className={`relative flex w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] items-center justify-center rounded-full transition-transform duration-200 ${
      isSelected
        ? 'ring-4 ring-primary-500 ring-offset-2 scale-105 shadow-md bg-primary-50 text-primary-700'
        : 'ring-2 ring-gray-200 bg-gray-50 text-gray-500 group-hover:ring-primary-300 group-hover:text-primary-600 group-active:scale-95'
    }`}
    aria-hidden
  >
    <LayoutGrid className="h-7 w-7 md:h-8 md:w-8" strokeWidth={1.75} />
  </span>
);

const CategoryChipAvatar: React.FC<{
  category: string;
  overrideUrl?: string;
  isSelected: boolean;
}> = ({ category, overrideUrl, isSelected }) => {
  const localSrc = getCategoryAvatar(category);
  const remoteSrc = overrideUrl ? offerImageThumb(overrideUrl, 'thumb') : null;
  const [remoteReady, setRemoteReady] = useState(false);
  const [remoteFailed, setRemoteFailed] = useState(false);
  const showLocalUnderlay = !remoteSrc || remoteFailed;

  useEffect(() => {
    setRemoteReady(false);
    setRemoteFailed(false);
  }, [category, overrideUrl, remoteSrc]);

  if (category === 'All') {
    return <AllCategoriesAvatar isSelected={isSelected} />;
  }

  return (
    <span
      className={`relative block w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-full overflow-hidden transition-transform duration-200 ${
        isSelected
          ? 'ring-4 ring-primary-500 ring-offset-2 scale-105 shadow-md'
          : 'ring-2 ring-gray-200 group-hover:ring-primary-300 group-active:scale-95'
      }`}
    >
      {/* Neutral placeholder while store thumb loads — no marketplace art flash. */}
      {remoteSrc && !remoteReady && !remoteFailed && (
        <span className="absolute inset-0 bg-gray-100 animate-pulse" aria-hidden />
      )}
      {showLocalUnderlay && (
        <img
          src={localSrc}
          alt=""
          width={72}
          height={72}
          draggable={false}
          className={`absolute inset-0 w-full h-full object-cover transition-[filter,transform] duration-200 ${
            isSelected ? 'brightness-110 scale-105' : 'group-hover:brightness-105'
          }`}
          loading="eager"
          decoding="async"
        />
      )}
      {remoteSrc && !remoteFailed && (
        <img
          src={remoteSrc}
          alt=""
          width={72}
          height={72}
          draggable={false}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            remoteReady ? 'opacity-100' : 'opacity-0'
          } ${isSelected ? 'brightness-110 scale-105' : ''}`}
          loading="eager"
          decoding="async"
          onLoad={() => setRemoteReady(true)}
          onError={() => setRemoteFailed(true)}
        />
      )}
    </span>
  );
};

export const CategoryAvatarScroller: React.FC<CategoryAvatarScrollerProps> = ({
  selected,
  onSelect,
  categories,
  categoryImages,
  categoryLabels,
  className = '',
  sticky = false,
}) => {
  const { t } = useTranslation();
  const items = categories ? ['All', ...categories] : CATEGORY_SCROLLER_ITEMS;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const el = itemRefs.current[selected];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selected]);

  return (
    <div
      ref={scrollerRef}
      className={`flex w-full min-w-0 overflow-x-auto snap-x snap-mandatory gap-4 md:gap-5 px-2 pt-3.5 pb-3 scrollbar-thin ${
        sticky ? 'sticky top-0 z-20 bg-white/95 backdrop-blur-sm -mx-1 px-3 pt-4 pb-3 border-b border-gray-100' : ''
      } ${className}`}
      role="listbox"
      aria-label={t('form.category')}
    >
      {items.map((category) => {
        const isSelected = selected === category;
        const label =
          category === 'All'
            ? t('market.allCategories')
            : categoryLabels?.[category] ?? t(`category.${category}`);
        const override = categoryImages?.[category];

        return (
          <button
            key={category}
            ref={(node) => { itemRefs.current[category] = node; }}
            type="button"
            role="option"
            aria-selected={isSelected}
            aria-pressed={isSelected}
            aria-label={label}
            onClick={() => onSelect(category)}
            className="flex-none snap-start w-[4.75rem] md:w-[5.5rem] flex flex-col items-center gap-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg"
          >
            <CategoryChipAvatar
              category={category}
              overrideUrl={override}
              isSelected={isSelected}
            />
            <span
              className={`w-full text-center text-[11px] md:text-xs leading-tight line-clamp-2 ${
                isSelected ? 'font-semibold text-primary-700' : 'font-medium text-gray-600'
              }`}
            >
              {label}
            </span>
            <span
              className={`h-0.5 w-6 rounded-full transition-colors ${
                isSelected ? 'bg-primary-500' : 'bg-transparent'
              }`}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
};
