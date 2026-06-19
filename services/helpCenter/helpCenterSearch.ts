import {
  getHelpCenterArticles,
  type HelpCenterArticle,
  type HelpCenterLanguage,
  type HelpCenterSection,
  type HelpCenterTopicId,
} from './helpCenterCatalog';

export type HelpCenterSearchResult = {
  topicId: HelpCenterTopicId;
  title: string;
  excerpt: string;
  score: number;
  matchedIn: 'title' | 'heading' | 'body';
};

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function tokenizeQuery(query: string): string[] {
  return normalizeSearchText(query)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function scoreArticle(article: HelpCenterArticle, tokens: string[]): HelpCenterSearchResult | null {
  const title = normalizeSearchText(article.title);
  const headings = normalizeSearchText(article.headings.join(' '));
  const body = normalizeSearchText(stripMarkdown(article.body));

  let score = 0;
  let matchedIn: HelpCenterSearchResult['matchedIn'] = 'body';

  for (const token of tokens) {
    if (title.includes(token)) {
      score += 10;
      matchedIn = 'title';
    } else if (headings.includes(token)) {
      score += 5;
      if (matchedIn === 'body') matchedIn = 'heading';
    } else if (body.includes(token)) {
      score += 1;
    } else {
      return null;
    }
  }

  if (score === 0) return null;

  return {
    topicId: article.topicId,
    title: article.title,
    excerpt: article.excerpt,
    score,
    matchedIn,
  };
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^#+\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchHelpCenterArticles(
  language: HelpCenterLanguage,
  query: string,
  options?: {
    section?: HelpCenterSection | null;
    topicId?: HelpCenterTopicId | null;
  },
): HelpCenterSearchResult[] {
  const tokens = tokenizeQuery(query);
  const articles = getHelpCenterArticles(language).filter((article) => {
    if (options?.topicId && article.topicId !== options.topicId) return false;
    if (options?.section && options.section !== 'all' && !article.sections.includes(options.section)) {
      return false;
    }
    return true;
  });

  if (tokens.length === 0) {
    return articles.map((article) => ({
      topicId: article.topicId,
      title: article.title,
      excerpt: article.excerpt,
      score: 0,
      matchedIn: 'title' as const,
    }));
  }

  return articles
    .map((article) => scoreArticle(article, tokens))
    .filter((result): result is HelpCenterSearchResult => result !== null)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}
