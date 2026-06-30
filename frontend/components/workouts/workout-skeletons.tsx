import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A shimmer block, visually distinct from the base `Skeleton` primitive's
 * plain pulse — used only in the workout dashboard's loading states so the
 * busiest-loading part of the app (4 sections, all fetching) feels alive
 * rather than several identical gray pulsing rectangles.
 */
function ShimmerBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("animate-shimmer rounded-md", className)} style={style} />;
}

export function WelcomeCardSkeleton() {
  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <ShimmerBlock className="h-7 w-56" />
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <ShimmerBlock className="h-3 w-20" />
            <ShimmerBlock className="h-5 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TodaysWorkoutCardSkeleton() {
  return (
    <Card className="animate-fade-in-up [animation-delay:60ms]">
      <CardHeader>
        <ShimmerBlock className="h-6 w-40" />
        <ShimmerBlock className="h-4 w-28" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <ShimmerBlock className="h-12" />
          <ShimmerBlock className="h-12" />
          <ShimmerBlock className="h-12" />
        </div>
        <ShimmerBlock className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export function WeeklyPlanSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <ShimmerBlock
          key={index}
          className="h-28 animate-fade-in-up"
          style={{ animationDelay: `${index * 60}ms` }}
        />
      ))}
    </div>
  );
}

export function ExerciseListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <ShimmerBlock
          key={index}
          className="h-44 animate-fade-in-up"
          style={{ animationDelay: `${index * 60}ms` }}
        />
      ))}
    </div>
  );
}
