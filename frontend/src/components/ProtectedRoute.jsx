import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps any page that should require login
function ProtectedRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    // No token = not logged in = bounce to login page
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;