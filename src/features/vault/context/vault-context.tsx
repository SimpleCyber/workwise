"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { toast } from "sonner";
import {
  deriveUserEncryptionKey,
  generateUserKeyPair,
  exportPublicKey,
  encryptAndExportPrivateKey,
  decryptPrivateKey,
  generateProjectMasterKey,
  wrapProjectKey,
  unwrapProjectKey,
  generateRandomSalt,
} from "@/lib/crypto/vault-crypto";

interface VaultContextType {
  isUnlocked: boolean;
  needsSetup: boolean;
  hasProjectKey: boolean;
  isProfileLoading: boolean;
  userPrivateKey: CryptoKey | null;
  projectKey: CryptoKey | null;
  publicKeySpki: string | null;
  unlockVault: (passphrase: string) => Promise<boolean>;
  initializeVault: (passphrase: string) => Promise<boolean>;
  createInitialProjectKey: () => Promise<boolean>;
  lockVault: () => void;
}

const VaultContext = createContext<VaultContextType | null>(null);

interface VaultProviderProps {
  children: React.ReactNode;
  workspaceId: Id<"workspaces">;
  boardId?: Id<"projectBoards"> | null;
}

export const VaultProvider = ({
  children,
  workspaceId,
  boardId,
}: VaultProviderProps) => {
  const normalizedBoardId = boardId || undefined;
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userPrivateKey, setUserPrivateKey] = useState<CryptoKey | null>(null);
  const [projectKey, setProjectKey] = useState<CryptoKey | null>(null);
  const [cachedPassphrase, setCachedPassphrase] = useState<string | null>(null);

  // Queries
  const userProfile = useQuery(api.vault.getUserVaultProfile, {});
  const projectKeyEnvelope = useQuery(api.vault.getProjectVaultKey, {
    workspaceId,
    boardId: normalizedBoardId,
  });

  // Mutations
  const initProfileMutation = useMutation(api.vault.initUserVaultProfile);
  const initProjectKeyMutation = useMutation(api.vault.initProjectVaultKey);

  const isProfileLoading = userProfile === undefined;
  const needsSetup = userProfile === null;
  const hasProjectKey = !!projectKeyEnvelope;
  const publicKeySpki = userProfile?.publicKey || null;

  // Manual lock
  const lockVault = useCallback(() => {
    setIsUnlocked(false);
    setUserPrivateKey(null);
    setProjectKey(null);
    setCachedPassphrase(null);
    toast.info("Vault locked. Cryptographic keys cleared from memory.");
  }, []);

  // Initialize a brand new zero-knowledge vault profile
  const initializeVault = useCallback(
    async (passphrase: string): Promise<boolean> => {
      try {
        if (!passphrase || passphrase.length < 8) {
          toast.error("Passphrase must be at least 8 characters long");
          return false;
        }

        // 1. Generate user RSA keypair
        const keyPair = await generateUserKeyPair();
        const salt = generateRandomSalt(16);
        const iterations = 100000;

        // 2. Derive UEK & encrypt private key
        const uek = await deriveUserEncryptionKey(passphrase, salt, iterations);
        const { encryptedPrivateKey, iv } = await encryptAndExportPrivateKey(
          keyPair.privateKey,
          uek,
        );
        const publicKeySpki = await exportPublicKey(keyPair.publicKey);

        // 3. Save profile to Convex
        await initProfileMutation({
          publicKey: publicKeySpki,
          encryptedPrivateKey,
          privateKeyIv: iv,
          salt,
          iterations,
        });

        // 4. Generate project key if none exists
        const masterProjectKey = await generateProjectMasterKey();
        const encryptedProjectKey = await wrapProjectKey(
          masterProjectKey,
          keyPair.publicKey,
        );

        await initProjectKeyMutation({
          workspaceId,
          boardId,
          encryptedProjectKey,
          keyVersion: 1,
        });

        // Store in memory
        setUserPrivateKey(keyPair.privateKey);
        setProjectKey(masterProjectKey);
        setCachedPassphrase(passphrase);
        setIsUnlocked(true);

        toast.success("Zero-Knowledge Vault initialized successfully!");
        return true;
      } catch (err: any) {
        console.error("Failed to initialize vault:", err);
        toast.error(err.message || "Failed to initialize vault");
        return false;
      }
    },
    [workspaceId, boardId, initProfileMutation, initProjectKeyMutation],
  );

  // If user already has profile, but workspace has no project key yet
  const createInitialProjectKey = useCallback(async (): Promise<boolean> => {
    if (!userPrivateKey || !publicKeySpki) {
      toast.error("Vault must be unlocked first");
      return false;
    }
    try {
      const { importPublicKey } = await import("@/lib/crypto/vault-crypto");
      const pubKey = await importPublicKey(publicKeySpki);
      const newProjectKey = await generateProjectMasterKey();
      const encryptedProjectKey = await wrapProjectKey(newProjectKey, pubKey);

      await initProjectKeyMutation({
        workspaceId,
        boardId: normalizedBoardId,
        encryptedProjectKey,
        keyVersion: 1,
      });

      setProjectKey(newProjectKey);
      toast.success("Project Vault Key generated and secured!");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to generate project key");
      return false;
    }
  }, [
    userPrivateKey,
    publicKeySpki,
    workspaceId,
    normalizedBoardId,
    initProjectKeyMutation,
  ]);

  // Unlock existing vault using passphrase
  const unlockVault = useCallback(
    async (passphrase: string): Promise<boolean> => {
      try {
        if (!userProfile) {
          toast.error("Vault profile not found");
          return false;
        }

        // 1. Derive UEK
        const uek = await deriveUserEncryptionKey(
          passphrase,
          userProfile.salt,
          userProfile.iterations,
        );

        // 2. Decrypt private key
        let privKey: CryptoKey;
        try {
          privKey = await decryptPrivateKey(
            userProfile.encryptedPrivateKey,
            userProfile.privateKeyIv,
            uek,
          );
        } catch {
          toast.error("Incorrect passphrase. Decryption failed.");
          return false;
        }

        setUserPrivateKey(privKey);
        setCachedPassphrase(passphrase);

        // 3. Decrypt project key if envelope exists
        if (projectKeyEnvelope) {
          try {
            const pKey = await unwrapProjectKey(
              projectKeyEnvelope.encryptedProjectKey,
              privKey,
            );
            setProjectKey(pKey);
            setIsUnlocked(true);
            toast.success("Vault unlocked successfully!");
            return true;
          } catch (e: any) {
            console.error("Failed to unwrap project key:", e);
            toast.error("Failed to decrypt project key envelope");
            return false;
          }
        } else {
          // Profile unlocked, but this project hasn't been initialized with a key yet
          setIsUnlocked(true);
          toast.success("Vault identity unlocked (Project key pending).");
          return true;
        }
      } catch (err: any) {
        console.error("Unlock error:", err);
        toast.error("Failed to unlock vault");
        return false;
      }
    },
    [userProfile, projectKeyEnvelope],
  );

  // If already unlocked and a project key envelope appears later, try unwrapping it
  useEffect(() => {
    if (userPrivateKey && projectKeyEnvelope && !projectKey) {
      unwrapProjectKey(projectKeyEnvelope.encryptedProjectKey, userPrivateKey)
        .then((pKey) => {
          setProjectKey(pKey);
        })
        .catch((err) => {
          console.error("Auto unwrap error:", err);
        });
    }
  }, [userPrivateKey, projectKeyEnvelope, projectKey]);

  const value = useMemo(
    () => ({
      isUnlocked,
      needsSetup,
      hasProjectKey,
      isProfileLoading,
      userPrivateKey,
      projectKey,
      publicKeySpki,
      unlockVault,
      initializeVault,
      createInitialProjectKey,
      lockVault,
    }),
    [
      isUnlocked,
      needsSetup,
      hasProjectKey,
      isProfileLoading,
      userPrivateKey,
      projectKey,
      publicKeySpki,
      unlockVault,
      initializeVault,
      createInitialProjectKey,
      lockVault,
    ],
  );

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
};
