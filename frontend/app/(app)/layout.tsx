"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AmbientBackground } from "@/components/shared/ambient-background";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { clearToken, getToken } from "@/lib/auth-token";

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
    <div className="relative min-h-screen">
      {/* Ambient animated background — fixed, behind everything */}
      <AmbientBackground />

      {/* Header — glass-morphism so the orbs glow through it */}
      <header className="glass-card sticky top-0 z-20 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 sm:px-6 sm:py-4">
        <span className="text-lg font-bold tracking-tight">
          <span className="text-gradient-brand">Athlyt</span>
        </span>
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

      {/* Page content sits above the fixed background */}
      <main className="relative z-10 p-4 sm:p-6">{children}</main>
    </div>
  );
}
