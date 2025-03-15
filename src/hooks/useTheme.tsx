import { useState, useEffect, useCallback } from 'react';
import { THEME_STORAGE_KEY } from '@/utils/constants';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Try to get theme from localStorage first
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    }
    // Default to light if no saved preference
    return 'light';
  });
  
  // Optimized theme setter
  const setTheme = useCallback((newTheme: Theme) => {
    // Apply theme to document immediately for better perceived performance
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    
    // Update state and save to localStorage
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);
  
  // Apply theme on initial render
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, []);
  
  return { theme, setTheme };
}
