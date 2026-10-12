"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  FileText,
  Copy,
  Check,
  CheckSquare,
  Square,
  Loader,
  GitCommit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  encryptSecretString,
  computeBlindHash,
} from "@/lib/crypto/vault-crypto";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useVault } from "../context/vault-context";

interface EnvRowItem {
  id: string;
  key: string;
  value: string;
  comment: string;
  environments: string[];
  isMasked: boolean;
}

interface CreateSecretModalProps {
  workspaceId: any;
  boardId?: any;
  currentEnvironment: string;
  availableEnvironments?: string[];
}

const DEFAULT_ENV_METADATA: Record<string, { label: string; color: string }> = {
  development: {
    label: "Development",
    color: "text-emerald-400 border-emerald-500/30",
  },
  production: {
    label: "Production",
    color: "text-rose-400 border-rose-500/30",
  },
  testing: { label: "Testing", color: "text-amber-400 border-amber-500/30" },
};

export const CreateSecretModal = ({
  workspaceId,
  boardId,
  currentEnvironment,
  availableEnvironments,
}: CreateSecretModalProps) => {
  const envOptions = (
    availableEnvironments?.length
      ? availableEnvironments
      : ["development", "production", "testing"]
  ).map((env) => ({
    id: env,
    label:
      DEFAULT_ENV_METADATA[env]?.label ||
      env.charAt(0).toUpperCase() + env.slice(1),
    color:
      DEFAULT_ENV_METADATA[env]?.color ||
      "text-purple-400 border-purple-500/30",
  }));

  const { projectKey } = useVault();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"rows" | "paste">("rows");
  const [isSaving, setIsSaving] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [pasteEnvs, setPasteEnvs] = useState<string[]>([currentEnvironment]);
  const [commitMessage, setCommitMessage] = useState("");

  // Initial rows like Vercel
  const [rows, setRows] = useState<EnvRowItem[]>([
    {
      id: "row-1",
      key: "",
      value: "",
      comment: "",
      environments: [currentEnvironment],
      isMasked: false,
    },
  ]);

  const setBatchSecretsMutation = useMutation(api.vault.setBatchSecrets);

  // Add new row
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random()}`,
        key: "",
        value: "",
        comment: "",
        environments: [currentEnvironment],
        isMasked: false,
      },
    ]);
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) {
      setRows([
        {
          id: `row-${Date.now()}`,
          key: "",
          value: "",
          comment: "",
          environments: [currentEnvironment],
          isMasked: false,
        },
      ]);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Update specific row property
  const handleUpdateRow = (id: string, field: keyof EnvRowItem, val: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
    );
  };

  // Toggle environment for a row
  const handleToggleRowEnv = (rowId: string, env: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const hasEnv = r.environments.includes(env);
        const newEnvs = hasEnv
          ? r.environments.filter((e) => e !== env)
          : [...r.environments, env];
        return {
          ...r,
          environments: newEnvs.length > 0 ? newEnvs : [currentEnvironment],
        };
      }),
    );
  };

  // Parse raw .env paste into rows
  const handleParsePaste = () => {
    if (!pasteContent.trim()) {
      toast.error("Please paste .env content first");
      return;
    }

    const lines = pasteContent.split("\n");
    const parsed: EnvRowItem[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;

      let key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();

      // Clean wrapping quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      key = key.toUpperCase().replace(/\s+/g, "_");
      if (key) {
        parsed.push({
          id: `parsed-${Date.now()}-${Math.random()}`,
          key,
          value,
          comment: "",
          environments:
            pasteEnvs.length > 0 ? [...pasteEnvs] : [currentEnvironment],
          isMasked: true,
        });
      }
    }

    if (parsed.length === 0) {
      toast.error("No valid KEY=VALUE pairs found in pasted text");
      return;
    }

    setRows(parsed);
    setPasteContent("");
    setActiveTab("rows");
    toast.success(`Parsed ${parsed.length} environment variables into rows!`);
  };

  // Save all rows
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectKey) {
      toast.error("Project Vault Key is not loaded in memory");
      return;
    }

    // Validate rows
    const validRows = rows.filter((r) => r.key.trim().length > 0);
    if (validRows.length === 0) {
      toast.error("Please provide at least one variable key");
      return;
    }

    if (!commitMessage.trim()) {
      toast.error("Please enter a commit message explaining this change");
      return;
    }

    try {
      setIsSaving(true);
      toast.info(`Encrypting ${validRows.length} variables client-side...`);

      const secretsToInsert: any[] = [];

      for (const row of validRows) {
        const cleanKey = row.key.trim().toUpperCase().replace(/\s+/g, "_");
        const encKey = await encryptSecretString(cleanKey, projectKey);
        const encVal = await encryptSecretString(row.value, projectKey);
        let encComment;
        if (row.comment.trim()) {
          encComment = await encryptSecretString(
            row.comment.trim(),
            projectKey,
          );
        }
        const secretKeyHash = await computeBlindHash(cleanKey);

        const targetEnvs =
          row.environments.length > 0 ? row.environments : [currentEnvironment];

        for (const env of targetEnvs) {
          secretsToInsert.push({
            environment: env,
            secretKeyHash,
            encryptedKey: encKey.ciphertext,
            keyIv: encKey.iv,
            encryptedValue: encVal.ciphertext,
            valueIv: encVal.iv,
            encryptedComment: encComment?.ciphertext,
            commentIv: encComment?.iv,
            keyVersion: 1,
          });
        }
      }

      await setBatchSecretsMutation({
        workspaceId,
        boardId: boardId || undefined,
        secrets: secretsToInsert,
        commitMessage: commitMessage.trim(),
      });

      toast.success(
        `Saved ${validRows.length} variable${validRows.length > 1 ? "s" : ""} across ${secretsToInsert.length} environment target${secretsToInsert.length > 1 ? "s" : ""}`,
      );

      setRows([
        {
          id: `row-${Date.now()}`,
          key: "",
          value: "",
          comment: "",
          environments: [currentEnvironment],
          isMasked: false,
        },
      ]);
      setCommitMessage("");
      setOpen(false);
    } catch (err: any) {
      console.error("Batch save error:", err);
      toast.error(err.message || "Failed to encrypt and save secrets");
    } finally {
      setIsSaving(false);
    }
  };

  const totalTargets = rows.reduce(
    (acc, r) => acc + (r.key.trim() ? r.environments.length : 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 shadow-sm font-semibold">
          <Plus className="size-4" /> Add Variables
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold">
                Add Environment Variables
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Manage multiple environment variables and target multiple
                environments simultaneously (Vercel Style).
              </DialogDescription>
            </div>

            {/* Tab switch */}
            <div className="flex rounded-lg border bg-muted/30 p-0.5 text-xs">
              <button
                type="button"
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
                  activeTab === "rows"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("rows")}
              >
                <Layers className="size-3.5" /> Key-Value Rows
              </button>
              <button
                type="button"
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
                  activeTab === "paste"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("paste")}
              >
                <FileText className="size-3.5" /> Paste .env
              </button>
            </div>
          </div>
        </DialogHeader>

        {activeTab === "rows" ? (
          <form
            onSubmit={handleSaveAll}
            className="flex flex-col flex-1 min-h-0 space-y-4"
          >
            {/* Scrollable Rows Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[260px] max-h-[52vh]">
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-border/80 bg-card/60 p-3.5 transition-all hover:border-primary/40 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    {/* Key Input */}
                    <div className="md:col-span-5 space-y-1">
                      <Label className="text-[11px] font-mono text-muted-foreground">
                        KEY #{index + 1}
                      </Label>
                      <Input
                        placeholder="e.g. NEXT_PUBLIC_API_URL"
                        className="font-mono text-xs uppercase"
                        value={row.key}
                        onChange={(e) =>
                          handleUpdateRow(row.id, "key", e.target.value)
                        }
                      />
                    </div>

                    {/* Value Input */}
                    <div className="md:col-span-6 space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-mono text-muted-foreground">
                          VALUE
                        </Label>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateRow(row.id, "isMasked", !row.isMasked)
                          }
                          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          {row.isMasked ? (
                            <>
                              <Eye className="size-3" /> Show
                            </>
                          ) : (
                            <>
                              <EyeOff className="size-3" /> Mask
                            </>
                          )}
                        </button>
                      </div>
                      <Input
                        type={row.isMasked ? "password" : "text"}
                        placeholder="e.g. https://api.production.com"
                        className="font-mono text-xs"
                        value={row.value}
                        onChange={(e) =>
                          handleUpdateRow(row.id, "value", e.target.value)
                        }
                      />
                    </div>

                    {/* Delete Row Button */}
                    <div className="md:col-span-1 pt-6 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveRow(row.id)}
                        title="Remove row"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Environment Checkbox Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Environments:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {envOptions.map((env) => {
                        const isSelected = row.environments.includes(env.id);
                        return (
                          <button
                            key={env.id}
                            type="button"
                            onClick={() => handleToggleRowEnv(row.id, env.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
                              isSelected
                                ? `bg-primary/10 border-primary text-foreground font-semibold`
                                : `bg-muted/20 border-transparent text-muted-foreground hover:bg-muted/40`
                            }`}
                          >
                            {isSelected ? (
                              <CheckSquare className="size-3 text-primary" />
                            ) : (
                              <Square className="size-3 text-muted-foreground/50" />
                            )}
                            {env.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Row Button */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="gap-1.5 text-xs font-semibold"
              >
                <Plus className="size-3.5" /> Add Another Variable
              </Button>

              <span className="text-xs text-muted-foreground font-mono">
                {rows.filter((r) => r.key.trim()).length} variable
                {rows.filter((r) => r.key.trim()).length !== 1 ? "s" : ""} (
                {totalTargets} targets)
              </span>
            </div>

            {/* Commit Message */}
            <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <GitCommit className="size-3.5 text-primary" /> Commit Message
                  <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Required for audit logs
                </span>
              </div>
              <Input
                placeholder="e.g. feat: add Stripe and SendGrid API credentials"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="h-8 text-xs bg-background"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSaving || rows.filter((r) => r.key.trim()).length === 0
                }
                className="gap-2 font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader className="size-4 animate-spin" /> Encrypting &
                    Saving...
                  </>
                ) : (
                  <>
                    <Lock className="size-4" /> Save Variables
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Paste .env Mode */
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">
                Paste your .env file content below:
              </Label>
              <Textarea
                rows={9}
                className="font-mono text-xs leading-relaxed"
                placeholder={`DATABASE_URL="postgres://..."\nNEXT_PUBLIC_API_URL="https://..."\nSTRIPE_SECRET_KEY="sk_live_..."`}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
              />
            </div>

            {/* Target Environments for pasted content */}
            <div className="space-y-1.5">
              <Label className="text-xs">Apply to Environments:</Label>
              <div className="flex flex-wrap items-center gap-2">
                {envOptions.map((env) => {
                  const isSelected = pasteEnvs.includes(env.id);
                  return (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => {
                        setPasteEnvs((prev) =>
                          prev.includes(env.id)
                            ? prev.filter((e) => e !== env.id)
                            : [...prev, env.id],
                        );
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        isSelected
                          ? `bg-primary/10 border-primary text-foreground font-semibold`
                          : `bg-muted/20 border-transparent text-muted-foreground hover:bg-muted/40`
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="size-3.5 text-primary" />
                      ) : (
                        <Square className="size-3.5 text-muted-foreground/50" />
                      )}
                      {env.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("rows")}
              >
                Back to Rows
              </Button>
              <Button
                type="button"
                onClick={handleParsePaste}
                className="gap-2 font-semibold"
              >
                <Sparkles className="size-4" /> Parse & Populate Rows
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
