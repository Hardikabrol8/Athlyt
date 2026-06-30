"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { BackendStatus } from "@/components/backend-status";
import { AmbientBackground } from "@/components/shared/ambient-background";
import { PrimaryButton } from "@/components/shared/primary-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden p-6">
      <AmbientBackground />

      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-2 text-center"
      >
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          <span className="text-gradient-brand">Athlyt</span>
        </h1>
        <p className="max-w-sm text-muted-foreground">
          Your AI-powered fitness coach. Personalized workouts, smarter progress.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>Create an account or sign in to continue.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <BackendStatus />
            <div className="flex gap-2">
              <PrimaryButton asChild className="flex-1">
                <Link href="/login">Sign in</Link>
              </PrimaryButton>
              <Button asChild className="flex-1" variant="outline">
                <Link href="/register">Create account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
