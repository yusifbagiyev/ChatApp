import { createContext, useState, useEffect } from "react";
import { apiGet, apiPost } from "../services/api";

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
    } catch (err) {
      console.log("Auth check failed:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password, rememberMe) {
    await apiPost("/api/auth/login", { email, password, rememberMe });
    const data = await apiGet("/api/users/me");
    setUser(data);
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export { AuthContext, AuthProvider };
