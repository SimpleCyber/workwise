"use client";

import {
  CheckCircle,
  Clock,
  Home,
  MapPin,
  UserX,
  XCircle,
  Building2,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Eye,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AttendanceCardProps {
  record: any;
  onViewDetails: (record: any) => void;
  onQuickAction?: (id: string, action: "approve" | "reject") => void;
  showQuickActions?: boolean;
  viewMode?: "grid" | "table";
}

export const AttendanceCard = ({
  record,
  onViewDetails,
  onQuickAction,
  showQuickActions = false,
  viewMode = "table",
}: AttendanceCardProps) => {
  const isAbsent = record.status === "absent" || record.checkInTime === 0;
  const isPending = record.status === "pending";
  const isApproved = record.status === "approved";
  const isRejected = record.status === "rejected";

  const formatTime = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return "--:--";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Compute total duration in hours & minutes
  const getDuration = () => {
    if (!record.checkInTime || record.checkInTime === 0) return "0h 0m";
    const end = record.checkOutTime || Date.now();
    const diffMs = end - record.checkInTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  // Determine punctuality (Late if checked in after 9:30 AM)
  const isLate = () => {
    if (!record.checkInTime || record.checkInTime === 0) return false;
    const date = new Date(record.checkInTime);
    const hours = date.getHours();
    const mins = date.getMinutes();
    return hours > 9 || (hours === 9 && mins > 30);
  };

  const getStatusBadge = () => {
    if (isAbsent)
      return (
        <Badge
          variant="secondary"
          className="text-[11px] h-5 px-2 font-medium bg-muted/60 text-muted-foreground border border-border/40"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 mr-1.5" />
          Absent
        </Badge>
      );
    if (isPending)
      return (
        <Badge
          variant="outline"
          className="text-[11px] h-5 px-2 font-semibold border-amber-500/30 text-amber-500 bg-amber-500/10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5" />
          Pending
        </Badge>
      );
    if (isApproved)
      return (
        <Badge
          variant="outline"
          className="text-[11px] h-5 px-2 font-semibold border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          Present
        </Badge>
      );
    if (isRejected)
      return (
        <Badge
          variant="outline"
          className="text-[11px] h-5 px-2 font-semibold border-rose-500/30 text-rose-500 bg-rose-500/10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
          Rejected
        </Badge>
      );
    return null;
  };

  // Enterprise HRMS Table Row Layout
  if (viewMode === "table") {
    return (
      <tr
        onClick={() => onViewDetails(record)}
        className="group hover:bg-muted/40 transition-colors border-b border-border/40 cursor-pointer text-xs"
      >
        {/* Employee Name & Role */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 border border-border/60 shrink-0">
              <AvatarImage src={record.user?.image || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {record.user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {record.user?.name || "Team Member"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {record.user?.email}
              </p>
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="py-3 px-4">{getStatusBadge()}</td>

        {/* Punctuality */}
        <td className="py-3 px-4">
          {isAbsent ? (
            <span className="text-muted-foreground/60 text-[11px]">—</span>
          ) : isLate() ? (
            <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 border-amber-500/30 text-amber-500 bg-amber-500/10 font-medium">
              <AlertCircle className="w-3 h-3 mr-1" />
              Late Arrival
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-medium">
              On Time
            </Badge>
          )}
        </td>

        {/* Check In / Out */}
        <td className="py-3 px-4 font-mono font-medium text-foreground">
          {isAbsent ? (
            <span className="text-muted-foreground/60 text-[11px] font-sans">Not checked in</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-emerald-500">{formatTime(record.checkInTime)}</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="text-muted-foreground">{formatTime(record.checkOutTime)}</span>
            </div>
          )}
        </td>

        {/* Duration */}
        <td className="py-3 px-4 font-mono text-muted-foreground">
          {isAbsent ? "0h 0m" : getDuration()}
        </td>

        {/* Location */}
        <td className="py-3 px-4">
          {record.workLocation ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md border border-border/40">
              {record.workLocation === "home" ? (
                <Home className="w-3 h-3 text-indigo-400" />
              ) : (
                <Building2 className="w-3 h-3 text-blue-400" />
              )}
              {record.workLocation === "home" ? "WFH" : "Office"}
            </span>
          ) : (
            <span className="text-muted-foreground/50 text-[11px]">—</span>
          )}
        </td>

        {/* Actions */}
        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
          {showQuickActions && isPending && onQuickAction ? (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                onClick={() => onQuickAction(record._id, "approve")}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                onClick={() => onQuickAction(record._id, "reject")}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Reject
              </Button>
            </div>
          ) : (
            <Button
              size="iconSm"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onViewDetails(record)}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
          )}
        </td>
      </tr>
    );
  }

  // HRMS Grid Card Layout
  return (
    <div
      onClick={() => onViewDetails(record)}
      className="group relative rounded-2xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40 transition-all duration-200 p-4 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Avatar className="w-9 h-9 border border-border/60">
              <AvatarImage src={record.user?.image || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {record.user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                {record.user?.name || "Team Member"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {record.user?.email}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {isAbsent ? (
          <div className="flex items-center justify-center py-3 px-3 rounded-xl bg-muted/20 border border-dashed border-border/50 text-muted-foreground text-xs gap-2">
            <UserX className="w-4 h-4 opacity-70" />
            <span className="font-medium text-[11px]">Absent for today</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col p-2 rounded-xl bg-muted/30 border border-border/40">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Check In</span>
                <span className="font-semibold text-foreground text-xs font-mono mt-0.5">
                  {formatTime(record.checkInTime)}
                </span>
              </div>
              <div className="flex flex-col p-2 rounded-xl bg-muted/30 border border-border/40">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Hours Logged</span>
                <span className="font-semibold text-foreground text-xs font-mono mt-0.5">
                  {getDuration()}
                </span>
              </div>
            </div>

            {record.workLocation && (
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-muted/20 border border-border/30 text-[11px] text-muted-foreground">
                <span>Location</span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  {record.workLocation === "home" ? (
                    <Home className="w-3 h-3 text-indigo-400" />
                  ) : (
                    <Building2 className="w-3 h-3 text-blue-400" />
                  )}
                  {record.workLocation === "home" ? "WFH" : "Office"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {showQuickActions && isPending && onQuickAction && (
        <div className="flex gap-2 pt-2.5 mt-2.5 border-t border-border/40">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-7 text-xs font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction(record._id, "approve");
            }}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-7 text-xs font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction(record._id, "reject");
            }}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
};
