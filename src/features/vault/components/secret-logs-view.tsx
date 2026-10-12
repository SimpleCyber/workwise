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
  KeyRound,
  FolderGit2,
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

  // Commit Expansion State (collapsible/expandable on click)
  const [expandedCommitIds, setExpandedCommitIds] = useState<
    Record<string, boolean>
  >({});

  const toggleCommitExpand = (commitId: string) => {
    setExpandedCommitIds((prev) => ({
      ...prev,
      [commitId]: !(prev[commitId] ?? false),
    }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    for (const c of groupedCommits) {
      all[c.commitId] = true;
    }
    setExpandedCommitIds(all);
  };

  const handleCollapseAll = () => {
    const none: Record<string, boolean> = {};
    for (const c of groupedCommits) {
      none[c.commitId] = false;
    }
    setExpandedCommitIds(none);
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

  // Group filtered logs into Commits
  interface CommitGroup {
    commitId: string;
    commitHash: string;
    commitMessage: string;
    userName?: string;
    userEmail?: string;
    userImage?: string;
    timestamp: number;
    environment: string;
    action: string;
    logs: any[];
  }

  const groupedCommits = useMemo(() => {
    const map = new Map<string, CommitGroup>();

    for (const log of filteredLogs) {
      // Group together if they share a commitHash or occurred in the same action batch (same user & message within 5s window)
      const commitKey =
        log.commitHash ||
        (log.commitMessage
          ? `${log.userId || "user"}_${log.commitMessage}_${Math.floor(log.timestamp / 5000)}`
          : log._id);

      if (!map.has(commitKey)) {
        map.set(commitKey, {
          commitId: commitKey,
          commitHash: log.commitHash || log._id.slice(-7),
          commitMessage:
            log.commitMessage ||
            (log.action === "create"
              ? `Add variable to ${log.environment}`
              : log.action === "delete"
                ? `Remove variable from ${log.environment}`
                : log.action === "update"
                  ? `Update variable in ${log.environment}`
                  : `Restore variable to v${log.version}`),
          userName: log.userName,
          userEmail: log.userEmail,
          userImage: log.userImage,
          timestamp: log.timestamp,
          environment: log.environment,
          action: log.action,
          logs: [],
        });
      }
      map.get(commitKey)!.logs.push(log);
    }

    return Array.from(map.values());
  }, [filteredLogs]);

  // Group commits by date
  interface DateCommitGroup {
    dateLabel: string;
    commits: CommitGroup[];
  }

  const dateGroupedCommits = useMemo(() => {
    const map = new Map<string, CommitGroup[]>();
    for (const commit of groupedCommits) {
      const d = new Date(commit.timestamp);
      let dateKey: string;
      if (isToday(d)) {
        dateKey = "Today";
      } else if (isYesterday(d)) {
        dateKey = "Yesterday";
      } else {
        dateKey = format(d, "MMMM d, yyyy");
      }

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(commit);
    }

    const groups: DateCommitGroup[] = [];
    map.forEach((commits, dateLabel) => {
      groups.push({ dateLabel, commits });
    });
    return groups;
  }, [groupedCommits]);

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

  const getStatusLetterBadge = (action: string) => {
    switch (action) {
      case "create":
        return (
          <span
            className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0"
            title="Added"
          >
            A
          </span>
        );
      case "update":
        return (
          <span
            className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 border border-blue-500/30 shrink-0"
            title="Modified"
          >
            M
          </span>
        );
      case "delete":
        return (
          <span
            className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 border border-rose-500/30 shrink-0"
            title="Deleted"
          >
            D
          </span>
        );
      case "rollback":
      case "restore":
        return (
          <span
            className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-500 border border-purple-500/30 shrink-0"
            title="Restored"
          >
            R
          </span>
        );
      default:
        return (
          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border shrink-0">
            M
          </span>
        );
    }
  };

  const getNodeColor = (action: string, isExpanded: boolean) => {
    if (isExpanded) {
      return "bg-blue-500 border-blue-400 ring-2 ring-blue-500/40";
    }
    switch (action) {
      case "create":
        return "bg-emerald-500 border-emerald-400 ring-2 ring-emerald-500/30";
      case "update":
        return "bg-blue-500 border-blue-400 ring-2 ring-blue-500/30";
      case "delete":
        return "bg-rose-500 border-rose-400 ring-2 ring-rose-500/30";
      case "rollback":
      case "restore":
        return "bg-purple-500 border-purple-400 ring-2 ring-purple-500/30";
      default:
        return "bg-primary border-primary ring-2 ring-primary/30";
    }
  };

  if (logs === undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Loader className="size-6 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground font-mono">
          Loading activity logs...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl border bg-card/60">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search commits by message, variable, author, or SHA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-9 text-xs bg-background"
          />
        </div>

        {/* Action Filters and Controls */}
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
              All ({groupedCommits.length})
            </button>
            <button
              onClick={() => setActionFilter("updated")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                actionFilter === "updated"
                  ? "bg-background text-blue-500 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Modified
            </button>
            <button
              onClick={() => setActionFilter("created")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                actionFilter === "created"
                  ? "bg-background text-emerald-500 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Added
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
          </div>

          {/* Environment dropdown */}
          {availableEnvironments.length > 1 && (
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="h-8 text-xs font-mono rounded-md border bg-background px-2.5 text-muted-foreground focus:outline-hidden"
            >
              <option value="all">All Environments</option>
              {availableEnvironments.map((env) => (
                <option key={env} value={env}>
                  env: {env}
                </option>
              ))}
            </select>
          )}

          {/* Expand / Collapse All */}
          <div className="flex items-center border rounded-md bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandAll}
              className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              title="Expand all commits"
            >
              Expand All
            </Button>
            <span className="text-border">|</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCollapseAll}
              className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              title="Collapse all commits"
            >
              Collapse All
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Restore Floating Bar */}
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
                Will be revived and decrypted into active environment keys
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

      {/* Select All Restorable Header */}
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
            {groupedCommits.length} commit
            {groupedCommits.length !== 1 ? "s" : ""} recorded
          </span>
        </div>
      )}

      {/* Activity Commit Tree Timeline */}
      {dateGroupedCommits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-12 text-center bg-muted/5">
          <FolderGit2 className="size-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold text-foreground">
            No activity records found
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dateGroupedCommits.map((group) => (
            <div key={group.dateLabel} className="space-y-2.5">
              {/* Date Header */}
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-2">
                <Calendar className="size-3.5 text-muted-foreground/70" />
                <span>{group.dateLabel}</span>
              </div>

              {/* Commit Tree List with rounded square avatars & connecting lines */}
              <div className="space-y-1">
                {group.commits.map((commit, commitIdx) => {
                  const isExpanded =
                    expandedCommitIds[commit.commitId] ??
                    (commitIdx === 0 && dateGroupedCommits.length === 1);
                  const shortHash = commit.commitHash;

                  // Format commit message with # prefix matching user reference
                  const rawMsg = commit.commitMessage.trim();
                  const displayMessage = rawMsg.startsWith("#")
                    ? rawMsg
                    : `# ${rawMsg}`;

                  // Action presence & counts for header badges
                  const hasCreate = commit.logs.some(
                    (l) => l.action === "create",
                  );
                  const hasUpdate = commit.logs.some(
                    (l) => l.action === "update",
                  );
                  const hasDelete = commit.logs.some(
                    (l) => l.action === "delete",
                  );
                  const hasRestore = commit.logs.some(
                    (l) => l.action === "rollback" || l.action === "restore",
                  );
                  const createCount = commit.logs.filter(
                    (l) => l.action === "create",
                  ).length;
                  const updateCount = commit.logs.filter(
                    (l) => l.action === "update",
                  ).length;
                  const deleteCount = commit.logs.filter(
                    (l) => l.action === "delete",
                  ).length;
                  const restoreCount = commit.logs.filter(
                    (l) => l.action === "rollback" || l.action === "restore",
                  ).length;

                  return (
                    <div
                      key={commit.commitId}
                      className="relative flex items-stretch gap-3 group"
                    >
                      {/* Left: User profile in rounded square + vertical connecting line | */}
                      <div className="flex flex-col items-center shrink-0">
                        <Avatar className="size-8 rounded-md border shadow-xs bg-background shrink-0">
                          <AvatarImage
                            src={commit.userImage}
                            alt={commit.userName || "User"}
                            className="rounded-md object-cover"
                          />
                          <AvatarFallback className="rounded-md text-[11px] font-semibold bg-primary/10 text-primary">
                            {commit.userName
                              ? commit.userName.charAt(0).toUpperCase()
                              : "U"}
                          </AvatarFallback>
                        </Avatar>

                        {/* Vertical line connecting to next commit | */}
                        {commitIdx < group.commits.length - 1 && (
                          <div className="w-[2px] flex-1 bg-border/80 my-1.5" />
                        )}
                      </div>

                      {/* Right: Commit card container */}
                      <div
                        className={`flex-1 min-w-0 ${
                          commitIdx < group.commits.length - 1 ? "pb-3.5" : ""
                        }`}
                      >
                        <div
                          className={`rounded-lg border transition-all overflow-hidden ${
                            isExpanded
                              ? "border-primary/40 bg-accent/30 shadow-xs"
                              : "border-border/70 bg-card/60 hover:border-border hover:bg-muted/20"
                          }`}
                        >
                          {/* Commit Header Row (Click to toggle expansion) */}
                          <div
                            onClick={() => toggleCommitExpand(commit.commitId)}
                            className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
                          >
                            {/* Left: Expand icon + # Message + Author */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {isExpanded ? (
                                <ChevronDown className="size-4 shrink-0 text-primary transition-transform" />
                              ) : (
                                <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-transform" />
                              )}

                              <span className="font-semibold text-xs font-mono text-foreground truncate tracking-tight">
                                {displayMessage}
                              </span>

                              {commit.userName && (
                                <span className="text-[11px] text-muted-foreground shrink-0 font-normal hidden sm:inline">
                                  {commit.userName}
                                </span>
                              )}
                            </div>

                            {/* Right: Environment, Timestamp, SHA, Keys Count & D/M/A Badges */}
                            <div
                              className="flex items-center gap-2 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Environment */}
                              <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground flex items-center gap-1 hidden md:flex">
                                <GitBranch className="size-2.5" />
                                {commit.environment}
                              </span>

                              {/* Relative Timestamp */}
                              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                {formatDistanceToNow(
                                  new Date(commit.timestamp),
                                  { addSuffix: true },
                                )}
                              </span>

                              {/* Commit Hash badge */}
                              <button
                                type="button"
                                onClick={() => handleCopyHash(shortHash)}
                                className="font-mono text-[11px] px-2 py-0.5 rounded border bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                title="Copy SHA"
                              >
                                <GitCommit className="size-3 text-primary/70" />
                                <span>{shortHash}</span>
                                {copiedHash === shortHash ? (
                                  <Check className="size-2.5 text-emerald-500" />
                                ) : (
                                  <Copy className="size-2.5 opacity-50" />
                                )}
                              </button>

                              {/* Changes Count & Side-by-side D, M, A, R Badges directly on header */}
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="secondary"
                                  className="font-mono text-[10px] py-0 px-1.5 font-normal"
                                >
                                  {commit.logs.length}{" "}
                                  {commit.logs.length === 1 ? "key" : "keys"}
                                </Badge>

                                {/* Direct D, M, A, R status badges right here on the header */}
                                <div className="flex items-center gap-1">
                                  {hasCreate && (
                                    <span
                                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0"
                                      title={`${createCount} Added`}
                                    >
                                      A
                                      {createCount > 1 ? ` ${createCount}` : ""}
                                    </span>
                                  )}
                                  {hasUpdate && (
                                    <span
                                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 border border-blue-500/30 shrink-0"
                                      title={`${updateCount} Modified`}
                                    >
                                      M
                                      {updateCount > 1 ? ` ${updateCount}` : ""}
                                    </span>
                                  )}
                                  {hasDelete && (
                                    <span
                                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 border border-rose-500/30 shrink-0"
                                      title={`${deleteCount} Deleted`}
                                    >
                                      D
                                      {deleteCount > 1 ? ` ${deleteCount}` : ""}
                                    </span>
                                  )}
                                  {hasRestore && (
                                    <span
                                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-500 border border-purple-500/30 shrink-0"
                                      title={`${restoreCount} Restored`}
                                    >
                                      R
                                      {restoreCount > 1
                                        ? ` ${restoreCount}`
                                        : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Changed Keys List (Below Header) */}
                          {isExpanded && (
                            <div className="border-t border-border/50 bg-background/50 divide-y divide-border/40 animate-in fade-in duration-150">
                              {commit.logs.map((log) => {
                                const keyName =
                                  decryptedKeys[log._id] || "Decrypting...";
                                const isRevealed = !!revealedIds[log._id];
                                const revealedVal = revealedIds[log._id] || "";
                                const isRestorable =
                                  log.action === "delete" ||
                                  log.action === "update" ||
                                  log.action === "rollback";
                                const isSelected = selectedLogIds.includes(
                                  log._id,
                                );

                                return (
                                  <div
                                    key={log._id}
                                    className={`p-2.5 pl-8 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors ${
                                      isSelected ? "bg-purple-500/[0.06]" : ""
                                    }`}
                                  >
                                    {/* Left: Checkbox (for restore) + Key icon + Key Name + Value Preview */}
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      {isRestorable && (
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() =>
                                            handleToggleSelectLog(log._id)
                                          }
                                          className="size-3.5 shrink-0 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                          title="Select to restore"
                                        />
                                      )}

                                      <KeyRound className="size-3.5 text-muted-foreground shrink-0" />

                                      <span className="font-mono text-xs font-semibold text-foreground truncate">
                                        {keyName}
                                      </span>

                                      {/* Value snapshot peek */}
                                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground ml-1">
                                        <span className="text-muted-foreground/60 select-none">
                                          =
                                        </span>
                                        <span className="text-muted-foreground select-all truncate max-w-[120px] sm:max-w-[200px]">
                                          {isRevealed
                                            ? revealedVal || "<empty>"
                                            : "••••••••••••"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Right: Reveal Value, Copy, Restore, Status Badge M/A/D/R */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {/* Reveal toggle */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                                        onClick={() => handleToggleReveal(log)}
                                        title={
                                          isRevealed
                                            ? "Hide value"
                                            : "Reveal value"
                                        }
                                      >
                                        {isRevealed ? (
                                          <EyeOff className="size-3" />
                                        ) : (
                                          <Eye className="size-3" />
                                        )}
                                      </Button>

                                      {/* Copy value */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                                        onClick={() => handleCopyOldValue(log)}
                                        title="Copy value"
                                      >
                                        {copiedId === log._id ? (
                                          <Check className="size-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="size-3" />
                                        )}
                                      </Button>

                                      {/* Single Restore button */}
                                      {isRestorable && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-6 px-2 text-[10px] gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 border-purple-500/30 font-medium"
                                          onClick={() =>
                                            handleOpenSingleRestore(log)
                                          }
                                        >
                                          <RotateCcw className="size-2.5" />{" "}
                                          Restore
                                        </Button>
                                      )}

                                      {/* Status Letter Badge M / A / D / R */}
                                      {getStatusLetterBadge(log.action)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
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
