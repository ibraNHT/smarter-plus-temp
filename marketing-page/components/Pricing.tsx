import React, { useState } from 'react';
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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { formatCurrency, TRANSLATIONS, CURRENCIES, type CurrencyCode } from '../../constants';

interface PricingProps {
  lang: string;
  currency?: string; // initial currency, defaults to XAF
}

export default function Pricing({ lang, currency = 'XAF' }: PricingProps) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

  const availableCurrencies = Object.keys(CURRENCIES) as CurrencyCode[];
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(
    availableCurrencies.includes(currency as CurrencyCode) ? (currency as CurrencyCode) : 'XAF'
  );

  // All prices are stored in XAF
  const tiers = [
    {
      title: t('planFreeTitle'),
      price: 0,
      description: t('planFreeDescription').split('\n'),
      buttonText: t('planFreeButton'),
      buttonVariant: 'outlined' as const,
      buttonColor: 'primary' as const,
    },
    {
      title: t('planStarterTitle'),
      price: 10000,
      description: t('planStarterDescription').split('\n'),
      buttonText: t('planStarterButton'),
      buttonVariant: 'outlined' as const,
      buttonColor: 'primary' as const,
    },
    {
      title: t('planGrowthTitle'),
      subheader: 'Promotional offer',
      price: 20000,
      description: t('planGrowthDescription').split('\n'),
      buttonText: t('planGrowthButton'),
      buttonVariant: 'contained' as const,
      buttonColor: 'secondary' as const,
    },
    {
      title: t('planEnterpriseTitle'),
      price: 50000,
      description: t('planEnterpriseDescription').split('\n'),
      buttonText: t('planEnterpriseButton'),
      buttonVariant: 'contained' as const,
      buttonColor: 'primary' as const,
    },
  ];

  return (
    <Container
      id="pricing"
      sx={{
        pt: { xs: 6, sm: 10, md: 12 },
        pb: { xs: 8, sm: 12, md: 16 },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 2, sm: 4, md: 5 },
      }}
    >
      <Box
        sx={{
          width: { xs: '100%', sm: '100%', md: '100%' },
          textAlign: { xs: 'center', md: 'center' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            mb: 1,
          }}
        >
          <Typography
            component="h2"
            variant="h4"
            sx={{ color: 'text.primary', fontSize: { xs: '1.8rem', sm: '2.125rem' } }}
          >
            {t('pricingTitle')}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="currency-select-label"><span className="mb-28">{t('currency')}</span></InputLabel>
            <Select
              labelId="currency-select-label"
              value={selectedCurrency}
              label="Currency"
              onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
            >
              {availableCurrencies.map((code) => (
                <MenuItem key={code} value={code}>
                  {code} ({CURRENCIES[code].symbol})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          {t('pricingDesc')}
        </Typography>
      </Box>

      <Grid
        container
        spacing={{ xs: 2, sm: 2 }}
        sx={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}
      >
        {tiers.map((tier) => (
          <Grid
            size={{ xs: 12, sm: 6, md: 3 }}
            key={tier.title}
            sx={{ display: 'flex' }}
          >
            <Card
              sx={[
                {
                  p: { xs: 0.5, sm: 1 },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  width: '100%',
                },
                tier.title === t('planGrowthTitle') &&
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
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                <Box
                  sx={[
                    {
                      mb: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                    },
                    tier.title === t('planGrowthTitle') ? { color: 'grey.100' } : { color: '' },
                  ]}
                >
                  {tier.title === t('planGrowthTitle') && (
                    <Chip icon={<AutoAwesomeIcon />} label={tier.subheader} size="small" />
                  )}
                  <Typography component="h3" variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {tier.title}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                    mb: 1,
                  }}
                >
                  {tier.title === t('planGrowthTitle') && (
                    <Box sx={{ textDecoration: 'line-through', color: 'grey.400', fontSize: '1.2rem' }}>
                      {formatCurrency(28000, selectedCurrency, 'XAF')}  {/* Convert from XAF */}
                    </Box>
                  )}
                  <Typography
                    component="h3"
                    variant="h3"
                    sx={[
                      { fontSize: { xs: '1.8rem', sm: '2.2rem' } },
                      tier.title === t('planGrowthTitle') ? { color: 'grey.100' } : { color: '' },
                    ]}
                  >
                    {formatCurrency(tier.price, selectedCurrency, 'XAF')}  {/* Convert from XAF */}
                  </Typography>
                  <Typography
                    component="h4"
                    variant="h4"
                    sx={[{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, fontWeight: 'light' },
                      tier.title === t('planGrowthTitle') ? { color: 'grey.100' } : { color: '' },
                    ]}
                  >
                    &nbsp;{t('perMonth')}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2, opacity: 0.8, borderColor: 'divider' }} />
                {tier.description.map((line: string) => (
                  <Box
                    key={line}
                    sx={{ py: 0.5, display: 'flex', gap: 1.5, alignItems: 'center' }}
                  >
                    <CheckCircleRoundedIcon
                      sx={[
                        { width: 20 },
                        tier.title === t('planGrowthTitle')
                          ? { color: 'primary.light' }
                          : { color: 'primary.main' },
                      ]}
                    />
                    <Typography
                      variant="subtitle2"
                      component="span"
                      sx={[
                        tier.title === t('planGrowthTitle') ? { color: 'grey.50' } : { color: null },
                        { fontSize: { xs: '0.75rem', sm: '0.875rem' } },
                      ]}
                    >
                      {line}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
              <CardActions sx={{ p: { xs: 1, sm: 2 }, pt: 0 }}>
                <Button
                  fullWidth
                  variant={tier.buttonVariant}
                  color={tier.buttonColor}
                  size={tier.title === t('planGrowthTitle') ? 'large' : 'medium'}
                  href="/"
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