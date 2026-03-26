"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle, Clock, Mail } from "lucide-react";
import {
  useGetNotifications,
  useGetUnreadCount,
} from "@/hooks/use-notifications";

export function NotificationsStats() {
  const notifications = useGetNotifications(100, "all");
  const unreadCount = useGetUnreadCount("all");

  const totalNotifications = notifications?.length || 0;
  const emailsSent = notifications?.filter((n) => n.emailSent).length || 0;
  const processedNotifications =
    notifications?.filter((n) => n.hasBeenProcessed).length || 0;

  const stats = [
    {
      title: "Total Notifications",
      value: totalNotifications,
      icon: Bell,
      color: "text-blue-600",
    },
    {
      title: "Unread",
      value: unreadCount || 0,
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Emails Sent",
      value: emailsSent,
      icon: Mail,
      color: "text-green-600",
    },
    {
      title: "Processed",
      value: processedNotifications,
      icon: CheckCircle,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
