import { createContext, useState, useEffect } from "react";
import { apiGet, apiPost, scheduleRefresh, stopRefreshTimer } from "../services/api";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const data = await apiGet("/api/users/me");
      setUser(data);
      // Auth uğurlu — proactive refresh timer başlat
      scheduleRefresh();
    } catch {
      // apiGet artıq 401 olanda auto-refresh edir.
      // Buraya düşürsə refresh də uğursuz olub — login lazımdır.
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password, rememberMe) {
    await apiPost("/api/auth/login", { email, password, rememberMe });
    const data = await apiGet("/api/users/me");
    setUser(data);
    // Login uğurlu — proactive refresh timer başlat
    scheduleRefresh();
  }

  async function logout() {
    // Timer-i dayandır
    stopRefreshTimer();
    try {
      await apiPost("/api/auth/logout");
    } catch {
      // Logout uğursuz olsa belə, frontend-i təmizlə
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export { AuthContext, AuthProvider };
