"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { decryptSecretString } from "@/lib/crypto/vault-crypto";
import { useVault } from "../context/vault-context";

interface ExportEnvButtonProps {
  secrets: any[];
  environment: string;
}

export const ExportEnvButton = ({
  secrets,
  environment,
}: ExportEnvButtonProps) => {
  const { projectKey } = useVault();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!projectKey) {
      toast.error("Vault is not unlocked");
      return;
    }

    if (!secrets || secrets.length === 0) {
      toast.error("No secrets found to export");
      return;
    }

    try {
      setIsExporting(true);
      const lines: string[] = [
        `# Exported from Workwise Zero-Knowledge Vault`,
        `# Environment: ${environment.toUpperCase()}`,
        `# Generated at: ${new Date().toISOString()}`,
        "",
      ];

      for (const secret of secrets) {
        try {
          const keyName = await decryptSecretString(
            secret.encryptedKey,
            secret.keyIv,
            projectKey,
          );
          const value = await decryptSecretString(
            secret.encryptedValue,
            secret.valueIv,
            projectKey,
          );

          if (secret.encryptedComment && secret.commentIv) {
            const comment = await decryptSecretString(
              secret.encryptedComment,
              secret.commentIv,
              projectKey,
            );
            if (comment) {
              lines.push(`# ${comment}`);
            }
          }

          lines.push(`${keyName}="${value}"`);
        } catch (err) {
          console.error("Failed to decrypt a secret during export:", err);
        }
      }

      const blob = new Blob([lines.join("\n")], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `.env.${environment}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported .env.${environment} successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to export secrets");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={handleExport}
      disabled={isExporting || !secrets || secrets.length === 0}
    >
      <Download className="size-3.5" />
      {isExporting ? "Exporting..." : "Export .env"}
    </Button>
  );
};
