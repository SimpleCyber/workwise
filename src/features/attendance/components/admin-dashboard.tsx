"use client"

import { useState } from "react"
import { Users, Clock, CheckCircle, ChevronLeft, ChevronRight, Building, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceCard } from "./attendance-card"
import { AttendanceDetailModal } from "./attendance-detail-modal"
import type { Id } from "@/../convex/_generated/dataModel"
import { useGetAttendanceByDate } from "../api/use-get-attendance-by-date"
import { useGetPendingAttendance } from "../api/use-get-pending-attendance"
import { useGetMembers } from "@/features/members/api/use-get-members"
import { useUpdateAttendanceStatus } from "../api/use-update-attendance-status"

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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              color === "blue"
                ? "bg-blue-50"
                : color === "green"
                  ? "bg-green-50"
                  : color === "yellow"
                    ? "bg-yellow-50"
                    : color === "red"
                      ? "bg-red-50"
                      : "bg-muted"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${
                color === "blue"
                  ? "text-blue-600"
                  : color === "green"
                    ? "text-green-600"
                    : color === "yellow"
                      ? "text-yellow-600"
                      : color === "red"
                        ? "text-red-600"
                        : "text-muted-foreground"
              }`}
            />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage team attendance and approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Building} title="Total Employees" value={allMembers?.length || 0} />
        <StatCard icon={UserCheck} title="Present Today" value={presentRecords.length} color="blue" />
        <StatCard icon={CheckCircle} title="Approved" value={approvedRecords.length} color="green" />
        <StatCard icon={Clock} title="Pending" value={pendingRecords.length} color="yellow" />
        <StatCard icon={UserX} title="Absent" value={absentRecords.length} color="red" />
      </div>

      {/* Pending Approvals */}
      {pendingRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Pending Approvals ({pendingRecords.length})
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Team Members - {selectedDate.toLocaleDateString()}
            </CardTitle>
            <Tabs value={attendanceFilter} onValueChange={(value) => setAttendanceFilter(value as any)}>
              <TabsList>
                <TabsTrigger value="all">All ({allAttendanceRecords.length})</TabsTrigger>
                <TabsTrigger value="present">Present ({presentRecords.length})</TabsTrigger>
                <TabsTrigger value="absent">Absent ({absentRecords.length})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {dailyLoading || pendingLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : allAttendanceRecords && allAttendanceRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No team members found</p>
              <p className="text-sm">No members in this workspace</p>
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
  )
}
