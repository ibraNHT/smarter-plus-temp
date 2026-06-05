import React from 'react';

type ClampTextProps = {
  text: string;
  lines?: 1 | 2 | 3;
  className?: string;
  as?: 'p' | 'h3' | 'span';
};

/** Multi-line truncation with CSS ellipsis (…). */
export const ClampText: React.FC<ClampTextProps> = ({
  text,
  lines = 2,
  className = '',
  as: Tag = 'p',
}) => {
  const clampClass = lines === 1 ? 'agm-clamp-1' : lines === 2 ? 'agm-clamp-2' : 'agm-clamp-3';

  return (
    <Tag className={`${clampClass} ${className}`}>
      {text || '\u00A0'}
    </Tag>
  );
};
