"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  ACTIVITY_LEVEL_OPTIONS,
  DIET_PREFERENCE_OPTIONS,
  EQUIPMENT_OPTIONS,
  FITNESS_GOAL_OPTIONS,
  WORKOUT_EXPERIENCE_OPTIONS,
} from "@/lib/profile-options";

function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  // A logged-in user who hasn't onboarded yet has nothing to show here.
  useEffect(() => {
    if (user && !user.profile) {
      router.replace("/onboarding");
    }
  }, [user, router]);

  if (isLoading || !user?.profile || !user.metrics) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  const { profile, metrics } = user;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {profile.name}</h1>
        <p className="text-muted-foreground">Here&apos;s where things stand today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>BMI</CardDescription>
            <CardTitle className="text-3xl">{metrics.bmi}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="capitalize">
              {metrics.bmi_category}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Daily calorie estimate</CardDescription>
            <CardTitle className="text-3xl">{metrics.daily_calories}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">kcal / day to maintain weight</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Current weight</CardDescription>
            <CardTitle className="text-3xl">{profile.weight_kg} kg</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{profile.height_cm} cm tall</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>
            This is what your workout and diet plans will be built from, once those features
            ship.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Fitness goal</p>
            <p className="font-medium">{labelFor(FITNESS_GOAL_OPTIONS, profile.fitness_goal)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Activity level</p>
            <p className="font-medium">{labelFor(ACTIVITY_LEVEL_OPTIONS, profile.activity_level)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Workout experience</p>
            <p className="font-medium">
              {labelFor(WORKOUT_EXPERIENCE_OPTIONS, profile.workout_experience)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Diet preference</p>
            <p className="font-medium">{labelFor(DIET_PREFERENCE_OPTIONS, profile.diet_preference)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm text-muted-foreground">Equipment available</p>
            <div className="flex flex-wrap gap-2">
              {profile.equipment_available.map((item) => (
                <Badge key={item} variant="outline">
                  {labelFor(EQUIPMENT_OPTIONS, item)}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
