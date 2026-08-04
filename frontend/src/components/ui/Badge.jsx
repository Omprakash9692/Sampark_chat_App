import React from 'react';

export const Badge = ({
  children,
  variant = 'primary',
  className = '',
}) => {
  const variants = {
    primary: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    secondary: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-850 dark:text-slate-200',
  };

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide select-none
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
export default Badge;
