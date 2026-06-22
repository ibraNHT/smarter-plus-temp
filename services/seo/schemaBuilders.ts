import {
  SEO_BRAND,
  SEO_CANONICAL_ORIGIN,
  SEO_DEFAULT_DESCRIPTION,
  SEO_OG_IMAGE,
  SEO_OG_IMAGE_ALT,
  absoluteUrl,
  socialSameAs,
} from './seoConfig';

type BreadcrumbItem = { name: string; path: string };

export function buildOrganizationSchema(overrides?: Record<string, unknown>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_BRAND,
    url: SEO_CANONICAL_ORIGIN,
    logo: absoluteUrl('/pwa-512x512.png'),
    description: SEO_DEFAULT_DESCRIPTION,
    areaServed: 'Africa',
    sameAs: socialSameAs(),
    ...overrides,
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_BRAND,
    url: SEO_CANONICAL_ORIGIN,
    description: SEO_DEFAULT_DESCRIPTION,
    inLanguage: ['en', 'fr'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl('/market/producers')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildCollectionPageSchema(options: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    isPartOf: {
      '@type': 'WebSite',
      name: SEO_BRAND,
      url: SEO_CANONICAL_ORIGIN,
    },
  };
}

export function buildWebPageSchema(options: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    isPartOf: {
      '@type': 'WebSite',
      name: SEO_BRAND,
      url: SEO_CANONICAL_ORIGIN,
    },
  };
}

export function buildArticleSchema(options: {
  headline: string;
  description: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: options.headline,
    description: options.description,
    url: absoluteUrl(options.path),
    image: absoluteUrl(SEO_OG_IMAGE),
    author: {
      '@type': 'Organization',
      name: SEO_BRAND,
    },
    publisher: {
      '@type': 'Organization',
      name: SEO_BRAND,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(SEO_OG_IMAGE),
      },
    },
  };
}

export function buildFaqPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildProducerProfileSchema(options: {
  name: string;
  description?: string;
  path: string;
  imageUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options.name,
    description:
      options.description ??
      `${options.name} — verified agricultural producer on ${SEO_BRAND}, Africa's trusted farming marketplace.`,
    url: absoluteUrl(options.path),
    ...(options.imageUrl ? { image: options.imageUrl } : {}),
    memberOf: {
      '@type': 'Organization',
      name: SEO_BRAND,
      url: SEO_CANONICAL_ORIGIN,
    },
  };
}

export function buildProductBreadcrumbSchema(offerTitle: string, offerId: string) {
  return buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Producer Market', path: '/market/producers' },
    { name: offerTitle, path: `/offer/${offerId}` },
  ]);
}

export { SEO_OG_IMAGE_ALT };
