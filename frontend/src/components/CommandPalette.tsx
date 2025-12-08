import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, User, Calendar, MessageSquare, Settings, LogOut, Moon, Sun, Monitor, Activity, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
  shortcut?: string;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();

  // Define commands based on user role
  const commands: CommandItem[] = [
    // Global Navigation
    { id: 'home', label: 'Go to Dashboard', icon: Home, category: 'Navigation', action: () => navigate(user?.role === 'doctor' ? '/doctor' : '/patient') },
    { id: 'profile', label: 'View Profile', icon: User, category: 'Navigation', shortcut: 'P', action: () => navigate('/profile') },
    
    // Actions
    { id: 'theme', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, icon: theme === 'dark' ? Sun : Moon, category: 'Actions', shortcut: 'T', action: toggleTheme },
    { id: 'logout', label: 'Sign Out', icon: LogOut, category: 'Actions', action: logout },
  ];

  // Specific commands based on role
  if (user?.role === 'patient') {
    commands.splice(2, 0, 
      { id: 'appointments', label: 'My Appointments', icon: Calendar, category: 'Navigation', action: () => navigate('/patient', { state: { tab: 'appointments' } }) },
      { id: 'messages', label: 'Messages', icon: MessageSquare, category: 'Communication', action: () => navigate('/patient', { state: { tab: 'chat' } }) },
      { id: 'xray', label: 'New X-Ray Analysis', icon: Activity, category: 'Tools', action: () => navigate('/patient', { state: { tab: 'xray' } }) },
      { id: 'symptoms', label: 'Check Symptoms', icon: FileText, category: 'Tools', action: () => navigate('/patient', { state: { tab: 'symptoms' } }) }
    );
  } else if (user?.role === 'doctor') {
    commands.splice(2, 0,
      { id: 'appointments', label: 'Manage Appointments', icon: Calendar, category: 'Work', action: () => navigate('/doctor', { state: { tab: 'appointments' } }) },
      { id: 'patients', label: 'My Patients', icon: User, category: 'Work', action: () => navigate('/doctor', { state: { tab: 'patients' } }) },
      { id: 'messages', label: 'Patient Messages', icon: MessageSquare, category: 'Communication', action: () => navigate('/doctor', { state: { tab: 'chat' } }) }
    );
  }

  // Filter commands
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      // Close on Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Selection Logic
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    setSelectedIndex(0);
  }, [isOpen, search]);

  const handleKeyDownSelect = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center px-4 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDownSelect}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-500"
            autoComplete="off"
          />
          <div className="hidden sm:flex items-center gap-1">
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-400 bg-white/5 rounded-lg border border-white/10">Esc</kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filteredCommands.length > 0 ? (
            <div className="px-2">
               {/* Group by Category (Optional optimization, flat list for now) */}
               {filteredCommands.map((cmd, index) => (
                 <button
                   key={cmd.id}
                   onClick={() => {
                     cmd.action();
                     setIsOpen(false);
                   }}
                   onMouseEnter={() => setSelectedIndex(index)}
                   className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 ${
                     index === selectedIndex ? 'bg-emerald-500/20 text-white' : 'text-slate-400 hover:bg-white/5'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${index === selectedIndex ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                        <cmd.icon className="w-5 h-5" />
                     </div>
                     <span className={`font-medium ${index === selectedIndex ? 'text-white' : 'text-slate-300'}`}>
                        {cmd.label}
                     </span>
                   </div>
                   {cmd.shortcut && (
                     <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500 font-medium">Hit</span>
                        <kbd className="px-1.5 py-0.5 text-xs font-bold text-slate-400 bg-white/5 rounded border border-white/10 min-w-[20px] text-center">
                          {cmd.shortcut}
                        </kbd>
                     </div>
                   )}
                 </button>
               ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <p>No results found for "{search}"</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-t border-white/10 text-xs text-slate-500">
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1">
               <ArrowKeyIcon direction="up" /> <ArrowKeyIcon direction="down" /> to navigate
             </span>
             <span className="flex items-center gap-1">
               <ReturnKeyIcon /> to select
             </span>
          </div>
          <div className="font-medium text-emerald-500/50">Global Command</div>
        </div>
      </div>
    </div>
  );
};

// Simple icons for footer
const ArrowKeyIcon = ({ direction }: { direction: 'up' | 'down' }) => (
  <svg className={`w-4 h-4 ${direction === 'down' ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

const ReturnKeyIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 10l-5 5 5 5" />
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
  </svg>
);
