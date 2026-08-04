import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();
const PREMIUM_THEME = 'light';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('wechat_theme');
    return savedTheme === PREMIUM_THEME ? PREMIUM_THEME : PREMIUM_THEME;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('wechat_theme', PREMIUM_THEME);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(PREMIUM_THEME);
  };

  const applyTheme = (nextTheme) => {
    setTheme(nextTheme === PREMIUM_THEME ? PREMIUM_THEME : PREMIUM_THEME);
  };

  return (
    <ThemeContext.Provider value={{ theme: PREMIUM_THEME, toggleTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
