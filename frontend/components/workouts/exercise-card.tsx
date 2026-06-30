"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EXERCISE_DIFFICULTY_LABELS,
  EXERCISE_EQUIPMENT_LABELS,
  MUSCLE_GROUP_LABELS,
} from "@/lib/profile-options";
import type { WorkoutExerciseResponse } from "@/types/user";

const DIFFICULTY_VARIANT: Record<string, "secondary" | "outline" | "default"> = {
  beginner: "secondary",
  intermediate: "outline",
  advanced: "default",
};

/**
 * One exercise within a workout day: name, muscle group, equipment,
 * difficulty, prescribed sets/reps/rest, and the instructions text. Part of
 * a Framer Motion stagger group — see the parent's `variants`/
 * `staggerChildren` wiring in the dashboard page.
 */
export function ExerciseCard({ workoutExercise }: { workoutExercise: WorkoutExerciseResponse }) {
  const { exercise, sets, reps, rest_seconds } = workoutExercise;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
    >
      <Card className="h-full transition-shadow duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base">{exercise.name}</CardTitle>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="outline">
              {MUSCLE_GROUP_LABELS[exercise.muscle_group] ?? exercise.muscle_group}
            </Badge>
            <Badge variant="outline">
              {EXERCISE_EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
            </Badge>
            <Badge variant={DIFFICULTY_VARIANT[exercise.difficulty] ?? "outline"} className="capitalize">
              {EXERCISE_DIFFICULTY_LABELS[exercise.difficulty] ?? exercise.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md bg-muted/50 py-2">
              <p className="text-lg font-semibold">{sets}</p>
              <p className="text-xs text-muted-foreground">Sets</p>
            </div>
            <div className="rounded-md bg-muted/50 py-2">
              <p className="text-lg font-semibold">{reps}</p>
              <p className="text-xs text-muted-foreground">Reps</p>
            </div>
            <div className="rounded-md bg-muted/50 py-2">
              <p className="text-lg font-semibold">{rest_seconds}s</p>
              <p className="text-xs text-muted-foreground">Rest</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{exercise.instructions}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
