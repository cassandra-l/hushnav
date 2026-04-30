import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../auth-lock";

export function AuthGate() {
  const location = useLocation();

  // Keep requested route for post-unlock redirect.
  if (!isAuthenticated()) {
    return <Navigate to="/lock" replace state={{ from: location }} />;
  }

  // Show protected pages when auth is valid.
  return <Outlet />;
}

