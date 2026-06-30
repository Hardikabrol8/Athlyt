"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Generic empty-state shell: icon in a soft circle, title, description, and
 * an optional action slot. `EmptyWorkoutState` (and any future empty state —
 * no diet plan, no progress logged, etc.) composes this rather than each
 * one rebuilding the same icon-circle-plus-copy layout from scratch.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.08, rotate: 4 }}
          className="flex size-16 items-center justify-center rounded-full bg-accent"
        >
          <Icon className="size-8 text-accent-foreground" />
        </motion.div>
        <div className="space-y-1">
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
