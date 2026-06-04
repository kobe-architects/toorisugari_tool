import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setAuthToken } from '@shared/api';
import type { StaffDTO } from '@shared/types';

const TOKEN_KEY = 'pos_token';
const STAFF_KEY = 'pos_staff';

interface AuthState {
  staff: StaffDTO | null;
  ready: boolean; // localStorage 復元完了フラグ
  login: (staffId: number, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffDTO | null>(null);
  const [ready, setReady] = useState(false);

  // 起動時に localStorage からトークンを復元
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const saved = localStorage.getItem(STAFF_KEY);
    if (token && saved) {
      setAuthToken(token);
      setStaff(JSON.parse(saved) as StaffDTO);
    }
    setReady(true);
  }, []);

  const login = async (staffId: number, pin: string) => {
    const res = await api.pinLogin(staffId, pin);
    setAuthToken(res.token);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(STAFF_KEY, JSON.stringify(res.staff));
    setStaff(res.staff);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // トークン失効済みでも握りつぶしてローカルをクリア
    }
    setAuthToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STAFF_KEY);
    setStaff(null);
  };

  return <AuthCtx.Provider value={{ staff, ready, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
