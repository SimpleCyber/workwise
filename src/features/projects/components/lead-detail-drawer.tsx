"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import {
  PhoneMissed,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface LeadDetailDrawerProps {
  leadId: Id<"salesLeads"> | null;
  onClose: () => void;
}

export function LeadDetailDrawer({ leadId, onClose }: LeadDetailDrawerProps) {
  const lead = useQuery(api.sales.getLead, leadId ? { leadId } : "skip");
  const callLogs = useQuery(
    api.sales.getCallLogs,
    leadId ? { leadId } : "skip",
  );
  const logCall = useMutation(api.sales.logCall);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedDisposition, setSelectedDisposition] = useState<any>(null);
  const [nextActionDate, setNextActionDate] = useState("");

  if (!lead) return null;

  const handleLogCall = async (disposition: string) => {
    // If it requires a date and we haven't selected one, just open the date picker state
    if (
      (disposition === "retry_scheduled" ||
        disposition === "meeting_scheduled") &&
      !selectedDisposition
    ) {
      setSelectedDisposition(disposition);
      return;
    }

    try {
      setIsLoading(true);
      await logCall({
        leadId: lead._id,
        disposition: disposition as any,
        nextActionAt: nextActionDate
          ? new Date(nextActionDate).getTime()
          : undefined,
      });

      if (disposition === "won") {
        toast.success("Lead marked as Won! Conversion flow triggered.");
        // TODO: trigger actual conversion flow dialog here
      } else {
        toast.success("Call logged successfully");
      }

      setSelectedDisposition(null);
      setNextActionDate("");
    } catch (e) {
      toast.error("Failed to log call");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSelection = () => {
    setSelectedDisposition(null);
    setNextActionDate("");
  };

  return (
    <Sheet open={!!leadId} onOpenChange={() => onClose()}>
      <SheetContent className="w-[450px] sm:w-[540px] sm:max-w-[100vw] flex flex-col p-6 bg-background">
        {/* Header */}
        <SheetHeader className="mb-6 flex flex-row items-start justify-between border-b pb-4 space-y-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-muted">
              <AvatarFallback className="font-semibold text-muted-foreground bg-muted">
                {lead?.name?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-lg leading-tight">
                {lead?.name || "Unknown Lead"}
              </SheetTitle>
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <span>{lead.phone}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded capitalize">
              {lead.stage || "New"}
            </div>
          </div>
        </SheetHeader>

        {/* Log this call Box */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Log this call
          </h3>

          {!selectedDisposition ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Button
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 h-10 w-full justify-center px-1"
                onClick={() => handleLogCall("rejected")}
                disabled={isLoading}
              >
                <XCircle className="size-3.5 mr-1" />
                <span className="text-[11px] font-semibold">Rejected</span>
              </Button>
              <Button
                variant="outline"
                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 h-10 w-full justify-center px-1"
                onClick={() => handleLogCall("retry_scheduled")}
                disabled={isLoading}
              >
                <Clock className="size-3.5 mr-1" />
                <span className="text-[11px] font-semibold">Retry later</span>
              </Button>
              <Button
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 h-10 w-full justify-center px-1"
                onClick={() => handleLogCall("meeting_scheduled")}
                disabled={isLoading}
              >
                <Calendar className="size-3.5 mr-1" />
                <span className="text-[11px] font-semibold">Scheduled</span>
              </Button>
              <Button
                variant="outline"
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 h-10 w-full justify-center px-1"
                onClick={() => handleLogCall("won")}
                disabled={isLoading}
              >
                <CheckCircle2 className="size-3.5 mr-1" />
                <span className="text-[11px] font-semibold">Won</span>
              </Button>
              <Button
                variant="outline"
                className="col-span-2 lg:col-span-4 bg-muted/50 hover:bg-muted text-muted-foreground h-8 mt-1 border-dashed"
                onClick={() => handleLogCall("no_answer")}
                disabled={isLoading}
              >
                <PhoneMissed className="size-3.5 mr-2" />
                <span className="text-xs">No answer</span>
              </Button>
            </div>
          ) : (
            <div className="bg-muted/30 p-3 rounded-lg border border-border animate-in fade-in zoom-in-95">
              <p className="text-xs font-semibold mb-2">
                Select{" "}
                {selectedDisposition === "meeting_scheduled"
                  ? "meeting"
                  : "retry"}{" "}
                date & time:
              </p>
              <Input
                type="datetime-local"
                className="mb-3 h-9 text-xs"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelSelection}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleLogCall(selectedDisposition)}
                  disabled={!nextActionDate || isLoading}
                  className="h-8 text-xs"
                >
                  Save Log
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto pr-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Call history
          </h3>

          <div className="relative border-l border-border ml-1.5 space-y-6 pb-4">
            {callLogs?.length === 0 && (
              <div className="pl-6 text-sm text-muted-foreground py-2">
                No history yet.
              </div>
            )}

            {callLogs?.map((log: any) => {
              let dotColor = "bg-gray-300";
              let title = "Logged Call";

              switch (log.disposition) {
                case "rejected":
                case "lost":
                  dotColor = "bg-red-500";
                  title = "Rejected";
                  break;
                case "retry_scheduled":
                  dotColor = "bg-amber-500";
                  title = "Retry scheduled";
                  break;
                case "meeting_scheduled":
                  dotColor = "bg-blue-500";
                  title = "Meeting scheduled";
                  break;
                case "won":
                  dotColor = "bg-emerald-500";
                  title = "Won";
                  break;
                case "no_answer":
                  dotColor = "bg-gray-400";
                  title = "No answer";
                  break;
              }

              return (
                <div key={log._id} className="relative pl-6">
                  <div
                    className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-background ${dotColor}`}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{title}</span>
                      <span className="text-sm text-muted-foreground">
                        · {log.agentName}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(log.timestamp), "MMM d, h:mm a")}
                      {log.nextActionAt && (
                        <span>
                          {" "}
                          — Next action:{" "}
                          {format(new Date(log.nextActionAt), "MMM d, h:mm a")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
