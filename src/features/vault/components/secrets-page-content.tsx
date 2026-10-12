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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Environment Variables
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage secret keys and environment variables for your application.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
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
                  />
                ))}
              </div>
            )}
          </div>
        )}

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
  );
};
