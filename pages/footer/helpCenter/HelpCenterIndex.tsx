import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Search } from 'lucide-react';
import { useTranslation } from '../../../services/i18nContext';
import {
  HELP_CENTER_FILTER_SECTIONS,
  getHelpCenterArticles,
  type HelpCenterSection,
  type HelpCenterTopicId,
} from '../../../services/helpCenter/helpCenterCatalog';
import { searchHelpCenterArticles } from '../../../services/helpCenter/helpCenterSearch';
import { HelpCenterLayout } from './HelpCenterLayout';
import { SEO } from '../../../components/SEO';
import { SEO_PAGE_META } from '../../../services/seo/seoConfig';

const sectionLabelKey: Record<HelpCenterSection, string> = {
  all: 'helpCenter.section.allTopics',
  'start-here': 'helpCenter.section.startHere',
  client: 'helpCenter.section.client',
  producer: 'helpCenter.section.producer',
  'quick-help': 'helpCenter.section.quickHelp',
  legal: 'helpCenter.section.legal',
};

export const HelpCenterIndex: React.FC = () => {
  const { language, t } = useTranslation();
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<HelpCenterSection>('all');
  const [topicId, setTopicId] = useState<HelpCenterTopicId | ''>('');

  const articles = useMemo(() => getHelpCenterArticles(language), [language]);

  const results = useMemo(
    () =>
      searchHelpCenterArticles(language, query, {
        section: section === 'all' ? null : section,
        topicId: topicId || null,
      }),
    [language, query, section, topicId],
  );

  const showSearchResults = query.trim().length > 0;

  return (
    <HelpCenterLayout wide>
      <SEO
        title={SEO_PAGE_META.helpCenter.title}
        description={SEO_PAGE_META.helpCenter.description}
        url="/help"
        locale={language}
      />

      <div className="text-center mb-8 sm:mb-10">
        <BookOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-primary-600 mb-4" />
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">
          {t('helpCenter.title')}
        </h1>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto px-2">
          {t('helpCenter.subtitle')}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <label htmlFor="help-center-search" className="sr-only">
          {t('helpCenter.searchPlaceholder')}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="help-center-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('helpCenter.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {HELP_CENTER_FILTER_SECTIONS.map((filterSection) => (
            <button
              key={filterSection}
              type="button"
              onClick={() => setSection(filterSection)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                section === filterSection
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t(sectionLabelKey[filterSection])}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label htmlFor="help-center-topic" className="block text-sm font-medium text-gray-700 mb-1">
            {t('helpCenter.topicFilter')}
          </label>
          <select
            id="help-center-topic"
            value={topicId}
            onChange={(event) => setTopicId(event.target.value as HelpCenterTopicId | '')}
            className="w-full sm:w-auto min-w-[240px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{t('helpCenter.allTopics')}</option>
            {articles.map((article) => (
              <option key={article.topicId} value={article.topicId}>
                {article.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showSearchResults ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {results.length === 0 ? (
            <p className="p-6 text-gray-500 text-center">{t('helpCenter.noResults')}</p>
          ) : (
            results.map((result) => (
              <Link
                key={result.topicId}
                to={`/help/${result.topicId}`}
                className="flex items-start justify-between gap-4 p-4 sm:p-5 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">{result.title}</h2>
                  {result.excerpt && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{result.excerpt}</p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-8">{t('helpCenter.noResults')}</p>
          ) : (
            results.map((result) => (
              <Link
                key={result.topicId}
                to={`/help/${result.topicId}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700">
                  {result.title}
                </h2>
                {result.excerpt && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-3">{result.excerpt}</p>
                )}
                <span className="mt-4 inline-flex items-center text-sm font-medium text-primary-600">
                  {t('helpCenter.readArticle')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </HelpCenterLayout>
  );
};
