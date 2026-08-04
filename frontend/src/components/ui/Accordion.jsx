import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const AccordionItem = ({
  title,
  children,
  isOpen,
  onToggle,
  id,
}) => {
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

export const Accordion = ({
  items,
  allowMultiple = false,
  className = '',
}) => {
  const [openIndices, setOpenIndices] = useState([]);

  const handleToggle = (index) => {
    if (allowMultiple) {
      setOpenIndices(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndices(prev => (prev.includes(index) ? [] : [index]));
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
export default Accordion;
