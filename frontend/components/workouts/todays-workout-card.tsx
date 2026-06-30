"use client";

import { Clock, Dumbbell, Target } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStatCard } from "@/components/shared/dashboard-stat-card";
import { PrimaryButton } from "@/components/shared/primary-button";
import type { WorkoutDayResponse } from "@/types/user";

/**
 * Section 2 — today's specific workout. `estimatedDurationMinutes` is passed
 * in separately because it lives on the plan-level response
 * (`GeneratedWorkoutPlanResponse`), not on the day itself — `/workouts/today`
 * returns a bare `WorkoutDayResponse` with no duration field.
 *
 * "Start Workout" has no behavior yet — workout *completion* tracking is
 * explicitly out of scope for this milestone — so it's disabled with a
 * title tooltip rather than silently doing nothing on click.
 *
 * A subtle gradient wash marks this as the dashboard's primary call-to-
 * action card, distinct from the plainer cards below it.
 */
export function TodaysWorkoutCard({
  day,
  estimatedDurationMinutes,
}: {
  day: WorkoutDayResponse;
  estimatedDurationMinutes: number | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-accent/5 to-transparent"
        />
        <CardHeader className="relative">
          <CardTitle>Today&apos;s workout</CardTitle>
          <CardDescription>{day.day_name}</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <DashboardStatCard icon={Target} label="Focus area" value={day.focus_area} />
            <DashboardStatCard
              icon={Clock}
              label="Est. duration"
              value={estimatedDurationMinutes !== null ? `~${estimatedDurationMinutes} min` : "—"}
            />
            <DashboardStatCard
              icon={Dumbbell}
              label="Exercises"
              numericValue={day.workout_exercises.length}
            />
          </div>
          <PrimaryButton
            className="w-full"
            disabled
            title="Workout completion tracking is coming in a future milestone."
          >
            Start Workout
          </PrimaryButton>
        </CardContent>
      </Card>
    </motion.div>
  );
}
