"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { EmptyWorkoutState } from "@/components/workouts/empty-workout-state";
import { ExerciseCard } from "@/components/workouts/exercise-card";
import { TodaysWorkoutCard } from "@/components/workouts/todays-workout-card";
import { WeeklyPlanCard } from "@/components/workouts/weekly-plan-card";
import { WelcomeCard } from "@/components/workouts/welcome-card";
import { WorkoutErrorState } from "@/components/workouts/workout-error-state";
import {
  TodaysWorkoutCardSkeleton,
  WeeklyPlanSkeleton,
  WelcomeCardSkeleton,
} from "@/components/workouts/workout-skeletons";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  isNotFoundError,
  useCurrentWorkout,
  useGenerateWorkout,
  useTodayWorkout,
} from "@/hooks/use-workouts";

/** ISO weekday (1=Mon…7=Sun) mapped onto the plan's training days — same
 * logic as the backend's `/workouts/today`, so the "Today" badge in the
 * weekly grid lines up with whichever day that endpoint actually returns. */
function todaysDayNumber(workoutDays: number): number {
  const jsDay = new Date().getDay(); // 0=Sun…6=Sat
  const isoWeekday = jsDay === 0 ? 7 : jsDay;
  return ((isoWeekday - 1) % workoutDays) + 1;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();

  const {
    data: plan,
    isLoading: planLoading,
    isError: planIsError,
    error: planError,
    refetch: refetchPlan,
  } = useCurrentWorkout();

  const {
    data: todayDay,
    isLoading: todayLoading,
    isError: todayIsError,
    error: todayError,
    refetch: refetchToday,
  } = useTodayWorkout();

  const generateWorkout = useGenerateWorkout();

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  // A logged-in user who hasn't onboarded yet has nothing to show here —
  // same redirect the dashboard always did; onboarding itself is untouched.
  useEffect(() => {
    if (user && !user.profile) {
      router.replace("/onboarding");
    }
  }, [user, router]);

  // Default the selected day to today's once the plan loads.
  useEffect(() => {
    if (plan && plan.days.length > 0 && !selectedDayId) {
      const todayNumber = todaysDayNumber(plan.workout_days);
      const match = plan.days.find((day) => day.day_number === todayNumber);
      setSelectedDayId((match ?? plan.days[0]).id);
    }
  }, [plan, selectedDayId]);

  function handleGenerate() {
    setSelectedDayId(null);
    const days = user?.profile
      ? user.profile.activity_level === "sedentary" || user.profile.activity_level === "lightly_active"
        ? 3
        : 5
      : 3;

    generateWorkout.mutate(
      { workout_days_per_week: days },
      {
        onSuccess: () => toast.success("Workout plan generated!"),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Failed to generate workout."),
      },
    );
  }

  const planNotFound = planIsError && isNotFoundError(planError);
  const planHasRealError = planIsError && !planNotFound;
  const todayNotFound = todayIsError && isNotFoundError(todayError);
  const todayHasRealError = todayIsError && !todayNotFound;

  const estimatedDurationMinutes =
    plan && "estimated_duration_minutes" in plan
      ? (plan as unknown as { estimated_duration_minutes: number }).estimated_duration_minutes
      : null;

  if (userLoading || !user?.profile || !user.metrics) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <WelcomeCardSkeleton />
        <TodaysWorkoutCardSkeleton />
        <WeeklyPlanSkeleton />
      </div>
    );
  }

  const { profile, metrics } = user;
  const selectedDay = plan?.days.find((day) => day.id === selectedDayId) ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 sm:px-0">
      {/* Section 1 — Welcome */}
      {planLoading ? (
        <WelcomeCardSkeleton />
      ) : (
        <WelcomeCard profile={profile} metrics={metrics} plan={planNotFound ? null : (plan ?? null)} />
      )}

      {planHasRealError ? (
        <WorkoutErrorState onRetry={() => refetchPlan()} />
      ) : planNotFound ? (
        /* Section 5 — Empty state, no active plan */
        <EmptyWorkoutState onGenerate={handleGenerate} isGenerating={generateWorkout.isPending} />
      ) : (
        <>
          {/* Section 2 — Today's workout */}
          {todayLoading ? (
            <TodaysWorkoutCardSkeleton />
          ) : todayHasRealError ? (
            <WorkoutErrorState message="Couldn't load today's workout." onRetry={() => refetchToday()} />
          ) : todayDay && !todayNotFound ? (
            <TodaysWorkoutCard day={todayDay} estimatedDurationMinutes={estimatedDurationMinutes} />
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Today is a rest day. Enjoy the recovery!
            </div>
          )}

          {/* Section 3 — Weekly plan */}
          {planLoading ? (
            <WeeklyPlanSkeleton />
          ) : plan ? (
            <div>
              <h2 className="mb-3 text-lg font-semibold">This week&apos;s plan</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plan.days.map((day, index) => {
                  const maxExercises = Math.max(
                    ...plan.days.map((d) => d.workout_exercises.length || 1),
                    1,
                  );
                  const proportionalDuration = estimatedDurationMinutes
                    ? Math.round(
                        (estimatedDurationMinutes * (day.workout_exercises.length || 1)) /
                          maxExercises,
                      )
                    : 45;
                  return (
                    <WeeklyPlanCard
                      key={day.id}
                      day={day}
                      isToday={day.day_number === todaysDayNumber(plan.workout_days)}
                      isSelected={day.id === selectedDayId}
                      estimatedDurationMinutes={proportionalDuration}
                      animationDelay={index * 60}
                      onSelect={() => setSelectedDayId(day.id)}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Section 4 — Workout details for the selected day. Keyed on the
              selected day's id so switching days remounts this block and
              its children, replaying their entrance animation as visible
              feedback that the selection actually changed. */}
          {!planLoading && plan && selectedDay && (
            <div key={selectedDay.id} className="animate-fade-in-up">
              <h2 className="mb-3 text-lg font-semibold">{selectedDay.day_name}</h2>
              {selectedDay.workout_exercises.length === 0 ? (
                <p className="text-sm text-muted-foreground">No exercises scheduled for this day.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedDay.workout_exercises.map((we, index) => (
                    <ExerciseCard key={we.id} workoutExercise={we} animationDelay={index * 50} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
