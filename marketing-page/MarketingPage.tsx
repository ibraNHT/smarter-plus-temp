// import CssBaseline from '@mui/material/CssBaseline';
// import Divider from '@mui/material/Divider';
// import AppTheme from '../shared-theme/AppTheme';
// import AppAppBar from './components/AppAppBar';
// import Hero from './components/Hero';
// import LogoCollection from './components/LogoCollection';
// import Highlights from './components/Highlights';
// import Pricing from './components/Pricing';
// import Features from './components/Features';
// import Testimonials from './components/Testimonials';
// import FAQ from './components/FAQ';
// import Footer from './components/Footer';
// import CTA from './components/CTA';

// export default function MarketingPage(props: { disableCustomTheme?: boolean, currency?: string, lang?: string }) {
//   return (
//     <AppTheme {...props}>
//       <CssBaseline enableColorScheme />

//       <AppAppBar />
//       <Hero />
//       <div>
//         <LogoCollection />
//         <Features />
//         <Divider />
//         <Testimonials />
//         <Divider />
//         <Divider />
//         <Pricing />
//         <Divider />
//         <FAQ />
//         <Divider />
//         <Footer />
//       </div>
//     </AppTheme>
//   );
// }

import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import AppTheme from '../shared-theme/AppTheme';
import AppAppBar from './components/AppAppBar';
import Hero from './components/Hero';
import LogoCollection from './components/LogoCollection';
import Highlights from './components/Highlights';
import Pricing from './components/Pricing';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import { useMarketingLang } from './MarketingLangContext';

interface MarketingPageProps {
  disableCustomTheme?: boolean;
  currency?: string;
}

export default function MarketingPage({ disableCustomTheme, currency = 'XAF' }: MarketingPageProps) {
  const { lang, setLang } = useMarketingLang();

  return (
    <AppTheme disableCustomTheme={disableCustomTheme}>
      <CssBaseline enableColorScheme />
      <AppAppBar lang={lang} setLang={setLang} />
      <Hero lang={lang} />
      <div>
        <LogoCollection lang={lang} />
        <Features lang={lang} />
        <Divider />
        <Testimonials lang={lang} />
        <Divider />
        <Divider />
        <Pricing lang={lang} currency={currency} />
        <Divider />
        <FAQ lang={lang} />
        <Divider />
        <Footer lang={lang} />
      </div>
    </AppTheme>
  );
}
