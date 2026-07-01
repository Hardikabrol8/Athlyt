"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { motion, type Variants } from "framer-motion";
import { Activity, Clock, Flame, Target, Trophy, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { DashboardStatCard } from "@/components/shared/dashboard-stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { TiltCard } from "@/components/shared/tilt-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { useCurrentWorkout as useWorkouts, useTodayWorkout as useTodaysWorkout, useGenerateWorkout } from "@/hooks/use-workouts";
import { TodaysWorkoutCard } from "@/components/workouts/todays-workout-card";
import { EmptyWorkoutState } from "@/components/workouts/empty-workout-state";
import { TodaysWorkoutCardSkeleton } from "@/components/workouts/workout-skeletons";
import { WorkoutErrorState } from "@/components/workouts/workout-error-state";

function useWorkoutStats() {
  return useQuery({
    queryKey: ["workouts", "stats", "summary"],
    queryFn: () => apiFetch<Record<string, number>>("/workouts/stats/summary"),
  });
}

function useWorkoutHistory() {
  return useQuery({
    queryKey: ["workouts", "history"],
    queryFn: () => apiFetch<any[]>("/workouts/history"),
  });
}

const container: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

export default function WorkoutsPage() {
  const { data: stats, isLoading: statsLoading } = useWorkoutStats();
  const { data: history, isLoading: historyLoading } = useWorkoutHistory();
  const { data: plan, isLoading: planLoading, isError: planError } = useWorkouts();
  const { data: todayData, isLoading: todayLoading } = useTodaysWorkout();
  const generateMutation = useGenerateWorkout();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={item}>
        <SectionHeader title="Workouts" description="Track your training and progress" />
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <TiltCard><DashboardStatCard icon={Activity} label="Total sessions" numericValue={stats?.total_sessions} /></TiltCard>
            <TiltCard><DashboardStatCard icon={Clock} label="Total minutes" numericValue={stats?.total_minutes} /></TiltCard>
            <TiltCard><DashboardStatCard icon={Flame} label="Calories burned" value={`${Math.round(stats?.total_calories_burned ?? 0)} kcal`} /></TiltCard>
            <TiltCard><DashboardStatCard icon={Zap} label="Current streak" value={`${stats?.current_streak_days ?? 0} days`} /></TiltCard>
            <TiltCard><DashboardStatCard icon={Trophy} label="Longest streak" value={`${stats?.longest_streak_days ?? 0} days`} /></TiltCard>
            <TiltCard><DashboardStatCard icon={Target} label="This week" numericValue={stats?.sessions_last_7_days} /></TiltCard>
          </>
        )}
      </motion.div>

      {/* Today's workout */}
      <motion.div variants={item}>
        <SectionHeader title="Today's workout" />
        {todayLoading || planLoading ? (
          <TodaysWorkoutCardSkeleton />
        ) : planError ? (
          <WorkoutErrorState onRetry={() => window.location.reload()} />
        ) : !plan ? (
          <EmptyWorkoutState onGenerate={() => generateMutation.mutate({ workout_days_per_week: 5 })} isGenerating={generateMutation.isPending} />
        ) : !todayData ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Rest day — enjoy the recovery!</CardContent></Card>
        ) : (
          <TodaysWorkoutCard
            day={todayData}
            estimatedDurationMinutes={Math.ceil((todayData.workout_exercises?.length ?? 0) * 4.5)}
          />
        )}
      </motion.div>

      {/* History */}
      <motion.div variants={item}>
        <SectionHeader title="Workout history" description="Your completed sessions" />
        {historyLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : !history?.length ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No completed workouts yet. Start your first session above!</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 10).map((s: any) => (
              <TiltCard key={s.id} intensity={4}>
                <Card>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{new Date(s.started_at).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.total_duration_minutes} min · {Math.round(s.calories_burned_estimate ?? 0)} kcal
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {s.exercise_completions?.filter((c: any) => c.completed).length ?? 0} completed
                      </Badge>
                      <Badge variant="secondary">Done</Badge>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
