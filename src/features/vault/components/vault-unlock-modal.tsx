"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useVault } from "../context/vault-context";

export const VaultUnlockCard = () => {
  const {
    needsSetup,
    isProfileLoading,
    hasProjectKey,
    initializeVault,
    unlockVault,
    createInitialProjectKey,
  } = useVault();

  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isProfileLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passphrase.length < 8) {
      setError("Passphrase must be at least 8 characters long.");
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError("Passphrases do not match.");
      return;
    }

    setIsLoading(true);
    const success = await initializeVault(passphrase);
    setIsLoading(false);
    if (!success) {
      setError("Failed to initialize vault. Please try again.");
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passphrase) {
      setError("Please enter your vault passphrase.");
      return;
    }

    setIsLoading(true);
    const success = await unlockVault(passphrase);
    setIsLoading(false);
    if (!success) {
      setError("Incorrect passphrase or unable to decrypt project key.");
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-2xl backdrop-blur">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
            {needsSetup ? (
              <Sparkles className="size-7" />
            ) : (
              <Lock className="size-7" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {needsSetup
              ? "Setup Zero-Knowledge Vault"
              : "Unlock Project Secrets Vault"}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {needsSetup ? (
              <>
                Your secrets are encrypted client-side using{" "}
                <span className="font-semibold text-foreground">
                  AES-256-GCM & RSA-OAEP
                </span>
                . Even database administrators and the Workwise owner cannot
                decrypt your data.
              </>
            ) : (
              <>
                Enter your Vault Passphrase to decrypt the project keys and
                environment variables in your browser memory.
              </>
            )}
          </CardDescription>
        </CardHeader>

        {needsSetup ? (
          <form onSubmit={handleSetup}>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-500 flex items-start gap-2 border border-amber-500/20">
                <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> There is no "forgot password". If
                  you lose this passphrase, your encrypted secrets cannot be
                  recovered by anyone.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passphrase">Master Vault Passphrase</Label>
                <div className="relative">
                  <Input
                    id="passphrase"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter at least 8 characters..."
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassphrase">Confirm Passphrase</Label>
                <Input
                  id="confirmPassphrase"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat passphrase..."
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="text-xs text-destructive font-medium">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full gap-2 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Generating Keys..."
                ) : (
                  <>
                    <KeyRound className="size-4" /> Initialize My Vault
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleUnlock}>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2 border border-primary/10">
                <ShieldCheck className="size-4 shrink-0 text-primary mt-0.5" />
                <span>
                  Keys remain strictly inside your browser's private memory and
                  are automatically cleared when you leave or lock the vault.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passphrase">Vault Passphrase</Label>
                <div className="relative">
                  <Input
                    id="passphrase"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your master passphrase..."
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs text-destructive font-medium">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full gap-2 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Decrypting..."
                ) : (
                  <>
                    <KeyRound className="size-4" /> Unlock Vault
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};
