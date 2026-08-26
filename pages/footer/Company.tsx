
// import React from 'react';
// import { useTranslation } from '../../services/i18nContext';
// import { Briefcase, Users, Award, Globe } from 'lucide-react';
// import { SEO } from '../../components/SEO';
// import { SEO_PAGE_META } from '../../services/seo/seoConfig';

// export const Jobs: React.FC = () => {
//   const { t, language } = useTranslation();

//   return (
//     <div className="bg-white min-h-screen py-8 sm:py-12 md:py-16">
//       <SEO
//         title={SEO_PAGE_META.jobs.title}
//         description={SEO_PAGE_META.jobs.description}
//         url="/jobs"
//         locale={language}
//       />
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-8 sm:mb-12 md:mb-16">
//           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">{t('jobs.title')}</h1>
//           <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">{t('jobs.subtitle')}</p>
//         </div>

//         <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-12 sm:mb-16">
//            <div className="p-5 sm:p-6 border border-gray-200 rounded-xl hover:shadow-lg transition bg-gray-50">
//               <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
//                  <Globe className="h-6 w-6 text-blue-600" />
//               </div>
//               <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Logistics Coordinator</h3>
//               <p className="text-sm sm:text-base text-gray-600 mb-4">Manage our network of focal points and delivery partners across Cameroon.</p>
//               <button className="text-primary-600 font-bold hover:underline">Apply Now</button>
//            </div>
//            <div className="p-5 sm:p-6 border border-gray-200 rounded-xl hover:shadow-lg transition bg-gray-50">
//               <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
//                  <Users className="h-6 w-6 text-purple-600" />
//               </div>
//               <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Community Manager</h3>
//               <p className="text-sm sm:text-base text-gray-600 mb-4">Engage with our producers and clients to build a thriving community.</p>
//               <button className="text-primary-600 font-bold hover:underline">Apply Now</button>
//            </div>
//            <div className="p-5 sm:p-6 border border-gray-200 rounded-xl hover:shadow-lg transition bg-gray-50">
//               <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
//                  <Briefcase className="h-6 w-6 text-green-600" />
//               </div>
//               <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Sales Representative</h3>
//               <p className="text-sm sm:text-base text-gray-600 mb-4">Onboard new farmers and businesses to the AgriMarket platform.</p>
//               <button className="text-primary-600 font-bold hover:underline">Apply Now</button>
//            </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export const Partners: React.FC = () => {
//   const { t, language } = useTranslation();

//   return (
//     <div className="bg-white min-h-screen py-8 sm:py-12 md:py-16">
//       <SEO
//         title={SEO_PAGE_META.partners.title}
//         description={SEO_PAGE_META.partners.description}
//         url="/partners"
//         locale={language}
//       />
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-8 sm:mb-12 md:mb-16">
//           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">{t('partners.title')}</h1>
//           <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">We collaborate with industry leaders to bring you the best services.</p>
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
//            <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-50 rounded-lg">
//               <Award className="h-10 w-10 sm:h-16 sm:w-16 text-orange-500 mb-3 sm:mb-4" />
//               <span className="font-bold text-base sm:text-xl text-gray-800 text-center">Orange Money</span>
//            </div>
//            <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-50 rounded-lg">
//               <Award className="h-10 w-10 sm:h-16 sm:w-16 text-yellow-500 mb-3 sm:mb-4" />
//               <span className="font-bold text-base sm:text-xl text-gray-800 text-center">MTN Mobile Money</span>
//            </div>
//            <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-50 rounded-lg">
//               <Award className="h-10 w-10 sm:h-16 sm:w-16 text-blue-600 mb-3 sm:mb-4" />
//               <span className="font-bold text-base sm:text-xl text-gray-800 text-center">UBA Bank</span>
//            </div>
//            <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-50 rounded-lg">
//               <Award className="h-10 w-10 sm:h-16 sm:w-16 text-green-600 mb-3 sm:mb-4" />
//               <span className="font-bold text-base sm:text-xl text-gray-800 text-center">Min. of Agriculture</span>
//            </div>
//         </div>

//         <div className="mt-12 sm:mt-16 md:mt-20 bg-primary-900 rounded-2xl p-6 sm:p-10 md:p-12 text-center text-white">
//            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Become a Partner</h2>
//            <p className="text-sm sm:text-base text-primary-100 mb-6 sm:mb-8 max-w-2xl mx-auto">Interested in integrating your logistics, financial, or agricultural services with AgriMarket Connect?</p>
//            <button className="bg-white text-primary-900 px-6 sm:px-8 py-3 rounded-full font-bold hover:bg-primary-50 transition text-sm sm:text-base">Contact Partnerships</button>
//         </div>
//       </div>
//     </div>
//   );
// };

import React from 'react';
import { useTranslation } from '../../services/i18nContext';
import { Briefcase, Users, Award, Globe } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { SEO_PAGE_META } from '../../services/seo/seoConfig';

export const Jobs: React.FC = () => {
  const { t, language } = useTranslation();

  const jobs = [
    {
      id: 1,
      title: t('jobs.job.1.title'),
      desc: t('jobs.job.1.desc'),
      icon: Globe,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 2,
      title: t('jobs.job.2.title'),
      desc: t('jobs.job.2.desc'),
      icon: Users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      id: 3,
      title: t('jobs.job.3.title'),
      desc: t('jobs.job.3.desc'),
      icon: Briefcase,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  return (
    <div className="bg-white min-h-screen py-8 sm:py-12 md:py-16">
      <SEO
        title={SEO_PAGE_META.jobs.title}
        description={SEO_PAGE_META.jobs.description}
        url="/jobs"
        locale={language}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">{t('jobs.title')}</h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">{t('jobs.subtitle')}</p>
        </div>

        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-12 sm:mb-16">
          {jobs.map((job) => {
            const Icon = job.icon;
            return (
              <div key={job.id} className="p-5 sm:p-6 border border-gray-200 rounded-xl hover:shadow-lg transition bg-gray-50">
                <div className={`w-12 h-12 ${job.iconBg} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${job.iconColor}`} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">{job.desc}</p>
                <button className="text-primary-600 font-bold hover:underline">{t('jobs.applyNow')}</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const Partners: React.FC = () => {
  const { t, language } = useTranslation();

  const partners = [
    // Use images links instead of icons for partners if available, otherwise use icons as placeholders
    { name: t('partners.orangeMoney'),
      imageLink: '/assets/om.jpg', icon: Award, color: 'text-orange-500' },
    { name: t('partners.mtn'),
      imageLink: '/assets/mtn.png', icon: Award, color: 'text-yellow-500' },
    { name: t('partners.uba'),
      imageLink: '/assets/uba.png', icon: Award, color: 'text-blue-600' },
    { name: t('partners.minAgri'),
      imageLink: '/assets/minader.jpg', icon: Award, color: 'text-green-600' },
  ];

  return (
    <div className="bg-white min-h-screen py-8 sm:py-12 md:py-16">
      <SEO
        title={SEO_PAGE_META.partners.title}
        description={SEO_PAGE_META.partners.description}
        url="/partners"
        locale={language}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">{t('partners.title')}</h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">{t('partners.subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 items-center hover:grayscale-0 transition-all duration-500">
          {partners.map((partner, idx) => {
            const Icon = partner.icon;
            return (
              <div key={idx} className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-50 rounded-lg">
                {partner.imageLink ? (
                  <img src={partner.imageLink} alt={partner.name} className={`h-10 w-10 sm:h-32 sm:w-32 ${partner.color} mb-3 sm:mb-4`} />
                ) : (
                  <Icon className={`h-10 w-10 sm:h-16 sm:w-16 ${partner.color} mb-3 sm:mb-4`} />
                )}
                <span className="font-bold text-base sm:text-xl text-gray-800 text-center">{partner.name}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-12 sm:mt-16 md:mt-20 bg-primary-900 rounded-2xl p-6 sm:p-10 md:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{t('partners.becomeTitle')}</h2>
          <p className="text-sm sm:text-base text-primary-100 mb-6 sm:mb-8 max-w-2xl mx-auto">{t('partners.becomeDesc')}</p>
          <button className="bg-white text-primary-900 px-6 sm:px-8 py-3 rounded-full font-bold hover:bg-primary-50 transition text-sm sm:text-base">
            {t('partners.contactBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};