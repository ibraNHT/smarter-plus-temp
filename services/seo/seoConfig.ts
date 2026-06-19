export const SEO_CANONICAL_ORIGIN = 'https://acheteici.com';
export const SEO_BRAND = 'AgriMarket Connect';

export const SEO_DEFAULT_DESCRIPTION =
  "AgriMarket Connect on acheteici.com — Africa's trusted marketplace to buy and sell agricultural products. Verified farmers, secure payments, wholesale and retail.";

export const SEO_DEFAULT_KEYWORDS =
  'AgriMarket Connect, acheteici, agriculture in Africa, buy sell farming, agricultural marketplace, farm produce, wholesale agriculture, verified producers, farming marketplace Africa';

export const SEO_TWITTER_HANDLE = import.meta.env.VITE_TWITTER_HANDLE ?? '';
export const SEO_FACEBOOK_URL = import.meta.env.VITE_FACEBOOK_URL ?? '';
export const SEO_LINKEDIN_URL = import.meta.env.VITE_LINKEDIN_URL ?? '';
export const SEO_OG_IMAGE = '/og-image.jpg';
export const SEO_OG_IMAGE_WIDTH = 1200;
export const SEO_OG_IMAGE_HEIGHT = 630;
export const SEO_OG_IMAGE_ALT =
  'ATI — Achète Tout Ici, AgriMarket Connect marketplace on acheteici.com';

export const SEO_HOME_TITLE = 'Buy & Sell Agriculture in Africa';
export const SEO_HOME_DESCRIPTION =
  'AgriMarket Connect is Africa\'s trusted agricultural marketplace. Buy farm produce wholesale from verified producers or shop retail at the ATI Store. Secure escrow payments.';

export function absoluteUrl(path = ''): string {
  if (!path || path === '/') return SEO_CANONICAL_ORIGIN;
  return `${SEO_CANONICAL_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildPageTitle(pageTitle: string): string {
  const cleaned = pageTitle.replace(/\s*\|\s*AgriMarket(?:\s+Connect)?\s*$/i, '').trim();
  return `${cleaned} | ${SEO_BRAND}`;
}

export function socialSameAs(): string[] {
  return [SEO_FACEBOOK_URL, SEO_LINKEDIN_URL].filter((url) => url.length > 0);
}

export const SEO_PAGE_META: Record<string, { title: string; description: string; keywords?: string }> = {
  home: {
    title: SEO_HOME_TITLE,
    description: SEO_HOME_DESCRIPTION,
  },
  producerMarket: {
    title: 'Wholesale Agriculture Marketplace Africa',
    description:
      'Browse wholesale farm produce, livestock, and agricultural goods from verified producers across Africa. Buy direct from farmers on AgriMarket Connect.',
    keywords: 'wholesale agriculture Africa, buy farm produce, verified farmers, agricultural wholesale',
  },
  atiStore: {
    title: 'ATI Store — Retail Agricultural Products Africa',
    description:
      'Shop premium retail agricultural products at the ATI Store on AgriMarket Connect. Quality farm goods delivered with trust and secure payments.',
    keywords: 'retail agriculture Africa, ATI store, buy agricultural products online',
  },
  faq: {
    title: 'FAQ — Agriculture Marketplace Help',
    description:
      'Answers about escrow payments, delivery, producer verification, and platform fees on AgriMarket Connect — Africa\'s trusted agri marketplace.',
  },
  blog: {
    title: 'AgriMarket Insights — Agriculture News & Trends',
    description:
      'Latest news, farming tips, and agricultural market trends from AgriMarket Connect — connecting Africa\'s producers and buyers.',
  },
  jobs: {
    title: 'Careers at AgriMarket Connect',
    description:
      'Join AgriMarket Connect and help build Africa\'s trusted agricultural marketplace. Explore open roles in tech, operations, and agri-trade.',
  },
  partners: {
    title: 'Strategic Partners',
    description:
      'Meet the partners powering AgriMarket Connect — Africa\'s marketplace to buy and sell agricultural products with trust.',
  },
  terms: {
    title: 'Terms and Conditions',
    description:
      'Terms and conditions for using AgriMarket Connect on acheteici.com — Africa\'s agricultural marketplace for buyers and producers.',
  },
  privacy: {
    title: 'Privacy Policy',
    description:
      'Privacy policy for AgriMarket Connect on acheteici.com. Learn how we protect your data on Africa\'s trusted agri marketplace.',
  },
  register: {
    title: 'Create Your Account',
    description:
      'Join AgriMarket Connect on acheteici.com. Register as a client to buy farm products or as a producer to sell agriculture across Africa.',
  },
  registerClient: {
    title: 'Register as a Client — Buy Agriculture Online',
    description:
      'Create a client account on AgriMarket Connect to buy farm produce, livestock, and agricultural goods from verified African producers.',
  },
  registerProducer: {
    title: 'Register as a Producer — Sell Farm Products Online',
    description:
      'Join AgriMarket Connect as a verified producer. Sell agricultural products wholesale and retail to buyers across Africa with secure payments.',
  },
  helpCenter: {
    title: 'Help Center',
    description:
      'Guides for buying, selling, payments, and account security on AgriMarket Connect — Africa\'s trusted agricultural marketplace.',
  },
  compare: {
    title: 'Compare Products',
    description: 'Compare agricultural products on AgriMarket Connect.',
  },
  login: {
    title: 'Log In',
    description: 'Sign in to your AgriMarket Connect account on acheteici.com.',
  },
  verifyEmail: {
    title: 'Verify Email',
    description: 'Verify your email address for AgriMarket Connect.',
  },
};
