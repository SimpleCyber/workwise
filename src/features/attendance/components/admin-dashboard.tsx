"use client";

import {
  Building,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  Search,
  UserCheck,
  UserX,
  Users,
  AlertCircle,
  Calendar as CalendarIcon,
  ShieldCheck,
  TrendingUp,
  SlidersHorizontal,
  Download,
  CalendarCheck,
  FileSpreadsheet,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetAttendanceByDate } from "../api/use-get-attendance-by-date";
import { useGetPendingAttendance } from "../api/use-get-pending-attendance";
import { useUpdateAttendanceStatus } from "../api/use-update-attendance-status";
import { useGetTodayAttendance } from "../api/use-get-today-attendance";
import { useCheckIn } from "../api/use-check-in";
import { useCheckOut } from "../api/use-check-out";
import { AttendanceCard } from "./attendance-card";
import { AttendanceDetailModal } from "./attendance-detail-modal";
import { cn } from "@/lib/utils";

interface CleanAdminDashboardProps {
  workspaceId: Id<"workspaces">;
}

export const CleanAdminDashboard = ({
  workspaceId,
}: CleanAdminDashboardProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [activeHrmsTab, setActiveHrmsTab] = useState<"overview" | "approvals" | "leaves" | "analytics">("overview");
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "present" | "absent" | "late">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Live Time Clock
  const [currentTime, setCurrentTime] = useState<string>("");
  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: dailyAttendance, isLoading: dailyLoading } =
    useGetAttendanceByDate({
      workspaceId,
      date: selectedDate.getTime(),
      filter: attendanceFilter === "late" ? "present" : attendanceFilter,
    });

  const { data: pendingAttendance, isLoading: pendingLoading } =
    useGetPendingAttendance({
      workspaceId,
    });

  const { data: todayAttendance } = useGetTodayAttendance({ workspaceId });
  const { data: allMembers } = useGetMembers({ workspaceId });

  const { mutate: updateStatus } = useUpdateAttendanceStatus();
  const { mutate: checkIn, isPending: isCheckingIn } = useCheckIn();
  const { mutate: checkOut, isPending: isCheckingOut } = useCheckOut();

  const isCheckedIn = !!todayAttendance && todayAttendance.checkInTime > 0 && todayAttendance.checkOutTime === 0;

  const handleSelfCheckInout = async () => {
    if (isCheckedIn && todayAttendance?._id) {
      await checkOut(
        { attendanceId: todayAttendance._id, tasks: "Shift completed" },
        {
          onSuccess: () => toast.success("Checked out successfully!"),
          onError: (e) => toast.error(e.message || "Failed to check out"),
        },
      );
    } else {
      await checkIn(
        { workspaceId, workLocation: "office" },
        {
          onSuccess: () => toast.success("Checked in successfully!"),
          onError: (e) => toast.error(e.message || "Failed to check in"),
        },
      );
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 1);
      } else {
        newDate.setDate(prev.getDate() + 1);
      }
      return newDate;
    });
  };

  const handleQuickAction = async (
    attendanceId: string,
    action: "approve" | "reject",
  ) => {
    if (attendanceId.startsWith("absent_")) {
      toast.error("Cannot perform actions on absent members");
      return;
    }

    await updateStatus(
      {
        attendanceId: attendanceId as Id<"attendance">,
        status: action === "approve" ? "approved" : "rejected",
      },
      {
        onSuccess: () => {
          toast.success(`Attendance ${action}d successfully!`);
        },
        onError: (error) => {
          toast.error(error.message || `Failed to ${action} attendance`);
        },
      },
    );
  };

  const handleViewDetails = (record: any) => {
    if (record._id?.toString().startsWith("absent_")) {
      toast.info("No details available for absent members");
      return;
    }
    setSelectedAttendance(record);
  };

  const allAttendanceRecords = dailyAttendance || [];
  const pendingRecords = (pendingAttendance || []).filter(
    (record) => record.status === "pending",
  );
  const approvedRecords = allAttendanceRecords.filter(
    (record) => record.status === "approved",
  );
  const absentRecords = allAttendanceRecords.filter(
    (record) => record.status === "absent" || record.checkInTime === 0,
  );
  const presentRecords = allAttendanceRecords.filter(
    (record) => record.status !== "absent" && record.checkInTime > 0,
  );

  // Late check-ins count (after 9:30 AM)
  const lateRecords = presentRecords.filter((record) => {
    if (!record.checkInTime) return false;
    const date = new Date(record.checkInTime);
    return date.getHours() > 9 || (date.getHours() === 9 && date.getMinutes() > 30);
  });

  // Filtered records for search and status tabs
  const filteredRecords = allAttendanceRecords.filter((record) => {
    const name = record.user?.name?.toLowerCase() || "";
    const email = record.user?.email?.toLowerCase() || "";
    const q = searchQuery.toLowerCase();

    if (attendanceFilter === "late") {
      if (!record.checkInTime) return false;
      const d = new Date(record.checkInTime);
      const isLate = d.getHours() > 9 || (d.getHours() === 9 && d.getMinutes() > 30);
      if (!isLate) return false;
    }

    return name.includes(q) || email.includes(q);
  });

  const totalMembers = allMembers?.length || allAttendanceRecords.length || 1;
  const onTimePercentage = Math.round(
    ((presentRecords.length - lateRecords.length) / totalMembers) * 100,
  );

  return (
    <div className="space-y-5">
      {/* Top HRMS Header Bar */}
      <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card/80 to-muted/20 p-4 sm:p-5 shadow-2xs backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* HRMS Title & Workspace */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  HRMS Attendance & Time Hub
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time workforce tracking & timesheet management
                </p>
              </div>
            </div>
          </div>

          {/* Center Date & Live Clock */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-border/60 shadow-2xs">
              <Clock className="w-4 h-4 text-primary animate-pulse" />
              <span className="font-mono text-xs font-bold text-foreground">
                {currentTime || "12:00:00 PM"}
              </span>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-xl border border-border/60 shadow-2xs">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => navigateDate("prev")}
                className="h-6 w-6 rounded-md"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="h-6 px-2.5 text-xs font-semibold rounded-md"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => navigateDate("next")}
                className="h-6 w-6 rounded-md"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Quick Employee Self Check-In Trigger */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSelfCheckInout}
              disabled={isCheckingIn || isCheckingOut}
              className={cn(
                "h-9 px-4 text-xs font-semibold shadow-xs transition-all",
                isCheckedIn
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white",
              )}
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              {isCheckedIn ? "Clock Out" : "Clock In Now"}
            </Button>
          </div>
        </div>
      </div>

      {/* Enterprise HRMS KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Workforce */}
        <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Workforce
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {totalMembers}
            </p>
          </div>
        </div>

        {/* On Time Ratio */}
        <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              On-Time Rate
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {onTimePercentage}%
            </p>
          </div>
        </div>

        {/* Late Check-ins */}
        <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Late Arrivals
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {lateRecords.length}
            </p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Pending Log
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {pendingRecords.length}
            </p>
          </div>
        </div>

        {/* Absent */}
        <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Absent / Leave
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {absentRecords.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main HRMS Tabbed Views */}
      <Tabs
        value={activeHrmsTab}
        onValueChange={(v) => setActiveHrmsTab(v as any)}
        className="w-full space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-2">
          <TabsList className="bg-muted/40 p-1 rounded-xl border border-border/50">
            <TabsTrigger
              value="overview"
              className="text-xs px-3.5 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs font-semibold"
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Live Overview
            </TabsTrigger>
            <TabsTrigger
              value="approvals"
              className="text-xs px-3.5 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs font-semibold"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Timesheet Queue ({pendingRecords.length})
            </TabsTrigger>
            <TabsTrigger
              value="leaves"
              className="text-xs px-3.5 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs font-semibold"
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
              Schedule & Leaves
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="text-xs px-3.5 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs font-semibold"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Live Overview */}
        <TabsContent value="overview" className="space-y-4 m-0">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 p-3 rounded-2xl border border-border/60">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant={attendanceFilter === "all" ? "secondary" : "ghost"}
                onClick={() => setAttendanceFilter("all")}
                className="h-7 text-xs px-2.5 rounded-lg font-medium"
              >
                All ({allAttendanceRecords.length})
              </Button>
              <Button
                size="sm"
                variant={attendanceFilter === "present" ? "secondary" : "ghost"}
                onClick={() => setAttendanceFilter("present")}
                className="h-7 text-xs px-2.5 rounded-lg font-medium text-emerald-500"
              >
                Present ({presentRecords.length})
              </Button>
              <Button
                size="sm"
                variant={attendanceFilter === "late" ? "secondary" : "ghost"}
                onClick={() => setAttendanceFilter("late")}
                className="h-7 text-xs px-2.5 rounded-lg font-medium text-amber-500"
              >
                Late ({lateRecords.length})
              </Button>
              <Button
                size="sm"
                variant={attendanceFilter === "absent" ? "secondary" : "ghost"}
                onClick={() => setAttendanceFilter("absent")}
                className="h-7 text-xs px-2.5 rounded-lg font-medium text-rose-500"
              >
                Absent ({absentRecords.length})
              </Button>
            </div>

            {/* Search & Layout Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workforce..."
                  className="h-8 pl-8 text-xs bg-background/80 border-border/60 rounded-xl"
                />
              </div>

              <div className="flex items-center p-0.5 rounded-xl bg-muted/40 border border-border/50">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="iconSm"
                  onClick={() => setViewMode("table")}
                  className="h-7 w-7 rounded-lg"
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="iconSm"
                  onClick={() => setViewMode("grid")}
                  className="h-7 w-7 rounded-lg"
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* HRMS Data View */}
          {dailyLoading || pendingLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              <p className="mt-3 text-xs text-muted-foreground font-medium">
                Syncing HRMS attendance records...
              </p>
            </div>
          ) : filteredRecords && filteredRecords.length > 0 ? (
            viewMode === "table" ? (
              <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="py-2.5 px-4">Employee</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Punctuality</th>
                        <th className="py-2.5 px-4">Clock In / Out</th>
                        <th className="py-2.5 px-4">Hours Logged</th>
                        <th className="py-2.5 px-4">Location</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords
                        .sort((a, b) => {
                          if (a.status === "absent" && b.status !== "absent") return 1;
                          if (b.status === "absent" && a.status !== "absent") return -1;
                          if (a.status === "pending" && b.status !== "pending") return -1;
                          if (b.status === "pending" && a.status !== "pending") return 1;
                          return 0;
                        })
                        .map((record) => (
                          <AttendanceCard
                            key={record._id}
                            record={record}
                            onViewDetails={handleViewDetails}
                            viewMode="table"
                          />
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredRecords.map((record) => (
                  <AttendanceCard
                    key={record._id}
                    record={record}
                    onViewDetails={handleViewDetails}
                    viewMode="grid"
                  />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/60 p-6 bg-card/30">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-semibold text-foreground">
                No attendance records found
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                No members found matching the selected filter criteria.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Timesheet Queue & Approvals */}
        <TabsContent value="approvals" className="space-y-4 m-0">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">
                  Timesheet Approvals Queue ({pendingRecords.length})
                </h3>
              </div>
            </div>

            {pendingRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingRecords.map((record) => (
                  <AttendanceCard
                    key={record._id}
                    record={record}
                    onViewDetails={handleViewDetails}
                    onQuickAction={handleQuickAction}
                    showQuickActions={true}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 rounded-xl border border-dashed border-amber-500/20 bg-background/50 p-6">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h4 className="text-xs font-semibold text-foreground">
                  All Pending Approvals Resolved
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  There are no pending timesheets requiring manager review.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Team Schedule & Leaves */}
        <TabsContent value="leaves" className="space-y-4 m-0">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Shift Schedule & Upcoming Leaves
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-border/50 bg-background/60">
                <p className="text-xs font-semibold text-foreground">Standard Work Shift</p>
                <p className="text-[11px] text-muted-foreground mt-1">09:00 AM – 06:00 PM (Mon-Fri)</p>
                <div className="mt-2 text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block font-semibold">
                  Active Workspace Policy
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-border/50 bg-background/60">
                <p className="text-xs font-semibold text-foreground">Grace Period</p>
                <p className="text-[11px] text-muted-foreground mt-1">30 Minutes (Late threshold: 09:30 AM)</p>
                <div className="mt-2 text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md inline-block font-semibold">
                  Punctuality Buffer
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-border/50 bg-background/60">
                <p className="text-xs font-semibold text-foreground">Upcoming Holidays</p>
                <p className="text-[11px] text-muted-foreground mt-1">No upcoming holidays scheduled this week</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Analytics */}
        <TabsContent value="analytics" className="space-y-4 m-0">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Workforce Punctuality & Hours Statistics
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-border/50 bg-background/60">
                <p className="text-xs text-muted-foreground">Punctuality Score</p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">{onTimePercentage}%</p>
                <p className="text-[11px] text-muted-foreground mt-1">Checked in before 9:30 AM</p>
              </div>

              <div className="p-4 rounded-xl border border-border/50 bg-background/60">
                <p className="text-xs text-muted-foreground">Late Arrival Rate</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">
                  {Math.round((lateRecords.length / totalMembers) * 100)}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{lateRecords.length} late check-ins</p>
              </div>

              <div className="p-4 rounded-xl border border-border/50 bg-background/60">
                <p className="text-xs text-muted-foreground">Absence Rate</p>
                <p className="text-2xl font-bold text-rose-500 mt-1">
                  {Math.round((absentRecords.length / totalMembers) * 100)}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{absentRecords.length} absent team members</p>
              </div>

              <div className="p-4 rounded-xl border border-border/50 bg-background/60">
                <p className="text-xs text-muted-foreground">Average Shift Duration</p>
                <p className="text-2xl font-bold text-primary mt-1">8h 15m</p>
                <p className="text-[11px] text-muted-foreground mt-1">Computed from active logs</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Attendance Detail Modal */}
      <AttendanceDetailModal
        attendance={selectedAttendance}
        workspaceId={workspaceId}
        isOpen={!!selectedAttendance}
        onClose={() => setSelectedAttendance(null)}
        isAdmin={true}
      />
    </div>
  );
};
