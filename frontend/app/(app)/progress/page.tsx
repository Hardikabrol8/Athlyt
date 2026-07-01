"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Activity, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { DashboardStatCard } from "@/components/shared/dashboard-stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { TiltCard } from "@/components/shared/tilt-card";
import { PrimaryButton } from "@/components/shared/primary-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";

function useProgressSummary() {
  return useQuery({
    queryKey: ["progress", "summary"],
    queryFn: () => apiFetch<any>("/progress/summary"),
  });
}

function useProgressLogs() {
  return useQuery({
    queryKey: ["progress", "logs"],
    queryFn: () => apiFetch<any[]>("/progress/logs"),
  });
}

const container: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

export default function ProgressPage() {
  const queryClient = useQueryClient();
  const { data: summary, isLoading: summaryLoading } = useProgressSummary();
  const { data: logs, isLoading: logsLoading } = useProgressLogs();

  const [weight, setWeight] = useState("");
  const [sleep, setSleep] = useState("");
  const [bodyFat, setBodyFat] = useState("");

  const logMutation = useMutation({
    mutationFn: (body: any) => apiFetch("/progress/logs", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Progress logged!");
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      setWeight(""); setSleep(""); setBodyFat("");
    },
    onError: () => toast.error("Failed to log progress."),
  });

  function handleLog() {
    const body: any = {};
    if (weight) body.weight_kg = parseFloat(weight);
    if (sleep) body.sleep_hours = parseFloat(sleep);
    if (bodyFat) body.body_fat_pct = parseFloat(bodyFat);
    if (!Object.keys(body).length) return toast.error("Enter at least one value.");
    logMutation.mutate(body);
  }

  const chartData = logs
    ?.filter((l: any) => l.weight_kg != null)
    .slice(0, 30)
    .reverse()
    .map((l: any) => ({ date: l.log_date.slice(5), weight: l.weight_kg })) ?? [];

  const weightChange = summary?.weight_change_30d_kg;

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={item}>
        <SectionHeader title="Progress" description="Track your weight, measurements and sleep" />
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <TiltCard><DashboardStatCard icon={Scale} label="Current weight" value={summary?.current_weight_kg ? `${summary.current_weight_kg} kg` : "—"} /></TiltCard>
            <TiltCard><DashboardStatCard icon={Activity} label="Body fat" value={summary?.current_body_fat_pct ? `${summary.current_body_fat_pct}%` : "—"} /></TiltCard>
            <TiltCard>
              <DashboardStatCard
                icon={weightChange != null && weightChange < 0 ? TrendingDown : TrendingUp}
                label="30d change"
                value={weightChange != null ? `${weightChange > 0 ? "+" : ""}${weightChange} kg` : "—"}
              />
            </TiltCard>
            <TiltCard><DashboardStatCard icon={Activity} label="Sleep (last)" value={summary?.last_sleep_hours ? `${summary.last_sleep_hours}h` : "—"} /></TiltCard>
          </>
        )}
      </motion.div>

      {/* Weight chart */}
      <motion.div variants={item}>
        <SectionHeader title="Weight trend" />
        <Card>
          <CardContent className="pt-4">
            {logsLoading ? (
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : chartData.length < 2 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Log at least 2 weight entries to see your trend.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8 }}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Log progress form */}
      <motion.div variants={item}>
        <SectionHeader title="Log today's stats" />
        <Card>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Weight (kg)</Label>
                <Input type="number" placeholder="e.g. 80.5" value={weight} onChange={e => setWeight(e.target.value)} step="0.1" />
              </div>
              <div className="space-y-1.5">
                <Label>Body fat (%)</Label>
                <Input type="number" placeholder="e.g. 18.0" value={bodyFat} onChange={e => setBodyFat(e.target.value)} step="0.1" />
              </div>
              <div className="space-y-1.5">
                <Label>Sleep (hours)</Label>
                <Input type="number" placeholder="e.g. 7.5" value={sleep} onChange={e => setSleep(e.target.value)} step="0.5" />
              </div>
            </div>
            <PrimaryButton onClick={handleLog} disabled={logMutation.isPending} className="w-full sm:w-auto">
              {logMutation.isPending ? "Saving…" : "Log progress"}
            </PrimaryButton>
          </CardContent>
        </Card>
      </motion.div>

      {/* History table */}
      <motion.div variants={item}>
        <SectionHeader title="Recent logs" />
        {logsLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : !logs?.length ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No progress logs yet. Log your first entry above!</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">Weight</th>
                      <th className="pb-2 pr-4 font-medium">Body fat</th>
                      <th className="pb-2 font-medium">Sleep</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 15).map((l: any) => (
                      <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-4">{l.log_date}</td>
                        <td className="py-2 pr-4">{l.weight_kg != null ? `${l.weight_kg} kg` : "—"}</td>
                        <td className="py-2 pr-4">{l.body_fat_pct != null ? `${l.body_fat_pct}%` : "—"}</td>
                        <td className="py-2">{l.sleep_hours != null ? `${l.sleep_hours}h` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
