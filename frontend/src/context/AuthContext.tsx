import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  role: 'doctor' | 'patient' | 'admin';
  name?: string;
  verificationStatus?: string;
  phone?: string;
  address?: string;
  age?: number;
  sex?: string;
  profilePicture?: string;
  specialization?: string;
  doctorProfile?: {
    bio?: string;
    experience?: number;
    location?: string;
    specialization?: string;
    licenseNumber?: string;
    rating?: number;
    isGeneralPractitioner?: boolean;
  };
}

export interface ActiveProfile {
  type: 'user' | 'family';
  id: number;
  name: string;
  profilePicture?: string;
  age?: number; // Useful for UI
  sex?: string; // Useful for UI
  relation?: string; // Only for family
}


interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeProfile: ActiveProfile | null;
  isFamilySession: boolean;
  login: (token: string, user: User, activeProfile?: ActiveProfile, isFamilySession?: boolean) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  switchProfile: (profile: ActiveProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeProfile, setActiveProfile] = useState<ActiveProfile | null>(null);
  const [isFamilySession, setIsFamilySession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedProfile = localStorage.getItem('activeProfile');
    const storedFamilySession = localStorage.getItem('isFamilySession');
    
    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      if (storedFamilySession === 'true') {
          setIsFamilySession(true);
      }

      if (storedProfile) {
        setActiveProfile(JSON.parse(storedProfile));
      } else {
        // Default to user profile
        setActiveProfile({
            type: 'user',
            id: parsedUser.id,
            name: parsedUser.name || 'My Profile',
            profilePicture: parsedUser.profilePicture,
            age: parsedUser.age,
            sex: parsedUser.sex
        });
      }
    }
    setLoading(false);

    // Add interceptor for 401s
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = (token: string, userData: User, initialActiveProfile?: ActiveProfile, familySession: boolean = false) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isFamilySession', String(familySession));
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    setIsFamilySession(familySession);
    
    let profileToSet: ActiveProfile;

    if (initialActiveProfile) {
        profileToSet = initialActiveProfile;
    } else {
        // Default active profile to user
        profileToSet = {
            type: 'user',
            id: userData.id,
            name: userData.name || 'My Profile',
            profilePicture: userData.profilePicture,
            age: userData.age,
            sex: userData.sex
        };
    }
    
    setActiveProfile(profileToSet);
    localStorage.setItem('activeProfile', JSON.stringify(profileToSet));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeProfile');
    localStorage.removeItem('isFamilySession');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setActiveProfile(null);
    setIsFamilySession(false);
  };

  const updateUser = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    // If active profile is the user, update it too
    if (activeProfile?.type === 'user') {
        const updatedProfile: ActiveProfile = {
            ...activeProfile,
            name: userData.name || activeProfile.name,
            profilePicture: userData.profilePicture,
            age: userData.age,
            sex: userData.sex
        };
        setActiveProfile(updatedProfile);
        localStorage.setItem('activeProfile', JSON.stringify(updatedProfile));
    }
  };

  const switchProfile = (profile: ActiveProfile) => {
    if (isFamilySession) return; // Prevent switching in family session
    
    setActiveProfile(profile);
    localStorage.setItem('activeProfile', JSON.stringify(profile));
  };

  return (
    <AuthContext.Provider value={{ user, loading, activeProfile, isFamilySession, login, logout, updateUser, switchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
