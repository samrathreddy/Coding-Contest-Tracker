import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the theme toggle
  // This prevents hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle toggle click to switch between light and dark
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (!mounted) return null;

  // Simple toggle between light and dark only
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full relative"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Use absolute positioning to create smooth transition between icons */}
      <Sun 
        className={`h-4 w-4 absolute transition-all ${
          theme === 'light' 
            ? 'scale-100 rotate-0 opacity-100' 
            : 'scale-0 rotate-90 opacity-0'
        }`} 
      />
      <Moon 
        className={`h-4 w-4 absolute transition-all ${
          theme === 'dark' 
            ? 'scale-100 rotate-0 opacity-100' 
            : 'scale-0 -rotate-90 opacity-0'
        }`} 
      />
      <span className="sr-only">
        {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      </span>
    </Button>
  );
}
