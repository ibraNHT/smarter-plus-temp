
import React from 'react';
import { useTranslation } from '../../services/i18nContext';
import { User, ArrowRight } from 'lucide-react';

export const Blog: React.FC = () => {
  const { t } = useTranslation();

  const posts = [
    {
      id: 1,
      title: "The Future of Sustainable Farming in Cameroon",
      excerpt: "Exploring how digital platforms are enabling farmers to reduce waste and increase profits through direct market access.",
      author: "Sarah M.",
      date: "Oct 15, 2023",
      image: "https://images.unsplash.com/photo-1595841055318-943e158a3c35?auto=format&fit=crop&w=800&q=80",
      category: "Sustainability"
    },
    {
      id: 2,
      title: "Maximizing Yields: Tips for Tomato Growers",
      excerpt: "Expert advice on soil preparation, pest control, and harvesting techniques to get the best out of your tomato crop this season.",
      author: "Dr. Jean-Paul K.",
      date: "Nov 02, 2023",
      image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80",
      category: "Agriculture"
    },
    {
      id: 3,
      title: "Understanding the Escrow Payment System",
      excerpt: "A detailed guide on how AgriMarket Connect protects both buyers and sellers using our secure escrow technology.",
      author: "AgriMarket Team",
      date: "Dec 10, 2023",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80",
      category: "Platform Guide"
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            {t('blog.title')}
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            {t('blog.subtitle')}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
              <div className="flex-shrink-0">
                <img className="h-48 w-full object-cover" src={post.image} alt={post.title} />
              </div>
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-600">
                    {post.category}
                  </p>
                  <div className="block mt-2">
                    <p className="text-xl font-semibold text-gray-900">{post.title}</p>
                    <p className="mt-3 text-base text-gray-500">{post.excerpt}</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center">
                  <div className="flex-shrink-0">
                    <span className="sr-only">{post.author}</span>
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <User className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{post.author}</p>
                    <div className="flex space-x-1 text-sm text-gray-500">
                      <time dateTime={post.date}>{post.date}</time>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                    Read Article <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
