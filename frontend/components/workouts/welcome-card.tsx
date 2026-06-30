import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileMetrics, ProfileResponse, WorkoutPlanResponse } from "@/types/user";
import { FITNESS_GOAL_OPTIONS } from "@/lib/profile-options";

function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-2 transition-colors hover:bg-accent/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p key={value} className="animate-fade-in-up font-medium">
        {value}
      </p>
    </div>
  );
}

/**
 * Section 1 — the welcome summary. `plan` is nullable: a user who hasn't
 * generated a workout yet still has a name/goal/calorie target to show, just
 * no split/workout-days values, which render as an em dash instead of being
 * left blank or crashing on a null access.
 *
 * Each stat's `key={value}` forces React to remount the text node whenever
 * the underlying value changes (e.g. right after generating a new plan), so
 * the fade-in replays — a small cue that the number actually updated rather
 * than the page silently re-rendering with new data.
 */
export function WelcomeCard({
  profile,
  metrics,
  plan,
}: {
  profile: ProfileResponse;
  metrics: ProfileMetrics;
  plan: WorkoutPlanResponse | null;
}) {
  return (
    <Card className="animate-fade-in-up overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl">
          Welcome back, <span className="text-primary">{profile.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatBlock label="Fitness goal" value={labelFor(FITNESS_GOAL_OPTIONS, profile.fitness_goal)} />
        <StatBlock label="Current split" value={plan?.title ?? "—"} />
        <StatBlock label="Workout days" value={plan ? `${plan.workout_days} / week` : "—"} />
        <StatBlock label="Daily calorie target" value={`${metrics.daily_calories} kcal`} />
      </CardContent>
    </Card>
  );
}
