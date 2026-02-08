// src/context/AuthContext.js
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // important

  const loadUser = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user || null);
    } catch (err) {
      console.error("loadUser error:", err?.response?.data || err.message || err);
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (token) => {
      if (!token) return null;
      localStorage.setItem("token", token);
      await loadUser();
      return true;
    },
    [loadUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  // sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") loadUser();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadUser]);

  // initial load
  useEffect(() => { loadUser(); }, [loadUser]);

  const isAuthenticated = !!user;
  const isAdmin = !!user && (user.is_admin === 1 || user.is_admin === true);

  const value = useMemo(() => ({
    user,
    setUser,
    loadUser,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    loading
  }), [user, loadUser, login, logout, isAuthenticated, isAdmin, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


