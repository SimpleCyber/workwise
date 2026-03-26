"use client";

import React, { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";
import {
  Shield,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  Users,
  Building2,
  FileText,
  FolderKanban,
  ListChecks,
  CalendarDays,
  ArrowLeft,
  Zap,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
  data_room_tools: Zap,
  attendance: CalendarDays,
  calendar: CalendarDays,
  projects: FolderKanban,
  todos: ListChecks,
  tree_planning: ToggleRight,
  data_room: FileText,
  messaging: Users,
};

export default function AdminPage() {
  const router = useRouter();
  const flags = useQuery(api.admin.getFeatureFlags);
  const stats = useQuery(api.admin.getAdminStats);
  const setFlag = useMutation(api.admin.setFeatureFlag);
  const seedFlags = useMutation(api.admin.seedFeatureFlags);

  // Auto-seed flags on first visit
  useEffect(() => {
    if (flags && flags.length === 0) {
      seedFlags()
        .then((r) => toast.success(`Seeded ${r.seeded} feature flags`))
        .catch(() => toast.error("Failed to seed flags"));
    }
  }, [flags, seedFlags]);

  const handleToggle = async (key: string, currentValue: boolean) => {
    try {
      await setFlag({ key, enabled: !currentValue });
      toast.success(
        `${key.replace(/_/g, " ")} ${!currentValue ? "enabled" : "disabled"}`,
      );
    } catch {
      toast.error("Failed to update flag");
    }
  };

  const statCards = stats
    ? [
        {
          label: "Workspaces",
          value: stats.workspaces,
          icon: Building2,
          color: "text-blue-500",
        },
        {
          label: "Members",
          value: stats.members,
          icon: Users,
          color: "text-emerald-500",
        },
        {
          label: "Files",
          value: stats.files,
          icon: FileText,
          color: "text-amber-500",
        },
        {
          label: "Projects",
          value: stats.projects,
          icon: FolderKanban,
          color: "text-purple-500",
        },
        {
          label: "Todo Boards",
          value: stats.todoBoards,
          icon: ListChecks,
          color: "text-rose-500",
        },
        {
          label: "Attendance",
          value: stats.attendanceRecords,
          icon: CalendarDays,
          color: "text-cyan-500",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Admin Panel</h1>
                <p className="text-[11px] text-muted-foreground leading-none">
                  Platform Management
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() =>
              seedFlags()
                .then((r) => toast.success(`Synced — ${r.total} flags total`))
                .catch(() => toast.error("Failed to sync"))
            }
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Flags
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Stats Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">Platform Overview</h2>
          </div>
          {stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="bg-card border rounded-xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={cn("w-5 h-5", stat.color)} />
                      <span className="text-2xl font-bold tabular-nums">
                        {stat.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card border rounded-xl p-4 h-[88px] animate-pulse"
                />
              ))}
            </div>
          )}
        </section>

        {/* Feature Flags Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ToggleLeft className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">Feature Flags</h2>
            <span className="text-xs text-muted-foreground ml-2">
              Toggle features on/off for all users
            </span>
          </div>
          {flags ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {flags.map((flag) => {
                const Icon = ICON_MAP[flag.key] || Zap;
                return (
                  <div
                    key={flag._id}
                    className={cn(
                      "bg-card border rounded-xl p-5 flex items-start gap-4 transition-all hover:shadow-md",
                      flag.enabled
                        ? "border-emerald-500/20 bg-emerald-500/[0.02]"
                        : "border-border opacity-60",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        flag.enabled
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{flag.label}</h3>
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                            flag.enabled
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {flag.enabled ? "ON" : "OFF"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {flag.description}
                      </p>
                      {flag.updatedBy && (
                        <p className="text-[10px] text-muted-foreground/60 mt-2">
                          Last changed:{" "}
                          {new Date(flag.updatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={() =>
                        handleToggle(flag.key, flag.enabled)
                      }
                      className="shrink-0 mt-1"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading feature flags...
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
