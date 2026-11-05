// app/providers.tsx
"use client";

declare global {
  interface Window {
    __apiHeadersInstalled?: boolean;
  }
}
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

function installApiHeaders() {
  if (typeof window === "undefined" || window.__apiHeadersInstalled) return;
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const isApi = url.includes("/api/users");
    let nextInit = init;
    if (isApi) {
      const headers = new Headers(
        init?.headers || (input instanceof Request ? input.headers : undefined),
      );
      const userSession = localStorage.getItem("user_session_id");
      const adminSession = localStorage.getItem("admin_session_id");
      const adminKey = localStorage.getItem("adminApiKey");
      if (userSession && !headers.has("x-user-session")) {
        headers.set("x-user-session", userSession);
      }
      if (adminSession && !headers.has("x-session-id")) {
        headers.set("x-session-id", adminSession);
      }
      if (adminKey && !headers.has("x-admin-key")) {
        headers.set("x-admin-key", adminKey);
      }
      nextInit = { ...init, headers };
    }

    const response = await original(input, nextInit);
    if (isApi && (response.status === 401 || response.status === 403)) {
      response
        .clone()
        .json()
        .then((data) => {
          const role = localStorage.getItem("tabRole");
          const adminLockedOut = new Set([
            "ADMIN_BANNED",
            "ADMIN_DISABLED",
            "SESSION_KICKED",
            "SESSION_REVOKED",
            "SESSION_INVALIDATED",
          ]);
          if (role === "virtual_admin" && adminLockedOut.has(data?.error)) {
            localStorage.removeItem("adminApiKey");
            localStorage.removeItem("admin_session_id");
            localStorage.removeItem("tabRole");
            localStorage.removeItem("virtualAdmin");
            localStorage.removeItem("virtualAdminRefKey");
            localStorage.removeItem("session");
            window.location.href = "/";
            return;
          }
          if (data?.error !== "USER_SESSION_REQUIRED") return;
          localStorage.removeItem("user_session_id");
          localStorage.removeItem("session");
          if (role !== "admin" && role !== "virtual_admin") {
            window.location.href = "/";
          }
        })
        .catch(() => {});
    }
    return response;
  };
  window.__apiHeadersInstalled = true;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  if (typeof window !== "undefined") {
    installApiHeaders();
  }

  // ✅ Create queryClient inside useState to prevent recreation on each render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60000,
            gcTime: 300000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}