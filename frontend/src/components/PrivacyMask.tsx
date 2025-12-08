import React from 'react';
import { usePrivacy } from '../context/PrivacyContext';

interface PrivacyMaskProps {
  children: React.ReactNode;
  className?: string;
  placeholder?: string; // Optional text to show instead of blur (e.g. "****")
}

export const PrivacyMask: React.FC<PrivacyMaskProps> = ({ children, className = '', placeholder }) => {
  const { isPrivacyMode } = usePrivacy();

  if (!isPrivacyMode) {
    return <span className={className}>{children}</span>;
  }

  if (placeholder) {
    return <span className={`${className} font-mono`}>{placeholder}</span>;
  }

  return (
    <span 
      className={`${className} transition-all duration-300 select-none`}
      style={{ filter: 'blur(6px)', userSelect: 'none', cursor: 'default' }}
      title="Hidden for privacy"
    >
      {children}
    </span>
  );
};
