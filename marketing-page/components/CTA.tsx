// // Centered CTA component for the marketing page
// import React from 'react'
// import Button from '@mui/material/Button'

// export default function CTA() {
//     return (
//         <Button variant="contained" size="large" color="secondary" href="/" sx={{ mt: 4, position: 'centered', zIndex: 1 }}>
//             Get started
//         </Button>
//     );
// }

import React from 'react';
import Button from '@mui/material/Button';
import { TRANSLATIONS } from '../../constants';

interface CTAProps {
  lang: string;
}

export default function CTA({ lang }: CTAProps) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
  return (
    <Button
      variant="contained"
      size="large"
      color="secondary"
      href="/"
      sx={{
        mt: { xs: 2, sm: 4 },
        px: { xs: 3, sm: 6 },
        py: { xs: 1, sm: 1.5 },
        fontSize: { xs: '0.9rem', sm: '1rem' },
        position: 'centered',
        zIndex: 1,
      }}
    >
      {t('getStarted')}
    </Button>
  );
}