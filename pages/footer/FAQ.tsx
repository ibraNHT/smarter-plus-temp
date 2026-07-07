
import React, { useState } from 'react';
import { useTranslation } from '../../services/i18nContext';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { SEO_PAGE_META } from '../../services/seo/seoConfig';
import { buildFaqPageSchema } from '../../services/seo/schemaBuilders';

export const FAQ: React.FC = () => {
  const { t, language } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does the Escrow payment work?",
      a: "When you make a payment, the funds are held securely by AgriMarket Connect and are not immediately sent to the producer. The money is released to the producer only after you confirm the delivery of your order or after 4 days if no dispute is raised."
    },
    {
      q: "Can I return products if they are damaged?",
      a: "Yes. If your order arrives damaged or does not match the description, you can click 'Report a Problem' on your order page. This opens a dispute, freezes the funds, and allows you to upload evidence for our admin team to review."
    },
    {
      q: "What are the delivery fees?",
      a: "Delivery fees vary depending on the producer's location and your chosen delivery method (Home Delivery vs. Focal Point Pickup). The total cost is calculated before you confirm your order."
    },
    {
      q: "How do I become a verified producer?",
      a: "To become a verified producer, sign up for a producer account and upload the required documents (Business License or ID, and any relevant certificates) in your profile. Our team will review your documents and verify your status within 48 hours."
    },
    {
      q: "Are there fees for using the platform?",
      a: "Clients pay a 16.5% service fee on each order. Producers are charged a 5% commission on successful sales, which is deducted automatically from their earnings before withdrawal."
    }
  ];

  return (
    <div className="bg-white min-h-screen py-8 sm:py-12">
      <SEO
        title={SEO_PAGE_META.faq.title}
        description={SEO_PAGE_META.faq.description}
        url="/faq"
        locale={language}
        schema={buildFaqPageSchema(faqs.map((faq) => ({ question: faq.q, answer: faq.a })))}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <HelpCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-primary-600 mb-4" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">
            {t('faq.title')}
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-500 px-2">
            Everything you need to know about buying and selling on AgriMarket Connect.
          </p>
        </div>

        <dl className="space-y-4 sm:space-y-6 divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <div key={index} className="pt-4 sm:pt-6">
              <dt className="text-base sm:text-lg">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="text-left w-full flex justify-between items-start text-gray-400 focus:outline-none gap-3"
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <span className="h-7 flex items-center flex-shrink-0">
                    {openIndex === index ? (
                      <ChevronUp className="h-6 w-6 transform text-primary-600" />
                    ) : (
                      <ChevronDown className="h-6 w-6 transform" />
                    )}
                  </span>
                </button>
              </dt>
              {openIndex === index && (
                <dd className="mt-2 pr-2 sm:pr-12">
                  <p className="text-sm sm:text-base text-gray-600">{faq.a}</p>
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};
