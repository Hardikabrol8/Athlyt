import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WorkoutDayResponse } from "@/types/user";

/**
 * One day within the weekly plan grid (Section 3). Clickable — selecting it
 * drives Section 4 (Workout Details) below. `isToday` adds a visual
 * highlight so the user's current day stands out among the week's cards.
 * `animationDelay` staggers the entrance so the grid fills in card-by-card
 * rather than popping in all at once.
 */
export function WeeklyPlanCard({
  day,
  isToday,
  isSelected,
  estimatedDurationMinutes,
  animationDelay = 0,
  onSelect,
}: {
  day: WorkoutDayResponse;
  isToday: boolean;
  isSelected: boolean;
  estimatedDurationMinutes: number;
  animationDelay?: number;
  onSelect: () => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={cn(
        "animate-fade-in-up cursor-pointer transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]",
        isSelected
          ? "border-primary shadow-md ring-1 ring-primary"
          : "hover:border-primary/50",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{day.day_name}</CardTitle>
          {isToday && <Badge className="animate-scale-in">Today</Badge>}
        </div>
        <CardDescription>{day.focus_area}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{day.workout_exercises.length} exercises</span>
        <span>~{estimatedDurationMinutes} min</span>
      </CardContent>
    </Card>
  );
}
