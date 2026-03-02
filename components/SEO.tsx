import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    type?: 'website' | 'article' | 'product';
    imageUrl?: string;
    url?: string;
    noindex?: boolean;
    canonicalUrl?: string;
    schema?: any; // JSON-LD schema object
}

const DEFAULT_DESCRIPTION = 'AgriMarket Connect brings you high-quality agricultural products directly from trusted local producers.';
const SITE_NAME = 'AgriMarket Connect';
const SUPPORTED_DOMAINS = ['https://acheteici.com', 'https://agrimarketconnect.shop'] as const;

/** Base URL for the current domain (supports both acheteici.com and agrimarketconnect.shop). */
function getBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }
    return SUPPORTED_DOMAINS[0];
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description = DEFAULT_DESCRIPTION,
    type = 'website',
    imageUrl,
    url,
    noindex = false,
    canonicalUrl,
    schema,
}) => {
    const baseUrl = getBaseUrl();
    const defaultImage = `${baseUrl}/og-image.jpg`;
    const fullTitle = `${title} | ${SITE_NAME}`;
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
    const canonical = canonicalUrl ? `${baseUrl}${canonicalUrl}` : fullUrl;
    const resolvedImage = imageUrl ?? defaultImage;

    return (
        <Helmet>
            {/* Basic HTML Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Crawler Control */}
            {noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow" />
            )}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={resolvedImage} />
            <meta property="og:site_name" content={SITE_NAME} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={resolvedImage} />

            {/* JSON-LD Schema (Rich Snippets) */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};
