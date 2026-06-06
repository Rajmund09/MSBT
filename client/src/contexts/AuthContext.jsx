"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getToken, setToken, setStoredUser, getStoredUser, clearSession } from "@/utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true = still checking session

  // Validate token on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // Try to restore from cache first (instant)
    const cached = getStoredUser();
    if (cached) setUser(cached);

    // Then verify with server
    api.getMe()
      .then(data => {
        const u = {
          id: data.id,
          username: data.username,
          role: data.role,
          fullName: data.full_name,
          phone: data.phone,
        };
        setUser(u);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password, remember = false) => {
    const data = await api.login(username, password);
    setToken(data.token, remember);
    setStoredUser(data.user, remember);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch (_) {}
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
