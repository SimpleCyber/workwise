"use client";

import { useAtom } from "jotai";
import { notificationOpenAtom } from "@/lib/panel-atoms";
import { useGetUnreadCount } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

export const NotificationTrigger = () => {
  const [open, setOpen] = useAtom(notificationOpenAtom);
  const { data: unreadCount } = useGetUnreadCount();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};
