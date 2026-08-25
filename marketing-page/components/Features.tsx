// import * as React from 'react';
// import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
// import Card from '@mui/material/Card';
// import MuiChip from '@mui/material/Chip';
// import Container from '@mui/material/Container';
// import Typography from '@mui/material/Typography';
// import { styled } from '@mui/material/styles';

// import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
// // import EdgesensorHighRoundedIcon from '@mui/icons-material/EdgesensorHighRounded';
// // Import a offline icon from material ui
// import { CloudOff } from '@mui/icons-material';
// import ViewQuiltRoundedIcon from '@mui/icons-material/ViewQuiltRounded';

// const items = [
//   {
//     icon: <ViewQuiltRoundedIcon />,
//     title: 'Dashboard overview, financials, HR, operations and more features capabilities',
//     description:
//       'Our solution give users easy acces tools to manage their activity, from financials to operations, all in one place.',
//     imageLight: `url("${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/images/templates/templates-images/dash-light.png")`,
//     imageDark: `url("${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/images/templates/templates-images/dash-dark.png")`,
//   },
//   {
//     icon: <CloudOff />,
//     title: 'Offline functionality integration',
//     description:
//       'Our product could provide offline functionality, allowing users to continue working even when they are not connected to the internet.',
//     imageLight: `url(/assets/images/offline-feat2.png)`,
//     imageDark: `url(/assets/images/offline-feat2.png)`,
//   },
//   {
//     icon: <DevicesRoundedIcon />,
//     title: 'Available for all devices',
//     description:
//       'This item could let users know the product is available on all platforms, such as web, mobile, and desktop.',
//     imageLight: `url("${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/images/templates/templates-images/devices-light.png")`,
//     imageDark: `url("${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/images/templates/templates-images/devices-dark.png")`,
//   },
// ];

// interface ChipProps {
//   selected?: boolean;
// }

// const Chip = styled(MuiChip)<ChipProps>(({ theme }) => ({
//   variants: [
//     {
//       props: ({ selected }) => !!selected,
//       style: {
//         background:
//           'linear-gradient(to bottom right, hsl(210, 98%, 48%), hsl(210, 98%, 35%))',
//         color: 'hsl(0, 0%, 100%)',
//         borderColor: (theme.vars || theme).palette.primary.light,
//         '& .MuiChip-label': {
//           color: 'hsl(0, 0%, 100%)',
//         },
//         ...theme.applyStyles('dark', {
//           borderColor: (theme.vars || theme).palette.primary.dark,
//         }),
//       },
//     },
//   ],
// }));

// interface MobileLayoutProps {
//   selectedItemIndex: number;
//   handleItemClick: (index: number) => void;
//   selectedFeature: (typeof items)[0];
// }

// export function MobileLayout({
//   selectedItemIndex,
//   handleItemClick,
//   selectedFeature,
// }: MobileLayoutProps) {
//   if (!items[selectedItemIndex]) {
//     return null;
//   }

//   return (
//     <Box
//       sx={{
//         display: { xs: 'flex', sm: 'none' },
//         flexDirection: 'column',
//         gap: 2,
//       }}
//       id="features"
//     >
//       <Box sx={{ display: 'flex', gap: 2, overflow: 'auto' }}>
//         {items.map(({ title }, index) => (
//           <Chip
//             size="medium"
//             key={index}
//             label={title}
//             onClick={() => handleItemClick(index)}
//             selected={selectedItemIndex === index}
//           />
//         ))}
//       </Box>
//       <Card variant="outlined">
//         <Box
//           sx={(theme) => ({
//             mb: 2,
//             backgroundSize: 'cover',
//             backgroundPosition: 'bottom',
//             backgroundRepeat: 'no-repeat',
//             backgroundImage: 'var(--items-imageLight)',
//             ...theme.applyStyles('dark', {
//               backgroundImage: 'var(--items-imageDark)',
//             }),
//           })}
//           style={
//             items[selectedItemIndex]
//               ? ({
//                   '--items-imageLight': items[selectedItemIndex].imageLight,
//                   '--items-imageDark': items[selectedItemIndex].imageDark,
//                 } as any)
//               : {}
//           }
//         />
//         <Box sx={{ px: 2, pb: 2, ":hover": { cursor: 'pointer', backgroundColor: 'secondary' } }}>
//           <Typography
//             gutterBottom
//             sx={{ color: 'text.primary', fontWeight: 'medium' }}
//           >
//             {selectedFeature.title}
//           </Typography>
//           <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
//             {selectedFeature.description}
//           </Typography>
//         </Box>
//       </Card>
//     </Box>
//   );
// }

// export default function Features() {
//   const [selectedItemIndex, setSelectedItemIndex] = React.useState(0);

//   const handleItemClick = (index: number) => {
//     setSelectedItemIndex(index);
//   };

//   const selectedFeature = items[selectedItemIndex];

//   return (
//     <Container id="features" sx={{ py: { xs: 8, sm: 16 } }}>
//       <Box sx={{ width: { sm: '100%', md: '60%' } }}>
//         <Typography
//           component="h2"
//           variant="h4"
//           gutterBottom
//           sx={{ color: 'text.primary' }}
//         >
//           Product features
//         </Typography>
//         <Typography
//           variant="body1"
//           sx={{ color: 'text.secondary', mb: { xs: 2, sm: 4 } }}
//         >
//           Provide a brief overview of the key features of the product. For example,
//           you could list the number of features, their types or benefits, and
//           add-ons.
//         </Typography>
//       </Box>
//       <Box
//         sx={{
//           display: 'flex',
//           flexDirection: { xs: 'column', md: 'row-reverse' },
//           gap: 2,
//         }}
//       >
//         <div>
//           <Box
//             sx={{
//               display: { xs: 'none', sm: 'flex' },
//               flexDirection: 'column',
//               gap: 2,
//               height: '100%',
//             }}
//           >
//             {items.map(({ icon, title, description }, index) => (
//               <Box
//                 key={index}
//                 component={Button}
//                 onClick={() => handleItemClick(index)}
//                 sx={[
//                   (theme) => ({
//                     p: 2,
//                     height: '100%',
//                     width: '100%',
//                     '&:hover': {
//                       backgroundColor: (theme.vars || theme).palette.action.hover,
//                     },
//                   }),
//                   selectedItemIndex === index && {
//                     backgroundColor: 'action.selected',
//                   },
//                 ]}
//               >
//                 <Box
//                   sx={[
//                     {
//                       width: '100%',
//                       display: 'flex',
//                       flexDirection: 'column',
//                       alignItems: 'left',
//                       gap: 1,
//                       textAlign: 'left',
//                       textTransform: 'none',
//                       color: 'text.secondary',
//                     },
//                     selectedItemIndex === index && {
//                       color: 'text.primary',
//                     },
//                   ]}
//                 >
//                   {icon}

//                   <Typography variant="h6">{title}</Typography>
//                   <Typography variant="body2">{description}</Typography>
//                 </Box>
//               </Box>
//             ))}
//           </Box>
//           <MobileLayout
//             selectedItemIndex={selectedItemIndex}
//             handleItemClick={handleItemClick}
//             selectedFeature={selectedFeature}
//           />
//         </div>
//         <Box
//           sx={{
//             display: { xs: 'none', sm: 'flex' },
//             width: { xs: '100%', md: '70%' },
//             height: 'var(--items-image-height)',
//           }}
//         >
//           <Card
//             variant="outlined"
//             sx={{
//               height: '100%',
//               width: '100%',
//               display: { xs: 'none', sm: 'flex' },
//               pointerEvents: 'none',
//             }}
//           >
//             <Box
//               sx={(theme) => ({
//                 m: 'auto',
//                 width: 420,
//                 height: 500,
//                 backgroundSize: 'contain',
//                 backgroundImage: 'var(--items-imageLight)',
//                 backgroundRepeat: 'no-repeat',
//                 backgroundPosition: 'center',
//                 ...theme.applyStyles('dark', {
//                   backgroundImage: 'var(--items-imageDark)',
//                 }),
//               })}
//               style={
//                 items[selectedItemIndex]
//                   ? ({
//                       '--items-imageLight': items[selectedItemIndex].imageLight,
//                       '--items-imageDark': items[selectedItemIndex].imageDark,
//                     } as any)
//                   : {}
//               }
//             />
//           </Card>
//         </Box>
//       </Box>
//     </Container>
//   );
// }


import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import MuiChip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import { CloudOff } from '@mui/icons-material';
import ViewQuiltRoundedIcon from '@mui/icons-material/ViewQuiltRounded';
import { TRANSLATIONS } from '../../constants';

interface FeaturesProps {
  lang: string;
}

const Chip = styled(MuiChip)<{ selected?: boolean }>(({ theme }) => ({
  variants: [
    {
      props: ({ selected }) => !!selected,
      style: {
        background:
          'linear-gradient(to bottom right, hsl(210, 98%, 48%), hsl(210, 98%, 35%))',
        color: 'hsl(0, 0%, 100%)',
        borderColor: (theme.vars || theme).palette.primary.light,
        '& .MuiChip-label': {
          color: 'hsl(0, 0%, 100%)',
        },
        ...theme.applyStyles('dark', {
          borderColor: (theme.vars || theme).palette.primary.dark,
        }),
      },
    },
  ],
}));

interface MobileLayoutProps {
  selectedItemIndex: number;
  handleItemClick: (index: number) => void;
  selectedFeature: any;
  items: any[];
}

function MobileLayout({
  selectedItemIndex,
  handleItemClick,
  selectedFeature,
  items,
}: MobileLayoutProps) {
  if (!items[selectedItemIndex]) return null;
  return (
    <Box
      sx={{
        display: { xs: 'flex', sm: 'none' },
        flexDirection: 'column',
        gap: 2,
        width: '100%',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, overflow: 'auto', pb: 1 }}>
        {items.map(({ title }, index) => (
          <Chip
            size="medium"
            key={index}
            label={title}
            onClick={() => handleItemClick(index)}
            selected={selectedItemIndex === index}
            sx={{ flexShrink: 0, maxWidth: '200px' }}
          />
        ))}
      </Box>
      <Card variant="outlined" sx={{ width: '100%' }}>
        <Box
          sx={(theme) => ({
            mb: 2,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'var(--items-imageLight)',
            height: { xs: 180, sm: 250 }, // responsive height
            ...theme.applyStyles('dark', {
              backgroundImage: 'var(--items-imageDark)',
            }),
          })}
          style={
            items[selectedItemIndex]
              ? ({
                  '--items-imageLight': items[selectedItemIndex].imageLight,
                  '--items-imageDark': items[selectedItemIndex].imageDark,
                } as any)
              : {}
          }
        />
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography gutterBottom sx={{ color: 'text.primary', fontWeight: 'medium' }}>
            {selectedFeature.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            {selectedFeature.description}
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}

export default function Features({ lang }: FeaturesProps) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

  const items = [
    {
      icon: <ViewQuiltRoundedIcon />,
      title: t('featureDashboardTitle'),
      description: t('featureDashboardDesc'),
      imageLight: `url("${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/images/templates/templates-images/dash-light.png")`,
      imageDark: `url("${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/images/templates/templates-images/dash-dark.png")`,
    },
    {
      icon: <CloudOff />,
      title: t('featureOfflineTitle'),
      description: t('featureOfflineDesc'),
      imageLight: `url(/assets/images/offline-feat2.png)`,
      imageDark: `url(/assets/images/offline-feat2.png)`,
    },
    {
      icon: <DevicesRoundedIcon />,
      title: t('featureDevicesTitle'),
      description: t('featureDevicesDesc'),
      imageLight: `url("${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/images/templates/templates-images/devices-light.png")`,
      imageDark: `url("${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/images/templates/templates-images/devices-dark.png")`,
    },
  ];

  const [selectedItemIndex, setSelectedItemIndex] = React.useState(0);
  const handleItemClick = (index: number) => setSelectedItemIndex(index);
  const selectedFeature = items[selectedItemIndex];

  return (
    <Container id="features" sx={{ py: { xs: 6, sm: 10, md: 16 } }}>
      <Box sx={{ width: { xs: '100%', sm: '80%', md: '60%' }, mb: { xs: 3, sm: 4 } }}>
        <Typography
          component="h2"
          variant="h4"
          gutterBottom
          sx={{ color: 'text.primary', fontSize: { xs: '1.8rem', sm: '2.125rem' } }}
        >
          {t('featuresTitle')}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1rem' } }}
        >
          {t('featuresDesc')}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row-reverse' },
          gap: { xs: 2, md: 4 },
        }}
      >
        <div style={{ flex: 1 }}>
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              flexDirection: 'column',
              gap: 2,
              height: '100%',
            }}
          >
            {items.map(({ icon, title, description }, index) => (
              <Box
                key={index}
                component={Button}
                onClick={() => handleItemClick(index)}
                sx={[
                  (theme) => ({
                    p: 2,
                    height: '100%',
                    width: '100%',
                    justifyContent: 'flex-start',
                    '&:hover': {
                      backgroundColor: (theme.vars || theme).palette.action.hover,
                    },
                  }),
                  selectedItemIndex === index && {
                    backgroundColor: 'action.selected',
                  },
                ]}
              >
                <Box
                  sx={[
                    {
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 1,
                      textAlign: 'left',
                      textTransform: 'none',
                      color: 'text.secondary',
                    },
                    selectedItemIndex === index && {
                      color: 'text.primary',
                    },
                  ]}
                >
                  {icon}
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {title}
                  </Typography>
                  <Typography variant="body2">{description}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
          <MobileLayout
            selectedItemIndex={selectedItemIndex}
            handleItemClick={handleItemClick}
            selectedFeature={selectedFeature}
            items={items}
          />
        </div>
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            width: { xs: '100%', md: '70%' },
            height: { sm: 400, md: 500 },
            justifyContent: 'center',
          }}
        >
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Box
              sx={(theme) => ({
                width: { sm: '90%', md: 420 },
                height: { sm: '80%', md: 500 },
                backgroundSize: 'contain',
                backgroundImage: 'var(--items-imageLight)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                ...theme.applyStyles('dark', {
                  backgroundImage: 'var(--items-imageDark)',
                }),
              })}
              style={
                items[selectedItemIndex]
                  ? ({
                      '--items-imageLight': items[selectedItemIndex].imageLight,
                      '--items-imageDark': items[selectedItemIndex].imageDark,
                    } as any)
                  : {}
              }
            />
          </Card>
        </Box>
      </Box>
    </Container>
  );
}