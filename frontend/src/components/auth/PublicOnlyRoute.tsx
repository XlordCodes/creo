import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../lib/auth-context";
import { getRoleHome } from "./ProtectedRoute";
import { getPostLoginRedirect } from "../../lib/useRouteMemory";

import { CreoLoadingScreen } from "../ui/CreoLoadingScreen";

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <CreoLoadingScreen label="Authenticating..." />;
  }

  // Already authenticated -> redirect to saved route or role home
  if (user) {
    const defaultHome = getRoleHome(user.role);
    const destination = getPostLoginRedirect(user.role, null, defaultHome);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

