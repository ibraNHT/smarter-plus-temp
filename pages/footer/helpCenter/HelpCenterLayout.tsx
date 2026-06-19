import React from 'react';

type Props = {
  children: React.ReactNode;
  wide?: boolean;
};

export const HelpCenterLayout: React.FC<Props> = ({ children, wide = false }) => (
  <div className="bg-gray-50 min-h-screen py-8 sm:py-12">
    <div className={`${wide ? 'max-w-7xl' : 'max-w-4xl'} mx-auto px-4 sm:px-6 lg:px-8`}>
      {children}
    </div>
  </div>
);
