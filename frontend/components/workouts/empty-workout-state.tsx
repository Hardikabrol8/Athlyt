import { Dumbbell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Section 5 — shown whenever GET /workouts/current 404s (no active plan).
 * A simple icon stands in for an "illustration" per the spec, since this
 * project has no illustration asset pipeline — adding one for a single
 * empty state would be over-engineering for a one-week build.
 */
export function EmptyWorkoutState({
  onGenerate,
  isGenerating,
}: {
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  return (
    <Card className="animate-scale-in">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted transition-transform duration-300 hover:scale-110 hover:rotate-6">
          <Dumbbell className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold">No active workout plan yet</p>
          <p className="text-sm text-muted-foreground">
            Generate a personalized plan based on your profile to get started.
          </p>
        </div>
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="transition-transform hover:scale-105 active:scale-95"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Generating…
            </span>
          ) : (
            "Generate Workout"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
