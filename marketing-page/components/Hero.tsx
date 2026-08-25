// import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
// import Container from '@mui/material/Container';
// import InputLabel from '@mui/material/InputLabel';
// import Link from '@mui/material/Link';
// import Stack from '@mui/material/Stack';
// import TextField from '@mui/material/TextField';
// import Typography from '@mui/material/Typography';
// import visuallyHidden from '@mui/utils/visuallyHidden';
// import { styled } from '@mui/material/styles';

// const StyledBox = styled('div')(({ theme }) => ({
//   alignSelf: 'center',
//   width: '100%',
//   height: 600,
//   marginTop: theme.spacing(8),
//   borderRadius: (theme.vars || theme).shape.borderRadius,
//   outline: '6px solid',
//   outlineColor: 'hsla(220, 25%, 80%, 0.2)',
//   border: '1px solid',
//   borderColor: (theme.vars || theme).palette.grey[200],
//   boxShadow: '0 0 12px 8px hsla(220, 25%, 80%, 0.2)',
//   // backgroundImage: `url(${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/screenshots/material-ui/getting-started/templates/dashboard.jpg)`,
//   backgroundImage: `url(/assets/images/dashboard_view1.png)`,
//   backgroundSize: 'cover',
//   [theme.breakpoints.up('sm')]: {
//     marginTop: theme.spacing(10),
//     height: 800,
//     width: '110%',
//   },
//   ...theme.applyStyles('dark', {
//     boxShadow: '0 0 24px 12px hsla(210, 100%, 25%, 0.2)',
//     backgroundImage: `url(/assets/images/dashboard_view1.png)`,
//     outlineColor: 'hsla(220, 20%, 42%, 0.1)',
//     borderColor: (theme.vars || theme).palette.grey[700],
//   }),
// }));

// export default function Hero() {
//   return (
//     <Box
//       id="hero"
//       sx={(theme) => ({
//         width: '100%',
//         backgroundRepeat: 'no-repeat',

//         backgroundImage:
//           'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 90%), transparent)',
//         ...theme.applyStyles('dark', {
//           backgroundImage:
//             'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 16%), transparent)',
//         }),
//       })}
//     >
//       <Container
//         sx={{
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           pt: { xs: 14, sm: 20 },
//           pb: { xs: 8, sm: 12 },
//         }}
//       >
//         <Stack
//           spacing={2}
//           useFlexGap
//           sx={{ alignItems: 'center', width: { xs: '100%', sm: '70%' } }}
//         >
//           <Typography
//             variant="h2"
//             sx={{
//               display: 'flex',
//               flexDirection: { xs: 'column', sm: 'row' },
//               alignItems: 'center',
//               fontSize: 'clamp(2rem, 6vw, 2.5rem)',
//             }}
//           >
//             Your&nbsp;new&nbsp;business&nbsp;companion&nbsp;
//             <Typography
//               component="span"
//               variant="h1"
//               sx={(theme) => ({
//                 fontSize: 'inherit',
//                 color: 'primary.main',
//                 ...theme.applyStyles('dark', {
//                   color: 'primary.light',
//                 }),
//               })}
//             >
//               SMARTER&nbsp;PANEL
//             </Typography>
//           </Typography>
//           <Typography
//             sx={{
//               textAlign: 'center',
//               color: 'text.secondary',
//               width: { sm: '100%', md: '80%' },
//             }}
//           >
//             SMARTER PANEL is a comprehensive HR and Accounting management dashboard for business operations. 
//             Features include income/expense tracking, inventory management, staff administration, and financial reporting.
//           </Typography>
//           <Button color="secondary" variant="contained" size="large" sx={{ mt: 4}} href="/">
//             Get it now
//           </Button>
//         </Stack>
//         <StyledBox id="image" />
//       </Container>
//     </Box>
//   );
// }

// import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
// import Container from '@mui/material/Container';
// import Typography from '@mui/material/Typography';
// import { styled } from '@mui/material/styles';
// import { TRANSLATIONS } from '../../constants';

// const StyledBox = styled('div')(({ theme }) => ({
//   alignSelf: 'center',
//   width: '100%',
//   height: 600,
//   marginTop: theme.spacing(8),
//   borderRadius: (theme.vars || theme).shape.borderRadius,
//   outline: '6px solid',
//   outlineColor: 'hsla(220, 25%, 80%, 0.2)',
//   border: '1px solid',
//   borderColor: (theme.vars || theme).palette.grey[200],
//   boxShadow: '0 0 12px 8px hsla(220, 25%, 80%, 0.2)',
//   // backgroundImage: `url(${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/screenshots/material-ui/getting-started/templates/dashboard.jpg)`,
//   backgroundImage: `url(/assets/images/dashboard_view1.png)`,
//   backgroundSize: 'cover',
//   [theme.breakpoints.up('sm')]: {
//     marginTop: theme.spacing(10),
//     height: 800,
//     width: '110%',
//   },
//   ...theme.applyStyles('dark', {
//     boxShadow: '0 0 24px 12px hsla(210, 100%, 25%, 0.2)',
//     backgroundImage: `url(/assets/images/dashboard_view1.png)`,
//     outlineColor: 'hsla(220, 20%, 42%, 0.1)',
//     borderColor: (theme.vars || theme).palette.grey[700],
//   }),
// }));
// interface HeroProps {
//   lang: string;
// }

// export default function Hero({ lang }: HeroProps) {
//   const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

//   return (
//     <Box
//       id="hero"
//       sx={(theme) => ({
//         width: '100%',
//         backgroundRepeat: 'no-repeat',
//         backgroundImage:
//           'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 90%), transparent)',
//         ...theme.applyStyles('dark', {
//           backgroundImage:
//             'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 16%), transparent)',
//         }),
//       })}
//     >
//       <Container
//         sx={{
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           pt: { xs: 10, sm: 16, md: 20 },
//           pb: { xs: 6, sm: 10, md: 12 },
//           px: { xs: 2, sm: 3, md: 4 },
//         }}
//       >
//         <Box
//           sx={{
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             width: { xs: '100%', sm: '80%', md: '70%' },
//             gap: { xs: 1, sm: 2 },
//           }}
//         >
//           <Typography
//             variant="h2"
//             component="h1"
//             sx={{
//               fontSize: { xs: 'clamp(1.8rem, 10vw, 1.6rem)', sm: 'clamp(2.5rem, 6vw, 2.8rem)' },
//               textAlign: 'center',
//               width: '100%',
//               maxWidth: '100%',
//               lineHeight: 1.2,
//             }}
//           >{t('heroTitle')}
//           <Typography
//               component="span"
//               sx={{
//                 fontSize: 'inherit',
//                 color: 'primary.main',
//                 display: 'inline',
//               }}
//             >
//               <span dangerouslySetInnerHTML={{ __html: t('heroHighlight') }} />
//             </Typography>
//           </Typography>
//           <Typography
//             sx={{
//               textAlign: 'center',
//               color: 'text.secondary',
//               width: { xs: '100%', sm: '90%', md: '80%' },
//               fontSize: { xs: '0.9rem', sm: '1rem' },
//             }}
//           >
//             {t('heroSubtitle')}
//           </Typography>
//           <Button
//             color="secondary"
//             variant="contained"
//             size="large"
//             // sx={{ mt: { xs: 2, sm: 2 } }}
//             href="/"
//           >
//             {t('getItNow')}
//           </Button>
//         </Box>
//         <StyledBox id="image" />
//       </Container>
//     </Box>
//   );
// }

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { TRANSLATIONS } from '../../constants';

const StyledBox = styled('div')(({ theme }) => ({
  alignSelf: 'center',
  width: '100%',
  maxWidth: '100%',              // prevent overflow on mobile
  height: 250,                   // mobile base height
  marginTop: theme.spacing(2),   // mobile margin
  borderRadius: (theme.vars || theme).shape.borderRadius,
  outline: '6px solid',
  outlineColor: 'hsla(220, 25%, 80%, 0.2)',
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.grey[200],
  boxShadow: '0 0 12px 8px hsla(220, 25%, 80%, 0.2)',
  backgroundImage: `url(/assets/images/dashboard_view1.png)`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  [theme.breakpoints.up('sm')]: {
    height: 450,
    marginTop: theme.spacing(4),
  },
  [theme.breakpoints.up('md')]: {
    height: 600,
    marginTop: theme.spacing(6),
  },
  [theme.breakpoints.up('lg')]: {
    height: 800,
    width: '110%',
    marginTop: theme.spacing(10),
  },
  ...theme.applyStyles('dark', {
    boxShadow: '0 0 24px 12px hsla(210, 100%, 25%, 0.2)',
    backgroundImage: `url(/assets/images/dashboard_view1.png)`,
    outlineColor: 'hsla(220, 20%, 42%, 0.1)',
    borderColor: (theme.vars || theme).palette.grey[700],
  }),
}));

// const StyledBox = styled('div')(({ theme }) => ({
//   alignSelf: 'center',
//   width: '100%',
//   height: 600,
//   marginTop: theme.spacing(8),
//   borderRadius: (theme.vars || theme).shape.borderRadius,
//   outline: '6px solid',
//   outlineColor: 'hsla(220, 25%, 80%, 0.2)',
//   border: '1px solid',
//   borderColor: (theme.vars || theme).palette.grey[200],
//   boxShadow: '0 0 12px 8px hsla(220, 25%, 80%, 0.2)',
//   // backgroundImage: `url(${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/screenshots/material-ui/getting-started/templates/dashboard.jpg)`,
//   backgroundImage: `url(/assets/images/dashboard_view1.png)`,
//   backgroundSize: 'cover',
//   [theme.breakpoints.up('sm')]: {
//     marginTop: theme.spacing(10),
//     height: 800,
//     width: '110%',
//   },
//   ...theme.applyStyles('dark', {
//     boxShadow: '0 0 24px 12px hsla(210, 100%, 25%, 0.2)',
//     backgroundImage: `url(/assets/images/dashboard_view1.png)`,
//     outlineColor: 'hsla(220, 20%, 42%, 0.1)',
//     borderColor: (theme.vars || theme).palette.grey[700],
//   }),
// }));
// interface HeroProps {
//   lang: string;
// }

interface HeroProps {
  lang: string;
}

export default function Hero({ lang }: HeroProps) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

  return (
    <Box
      id="hero"
      sx={(theme) => ({
        width: '100%',
        backgroundRepeat: 'no-repeat',
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 90%), transparent)',
        ...theme.applyStyles('dark', {
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 16%), transparent)',
        }),
      })}
    >
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: { xs: 10, sm: 16, md: 20 },
          pb: { xs: 6, sm: 10, md: 12 },
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: { xs: '100%', sm: '80%', md: '70%' },
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontSize: { xs: 'clamp(1.8rem, 10vw, 1.6rem)', sm: 'clamp(2.5rem, 6vw, 2.8rem)' },
              textAlign: 'center',
              width: '100%',
              maxWidth: '100%',
              lineHeight: 1.2,
            }}
          >
            {t('heroTitle')}
            <Typography
              component="span"
              sx={{
                fontSize: 'inherit',
                color: 'primary.main',
                display: 'inline',
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: t('heroHighlight') }} />
            </Typography>
          </Typography>
          <Typography
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              width: { xs: '100%', sm: '90%', md: '80%' },
              fontSize: { xs: '0.9rem', sm: '1rem' },
            }}
          >
            {t('heroSubtitle')}
          </Typography>
          <Button
            color="secondary"
            variant="contained"
            size="large"
            href="/"
            sx={{ mt: { xs: 1, sm: 2 } }}
          >
            {t('getItNow')}
          </Button>
        </Box>
        {/* <StyledBox id="image" /> */}
        {/* Image replacement */}
        <Box
          component="img"
          src="/assets/images/dashboard_view1.png"
          alt="Smarter Panel Dashboard Preview"
          sx={{
            alignSelf: 'center',
            width: { xs: '100%', sm: '100%', lg: '110%' },
            maxWidth: '100%',
            height: 'auto',
            marginTop: { xs: 2, sm: 4, md: 6, lg: 10 },
            borderRadius: '4px',
            outline: '6px solid',
            outlineColor: 'hsla(220, 25%, 80%, 0.2)',
            border: '1px solid',
            borderColor: 'grey.200',
            boxShadow: '0 0 12px 8px hsla(220, 25%, 80%, 0.2)',
            ...(theme) => theme.applyStyles('dark', {
              boxShadow: '0 0 24px 12px hsla(210, 100%, 25%, 0.2)',
              outlineColor: 'hsla(220, 20%, 42%, 0.1)',
              borderColor: 'grey.700',
            }),
          }}
        />
      </Container>
    </Box>
  );
}
