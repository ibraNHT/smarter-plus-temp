// src/marketing-page/components/LanguageToggle.tsx
import React from 'react';
import Box from '@mui/material/Box';
import { useMarketingLang } from '../MarketingLangContext';
import { Button } from '@mui/material';

export default function LanguageToggle() {
  const { lang, setLang } = useMarketingLang();
    const t = (key: string) => {
      const translations = {
        en: {
          goBack: "Go Back",
        },
        fr: {
            goBack: "Retour",
        }
    }

    return translations[lang][key];
  }

  return (
    <Box
        sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexShrink: 0,
        }}
    >
        <Button
            color="primary"
            variant="contained"
            size="medium"
            // sx={{ mt: { xs: 2, sm: 2 } }}
            href="/home"
        >
            {t('goBack')}
        </Button>
        <button
            onClick={() => setLang('en')}
            style={{
            background: lang === 'en' ? '#1976d2' : 'transparent',
            color: lang === 'en' ? '#fff' : 'inherit',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: lang === 'en' ? 'bold' : 'normal',
            marginLeft: '64px',
            }}
        >
            EN
        </button>
        <button
            onClick={() => setLang('fr')}
            style={{
            background: lang === 'fr' ? '#1976d2' : 'transparent',
            color: lang === 'fr' ? '#fff' : 'inherit',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: lang === 'fr' ? 'bold' : 'normal',
            }}
        >
            FR
        </button>
    </Box>
    );
}