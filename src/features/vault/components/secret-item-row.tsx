"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Edit2,
  Lock,
  MessageSquare,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  decryptSecretString,
  encryptSecretString,
  computeBlindHash,
} from "@/lib/crypto/vault-crypto";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SecretLogsView } from "./secret-logs-view";

interface SecretItemRowProps {
  secret: any;
  projectKey: CryptoKey;
  workspaceId: any;
  boardId?: any;
  environment: string;
}

export const SecretItemRow = ({
  secret,
  projectKey,
  workspaceId,
  boardId,
  environment,
}: SecretItemRowProps) => {
  const [decryptedKey, setDecryptedKey] = useState<string>("Loading...");
  const [decryptedValue, setDecryptedValue] = useState<string>("");
  const [decryptedComment, setDecryptedComment] = useState<string>("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editComment, setEditComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const deleteSecretMutation = useMutation(api.vault.deleteSecret);
  const setSecretMutation = useMutation(api.vault.setSecret);

  useEffect(() => {
    let isMounted = true;
    async function decrypt() {
      try {
        const keyName = await decryptSecretString(
          secret.encryptedKey,
          secret.keyIv,
          projectKey,
        );
        const val = await decryptSecretString(
          secret.encryptedValue,
          secret.valueIv,
          projectKey,
        );
        let comment = "";
        if (secret.encryptedComment && secret.commentIv) {
          comment = await decryptSecretString(
            secret.encryptedComment,
            secret.commentIv,
            projectKey,
          );
        }

        if (isMounted) {
          setDecryptedKey(keyName);
          setDecryptedValue(val);
          setDecryptedComment(comment);
          setEditValue(val);
          setEditComment(comment);
        }
      } catch (err) {
        console.error("Failed to decrypt secret:", err);
        if (isMounted) {
          setDecryptedKey("[Decryption Error]");
          setDecryptedValue("");
        }
      }
    }
    decrypt();
    return () => {
      isMounted = false;
    };
  }, [secret, projectKey]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(decryptedValue);
      setIsCopied(true);
      toast.success(`Copied ${decryptedKey} to clipboard`);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete secret ${decryptedKey}?`)) {
      try {
        await deleteSecretMutation({ id: secret._id });
        toast.success(`Deleted ${decryptedKey}`);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete secret");
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      const encVal = await encryptSecretString(editValue, projectKey);
      let encComment;
      if (editComment.trim()) {
        encComment = await encryptSecretString(editComment.trim(), projectKey);
      }

      await setSecretMutation({
        workspaceId,
        boardId,
        environment,
        secretKeyHash: secret.secretKeyHash,
        encryptedKey: secret.encryptedKey,
        keyIv: secret.keyIv,
        encryptedValue: encVal.ciphertext,
        valueIv: encVal.iv,
        encryptedComment: encComment?.ciphertext,
        commentIv: encComment?.iv,
        keyVersion: secret.keyVersion,
      });

      setDecryptedValue(editValue);
      setDecryptedComment(editComment);
      setIsEditing(false);
      toast.success(`Updated ${decryptedKey}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update secret");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="group flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-card/60 p-3.5 transition-all hover:border-primary/30 hover:bg-card">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Lock className="size-4" />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-foreground tracking-tight select-all">
                {decryptedKey}
              </span>
              {decryptedComment && (
                <span className="truncate text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="size-3 shrink-0" />
                  {decryptedComment}
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground tracking-wider select-all truncate max-w-md">
                {isRevealed
                  ? decryptedValue || "<empty>"
                  : "••••••••••••••••••••••••"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsRevealed(!isRevealed)}
            title={isRevealed ? "Hide Value" : "Reveal Value"}
          >
            {isRevealed ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            title="Copy to Clipboard"
          >
            {isCopied ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsHistoryOpen(true)}
            title="View Revision History & Retrieve Old Keys"
          >
            <History className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsEditing(true)}
            title="Edit Secret"
          >
            <Edit2 className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            title="Delete Secret"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Secret Value: {decryptedKey}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Secret Value</Label>
              <Textarea
                rows={3}
                className="font-mono text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Note / Description (Optional)</Label>
              <Input
                placeholder="e.g. Production Stripe key for checkout"
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Encrypting & Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Revision History & Retrieval Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="size-5 text-primary" /> Revision History:{" "}
              {decryptedKey}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <SecretLogsView
              workspaceId={workspaceId}
              boardId={boardId}
              projectKey={projectKey}
              filterKeyHash={secret.secretKeyHash}
              onCloseModal={() => setIsHistoryOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
