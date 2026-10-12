import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Helper to authenticate user and verify workspace membership
async function requireWorkspaceMember(
  ctx: any,
  workspaceId: Id<"workspaces">,
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const member = await ctx.db
    .query("members")
    .withIndex("by_workspace_id_user_id", (q: any) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId),
    )
    .unique();

  if (!member) {
    throw new Error("You are not a member of this workspace");
  }

  return { userId, member };
}

// ==========================================
// User Vault Profile (Identity Layer)
// ==========================================

export const getUserVaultProfile = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) return null;

    return await ctx.db
      .query("userVaultProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", currentUserId))
      .unique();
  },
});

export const getUserPublicKey = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userVaultProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) return null;

    return {
      userId: profile.userId,
      publicKey: profile.publicKey,
    };
  },
});

export const initUserVaultProfile = mutation({
  args: {
    publicKey: v.string(),
    encryptedPrivateKey: v.string(),
    privateKeyIv: v.string(),
    salt: v.string(),
    iterations: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("userVaultProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        publicKey: args.publicKey,
        encryptedPrivateKey: args.encryptedPrivateKey,
        privateKeyIv: args.privateKeyIv,
        salt: args.salt,
        iterations: args.iterations,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("userVaultProfiles", {
      userId,
      publicKey: args.publicKey,
      encryptedPrivateKey: args.encryptedPrivateKey,
      privateKeyIv: args.privateKeyIv,
      salt: args.salt,
      iterations: args.iterations,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ==========================================
// Project Vault Key Envelope
// ==========================================

export const getProjectVaultKey = query({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.optional(v.union(v.id("projectBoards"), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const boardId = args.boardId || undefined;
    if (boardId) {
      const boardKey = await ctx.db
        .query("projectVaultKeys")
        .withIndex("by_project_user", (q) =>
          q
            .eq("workspaceId", args.workspaceId)
            .eq("boardId", boardId)
            .eq("userId", userId),
        )
        .unique();
      if (boardKey) return boardKey;
    }

    // Fall back to workspace-level key
    return await ctx.db
      .query("projectVaultKeys")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .filter((q) => q.eq(q.field("boardId"), undefined))
      .unique();
  },
});

export const initProjectVaultKey = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.optional(v.union(v.id("projectBoards"), v.null())),
    encryptedProjectKey: v.string(),
    keyVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireWorkspaceMember(ctx, args.workspaceId);
    const boardId = args.boardId || undefined;

    // Check if key already exists for this user
    const existing = boardId
      ? await ctx.db
          .query("projectVaultKeys")
          .withIndex("by_project_user", (q) =>
            q
              .eq("workspaceId", args.workspaceId)
              .eq("boardId", boardId)
              .eq("userId", userId),
          )
          .unique()
      : await ctx.db
          .query("projectVaultKeys")
          .withIndex("by_workspace_user", (q) =>
            q.eq("workspaceId", args.workspaceId).eq("userId", userId),
          )
          .filter((q) => q.eq(q.field("boardId"), undefined))
          .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        encryptedProjectKey: args.encryptedProjectKey,
        keyVersion: args.keyVersion,
      });
      return existing._id;
    }

    return await ctx.db.insert("projectVaultKeys", {
      workspaceId: args.workspaceId,
      boardId,
      userId,
      encryptedProjectKey: args.encryptedProjectKey,
      keyVersion: args.keyVersion,
      grantedById: userId,
      createdAt: Date.now(),
    });
  },
});

export const grantProjectVaultKey = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.optional(v.union(v.id("projectBoards"), v.null())),
    targetUserId: v.id("users"),
    encryptedProjectKey: v.string(),
    keyVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId: granterId } = await requireWorkspaceMember(
      ctx,
      args.workspaceId,
    );
    const boardId = args.boardId || undefined;

    // Verify target is also a member of the workspace
    const targetMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", args.targetUserId),
      )
      .unique();

    if (!targetMember) {
      throw new Error("Target user is not a member of this workspace");
    }

    // Check if key envelope already exists
    const existing = boardId
      ? await ctx.db
          .query("projectVaultKeys")
          .withIndex("by_project_user", (q) =>
            q
              .eq("workspaceId", args.workspaceId)
              .eq("boardId", boardId)
              .eq("userId", args.targetUserId),
          )
          .unique()
      : await ctx.db
          .query("projectVaultKeys")
          .withIndex("by_workspace_user", (q) =>
            q.eq("workspaceId", args.workspaceId).eq("userId", args.targetUserId),
          )
          .filter((q) => q.eq(q.field("boardId"), undefined))
          .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        encryptedProjectKey: args.encryptedProjectKey,
        keyVersion: args.keyVersion,
        grantedById: granterId,
      });
      return existing._id;
    }

    return await ctx.db.insert("projectVaultKeys", {
      workspaceId: args.workspaceId,
      boardId,
      userId: args.targetUserId,
      encryptedProjectKey: args.encryptedProjectKey,
      keyVersion: args.keyVersion,
      grantedById: granterId,
      createdAt: Date.now(),
    });
  },
});

export const getProjectMembersVaultStatus = query({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.optional(v.union(v.id("projectBoards"), v.null())),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const boardId = args.boardId || undefined;

    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .collect();

    const result = [];
    for (const member of members) {
      const user = await ctx.db.get(member.userId);
      if (!user) continue;

      const profile = await ctx.db
        .query("userVaultProfiles")
        .withIndex("by_user_id", (q) => q.eq("userId", member.userId))
        .unique();

      const keyEnvelope = boardId
        ? await ctx.db
            .query("projectVaultKeys")
            .withIndex("by_project_user", (q) =>
              q
                .eq("workspaceId", args.workspaceId)
                .eq("boardId", boardId)
                .eq("userId", member.userId),
            )
            .unique()
        : await ctx.db
            .query("projectVaultKeys")
            .withIndex("by_workspace_user", (q) =>
              q.eq("workspaceId", args.workspaceId).eq("userId", member.userId),
            )
            .filter((q) => q.eq(q.field("boardId"), undefined))
            .unique();

      result.push({
        memberId: member._id,
        userId: user._id,
        name: user.name || "Unknown",
        email: user.email || "",
        image: user.image,
        role: member.role,
        hasVaultProfile: !!profile,
        publicKey: profile?.publicKey || null,
        hasKeyAccess: !!keyEnvelope,
        grantedAt: keyEnvelope?.createdAt || null,
      });
    }

    return result;
  },
});

// ==========================================
// Encrypted Secrets (Key-Value Pairs)
// ==========================================

export const getSecrets = query({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.optional(v.union(v.id("projectBoards"), v.null())),
    environment: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const boardId = args.boardId || undefined;

    if (boardId) {
      return await ctx.db
        .query("vaultSecrets")
        .withIndex("by_project_env", (q) =>
          q
            .eq("workspaceId", args.workspaceId)
            .eq("boardId", boardId)
            .eq("environment", args.environment),
        )
        .collect();
    }

    return await ctx.db
      .query("vaultSecrets")
      .withIndex("by_workspace_env", (q) =>
        q
          .eq("workspaceId", args.workspaceId)
          .eq("environment", args.environment),
      )
      .filter((q) => q.eq(q.field("boardId"), undefined))
      .collect();
  },
});

export const setSecret = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.optional(v.union(v.id("projectBoards"), v.null())),
    environment: v.string(),
    secretKeyHash: v.string(),
    encryptedKey: v.string(),
    keyIv: v.string(),
    encryptedValue: v.string(),
    valueIv: v.string(),
    encryptedComment: v.optional(v.string()),
    commentIv: v.optional(v.string()),
    keyVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireWorkspaceMember(ctx, args.workspaceId);
    const boardId = args.boardId || undefined;

    // Search for existing secret by blind index
    const existing = await ctx.db
      .query("vaultSecrets")
      .withIndex("by_key_hash", (q) =>
        q
          .eq("workspaceId", args.workspaceId)
          .eq("boardId", boardId)
          .eq("environment", args.environment)
          .eq("secretKeyHash", args.secretKeyHash),
      )
      .unique();

    const user = await ctx.db.get(userId);
    const now = Date.now();
    const version = existing ? (existing.keyVersion || 1) + 1 : 1;

    if (existing) {
      await ctx.db.patch(existing._id, {
        encryptedKey: args.encryptedKey,
        keyIv: args.keyIv,
        encryptedValue: args.encryptedValue,
        valueIv: args.valueIv,
        encryptedComment: args.encryptedComment,
        commentIv: args.commentIv,
        keyVersion: args.keyVersion,
        updatedById: userId,
        updatedAt: now,
      });

      // Audit log entry for update
      await ctx.db.insert("vaultSecretLogs", {
        workspaceId: args.workspaceId,
        boardId,
        secretId: existing._id,
        secretKeyHash: args.secretKeyHash,
        encryptedKey: args.encryptedKey,
        keyIv: args.keyIv,
        encryptedValue: args.encryptedValue,
        valueIv: args.valueIv,
        environment: args.environment,
        action: "update",
        userId,
        userName: user?.name,
        userEmail: user?.email,
        userImage: user?.image,
        timestamp: now,
        version,
      });

      return existing._id;
    }

    const newSecretId = await ctx.db.insert("vaultSecrets", {
      workspaceId: args.workspaceId,
      boardId,
      environment: args.environment,
      secretKeyHash: args.secretKeyHash,
      encryptedKey: args.encryptedKey,
      keyIv: args.keyIv,
      encryptedValue: args.encryptedValue,
      valueIv: args.valueIv,
      encryptedComment: args.encryptedComment,
      commentIv: args.commentIv,
      keyVersion: args.keyVersion,
      createdById: userId,
      updatedById: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Audit log entry for creation
    await ctx.db.insert("vaultSecretLogs", {
      workspaceId: args.workspaceId,
      boardId,
      secretId: newSecretId,
      secretKeyHash: args.secretKeyHash,
      encryptedKey: args.encryptedKey,
      keyIv: args.keyIv,
      encryptedValue: args.encryptedValue,
      valueIv: args.valueIv,
      environment: args.environment,
      action: "create",
      userId,
      userName: user?.name,
      userEmail: user?.email,
      userImage: user?.image,
      timestamp: now,
      version: 1,
    });

    return newSecretId;
  },
});

export const setBatchSecrets = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.optional(v.union(v.id("projectBoards"), v.null())),
    secrets: v.array(
      v.object({
        environment: v.string(),
        secretKeyHash: v.string(),
        encryptedKey: v.string(),
        keyIv: v.string(),
        encryptedValue: v.string(),
        valueIv: v.string(),
        encryptedComment: v.optional(v.string()),
        commentIv: v.optional(v.string()),
        keyVersion: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireWorkspaceMember(ctx, args.workspaceId);
    const user = await ctx.db.get(userId);
    const boardId = args.boardId || undefined;
    const now = Date.now();
    const ids: any[] = [];

    for (const item of args.secrets) {
      const existing = await ctx.db
        .query("vaultSecrets")
        .withIndex("by_key_hash", (q) =>
          q
            .eq("workspaceId", args.workspaceId)
            .eq("boardId", boardId)
            .eq("environment", item.environment)
            .eq("secretKeyHash", item.secretKeyHash),
        )
        .unique();

      const version = existing ? (existing.keyVersion || 1) + 1 : 1;
      let secretId;

      if (existing) {
        await ctx.db.patch(existing._id, {
          encryptedKey: item.encryptedKey,
          keyIv: item.keyIv,
          encryptedValue: item.encryptedValue,
          valueIv: item.valueIv,
          encryptedComment: item.encryptedComment,
          commentIv: item.commentIv,
          keyVersion: item.keyVersion,
          updatedById: userId,
          updatedAt: now,
        });
        secretId = existing._id;
      } else {
        secretId = await ctx.db.insert("vaultSecrets", {
          workspaceId: args.workspaceId,
          boardId,
          environment: item.environment,
          secretKeyHash: item.secretKeyHash,
          encryptedKey: item.encryptedKey,
          keyIv: item.keyIv,
          encryptedValue: item.encryptedValue,
          valueIv: item.valueIv,
          encryptedComment: item.encryptedComment,
          commentIv: item.commentIv,
          keyVersion: item.keyVersion,
          createdById: userId,
          updatedById: userId,
          createdAt: now,
          updatedAt: now,
        });
      }

      await ctx.db.insert("vaultSecretLogs", {
        workspaceId: args.workspaceId,
        boardId,
        secretId,
        secretKeyHash: item.secretKeyHash,
        encryptedKey: item.encryptedKey,
        keyIv: item.keyIv,
        encryptedValue: item.encryptedValue,
        valueIv: item.valueIv,
        environment: item.environment,
        action: existing ? "update" : "create",
        userId,
        userName: user?.name,
        userEmail: user?.email,
        userImage: user?.image,
        timestamp: now,
        version,
      });

      ids.push(secretId);
    }

    return ids;
  },
});

export const deleteSecret = mutation({
  args: {
    id: v.id("vaultSecrets"),
  },
  handler: async (ctx, args) => {
    const secret = await ctx.db.get(args.id);
    if (!secret) return;

    const { userId } = await requireWorkspaceMember(ctx, secret.workspaceId);
    const user = await ctx.db.get(userId);

    // Record audit log before deletion
    await ctx.db.insert("vaultSecretLogs", {
      workspaceId: secret.workspaceId,
      boardId: secret.boardId,
      secretId: secret._id,
      secretKeyHash: secret.secretKeyHash,
      encryptedKey: secret.encryptedKey,
      keyIv: secret.keyIv,
      encryptedValue: secret.encryptedValue,
      valueIv: secret.valueIv,
      environment: secret.environment,
      action: "delete",
      userId,
      userName: user?.name,
      userEmail: user?.email,
      userImage: user?.image,
      timestamp: Date.now(),
      version: (secret.keyVersion || 1) + 1,
    });

    await ctx.db.delete(args.id);
  },
});

export const getSecretLogs = query({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.optional(v.union(v.id("projectBoards"), v.null())),
    environment: v.optional(v.string()),
    secretKeyHash: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const limit = args.limit || 100;

    const logs = await ctx.db
      .query("vaultSecretLogs")
      .withIndex("by_workspace_time", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .order("desc")
      .take(limit);

    return logs.filter((log) => {
      if (args.environment && log.environment !== args.environment) return false;
      if (args.secretKeyHash && log.secretKeyHash !== args.secretKeyHash) return false;
      return true;
    });
  },
});

export const rollbackSecret = mutation({
  args: {
    logId: v.id("vaultSecretLogs"),
  },
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.logId);
    if (!log) throw new Error("Log entry not found");

    const { userId } = await requireWorkspaceMember(ctx, log.workspaceId);
    const user = await ctx.db.get(userId);
    const now = Date.now();

    const existing = await ctx.db
      .query("vaultSecrets")
      .withIndex("by_key_hash", (q) =>
        q
          .eq("workspaceId", log.workspaceId)
          .eq("boardId", log.boardId)
          .eq("environment", log.environment)
          .eq("secretKeyHash", log.secretKeyHash),
      )
      .unique();

    let secretId;
    const nextVersion = (existing?.keyVersion || log.version || 1) + 1;

    if (existing) {
      await ctx.db.patch(existing._id, {
        encryptedKey: log.encryptedKey,
        keyIv: log.keyIv,
        encryptedValue: log.encryptedValue,
        valueIv: log.valueIv,
        keyVersion: nextVersion,
        updatedById: userId,
        updatedAt: now,
      });
      secretId = existing._id;
    } else {
      secretId = await ctx.db.insert("vaultSecrets", {
        workspaceId: log.workspaceId,
        boardId: log.boardId,
        environment: log.environment,
        secretKeyHash: log.secretKeyHash,
        encryptedKey: log.encryptedKey,
        keyIv: log.keyIv,
        encryptedValue: log.encryptedValue,
        valueIv: log.valueIv,
        keyVersion: nextVersion,
        createdById: userId,
        updatedById: userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("vaultSecretLogs", {
      workspaceId: log.workspaceId,
      boardId: log.boardId,
      secretId,
      secretKeyHash: log.secretKeyHash,
      encryptedKey: log.encryptedKey,
      keyIv: log.keyIv,
      encryptedValue: log.encryptedValue,
      valueIv: log.valueIv,
      environment: log.environment,
      action: "rollback",
      userId,
      userName: user?.name,
      userEmail: user?.email,
      userImage: user?.image,
      timestamp: now,
      version: nextVersion,
    });

    return secretId;
  },
});

// ==========================================
// Encrypted Secret Files
// ==========================================

export const getSecretFiles = query({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.optional(v.union(v.id("projectBoards"), v.null())),
    environment: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const boardId = args.boardId || undefined;

    if (boardId) {
      return await ctx.db
        .query("vaultSecretFiles")
        .withIndex("by_project_env", (q) =>
          q
            .eq("workspaceId", args.workspaceId)
            .eq("boardId", boardId)
            .eq("environment", args.environment),
        )
        .collect();
    }

    return await ctx.db
      .query("vaultSecretFiles")
      .withIndex("by_workspace_env", (q) =>
        q
          .eq("workspaceId", args.workspaceId)
          .eq("environment", args.environment),
      )
      .filter((q) => q.eq(q.field("boardId"), undefined))
      .collect();
  },
});

export const createSecretFile = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.optional(v.union(v.id("projectBoards"), v.null())),
    environment: v.string(),
    encryptedFileName: v.string(),
    fileNameIv: v.string(),
    encryptedFileDescription: v.optional(v.string()),
    storageId: v.id("_storage"),
    fileIv: v.string(),
    fileSize: v.number(),
    keyVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireWorkspaceMember(ctx, args.workspaceId);
    const boardId = args.boardId || undefined;

    return await ctx.db.insert("vaultSecretFiles", {
      workspaceId: args.workspaceId,
      boardId,
      environment: args.environment,
      encryptedFileName: args.encryptedFileName,
      fileNameIv: args.fileNameIv,
      encryptedFileDescription: args.encryptedFileDescription,
      storageId: args.storageId,
      fileIv: args.fileIv,
      fileSize: args.fileSize,
      keyVersion: args.keyVersion,
      createdById: userId,
      createdAt: Date.now(),
    });
  },
});

export const deleteSecretFile = mutation({
  args: {
    id: v.id("vaultSecretFiles"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file) return;

    await requireWorkspaceMember(ctx, file.workspaceId);
    try {
      await ctx.storage.delete(file.storageId);
    } catch {
      // Storage file might already be removed
    }
    await ctx.db.delete(args.id);
  },
});

export const getSecretFileDownloadUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// ==========================================
// Custom Environments Management
// ==========================================

export const getCustomEnvironments = query({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.optional(v.union(v.id("projectBoards"), v.null())),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const boardId = args.boardId || undefined;

    if (boardId) {
      return await ctx.db
        .query("vaultCustomEnvironments")
        .withIndex("by_workspace_board", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("boardId", boardId),
        )
        .collect();
    }

    return await ctx.db
      .query("vaultCustomEnvironments")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("boardId"), undefined))
      .collect();
  },
});

export const addCustomEnvironment = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.optional(v.union(v.id("projectBoards"), v.null())),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const boardId = args.boardId || undefined;
    const normalizedName = args.name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");

    if (!normalizedName) {
      throw new Error("Invalid environment name");
    }

    // Check if already exists
    const existing = boardId
      ? await ctx.db
          .query("vaultCustomEnvironments")
          .withIndex("by_workspace_board", (q) =>
            q.eq("workspaceId", args.workspaceId).eq("boardId", boardId),
          )
          .filter((q) => q.eq(q.field("name"), normalizedName))
          .first()
      : await ctx.db
          .query("vaultCustomEnvironments")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
          .filter((q) =>
            q.and(
              q.eq(q.field("boardId"), undefined),
              q.eq(q.field("name"), normalizedName),
            ),
          )
          .first();

    if (existing) return existing._id;

    return await ctx.db.insert("vaultCustomEnvironments", {
      workspaceId: args.workspaceId,
      boardId,
      name: normalizedName,
      createdAt: Date.now(),
    });
  },
});

export const deleteCustomEnvironment = mutation({
  args: {
    id: v.id("vaultCustomEnvironments"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return;
    await requireWorkspaceMember(ctx, item.workspaceId);
    await ctx.db.delete(args.id);
  },
});

