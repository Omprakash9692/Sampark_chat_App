import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = React.forwardRef(({
  label,
  type = 'text',
  placeholder,
  error,
  icon: Icon = null,
  className = '',
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full text-left ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-500 uppercase tracking-[0.18em] mb-2">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <input
          id={id}
          ref={ref}
          type={currentType}
          placeholder={placeholder}
          className={`
            block w-full rounded-xl transition-all duration-200 border text-sm
            bg-white/90 text-slate-800
            ${Icon ? 'pl-11' : 'pl-4'}
            ${isPassword ? 'pr-11' : 'pr-4'}
            py-2.5
            ${error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              : 'border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300'
            }
            outline-none
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-rose-500 font-medium">
          {error.message || error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
