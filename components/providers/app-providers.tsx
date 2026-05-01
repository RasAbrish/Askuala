"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { FirstTimeSplash } from "@/components/providers/FirstTimeSplash";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ServiceWorkerRegister />
      <FirstTimeSplash />
      {children}
    </QueryClientProvider>
  );
}
