import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Tooltip = ({
  children,
  content,
  position = 'top', // top, bottom, left, right
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
export default Tooltip;
