import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../services/api';
import { User, Team } from '../types/game';

interface AuthContextType {
  user: User | null;
  team: Team | null;
  isLoading: boolean;
  loginTeam: (teamCode: string, pin: string) => Promise<void>;
  loginAdmin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const refreshGeneration = useRef(0);

  const refreshMe = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    try {
      const data = await apiRequest<{ success: boolean; user: User; team?: Team | null }>('/auth/me');
      if (generation !== refreshGeneration.current) return;
      if (data.success && data.user) {
        setUser(data.user);
        setTeam(data.team || null);
      } else {
        setUser(null);
        setTeam(null);
      }
    } catch {
      if (generation !== refreshGeneration.current) return;
      setUser(null);
      setTeam(null);
    } finally {
      if (generation === refreshGeneration.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    const handleAuthChange = () => { void refreshMe(); };
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'squid_token_backup') handleAuthChange();
    };

    window.addEventListener('squid-auth-changed', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('squid-auth-changed', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshMe]);

  const loginTeam = async (teamCode: string, pin: string) => {
    localStorage.removeItem('squid_token_backup');
    const res = await apiRequest<{ success: boolean; token: string; team: Team }>('/auth/team/login', {
      method: 'POST',
      body: JSON.stringify({ teamCode, pin })
    });

    if (res.token) {
      localStorage.setItem('squid_token_backup', res.token);
    }
    await refreshMe();
  };

  const loginAdmin = async (username: string, password: string) => {
    localStorage.removeItem('squid_token_backup');
    const res = await apiRequest<{ success: boolean; token: string; user: User }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (res.token) {
      localStorage.setItem('squid_token_backup', res.token);
    }
    await refreshMe();
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Continue client cleanup even if network failed
    } finally {
      localStorage.removeItem('squid_token_backup');
      setUser(null);
      setTeam(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        team,
        isLoading,
        loginTeam,
        loginAdmin,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
