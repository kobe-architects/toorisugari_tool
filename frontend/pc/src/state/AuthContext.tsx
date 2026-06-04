import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setAuthToken } from '@shared/api';
import type { StaffDTO } from '@shared/types';

const TOKEN_KEY = 'pc_token';
const USER_KEY = 'pc_user';

interface AuthState {
  user: StaffDTO | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffDTO | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const saved = localStorage.getItem(USER_KEY);
    if (token && saved) {
      setAuthToken(token);
      setUser(JSON.parse(saved) as StaffDTO);
    }
    setReady(true);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setAuthToken(res.token);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.staff));
    setUser(res.staff);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setAuthToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, ready, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
