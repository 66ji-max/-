import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  membership?: Membership;
}

export interface Membership {
  plan: string;
  status: string;
  trialRemaining: number;
  expireAt: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Note: we're using HttpOnly cookies so we just ask the server if we are logged in.
  const refreshUser = async () => {
    try {
      // Send credentials true to include cookie
      const res = await fetch('/api/auth/me', {
          // If we had cross-origin, we'd use credentials: 'include'. 
          // Since it's proxy/same-origin, fetch sends cookies by default if we don't block it.
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
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
  }, []);

  const login = (token: string, loggedInUser: User) => {
    // Token is stored in cookie automatically. We could also store it in localStorage if we want.
    setUser(loggedInUser);
    refreshUser(); // Refresh to catch fresh membership details
  };

  const logout = async () => {
    setUser(null);
    await fetch('/api/auth/logout', { method: 'POST' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
