import React, { createContext, useContext, useState, useEffect } from 'react';

export type PrimaryColor = '#3b82f6' | '#8b5cf6' | '#ec4899' | '#10b981' | '#f59e0b' | '#1e293b';

interface ThemeContextType {
  primaryColor: PrimaryColor;
  setPrimaryColor: (color: PrimaryColor) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isCompactMode: boolean;
  toggleCompactMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColor>(() => {
    return (localStorage.getItem('theme_primary_color') as PrimaryColor) || '#3b82f6';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [isCompactMode, setIsCompactMode] = useState<boolean>(() => {
    return localStorage.getItem('theme_compact_mode') === 'true';
  });

  useEffect(() => {
    // Apply primary color
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    // Derive hover color (simplified for this demo, usually you'd use a library or predefined map)
    const hoverColor = primaryColor === '#1e293b' ? '#0f172a' : primaryColor + 'cc'; 
    document.documentElement.style.setProperty('--color-primary-hover', hoverColor);
    localStorage.setItem('theme_primary_color', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (isCompactMode) {
      document.body.classList.add('table-compact');
    } else {
      document.body.classList.remove('table-compact');
    }
    localStorage.setItem('theme_compact_mode', String(isCompactMode));
  }, [isCompactMode]);

  const setPrimaryColor = (color: PrimaryColor) => setPrimaryColorState(color);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleCompactMode = () => setIsCompactMode(!isCompactMode);

  return (
    <ThemeContext.Provider value={{ 
      primaryColor, 
      setPrimaryColor, 
      isDarkMode, 
      toggleDarkMode, 
      isCompactMode, 
      toggleCompactMode 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
