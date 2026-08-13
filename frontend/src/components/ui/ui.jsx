import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Eye,
  EyeOff,
  Sparkles,
  X,
  CheckCircle,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCheck,
  ArrowLeft,
  Check,
  Loader2,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

/* ==========================================================================
   1. ACCORDION COMPONENTS
   ========================================================================== */
export const AccordionItem = ({ title, children, isOpen, onToggle, id }) => {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
      <button
        type="button"
        id={id}
        onClick={onToggle}
        className="w-full py-4 flex items-center justify-between text-left font-medium text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none cursor-pointer"
      >
        <span className="text-base font-semibold">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-5 text-sm text-slate-650 dark:text-slate-400 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Accordion = ({ items, allowMultiple = false, className = '' }) => {
  const [openIndices, setOpenIndices] = useState([]);

  const handleToggle = (index) => {
    if (allowMultiple) {
      setOpenIndices((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndices((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={`w-full divide-y divide-slate-200 dark:divide-slate-800 ${className}`}>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          isOpen={openIndices.includes(index)}
          onToggle={() => handleToggle(index)}
          id={item.id}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

/* ==========================================================================
   2. AVATAR COMPONENT
   ========================================================================== */
export const Avatar = ({
  src,
  name = '',
  size = 'md',
  status = null, // 'online', 'offline', 'away'
  className = '',
  color = 'from-indigo-500 to-purple-600',
  onClick,
}) => {
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getInitialsColor = (fullName) => {
    if (color && color !== 'from-indigo-500 to-purple-600') return color;
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-violet-500 to-purple-600',
      'from-pink-500 to-rose-600',
      'from-amber-500 to-orange-600',
      'from-cyan-500 to-blue-600',
      'from-fuchsia-500 to-pink-600',
      'from-lime-500 to-green-600',
    ];
    if (!fullName) return colors[0];
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm font-semibold',
    lg: 'h-14 w-14 text-lg font-semibold',
    xl: 'h-20 w-20 text-2xl font-bold',
    xxl: 'h-24 w-24 text-3xl font-bold',
  };

  const statusSizes = {
    xs: 'h-1.5 w-1.5 border-[1px]',
    sm: 'h-2 w-2 border-[1.5px]',
    md: 'h-2.5 w-2.5 border-[2px]',
    lg: 'h-3.5 w-3.5 border-[2px]',
    xl: 'h-4 w-4 border-[2px]',
    xxl: 'h-5 w-5 border-[3px]',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    offline: 'bg-slate-400 dark:bg-slate-500',
  };

  return (
    <div
      className={`relative inline-flex flex-shrink-0 select-none ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className={`rounded-full object-cover border border-slate-100 dark:border-slate-800/50 ${sizes[size]} ${className}`}
          onError={(e) => {
            e.target.style.display = 'none';
            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}

      <div
        className={`
          ${sizes[size]} rounded-full flex items-center justify-center text-white font-medium bg-gradient-to-tr ${getInitialsColor(name)}
          ${src ? 'hidden' : 'flex'}
          border border-white/10 ${className}
        `}
      >
        {getInitials(name)}
      </div>

      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full border-white dark:border-slate-950
            ${statusColors[status]}
            ${statusSizes[size]}
          `}
        />
      )}
    </div>
  );
};

/* ==========================================================================
   3. BADGE COMPONENT
   ========================================================================== */
export const Badge = ({ children, variant = 'primary', className = '' }) => {
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

/* ==========================================================================
   4. BRAND LOGO COMPONENT
   ========================================================================== */
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
      <span
        className={`${titleSizes[size]} font-black tracking-tight bg-gradient-to-r from-[#00a884] via-[#008069] to-emerald-700 bg-clip-text text-transparent font-sans`}
      >
        Sampark
      </span>
      <span
        className={`${dotSizes[size]} rounded-full bg-[#00a884] shadow-[0_0_10px_rgba(0,168,132,0.8)] animate-pulse inline-block`}
      />
    </div>
  );
};

/* ==========================================================================
   5. BUTTON COMPONENT
   ========================================================================== */
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
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary:
      'bg-slate-900 hover:bg-slate-800 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] focus:ring-slate-400 border border-slate-900',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.06)] focus:ring-slate-300 border border-slate-200',
    outline: 'bg-transparent border border-slate-300 hover:bg-white text-slate-700 focus:ring-slate-300',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/10 focus:ring-rose-500 border border-transparent',
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
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
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

/* ==========================================================================
   6. INPUT COMPONENT
   ========================================================================== */
export const Input = React.forwardRef(
  (
    {
      label,
      type = 'text',
      placeholder,
      error,
      icon: Icon = null,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
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
  }
);
Input.displayName = 'Input';

/* ==========================================================================
   7. MODAL COMPONENT
   ========================================================================== */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`
              relative w-full rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80
              bg-white text-[#111b21] max-h-[90vh] flex flex-col
              ${sizes[size]}
              z-10
            `}
          >
            <div className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-[#e9edef] bg-[#f0f2f5] shrink-0">
              <h3 className="text-sm sm:text-base font-bold text-[#111b21]">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#54656f] hover:text-[#111b21] hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-4 sm:px-6 sm:py-5 max-h-[75vh] overflow-y-auto bg-[#f8fafc] flex-1 no-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ==========================================================================
   8. TABS COMPONENT
   ========================================================================== */
export const Tabs = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'pill',
}) => {
  return (
    <div className={`flex select-none ${className}`}>
      <div
        className={`
          flex items-center gap-1 p-1 
          ${variant === 'pill'
            ? 'bg-slate-100/90 border border-slate-200/80 rounded-2xl shadow-xs'
            : 'border-b border-slate-200 w-full'
          }
        `}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                relative px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer focus:outline-none flex items-center justify-center
                ${isActive
                  ? 'text-slate-950 font-black'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50 font-extrabold'
                }
              `}
            >
              {isActive && variant === 'pill' && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.08)] border border-slate-200/80 z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {isActive && variant === 'underline' && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-2">
                {tab.icon && (
                  <tab.icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                )}
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ==========================================================================
   9. TOAST COMPONENTS
   ========================================================================== */
export const ToastItem = ({ id, title, description, type, onClose }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-[#008069] shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-600 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
    danger: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
  };

  const borders = {
    success: 'bg-white border-emerald-200/90 shadow-2xl shadow-emerald-500/10',
    info: 'bg-white border-sky-200/90 shadow-2xl shadow-sky-500/10',
    warning: 'bg-white border-amber-200/90 shadow-2xl shadow-amber-500/10',
    danger: 'bg-white border-rose-200/90 shadow-2xl shadow-rose-500/10',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      className={`
        flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border shadow-xl w-full sm:w-84 max-w-full
        text-[#111b21] backdrop-blur-md select-none
        ${borders[type] || borders.info}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type] || icons.info}</div>
      <div className="flex-grow text-left min-w-0">
        <h4 className="text-xs font-bold text-[#111b21] leading-tight truncate">
          {title}
        </h4>
        {description && (
          <p className="mt-1 text-[11px] font-medium text-[#667781] leading-normal">
            {description}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-lg text-[#667781] hover:text-[#111b21] hover:bg-slate-100 transition-colors cursor-pointer"
        title="Dismiss alert"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer = () => {
  const { toasts, clearToast } = useNotifications();

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 z-[100] flex flex-col gap-3 pointer-events-none max-w-full">
      <div className="pointer-events-auto flex flex-col gap-3 items-center sm:items-end w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              id={toast.id}
              title={toast.title}
              description={toast.description}
              type={toast.type}
              onClose={() => clearToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ==========================================================================
   11. TOOLTIP COMPONENT
   ========================================================================== */
export const Tooltip = ({
  children,
  content,
  position = 'top',
  className = '',
}) => {
  const [show, setShow] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 dark:border-t-slate-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 dark:border-b-slate-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 dark:border-l-slate-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 dark:border-r-slate-900 border-y-transparent border-l-transparent',
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${positionStyles[position]} pointer-events-none`}
          >
            <div className="bg-slate-800 text-slate-100 dark:bg-slate-950 dark:text-slate-200 text-xs px-2.5 py-1.5 rounded-lg shadow-lg font-medium whitespace-nowrap relative border border-slate-700/30 dark:border-slate-800">
              {content}
              <div className={`absolute border-[5px] ${arrowStyles[position]}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==========================================================================
   12. MESSAGE INFO PANEL COMPONENT
   ========================================================================== */
const PAGE_LIMIT = 10;

const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return (
    d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
};

const UserRow = ({ user, time, detail }) => (
  <div className="flex items-center gap-3 py-3 px-1">
    <Avatar src={user?.avatar} name={user?.name} size="md" color={user?.avatarColor} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Unknown'}</p>
      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{detail || '—'}</p>
    </div>
    {time && (
      <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap shrink-0 ml-2">
        {formatTime(time)}
      </span>
    )}
  </div>
);

const SectionHeader = ({ icon: Icon, label, count, iconBg }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${iconBg}`}>
      <Icon className="h-3.5 w-3.5" />
    </div>
    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{label}</span>
    <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
      {count}
    </span>
  </div>
);

export const MessageInfoPanel = ({ message, onClose }) => {
  const isOpen = !!message;
  const { socket } = useChat();
  const { authFetch } = useAuth();

  const [readBy, setReadBy] = useState([]);
  const [deliveredTo, setDeliveredTo] = useState([]);
  const [totalRead, setTotalRead] = useState(0);
  const [totalDelivered, setTotalDelivered] = useState(0);
  const [readPage, setReadPage] = useState(1);
  const [deliveredPage, setDeliveredPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMoreRead, setLoadingMoreRead] = useState(false);
  const [loadingMoreDelivered, setLoadingMoreDelivered] = useState(false);

  const fetchInfo = useCallback(
    async (msgId) => {
      if (!msgId) return;
      setLoading(true);
      setReadBy([]);
      setDeliveredTo([]);
      setReadPage(1);
      setDeliveredPage(1);

      try {
        const res = await authFetch(
          `http://localhost:5000/api/chats/messages/${msgId}/info?page=1&limit=${PAGE_LIMIT}`
        );
        if (res.ok) {
          const result = await res.json();
          const { readBy: rb, deliveredTo: dt, totalRead: tr, totalDelivered: td } = result.data;
          setReadBy(rb || []);
          setDeliveredTo(dt || []);
          setTotalRead(tr || 0);
          setTotalDelivered(td || 0);
        }
      } catch (err) {
        console.error('Failed to fetch message info:', err);
      }
      setLoading(false);
    },
    [authFetch]
  );

  const refreshSilent = useCallback(
    async (msgId) => {
      if (!msgId) return;
      try {
        const res = await authFetch(
          `http://localhost:5000/api/chats/messages/${msgId}/info?page=1&limit=${PAGE_LIMIT}`
        );
        if (res.ok) {
          const result = await res.json();
          const { readBy: rb, deliveredTo: dt, totalRead: tr, totalDelivered: td } = result.data;
          setReadBy(rb || []);
          setDeliveredTo(dt || []);
          setTotalRead(tr || 0);
          setTotalDelivered(td || 0);
        }
      } catch (err) {
        console.error('Failed to silently refresh message info:', err);
      }
    },
    [authFetch]
  );

  useEffect(() => {
    if (isOpen && message?.id) {
      fetchInfo(message.id);
    }
  }, [isOpen, message?.id, fetchInfo]);

  useEffect(() => {
    if (!socket || !isOpen || !message?.id) return;

    const handleSocketUpdate = () => {
      refreshSilent(message.id);
    };

    socket.on('messages-seen', handleSocketUpdate);
    socket.on('messages-delivered', handleSocketUpdate);
    socket.on('receive-message', handleSocketUpdate);

    return () => {
      socket.off('messages-seen', handleSocketUpdate);
      socket.off('messages-delivered', handleSocketUpdate);
      socket.off('receive-message', handleSocketUpdate);
    };
  }, [socket, isOpen, message?.id, refreshSilent]);

  useEffect(() => {
    if (!isOpen || !message?.id) return;

    const interval = setInterval(() => {
      refreshSilent(message.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, message?.id, refreshSilent]);

  const loadMoreRead = async () => {
    const nextPage = readPage + 1;
    setLoadingMoreRead(true);
    try {
      const res = await authFetch(
        `http://localhost:5000/api/chats/messages/${message.id}/info?page=${nextPage}&limit=${PAGE_LIMIT}`
      );
      if (res.ok) {
        const result = await res.json();
        setReadBy((prev) => [...prev, ...(result.data.readBy || [])]);
        setReadPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more read receipts:', err);
    } finally {
      setLoadingMoreRead(false);
    }
  };

  const loadMoreDelivered = async () => {
    const nextPage = deliveredPage + 1;
    setLoadingMoreDelivered(true);
    try {
      const res = await authFetch(
        `http://localhost:5000/api/chats/messages/${message.id}/info?page=${nextPage}&limit=${PAGE_LIMIT}`
      );
      if (res.ok) {
        const result = await res.json();
        setDeliveredTo((prev) => [...prev, ...(result.data.deliveredTo || [])]);
        setDeliveredPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more delivery receipts:', err);
    } finally {
      setLoadingMoreDelivered(false);
    }
  };

  const remainingRead = totalRead - readBy.length;
  const remainingDelivered = totalDelivered - deliveredTo.length;

  const msgPreview = message?.text
    ? message.text.length > 80
      ? message.text.slice(0, 80) + '…'
      : message.text
    : message?.type === 'image'
    ? '🖼️ Image'
    : message?.type === 'file'
    ? `📄 ${message.attachmentName || 'Document'}`
    : message?.type === 'audio'
    ? '🎵 Voice Note'
    : '—';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
          />

          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">Message Info</h2>
              <button
                onClick={onClose}
                className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 border-b border-slate-100 shrink-0 bg-slate-50/60">
              <div className="inline-block max-w-full px-4 py-2.5 rounded-2xl rounded-tr-xs bg-slate-900 text-white text-xs leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word] shadow-md">
                {msgPreview}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                <span className="text-[10px] text-slate-400 font-semibold">
                  {message?.timestamp
                    ? new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8 no-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs font-semibold">Loading receipts…</span>
                </div>
              ) : (
                <>
                  <div>
                    <SectionHeader
                      icon={Eye}
                      label="Read By"
                      count={totalRead}
                      iconBg="bg-emerald-50 text-emerald-600"
                    />
                    {readBy.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium py-4 text-center">
                        No one has read this message yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {readBy.map((item, i) => (
                          <UserRow
                            key={i}
                            user={item.user}
                            time={item.time}
                            detail={item.user?.email}
                          />
                        ))}
                        {remainingRead > 0 && (
                          <button
                            onClick={loadMoreRead}
                            disabled={loadingMoreRead}
                            className="mt-3 w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-black text-slate-500 hover:text-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {loadingMoreRead ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              `${remainingRead} Remaining`
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div>
                    <SectionHeader
                      icon={Check}
                      label="Delivered To"
                      count={totalDelivered}
                      iconBg="bg-slate-100 text-slate-500"
                    />
                    {deliveredTo.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium py-4 text-center">
                        No delivery receipts yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {deliveredTo.map((item, i) => (
                          <UserRow
                            key={i}
                            user={item.user}
                            time={item.time}
                            detail={item.user?.phone || item.user?.email}
                          />
                        ))}
                        {remainingDelivered > 0 && (
                          <button
                            onClick={loadMoreDelivered}
                            disabled={loadingMoreDelivered}
                            className="mt-3 w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-black text-slate-500 hover:text-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {loadingMoreDelivered ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              `${remainingDelivered} Remaining`
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
