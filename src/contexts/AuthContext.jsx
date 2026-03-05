import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'uniformlab_admin_auth';
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    if (typeof window === 'undefined') return { admin: null, token: null };
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { admin: null, token: null };
      const parsed = JSON.parse(raw);
      return parsed && parsed.token ? parsed : { admin: null, token: null };
    } catch {
      return { admin: null, token: null };
    }
  });

  const login = async ({ email, password }) => {
    const res = await fetch(`${API_BASE}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.error?.message || 'Unable to log in';
      throw new Error(msg);
    }

    const next = { admin: data.admin, token: data.token };
    setAuth(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  const logout = () => {
    setAuth({ admin: null, token: null });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = {
    admin: auth.admin,
    token: auth.token,
    isAuthenticated: !!auth.token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return (
    ctx || {
      admin: null,
      token: null,
      isAuthenticated: false,
      login: async () => {},
      logout: () => {},
    }
  );
}
