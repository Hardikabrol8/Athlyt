"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type {
  NutritionLogEntry,
  NutritionPlan,
  NutritionWeeklySummary,
  ProgressLog,
  ProgressSummary,
  WorkoutStatsSummary,
} from "@/types/user";

// ---------------------------------------------------------------------------
// Workout stats
// ---------------------------------------------------------------------------

export function useWorkoutStats() {
  return useQuery({
    queryKey: ["workouts", "stats", "summary"],
    queryFn: () => apiFetch<WorkoutStatsSummary>("/workouts/stats/summary"),
  });
}

export function useWorkoutHistory() {
  return useQuery({
    queryKey: ["workouts", "history"],
    queryFn: () => apiFetch<import("@/types/user").WorkoutSessionResponse[]>("/workouts/history"),
  });
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export function useProgressSummary() {
  return useQuery({
    queryKey: ["progress", "summary"],
    queryFn: () => apiFetch<ProgressSummary>("/progress/summary"),
  });
}

export function useProgressLogs(limit = 90) {
  return useQuery({
    queryKey: ["progress", "logs", limit],
    queryFn: () => apiFetch<ProgressLog[]>(`/progress/logs?limit=${limit}`),
  });
}

export function useLogProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      weight_kg?: number;
      body_fat_pct?: number;
      sleep_hours?: number;
      notes?: string;
    }) => apiFetch<ProgressLog>("/progress/logs", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Nutrition
// ---------------------------------------------------------------------------

export function useNutritionPlan() {
  return useQuery({
    queryKey: ["nutrition", "plan", "current"],
    queryFn: () =>
      apiFetch<NutritionPlan>("/nutrition/plans/current").catch(() => null) as Promise<NutritionPlan | null>,
    retry: false,
  });
}

export function useGenerateNutritionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<NutritionPlan>("/nutrition/plans/generate", { method: "POST" }),
    onSuccess: (plan) => {
      queryClient.setQueryData(["nutrition", "plan", "current"], plan);
    },
  });
}

export function useTodayNutritionLog() {
  return useQuery({
    queryKey: ["nutrition", "log", "today"],
    queryFn: () =>
      apiFetch<NutritionLogEntry>("/nutrition/logs/today").catch(() => null) as Promise<NutritionLogEntry | null>,
    retry: false,
  });
}

export function useNutritionLogs(limit = 30) {
  return useQuery({
    queryKey: ["nutrition", "logs", limit],
    queryFn: () => apiFetch<NutritionLogEntry[]>(`/nutrition/logs?limit=${limit}`),
  });
}

export function useNutritionWeeklySummary() {
  return useQuery({
    queryKey: ["nutrition", "summary", "weekly"],
    queryFn: () => apiFetch<NutritionWeeklySummary>("/nutrition/summary/weekly"),
  });
}

export function useLogNutrition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      calories_consumed: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      water_ml?: number;
      notes?: string;
    }) =>
      apiFetch<NutritionLogEntry>("/nutrition/logs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition"] });
    },
  });
}
