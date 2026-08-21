// import * as React from 'react';
// import { styled, alpha } from '@mui/material/styles';
// import Box from '@mui/material/Box';
// import AppBar from '@mui/material/AppBar';
// import Toolbar from '@mui/material/Toolbar';
// import Button from '@mui/material/Button';
// import IconButton from '@mui/material/IconButton';
// import Container from '@mui/material/Container';
// import Divider from '@mui/material/Divider';
// import MenuItem from '@mui/material/MenuItem';
// import Drawer from '@mui/material/Drawer';
// import MenuIcon from '@mui/icons-material/Menu';
// import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
// import ColorModeIconDropdown from '../../shared-theme/ColorModeIconDropdown';
// import { Landmark } from 'lucide-react'

// import { getTranslated, TRANSLATIONS } from '../../constants';
// import { getAbsoluteImageUrl, apiFetch } from '../../hooks/useAppData';
// import { useState } from 'react';
// import { InfoIcon } from 'lucide-react';

// const StyledToolbar = styled(Toolbar)(({ theme }) => ({
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'space-between',
//   flexShrink: 0,
//   borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
//   backdropFilter: 'blur(24px)',
//   border: '1px solid',
//   borderColor: (theme.vars || theme).palette.divider,
//   backgroundColor: theme.vars
//     ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
//     : alpha(theme.palette.background.default, 0.4),
//   boxShadow: (theme.vars || theme).shadows[1],
//   padding: '8px 12px',
// }));

// export default function AppAppBar() {
//   const [open, setOpen] = React.useState(false);

//   // Integrate language selector and color mode toggle into the AppBar, and add a responsive menu for smaller screens.

// const [lang, setLang] = useState('en');
// const t = (key: string) => TRANSLATIONS[lang][key] || key;
//   const toggleDrawer = (newOpen: boolean) => () => {
//     setOpen(newOpen);
//   };

//   return (
//     <AppBar
//       position="fixed"
//       enableColorOnDark
//       sx={{
//         boxShadow: 0,
//         bgcolor: 'transparent',
//         backgroundImage: 'none',
//         mt: 'calc(var(--template-frame-height, 0px) + 28px)',
//       }}
//     >
//       <Container maxWidth="lg">
//         <StyledToolbar variant="dense" disableGutters>
//           <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
//             <Landmark className="w-auto h-auto text-blue-500" />
//             <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
//               <Button variant="text" color="info" size="small" href="#hero">
//                 {/* <IconButton aria-label='description' size='small' color='inherit' border='none'>
//                   <InfoIcon />
//                 </IconButton> */}
//                 Description
//               </Button>
//               <Button variant="text" color="info" size="small" href="#our-partners">
//                 Our partners
//               </Button>
//               <Button variant="text" color="info" size="small" href="#features">
//                 Features
//               </Button>
//               <Button variant="text" color="info" size="small" href="#testimonials">
//                 Testimonials
//               </Button>
//               <Button variant="text" color="info" size="small" sx={{ minWidth: 0 }} href="#faq">
//                 FAQ
//               </Button>
//               <Button variant="text" color="info" size="small" sx={{ minWidth: 0 }} href="#blog">
//                 Blog
//               </Button>
//             </Box>
//           </Box>
//           <Box
//             sx={{
//               display: { xs: 'none', md: 'flex' },
//               gap: 2,
//               alignItems: 'center',
//             }}
//           >
//             <Button color="secondary" variant="contained" size="medium" href="/">
//               Get started
//             </Button>
//             <ColorModeIconDropdown />
//             <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
//               <select
//                 value={lang}
//                 onChange={(e) => setLang(e.target.value)}
//                 className="w-full bg-gray-100 dark:bg-gray-700 border-solid-2 border-gray-400 dark:border-gray-700 rounded-md text-sm p-2 text-gray-900 dark:text-white"
//               >
//                 <option value="en">
//                   <Button color="secondary" variant="text" size="small" onClick={() => setLang('en')}>
//                     EN
//                   </Button>
//                 </option>
//                 <option value="fr">
//                   <Button color="secondary" variant="text" size="small" onClick={() => setLang('fr')}>
//                     FR
//                   </Button>
//                 </option>
//               </select>
//             </Box>
//           </Box>
//           <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
//             <ColorModeIconDropdown size="medium" />
//             <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
//               <MenuIcon />
//             </IconButton>
//             <Drawer
//               anchor="top"
//               open={open}
//               onClose={toggleDrawer(false)}
//               slotProps={{
//                 paper: {
//                   sx: {
//                     top: 'var(--template-frame-height, 0px)',
//                   },
//                 },
//               }}
//             >
//               <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     justifyContent: 'flex-end',
//                   }}
//                 >
//                   <IconButton onClick={toggleDrawer(false)}>
//                     <CloseRoundedIcon />
//                   </IconButton>
//                 </Box>

//                 <MenuItem>Features</MenuItem>
//                 <MenuItem>Testimonials</MenuItem>
//                 <MenuItem>FAQ</MenuItem>
//                 <MenuItem>Blog</MenuItem>
//                 <Divider sx={{ my: 3 }} />
//                 <MenuItem>
//                   <Button color="secondary" variant="contained" fullWidth>
//                     Sign up
//                   </Button>
//                 </MenuItem>
//                 <MenuItem>
//                   <Button color="primary" variant="outlined" fullWidth>
//                     Sign in
//                   </Button>
//                 </MenuItem>
//               </Box>
//             </Drawer>
//           </Box>
//         </StyledToolbar>
//       </Container>
//     </AppBar>
//   );
// }

// import * as React from 'react';
// import { styled, alpha } from '@mui/material/styles';
// import Box from '@mui/material/Box';
// import AppBar from '@mui/material/AppBar';
// import Toolbar from '@mui/material/Toolbar';
// import Button from '@mui/material/Button';
// import IconButton from '@mui/material/IconButton';
// import Container from '@mui/material/Container';
// import Divider from '@mui/material/Divider';
// import MenuItem from '@mui/material/MenuItem';
// import Drawer from '@mui/material/Drawer';
// import MenuIcon from '@mui/icons-material/Menu';
// import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
// import ColorModeIconDropdown from '../../shared-theme/ColorModeIconDropdown';
// import { Landmark } from 'lucide-react';
// import { TRANSLATIONS } from '../../constants';

// const StyledToolbar = styled(Toolbar)(({ theme }) => ({
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'space-between',
//   flexShrink: 0,
//   borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
//   backdropFilter: 'blur(24px)',
//   border: '1px solid',
//   borderColor: (theme.vars || theme).palette.divider,
//   backgroundColor: theme.vars
//     ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
//     : alpha(theme.palette.background.default, 0.4),
//   boxShadow: (theme.vars || theme).shadows[1],
//   padding: '8px 12px',
//   // Responsive: reduce padding on small screens
//   [theme.breakpoints.down('sm')]: {
//     padding: '6px 8px',
//   },
// }));

// interface AppAppBarProps {
//   lang: string;
//   setLang: (lang: string) => void;
// }

// export default function AppAppBar({ lang, setLang }: AppAppBarProps) {
//   const [open, setOpen] = React.useState(false);
//   const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

//   const toggleDrawer = (newOpen: boolean) => () => {
//     setOpen(newOpen);
//   };

//   return (
//     <AppBar
//       position="fixed"
//       enableColorOnDark
//       sx={{
//         boxShadow: 0,
//         bgcolor: 'transparent',
//         backgroundImage: 'none',
//         mt: 'calc(var(--template-frame-height, 0px) + 28px)',
//         // Responsive: reduce top margin on small screens
//         [theme => theme.breakpoints.down('sm')]: {
//           mt: 'calc(var(--template-frame-height, 0px) + 16px)',
//         },
//       }}
//     >
//       <Container maxWidth="lg">
//         <StyledToolbar variant="dense" disableGutters>
//           <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
//             <Landmark className="w-auto h-auto text-blue-500" style={{ width: 32, height: 32 }} />
//             <Box sx={{ display: { xs: 'none', md: 'flex' }, ml: 2 }}>
//               <Button variant="text" color="info" size="small" href="#hero">
//                 {t('navDescription')}
//               </Button>
//               <Button variant="text" color="info" size="small" href="#our-partners">
//                 {t('navPartners')}
//               </Button>
//               <Button variant="text" color="info" size="small" href="#features">
//                 {t('navFeatures')}
//               </Button>
//               <Button variant="text" color="info" size="small" href="#testimonials">
//                 {t('navTestimonials')}
//               </Button>
//               <Button variant="text" color="info" size="small" sx={{ minWidth: 0 }} href="#faq">
//                 {t('navFaq')}
//               </Button>
//               <Button variant="text" color="info" size="small" sx={{ minWidth: 0 }} href="#blog">
//                 {t('navBlog')}
//               </Button>
//             </Box>
//           </Box>
//           <Box
//             sx={{
//               display: { xs: 'none', md: 'flex' },
//               gap: 2,
//               alignItems: 'center',
//             }}
//           >
//             <Button color="secondary" variant="contained" size="medium" href="/">
//               {t('getStarted')}
//             </Button>
//             <ColorModeIconDropdown />
//             <Box>
//               <select
//                 value={lang}
//                 onChange={(e) => setLang(e.target.value)}
//                 className="w-full bg-gray-100 dark:bg-gray-700 border-solid-2 border-gray-400 dark:border-gray-700 rounded-md text-sm p-2 text-gray-900 dark:text-white"
//               >
//                 <option value="en">EN</option>
//                 <option value="fr">FR</option>
//               </select>
//             </Box>
//           </Box>
//           <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
//             <ColorModeIconDropdown size="medium" />
//             <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
//               <MenuIcon />
//             </IconButton>
//             <Drawer
//               anchor="top"
//               open={open}
//               onClose={toggleDrawer(false)}
//               slotProps={{
//                 paper: {
//                   sx: {
//                     top: 'var(--template-frame-height, 0px)',
//                     // Responsive: make drawer full height on small screens
//                     height: '100vh',
//                     maxHeight: '100vh',
//                   },
//                 },
//               }}
//             >
//               <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     justifyContent: 'flex-end',
//                   }}
//                 >
//                   <IconButton onClick={toggleDrawer(false)}>
//                     <CloseRoundedIcon />
//                   </IconButton>
//                 </Box>
//                 {/* Mobile navigation links */}
//                 <MenuItem component="a" href="#hero">{t('navDescription')}</MenuItem>
//                 <MenuItem component="a" href="#our-partners">{t('navPartners')}</MenuItem>
//                 <MenuItem component="a" href="#features">{t('navFeatures')}</MenuItem>
//                 <MenuItem component="a" href="#testimonials">{t('navTestimonials')}</MenuItem>
//                 <MenuItem component="a" href="#faq">{t('navFaq')}</MenuItem>
//                 <MenuItem component="a" href="#blog">{t('navBlog')}</MenuItem>
//                 <Divider sx={{ my: 2 }} />
//                 {/* Language selector in drawer */}
//                 <Box sx={{ px: 2, py: 1 }}>
//                   <select
//                     value={lang}
//                     onChange={(e) => setLang(e.target.value)}
//                     className="w-full bg-gray-100 dark:bg-gray-700 border rounded-md text-sm p-2 text-gray-900 dark:text-white"
//                   >
//                     <option value="en">English</option>
//                     <option value="fr">Français</option>
//                   </select>
//                 </Box>
//                 <Divider sx={{ my: 2 }} />
//                 <MenuItem>
//                   <Button color="secondary" variant="contained" fullWidth href="/">
//                     {t('getStarted')}
//                   </Button>
//                 </MenuItem>
//                 <MenuItem>
//                   <Button color="primary" variant="outlined" fullWidth href="/login">
//                     {t('login')}
//                   </Button>
//                 </MenuItem>
//               </Box>
//             </Drawer>
//           </Box>
//         </StyledToolbar>
//       </Container>
//     </AppBar>
//   );
// }

import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList'; // <-- import MenuList
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ColorModeIconDropdown from '../../shared-theme/ColorModeIconDropdown';
import { Landmark } from 'lucide-react';
import { TRANSLATIONS } from '../../constants';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: 'blur(24px)',
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.divider,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  boxShadow: (theme.vars || theme).shadows[1],
  padding: '8px 12px',
  [theme.breakpoints.down('sm')]: {
    padding: '6px 8px',
  },
}));

interface AppAppBarProps {
  lang: string;
  setLang: (lang: string) => void;
}

export default function AppAppBar({ lang, setLang }: AppAppBarProps) {
  const [open, setOpen] = React.useState(false);
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: 'transparent',
        backgroundImage: 'none',
        mt: 'calc(var(--template-frame-height, 0px) + 28px)',
        [theme => theme.breakpoints.down('sm')]: {
          mt: 'calc(var(--template-frame-height, 0px) + 16px)',
        },
      }}
    >
      <Container maxWidth="lg">
        <StyledToolbar variant="dense" disableGutters>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
            <Landmark className="w-auto h-auto text-blue-500" style={{ width: 32, height: 32 }} />
            <Box sx={{ display: { xs: 'none', md: 'flex' }, ml: 2 }}>
              <Button variant="text" color="info" size="small" href="#hero">
                {t('navDescription')}
              </Button>
              <Button variant="text" color="info" size="small" href="#our-partners">
                {t('navPartners')}
              </Button>
              <Button variant="text" color="info" size="small" href="#features">
                {t('navFeatures')}
              </Button>
              <Button variant="text" color="info" size="small" href="#testimonials">
                {t('navTestimonials')}
              </Button>
              <Button variant="text" color="info" size="small" sx={{ minWidth: 0 }} href="#faq">
                {t('navFaq')}
              </Button>
              <Button variant="text" color="info" size="small" sx={{ minWidth: 0 }} href="#blog">
                {t('navBlog')}
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 2,
              alignItems: 'center',
            }}
          >
            <Button color="secondary" variant="contained" size="medium" href="/">
              {t('getStarted')}
            </Button>
            <ColorModeIconDropdown />
            <Box>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border-solid-2 border-gray-400 dark:border-gray-700 rounded-md text-sm p-2 text-gray-900 dark:text-white"
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </select>
            </Box>
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
            <ColorModeIconDropdown size="medium" />
            <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              slotProps={{
                paper: {
                  sx: {
                    top: 'var(--template-frame-height, 0px)',
                    height: '100vh',
                    maxHeight: '100vh',
                  },
                },
              }}
            >
              <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </IconButton>
                </Box>
                {/* Wrap MenuItems in MenuList */}
                <MenuList>
                  <MenuItem component="a" href="#hero">{t('navDescription')}</MenuItem>
                  <MenuItem component="a" href="#our-partners">{t('navPartners')}</MenuItem>
                  <MenuItem component="a" href="#features">{t('navFeatures')}</MenuItem>
                  <MenuItem component="a" href="#testimonials">{t('navTestimonials')}</MenuItem>
                  <MenuItem component="a" href="#faq">{t('navFaq')}</MenuItem>
                  <MenuItem component="a" href="#blog">{t('navBlog')}</MenuItem>
                </MenuList>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ px: 2, py: 1 }}>
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-700 border rounded-md text-sm p-2 text-gray-900 dark:text-white"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </Box>
                <Divider sx={{ my: 2 }} />
                <MenuList>
                  <MenuItem>
                    <Button color="secondary" variant="contained" fullWidth href="/">
                      {t('getStarted')}
                    </Button>
                  </MenuItem>
                  <MenuItem>
                    <Button color="primary" variant="outlined" fullWidth href="/login">
                      {t('login')}
                    </Button>
                  </MenuItem>
                </MenuList>
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}
