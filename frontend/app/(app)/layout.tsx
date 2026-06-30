"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { clearToken, getToken } from "@/lib/auth-token";

/**
 * Protects every page under `(app)` (onboarding, dashboard, ...) — redirects
 * to `/login` if there's no token, or if `/users/me` comes back 401 (an
 * expired or otherwise invalid token).
 *
 * `mounted` exists purely to avoid a hydration mismatch: `getToken()` reads
 * `localStorage`, which doesn't exist during server rendering, so the server
 * and the client's very first render must render the *same* thing (a
 * skeleton) — the real auth check only happens after mount, entirely
 * client-side, where it can read the real value safely.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const { data: user, isLoading, isError } = useCurrentUser();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken() || isError) {
      clearToken();
      queryClient.clear();
      router.replace("/login");
    }
  }, [mounted, isError, queryClient, router]);

  function handleLogout() {
    clearToken();
    queryClient.clear();
    router.push("/login");
  }

  if (!mounted || !getToken() || isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
        <span className="text-lg font-bold tracking-tight">Athlyt</span>
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoading ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            <span className="hidden max-w-32 truncate text-sm text-muted-foreground sm:inline">
              {user?.profile?.name ?? user?.email}
            </span>
          )}
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="transition-transform active:scale-95"
          >
            Log out
          </Button>
        </div>
      </header>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
