"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Lock,
  Unlock,
  KeyRound,
  FileCode,
  FileKey,
  Search,
  History,
  Sparkles,
  Plus,
  X,
  Trash2,
  GitCommit,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/../convex/_generated/api";
import { useVault } from "../context/vault-context";
import { VaultUnlockCard } from "./vault-unlock-modal";
import { SecretItemRow } from "./secret-item-row";
import { CreateSecretModal } from "./create-secret-modal";
import { ExportEnvButton } from "./export-env-button";
import { SecretFilesView } from "./secret-files-view";
import { MemberAccessModal } from "./member-access-modal";
import { SecretLogsView } from "./secret-logs-view";
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info";

interface SecretsPageContentProps {
  workspaceId: any;
  boardId?: any;
}

export const SecretsPageContent = ({
  workspaceId,
  boardId,
}: SecretsPageContentProps) => {
  const {
    isUnlocked,
    needsSetup,
    projectKey,
    hasProjectKey,
    createInitialProjectKey,
    lockVault,
  } = useVault();

  const searchParams = useSearchParams();
  const urlTab = searchParams?.get("tab");

  const { data: workspace } = useGetWorkspaceInfo({ id: workspaceId });

  const [environment, setEnvironment] = useState<string>("development");
  const [activeTab, setActiveTab] = useState<"keys" | "files" | "logs">(
    urlTab === "files" ? "files" : urlTab === "logs" ? "logs" : "keys",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchInfo, setShowArchInfo] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [isAddingEnv, setIsAddingEnv] = useState(false);

  useEffect(() => {
    if (urlTab === "files" || urlTab === "keys" || urlTab === "logs") {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const normalizedBoardId = boardId || undefined;

  // Custom environments management
  const customEnvs = useQuery(api.vault.getCustomEnvironments, {
    workspaceId,
    boardId: normalizedBoardId,
  });
  const addCustomEnvMutation = useMutation(api.vault.addCustomEnvironment);
  const deleteCustomEnvMutation = useMutation(
    api.vault.deleteCustomEnvironment,
  );
  const deleteBatchSecretsMutation = useMutation(api.vault.deleteBatchSecrets);

  const [selectedSecretIds, setSelectedSecretIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteCommitMessage, setBulkDeleteCommitMessage] = useState("");

  // Clear selections when environment changes
  useEffect(() => {
    setSelectedSecretIds([]);
  }, [environment]);

  const handleToggleSelectSecret = (id: string) => {
    setSelectedSecretIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (secretsList: any[]) => {
    if (selectedSecretIds.length === secretsList.length) {
      setSelectedSecretIds([]);
    } else {
      setSelectedSecretIds(secretsList.map((s) => s._id));
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (!bulkDeleteCommitMessage.trim()) {
      toast.error("Please provide a commit message explaining this change");
      return;
    }
    try {
      await deleteBatchSecretsMutation({
        ids: selectedSecretIds as any,
        commitMessage: bulkDeleteCommitMessage.trim(),
      });
      toast.success(`Deleted ${selectedSecretIds.length} variables`);
      setSelectedSecretIds([]);
      setIsBulkDeleting(false);
      setBulkDeleteCommitMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete selected variables");
    }
  };

  const DEFAULT_ENVS = ["development", "production", "testing"];
  const customEnvNames = customEnvs?.map((c) => c.name) || [];
  const allEnvironments = Array.from(
    new Set([...DEFAULT_ENVS, ...customEnvNames]),
  );

  const handleAddEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEnvName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    if (!clean) return;
    if (allEnvironments.includes(clean)) {
      toast.error(`Environment "${clean}" already exists`);
      return;
    }
    try {
      await addCustomEnvMutation({
        workspaceId,
        boardId: normalizedBoardId,
        name: clean,
      });
      setEnvironment(clean);
      setNewEnvName("");
      setIsAddingEnv(false);
      toast.success(`Environment "${clean}" added`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add environment");
    }
  };

  const handleDeleteEnvironment = async (customEnvId: any, envName: string) => {
    if (!confirm(`Delete custom environment "${envName}"?`)) return;
    try {
      await deleteCustomEnvMutation({ id: customEnvId });
      if (environment === envName) {
        setEnvironment("development");
      }
      toast.success(`Environment "${envName}" removed`);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove environment");
    }
  };

  // Fetch encrypted secrets from Convex
  const secrets = useQuery(api.vault.getSecrets, {
    workspaceId,
    boardId: normalizedBoardId,
    environment,
  });

  // If vault is locked or needs setup, show unlock/setup screen
  if (!isUnlocked) {
    return <VaultUnlockCard />;
  }

  // If user identity is unlocked, but workspace has no project key yet
  if (!projectKey && !hasProjectKey) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-border/80 bg-card p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-6" />
          </div>
          <h2 className="text-xl font-bold">Initialize Project Master Key</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Your personal cryptographic identity is unlocked, but this project
            does not have a Master Project Key yet. Generate one now to start
            managing secrets.
          </p>
          <Button
            className="mt-5 w-full gap-2 font-semibold"
            disabled={isGeneratingKey}
            onClick={async () => {
              setIsGeneratingKey(true);
              await createInitialProjectKey();
              setIsGeneratingKey(false);
            }}
          >
            {isGeneratingKey ? (
              "Generating AES-256-GCM Key..."
            ) : (
              <>
                <Sparkles className="size-4" /> Generate Project Master Key
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // If project key exists in database, but hasn't been shared with this user yet
  if (!projectKey && hasProjectKey) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-amber-500/20 bg-card p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Lock className="size-6" />
          </div>
          <h2 className="text-xl font-bold">Project Key Access Pending</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            The project master key is already active, but your account has not
            received a wrapped key envelope yet. Ask any active project
            administrator to open <strong>Team Key Sharing</strong> and grant
            you access.
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => lockVault()}>
              Lock Vault
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background/30">
      {/* Standard Top Header */}
      <div className="flex h-[49px] items-center justify-between border-b bg-background px-4 shrink-0">
        <h1 className="text-lg font-semibold truncate">
          Environment Variables{workspace?.name ? ` - ${workspace.name}` : ""}
        </h1>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <MemberAccessModal
            workspaceId={workspaceId}
            boardId={normalizedBoardId}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={lockVault}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8"
            title="Lock Vault"
          >
            <Lock className="size-3.5" /> Lock
          </Button>
        </div>
      </div>

      {/* Main Page Content Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Environment Selector Tabs */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-lg border bg-muted/30">
                {allEnvironments.map((env) => {
                  const isSelected = environment === env;
                  const customRecord = customEnvs?.find((c) => c.name === env);
                  return (
                    <div
                      key={env}
                      className={`group relative flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer"
                      }`}
                      onClick={() => setEnvironment(env)}
                    >
                      <span className="capitalize">{env}</span>
                      {customRecord && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEnvironment(customRecord._id, env);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all ml-0.5"
                          title="Remove custom environment"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add custom environment trigger */}
                {isAddingEnv ? (
                  <form
                    onSubmit={handleAddEnvironment}
                    className="flex items-center gap-1 pl-1"
                  >
                    <Input
                      autoFocus
                      placeholder="e.g. staging"
                      value={newEnvName}
                      onChange={(e) => setNewEnvName(e.target.value)}
                      className="h-6 w-24 text-[11px] px-2 lowercase font-mono"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[10px]"
                      onClick={() => {
                        setIsAddingEnv(false);
                        setNewEnvName("");
                      }}
                    >
                      <X className="size-3" />
                    </Button>
                  </form>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground font-normal"
                    onClick={() => setIsAddingEnv(true)}
                    title="Add custom environment"
                  >
                    <Plus className="size-3" /> Add
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex rounded-lg border bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
                    activeTab === "keys"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab("keys")}
                >
                  <FileCode className="size-3.5" /> Env Keys
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
                    activeTab === "files"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab("files")}
                >
                  <FileKey className="size-3.5" /> Secret Files
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
                    activeTab === "logs"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab("logs")}
                >
                  <History className="size-3.5" /> Audit Logs
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content: Env Keys */}
          {activeTab === "keys" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter keys in memory..."
                    className="pl-8 h-9 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <ExportEnvButton
                    secrets={secrets || []}
                    environment={environment}
                  />
                  <CreateSecretModal
                    workspaceId={workspaceId}
                    boardId={normalizedBoardId}
                    currentEnvironment={environment}
                    availableEnvironments={allEnvironments}
                  />
                </div>
              </div>

              {/* Bulk Actions Floating Bar */}
              {selectedSecretIds.length > 0 && (
                <div className="flex items-center justify-between p-2.5 px-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="font-mono text-xs">
                      {selectedSecretIds.length}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground">
                      variable{selectedSecretIds.length > 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSecretIds([])}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Deselect All
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setBulkDeleteCommitMessage("");
                        setIsBulkDeleting(true);
                      }}
                      className="h-7 text-xs gap-1.5 font-semibold"
                    >
                      <Trash2 className="size-3.5" /> Delete Selected (
                      {selectedSecretIds.length})
                    </Button>
                  </div>
                </div>
              )}

              {/* Secrets List Header & Select All */}
              {secrets && secrets.length > 0 && (
                <div className="flex items-center justify-between px-2 pt-1 text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        secrets.length > 0 &&
                        selectedSecretIds.length === secrets.length
                      }
                      onCheckedChange={() => handleSelectAll(secrets)}
                      className="size-3.5"
                    />
                    <span
                      className="cursor-pointer select-none"
                      onClick={() => handleSelectAll(secrets)}
                    >
                      Select all ({secrets.length})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono">
                    {secrets.length} variable{secrets.length !== 1 ? "s" : ""}{" "}
                    in {environment}
                  </span>
                </div>
              )}

              {/* Secrets List */}
              {secrets === undefined ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : secrets.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/10">
                  <KeyRound className="size-7 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    No variables in {environment}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                    Add variables or paste `.env` contents to encrypt and store
                    them.
                  </p>
                  <div className="mt-4">
                    <CreateSecretModal
                      workspaceId={workspaceId}
                      boardId={normalizedBoardId}
                      currentEnvironment={environment}
                      availableEnvironments={allEnvironments}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-2.5">
                  {secrets.map((secret) => (
                    <SecretItemRow
                      key={secret._id}
                      secret={secret}
                      projectKey={projectKey!}
                      workspaceId={workspaceId}
                      boardId={normalizedBoardId}
                      environment={environment}
                      isSelected={selectedSecretIds.includes(secret._id)}
                      onToggleSelect={() =>
                        handleToggleSelectSecret(secret._id)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bulk Delete Confirmation Dialog */}
          <Dialog open={isBulkDeleting} onOpenChange={setIsBulkDeleting}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="size-5" /> Delete{" "}
                  {selectedSecretIds.length} Variables
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You are about to permanently delete{" "}
                  <strong className="text-foreground">
                    {selectedSecretIds.length}
                  </strong>{" "}
                  variables from the{" "}
                  <Badge
                    variant="outline"
                    className="font-mono capitalize text-[10px] px-1.5 py-0"
                  >
                    {environment}
                  </Badge>{" "}
                  environment. These variables will be preserved in the audit
                  log history and can be restored at any time.
                </p>

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
                    placeholder="e.g. chore: remove legacy payment credentials"
                    value={bulkDeleteCommitMessage}
                    onChange={(e) => setBulkDeleteCommitMessage(e.target.value)}
                    className="h-8 text-xs bg-background"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsBulkDeleting(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmBulkDelete}
                  disabled={!bulkDeleteCommitMessage.trim()}
                >
                  Confirm & Delete ({selectedSecretIds.length})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Tab Content: Secret Files */}
          {activeTab === "files" && (
            <SecretFilesView
              workspaceId={workspaceId}
              boardId={normalizedBoardId}
              environment={environment}
            />
          )}

          {/* Tab Content: Audit Logs & Version History */}
          {activeTab === "logs" && (
            <SecretLogsView
              workspaceId={workspaceId}
              boardId={normalizedBoardId}
              projectKey={projectKey!}
            />
          )}
        </div>
      </div>
    </div>
  );
};
