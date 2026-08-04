import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

export const ThemeToggle = ({ className = '' }) => {
  const { toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-xl border border-white/80
        text-slate-500 hover:text-slate-700
        bg-white/80 hover:bg-white
        shadow-[0_12px_30px_rgba(15,23,42,0.08)]
        transition-all cursor-pointer select-none
        ${className}
      `}
      aria-label="Premium White Theme"
      title="Premium white theme is active"
    >
      <motion.div
        initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <Sparkles className="h-5 w-5 text-amber-500" />
      </motion.div>
    </button>
  );
};
export default ThemeToggle;
