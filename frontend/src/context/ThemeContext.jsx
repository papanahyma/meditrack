// context/ThemeContext.jsx
import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(false);

  // On mount, check localStorage + system preference
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    
    setDark(isDark);
    if (isDark) document.documentElement.classList.add('dark'); // ← Add on load
  }, []);

  const toggleDark = () => {
    setDark(prev => {
      const newDark = !prev;
      
      // This is the line you asked about
      document.documentElement.classList.toggle('dark');
      
      localStorage.setItem('theme', newDark ? 'dark' : 'light');
      return newDark;
    });
  };

  return (
    <ThemeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
};