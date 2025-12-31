"use client"

import { Building, CheckCircle, ChevronLeft, ChevronRight, Clock, UserCheck, UserX, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { Id } from "@/../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGetMembers } from "@/features/members/api/use-get-members"
import { useGetAttendanceByDate } from "../api/use-get-attendance-by-date"
import { useGetPendingAttendance } from "../api/use-get-pending-attendance"
import { useUpdateAttendanceStatus } from "../api/use-update-attendance-status"
import { AttendanceCard } from "./attendance-card"
import { AttendanceDetailModal } from "./attendance-detail-modal"

interface CleanAdminDashboardProps {
  workspaceId: Id<"workspaces">
}

export const CleanAdminDashboard = ({ workspaceId }: CleanAdminDashboardProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null)
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "present" | "absent">("all")

  const { data: dailyAttendance, isLoading: dailyLoading } = useGetAttendanceByDate({
    workspaceId,
    date: selectedDate.getTime(),
    filter: attendanceFilter,
  })

  const { data: pendingAttendance, isLoading: pendingLoading } = useGetPendingAttendance({
    workspaceId,
  })

  const { data: allMembers } = useGetMembers({ workspaceId })

  const { mutate: updateStatus, isPending: isUpdating } = useUpdateAttendanceStatus()

  const navigateDate = (direction: "prev" | "next") => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 1)
      } else {
        newDate.setDate(prev.getDate() + 1)
      }
      return newDate
    })
  }

  const handleQuickAction = async (attendanceId: string, action: "approve" | "reject") => {
    // Don't allow actions on temporary absent records
    if (attendanceId.startsWith("absent_")) {
      toast.error("Cannot perform actions on absent members")
      return
    }

    await updateStatus(
      {
        attendanceId: attendanceId as Id<"attendance">,
        status: action === "approve" ? "approved" : "rejected",
      },
      {
        onSuccess: () => {
          toast.success(`Attendance ${action}d successfully!`)
        },
        onError: (error) => {
          toast.error(error.message || `Failed to ${action} attendance`)
        },
      },
    )
  }

  const handleViewDetails = (record: any) => {
    // Don't allow viewing details for temporary absent records
    if (record._id?.toString().startsWith("absent_")) {
      toast.info("No details available for absent members")
      return
    }
    setSelectedAttendance(record)
  }

  // Calculate stats from dailyAttendance (which now includes absent members)
  const allAttendanceRecords = dailyAttendance || []
  const pendingRecords = (pendingAttendance || []).filter((record) => record.status === "pending")
  const approvedRecords = allAttendanceRecords.filter((record) => record.status === "approved")
  const rejectedRecords = allAttendanceRecords.filter((record) => record.status === "rejected")
  const absentRecords = allAttendanceRecords.filter((record) => record.status === "absent" || record.checkInTime === 0)
  const presentRecords = allAttendanceRecords.filter((record) => record.status !== "absent" && record.checkInTime > 0)

  const StatCard = ({ icon: Icon, title, value, color = "default" }: any) => (
    <Card className="border-0 hover:shadow-sm shadow-md transition-all duration-200 bg-gradient-to-br from-card to-muted/50 dark:from-card dark:to-muted/10">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl shadow-sm ${
              color === "blue"
                ? "bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-700/50"
                : color === "green"
                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/50 dark:from-emerald-900/20 dark:to-emerald-800/20 dark:border-emerald-700/50"
                  : color === "yellow"
                    ? "bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/50 dark:from-amber-900/20 dark:to-amber-800/20 dark:border-amber-700/50"
                    : color === "red"
                      ? "bg-gradient-to-br from-red-50 to-red-100 border border-red-200/50 dark:from-red-900/20 dark:to-red-800/20 dark:border-red-700/50"
                      : "bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/50 dark:from-gray-800/20 dark:to-gray-700/20 dark:border-gray-600/50"
            }`}
          >
            <Icon
              className={`w-6 h-6 ${
                color === "blue"
                  ? "text-blue-600 dark:text-blue-400"
                  : color === "green"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : color === "yellow"
                      ? "text-amber-600 dark:text-amber-400"
                      : color === "red"
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-600 dark:text-gray-400"
              }`}
            />
          </div>
          <div className="flex-1">
            <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted-foreground font-medium">Manage team attendance and approvals</p>
          </div>
          <div className="flex items-center gap-3 bg-card rounded-xl p-2 shadow-sm border border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate("prev")}
              className="hover:bg-accent rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
              className="hover:bg-accent rounded-lg px-4 font-medium"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate("next")}
              className="hover:bg-accent rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard icon={Building} title="Total Employees" value={allMembers?.length || 0} />
          <StatCard icon={UserCheck} title="Present Today" value={presentRecords.length} color="blue" />
          <StatCard icon={CheckCircle} title="Approved" value={approvedRecords.length} color="green" />
          <StatCard icon={Clock} title="Pending" value={pendingRecords.length} color="yellow" />
          <StatCard icon={UserX} title="Absent" value={absentRecords.length} color="red" />
        </div>

        {/* Pending Approvals */}
        {pendingRecords.length > 0 && (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-l-4 border-l-amber-400">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-foreground">Pending Approvals</span>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {pendingRecords.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingRecords.map((record) => (
                  <AttendanceCard
                    key={record._id}
                    record={record}
                    onViewDetails={handleViewDetails}
                    onQuickAction={handleQuickAction}
                    showQuickActions={true}
                    compact={true}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Attendance */}
        <Card className="border-0 shadow-sm bg-card">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-foreground">All Team Members</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </CardTitle>
              <Tabs
                value={attendanceFilter}
                onValueChange={(value) => setAttendanceFilter(value as any)}
                className="bg-muted rounded-lg p-1"
              >
                <TabsList className="bg-transparent gap-1">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium"
                  >
                    All ({allAttendanceRecords.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="present"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium"
                  >
                    Present ({presentRecords.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="absent"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium"
                  >
                    Absent ({absentRecords.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {dailyLoading || pendingLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p className="mt-4 text-muted-foreground font-medium">Loading attendance data...</p>
              </div>
            ) : allAttendanceRecords && allAttendanceRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allAttendanceRecords
                  .sort((a, b) => {
                    // Sort: absent first, then pending, then others
                    if (a.status === "absent" && b.status !== "absent") return 1
                    if (b.status === "absent" && a.status !== "absent") return -1
                    if (a.status === "pending" && b.status !== "pending") return -1
                    if (b.status === "pending" && a.status !== "pending") return 1
                    return 0
                  })
                  .map((record) => (
                    <AttendanceCard key={record._id} record={record} onViewDetails={handleViewDetails} compact={true} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-muted rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No team members found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  No members in this workspace for the selected date. Try selecting a different date or check your
                  workspace settings.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Detail Modal */}
        <AttendanceDetailModal
          attendance={selectedAttendance}
          workspaceId={workspaceId}
          isOpen={!!selectedAttendance}
          onClose={() => setSelectedAttendance(null)}
          isAdmin={true}
        />
      </div>
    </div>
  )
}
