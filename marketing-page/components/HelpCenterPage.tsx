import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

export default function HelpCenterPage() {
  return (
    <Container sx={{ py: { xs: 6, sm: 12 } }}>
      <Typography component="h1" variant="h4" gutterBottom>
        Help Center — Smarter Panel
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Practical guide to using Smarter Panel. Below are topics to help you get
        started, troubleshoot common issues, and understand product limits and
        rules. For privacy and legal terms see the links at the bottom of the
        page.
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">Getting started</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Create an organization from the login screen, set a password (min
          6 chars) and verify using the code sent to your email. Complete the
          organization and personal profiles as prompted.
        </Typography>

        <Typography variant="h6">Sign in, OTP, and password reset</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Smarter Panel uses email one-time codes (OTP) for login, signup and
          password reset. If you don’t receive a code check spam/junk and use
          the resend button. In dev environments a dev OTP may be shown on
          screen when SMTP is not configured.
        </Typography>

        <Typography variant="h6">Invitations</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Admins invite users from Admin → Users. Invitees accept using the
          link or token in the email, set a password, then verify using an
          email code.
        </Typography>

        <Typography variant="h6">Offline mode</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          The PWA supports offline queues for some creates/updates/uploads. If
          you work offline, items are queued in the browser (IndexedDB) and
          synchronized when connectivity returns. Clearing site data can
          remove unsynced work.
        </Typography>

        <Typography variant="h6">Support</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Use the floating Support chat in the app or email our support team at{' '}
          <Link href="mailto:contact@acheteici.com">contact@acheteici.com</Link>.
        </Typography>

        <Typography variant="body2" sx={{ mt: 4 }}>
          For the full documentation see the{' '}
          <Link href="/privacy">Privacy Policy</Link> and{' '}
          <Link href="/terms">Terms and Conditions</Link>.
        </Typography>
      </Box>
    </Container>
  );
}
