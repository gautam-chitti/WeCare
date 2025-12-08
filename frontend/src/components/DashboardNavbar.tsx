import React, { useState } from 'react';
import { Menu, X, LogOut, User } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { PrivacyToggle } from './PrivacyToggle';
import { VoiceNavigator } from './VoiceNavigator';
import { getValidImageUrl, getDefaultAvatar } from '../utils/imageUrl';
import { PrivacyMask } from './PrivacyMask';

import { FamilyProfileSelector } from './FamilyProfileSelector';

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface DashboardNavbarProps {
  user: any;
  activeProfile?: any;
  tabs: TabItem[];
  activeTab: string;
  setActiveTab: (id: any) => void;
  logout: () => void;
  unreadCount?: number;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ 
  user, 
  activeProfile,
  tabs, 
  activeTab, 
  setActiveTab, 
  logout,
  unreadCount = 0
}) => {
  const [showSearchHint, setShowSearchHint] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowSearchHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);
  
  const displayUser = activeProfile || user;

  return (
    <nav className="sticky top-0 z-50 bg-primary/80 backdrop-blur-xl border-b border-card-border transition-all duration-300">
      {/* Search Hint Popup */}
      <div className={`fixed top-24 right-4 z-50 bg-slate-900 border border-white/10 p-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-500 transform ${showSearchHint ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <kbd className="text-emerald-500 font-bold font-mono">⌘K</kbd>
        </div>
        <div>
            <p className="text-white font-bold text-sm">Quick Search</p>
            <p className="text-slate-400 text-xs">Press <kbd className="px-1 py-0.5 bg-white/10 rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white/10 rounded">K</kbd> to search anytime.</p>
        </div>
        <button onClick={() => setShowSearchHint(false)} className="text-slate-500 hover:text-white ml-2">
            <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg group-hover:bg-emerald-500/30 transition-all"></div>
              <img src="/logo.png" alt="WeCare" className="relative w-10 h-10 object-contain" />
            </div>
          </div>

          {/* Desktop Tabs - Centered & Expanded */}
          <div className="hidden lg:flex items-center gap-1 bg-secondary/50 p-1.5 rounded-2xl border border-white/5 mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/10' 
                    : 'text-muted hover:text-main hover:bg-white/5'}
                `}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                {tab.label}
                {tab.id === 'chat' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-4 flex-shrink-0">
            <PrivacyToggle />
            <ThemeToggle />
            <VoiceNavigator setActiveTab={setActiveTab} />
            
            <div className="h-8 w-px bg-white/10"></div>

            <div className="flex items-center gap-2 pl-2">
              <div className="relative group cursor-pointer" tabIndex={0}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[2px] hover:scale-105 transition-transform duration-200">
                  <div className="w-full h-full rounded-full bg-primary flex items-center justify-center overflow-hidden">
                    {displayUser?.profilePicture ? (
                      <img 
                        src={getValidImageUrl(displayUser.profilePicture)} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={getDefaultAvatar(displayUser?.sex)} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                
                {/* Dropdown - Glassmorphism & Fixed Styling */}
                <div className="absolute right-0 mt-4 w-60 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-300 transform origin-top-right z-50">
                  <div className="p-4 border-b border-white/10">
                    <p className="font-bold text-white truncate"><PrivacyMask>{displayUser?.name}</PrivacyMask></p>
                    <p className="text-xs text-slate-400 capitalize">{user?.role === 'patient' && activeProfile?.type === 'family' ? 'Family Member' : user?.role}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <a href="/profile" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      <User className="w-4 h-4" />
                      My Profile
                    </a>
                    
                    {/* Family Profile Selector Integration */}
                    <FamilyProfileSelector variant="dropdown" />

                    <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-1">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-4">
            <PrivacyToggle />
            <ThemeToggle />
            <VoiceNavigator setActiveTab={setActiveTab} />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-secondary text-muted hover:text-main transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[85vh] opacity-100' : 'max-h-0 opacity-0'} overflow-y-auto`}>
        <div className="px-4 py-4 space-y-2 bg-secondary border-t border-card-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${activeTab === tab.id 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : 'text-muted hover:bg-white/5 hover:text-main'}
              `}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
              {tab.id === 'chat' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
          
          {/* Mobile Family Profile Selector */}
          <FamilyProfileSelector variant="mobile" />

          {/* User Info Mobile */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 mb-4 mt-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center overflow-hidden">
                {user?.profilePicture ? (
                  <img 
                    src={getValidImageUrl(user.profilePicture)} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={getDefaultAvatar(user?.sex)} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="font-bold text-main"><PrivacyMask>{user?.name}</PrivacyMask></p>
                <p className="text-sm text-muted"><PrivacyMask>{user?.email}</PrivacyMask></p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
