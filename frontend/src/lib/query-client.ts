import { QueryClient } from "@tanstack/react-query";
import { HttpError } from "./http";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      // Client errors (401/403/404/409...) are deterministic, so retrying them only
      // delays the UI. Retry once for network failures and 5xx responses.
      retry: (failureCount, error) => {
        if (error instanceof HttpError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});
