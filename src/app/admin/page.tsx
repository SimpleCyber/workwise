"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/../convex/_generated/api";
import AdminNotificationsPage from "./mail-view";
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
  MessageSquare,
  Settings,
  LayoutDashboard,
  Mail,
  Bell,
  NotebookTabs,
  PanelLeftOpen,
  PanelRightOpen,
  MousePointerClick,
  Network,
  MessagesSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
  header_notifications: Bell,
  header_calendar: CalendarDays,
  header_notes: NotebookTabs,
  tree_planning: ToggleRight,
  planning_left_column: PanelLeftOpen,
  planning_side_panel: PanelRightOpen,
  planning_side_panel_ai_chat: MessageSquare,
  planning_double_click_actions: MousePointerClick,
  projects: FolderKanban,
  project_tree_view: Network,
  todos: ListChecks,
  task_comments: MessageSquare,
  messaging: Users,
  chat_dms: MessagesSquare,
  chat_threads_reactions: Zap,
  chat_file_attachments: FileText,
  data_room: FileText,
  data_room_tools: Zap,
  attendance: CalendarDays,
  mail: Mail,
};

const FLAG_CATEGORIES = {
  header: {
    label: "Header & Global",
    keys: ["header_notifications", "header_calendar", "header_notes"],
  },
  planning: {
    label: "Planning Page",
    keys: [
      "tree_planning",
      "planning_left_column",
      "planning_side_panel",
      "planning_side_panel_ai_chat",
      "planning_double_click_actions",
    ],
  },
  projects: {
    label: "Project Section",
    keys: ["projects", "project_tree_view", "todos", "task_comments"],
  },
  chats: {
    label: "Chats Section",
    keys: [
      "messaging",
      "chat_dms",
      "chat_threads_reactions",
      "chat_file_attachments",
    ],
  },
  tools: {
    label: "Workspace Tools",
    keys: ["data_room", "data_room_tools", "attendance", "mail"],
  },
};

export default function AdminPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<
    "overview" | "flags" | "notifications" | "settings"
  >("overview");

  const flags = useQuery(api.admin.getFeatureFlags);
  const stats = useQuery(api.admin.getAdminStats);
  const setFlag = useMutation(api.admin.setFeatureFlag);
  const seedFlags = useMutation(api.admin.seedFeatureFlags);

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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col shrink-0">
        <div className="h-16 flex items-center px-4 border-b gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm">Admin Console</h1>
            <p className="text-[10px] text-muted-foreground">
              Platform Management
            </p>
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-2">
            Menu
          </div>
          <Button
            variant={activeView === "overview" ? "secondary" : "ghost"}
            className="w-full justify-start h-9 text-sm"
            onClick={() => setActiveView("overview")}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeView === "flags" ? "secondary" : "ghost"}
            className="w-full justify-start h-9 text-sm"
            onClick={() => setActiveView("flags")}
          >
            <ToggleLeft className="w-4 h-4 mr-2" />
            Feature Flags
          </Button>

          <Button
            variant={activeView === "notifications" ? "secondary" : "ghost"}
            className="w-full justify-start h-9 text-sm"
            onClick={() => setActiveView("notifications")}
          >
            <Mail className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button
            variant={activeView === "settings" ? "secondary" : "ghost"}
            className="w-full justify-start h-9 text-sm"
            onClick={() => setActiveView("settings")}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        <div className="mt-auto p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start text-xs h-9"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b bg-background flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
          <h2 className="text-lg font-semibold capitalize">
            {activeView.replace("_", " ")}
          </h2>
          {activeView === "flags" && (
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
          )}
        </header>

        {/* Dynamic Content */}
        <div className="p-6 max-w-5xl">
          {/* OVERVIEW */}
          {activeView === "overview" && (
            <section className="animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-base font-medium">Platform Usage Stats</h3>
              </div>
              {stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="bg-card border rounded-xl p-5 flex flex-col gap-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={cn("w-5 h-5", stat.color)} />
                          <span className="text-3xl font-bold tabular-nums">
                            {stat.value}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          {stat.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-card border rounded-xl p-5 h-[104px] animate-pulse"
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* FEATURE FLAGS */}
          {activeView === "flags" && (
            <section className="animate-in fade-in zoom-in-95 duration-200">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  Toggle platform features on or off for your entire workspace.
                  Changes take effect instantly.
                </p>
              </div>

              {flags ? (
                <Tabs defaultValue="header" className="w-full">
                  <TabsList className="mb-6 bg-muted/50 p-1 flex-wrap h-auto inline-flex">
                    {Object.entries(FLAG_CATEGORIES).map(([catKey, cat]) => (
                      <TabsTrigger
                        key={catKey}
                        value={catKey}
                        className="text-xs px-4 py-2"
                      >
                        {cat.label}
                      </TabsTrigger>
                    ))}
                    <TabsTrigger value="other" className="text-xs px-4 py-2">
                      Uncategorized
                    </TabsTrigger>
                  </TabsList>

                  {/* Render Tab Contents */}
                  {Object.entries(FLAG_CATEGORIES).map(([catKey, cat]) => {
                    const categoryFlags = flags.filter((f) =>
                      cat.keys.includes(f.key),
                    );
                    return (
                      <TabsContent
                        key={catKey}
                        value={catKey}
                        className="mt-0 outline-none"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {categoryFlags.length > 0 ? (
                            categoryFlags.map((flag) => {
                              const Icon = ICON_MAP[flag.key] || Zap;
                              return (
                                <div
                                  key={flag._id}
                                  className={cn(
                                    "bg-card border rounded-xl p-5 flex items-start gap-4 transition-all hover:shadow-md",
                                    flag.enabled
                                      ? "border-emerald-500/20 bg-emerald-500/[0.02]"
                                      : "border-border opacity-70",
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
                                      <h3 className="font-semibold text-sm">
                                        {flag.label}
                                      </h3>
                                      <span
                                        className={cn(
                                          "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm",
                                          flag.enabled
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : "bg-muted text-muted-foreground",
                                        )}
                                      >
                                        {flag.enabled ? "ON" : "OFF"}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                      {flag.description}
                                    </p>
                                  </div>
                                  <Switch
                                    checked={flag.enabled}
                                    onCheckedChange={() =>
                                      handleToggle(flag.key, flag.enabled)
                                    }
                                    className="shrink-0 mt-2"
                                  />
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground py-8">
                              No flags in this category.
                            </p>
                          )}
                        </div>
                      </TabsContent>
                    );
                  })}

                  <TabsContent value="other" className="mt-0 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {flags
                        .filter(
                          (f) =>
                            !Object.values(FLAG_CATEGORIES).some((cat) =>
                              cat.keys.includes(f.key),
                            ),
                        )
                        .map((flag) => {
                          const Icon = ICON_MAP[flag.key] || Zap;
                          return (
                            <div
                              key={flag._id}
                              className={cn(
                                "bg-card border rounded-xl p-5 flex items-start gap-4 transition-all hover:shadow-md",
                                flag.enabled
                                  ? "border-emerald-500/20 bg-emerald-500/[0.02]"
                                  : "border-border opacity-70",
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
                                  <h3 className="font-semibold text-sm">
                                    {flag.label}
                                  </h3>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                  {flag.description}
                                </p>
                              </div>
                              <Switch
                                checked={flag.enabled}
                                onCheckedChange={() =>
                                  handleToggle(flag.key, flag.enabled)
                                }
                                className="shrink-0 mt-2"
                              />
                            </div>
                          );
                        })}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  Loading feature configs...
                </div>
              )}
            </section>
          )}

          {/* SETTINGS */}
          {activeView === "settings" && (
            <section className="animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-card border rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                <Settings className="w-12 h-12 text-muted-foreground opacity-20" />
                <h3 className="font-semibold text-lg">System Settings</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Advanced platform configurations, billing, and system metrics
                  will appear here in a future update.
                </p>
              </div>
            </section>
          )}

          {/* NOTIFICATIONS / MAIL */}
          {activeView === "notifications" && (
            <section className="animate-in fade-in zoom-in-95 duration-200">
              <AdminNotificationsPage />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
