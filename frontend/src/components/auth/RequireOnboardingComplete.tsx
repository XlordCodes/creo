import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../lib/auth-context";
import { CreoLoadingScreen } from "../ui/CreoLoadingScreen";

interface RequireOnboardingCompleteProps {
  children?: React.ReactNode;
}

/**
 * Route guard for Client Portal routes (/portal/*).
 *
 * Allows the client to access the portal workspace while enforcing locked screens
 * on all individual pages (Dashboard, Deliverables, Calendar, Pod, Library) if onboarding
 * or subscription setup is not yet complete.
 *
 * This enables the client to view their account status, click "Call & Bargain / Custom Retainer",
 * and access the "Resume Setup" flow without aggressive route kicking.
 */
export function RequireOnboardingComplete({ children }: RequireOnboardingCompleteProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <CreoLoadingScreen label="Verifying session..." />;
  }

  // If not logged in, redirect to login
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectedFrom=${returnUrl}`} replace />;
  }

  return <>{children}</>;
}

export default RequireOnboardingComplete;
