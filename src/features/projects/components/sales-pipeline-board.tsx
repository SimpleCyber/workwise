"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  UserPlus,
  Trash2,
  ArrowRight,
  Copy,
  Pencil,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  UserMinus,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { Hint } from "@/components/hint";
import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import { LeadDetailDrawer } from "./lead-detail-drawer";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

interface SalesPipelineBoardProps {
  boardId: Id<"projectBoards">;
  workspaceId: Id<"workspaces">;
}

export function SalesPipelineBoard({
  boardId,
  workspaceId,
}: SalesPipelineBoardProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<Id<"salesLeads"> | null>(
    null,
  );
  const { data: currentMember } = useCurrentMember({ workspaceId });

  const leads = useQuery(api.sales.getLeads, { boardId });
  const mutateAddLead = useMutation(api.sales.addLead);
  const mutateAssignLead = useMutation(api.sales.assignLead);
  const mutateUnassignLead = useMutation(api.sales.unassignLead);
  const mutateDiscard = useMutation(api.sales.discardLead);
  const mutateUpdateLead = useMutation(api.sales.updateLead);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast.success("Phone number copied to clipboard");
  };

  const handleAssignToSelf = async (leadId: Id<"salesLeads">) => {
    if (!currentMember) return;
    try {
      await mutateAssignLead({ leadId, memberId: currentMember._id });
      toast.success("Assigned to you!");
    } catch (e) {
      toast.error("Failed to assign lead");
    }
  };

  const handleUnassignLead = async (leadId: Id<"salesLeads">) => {
    try {
      await mutateUnassignLead({ leadId });
      toast.success("Lead unassigned");
    } catch (e) {
      toast.error("Failed to unassign lead");
    }
  };

  const handleDiscard = async (leadId: Id<"salesLeads">) => {
    try {
      await mutateDiscard({ leadId });
      toast.error("Lead marked as discarded");
    } catch (e) {
      toast.error("Failed to discard lead");
    }
  };

  const updateLead = async (leadId: Id<"salesLeads">, data: any) => {
    try {
      await mutateUpdateLead({ leadId, ...data });
    } catch (e) {
      toast.error("Failed to update lead");
    }
  };

  const handleAddLead = async () => {
    try {
      await mutateAddLead({
        boardId,
        workspaceId,
        name: "New Lead",
        phone: "+91 ",
        email: "",
        description: "",
      });
      toast.success("New lead added!");
    } catch (e) {
      toast.error("Failed to create lead");
    }
  };

  if (leads === undefined) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background p-6 overflow-auto gap-4">
      {/* Dashboard Table */}
      {/* Note: table-fixed is important for strict cell sizing */}
      <div className="w-full h-fit bg-card border rounded-lg shadow-sm">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">Status</TableHead>
              <TableHead className="w-[180px]">Lead Name</TableHead>
              <TableHead className="w-[180px]">Phone Number</TableHead>
              <TableHead className="w-[200px]">Email ID</TableHead>
              <TableHead className="w-[300px]">Description</TableHead>
              <TableHead className="text-right w-[160px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <LeadRow
                key={lead._id}
                lead={lead}
                onCopyPhone={handleCopyPhone}
                onAssignToSelf={handleAssignToSelf}
                onUnassign={handleUnassignLead}
                onDiscard={handleDiscard}
                onUpdateLead={updateLead}
                onOpenDrawer={(id: Id<"salesLeads">) => setSelectedLeadId(id)}
              />
            ))}
            {leads.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  No leads found. Click the + button to add one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <LeadDetailDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  );
}

function LeadRow({
  lead,
  onCopyPhone,
  onAssignToSelf,
  onUnassign,
  onDiscard,
  onUpdateLead,
  onOpenDrawer,
}: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [draftName, setDraftName] = useState(lead.name || "");
  const [draftPhone, setDraftPhone] = useState(lead.phone || "");
  const [draftEmail, setDraftEmail] = useState(lead.email || "");
  const [draftDescription, setDraftDescription] = useState(
    lead.description || "",
  );

  const toggleExpand = () => !isEditing && setIsExpanded(!isExpanded);

  const handleEditClick = () => {
    if (isEditing) {
      // Save
      onUpdateLead(lead._id, {
        name: draftName,
        phone: draftPhone,
        email: draftEmail,
        description: draftDescription,
      });
      setIsEditing(false);
    } else {
      // Start edit mode
      setDraftName(lead.name || "");
      setDraftPhone(lead.phone || "");
      setDraftEmail(lead.email || "");
      setDraftDescription(lead.description || "");
      setIsEditing(true);
      setIsExpanded(true);
    }
  };

  const getCountryCode = (phone: string) => {
    try {
      const phoneNumber = parsePhoneNumberFromString(phone || "");
      if (phoneNumber && phoneNumber.country) {
        return phoneNumber.country.toLowerCase();
      }
    } catch (e) {
      // ignore parsing errors
    }
    // Default to India if we can't parse or no number
    return "in";
  };

  const countryCode = getCountryCode(lead.phone);

  const renderDescription = (text: string) => {
    if (!text)
      return (
        <span className="text-muted-foreground italic">No description...</span>
      );
    return text.split(URL_REGEX).map((part, i) =>
      URL_REGEX.test(part) ? (
        <a
          key={i}
          href={part.startsWith("http") ? part : `https://${part}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 hover:underline inline-flex"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  return (
    <TableRow className="hover:bg-muted/30 transition-colors">
      <TableCell className="w-[80px] text-center align-top pt-4">
        {(() => {
          let icon = <Sparkles className="size-4 text-blue-500" />;
          let label = "New";

          if (lead.stage === "retry") {
            icon = <Clock className="size-4 text-amber-500" />;
            label = "Retry";
          } else if (lead.stage === "scheduled") {
            icon = <Calendar className="size-4 text-blue-500" />;
            label = "Scheduled";
          } else if (lead.stage === "won") {
            icon = <CheckCircle2 className="size-4 text-emerald-500" />;
            label = "Won";
          } else if (lead.stage === "rejected" || lead.stage === "lost") {
            icon = <XCircle className="size-4 text-red-500" />;
            label = "Rejected";
          } else if (lead.stage === "contacted") {
            icon = <Check className="size-4 text-muted-foreground" />;
            label = "Contacted";
          }

          return (
            <Hint label={label}>
              <div className="mx-auto size-8 rounded-full flex items-center justify-center bg-muted/50 transition-colors cursor-help">
                {icon}
              </div>
            </Hint>
          );
        })()}
      </TableCell>

      <TableCell className="w-[180px] font-medium text-sm align-top pt-4">
        {isEditing ? (
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="h-8 text-xs px-2 shadow-sm focus-visible:ring-1 focus-visible:ring-primary w-full"
            placeholder="Name..."
          />
        ) : (
          <div className="truncate mt-1">{lead.name}</div>
        )}
      </TableCell>

      <TableCell className="w-[180px] align-top pt-4">
        {isEditing ? (
          <Input
            value={draftPhone}
            onChange={(e) => setDraftPhone(e.target.value)}
            className="h-8 text-xs px-2 shadow-sm focus-visible:ring-1 focus-visible:ring-primary w-full"
            placeholder="Phone number..."
          />
        ) : (
          <div className="flex items-center gap-2 group mt-1">
            <img
              src={`https://flagcdn.com/w20/${countryCode}.png`}
              alt={countryCode}
              className="w-[18px] h-auto object-contain rounded-[2px]"
            />
            <span className="text-sm font-medium select-all truncate">
              {lead.phone}
            </span>
            <Hint label="Copy Number">
              <Button
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={() => onCopyPhone(lead.phone)}
              >
                <Copy className="size-3 text-muted-foreground" />
              </Button>
            </Hint>
          </div>
        )}
      </TableCell>

      <TableCell className="w-[200px] text-sm text-muted-foreground align-top pt-4">
        {isEditing ? (
          <Input
            value={draftEmail}
            onChange={(e) => setDraftEmail(e.target.value)}
            className="h-8 text-xs px-2 shadow-sm focus-visible:ring-1 focus-visible:ring-primary w-full"
            placeholder="Email address..."
          />
        ) : (
          <div className="truncate select-all mt-1">{lead.email || "-"}</div>
        )}
      </TableCell>

      {/* Strict fixed width container for description so it respects sizing constraints completely */}
      <TableCell className="w-[300px] align-top pt-4">
        <div className="w-[280px]">
          {isEditing ? (
            <div className="space-y-2 w-full">
              <Textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                className="min-h-[60px] text-xs resize-none focus-visible:ring-1 focus-visible:ring-primary bg-background shadow-sm p-3 w-full"
                placeholder="Add notes or links..."
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleEditClick}
                  className="h-7 text-xs px-3 shadow-none"
                >
                  <Check className="size-3 mr-1" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="flex items-start gap-2 group/desc cursor-pointer select-text p-1.5 -ml-1.5 rounded-md hover:bg-muted/40 transition-colors w-full"
              onClick={toggleExpand}
            >
              <div
                className={`text-xs leading-relaxed flex-1 overflow-hidden break-words ${isExpanded ? "whitespace-pre-wrap" : "line-clamp-1 truncate"}`}
              >
                {renderDescription(lead.description)}
              </div>
              {lead.description && lead.description.length > 40 && (
                <div className="opacity-0 group-hover/desc:opacity-100 text-muted-foreground flex-shrink-0 pt-0.5">
                  {isExpanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="w-[160px] text-right align-top pt-3">
        <div className="flex items-center justify-end gap-1">
          <Hint label={isEditing ? "Save" : "Edit"}>
            <Button
              variant={isEditing ? "default" : "ghost"}
              size="icon"
              className={`size-8 transition-colors flex-shrink-0 ${isEditing ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-primary"}`}
              onClick={handleEditClick}
            >
              {isEditing ? (
                <Check className="size-4" />
              ) : (
                <Pencil className="size-4" />
              )}
            </Button>
          </Hint>

          {lead.assignmentStatus === "unassigned" ? (
            <Hint label="Assign to yourself">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-blue-600 transition-colors flex-shrink-0"
                onClick={() => onAssignToSelf(lead._id)}
              >
                <UserPlus className="size-4" />
              </Button>
            </Hint>
          ) : (
            <Hint
              label={`Assigned to ${lead.assignedUser?.name || "User"} - Click to unassign`}
            >
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full flex-shrink-0 relative group p-0 overflow-hidden"
                onClick={() => onUnassign(lead._id)}
              >
                <Avatar className="size-8">
                  <AvatarImage src={lead.assignedUser?.avatar} />
                  <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                    {lead.assignedUser?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <UserMinus className="size-4 text-white" />
                </div>
              </Button>
            </Hint>
          )}

          <Hint label="Discard lead">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-red-600 transition-colors flex-shrink-0"
              onClick={() => onDiscard(lead._id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </Hint>

          <Hint label="Work with lead">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-primary bg-primary/5 hover:bg-primary/20 transition-colors ml-1 shadow-sm flex-shrink-0"
              onClick={() => onOpenDrawer(lead._id)}
            >
              <ArrowRight className="size-4" />
            </Button>
          </Hint>
        </div>
      </TableCell>
    </TableRow>
  );
}
