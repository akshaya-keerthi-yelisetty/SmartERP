import { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const [activeCompany, setActiveCompany] = useState(
    JSON.parse(localStorage.getItem("activeCompany")) || null
  );

  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeCompany");
    setToken(null);
    setUser(null);
    setActiveCompany(null);
  };

  // Called when the user picks which company they're working in,
  // or clears the selection by passing null
  const selectCompany = (company) => {
    if (company) {
      localStorage.setItem("activeCompany", JSON.stringify(company));
    } else {
      localStorage.removeItem("activeCompany");
    }
    setActiveCompany(company);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, activeCompany, selectCompany }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}