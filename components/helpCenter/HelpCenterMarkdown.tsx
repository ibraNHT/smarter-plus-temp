import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getTopicIdFromFilename } from '../../services/helpCenter/helpCenterCatalog';

type Props = {
  content: string;
};

function resolveHref(href: string | undefined): { to: string; external: boolean } | null {
  if (!href) return null;

  if (href.includes('TERMS_AND_CONDITIONS.md')) {
    return { to: '/terms', external: false };
  }
  if (href.includes('PRIVACY_POLICY.md')) {
    return { to: '/privacy', external: false };
  }

  if (href.endsWith('.md')) {
    const topicId = getTopicIdFromFilename(href);
    if (topicId) {
      return { to: `/help/${topicId}`, external: false };
    }
  }

  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
    return { to: href, external: true };
  }

  return { to: href, external: false };
}

export const HelpCenterMarkdown: React.FC<Props> = ({ content }) => (
  <div className="prose prose-sm sm:prose-base max-w-none text-gray-600">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: () => null,
        h2: ({ ...props }) => (
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mt-8 mb-3" {...props} />
        ),
        h3: ({ ...props }) => (
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mt-6 mb-2" {...props} />
        ),
        p: ({ ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
        li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
        strong: ({ ...props }) => <strong className="font-semibold text-gray-800" {...props} />,
        em: ({ ...props }) => <em className="italic" {...props} />,
        blockquote: ({ ...props }) => (
          <blockquote className="border-l-4 border-primary-200 pl-4 italic text-gray-600 my-4" {...props} />
        ),
        code: ({
          inline,
          className,
          children,
          ...props
        }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) =>
          inline ? (
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800" {...props}>
              {children}
            </code>
          ) : (
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          ),
        a: ({ href, children }) => {
          const resolved = resolveHref(href);
          if (!resolved) {
            return <span>{children}</span>;
          }
          if (resolved.external) {
            return (
              <a
                href={resolved.to}
                className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          }
          return (
            <Link
              to={resolved.to}
              className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
            >
              {children}
            </Link>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);
