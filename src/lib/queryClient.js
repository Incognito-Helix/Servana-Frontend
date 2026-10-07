import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: (count, error) => {
        const retryable = error?.status === 0 || error?.status >= 500
        return retryable ? count < 2 : false
      },
    },
  },
})
