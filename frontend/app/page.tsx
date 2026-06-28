import Link from "next/link";

import { BackendStatus } from "@/components/backend-status";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Still a placeholder, not the real marketing landing page — that's a later
 * feature, not part of Milestone 1. Its job right now is to confirm the
 * stack is wired up and route into the real auth flow.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Athlyt</h1>
        <p className="text-muted-foreground">Train smarter. Progress faster.</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Get started</CardTitle>
          <CardDescription>Create an account or sign in to continue.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <BackendStatus />
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="flex-1" variant="outline">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
