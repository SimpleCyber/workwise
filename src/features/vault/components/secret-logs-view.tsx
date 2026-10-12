"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Loader,
  GitCommit,
  GitBranch,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter,
  Trash2,
  PlusCircle,
  FileEdit,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { decryptSecretString } from "@/lib/crypto/vault-crypto";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

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
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [envFilter, setEnvFilter] = useState<string>("all");
  const [revealedIds, setRevealedIds] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>(
    {},
  );
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, string>>(
    {},
  );

  // Multi-select for restore
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [isBulkRestoring, setIsBulkRestoring] = useState(false);
  const [bulkRestoreCommitMessage, setBulkRestoreCommitMessage] = useState("");
  const [isSingleRestoring, setIsSingleRestoring] = useState(false);
  const [singleRestoreTarget, setSingleRestoreTarget] = useState<any>(null);
  const [singleRestoreCommitMessage, setSingleRestoreCommitMessage] =
    useState("");
  const [isExecutingRestore, setIsExecutingRestore] = useState(false);

  const logs = useQuery(api.vault.getSecretLogs, {
    workspaceId,
    boardId: boardId || undefined,
    secretKeyHash: filterKeyHash || undefined,
  });

  const rollbackMutation = useMutation(api.vault.rollbackSecret);
  const rollbackBatchMutation = useMutation(api.vault.rollbackBatchSecrets);

  // Decrypt variable names on the fly
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

  // Copy old value
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

  // Copy commit hash
  const handleCopyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast.success(`Copied commit SHA (${hash})`);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Toggle log diff expand
  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Multi-selection handlers
  const handleToggleSelectLog = (logId: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(logId)
        ? prev.filter((id) => id !== logId)
        : [...prev, logId],
    );
  };

  // Open single restore modal
  const handleOpenSingleRestore = (log: any) => {
    setSingleRestoreTarget(log);
    const keyName = decryptedKeys[log._id] || "variable";
    setSingleRestoreCommitMessage(
      `revert: restore ${keyName} to v${log.version}`,
    );
    setIsSingleRestoring(true);
  };

  // Execute single restore
  const handleConfirmSingleRestore = async () => {
    if (!singleRestoreTarget) return;
    if (!singleRestoreCommitMessage.trim()) {
      toast.error("Please enter a commit message for this restore");
      return;
    }

    try {
      setIsExecutingRestore(true);
      await rollbackMutation({
        logId: singleRestoreTarget._id,
        commitMessage: singleRestoreCommitMessage.trim(),
      });
      const keyName = decryptedKeys[singleRestoreTarget._id] || "variable";
      toast.success(
        `Restored "${keyName}" to version ${singleRestoreTarget.version}`,
      );
      setIsSingleRestoring(false);
      setSingleRestoreTarget(null);
      if (onCloseModal) onCloseModal();
    } catch (err: any) {
      toast.error(err.message || "Failed to restore variable");
    } finally {
      setIsExecutingRestore(false);
    }
  };

  // Open bulk restore modal
  const handleOpenBulkRestore = () => {
    setBulkRestoreCommitMessage(
      `revert: batch restore ${selectedLogIds.length} variables to previous versions`,
    );
    setIsBulkRestoring(true);
  };

  // Execute bulk restore
  const handleConfirmBulkRestore = async () => {
    if (selectedLogIds.length === 0) return;
    if (!bulkRestoreCommitMessage.trim()) {
      toast.error("Please enter a commit message for this batch restore");
      return;
    }

    try {
      setIsExecutingRestore(true);
      const res = await rollbackBatchMutation({
        logIds: selectedLogIds as any,
        commitMessage: bulkRestoreCommitMessage.trim(),
      });
      toast.success(`Successfully restored ${res.restoredCount} variables`);
      setSelectedLogIds([]);
      setIsBulkRestoring(false);
      if (onCloseModal) onCloseModal();
    } catch (err: any) {
      toast.error(err.message || "Failed to batch restore variables");
    } finally {
      setIsExecutingRestore(false);
    }
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      // Action filter
      if (actionFilter === "deleted" && log.action !== "delete") return false;
      if (actionFilter === "created" && log.action !== "create") return false;
      if (actionFilter === "updated" && log.action !== "update") return false;
      if (
        actionFilter === "restored" &&
        log.action !== "rollback" &&
        log.action !== "restore"
      )
        return false;

      // Environment filter
      if (envFilter !== "all" && log.environment !== envFilter) return false;

      // Search query filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const keyName = decryptedKeys[log._id]?.toLowerCase() || "";
      const userName = log.userName?.toLowerCase() || "";
      const commitMsg = log.commitMessage?.toLowerCase() || "";
      const hash = (log.commitHash || log._id.slice(-7)).toLowerCase();

      return (
        keyName.includes(q) ||
        userName.includes(q) ||
        commitMsg.includes(q) ||
        hash.includes(q) ||
        log.environment.toLowerCase().includes(q)
      );
    });
  }, [logs, actionFilter, envFilter, searchQuery, decryptedKeys]);

  // Unique environments in the logs
  const availableEnvironments = useMemo(() => {
    if (!logs) return [];
    return Array.from(new Set(logs.map((l) => l.environment)));
  }, [logs]);

  // Group logs by Date (like GitHub: "Commits on Oct 12, 2026")
  interface DateGroup {
    dateLabel: string;
    logs: any[];
  }

  const dateGroupedLogs = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const log of filteredLogs) {
      const d = new Date(log.timestamp);
      let dateKey: string;
      if (isToday(d)) {
        dateKey = "Commits today";
      } else if (isYesterday(d)) {
        dateKey = "Commits yesterday";
      } else {
        dateKey = `Commits on ${format(d, "MMM d, yyyy")}`;
      }

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(log);
    }

    const groups: DateGroup[] = [];
    map.forEach((groupLogs, dateLabel) => {
      groups.push({ dateLabel, logs: groupLogs });
    });
    return groups;
  }, [filteredLogs]);

  // Restorable logs currently filtered
  const restorableFilteredLogs = useMemo(() => {
    return filteredLogs.filter(
      (l) =>
        l.action === "delete" ||
        l.action === "update" ||
        l.action === "rollback",
    );
  }, [filteredLogs]);

  const handleSelectAllRestorable = () => {
    if (selectedLogIds.length === restorableFilteredLogs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(restorableFilteredLogs.map((l) => l._id));
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] py-0 px-1.5 font-medium"
          >
            + created
          </Badge>
        );
      case "update":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] py-0 px-1.5 font-medium"
          >
            ~ updated
          </Badge>
        );
      case "delete":
        return (
          <Badge
            variant="outline"
            className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px] py-0 px-1.5 font-medium"
          >
            - deleted
          </Badge>
        );
      case "rollback":
      case "restore":
        return (
          <Badge
            variant="outline"
            className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[10px] py-0 px-1.5 font-medium"
          >
            ↺ restored
          </Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getActionNodeColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
      case "update":
        return "bg-blue-500/15 text-blue-500 border-blue-500/30";
      case "delete":
        return "bg-rose-500/15 text-rose-500 border-rose-500/30";
      case "rollback":
      case "restore":
        return "bg-purple-500/15 text-purple-500 border-purple-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (logs === undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Loader className="size-6 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground font-mono">
          Loading Git-style commit log tree...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* GitHub-style Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl border bg-card/60">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search commits by message, variable, author, or SHA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-9 text-xs bg-background"
          />
        </div>

        {/* Right: Environment & Action Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Action Filter Pills */}
          <div className="flex rounded-md border bg-muted/30 p-0.5 text-xs">
            <button
              onClick={() => setActionFilter("all")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                actionFilter === "all"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setActionFilter("deleted")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                actionFilter === "deleted"
                  ? "bg-background text-rose-500 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Deleted
            </button>
            <button
              onClick={() => setActionFilter("updated")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                actionFilter === "updated"
                  ? "bg-background text-blue-500 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Updated
            </button>
            <button
              onClick={() => setActionFilter("created")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                actionFilter === "created"
                  ? "bg-background text-emerald-500 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Created
            </button>
          </div>

          {/* Environment dropdown/select */}
          {availableEnvironments.length > 1 && (
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="h-8 text-xs font-mono rounded-md border bg-background px-2.5 text-muted-foreground focus:outline-hidden"
            >
              <option value="all">All Branches / Envs</option>
              {availableEnvironments.map((env) => (
                <option key={env} value={env}>
                  env: {env}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Bulk Restore Floating / Top Bar */}
      {selectedLogIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 animate-in fade-in slide-in-from-top-1 duration-150 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Badge className="bg-purple-600 text-white font-mono text-xs px-2">
              {selectedLogIds.length}
            </Badge>
            <div>
              <span className="text-xs font-semibold text-foreground block">
                variable{selectedLogIds.length > 1 ? "s" : ""} selected for
                restore
              </span>
              <span className="text-[11px] text-muted-foreground">
                Will be revived and decrypted to active environment keys
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLogIds([])}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Deselect All
            </Button>
            <Button
              size="sm"
              onClick={handleOpenBulkRestore}
              className="h-8 text-xs gap-1.5 font-semibold bg-purple-600 hover:bg-purple-700 text-white"
            >
              <RotateCcw className="size-3.5" /> Restore Selected (
              {selectedLogIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Select All Restorable Header (if deleted or restorable filter is active) */}
      {restorableFilteredLogs.length > 0 && (
        <div className="flex items-center justify-between px-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={
                selectedLogIds.length > 0 &&
                selectedLogIds.length === restorableFilteredLogs.length
              }
              onCheckedChange={handleSelectAllRestorable}
              className="size-3.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
            />
            <span
              className="cursor-pointer select-none text-[11px] font-medium hover:text-foreground"
              onClick={handleSelectAllRestorable}
            >
              Select all restorable variables ({restorableFilteredLogs.length})
            </span>
          </div>

          <span className="text-[11px] font-mono">
            {filteredLogs.length} commit{filteredLogs.length !== 1 ? "s" : ""}{" "}
            recorded
          </span>
        </div>
      )}

      {/* GitHub Commit Timeline */}
      {dateGroupedLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-12 text-center bg-muted/5">
          <GitCommit className="size-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold text-foreground">
            No matching commits found
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Try adjusting your search query or filter tags.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dateGroupedLogs.map((group) => (
            <div key={group.dateLabel} className="space-y-2">
              {/* GitHub Date Header */}
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-2">
                <GitCommit className="size-3.5 text-muted-foreground/70" />
                <span>{group.dateLabel}</span>
              </div>

              {/* Commit Items in this Date */}
              <div className="rounded-xl border border-border/80 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
                {group.logs.map((log) => {
                  const keyName = decryptedKeys[log._id] || "Decrypting...";
                  const shortHash = log.commitHash || log._id.slice(-7);
                  const isRevealed = !!revealedIds[log._id];
                  const revealedVal = revealedIds[log._id] || "";
                  const isExpanded = !!expandedLogIds[log._id];
                  const isRestorable =
                    log.action === "delete" ||
                    log.action === "update" ||
                    log.action === "rollback";
                  const isSelected = selectedLogIds.includes(log._id);

                  // Default commit message if none entered in legacy records
                  const displayCommitMessage =
                    log.commitMessage ||
                    (log.action === "create"
                      ? `Add ${keyName} to ${log.environment}`
                      : log.action === "delete"
                        ? `Remove ${keyName} from ${log.environment}`
                        : log.action === "update"
                          ? `Update ${keyName} in ${log.environment}`
                          : `Restore ${keyName} to v${log.version}`);

                  return (
                    <div
                      key={log._id}
                      className={`p-3.5 transition-colors hover:bg-muted/20 ${
                        isSelected ? "bg-purple-500/[0.04]" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Left: Checkbox (for restore) + Avatar + Commit Info */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {isRestorable && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                handleToggleSelectLog(log._id)
                              }
                              className="mt-1 size-3.5 shrink-0 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                              title="Select to restore"
                            />
                          )}

                          <Avatar className="size-7 border shrink-0 mt-0.5">
                            <AvatarImage src={log.userImage} />
                            <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                              {log.userName
                                ? log.userName.charAt(0).toUpperCase()
                                : "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1 space-y-1">
                            {/* Commit Message Heading */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="font-semibold text-xs text-foreground hover:underline cursor-pointer tracking-tight"
                                onClick={() => toggleExpand(log._id)}
                              >
                                {displayCommitMessage}
                              </span>
                              {getActionBadge(log.action)}
                            </div>

                            {/* Author & Timestamp & Target Environment */}
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                              <span className="font-medium text-foreground">
                                {log.userName || "Team Member"}
                              </span>
                              <span>
                                committed{" "}
                                {formatDistanceToNow(new Date(log.timestamp), {
                                  addSuffix: true,
                                })}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.2 rounded border border-border/40 text-muted-foreground flex items-center gap-1">
                                <GitBranch className="size-2.5" />{" "}
                                {log.environment}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                v{log.version}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Commit Hash SHA badge + Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* GitHub Commit Hash Badge */}
                          <button
                            type="button"
                            onClick={() => handleCopyHash(shortHash)}
                            className="font-mono text-[11px] px-2 py-0.5 rounded-md border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            title="Copy full SHA"
                          >
                            <GitCommit className="size-3 text-primary/70" />
                            <span>{shortHash}</span>
                            {copiedHash === shortHash ? (
                              <Check className="size-2.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-2.5 opacity-50" />
                            )}
                          </button>

                          {/* Expand Diff / Variable button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleExpand(log._id)}
                          >
                            {isExpanded ? (
                              <>
                                Hide Diff <ChevronDown className="size-3" />
                              </>
                            ) : (
                              <>
                                Diff <ChevronRight className="size-3" />
                              </>
                            )}
                          </Button>

                          {/* Restore button */}
                          {isRestorable && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 border-purple-500/30 font-medium"
                              onClick={() => handleOpenSingleRestore(log)}
                            >
                              <RotateCcw className="size-3" /> Restore
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Git Diff / Value Box */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border/50 pl-10 space-y-2 animate-in fade-in duration-150">
                          <div className="rounded-lg border bg-black/30 p-2.5 font-mono text-xs space-y-2">
                            {/* Changed Variable Header (Diff line) */}
                            <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-white/5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                    log.action === "delete"
                                      ? "bg-rose-500/20 text-rose-400"
                                      : log.action === "create"
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-blue-500/20 text-blue-400"
                                  }`}
                                >
                                  {log.action === "delete"
                                    ? `- ${keyName}`
                                    : log.action === "create"
                                      ? `+ ${keyName}`
                                      : `~ ${keyName}`}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  [{log.environment}]
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleToggleReveal(log)}
                                >
                                  {isRevealed ? (
                                    <EyeOff className="size-3" />
                                  ) : (
                                    <Eye className="size-3" />
                                  )}
                                  {isRevealed ? "Hide" : "Reveal Value"}
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleCopyOldValue(log)}
                                >
                                  {copiedId === log._id ? (
                                    <Check className="size-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="size-3" />
                                  )}
                                  Copy
                                </Button>
                              </div>
                            </div>

                            {/* Value snapshot */}
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="text-muted-foreground/60 select-none">
                                value =
                              </span>
                              <span className="text-foreground select-all truncate">
                                {isRevealed
                                  ? revealedVal || "<empty>"
                                  : "••••••••••••••••••••••••••••••••"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Restore Confirmation Dialog */}
      <Dialog open={isSingleRestoring} onOpenChange={setIsSingleRestoring}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600">
              <RotateCcw className="size-5" /> Restore Variable
            </DialogTitle>
          </DialogHeader>

          {singleRestoreTarget && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                You are restoring{" "}
                <strong className="text-foreground font-mono">
                  {decryptedKeys[singleRestoreTarget._id] || "variable"}
                </strong>{" "}
                in the{" "}
                <Badge
                  variant="outline"
                  className="font-mono capitalize text-[10px] px-1.5 py-0"
                >
                  {singleRestoreTarget.environment}
                </Badge>{" "}
                environment to version{" "}
                <strong className="font-mono">
                  v{singleRestoreTarget.version}
                </strong>
                .
              </p>

              {/* Commit Message Required */}
              <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <GitCommit className="size-3.5 text-primary" /> Commit
                    Message / Reason
                    <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Required
                  </span>
                </div>
                <Input
                  placeholder="e.g. revert: roll back database URL after outage"
                  value={singleRestoreCommitMessage}
                  onChange={(e) =>
                    setSingleRestoreCommitMessage(e.target.value)
                  }
                  className="h-8 text-xs bg-background"
                  autoFocus
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSingleRestoring(false)}
              disabled={isExecutingRestore}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSingleRestore}
              disabled={
                isExecutingRestore || !singleRestoreCommitMessage.trim()
              }
              className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
            >
              {isExecutingRestore ? (
                <>
                  <Loader className="size-3.5 animate-spin" /> Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="size-3.5" /> Confirm & Restore
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Restore Confirmation Dialog */}
      <Dialog open={isBulkRestoring} onOpenChange={setIsBulkRestoring}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600">
              <RotateCcw className="size-5" /> Restore {selectedLogIds.length}{" "}
              Variables
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are about to restore{" "}
              <strong className="text-foreground">
                {selectedLogIds.length}
              </strong>{" "}
              previously deleted or updated variables back into their active
              environments.
            </p>

            {/* Commit Message Required */}
            <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <GitCommit className="size-3.5 text-primary" /> Commit Message
                  / Reason
                  <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Required
                </span>
              </div>
              <Input
                placeholder="e.g. revert: recover accidentally deleted payment credentials"
                value={bulkRestoreCommitMessage}
                onChange={(e) => setBulkRestoreCommitMessage(e.target.value)}
                className="h-8 text-xs bg-background"
                autoFocus
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkRestoring(false)}
              disabled={isExecutingRestore}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmBulkRestore}
              disabled={isExecutingRestore || !bulkRestoreCommitMessage.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
            >
              {isExecutingRestore ? (
                <>
                  <Loader className="size-3.5 animate-spin" /> Restoring{" "}
                  {selectedLogIds.length}...
                </>
              ) : (
                <>
                  <RotateCcw className="size-3.5" /> Confirm & Restore (
                  {selectedLogIds.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
