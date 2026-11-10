import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: (failureCount, error: any) => {
        if (error?.statusCode === 401 || error?.statusCode === 403 || error?.statusCode === 404) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
    },
  },
});

