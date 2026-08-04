import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export const ToastItem = ({ id, title, description, type, onClose }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    info: <Info className="h-5 w-5 text-indigo-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    danger: <AlertCircle className="h-5 w-5 text-rose-500" />,
  };

  const borders = {
    success: 'border-emerald-500/20 dark:border-emerald-500/10',
    info: 'border-indigo-500/20 dark:border-indigo-500/10',
    warning: 'border-amber-500/20 dark:border-amber-500/10',
    danger: 'border-rose-500/20 dark:border-rose-500/10',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      className={`
        flex items-start gap-3.5 p-4 rounded-xl border shadow-xl w-80 max-w-full
        bg-white/95 dark:bg-slate-900/95 backdrop-blur-md
        text-slate-800 dark:text-slate-200
        ${borders[type]}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type] || icons.info}</div>
      <div className="flex-grow text-left">
        <h4 className="text-sm font-bold text-slate-950 dark:text-white leading-tight">
          {title}
        </h4>
        {description && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-normal">
            {description}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-0.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer = () => {
  const { toasts, clearToast } = useNotifications();

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none max-w-full">
      <div className="pointer-events-auto flex flex-col gap-3">
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

export default ToastContainer;
