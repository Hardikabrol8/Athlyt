import { BackendStatus } from "@/components/backend-status";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Placeholder home page for Project Setup.
 *
 * This intentionally is not the real marketing landing page — that's a later
 * feature. Its job right now is to prove three things work together: Tailwind
 * + shadcn/ui theming (light/dark), the folder structure, and a live call to
 * the FastAPI backend's health endpoint.
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
          <CardTitle>Project setup</CardTitle>
          <CardDescription>
            Frontend, backend, and database are wired up. Features come next.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <BackendStatus />
          <div className="flex gap-2">
            <Button className="flex-1" disabled>
              Sign in
            </Button>
            <Button className="flex-1" variant="outline" disabled>
              Create account
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Auth arrives in the next feature.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
