import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

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
        flex items-start gap-3.5 p-4 rounded-2xl border shadow-xl w-84 max-w-full
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
