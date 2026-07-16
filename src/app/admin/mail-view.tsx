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
  Send,
  Loader2,
} from "lucide-react";
import {
  useGetAllNotifications,
  useGetNotificationStats,
  useMarkEmailAsSent,
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

const TYPE_COLORS: Record<string, string> = {
  attendance_approved: "bg-green-100 text-green-800 border-green-200",
  task_completed: "bg-green-100 text-green-800 border-green-200",
  attendance_rejected: "bg-red-100 text-red-800 border-red-200",
  task_on_hold: "bg-red-100 text-red-800 border-red-200",
  task_assigned: "bg-yellow-100 text-yellow-800 border-yellow-200",
  attendance_action_by_admin: "bg-yellow-100 text-yellow-800 border-yellow-200",
  document_shared: "bg-purple-100 text-purple-800 border-purple-200",
  document_uploaded: "bg-purple-100 text-purple-800 border-purple-200",
  default: "bg-blue-100 text-blue-800 border-blue-200",
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
  const [sendingEmails, setSendingEmails] = useState<Set<string>>(new Set());

  const notifications = useGetAllNotifications(
    limit,
    category,
    undefined,
    undefined,
    isReadFilter,
    emailSentFilter,
  );
  const stats = useGetNotificationStats();
  const markEmailAsSent = useMarkEmailAsSent();

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

  const getTypeColor = (type: string): string => {
    return TYPE_COLORS[type] || TYPE_COLORS.default;
  };

  const handleSendEmail = async (notification: any) => {
    if (!notification.user?.email) {
      return;
    }

    setSendingEmails((prev) => new Set(prev).add(notification._id));

    try {
      const response = await fetch("/api/send-notification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          userEmail: notification.user.email,
          userName: notification.user.name || notification.user.email,
          workspaceName: notification.workspace?.name || "Unknown Workspace",
          actionBy:
            notification.actionUser?.name || notification.actionUser?.email,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Mark email as sent in database
        await markEmailAsSent({ notificationId: notification._id });
      } else {
        throw new Error(result.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setSendingEmails((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notification._id);
        return newSet;
      });
    }
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
      notification.emailSent ? "Yes" : "No",
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
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Monitor platform notifications across your workspace. You can filter by category or <br className="hidden sm:block"/>
          status and optionally trigger emails manually for any pending events.
        </p>
        <Button onClick={exportToCSV} variant="outline" size="sm" className="h-8 gap-1.5 text-xs bg-card shrink-0 shadow-sm">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="bg-card border rounded-xl p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <Bell className="h-5 w-5 text-blue-500" />
              <span className="text-3xl font-bold tabular-nums">{stats.total}</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Total Actions</p>
          </div>
          <div className="bg-card border rounded-xl p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <Circle className="h-5 w-5 text-orange-500" />
              <span className="text-3xl font-bold tabular-nums">{stats.unread}</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Unread</p>
          </div>
          <div className="bg-card border rounded-xl p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <Mail className="h-5 w-5 text-emerald-500" />
              <span className="text-3xl font-bold tabular-nums">{stats.emailsSent}</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Emails Sent</p>
          </div>
          <div className="bg-card border rounded-xl p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-purple-500" />
              <span className="text-3xl font-bold tabular-nums">{stats.recentActivity}</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Recent (24h)</p>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm">Filter & Search</h3>
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
              <Label htmlFor="limit" className="text-xs text-muted-foreground mr-1">Results per page:</Label>
              <Select
                value={limit.toString()}
                onValueChange={(value) => setLimit(Number.parseInt(value))}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
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
            
            <p className="text-xs text-muted-foreground font-medium">
              {filteredNotifications.length} matched
            </p>
          </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
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
                  <TableHead>Actions</TableHead>
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
                          className={getTypeColor(notification.type)}
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
                          {notification.emailSent ? (
                            <MailOpen className="h-4 w-4 text-green-600" />
                          ) : (
                            <Mail className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {notification.emailSent ? "Sent" : "Not sent"}
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
                        <Button
                          size="sm"
                          variant={
                            notification.emailSent ? "outline" : "default"
                          }
                          onClick={() => handleSendEmail(notification)}
                          disabled={
                            notification.emailSent ||
                            sendingEmails.has(notification._id) ||
                            !notification.user?.email
                          }
                          className="flex items-center gap-2"
                        >
                          {sendingEmails.has(notification._id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          {notification.emailSent ? "Sent" : "Send Email"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
