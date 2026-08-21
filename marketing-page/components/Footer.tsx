// import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
// import Container from '@mui/material/Container';
// import IconButton from '@mui/material/IconButton';
// import InputLabel from '@mui/material/InputLabel';
// import Link from '@mui/material/Link';
// import Stack from '@mui/material/Stack';
// import TextField from '@mui/material/TextField';
// import Typography from '@mui/material/Typography';
// import GitHubIcon from '@mui/icons-material/GitHub';
// import LinkedInIcon from '@mui/icons-material/LinkedIn';
// import TwitterIcon from '@mui/icons-material/X';
// // import SitemarkIcon from './SitemarkIcon';
// import { Landmark } from 'lucide-react';
// import { Icon } from '@mui/material';

// function Copyright() {
//   return (
//     <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
//       {'Copyright © '}
//       <Link
//         href="/home"
//         sx={{
//           color: 'black',
//         }}
//       >
//         Smarter Panel
//       </Link>
//       {new Date().getFullYear()}
//     </Typography>
//   );
// }

// export default function Footer() {
//   return (
//     <Container
//       sx={{
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         gap: { xs: 4, sm: 8 },
//         py: { xs: 8, sm: 10 },
//         textAlign: { sm: 'center', md: 'left' },
//       }}
//     >
//       <Box
//         sx={{
//           display: 'flex',
//           flexDirection: { xs: 'column', sm: 'row' },
//           width: '100%',
//           justifyContent: 'space-between',
//         }}
//       >
//         <Box
//           sx={{
//             display: 'flex',
//             flexDirection: 'column',
//             gap: 4,
//             minWidth: { xs: '100%', sm: '60%' },
//           }}
//         >
//           <Box sx={{ width: { xs: '100%', sm: '60%' } }}>
//             <Box sx={{ display: 'flex'}}>
//               <Landmark className="w-auto h-auto text-blue-500 mt-4" />
//               <Typography variant="h5" sx={{ fontWeight: 600, mt: 2, color: 'secondary', ml: 1 }}>
//                 Smarter Panel
//               </Typography>
//             </Box>
//             <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
//               Smarter Panel is a powerful and user-friendly platform that helps businesses streamline their operations.
//             </Typography>
//           </Box>
//           {/* <Box
//             sx={{
//               display: { xs: 'flex', sm: 'none' },
//               flexDirection: 'column',
//               gap: 1,
//             }}
//           >
//             <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
//               Join the newsletter
//             </Typography>
//             <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
//               Subscribe for weekly updates. No spams ever!
//             </Typography>
//             <InputLabel htmlFor="email-newsletter">Email</InputLabel>
//             <Stack direction="row" spacing={1} useFlexGap>
//               <TextField
//                 id="email-newsletter"
//                 hiddenLabel
//                 size="small"
//                 variant="outlined"
//                 fullWidth
//                 aria-label="Enter your email address"
//                 placeholder="Your email address"
//                 slotProps={{
//                   htmlInput: {
//                     autoComplete: 'off',
//                     'aria-label': 'Enter your email address',
//                   },
//                 }}
//                 sx={{ width: '250px' }}
//               />
//               <Button
//                 variant="contained"
//                 color="primary"
//                 size="small"
//                 sx={{ flexShrink: 0 }}
//               >
//                 Subscribe
//               </Button>
//             </Stack>
//           </Box> */}
//         </Box>
//         <Box
//           sx={{
//             display: { xs: 'none', sm: 'flex' },
//             flexDirection: 'column',
//             gap: 1,
//           }}
//         >
//           <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
//             Product
//           </Typography>
//           <Link
//             variant="body2"
//             href="#hero"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Description
//           </Link>
//           <Link
//             variant="body2"
//             href="#features"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Features
//           </Link>
//           <Link
//             variant="body2"
//             href="#testimonials"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Testimonials
//           </Link>
//           {/* <Link
//             variant="body2"
//             href="#testimonials"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Pricing
//           </Link> */}
//           <Link
//             variant="body2"
//             href="#pricing"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Pricing
//           </Link>
//           <Link
//             variant="body2"
//             href="/help"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Help Center
//           </Link>
//           <Link
//             variant="body2"
//             href="#faq"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             FAQs
//           </Link>
//         </Box>
//         <Box
//           sx={{
//             display: { xs: 'none', sm: 'flex' },
//             flexDirection: 'column',
//             gap: 1,
//           }}
//         >
//           <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
//             Company
//           </Typography>
//           <Link
//             variant="body2"
//             href="#"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             About us
//           </Link>
//           <Link
//             variant="body2"
//             href="#"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Careers
//           </Link>
//           <Link
//             variant="body2"
//             href="#"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Press
//           </Link>
//         </Box>
//         {/* <Box
//           sx={{
//             display: { xs: 'none', sm: 'flex' },
//             flexDirection: 'column',
//             gap: 1,
//           }}
//         >
//           <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
//             Legal
//           </Typography>
//           <Link
//             variant="body2"
//             href="#"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Terms
//           </Link>
//           <Link
//             variant="body2"
//             href="#"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Privacy
//           </Link>
//           <Link
//             variant="body2"
//             href="#contact"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Contact
//           </Link>
//         </Box> */}
//       </Box>
//       <Box
//         sx={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           pt: { xs: 4, sm: 8 },
//           width: '100%',
//           borderTop: '1px solid',
//           borderColor: 'divider',
//         }}
//       >
//         <div>
//           <Link
//             variant="body2"
//             href="/privacy"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Privacy Policy
//           </Link>
//           <Typography sx={{ display: 'inline', mx: 0.5, opacity: 0.5 }}>
//             &nbsp;•&nbsp;
//           </Typography>
//           <Link
//             variant="body2"
//             href="/terms"
//             sx={{
//               color: 'text.secondary',
//             }}
//           >
//             Terms of Service
//           </Link>
//           <Copyright />
//         </div>
//         <Stack
//           direction="row"
//           spacing={1}
//           useFlexGap
//           sx={{ justifyContent: 'left', color: 'text.secondary' }}
//         >
//           <IconButton
//             color="inherit"
//             size="small"
//             href="https://github.com/mui"
//             aria-label="GitHub"
//             sx={{ alignSelf: 'center' }}
//           >
//             <GitHubIcon />
//           </IconButton>
//           <IconButton
//             color="inherit"
//             size="small"
//             href="https://x.com/MaterialUI"
//             aria-label="X"
//             sx={{ alignSelf: 'center' }}
//           >
//             <TwitterIcon />
//           </IconButton>
//           <IconButton
//             color="inherit"
//             size="small"
//             href="https://www.linkedin.com/company/mui/"
//             aria-label="LinkedIn"
//             sx={{ alignSelf: 'center' }}
//           >
//             <LinkedInIcon />
//           </IconButton>
//         </Stack>
//       </Box>
//     </Container>
//   );
// }


import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/X';
import { Landmark } from 'lucide-react';
import { TRANSLATIONS } from '../../constants';

interface FooterProps {
  lang: string;
}

function Copyright({ lang }: { lang: string }) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
  const year = new Date().getFullYear();
  return (
    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
      {t('footerCopyright').replace('{year}', year.toString())}
    </Typography>
  );
}

export default function Footer({ lang }: FooterProps) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 4, sm: 6, md: 8 },
        py: { xs: 6, sm: 8, md: 10 },
        textAlign: { xs: 'center', md: 'left' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          width: '100%',
          justifyContent: 'space-between',
          gap: { xs: 4, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: { xs: '100%', sm: '50%' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <Landmark className="w-auto h-auto text-blue-500" style={{ width: 32, height: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, mt: 1, color: 'secondary', ml: 1 }}>
              Smarter Panel
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: { sm: '80%' } }}>
            {t('footerDescription')}
          </Typography>
        </Box>

        {/* Responsive footer links: stack on mobile, row on larger */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 3, sm: 6, md: 8 },
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'center', sm: 'flex-end' },
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: { xs: 'center', sm: 'flex-start' } }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {t('footerProduct')}
            </Typography>
            <Link variant="body2" href="#hero" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('footerDescriptionLink')}
            </Link>
            <Link variant="body2" href="#features" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('footerFeaturesLink')}
            </Link>
            <Link variant="body2" href="#testimonials" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('footerTestimonialsLink')}
            </Link>
            <Link variant="body2" href="#pricing" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('footerPricingLink')}
            </Link>
            <Link variant="body2" href="/help" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('footerHelpCenter')}
            </Link>
            <Link variant="body2" href="#faq" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('footerFaq')}
            </Link>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: { xs: 'center', sm: 'flex-start' } }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {t('footerCompany')}
            </Typography>
            <Link variant="body2" href="#" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('footerAboutUs')}
            </Link>
            <Link variant="body2" href="#" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('footerCareers')}
            </Link>
            <Link variant="body2" href="#" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('footerPress')}
            </Link>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          pt: { xs: 4, sm: 6 },
          width: '100%',
          borderTop: '1px solid',
          borderColor: 'divider',
          gap: { xs: 2, sm: 0 },
          alignItems: { xs: 'center', sm: 'flex-start' },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: { xs: 1, sm: 0 } }}>
          <Link variant="body2" href="/privacy" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
            {t('footerPrivacyPolicy')}
          </Link>
          <Typography sx={{ display: { xs: 'none', sm: 'inline' }, mx: 0.5, opacity: 0.5 }}>
            &nbsp;•&nbsp;
          </Typography>
          <Link variant="body2" href="/terms" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
            {t('footerTermsOfService')}
          </Link>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ justifyContent: 'center', color: 'text.secondary' }}
        >
          <IconButton color="inherit" size="small" href="https://github.com/mui" aria-label="GitHub">
            <GitHubIcon fontSize="small" />
          </IconButton>
          <IconButton color="inherit" size="small" href="https://x.com/MaterialUI" aria-label="X">
            <TwitterIcon fontSize="small" />
          </IconButton>
          <IconButton color="inherit" size="small" href="https://www.linkedin.com/company/mui/" aria-label="LinkedIn">
            <LinkedInIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Box sx={{ display: { sm: 'inline' }, mx: 0.5, opacity: 0.5 }}>
          <Copyright lang={lang} />
        </Box>
      </Box>
    </Container>
  );
}
