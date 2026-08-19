import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

export default function PrivacyPolicyPage() {
  return (
    <Container sx={{ py: { xs: 6, sm: 12 } }}>
      <Typography component="h1" variant="h4" gutterBottom>
        Privacy Policy — Smarter Panel
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        This page summarizes how Smarter Panel collects and processes data.
        This is a product-facing draft — have legal review for production.
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">What we collect</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          We collect account/profile data, organization data, operational
          business data (income, expenses, inventory, HR), billing and support
          communications, authentication data (OTP and tokens), and
          client-side caches for offline support.
        </Typography>

        <Typography variant="h6">Why we process data</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          To provide and secure the Service, support onboarding, billing,
          offline continuity, and legal compliance. We do not sell your
          personal information.
        </Typography>

        <Typography variant="h6">Sharing</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          We share data with your organization, our payment processor,
          email providers, hosting infrastructure, and when required by law.
        </Typography>

        <Typography variant="h6">Retention & deletion</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Active data is retained while your organization uses the Service.
          Device caches persist until cleared. Contact privacy for export or
          deletion requests.
        </Typography>

        <Typography variant="body2" sx={{ mt: 4 }}>
          Contact: <Link href="mailto:contact@acheteici.com">contact@acheteici.com</Link>
        </Typography>
      </Box>
    </Container>
  );
}
