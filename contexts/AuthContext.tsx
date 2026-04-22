import React, { createContext, useContext, useState, useEffect } from 'react';
import { authFetch } from '../utils/apiClient';

export interface Membership {
  plan: string;
  status: string;
  trialRemaining: number;
  expireAt: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: string;
  membership?: Membership;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('token') : null
  );

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    
    try {
      const res = await authFetch('/api/auth?action=me');
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handle401 = () => {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth_401', handle401);
    return () => window.removeEventListener('auth_401', handle401);
  }, []);

  const login = (newToken: string, loggedInUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(loggedInUser);
    refreshUser();
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    await fetch('/api/auth?action=logout', { method: 'POST' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout, refreshUser }}>
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
