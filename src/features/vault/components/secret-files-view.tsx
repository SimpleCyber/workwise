"use client";

import React, { useState, useEffect } from "react";
import {
  FileCode,
  Upload,
  Download,
  Trash2,
  FileKey,
  Lock,
  Plus,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  encryptSecretFile,
  decryptSecretFile,
  encryptSecretString,
  decryptSecretString,
} from "@/lib/crypto/vault-crypto";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useVault } from "../context/vault-context";

interface SecretFilesViewProps {
  workspaceId: any;
  boardId?: any;
  environment: string;
}

// Single secret file card/row
const SecretFileCard = ({
  fileRecord,
  projectKey,
}: {
  fileRecord: any;
  projectKey: CryptoKey;
}) => {
  const [decryptedName, setDecryptedName] = useState<string>("Decrypting...");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteFileMutation = useMutation(api.vault.deleteSecretFile);
  const downloadUrl = useQuery(api.vault.getSecretFileDownloadUrl, {
    storageId: fileRecord.storageId,
  });

  useEffect(() => {
    let isMounted = true;
    decryptSecretString(
      fileRecord.encryptedFileName,
      fileRecord.fileNameIv,
      projectKey,
    )
      .then((name) => {
        if (isMounted) setDecryptedName(name);
      })
      .catch(() => {
        if (isMounted) setDecryptedName("[Filename Decryption Error]");
      });

    return () => {
      isMounted = false;
    };
  }, [fileRecord, projectKey]);

  const handleDownload = async () => {
    if (!downloadUrl) {
      toast.error("Download URL not ready");
      return;
    }

    try {
      setIsDownloading(true);
      // 1. Fetch encrypted blob from Convex storage
      const res = await fetch(downloadUrl);
      const encryptedBuffer = await res.arrayBuffer();

      // 2. Decrypt buffer client-side
      const decryptedBuffer = await decryptSecretFile(
        encryptedBuffer,
        fileRecord.fileIv,
        projectKey,
      );

      // 3. Trigger download in browser
      const blob = new Blob([decryptedBuffer], {
        type: "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = decryptedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Decrypted and downloaded ${decryptedName}`);
    } catch (err: any) {
      console.error("Download error:", err);
      toast.error(err.message || "Failed to download and decrypt file");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (
      confirm(`Are you sure you want to delete secret file ${decryptedName}?`)
    ) {
      try {
        setIsDeleting(true);
        await deleteFileMutation({ id: fileRecord._id });
        toast.success(`Deleted ${decryptedName}`);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete file");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 p-4 transition-all hover:border-primary/30 hover:bg-card">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileKey className="size-5" />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-mono text-sm font-semibold truncate text-foreground">
            {decryptedName}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{formatSize(fileRecord.fileSize)}</span>
            <span>•</span>
            <span>{new Date(fileRecord.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleDownload}
          disabled={isDownloading || !downloadUrl}
        >
          {isDownloading ? (
            <Loader className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Download
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export const SecretFilesView = ({
  workspaceId,
  boardId,
  environment,
}: SecretFilesViewProps) => {
  const { projectKey } = useVault();
  const [isUploading, setIsUploading] = useState(false);

  const files = useQuery(api.vault.getSecretFiles, {
    workspaceId,
    boardId,
    environment,
  });

  const generateUploadUrlMutation = useMutation(api.upload.generateUploadUrl);
  const createSecretFileMutation = useMutation(api.vault.createSecretFile);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectKey) return;

    try {
      setIsUploading(true);
      toast.info(`Encrypting ${file.name} in browser...`);

      // 1. Read file buffer
      const buffer = await file.arrayBuffer();

      // 2. Encrypt file buffer with Project Key (AES-256-GCM)
      const { encryptedBlob, iv: fileIv } = await encryptSecretFile(
        buffer,
        projectKey,
      );

      // 3. Encrypt file name with Project Key
      const { ciphertext: encryptedFileName, iv: fileNameIv } =
        await encryptSecretString(file.name, projectKey);

      // 4. Generate storage upload URL
      const uploadUrl = await generateUploadUrlMutation();

      // 5. Upload raw ciphertext blob to storage
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: encryptedBlob,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload encrypted file to storage");
      }

      const { storageId } = await uploadRes.json();

      // 6. Record metadata in Convex
      await createSecretFileMutation({
        workspaceId,
        boardId,
        environment,
        encryptedFileName,
        fileNameIv,
        storageId,
        fileIv,
        fileSize: file.size,
        keyVersion: 1,
      });

      toast.success(
        `Successfully encrypted and uploaded ${file.name} to ${environment}!`,
      );
    } catch (err: any) {
      console.error("Upload secret file error:", err);
      toast.error(err.message || "Failed to upload secret file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">
            Secret Files & Certificates
          </h3>
          <p className="text-xs text-muted-foreground">
            Store `.env`, private keys (`.pem`, `.key`), SSL certificates, or
            configuration JSON files. Every file is encrypted before leaving
            your browser.
          </p>
        </div>

        <div>
          <label className="cursor-pointer">
            <Button
              size="sm"
              className="gap-1.5 shadow-sm"
              disabled={isUploading}
              asChild
            >
              <span>
                {isUploading ? (
                  <>
                    <Loader className="size-4 animate-spin" /> Encrypting...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" /> Upload Secret File
                  </>
                )}
              </span>
            </Button>
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {files === undefined ? (
        <div className="flex h-32 items-center justify-center">
          <Loader className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/10">
          <FileKey className="size-8 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-medium text-foreground">
            No secret files in {environment}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            Upload sensitive configuration files such as service accounts,
            private certificates, or credentials.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {files.map((file) => (
            <SecretFileCard
              key={file._id}
              fileRecord={file}
              projectKey={projectKey!}
            />
          ))}
        </div>
      )}
    </div>
  );
};
