
import React, { useState } from 'react';
import { useTranslation } from '../../services/i18nContext';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FAQ: React.FC = () => {
  const { t } = useTranslation();
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
      a: "Clients pay a 5% service fee on each order. Producers are charged a 15% commission on successful sales, which is deducted automatically from their earnings before withdrawal."
    }
  ];

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <HelpCircle className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {t('faq.title')}
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Everything you need to know about buying and selling on AgriMarket Connect.
          </p>
        </div>

        <dl className="space-y-6 divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <div key={index} className="pt-6">
              <dt className="text-lg">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="text-left w-full flex justify-between items-start text-gray-400 focus:outline-none"
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <span className="ml-6 h-7 flex items-center">
                    {openIndex === index ? (
                      <ChevronUp className="h-6 w-6 transform text-primary-600" />
                    ) : (
                      <ChevronDown className="h-6 w-6 transform" />
                    )}
                  </span>
                </button>
              </dt>
              {openIndex === index && (
                <dd className="mt-2 pr-12">
                  <p className="text-base text-gray-600">{faq.a}</p>
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};
