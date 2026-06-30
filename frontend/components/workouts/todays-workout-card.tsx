import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkoutDayResponse } from "@/types/user";

/**
 * Section 2 — today's specific workout. `estimatedDurationMinutes` is passed
 * in separately because it lives on the plan-level response
 * (`GeneratedWorkoutPlanResponse`), not on the day itself — `/workouts/today`
 * returns a bare `WorkoutDayResponse` with no duration field.
 *
 * "Start Workout" has no behavior yet — workout *completion* tracking is
 * explicitly out of scope for this milestone — so it's disabled with a title
 * tooltip rather than silently doing nothing on click.
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
    <Card className="animate-fade-in-up relative overflow-hidden [animation-delay:60ms]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"
      />
      <CardHeader className="relative">
        <CardTitle>Today&apos;s workout</CardTitle>
        <CardDescription>{day.day_name}</CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border bg-card/50 py-3 transition-transform hover:scale-[1.03]">
            <p className="text-lg font-semibold">{day.focus_area}</p>
            <p className="text-xs text-muted-foreground">Focus area</p>
          </div>
          <div className="rounded-lg border bg-card/50 py-3 transition-transform hover:scale-[1.03]">
            <p className="text-lg font-semibold">
              {estimatedDurationMinutes !== null ? `~${estimatedDurationMinutes} min` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Est. duration</p>
          </div>
          <div className="rounded-lg border bg-card/50 py-3 transition-transform hover:scale-[1.03]">
            <p className="text-lg font-semibold">{day.workout_exercises.length}</p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>
        </div>
        <Button
          className="w-full transition-transform active:scale-[0.98]"
          disabled
          title="Workout completion tracking is coming in a future milestone."
        >
          Start Workout
        </Button>
      </CardContent>
    </Card>
  );
}
