import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

import { formatCurrency } from '../../constants'

const tiers = [
  {
    title: 'Free',
    price: 0,
    description: [
      '1 user included',
      '1 locations included',
      'Unlimited storage',
      'Report download',
      'Email support',
      '24/7 customer support',
    ],
    buttonText: 'Sign up for free',
    buttonVariant: 'outlined',
    buttonColor: 'primary',
  },
  {
    title: 'Starter',
    price: 9970,
    description: [
      '2 users included',
      '2 locations included',
      'Unlimited storage',
      'Help center access',
      'report download',
      'Email support',
      '24/7 customer support',
    ],
    buttonText: 'Get started',
    buttonVariant: 'outlined',
    buttonColor: 'primary',
  },
  {
    title: 'Growth',
    subheader: 'Promotional offer',
    price: 19980,
    description: [
      '5 users included',
      '3 locations included',
      'Unlimited storage',
      'Report download',
      // 'AI assistant integrated',
      'Report download',
      'Help center access',
      'Priority email support',
      'Best deals',
      '24/7 customer support',
    ],
    buttonText: 'Start now',
    buttonVariant: 'contained',
    buttonColor: 'secondary',
  },
  {
    title: 'Enterprise',
    price: 49760,
    description: [
      'Unlimited users',
      'Unlimited locations',
      'unlimited storage',
      'Help center access priority',
      'Dedicated team',
      'Report download',
      // 'AI assistant integrated',
      'Phone & email support',
      '24/7 customer support',
    ],
    buttonText: 'Go smarter',
    buttonVariant: 'contained',
    buttonColor: 'primary',
  },
];

export default function Pricing( currency: string = 'XAF') {
  return (
    <Container
      id="pricing"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 3, sm: 6 },
      }}
    >
      <Box
        sx={{
          width: { sm: '100%', md: '60%' },
          textAlign: { sm: 'left', md: 'center' },
        }}
      >
        <Typography
          component="h2"
          variant="h4"
          gutterBottom
          sx={{ color: 'text.primary' }}
        >
          Pricing
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Chooze the subscription plan that&apos;s right for you and your team. <br />
        </Typography>
      </Box>
      <Grid
        container
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}
      >
        {tiers.map((tier) => (
          <Grid
            size={{ xs: 12, sm: tier.title === 'Enterprise' ? 6 : 4, md: 3 }}
            key={tier.title}
          >
            <Card
              sx={[
                {
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                },
                tier.title === 'Growth' &&
                  ((theme) => ({
                    border: 'none',
                    background:
                      'radial-gradient(circle at 50% 0%, hsl(220, 20%, 35%), hsl(220, 30%, 6%))',
                    boxShadow: `0 8px 12px hsla(220, 20%, 42%, 0.2)`,
                    ...theme.applyStyles('dark', {
                      background:
                        'radial-gradient(circle at 50% 0%, hsl(220, 20%, 20%), hsl(220, 30%, 16%))',
                      boxShadow: `0 8px 12px hsla(0, 0%, 0%, 0.8)`,
                    }),
                  })),
              ]}
            >
              <CardContent>
                <Box
                  sx={[
                    {
                      mb: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 2,
                    },
                    tier.title === 'Growth'
                      ? { color: 'grey.100' }
                      : { color: '' },
                  ]}
                >
                  <Typography component="h3" variant="h6">
                    {tier.title}
                  </Typography>
                  {tier.title === 'Growth' && (
                    <Chip icon={<AutoAwesomeIcon />} label={tier.subheader} />
                  )}
                </Box>
                <Box
                  sx={[
                    {
                      mb: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 2,
                    },
                    tier.title === 'Growth'
                      ? { color: 'grey.100' }
                      : { color: '' },
                  ]}
                >
                  
                  {/* Insert a cross over amount first for the promotionnal offer */}
                  {tier.title === 'Growth' && (
                    <Box
                      sx={{
                        textDecoration: 'line-through',
                        mr: 1,
                        fontSize: '1.5rem',
                        color: 'grey.400',
                      }}
                    >
                      {formatCurrency(28000, currency)}
                    </Box>
                  )}
                </Box>
                <Box
                  sx={[
                    {
                      display: 'flex',
                      alignItems: 'baseline',
                    },
                    tier.title === 'Growth'
                      ? { color: 'grey.50' }
                      : { color: null },
                  ]}
                >
                  <Typography component="h3" variant="h3">
                    {formatCurrency(tier.price, currency)}
                  </Typography>
                  <Typography component="h4" variant="h8">
                    &nbsp;/ month
                  </Typography>
                </Box>
                <Divider sx={{ my: 2, opacity: 0.8, borderColor: 'divider' }} />
                {tier.description.map((line) => (
                  <Box
                    key={line}
                    sx={{ py: 1, display: 'flex', gap: 1.5, alignItems: 'center' }}
                  >
                    <CheckCircleRoundedIcon
                      sx={[
                        {
                          width: 20,
                        },
                        tier.title === 'Growth'
                          ? { color: 'primary.light' }
                          : { color: 'primary.main' },
                      ]}
                    />
                    <Typography
                      variant="subtitle2"
                      component={'span'}
                      sx={[
                        tier.title === 'Growth'
                          ? { color: 'grey.50' }
                          : { color: null },
                      ]}
                    >
                      {line}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant={tier.buttonVariant as 'outlined' | 'contained'}
                  color={tier.buttonColor as 'primary' | 'secondary'}
                >
                  {tier.buttonText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
