// import React from 'react';
// import Container from '@mui/material/Container';
// import Typography from '@mui/material/Typography';
// import Box from '@mui/material/Box';
// import Link from '@mui/material/Link';

// export default function TermsPage() {
//   return (
//     <Container sx={{ py: { xs: 6, sm: 12 } }}>
//       <Typography component="h1" variant="h4" gutterBottom>
//         Terms and Conditions — Smarter Panel
//       </Typography>
//       <Typography variant="body2" sx={{ mb: 2 }}>
//         These terms govern access and use of Smarter Panel. This is a product
//         draft and should be reviewed by legal before publishing.
//       </Typography>

//       <Box sx={{ mt: 3 }}>
//         <Typography variant="h6">Accounts and eligibility</Typography>
//         <Typography variant="body2" sx={{ mb: 2 }}>
//           Organizations and owner accounts are responsible for profiles, users,
//           subscriptions and compliance with these Terms.
//         </Typography>

//         <Typography variant="h6">Subscriptions and billing</Typography>
//         <Typography variant="body2" sx={{ mb: 2 }}>
//           Plans may limit users and locations. Owners manage billing and can
//           upgrade or renew through the Billing UI. Checkout may use a third
//           party payment provider.
//         </Typography>

//         <Typography variant="h6">Product rules</Typography>
//         <Typography variant="body2" sx={{ mb: 2 }}>
//           The product enforces practical rules such as 7-day date limits and
//           24-hour edit/delete locks on many records to reduce fraud and errors.
//         </Typography>

//         <Typography variant="body2" sx={{ mt: 4 }}>
//           Contact legal: <Link href="mailto:contact@acheteici.com">contact@acheteici.com</Link>
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

export default function TermsPage() {
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
          {t('termsTitle')}
        </Typography>
        <LanguageToggle />
      </Box>

      <Typography variant="body2" sx={{ mb: 3, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
        {t('termsIntro')}
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mt: 3 }}>
          {t('termsAccountsTitle')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
          {t('termsAccountsText')}
        </Typography>

        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mt: 3 }}>
          {t('termsSubscriptionsTitle')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
          {t('termsSubscriptionsText')}
        </Typography>

        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mt: 3 }}>
          {t('termsRulesTitle')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
          {t('termsRulesText')}
        </Typography>

        <Typography variant="body2" sx={{ mt: 4, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
          {t('termsContact').replace('{email}', email)}
        </Typography>
      </Box>
    </Container>
  );
}
