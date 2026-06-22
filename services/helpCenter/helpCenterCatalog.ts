export type HelpCenterLanguage = 'en' | 'fr';

export type HelpCenterSection =
  | 'start-here'
  | 'client'
  | 'producer'
  | 'quick-help'
  | 'legal'
  | 'all';

export type HelpCenterTopicId =
  | 'getting-started'
  | 'accounts-security'
  | 'marketplace-buying'
  | 'retail-store'
  | 'orders-delivery-pickup'
  | 'payments-wallet-withdrawals'
  | 'selling-producer'
  | 'coupons-referrals'
  | 'chat-negotiation-safety'
  | 'support-disputes'
  | 'notifications'
  | 'faq'
  | 'troubleshooting'
  | 'policy-links';

export type HelpCenterTopicDef = {
  id: HelpCenterTopicId;
  order: number;
  sections: HelpCenterSection[];
  files: Record<HelpCenterLanguage, string>;
};

export type HelpCenterArticle = {
  topicId: HelpCenterTopicId;
  language: HelpCenterLanguage;
  title: string;
  body: string;
  excerpt: string;
  headings: string[];
  sections: HelpCenterSection[];
  order: number;
};

const markdownModules = import.meta.glob('../../Agrimarket help-center/{en,fr}/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const HELP_CENTER_TOPIC_DEFS: HelpCenterTopicDef[] = [
  {
    id: 'getting-started',
    order: 1,
    sections: ['start-here', 'all'],
    files: { en: 'getting-started.md', fr: 'commencer.md' },
  },
  {
    id: 'accounts-security',
    order: 2,
    sections: ['start-here', 'all'],
    files: { en: 'accounts-and-security.md', fr: 'comptes-et-securite.md' },
  },
  {
    id: 'marketplace-buying',
    order: 3,
    sections: ['client', 'all'],
    files: { en: 'marketplace-buying-guide.md', fr: 'guide-achat-marketplace.md' },
  },
  {
    id: 'selling-producer',
    order: 4,
    sections: ['producer', 'all'],
    files: { en: 'selling-guide-producer.md', fr: 'guide-vendeur-producteur.md' },
  },
  {
    id: 'retail-store',
    order: 5,
    sections: ['client', 'all'],
    files: { en: 'retail-store-guide.md', fr: 'guide-boutique-retail.md' },
  },
  {
    id: 'orders-delivery-pickup',
    order: 6,
    sections: ['client', 'producer', 'all'],
    files: { en: 'orders-delivery-pickup.md', fr: 'commandes-livraison-retrait.md' },
  },
  {
    id: 'payments-wallet-withdrawals',
    order: 7,
    sections: ['client', 'producer', 'all'],
    files: { en: 'payments-wallet-withdrawals.md', fr: 'paiements-portefeuille-retraits.md' },
  },
  {
    id: 'coupons-referrals',
    order: 8,
    sections: ['all'],
    files: { en: 'coupons-referrals.md', fr: 'coupons-parrainage.md' },
  },
  {
    id: 'chat-negotiation-safety',
    order: 9,
    sections: ['all'],
    files: { en: 'chat-negotiation-safety.md', fr: 'chat-negociation-securite.md' },
  },
  {
    id: 'support-disputes',
    order: 10,
    sections: ['all'],
    files: { en: 'support-and-disputes.md', fr: 'support-et-litiges.md' },
  },
  {
    id: 'notifications',
    order: 11,
    sections: ['all'],
    files: { en: 'notifications.md', fr: 'notifications.md' },
  },
  {
    id: 'faq',
    order: 12,
    sections: ['quick-help', 'all'],
    files: { en: 'faq.md', fr: 'faq.md' },
  },
  {
    id: 'troubleshooting',
    order: 13,
    sections: ['quick-help', 'all'],
    files: { en: 'troubleshooting-known-issues.md', fr: 'depannage-problemes-connus.md' },
  },
  {
    id: 'policy-links',
    order: 14,
    sections: ['legal', 'all'],
    files: { en: 'policy-links.md', fr: 'liens-politiques.md' },
  },
];

const filenameToTopicId = new Map<string, HelpCenterTopicId>();
for (const topic of HELP_CENTER_TOPIC_DEFS) {
  filenameToTopicId.set(topic.files.en, topic.id);
  filenameToTopicId.set(topic.files.fr, topic.id);
}

function resolveMarkdown(language: HelpCenterLanguage, filename: string): string {
  const path = `../../Agrimarket help-center/${language}/${filename}`;
  const content = markdownModules[path];
  if (!content) {
    throw new Error(`Help center article not found: ${language}/${filename}`);
  }
  return content;
}

export function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? 'Help Center';
}

export function extractHeadings(markdown: string): string[] {
  const headings: string[] = [];
  for (const line of markdown.split('\n')) {
    const match = line.match(/^#{2,3}\s+(.+)$/);
    if (match?.[1]) headings.push(match[1].trim());
  }
  return headings;
}

export function stripLeadingH1(markdown: string): string {
  return markdown.replace(/^#\s+.+\n+/, '').trimStart();
}

export function extractExcerpt(markdown: string): string {
  const withoutTitle = stripLeadingH1(markdown);
  const paragraphs = withoutTitle
    .split(/\n{2,}/)
    .map((block) => block.replace(/^#+\s+/gm, '').replace(/[*_`[\]]/g, '').trim())
    .filter((block) => block.length > 0 && !block.startsWith('-'));
  return paragraphs[0]?.slice(0, 180) ?? '';
}

function buildArticle(def: HelpCenterTopicDef, language: HelpCenterLanguage): HelpCenterArticle {
  const body = resolveMarkdown(language, def.files[language]);
  return {
    topicId: def.id,
    language,
    title: extractTitle(body),
    body,
    excerpt: extractExcerpt(body),
    headings: extractHeadings(body),
    sections: def.sections,
    order: def.order,
  };
}

const articleCache = new Map<string, HelpCenterArticle>();

export function getHelpCenterArticle(
  topicId: HelpCenterTopicId,
  language: HelpCenterLanguage,
): HelpCenterArticle | null {
  const def = HELP_CENTER_TOPIC_DEFS.find((topic) => topic.id === topicId);
  if (!def) return null;

  const cacheKey = `${language}:${topicId}`;
  const cached = articleCache.get(cacheKey);
  if (cached) return cached;

  const article = buildArticle(def, language);
  articleCache.set(cacheKey, article);
  return article;
}

export function getHelpCenterArticles(language: HelpCenterLanguage): HelpCenterArticle[] {
  return HELP_CENTER_TOPIC_DEFS.map((def) => getHelpCenterArticle(def.id, language)!);
}

export function isHelpCenterTopicId(value: string): value is HelpCenterTopicId {
  return HELP_CENTER_TOPIC_DEFS.some((topic) => topic.id === value);
}

export function getTopicIdFromFilename(filename: string): HelpCenterTopicId | null {
  const normalized = filename.replace(/^\.\//, '').split('/').pop() ?? filename;
  return filenameToTopicId.get(normalized) ?? null;
}

export function getAdjacentTopics(
  topicId: HelpCenterTopicId,
  language: HelpCenterLanguage,
): { prev: HelpCenterArticle | null; next: HelpCenterArticle | null } {
  const articles = getHelpCenterArticles(language);
  const index = articles.findIndex((article) => article.topicId === topicId);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? articles[index - 1] : null,
    next: index < articles.length - 1 ? articles[index + 1] : null,
  };
}

export const HELP_CENTER_FILTER_SECTIONS: HelpCenterSection[] = [
  'all',
  'start-here',
  'client',
  'producer',
  'quick-help',
  'legal',
];
