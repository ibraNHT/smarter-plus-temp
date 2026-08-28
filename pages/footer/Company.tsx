import React from 'react';
import { useTranslation } from '../../services/i18nContext';
import { Briefcase, Users, Award, Globe, Target, CheckCircle, AlertCircle, User, UserCheck, Megaphone, GraduationCap, DollarSign, Eye, Calendar } from 'lucide-react';
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
          <button
            className="bg-white text-primary-900 px-6 sm:px-8 py-3 rounded-full font-bold hover:bg-primary-50 transition text-sm sm:text-base"
            onClick={() => window.open('https://forms.gle/1F4twapAvDZFUpuM8', '_blank')}
            >
            {t('partners.contactBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

// export const Agents: React.FC = () => {
//   const { t, language } = useTranslation();

//   const agents = [
//     // Use images links instead of icons for agents if available, otherwise use icons as placeholders
//     { name: t('agents.solex'),
//       imageLink: '/assets/solex.png', icon: Award, color: 'text-orange-500' },
//     { name: t('agents.mta'),
//       imageLink: '/assets/mta.jpg', icon: Award, color: 'text-yellow-500' },
//     { name: t('agents.generalVoyage'),
//       imageLink: '/assets/general.jpg', icon: Award, color: 'text-blue-600' },
//     { name: t('agents.touristique'),
//       imageLink: '/assets/touristique.jpg', icon: Award, color: 'text-green-600' },
//   ];

//   return (
//     <div className="bg-white min-h-screen py-8 sm:py-12 md:py-16">
//       <SEO
//         title={SEO_PAGE_META.agents.title}
//         description={SEO_PAGE_META.agents.description}
//         url="/agents"
//         locale={language}
//       />
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-8 sm:mb-12 md:mb-16">
//           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">{t('agents.title')}</h1>
//           <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">{t('agents.subtitle')}</p>
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 items-center hover:grayscale-0 transition-all duration-500">
//           {agents.map((agent, idx) => {
//             const Icon = agent.icon;
//             return (
//               <div key={idx} className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-50 rounded-lg">
//                 {agent.imageLink ? (
//                   <img src={agent.imageLink} alt={agent.name} className={`h-10 w-10 sm:h-32 sm:w-32 ${agent.color} mb-3 sm:mb-4`} />
//                 ) : (
//                   <Icon className={`h-10 w-10 sm:h-16 sm:w-16 ${agent.color} mb-3 sm:mb-4`} />
//                 )}
//                 <span className="font-bold text-base sm:text-xl text-gray-800 text-center">{agent.name}</span>
//               </div>
//             );
//           })}
//         </div>

//         <div className="mt-12 sm:mt-16 md:mt-20 bg-primary-900 rounded-2xl p-6 sm:p-10 md:p-12 text-center text-white">
//           <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{t('agents.becomeTitle')}</h2>
//           <p className="text-sm sm:text-base text-primary-100 mb-6 sm:mb-8 max-w-2xl mx-auto">{t('agents.becomeDesc')}</p>
//           <button
//             className="bg-white text-primary-900 px-6 sm:px-8 py-3 rounded-full font-bold hover:bg-primary-50 transition text-sm sm:text-base"
//             onClick={() => window.open('https://forms.gle/1xoDxexrNerVqPuD9', '_blank')}
//             >
//             {t('agents.contactBtn')}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

export const Agents: React.FC = () => {
  const { t, language } = useTranslation();

  // Define agent categories data
  const categories = [
    {
      id: 'field',
      icon: User,
      titleKey: 'agents.program.categories.field.title',
      descKey: 'agents.program.categories.field.desc',
      targetKey: 'agents.program.categories.field.target',
      remunerationKey: 'agents.program.categories.field.remuneration',
      quotaKey: 'agents.program.categories.field.quota',
      bonusKey: 'agents.program.categories.field.bonus',
      prorataKey: 'agents.program.categories.field.prorata',
    },
    {
      id: 'topfield',
      icon: UserCheck,
      titleKey: 'agents.program.categories.topfield.title',
      descKey: 'agents.program.categories.topfield.desc',
      targetKey: 'agents.program.categories.topfield.target',
      remunerationKey: 'agents.program.categories.topfield.remuneration',
      quotaKey: 'agents.program.categories.topfield.quota',
      bonusKey: 'agents.program.categories.topfield.bonus',
      prorataKey: 'agents.program.categories.topfield.prorata',
    },
    {
      id: 'pub',
      icon: Megaphone,
      titleKey: 'agents.program.categories.pub.title',
      descKey: 'agents.program.categories.pub.desc',
      targetKey: 'agents.program.categories.pub.target',
      remunerationKey: 'agents.program.categories.pub.remuneration',
      quotaKey: null,
      bonusKey: null,
      prorataKey: null,
    },
    {
      id: 'formation',
      icon: GraduationCap,
      titleKey: 'agents.program.categories.formation.title',
      descKey: 'agents.program.categories.formation.desc',
      targetKey: 'agents.program.categories.formation.target',
      remunerationKey: 'agents.program.categories.formation.remuneration',
      quotaKey: null,
      bonusKey: null,
      prorataKey: null,
    },
  ];

  return (
    <div className="bg-white min-h-screen py-8 sm:py-12 md:py-16">
      <SEO
        title={SEO_PAGE_META.agents.title}
        description={SEO_PAGE_META.agents.description}
        url="/agents"
        locale={language}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3 sm:mb-4">
            {t('agents.program.title')}
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
            {t('agents.program.subtitle')}
          </p>
        </div>

        {/* Overview */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-gray-50 rounded-xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('agents.program.overview.title')}</h2>
            <p className="text-gray-700 leading-relaxed">{t('agents.program.overview.desc')}</p>
            <div className="mt-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 italic">{t('agents.program.overview.note')}</p>
            </div>
          </div>
        </section>

        {/* Objectives */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('agents.program.objectives.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 pl-4">
            <li>{t('agents.program.objectives.item1')}</li>
            <li>{t('agents.program.objectives.item2')}</li>
          </ul>
        </section>

        {/* Categories */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('agents.program.categories.title')}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Icon className="h-6 w-6 text-primary-700" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{t(cat.titleKey)}</h3>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{t(cat.descKey)}</p>
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-semibold">{t('agents.program.categories.targetLabel')}:</span> {t(cat.targetKey)}
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-medium text-gray-800">{t(cat.remunerationKey)}</p>
                    {cat.quotaKey && (
                      <ul className="mt-2 text-xs text-gray-600 space-y-1 list-disc list-inside">
                        <li>{t(cat.quotaKey)}</li>
                        <li>{t(cat.bonusKey)}</li>
                        <li>{t(cat.prorataKey)}</li>
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Conditions & Notes */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-gray-50 rounded-xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('agents.program.conditions.title')}</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{t('agents.program.conditions.item1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{t('agents.program.conditions.item2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{t('agents.program.conditions.item3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{t('agents.program.conditions.item4')}</span>
              </li>
            </ul>
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-800 mb-2">{t('agents.program.notes.title')}</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                  <span>{t('agents.program.notes.item1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                  <span>{t('agents.program.notes.item2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{t('agents.program.notes.item3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>{t('agents.program.notes.item4')}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <div className="mt-12 sm:mt-16 md:mt-20 bg-primary-900 rounded-2xl p-6 sm:p-10 md:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{t('agents.becomeTitle')}</h2>
          <p className="text-sm sm:text-base text-primary-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            {t('agents.becomeDesc')}
          </p>
          <button
            className="bg-white text-primary-900 px-6 sm:px-8 py-3 rounded-full font-bold hover:bg-primary-50 transition text-sm sm:text-base"
            onClick={() => window.open('https://forms.gle/1xoDxexrNerVqPuD9', '_blank')}
          >
            {t('agents.contactBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};