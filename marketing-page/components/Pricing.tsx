// import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
// import Card from '@mui/material/Card';
// import Chip from '@mui/material/Chip';
// import CardActions from '@mui/material/CardActions';
// import CardContent from '@mui/material/CardContent';
// import Container from '@mui/material/Container';
// import Divider from '@mui/material/Divider';
// import Grid from '@mui/material/Grid';
// import Typography from '@mui/material/Typography';
// import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
// import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

// import { formatCurrency } from '../../constants'

// const tiers = [
//   {
//     title: 'Free',
//     price: 0,
//     description: [
//       '1 user included',
//       '1 locations included',
//       'Unlimited storage',
//       'Report download',
//       'Email support',
//       '24/7 customer support',
//     ],
//     buttonText: 'Sign up for free',
//     buttonVariant: 'outlined',
//     buttonColor: 'primary',
//   },
//   {
//     title: 'Starter',
//     price: 9970,
//     description: [
//       '2 users included',
//       '2 locations included',
//       'Unlimited storage',
//       'Help center access',
//       'report download',
//       'Email support',
//       '24/7 customer support',
//     ],
//     buttonText: 'Get started',
//     buttonVariant: 'outlined',
//     buttonColor: 'primary',
//   },
//   {
//     title: 'Growth',
//     subheader: 'Promotional offer',
//     price: 19980,
//     description: [
//       '5 users included',
//       '3 locations included',
//       'Unlimited storage',
//       // 'AI assistant integrated',
//       'Report download',
//       'Help center access',
//       'Priority email support',
//       'Best deals',
//       '24/7 customer support',
//     ],
//     buttonText: 'Start now',
//     buttonVariant: 'contained',
//     buttonColor: 'secondary',
//   },
//   {
//     title: 'Enterprise',
//     price: 49760,
//     description: [
//       'Unlimited users',
//       'Unlimited locations',
//       'unlimited storage',
//       'Help center access priority',
//       'Dedicated team',
//       'Report download',
//       // 'AI assistant integrated',
//       'Phone & email support',
//       'Priority email support',
//       '24/7 customer support',
//     ],
//     buttonText: 'Go smarter',
//     buttonVariant: 'contained',
//     buttonColor: 'primary',
//   },
// ];

// export default function Pricing( currency: string = 'XAF') {
//   return (
//     <Container
//       id="pricing"
//       sx={{
//         pt: { xs: 4, sm: 12 },
//         pb: { xs: 8, sm: 16 },
//         position: 'relative',
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         gap: { xs: 3, sm: 6 },
//       }}
//     >
//       <Box
//         sx={{
//           width: { sm: '100%', md: '60%' },
//           textAlign: { sm: 'left', md: 'center' },
//         }}
//       >
//         <Typography
//           component="h2"
//           variant="h4"
//           gutterBottom
//           sx={{ color: 'text.primary' }}
//         >
//           Pricing
//         </Typography>
//         <Typography variant="body1" sx={{ color: 'text.secondary' }}>
//           Chooze the subscription plan that&apos;s right for you and your team. <br />
//         </Typography>
//       </Box>
//       <Grid
//         container
//         spacing={2}
//         sx={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}
//       >
//         {tiers.map((tier) => (
//           <Grid
//             size={{ xs: 12, sm: tier.title === 'Enterprise' ? 6 : 4, md: 3 }}
//             key={tier.title}
//           >
//             <Card
//               sx={[
//                 {
//                   p: 2,
//                   display: 'flex',
//                   flexDirection: 'column',
//                   gap: 2,
//                 },
//                 tier.title === 'Growth' &&
//                   ((theme) => ({
//                     border: 'none',
//                     background:
//                       'radial-gradient(circle at 50% 0%, hsl(220, 20%, 35%), hsl(220, 30%, 6%))',
//                     boxShadow: `0 8px 12px hsla(220, 20%, 42%, 0.2)`,
//                     ...theme.applyStyles('dark', {
//                       background:
//                         'radial-gradient(circle at 50% 0%, hsl(220, 20%, 20%), hsl(220, 30%, 16%))',
//                       boxShadow: `0 8px 12px hsla(0, 0%, 0%, 0.8)`,
//                     }),
//                   })),
//               ]}
//             >
//               <CardContent>
//                 <Box
//                   sx={[
//                     {
//                       mb: 1,
//                       display: 'flex',
//                       justifyContent: 'space-between',
//                       alignItems: 'center',
//                       gap: 2,
//                     },
//                     tier.title === 'Growth'
//                       ? { color: 'grey.100' }
//                       : { color: '' },
//                   ]}
//                 >
//                   <Typography component="h3" variant="h6">
//                     {tier.title}
//                   </Typography>
//                   {tier.title === 'Growth' && (
//                     <Chip icon={<AutoAwesomeIcon />} label={tier.subheader} />
//                   )}
//                 </Box>
//                 <Box
//                   sx={[
//                     {
//                       mb: 1,
//                       display: 'flex',
//                       justifyContent: 'space-between',
//                       alignItems: 'center',
//                       gap: 2,
//                     },
//                     tier.title === 'Growth'
//                       ? { color: 'grey.100' }
//                       : { color: '' },
//                   ]}
//                 >
                  
//                   {/* Insert a cross over amount first for the promotionnal offer */}
//                   {tier.title === 'Growth' && (
//                     <Box
//                       sx={{
//                         textDecoration: 'line-through',
//                         mr: 1,
//                         fontSize: '1.5rem',
//                         color: 'grey.400',
//                       }}
//                     >
//                       {formatCurrency(28000, currency)}
//                     </Box>
//                   )}
//                 </Box>
//                 <Box
//                   sx={[
//                     {
//                       display: 'flex',
//                       alignItems: 'baseline',
//                     },
//                     tier.title === 'Growth'
//                       ? { color: 'grey.50' }
//                       : { color: null },
//                   ]}
//                 >
//                   <Typography component="h3" variant="h3">
//                     {formatCurrency(tier.price, currency)}
//                   </Typography>
//                   <Typography component="h4" variant="h4">
//                     &nbsp;/ month
//                   </Typography>
//                 </Box>
//                 <Divider sx={{ my: 2, opacity: 0.8, borderColor: 'divider' }} />
//                 {tier.description.map((line) => (
//                   <Box
//                     key={line}
//                     sx={{ py: 1, display: 'flex', gap: 1.5, alignItems: 'center' }}
//                   >
//                     <CheckCircleRoundedIcon
//                       sx={[
//                         {
//                           width: 20,
//                         },
//                         tier.title === 'Growth'
//                           ? { color: 'primary.light' }
//                           : { color: 'primary.main' },
//                       ]}
//                     />
//                     <Typography
//                       variant="subtitle2"
//                       component={'span'}
//                       sx={[
//                         tier.title === 'Growth'
//                           ? { color: 'grey.50' }
//                           : { color: null },
//                       ]}
//                     >
//                       {line}
//                     </Typography>
//                   </Box>
//                 ))}
//               </CardContent>
//               <CardActions>
//                 <Button
//                   fullWidth
//                   variant={tier.buttonVariant as 'outlined' | 'contained'}
//                   color={tier.buttonColor as 'primary' | 'secondary'}
//                 >
//                   {tier.buttonText}
//                 </Button>
//               </CardActions>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>
//     </Container>
//   );
// }


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
import { formatCurrency, TRANSLATIONS } from '../../constants';

interface PricingProps {
  lang: string;
  currency?: string;
}

export default function Pricing({ lang, currency = 'XAF' }: PricingProps) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

  const tiers = [
    {
      title: t('planFreeTitle'),
      price: 0,
      description: t('planFreeDescription').split('\n'),
      buttonText: t('planFreeButton'),
      buttonVariant: 'outlined' as const,
      buttonColor: 'primary' as const,
      // buttonColor: 'primary' as const,
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
        gap: { xs: 3, sm: 5, md: 6 },
      }}
    >
      <Box
        sx={{
          width: { xs: '100%', sm: '80%', md: '60%' },
          textAlign: { xs: 'center', md: 'center' },
        }}
      >
        <Typography
          component="h2"
          variant="h4"
          gutterBottom
          sx={{ color: 'text.primary', fontSize: { xs: '1.8rem', sm: '2.125rem' } }}
        >
          {t('pricingTitle')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          {t('pricingDesc')}
        </Typography>
      </Box>
      <Grid
        container
        spacing={{ xs: 2, sm: 3 }}
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
                  p: { xs: 1.5, sm: 2 },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
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
                    {formatCurrency(28000, currency)}
                  </Box>
                )}
                  <Typography component="h3" variant="h3" sx={[{ fontSize: { xs: '1rem', sm: '1.6rem' } },
                    tier.title === t('planGrowthTitle') ? { color: 'grey.100' } : { color: '' },
                  ]}>
                    {formatCurrency(tier.price, currency)}
                  </Typography>
                  <Typography component="h4" variant="h4" sx={{ fontSize: { xs: '1rem', sm: '0.8rem' }, fontWeight: 'light' }}>
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