import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const PrivacyToggle: React.FC = () => {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  return (
    <button
      onClick={togglePrivacyMode}
      className={`p-3 rounded-xl transition-all duration-300 ${
        isPrivacyMode 
          ? 'bg-purple-500/20 text-purple-400' 
          : 'bg-secondary text-muted hover:text-main hover:bg-white/5'
      }`}
      title={isPrivacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
    >
      {isPrivacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
  );
};
