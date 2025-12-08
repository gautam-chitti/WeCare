import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-card-border transition-all duration-300 group shadow-lg hover:shadow-xl"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-6 h-6">
        <Sun 
          className={`absolute inset-0 w-6 h-6 text-amber-400 transition-all duration-500 rotate-0 scale-100 ${
            theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : ''
          }`} 
        />
        <Moon 
          className={`absolute inset-0 w-6 h-6 text-blue-500 transition-all duration-500 rotate-90 scale-0 opacity-0 ${
            theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : ''
          }`} 
        />
      </div>
    </button>
  );
};
