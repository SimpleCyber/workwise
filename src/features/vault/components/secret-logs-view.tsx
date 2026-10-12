"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  MessageSquare,
  PlusCircle,
  FileEdit,
  Trash2,
  Clock,
  Loader,
  ChevronDown,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { decryptSecretString } from "@/lib/crypto/vault-crypto";
import { format, formatDistanceToNow } from "date-fns";

interface SecretLogsViewProps {
  workspaceId: any;
  boardId?: any;
  projectKey: CryptoKey;
  filterKeyHash?: string;
  onCloseModal?: () => void;
}

export const SecretLogsView = ({
  workspaceId,
  boardId,
  projectKey,
  filterKeyHash,
  onCloseModal,
}: SecretLogsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [revealedIds, setRevealedIds] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null);
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, string>>({});

  const logs = useQuery(api.vault.getSecretLogs, {
    workspaceId,
    boardId: boardId || undefined,
    secretKeyHash: filterKeyHash || undefined,
  });

  const rollbackMutation = useMutation(api.vault.rollbackSecret);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Decrypt key names on the fly
  useEffect(() => {
    if (!logs || !projectKey) return;
    let isMounted = true;

    async function decryptAllKeys() {
      const results: Record<string, string> = {};
      for (const log of logs!) {
        if (!results[log._id]) {
          try {
            const keyName = await decryptSecretString(
              log.encryptedKey,
              log.keyIv,
              projectKey,
            );
            results[log._id] = keyName;
          } catch {
            results[log._id] = "[Encrypted Key]";
          }
        }
      }
      if (isMounted) {
        setDecryptedKeys(results);
      }
    }

    decryptAllKeys();
    return () => {
      isMounted = false;
    };
  }, [logs, projectKey]);

  // Reveal old secret value
  const handleToggleReveal = async (log: any) => {
    if (revealedIds[log._id]) {
      const next = { ...revealedIds };
      delete next[log._id];
      setRevealedIds(next);
      return;
    }

    try {
      const val = await decryptSecretString(
        log.encryptedValue,
        log.valueIv,
        projectKey,
      );
      setRevealedIds((prev) => ({ ...prev, [log._id]: val }));
    } catch {
      toast.error("Failed to decrypt secret value");
    }
  };

  // Copy old value to clipboard
  const handleCopyOldValue = async (log: any) => {
    try {
      let val = revealedIds[log._id];
      if (!val) {
        val = await decryptSecretString(
          log.encryptedValue,
          log.valueIv,
          projectKey,
        );
      }
      await navigator.clipboard.writeText(val);
      setCopiedId(log._id);
      toast.success("Secret value copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy secret value");
    }
  };

  // Rollback to this version
  const handleRollback = async (log: any) => {
    const keyName = decryptedKeys[log._id] || "secret";
    if (
      !confirm(
        `Restore "${keyName}" in [${log.environment}] to this previous version (v${log.version})?`,
      )
    ) {
      return;
    }

    try {
      setIsRestoringId(log._id);
      await rollbackMutation({ logId: log._id });
      toast.success(`Restored ${keyName} to version ${log.version}`);
      if (onCloseModal) onCloseModal();
    } catch (err: any) {
      toast.error(err.message || "Failed to restore secret");
    } finally {
      setIsRestoringId(null);
    }
  };

  // Filter logs by search query
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      if (!searchQuery) return true;
      const keyName = decryptedKeys[log._id] || "";
      return (
        keyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.environment.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [logs, searchQuery, decryptedKeys]);

  // Group logs that were made together (same user within 60 seconds)
  interface LogGroup {
    id: string;
    userId: string;
    userName?: string;
    userImage?: string;
    timestamp: number;
    logs: any[];
  }

  const groupedLogs = useMemo(() => {
    const groups: LogGroup[] = [];
    let currentGroup: LogGroup | null = null;

    for (const log of filteredLogs) {
      if (
        currentGroup &&
        currentGroup.userId === log.userId &&
        Math.abs(currentGroup.timestamp - log.timestamp) <= 60000
      ) {
        currentGroup.logs.push(log);
      } else {
        currentGroup = {
          id: log._id,
          userId: log.userId,
          userName: log.userName,
          userImage: log.userImage,
          timestamp: log.timestamp,
          logs: [log],
        };
        groups.push(currentGroup);
      }
    }
    return groups;
  }, [filteredLogs]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] py-0 px-1.5"
          >
            + Created
          </Badge>
        );
      case "update":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] py-0 px-1.5"
          >
            ~ Updated
          </Badge>
        );
      case "delete":
        return (
          <Badge
            variant="outline"
            className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px] py-0 px-1.5"
          >
            - Deleted
          </Badge>
        );
      case "rollback":
        return (
          <Badge
            variant="outline"
            className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[10px] py-0 px-1.5"
          >
            ↺ Restored
          </Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const renderLogCard = (log: any) => {
    const keyName = decryptedKeys[log._id] || "Decrypting...";
    const isRevealed = !!revealedIds[log._id];
    const revealedVal = revealedIds[log._id] || "";

    return (
      <div
        key={log._id}
        className="rounded-lg border border-border/60 bg-card/60 p-2.5 text-xs space-y-2"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-muted-foreground font-medium">Changes made:</span>
          {getActionBadge(log.action)}
          <span className="font-mono font-bold text-foreground bg-muted/60 px-1.5 py-0.5 rounded text-[11px]">
            {keyName}
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] py-0 px-1.5 font-mono capitalize text-muted-foreground"
          >
            {log.environment}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono ml-auto">
            (v{log.version})
          </span>
        </div>

        {/* Value Snapshot Box */}
        <div className="flex items-center justify-between gap-2 p-1.5 px-2 rounded-md bg-black/20 border border-white/5 font-mono text-[11px]">
          <div className="flex items-center gap-2 truncate">
            <span className="text-muted-foreground/70 shrink-0">Value:</span>
            <span className="truncate select-all text-foreground">
              {isRevealed ? revealedVal || "<empty>" : "••••••••••••••••••••"}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => handleToggleReveal(log)}
            >
              {isRevealed ? (
                <EyeOff className="size-3" />
              ) : (
                <Eye className="size-3" />
              )}
              {isRevealed ? "Hide" : "Reveal"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => handleCopyOldValue(log)}
            >
              {copiedId === log._id ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
              Copy
            </Button>

            {log.action !== "create" && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] gap-1 text-primary hover:text-primary font-medium"
                onClick={() => handleRollback(log)}
                disabled={isRestoringId === log._id}
              >
                {isRestoringId === log._id ? (
                  <Loader className="size-2.5 animate-spin" />
                ) : (
                  <RotateCcw className="size-2.5" />
                )}
                Restore
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (logs === undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Loader className="size-5 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground">Loading chat logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter logs by key or user name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 pl-9 text-xs bg-muted/20"
        />
      </div>

      {/* Chat Interface Feed */}
      {groupedLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/5">
          <MessageSquare className="size-6 text-muted-foreground/40 mb-1.5" />
          <p className="text-xs font-semibold text-foreground">
            No activity logs yet
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Edits, additions, and deletions will appear here like a chat thread.
          </p>
        </div>
      ) : (
        <div className="space-y-3 divide-y divide-border/30">
          {groupedLogs.map((group) => {
            const isMultiple = group.logs.length > 1;
            const isCollapsed = isMultiple ? (collapsedGroups[group.id] ?? true) : false;

            return (
              <div
                key={group.id}
                className="pt-3 first:pt-0 flex items-start gap-3 group"
              >
                {/* User Avatar */}
                <Avatar className="size-8 border mt-0.5 shrink-0">
                  <AvatarImage src={group.userImage} />
                  <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
                    {group.userName ? group.userName.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {/* User & Time header */}
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-semibold text-xs text-foreground">
                      {group.userName || "Team Member"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(group.timestamp), "h:mm a")} •{" "}
                      {formatDistanceToNow(new Date(group.timestamp), {
                        addSuffix: true,
                      })}
                    </span>

                    {isMultiple && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] py-0 px-2 font-medium bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 ml-auto"
                      >
                        <Layers className="size-2.5" />
                        {group.logs.length} changes together
                      </Badge>
                    )}
                  </div>

                  {/* If multiple changes and collapsed */}
                  {isMultiple && isCollapsed ? (
                    <div className="rounded-lg border border-border/70 bg-card/50 p-2.5 text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-muted-foreground font-medium block text-[11px]">
                            Changes made:
                          </span>
                          <span className="text-foreground font-semibold text-xs">
                            {group.logs.length} variables modified together
                          </span>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[11px] font-medium text-primary hover:text-primary gap-1 shrink-0"
                          onClick={() =>
                            setCollapsedGroups((prev) => ({
                              ...prev,
                              [group.id]: false,
                            }))
                          }
                        >
                          Expand ({group.logs.length})
                          <ChevronDown className="size-3.5" />
                        </Button>
                      </div>

                      {/* Few preview changes only */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {group.logs.slice(0, 3).map((log) => {
                          const keyName = decryptedKeys[log._id] || "Decrypting...";
                          return (
                            <div
                              key={log._id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 border border-border/40 text-[11px] font-mono"
                            >
                              {getActionBadge(log.action)}
                              <span className="font-bold text-foreground">{keyName}</span>
                              <span className="text-[9px] text-muted-foreground uppercase">
                                ({log.environment})
                              </span>
                            </div>
                          );
                        })}
                        {group.logs.length > 3 && (
                          <span className="text-[11px] text-muted-foreground font-medium pl-0.5">
                            +{group.logs.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : isMultiple ? (
                    /* Multiple changes, expanded state */
                    <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                      <div className="flex items-center justify-between pb-1 border-b border-primary/10">
                        <span className="text-xs font-semibold text-foreground">
                          Changes made ({group.logs.length} variables)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground gap-1"
                          onClick={() =>
                            setCollapsedGroups((prev) => ({
                              ...prev,
                              [group.id]: true,
                            }))
                          }
                        >
                          Collapse
                          <ChevronRight className="size-3.5 rotate-90" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {group.logs.map((log) => renderLogCard(log))}
                      </div>
                    </div>
                  ) : (
                    /* Single change */
                    renderLogCard(group.logs[0])
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
