"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bell,
  CheckCircle,
  Circle,
  Filter,
  Search,
  Mail,
  MailOpen,
  Activity,
  Download,
} from "lucide-react";
import {
  useGetAllNotifications,
  useGetNotificationStats,
  type NotificationCategory,
} from "@/hooks/use-notifications";

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  attendance_submitted: "Attendance Submitted",
  attendance_approved: "Attendance Approved",
  attendance_rejected: "Attendance Rejected",
  attendance_action_by_admin: "Admin Action",
  attendance_checkout: "Attendance Checkout",
  document_uploaded: "Document Uploaded",
  document_shared: "Document Shared",
  task_assigned: "Task Assigned",
  task_status_changed: "Task Status Changed",
  task_completed: "Task Completed",
  task_on_hold: "Task On Hold",
  task_comment_added: "Comment Added",
};

const CATEGORY_COLORS: Record<string, string> = {
  attendance: "bg-blue-100 text-blue-800",
  task: "bg-green-100 text-green-800",
  document: "bg-purple-100 text-purple-800",
  default: "bg-gray-100 text-gray-800",
};

export default function AdminNotificationsPage() {
  const [category, setCategory] = useState<NotificationCategory>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(100);
  const [isReadFilter, setIsReadFilter] = useState<boolean | undefined>(
    undefined,
  );
  const [emailSentFilter, setEmailSentFilter] = useState<boolean | undefined>(
    undefined,
  );

  const notifications = useGetAllNotifications(
    limit,
    category,
    undefined,
    undefined,
    isReadFilter,
    emailSentFilter,
  );
  const stats = useGetNotificationStats();

  const isLoading = notifications === undefined;

  const filteredNotifications =
    notifications?.filter(
      (notification) =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.workspace?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        notification.user?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        notification.user?.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
    ) || [];

  const getNotificationCategory = (type: string): string => {
    if (type.includes("attendance")) return "attendance";
    if (type.includes("task")) return "task";
    if (type.includes("document")) return "document";
    return "default";
  };

  const exportToCSV = () => {
    if (!filteredNotifications.length) return;

    const headers = [
      "ID",
      "User",
      "User Email",
      "Workspace",
      "Type",
      "Title",
      "Message",
      "Status",
      "Email Sent",
      "Action By",
      "Created At",
      "Related ID",
    ];

    const csvData = filteredNotifications.map((notification) => [
      notification._id,
      notification.user?.name || "Unknown",
      notification.user?.email || "Unknown",
      notification.workspace?.name || "Unknown",
      notification.type,
      `"${notification.title}"`,
      `"${notification.message}"`,
      notification.isRead ? "Read" : "Unread",
      notification.sendedmail ? "Yes" : "No",
      notification.actionUser?.name ||
        notification.actionUser?.email ||
        "System",
      format(new Date(notification.createdAt), "yyyy-MM-dd HH:mm:ss"),
      notification.relatedId || "",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `notifications-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Admin - All Notifications
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor all system notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Notifications
              </CardTitle>
              <Bell className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Circle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unread}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Mail className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.emailsSent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Activity (24h)
              </CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentActivity}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications, users, workspaces..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(value: NotificationCategory) =>
                  setCategory(value)
                }
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="dataroom">Data Room</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Read Status</Label>
              <Select
                value={
                  isReadFilter === undefined
                    ? "all"
                    : isReadFilter
                      ? "read"
                      : "unread"
                }
                onValueChange={(value) =>
                  setIsReadFilter(
                    value === "all" ? undefined : value === "read",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Read Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="read">Read Only</SelectItem>
                  <SelectItem value="unread">Unread Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Email Status</Label>
              <Select
                value={
                  emailSentFilter === undefined
                    ? "all"
                    : emailSentFilter
                      ? "sent"
                      : "not-sent"
                }
                onValueChange={(value) =>
                  setEmailSentFilter(
                    value === "all" ? undefined : value === "sent",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Email Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sent">Email Sent</SelectItem>
                  <SelectItem value="not-sent">Email Not Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="limit">Results per page:</Label>
              <Select
                value={limit.toString()}
                onValueChange={(value) => setLimit(Number.parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>All System Notifications</CardTitle>
          <CardDescription>
            {filteredNotifications.length} notification
            {filteredNotifications.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Action By</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Related ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No notifications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotifications.map((notification) => (
                    <TableRow
                      key={notification._id}
                      className={!notification.isRead ? "bg-blue-50/50" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {notification.isRead ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-blue-600" />
                          )}
                          {notification.hasBeenProcessed && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700"
                            >
                              Processed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {notification.user?.name || "Unknown User"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {notification.user?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {notification.workspace?.name || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            CATEGORY_COLORS[
                              getNotificationCategory(notification.type)
                            ]
                          }
                        >
                          {NOTIFICATION_TYPE_LABELS[notification.type] ||
                            notification.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <div
                          className="truncate font-medium"
                          title={notification.title}
                        >
                          {notification.title}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-64">
                        <div
                          className="truncate text-sm text-muted-foreground"
                          title={notification.message}
                        >
                          {notification.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {notification.actionUser?.name ||
                            notification.actionUser?.email ||
                            "System"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {notification.sendedmail ? (
                            <MailOpen className="h-4 w-4 text-green-600" />
                          ) : (
                            <Mail className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {notification.sendedmail ? "Sent" : "Not sent"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(
                            new Date(notification.createdAt),
                            "MMM dd, yyyy",
                          )}
                          <div className="text-xs">
                            {format(new Date(notification.createdAt), "HH:mm")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground font-mono">
                          {notification.relatedId || "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
