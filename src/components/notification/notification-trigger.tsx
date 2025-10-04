"use client";

import { useAtom } from "jotai";
import { notificationOpenAtom } from "@/lib/panel-atoms";
import { useGetUnreadCount } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

export const NotificationTrigger = () => {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useAtom(notificationOpenAtom);
  const unreadCount = useGetUnreadCount();

  useEffect(() => {
    setMounted(true); // Only render after client mount
  }, []);

  if (!mounted) return null; // Prevent server/client mismatch

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
        <div className="relative">
          <Bell className="w-6 h-6 text-gray-700" />

          {/* Red bubble */}
          <span
            className="
              absolute
              -top-1
              -right-1
              bg-red-600
              text-white
              rounded-full
              h-5
              min-w-[1.25rem]
              px-1
              flex
              items-center
              justify-center
              text-[10px]
              font-semibold
              shadow
            "
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </div>
      </Button>
    </div>
  );
};
