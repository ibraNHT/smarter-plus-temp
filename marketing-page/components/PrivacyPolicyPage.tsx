// import React from 'react';
// import Container from '@mui/material/Container';
// import Typography from '@mui/material/Typography';
// import Box from '@mui/material/Box';
// import Link from '@mui/material/Link';

// export default function PrivacyPolicyPage() {
//   return (
//     <Container sx={{ py: { xs: 6, sm: 12 } }}>
//       <Typography component="h1" variant="h4" gutterBottom>
//         Privacy Policy — Smarter Panel
//       </Typography>
//       <Typography variant="body2" sx={{ mb: 2 }}>
//         This page summarizes how Smarter Panel collects and processes data.
//         This is a product-facing draft — have legal review for production.
//       </Typography>

//       <Box sx={{ mt: 3 }}>
//         <Typography variant="h6">What we collect</Typography>
//         <Typography variant="body2" sx={{ mb: 2 }}>
//           We collect account/profile data, organization data, operational
//           business data (income, expenses, inventory, HR), billing and support
//           communications, authentication data (OTP and tokens), and
//           client-side caches for offline support.
//         </Typography>

//         <Typography variant="h6">Why we process data</Typography>
//         <Typography variant="body2" sx={{ mb: 2 }}>
//           To provide and secure the Service, support onboarding, billing,
//           offline continuity, and legal compliance. We do not sell your
//           personal information.
//         </Typography>

//         <Typography variant="h6">Sharing</Typography>
//         <Typography variant="body2" sx={{ mb: 2 }}>
//           We share data with your organization, our payment processor,
//           email providers, hosting infrastructure, and when required by law.
//         </Typography>

//         <Typography variant="h6">Retention & deletion</Typography>
//         <Typography variant="body2" sx={{ mb: 2 }}>
//           Active data is retained while your organization uses the Service.
//           Device caches persist until cleared. Contact privacy for export or
//           deletion requests.
//         </Typography>

//         <Typography variant="body2" sx={{ mt: 4 }}>
//           Contact: <Link href="mailto:contact@acheteici.com">contact@acheteici.com</Link>
//         </Typography>
//       </Box>
//     </Container>
//   );
// }

import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { TRANSLATIONS } from '../../constants';
import { useMarketingLang } from '../MarketingLangContext';
import LanguageToggle from './LanguageToggle';

export default function PrivacyPolicyPage() {
  const { lang } = useMarketingLang();
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
  const email = 'contact@acheteici.com';

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
          {t('privacyTitle')}
        </Typography>
        <LanguageToggle />
      </Box>

      <Typography variant="body2" sx={{ mb: 3, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
        {t('privacyIntro')}
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mt: 3 }}>
          {t('privacyWhatCollectTitle')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
          {t('privacyWhatCollectText')}
        </Typography>

        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mt: 3 }}>
          {t('privacyWhyProcessTitle')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
          {t('privacyWhyProcessText')}
        </Typography>

        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mt: 3 }}>
          {t('privacySharingTitle')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
          {t('privacySharingText')}
        </Typography>

        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mt: 3 }}>
          {t('privacyRetentionTitle')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
          {t('privacyRetentionText')}
        </Typography>

        <Typography variant="body2" sx={{ mt: 4, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
          {t('privacyContact').replace('{email}', email)}
        </Typography>
      </Box>
    </Container>
  );
}
