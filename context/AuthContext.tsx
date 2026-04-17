// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { authApi, setAuthToken, User } from "../services/api";

interface AuthCtx {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "cartsync_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate on startup
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(KEY);
        if (stored) {
          setAuthToken(stored);
          const me = await authApi.me();
          setToken(stored);
          setUser(me);
        }
      } catch {
        await SecureStore.deleteItemAsync(KEY).catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (t: string, u: User) => {
    await SecureStore.setItemAsync(KEY, t);
    console.log("Persisted auth token and user", u);
    setAuthToken(t);
    setToken(t);
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email.trim(), password);
    const user = { ...res.user, listIds: res.listIds };
    await persist(res.token, user);
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await authApi.register(email.trim(), password, name.trim());
    const user = { ...res.user, listIds: res.listIds };
    await persist(res.token, user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(KEY).catch(() => {});
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {}
  };

  return (
    <Ctx.Provider
      value={{ user, token, loading, login, register, logout, refreshUser }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
