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
          full_name: data.full_name,
          phone: data.phone,
          permissions: data.permissions || {},
          profile_photo: data.profile_photo,
        };
        setUser(u);
        setStoredUser(u, !!localStorage.getItem("token"));
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.getMe();
      const u = {
        id: data.id,
        username: data.username,
        role: data.role,
        full_name: data.full_name,
        phone: data.phone,
        permissions: data.permissions || {},
        profile_photo: data.profile_photo,
      };
      setUser(u);
      setStoredUser(u, !!localStorage.getItem("token"));
      return u;
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, []);

  const login = useCallback(async (username, password, remember = false) => {
    const data = await api.login(username, password, remember);
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

  const hasPermission = useCallback((moduleName, action) => {
    if (!user) return false;
    if (user.role === 'Owner') return true;
    const perms = user.permissions || {};
    const modPerms = perms[moduleName] || [];
    return modPerms.includes(action);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
