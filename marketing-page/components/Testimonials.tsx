// import Card from '@mui/material/Card';
// import CardHeader from '@mui/material/CardHeader';
// import CardContent from '@mui/material/CardContent';
// import Avatar from '@mui/material/Avatar';
// import Typography from '@mui/material/Typography';
// import Box from '@mui/material/Box';
// import Container from '@mui/material/Container';
// import Grid from '@mui/material/Grid';
// import { useColorScheme } from '@mui/material/styles';

// const userTestimonials = [
//   {
//     avatar: <Avatar alt="Remy Sharp" src="/static/images/avatar/1.jpg" />,
//     name: 'Remy Sharp',
//     occupation: 'Senior Engineer',
//     testimonial:
//       "I absolutely love how versatile this product is! Whether I'm tackling work projects or indulging in my favorite hobbies, it seamlessly adapts to my changing needs. Its intuitive design has truly enhanced my daily routine, making tasks more efficient and enjoyable.",
//   },
//   {
//     avatar: <Avatar alt="Travis Howard" src="/static/images/avatar/2.jpg" />,
//     name: 'Travis Howard',
//     occupation: 'Lead Product Designer',
//     testimonial:
//       "One of the standout features of this product is the exceptional customer support. In my experience, the team behind this product has been quick to respond and incredibly helpful. It's reassuring to know that they stand firmly behind their product.",
//   },
//   {
//     avatar: <Avatar alt="Cindy Baker" src="/static/images/avatar/3.jpg" />,
//     name: 'Cindy Baker',
//     occupation: 'CTO',
//     testimonial:
//       'The level of simplicity and user-friendliness in this product has significantly simplified my life. I appreciate the creators for delivering a solution that not only meets but exceeds user expectations.',
//   },
//   {
//     avatar: <Avatar alt="Remy Sharp" src="/static/images/avatar/4.jpg" />,
//     name: 'Julia Stewart',
//     occupation: 'Senior Engineer',
//     testimonial:
//       "I appreciate the attention to detail in the design of this product. The small touches make a big difference, and it's evident that the creators focused on delivering a premium experience.",
//   },
//   {
//     avatar: <Avatar alt="Travis Howard" src="/static/images/avatar/5.jpg" />,
//     name: 'John Smith',
//     occupation: 'Product Designer',
//     testimonial:
//       "I've tried other similar products, but this one stands out for its innovative features. It's clear that the makers put a lot of thought into creating a solution that truly addresses user needs.",
//   },
//   {
//     avatar: <Avatar alt="Cindy Baker" src="/static/images/avatar/6.jpg" />,
//     name: 'Daniel Wolf',
//     occupation: 'CDO',
//     testimonial:
//       "The quality of this product exceeded my expectations. It's durable, well-designed, and built to last. Definitely worth the investment!",
//   },
// ];

// const darkModeLogos = [
//   'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/6560628e8573c43893fe0ace_Sydney-white.svg',
//   'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/655f4d520d0517ae8e8ddf13_Bern-white.svg',
//   'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/655f46794c159024c1af6d44_Montreal-white.svg',
//   'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/61f12e891fa22f89efd7477a_TerraLight.svg',
//   'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/6560a09d1f6337b1dfed14ab_colorado-white.svg',
//   'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/655f5caa77bf7d69fb78792e_Ankara-white.svg',
// ];

// const lightModeLogos = [
//   'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/6560628889c3bdf1129952dc_Sydney-black.svg',
//   'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/655f4d4d8b829a89976a419c_Bern-black.svg',
//   'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/655f467502f091ccb929529d_Montreal-black.svg',
//   'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/61f12e911fa22f2203d7514c_TerraDark.svg',
//   'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/6560a0990f3717787fd49245_colorado-black.svg',
//   'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/655f5ca4e548b0deb1041c33_Ankara-black.svg',
// ];

// const logoStyle = {
//   width: '64px',
//   opacity: 0.3,
// };

// export default function Testimonials() {
//   const { mode, systemMode } = useColorScheme();

//   let logos;
//   if (mode === 'system') {
//     if (systemMode === 'light') {
//       logos = lightModeLogos;
//     } else {
//       logos = darkModeLogos;
//     }
//   } else if (mode === 'light') {
//     logos = lightModeLogos;
//   } else {
//     logos = darkModeLogos;
//   }

//   return (
//     <Container
//       id="testimonials"
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
//           Testimonials
//         </Typography>
//         <Typography variant="body1" sx={{ color: 'text.secondary' }}>
//           See what our customers love about our products. Discover how we excel in
//           efficiency, durability, and satisfaction. Join us for quality, innovation,
//           and reliable support.
//         </Typography>
//       </Box>
//       <Grid container spacing={2}>
//         {userTestimonials.map((testimonial, index) => (
//           <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: 'flex' }}>
//             <Card
//               variant="outlined"
//               sx={{
//                 display: 'flex',
//                 flexDirection: 'column',
//                 justifyContent: 'space-between',
//                 flexGrow: 1,
//               }}
//             >
//               <CardContent>
//                 <Typography
//                   variant="body1"
//                   gutterBottom
//                   sx={{ color: 'text.secondary' }}
//                 >
//                   {testimonial.testimonial}
//                 </Typography>
//               </CardContent>
//               <Box
//                 sx={{
//                   display: 'flex',
//                   flexDirection: 'row',
//                   justifyContent: 'space-between',
//                 }}
//               >
//                 <CardHeader
//                   avatar={testimonial.avatar}
//                   title={testimonial.name}
//                   subheader={testimonial.occupation}
//                 />
//                 <img
//                   src={logos[index]}
//                   alt={`Logo ${index + 1}`}
//                   style={logoStyle}
//                 />
//               </Box>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>
//     </Container>
//   );
// }


import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import { useColorScheme } from '@mui/material/styles';
import { TRANSLATIONS } from '../../constants';

interface TestimonialsProps {
  lang: string;
}

export default function Testimonials({ lang }: TestimonialsProps) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
  const { mode, systemMode } = useColorScheme();

  const userTestimonials = [
    { avatar: <Avatar alt="Remy Sharp" src="/static/images/avatar/1.jpg" />, name: t('testimonial1Name'), occupation: t('testimonial1Occupation'), testimonial: t('testimonial1Text') },
    { avatar: <Avatar alt="Travis Howard" src="/static/images/avatar/2.jpg" />, name: t('testimonial2Name'), occupation: t('testimonial2Occupation'), testimonial: t('testimonial2Text') },
    { avatar: <Avatar alt="Cindy Baker" src="/static/images/avatar/3.jpg" />, name: t('testimonial3Name'), occupation: t('testimonial3Occupation'), testimonial: t('testimonial3Text') },
    { avatar: <Avatar alt="Remy Sharp" src="/static/images/avatar/4.jpg" />, name: t('testimonial4Name'), occupation: t('testimonial4Occupation'), testimonial: t('testimonial4Text') },
    { avatar: <Avatar alt="Travis Howard" src="/static/images/avatar/5.jpg" />, name: t('testimonial5Name'), occupation: t('testimonial5Occupation'), testimonial: t('testimonial5Text') },
    { avatar: <Avatar alt="Cindy Baker" src="/static/images/avatar/6.jpg" />, name: t('testimonial6Name'), occupation: t('testimonial6Occupation'), testimonial: t('testimonial6Text') },
  ];

const darkModeLogos = [
  'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/6560628e8573c43893fe0ace_Sydney-white.svg',
  'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/655f4d520d0517ae8e8ddf13_Bern-white.svg',
  'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/655f46794c159024c1af6d44_Montreal-white.svg',
  'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/61f12e891fa22f89efd7477a_TerraLight.svg',
  'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/6560a09d1f6337b1dfed14ab_colorado-white.svg',
  'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/655f5caa77bf7d69fb78792e_Ankara-white.svg',
];

const lightModeLogos = [
  'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/6560628889c3bdf1129952dc_Sydney-black.svg',
  'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/655f4d4d8b829a89976a419c_Bern-black.svg',
  'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/655f467502f091ccb929529d_Montreal-black.svg',
  'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/61f12e911fa22f2203d7514c_TerraDark.svg',
  'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/6560a0990f3717787fd49245_colorado-black.svg',
  'https://assets-global.website-files.com/61ed56ae9da9fd7e0ef0a967/655f5ca4e548b0deb1041c33_Ankara-black.svg',
];

  // const logoStyle = {
  //   width: { xs: '40px', sm: '56px', md: '64px' },
  //   opacity: 0.3,
  //   objectFit: 'contain',
  // };
  const logoStyle = {
  width: '64px',
  opacity: 0.3,
};

  let logos;
  if (mode === 'system') {
    logos = systemMode === 'light' ? lightModeLogos : darkModeLogos;
  } else {
    logos = mode === 'light' ? lightModeLogos : darkModeLogos;
  }

  return (
    <Container
      id="testimonials"
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
          {t('testimonialsTitle')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          {t('testimonialsDesc')}
        </Typography>
      </Box>
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {userTestimonials.map((testimonial, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: 'flex' }}>
            <Card
              variant="outlined"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flexGrow: 1,
                p: { xs: 1, sm: 2 },
              }}
            >
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                <Typography
                  variant="body1"
                  gutterBottom
                  sx={{ color: 'text.secondary', fontSize: { xs: '0.85rem', sm: '0.95rem' } }}
                >
                  {testimonial.testimonial}
                </Typography>
              </CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: { xs: 1, sm: 2 },
                  pb: 1,
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar
                      alt={testimonial.name}
                      src={testimonial.avatar.props.src}
                      sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}
                    />
                  }
                  title={testimonial.name}
                  subheader={testimonial.occupation}
                  sx={{ p: 0 }}
                />
                <img
                  src={logos[index % logos.length]}
                  alt={`Logo ${index + 1}`}
                  style={logoStyle}
                />
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
