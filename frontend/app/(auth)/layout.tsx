"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { AmbientBackground } from "@/components/shared/ambient-background";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden p-6">
      {/* Shared animated background — same orbs + cursor glow as the app pages */}
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <Link href="/" className="text-2xl font-bold tracking-tight">
          <span className="text-gradient-brand">Athlyt</span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {children}
      </motion.div>
    </main>
  );
}
