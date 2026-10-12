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
  GitCommit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export const SecretItemRow = ({
  secret,
  projectKey,
  workspaceId,
  boardId,
  environment,
  isSelected,
  onToggleSelect,
}: SecretItemRowProps) => {
  const [decryptedKey, setDecryptedKey] = useState<string>("Loading...");
  const [decryptedValue, setDecryptedValue] = useState<string>("");
  const [decryptedComment, setDecryptedComment] = useState<string>("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editCommitMessage, setEditCommitMessage] = useState("");
  const [deleteCommitMessage, setDeleteCommitMessage] = useState("");
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

  const handleOpenDelete = () => {
    setDeleteCommitMessage("");
    setIsDeleting(true);
  };

  const confirmDelete = async () => {
    if (!deleteCommitMessage.trim()) {
      toast.error("Please enter a commit message / reason for deleting");
      return;
    }
    try {
      await deleteSecretMutation({
        id: secret._id,
        commitMessage: deleteCommitMessage.trim(),
      });
      setIsDeleting(false);
      toast.success(`Deleted ${decryptedKey}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete secret");
    }
  };

  const handleSaveEdit = async () => {
    if (!editCommitMessage.trim()) {
      toast.error("Please enter a commit message explaining this change");
      return;
    }

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
        commitMessage: editCommitMessage.trim(),
      });

      setDecryptedValue(editValue);
      setDecryptedComment(editComment);
      setIsEditing(false);
      setEditCommitMessage("");
      toast.success(`Updated ${decryptedKey}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update secret");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        className={`group flex items-center justify-between gap-4 rounded-lg border p-3.5 transition-all ${
          isSelected
            ? "border-primary/50 bg-primary/[0.04]"
            : "border-border/60 bg-card/60 hover:border-primary/30 hover:bg-card"
        }`}
      >
        <div className="flex flex-1 items-center gap-3 min-w-0">
          {onToggleSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="mr-0.5 shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          )}

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
            onClick={() => {
              setEditCommitMessage("");
              setIsEditing(true);
            }}
            title="Edit Secret"
          >
            <Edit2 className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={handleOpenDelete}
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

            {/* Commit Message (Required) */}
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
                placeholder="e.g. chore: rotate API secret"
                value={editCommitMessage}
                onChange={(e) => setEditCommitMessage(e.target.value)}
                className="h-8 text-xs bg-background"
                required
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
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving || !editCommitMessage.trim()}
            >
              {isSaving ? "Encrypting & Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Delete Secret: {decryptedKey}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will remove{" "}
              <strong className="text-foreground">{decryptedKey}</strong> from
              the{" "}
              <Badge
                variant="outline"
                className="font-mono capitalize text-[10px] px-1.5 py-0"
              >
                {environment}
              </Badge>{" "}
              environment. You can restore it later from Audit Logs.
            </p>

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
                placeholder="e.g. chore: remove deprecated legacy API key"
                value={deleteCommitMessage}
                onChange={(e) => setDeleteCommitMessage(e.target.value)}
                className="h-8 text-xs bg-background"
                autoFocus
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!deleteCommitMessage.trim()}
            >
              Confirm & Delete
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
