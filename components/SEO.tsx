import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  SEO_BRAND,
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_KEYWORDS,
  SEO_OG_IMAGE,
  SEO_OG_IMAGE_ALT,
  SEO_OG_IMAGE_HEIGHT,
  SEO_OG_IMAGE_WIDTH,
  SEO_TWITTER_HANDLE,
  absoluteUrl,
  buildPageTitle,
} from '../services/seo/seoConfig';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  type?: 'website' | 'article' | 'product';
  imageUrl?: string;
  url?: string;
  noindex?: boolean;
  canonicalUrl?: string;
  schema?: Record<string, unknown> | Array<Record<string, unknown> | undefined>;
  locale?: 'en' | 'fr';
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description = SEO_DEFAULT_DESCRIPTION,
  keywords = SEO_DEFAULT_KEYWORDS,
  type = 'website',
  imageUrl,
  url,
  noindex = false,
  canonicalUrl,
  schema,
  locale = 'en',
}) => {
  const fullTitle = buildPageTitle(title);
  const fullUrl = url ? absoluteUrl(url) : absoluteUrl('/');
  const canonical = canonicalUrl ? absoluteUrl(canonicalUrl) : fullUrl;
  const resolvedImage = imageUrl?.startsWith('http')
    ? imageUrl
    : absoluteUrl(imageUrl ?? SEO_OG_IMAGE);
  const ogLocale = locale === 'fr' ? 'fr_FR' : 'en_US';
  const ogLocaleAlternate = locale === 'fr' ? 'en_US' : 'fr_FR';
  const twitterHandle = SEO_TWITTER_HANDLE.startsWith('@')
    ? SEO_TWITTER_HANDLE
    : SEO_TWITTER_HANDLE
      ? `@${SEO_TWITTER_HANDLE}`
      : '';

  const schemaList = schema
    ? (Array.isArray(schema) ? schema : [schema]).filter(
        (entry): entry is Record<string, unknown> => entry != null,
      )
    : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:image:width" content={String(SEO_OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(SEO_OG_IMAGE_HEIGHT)} />
      <meta property="og:image:alt" content={SEO_OG_IMAGE_ALT} />
      <meta property="og:site_name" content={SEO_BRAND} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={ogLocaleAlternate} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />
      <meta name="twitter:image:alt" content={SEO_OG_IMAGE_ALT} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
      {twitterHandle && <meta name="twitter:creator" content={twitterHandle} />}

      {schemaList.map((entry, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
};
