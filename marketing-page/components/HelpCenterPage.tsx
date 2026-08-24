// import React from 'react';import Container from '@mui/material/Container';
// import Typography from '@mui/material/Typography';
// import Box from '@mui/material/Box';
// import Link from '@mui/material/Link';
// import { TRANSLATIONS } from '../../constants';
// import { useMarketingLang } from '../MarketingLangContext';

// export default function HelpCenterPage() {
//   const { lang } = useMarketingLang();
//   const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
//   const email = 'contact@acheteici.com';

//   return (
//     <Container sx={{ py: { xs: 6, sm: 12 } }}>
//       <Typography component="h1" variant="h4" gutterBottom>
//         {t('helpTitle')}
//       </Typography>
//       <Typography variant="body2" sx={{ mb: 2 }}>
//         {t('helpIntro')}
//       </Typography>

//       <Box sx={{ mt: 3 }}>
//         <Typography variant="h6">{t('helpGettingStartedTitle')}</Typography>
//         <Typography variant="body2" sx={{ mb: 2 }}>
//           {t('helpGettingStartedText')}
//         </Typography>

//         <Typography variant="h6">{t('helpSignInTitle')}</Typography>
//         <Typography variant="body2" sx={{ mb: 2 }}>
//           {t('helpSignInText')}
//         </Typography>

//         <Typography variant="h6">{t('helpInvitationsTitle')}</Typography>
//         <Typography variant="body2" sx={{ mb: 2 }}>
//           {t('helpInvitationsText')}
//         </Typography>

//         <Typography variant="h6">{t('helpOfflineTitle')}</Typography>
//         <Typography variant="body2" sx={{ mb: 2 }}>
//           {t('helpOfflineText')}
//         </Typography>

//         <Typography variant="h6">{t('helpSupportTitle')}</Typography>
//         <Typography variant="body2" sx={{ mb: 2 }}>
//           {t('helpSupportText').replace('{email}', email)}
//         </Typography>

//         <Typography variant="body2" sx={{ mt: 4 }}>
//           {t('helpDocLink')
//             .replace('{privacyLink}', `<Link href="/privacy">${t('footerPrivacyPolicy')}</Link>`)
//             .replace('{termsLink}', `<Link href="/terms">${t('footerTermsOfService')}</Link>`)}
//         </Typography>
//       </Box>
//     </Container>
//   );
// }

// import React from 'react';
// import Container from '@mui/material/Container';
// import Typography from '@mui/material/Typography';
// import Box from '@mui/material/Box';
// import Link from '@mui/material/Link';
// import { TRANSLATIONS } from '../../constants';
// import { useMarketingLang } from '../MarketingLangContext';
// import LanguageToggle from './LanguageToggle';

// export default function HelpCenterPage() {
//   const { lang } = useMarketingLang();
//   const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
//   const email = 'contact@acheteici.com';

//   return (
//     <Container sx={{ py: { xs: 4, sm: 6, md: 12 } }}>
//       {/* Header with title and language toggle */}
//       <Box
//         sx={{
//           display: 'flex',
//           flexDirection: { xs: 'column', sm: 'row' },
//           justifyContent: 'space-between',
//           alignItems: { xs: 'flex-start', sm: 'center' },
//           mb: 2,
//           gap: 1,
//         }}
//       >
//         <Typography component="h1" variant="h4" sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' } }}>
//           {t('helpTitle')}
//         </Typography>
//         <LanguageToggle />
//       </Box>

//       <Typography variant="body2" sx={{ mb: 3, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
//         {t('helpIntro')}
//       </Typography>

//       <Box sx={{ mt: 3 }}>
//         <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mt: 3 }}>
//           {t('helpGettingStartedTitle')}
//         </Typography>
//         <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
//           {t('helpGettingStartedText')}
//         </Typography>

//         <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mt: 3 }}>
//           {t('helpSignInTitle')}
//         </Typography>
//         <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
//           {t('helpSignInText')}
//         </Typography>

//         <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mt: 3 }}>
//           {t('helpInvitationsTitle')}
//         </Typography>
//         <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
//           {t('helpInvitationsText')}
//         </Typography>

//         <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mt: 3 }}>
//           {t('helpOfflineTitle')}
//         </Typography>
//         <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
//           {t('helpOfflineText')}
//         </Typography>

//         <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mt: 3 }}>
//           {t('helpSupportTitle')}
//         </Typography>
//         <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
//           {t('helpSupportText').replace('{email}', email)}
//         </Typography>

//         {/* <Typography variant="body2" sx={{ mt: 4, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
//           {t('helpDocLink')
//             .replace('{privacyLink}', `<a href="/privacy">${t('footerPrivacyPolicy')}</a>`)
//             .replace('{termsLink}', `<a href="/terms">${t('footerTermsOfService')}</a>`)}
//         </Typography> */}
//         <Typography variant="body2" sx={{ mt: 4, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
//           {t('helpDocLink')}
//           <Link href="/privacy" sx={{ ml: 0.5 }}>
//             {t('footerPrivacyPolicy')}
//           </Link>
//           <span> {t('and')} </span>
//           <Link href="/terms" sx={{ ml: 0.5 }}>
//             {t('footerTermsOfService')}
//           </Link>.
//         </Typography>
//       </Box>
//     </Container>
//   );
// }

import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import ReactMarkdown from 'react-markdown';
import { TRANSLATIONS } from '../../constants';
import { useMarketingLang } from '../MarketingLangContext';
import LanguageToggle from './LanguageToggle';

export default function HelpCenterPage() {
  const { lang } = useMarketingLang();
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
  const content = t('helpCenterContent');

  return (
    <Container sx={{ py: { xs: 4, sm: 6, md: 12 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 2,
          gap: 1,
        }}
      >
        <Typography component="h1" variant="h4" sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' } }}>
          {t('helpTitle')}
        </Typography>
        <LanguageToggle />
      </Box>

      <Box sx={{ mt: 2 }}>
        <ReactMarkdown
          components={{
            h1: ({ children }) => <Typography variant="h3" gutterBottom>{children}</Typography>,
            h2: ({ children }) => <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>{children}</Typography>,
            h3: ({ children }) => <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>{children}</Typography>,
            h4: ({ children }) => <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>{children}</Typography>,
            p: ({ children }) => <Typography variant="body2" paragraph sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{children}</Typography>,
            ul: ({ children }) => <Box component="ul" sx={{ pl: 2, mb: 2 }}>{children}</Box>,
            ol: ({ children }) => <Box component="ol" sx={{ pl: 2, mb: 2 }}>{children}</Box>,
            li: ({ children }) => <Typography component="li" variant="body2" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{children}</Typography>,
            a: ({ href, children }) => <Link href={href} underline="hover">{children}</Link>,
            code: ({ children }) => <code style={{ background: '#f5f5f5', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{children}</code>,
          }}
        >
          {content}
        </ReactMarkdown>
      </Box>
    </Container>
  );
}