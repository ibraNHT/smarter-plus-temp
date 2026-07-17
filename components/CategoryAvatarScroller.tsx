import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../services/i18nContext';
import { CATEGORY_SCROLLER_ITEMS, getCategoryAvatar } from '../data/categoryVisuals';

type CategoryAvatarScrollerProps = {
  selected: string;
  onSelect: (category: string) => void;
  /** When omitted, uses All + MARKETPLACE_CATEGORIES. Pass without "All". */
  categories?: readonly string[];
  className?: string;
  sticky?: boolean;
};

export const CategoryAvatarScroller: React.FC<CategoryAvatarScrollerProps> = ({
  selected,
  onSelect,
  categories,
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
      className={`flex w-full min-w-0 overflow-x-auto snap-x snap-mandatory gap-4 md:gap-5 pb-3 pt-1 px-1 scrollbar-thin ${
        sticky ? 'sticky top-0 z-20 bg-white/95 backdrop-blur-sm -mx-1 px-2 py-2 border-b border-gray-100' : ''
      } ${className}`}
      role="listbox"
      aria-label={t('form.category')}
    >
      {items.map((category) => {
        const isSelected = selected === category;
        const label =
          category === 'All' ? t('market.allCategories') : t(`category.${category}`);
        const avatarSrc = getCategoryAvatar(category);

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
            <span
              className={`relative block w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-full overflow-hidden transition-transform duration-200 ${
                isSelected
                  ? 'ring-4 ring-primary-500 ring-offset-2 scale-105 shadow-md'
                  : 'ring-2 ring-gray-200 group-hover:ring-primary-300 group-active:scale-95'
              }`}
            >
              <img
                src={avatarSrc}
                alt=""
                width={72}
                height={72}
                draggable={false}
                className={`w-full h-full object-cover transition-[filter,transform] duration-200 ${
                  isSelected ? 'brightness-110 scale-105' : 'group-hover:brightness-105'
                }`}
                loading="lazy"
                decoding="async"
              />
            </span>
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
