"use client";

import React, { useState } from "react";
import {
  Users,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Clock,
  UserCheck,
  Loader,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { importPublicKey, wrapProjectKey } from "@/lib/crypto/vault-crypto";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useVault } from "../context/vault-context";

interface MemberAccessModalProps {
  workspaceId: any;
  boardId?: any;
}

export const MemberAccessModal = ({
  workspaceId,
  boardId,
}: MemberAccessModalProps) => {
  const { projectKey } = useVault();
  const [open, setOpen] = useState(false);
  const [grantingUserId, setGrantingUserId] = useState<string | null>(null);

  const membersStatus = useQuery(api.vault.getProjectMembersVaultStatus, {
    workspaceId,
    boardId,
  });

  const grantKeyMutation = useMutation(api.vault.grantProjectVaultKey);

  const handleGrantAccess = async (member: any) => {
    if (!projectKey) {
      toast.error("Your vault must be unlocked to share keys");
      return;
    }

    if (!member.publicKey) {
      toast.error("User does not have an active public key profile");
      return;
    }

    try {
      setGrantingUserId(member.userId);
      toast.info(`Encrypting Project Key for ${member.name}...`);

      // 1. Import member's public key
      const memberPubKey = await importPublicKey(member.publicKey);

      // 2. Wrap project key with member's public key (RSA-OAEP)
      const encryptedProjectKey = await wrapProjectKey(
        projectKey,
        memberPubKey,
      );

      // 3. Save wrapped envelope in Convex
      await grantKeyMutation({
        workspaceId,
        boardId,
        targetUserId: member.userId,
        encryptedProjectKey,
        keyVersion: 1,
      });

      toast.success(`Granted zero-knowledge secret access to ${member.name}!`);
    } catch (err: any) {
      console.error("Grant key error:", err);
      toast.error(err.message || "Failed to grant key access");
    } finally {
      setGrantingUserId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Users className="size-3.5" /> Team Key Sharing
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded bg-primary/10 text-primary">
              <KeyRound className="size-4" />
            </div>
            <DialogTitle>Team Key Sharing & Access Management</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Infisical-style Zero-Knowledge sharing: The Project Key is wrapped
            directly with each team member&apos;s personal public key. The server
            never sees the key in plaintext.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {membersStatus === undefined ? (
            <div className="flex h-36 items-center justify-center">
              <Loader className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : membersStatus.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No members found in this workspace.
            </div>
          ) : (
            <div className="divide-y divide-border/50 max-h-96 overflow-y-auto pr-1">
              {membersStatus.map((member) => (
                <div
                  key={member.memberId}
                  className="flex items-center justify-between py-3 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9">
                      <AvatarImage src={member.image} />
                      <AvatarFallback>
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {member.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 px-1 capitalize"
                        >
                          {member.role}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {member.hasKeyAccess ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 text-xs py-1">
                        <CheckCircle2 className="size-3" /> Key Granted
                      </Badge>
                    ) : member.hasVaultProfile ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1.5 h-8 text-xs"
                        onClick={() => handleGrantAccess(member)}
                        disabled={grantingUserId === member.userId}
                      >
                        {grantingUserId === member.userId ? (
                          <>
                            <Loader className="size-3 animate-spin" />{" "}
                            Sharing...
                          </>
                        ) : (
                          <>
                            <KeyRound className="size-3" /> Grant Access
                          </>
                        )}
                      </Button>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-amber-500/80 border-amber-500/30 gap-1 text-xs py-1"
                        title="Member must initialize their vault identity first"
                      >
                        <Clock className="size-3" /> Profile Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground flex items-start gap-2 border border-border/40">
            <ShieldCheck className="size-4 shrink-0 text-primary mt-0.5" />
            <span>
              <strong>Cryptographic Guarantee:</strong> When you click &quot;Grant
              Access&quot;, your browser encrypts the project key with that member&apos;s
              asymmetric public key. Only their private key can decrypt it.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
