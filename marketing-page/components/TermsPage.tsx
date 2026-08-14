import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

export default function TermsPage() {
  return (
    <Container sx={{ py: { xs: 6, sm: 12 } }}>
      <Typography component="h1" variant="h4" gutterBottom>
        Terms and Conditions — Smarter Panel
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        These terms govern access and use of Smarter Panel. This is a product
        draft and should be reviewed by legal before publishing.
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">Accounts and eligibility</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Organizations and owner accounts are responsible for profiles, users,
          subscriptions and compliance with these Terms.
        </Typography>

        <Typography variant="h6">Subscriptions and billing</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Plans may limit users and locations. Owners manage billing and can
          upgrade or renew through the Billing UI. Checkout may use a third
          party payment provider.
        </Typography>

        <Typography variant="h6">Product rules</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          The product enforces practical rules such as 7-day date limits and
          24-hour edit/delete locks on many records to reduce fraud and errors.
        </Typography>

        <Typography variant="body2" sx={{ mt: 4 }}>
          Contact legal: <Link href="mailto:contact@acheteici.com">contact@acheteici.com</Link>
        </Typography>
      </Box>
    </Container>
  );
}
