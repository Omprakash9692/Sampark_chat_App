import React from 'react';
import { motion } from 'framer-motion';

export const Tabs = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'pill', // 'pill' or 'underline'
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
                {tab.icon && <tab.icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />}
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
