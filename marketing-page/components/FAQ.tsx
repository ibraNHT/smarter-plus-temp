// import * as React from 'react';
// import Accordion from '@mui/material/Accordion';
// import AccordionDetails from '@mui/material/AccordionDetails';
// import AccordionSummary from '@mui/material/AccordionSummary';
// import Box from '@mui/material/Box';
// import Container from '@mui/material/Container';
// import Link from '@mui/material/Link';
// import Typography from '@mui/material/Typography';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// export default function FAQ() {
//   const [expanded, setExpanded] = React.useState<string[]>([]);

//   const handleChange =
//     (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
//       setExpanded(
//         isExpanded
//           ? [...expanded, panel]
//           : expanded.filter((item) => item !== panel),
//       );
//     };

//   return (
//     <Container
//       id="faq"
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
//       <Typography
//         component="h2"
//         variant="h4"
//         sx={{
//           color: 'text.primary',
//           width: { sm: '100%', md: '60%' },
//           textAlign: { sm: 'left', md: 'center' },
//         }}
//       >
//         Frequently asked questions
//       </Typography>
//       <Box sx={{ width: '100%' }}>
//         <Accordion
//           expanded={expanded.includes('panel1')}
//           onChange={handleChange('panel1')}
//         >
//           <AccordionSummary
//             expandIcon={<ExpandMoreIcon />}
//             aria-controls="panel1d-content"
//             id="panel1d-header"
//           >
//             <Typography component="span" variant="subtitle2">
//               How do I sign in? What is the OTP flow?
//             </Typography>
//           </AccordionSummary>
//           <AccordionDetails>
//             <Typography
//               variant="body2"
//               gutterBottom
//               sx={{ maxWidth: { sm: '100%', md: '70%' } }}
//             >
//               Sign in with your email and password, then verify using the
//               one-time code sent to your email. Use the <strong>Resend code</strong>
//               button if the code does not arrive. The app uses email OTP rather
//               than password-only authentication for added security.
//             </Typography>
//           </AccordionDetails>
//         </Accordion>

//         <Accordion
//           expanded={expanded.includes('panel2')}
//           onChange={handleChange('panel2')}
//         >
//           <AccordionSummary
//             expandIcon={<ExpandMoreIcon />}
//             aria-controls="panel2d-content"
//             id="panel2d-header"
//           >
//             <Typography component="span" variant="subtitle2">
//               I didn&apos;t receive an OTP or invite email — what should I do?
//             </Typography>
//           </AccordionSummary>
//           <AccordionDetails>
//             <Typography
//               variant="body2"
//               gutterBottom
//               sx={{ maxWidth: { sm: '100%', md: '70%' } }}
//             >
//               Check your spam/junk folder and confirm the email is correct. Ask
//               the sender to resend the invite or code. If the app shows SMTP or
//               delivery errors, contact support or your organization administrator.
//             </Typography>
//           </AccordionDetails>
//         </Accordion>

//         <Accordion
//           expanded={expanded.includes('panel3')}
//           onChange={handleChange('panel3')}
//         >
//           <AccordionSummary
//             expandIcon={<ExpandMoreIcon />}
//             aria-controls="panel3d-content"
//             id="panel3d-header"
//           >
//             <Typography component="span" variant="subtitle2">
//               How does offline mode and syncing work?
//             </Typography>
//           </AccordionSummary>
//           <AccordionDetails>
//             <Typography
//               variant="body2"
//               gutterBottom
//               sx={{ maxWidth: { sm: '100%', md: '70%' } }}
//             >
//               The PWA can queue certain creates, updates and uploads in the
//               browser (IndexedDB) while offline. When you reconnect the queued
//               actions are synced to the server. Avoid clearing site data until
//               sync completes to prevent data loss.
//             </Typography>
//           </AccordionDetails>
//         </Accordion>

//         <Accordion
//           expanded={expanded.includes('panel4')}
//           onChange={handleChange('panel4')}
//         >
//           <AccordionSummary
//             expandIcon={<ExpandMoreIcon />}
//             aria-controls="panel4d-content"
//             id="panel4d-header"
//           >
//             <Typography component="span" variant="subtitle2">
//               Where can I find the Privacy Policy and Terms? How do I request
//               data deletion?
//             </Typography>
//           </AccordionSummary>
//           <AccordionDetails>
//             <Typography
//               variant="body2"
//               gutterBottom
//               sx={{ maxWidth: { sm: '100%', md: '70%' } }}
//             >
//               Privacy Policy and Terms links are available in the footer and on
//               the Help Center. For data export or deletion requests contact the
//               privacy contact listed on the Privacy Policy page (or email the
//               organization owner/admin to initiate the request).
//             </Typography>
//           </AccordionDetails>
//         </Accordion>
//       </Box>
//     </Container>
//   );
// }


import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TRANSLATIONS } from '../../constants';

interface FAQProps {
  lang: string;
}

export default function FAQ({ lang }: FAQProps) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
  const [expanded, setExpanded] = React.useState<string[]>([]);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(
        isExpanded
          ? [...expanded, panel]
          : expanded.filter((item) => item !== panel),
      );
    };

  const faqItems = [
    { id: 'panel1', question: t('faqQuestion1'), answer: t('faqAnswer1') },
    { id: 'panel2', question: t('faqQuestion2'), answer: t('faqAnswer2') },
    { id: 'panel3', question: t('faqQuestion3'), answer: t('faqAnswer3') },
    { id: 'panel4', question: t('faqQuestion4'), answer: t('faqAnswer4') },
  ];

  return (
    <Container
      id="faq"
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
      <Typography
        component="h2"
        variant="h4"
        sx={{
          color: 'text.primary',
          width: { xs: '100%', sm: '80%', md: '60%' },
          textAlign: { xs: 'center', md: 'center' },
          fontSize: { xs: '1.8rem', sm: '2.125rem' },
        }}
      >
        {t('faqTitle')}
      </Typography>
      <Box sx={{ width: '100%' }}>
        {faqItems.map((item) => (
          <Accordion
            key={item.id}
            expanded={expanded.includes(item.id)}
            onChange={handleChange(item.id)}
            sx={{ '& .MuiAccordionSummary-root': { px: { xs: 1, sm: 2 } } }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${item.id}-content`}
              id={`${item.id}-header`}
            >
              <Typography component="span" variant="subtitle2" sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
                {item.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: { xs: 1, sm: 2 } }}>
              <Typography
                variant="body2"
                gutterBottom
                sx={{
                  maxWidth: { xs: '100%', md: '70%' },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                }}
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
}