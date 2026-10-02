import type React from "react";
import { useRef } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../lib/auth-context";
import { useOnboardingGate } from "../../lib/useOnboardingGate";
import { CreoLoadingScreen } from "../ui/CreoLoadingScreen";

interface RequireOnboardingStageProps {
  children?: React.ReactNode;
}

/**
 * Route guard for Onboarding routes (/onboarding, /onboarding/*).
 * Clients who have ALREADY completed onboarding are forwarded to /portal.
 *
 * The decision uses the cached onboarding status (or the stage from /auth/me), so the
 * onboarding screen renders immediately instead of waiting on a fresh status request.
 * Once the flow is on screen we never yank the client away, which lets the final
 * "workspace ready" step show after they finish.
 */
export function RequireOnboardingStage({ children }: RequireOnboardingStageProps) {
  const { loading: authLoading } = useAuth();
  const gate = useOnboardingGate();
  const hasRenderedFlow = useRef(false);

  if (authLoading || !gate.isReady) {
    return <CreoLoadingScreen label="Checking onboarding stage..." />;
  }

  // Forward to /portal only when onboarding is complete AND the subscription is active;
  // an inactive/expired retainer must still be able to reach the plan step without loops.
  const isSubActive = gate.status ? Boolean(gate.status.checklist?.subscription_active) : gate.isPaid;
  if (gate.isClient && gate.isComplete && isSubActive && !hasRenderedFlow.current) {
    return <Navigate to="/portal" replace />;
  }

  hasRenderedFlow.current = true;
  return <>{children}</>;
}

export default RequireOnboardingStage;
