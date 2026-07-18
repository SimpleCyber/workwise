"use client";

import {
  CheckCircle,
  MapPin,
  MessageSquare,
  UserX,
  XCircle,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AttendanceCardProps {
  record: any;
  onViewDetails: (record: any) => void;
  onQuickAction?: (id: string, action: "approve" | "reject") => void;
  showQuickActions?: boolean;
  compact?: boolean;
}

export const AttendanceCard = ({
  record,
  onViewDetails,
  onQuickAction,
  showQuickActions = false,
  compact = false,
}: AttendanceCardProps) => {
  const isAbsent = record.status === "absent" || record.checkInTime === 0;
  const isPending = record.status === "pending";
  const isApproved = record.status === "approved";
  const isRejected = record.status === "rejected";

  const formatTime = (timestamp: number) => {
    if (timestamp === 0) return "Absent";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = () => {
    if (isAbsent) return "text-gray-500";
    if (isPending) return "text-yellow-500";
    if (isApproved) return "text-green-500";
    if (isRejected) return "text-red-500";
    return "text-gray-500";
  };

  const getStatusBadge = () => {
    if (isAbsent)
      return (
        <Badge variant="secondary" className="text-xs">
          Absent
        </Badge>
      );
    if (isPending)
      return (
        <Badge
          variant="outline"
          className="text-xs border-yellow-500/50 text-yellow-500 bg-yellow-500/10"
        >
          Pending
        </Badge>
      );
    if (isApproved)
      return (
        <Badge
          variant="outline"
          className="text-xs border-green-500/50 text-green-500 bg-green-500/10"
        >
          Approved
        </Badge>
      );
    if (isRejected)
      return (
        <Badge
          variant="outline"
          className="text-xs border-red-500/50 text-red-500 bg-red-500/10"
        >
          Rejected
        </Badge>
      );
    return null;
  };

  return (
    <Card
      className={`group hover:shadow-md transition-all duration-200 cursor-pointer ${compact ? "h-auto" : ""}`}
    >
      <CardContent className={`${compact ? "p-4" : "p-6"}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className={compact ? "w-8 h-8 shrink-0" : "w-10 h-10 shrink-0"}>
              <AvatarImage src={record.user?.image || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {record.user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className={`font-medium truncate ${compact ? "text-sm" : "text-base"}`} title={record.user?.name}>
                {record.user?.name}
              </p>
              {!compact && (
                <p className="text-xs text-muted-foreground truncate" title={record.user?.email}>
                  {record.user?.email}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {getStatusBadge()}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2" onClick={() => onViewDetails(record)}>
          {isAbsent ? (
            <div className="flex items-center justify-center py-4 text-center">
              <div>
                <UserX className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </div>
          ) : (
            <>
              {/* Check In */}
              <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor().replace("text-", "bg-")}`}
                  />
                  <span className={`truncate ${compact ? "text-xs font-medium" : "text-sm"}`}>
                    In: {formatTime(record.checkInTime)}
                  </span>
                </div>
                {!compact && record.workLocation && (
                  <div className="flex items-center gap-1 shrink-0">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {record.workLocation === "home" ? "WFH" : "Office"}
                    </span>
                  </div>
                )}
              </div>

              {/* Check Out */}
              <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${record.checkOutTime ? getStatusColor().replace("text-", "bg-") : "bg-muted"}`}
                  />
                  <span className={`truncate ${compact ? "text-xs font-medium" : "text-sm"}`}>
                    Out:{" "}
                    {record.checkOutTime
                      ? formatTime(record.checkOutTime)
                      : "Not checked out"}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Quick Actions for Pending */}
          {showQuickActions && isPending && onQuickAction && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction(record._id, "approve");
                }}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction(record._id, "reject");
                }}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!compact && (
          <div className="mt-3 pt-2 border-t border-muted/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{new Date(record.date).toLocaleDateString()}</span>
              {record.checkOutTime && record.checkInTime > 0 && (
                <span>
                  {Math.floor(
                    (record.checkOutTime - record.checkInTime) /
                      (1000 * 60 * 60),
                  )}
                  h{" "}
                  {Math.floor(
                    ((record.checkOutTime - record.checkInTime) %
                      (1000 * 60 * 60)) /
                      (1000 * 60),
                  )}
                  m
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
