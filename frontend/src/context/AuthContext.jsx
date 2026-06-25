import { createContext, useState, useContext, useEffect } from "react";

// Create the context object itself
const AuthContext = createContext();

// This Provider component wraps the whole app and holds the shared auth state
export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  // Called after a successful login
  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // Called when the user logs out
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// A small custom hook so other components can easily access auth state
export function useAuth() {
  return useContext(AuthContext);
}