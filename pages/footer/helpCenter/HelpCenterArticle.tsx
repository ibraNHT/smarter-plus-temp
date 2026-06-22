import React, { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../services/i18nContext';
import {
  getAdjacentTopics,
  getHelpCenterArticle,
  getHelpCenterArticles,
  isHelpCenterTopicId,
  stripLeadingH1,
} from '../../../services/helpCenter/helpCenterCatalog';
import { HelpCenterMarkdown } from '../../../components/helpCenter/HelpCenterMarkdown';
import { HelpCenterLayout } from './HelpCenterLayout';
import { SEO } from '../../../components/SEO';
import { SEO_PAGE_META } from '../../../services/seo/seoConfig';
import { buildArticleSchema, buildBreadcrumbSchema } from '../../../services/seo/schemaBuilders';

export const HelpCenterArticle: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { language, t } = useTranslation();
  const allArticles = useMemo(() => getHelpCenterArticles(language), [language]);

  const validTopicId = topicId && isHelpCenterTopicId(topicId) ? topicId : null;
  const article = validTopicId ? getHelpCenterArticle(validTopicId, language) : null;
  const adjacent = validTopicId ? getAdjacentTopics(validTopicId, language) : { prev: null, next: null };

  if (!validTopicId || !article) {
    return <Navigate to="/help" replace />;
  }

  const { prev, next } = adjacent;

  const bodyWithoutTitle = stripLeadingH1(article.body);

  return (
    <HelpCenterLayout wide>
      <SEO
        title={article.title}
        description={article.excerpt || SEO_PAGE_META.helpCenter.description}
        url={`/help/${validTopicId}`}
        type="article"
        locale={language}
        schema={[
          buildArticleSchema({
            headline: article.title,
            description: article.excerpt || SEO_PAGE_META.helpCenter.description,
            path: `/help/${validTopicId}`,
          }),
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: SEO_PAGE_META.helpCenter.title, path: '/help' },
            { name: article.title, path: `/help/${validTopicId}` },
          ]),
        ]}
      />

      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              {t('helpCenter.allTopics')}
            </p>
            <ul className="space-y-1">
              {allArticles.map((item) => (
                <li key={item.topicId}>
                  <Link
                    to={`/help/${item.topicId}`}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                      item.topicId === validTopicId
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div>
          <Link
            to="/help"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('helpCenter.backToIndex')}
          </Link>

          <article className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8 md:p-10">
            <header className="border-b border-gray-200 pb-6 mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{article.title}</h1>
            </header>

            <HelpCenterMarkdown content={bodyWithoutTitle} />
          </article>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {prev ? (
              <Link
                to={`/help/${prev.topicId}`}
                className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{t('helpCenter.previous')}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{prev.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                to={`/help/${next.topicId}`}
                className="flex items-center justify-end gap-2 bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 transition-colors sm:text-right"
              >
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{t('helpCenter.next')}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{next.title}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </HelpCenterLayout>
  );
};
