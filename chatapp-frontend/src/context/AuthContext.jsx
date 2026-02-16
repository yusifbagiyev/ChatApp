import { createContext, useState, useEffect } from "react";
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("http://localhost:7000/api/users/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (err) {
      console.log("Auth check failed:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password, rememberMe) {
    const response = await fetch("http://localhost:7000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Login failed");
    }

    const meResponse = await fetch("http://localhost:7000/api/users/me", {
      credentials: "include",
    });
    if (meResponse.ok) {
      const data = await meResponse.json();
      setUser(data);
    }
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
