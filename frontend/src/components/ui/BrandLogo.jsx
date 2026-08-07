import React from 'react';

export const BrandLogo = ({ size = 'md', className = '' }) => {
  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  return (
    <div className={`flex items-center gap-1.5 select-none ${className}`}>
      <span className={`${titleSizes[size]} font-black tracking-tight bg-gradient-to-r from-[#00a884] via-[#008069] to-emerald-700 bg-clip-text text-transparent font-sans`}>
        Sampark
      </span>
      <span className={`${dotSizes[size]} rounded-full bg-[#00a884] shadow-[0_0_10px_rgba(0,168,132,0.8)] animate-pulse inline-block`} />
    </div>
  );
};

export default BrandLogo;
