import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  icon: Icon = null,
  iconPosition = 'left',
  fullWidth = false,
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';
  
  const variants = {
    primary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] focus:ring-slate-400 border border-slate-900',
    secondary: 'bg-white hover:bg-slate-50 text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.06)] focus:ring-slate-300 border border-slate-200',
    outline: 'bg-transparent border border-slate-300 hover:bg-white text-slate-700 focus:ring-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/10 focus:ring-rose-500 border border-transparent',
    ghost: 'bg-transparent hover:bg-white text-slate-600 focus:ring-slate-300 border border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={`h-4 w-4 ${children ? 'mr-2' : ''}`} />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={`h-4 w-4 ${children ? 'ml-2' : ''}`} />
      )}
    </motion.button>
  );
};
export default Button;
