"use client";

import React, { useState } from "react";
import { Upload, FileCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  encryptSecretString,
  computeBlindHash,
} from "@/lib/crypto/vault-crypto";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useVault } from "../context/vault-context";

interface ImportEnvModalProps {
  workspaceId: any;
  boardId?: any;
  currentEnvironment: "development" | "staging" | "production" | "testing";
}

export const ImportEnvModal = ({
  workspaceId,
  boardId,
  currentEnvironment,
}: ImportEnvModalProps) => {
  const { projectKey } = useVault();
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const setSecretMutation = useMutation(api.vault.setSecret);

  const parseEnvString = (content: string) => {
    const lines = content.split("\n");
    const parsed: Array<{ key: string; value: string; comment?: string }> = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      // Skip empty lines or comment-only lines
      if (!line || line.startsWith("#")) continue;

      const equalIndex = line.indexOf("=");
      if (equalIndex === -1) continue;

      const key = line.slice(0, equalIndex).trim().toUpperCase();
      let value = line.slice(equalIndex + 1).trim();

      // Strip enclosing quotes if any
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key) {
        parsed.push({ key, value });
      }
    }
    return parsed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!projectKey) {
      toast.error("Project key not unlocked");
      return;
    }

    const secrets = parseEnvString(rawText);
    if (secrets.length === 0) {
      toast.error("No valid KEY=VALUE pairs found in text");
      return;
    }

    try {
      setIsImporting(true);
      setProgress({ current: 0, total: secrets.length });

      let count = 0;
      for (const item of secrets) {
        const encKey = await encryptSecretString(item.key, projectKey);
        const encVal = await encryptSecretString(item.value, projectKey);
        const secretKeyHash = await computeBlindHash(item.key);

        await setSecretMutation({
          workspaceId,
          boardId,
          environment: currentEnvironment,
          secretKeyHash,
          encryptedKey: encKey.ciphertext,
          keyIv: encKey.iv,
          encryptedValue: encVal.ciphertext,
          valueIv: encVal.iv,
          keyVersion: 1,
        });

        count++;
        setProgress({ current: count, total: secrets.length });
      }

      toast.success(
        `Successfully encrypted and imported ${count} environment variables into ${currentEnvironment}!`,
      );
      setRawText("");
      setOpen(false);
    } catch (err: any) {
      console.error("Bulk import error:", err);
      toast.error(err.message || "Failed during bulk import");
    } finally {
      setIsImporting(false);
      setProgress(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="size-3.5" /> Import .env
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileCode className="size-5 text-primary" />
            <DialogTitle>Import .env into {currentEnvironment}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Paste .env Content</Label>
              <label className="text-xs text-primary hover:underline cursor-pointer">
                Upload .env file
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".env,text/plain"
                />
              </label>
            </div>
            <Textarea
              rows={8}
              placeholder={`DATABASE_URL="postgres://..."\nNEXT_PUBLIC_API_URL="https://..."\nSTRIPE_SECRET_KEY="sk_live_..."`}
              className="font-mono text-xs"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={isImporting}
            />
          </div>

          {progress && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-2.5 text-xs text-primary">
              <CheckCircle2 className="size-4 animate-pulse" />
              <span>
                Encrypting & storing: {progress.current} / {progress.total} keys...
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !rawText.trim()}>
            {isImporting ? "Importing..." : "Encrypt & Import All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
