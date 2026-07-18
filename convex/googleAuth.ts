import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Store Google OAuth tokens
export const storeGoogleTokens = internalMutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scope: v.string(),
    email: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if tokens already exist
    let existingTokens = null;

    if (args.email) {
      existingTokens = await ctx.db
        .query("googleTokens")
        .withIndex("by_user_email", (q) =>
          q.eq("userId", userId).eq("email", args.email),
        )
        .unique();
    } else {
      const tokens = await ctx.db
        .query("googleTokens")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();
      if (tokens.length > 0) existingTokens = tokens[0];
    }

    const now = Date.now();

    if (existingTokens) {
      // Update existing tokens
      await ctx.db.patch(existingTokens._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope,
        updatedAt: now,
      });
      return existingTokens._id;
    } else {
      // Create new tokens
      const tokenId = await ctx.db.insert("googleTokens", {
        userId: userId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope,
        email: args.email,
        color: args.color,
        createdAt: now,
        updatedAt: now,
      });
      return tokenId;
    }
  },
});

export const storeGoogleTokensInternal = internalMutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scope: v.string(),
    userId: v.id("users"),
    email: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if tokens already exist
    let existingTokens = null;

    if (args.email) {
      existingTokens = await ctx.db
        .query("googleTokens")
        .withIndex("by_user_email", (q) =>
          q.eq("userId", args.userId).eq("email", args.email),
        )
        .unique();
    } else {
      const tokens = await ctx.db
        .query("googleTokens")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .collect();
      if (tokens.length > 0) existingTokens = tokens[0];
    }

    const now = Date.now();

    if (existingTokens) {
      // Update existing tokens
      await ctx.db.patch(existingTokens._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope,
        updatedAt: now,
      });
      return existingTokens._id;
    } else {
      // Create new tokens
      const tokenId = await ctx.db.insert("googleTokens", {
        userId: args.userId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope,
        email: args.email,
        color: args.color,
        createdAt: now,
        updatedAt: now,
      });
      return tokenId;
    }
  },
});

// Get Google OAuth tokens for current user
export const getGoogleTokens = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const tokens = await ctx.db
      .query("googleTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    return tokens;
  },
});

// Check if user has valid Google tokens
export const hasGoogleAuth = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const tokens = await ctx.db
      .query("googleTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    return tokens.some((t) => t.expiresAt > Date.now() || !!t.refreshToken);
  },
});

export const createEvent = internalMutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
  },
});

// Delete Google OAuth tokens (disconnect)
export const deleteGoogleTokens = mutation({
  args: {
    tokenId: v.optional(v.id("googleTokens")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.tokenId) {
      const token = await ctx.db.get(args.tokenId);
      if (token && token.userId === userId) {
        await ctx.db.delete(args.tokenId);
      }
    } else {
      const tokens = await ctx.db
        .query("googleTokens")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();

      for (const t of tokens) {
        await ctx.db.delete(t._id);
      }
    }

    return { success: true };
  },
});

// Store OAuth state for secure callback
export const storeOAuthState = internalMutation({
  args: {
    state: v.string(),
    userId: v.id("users"),
    redirectUri: v.string(),
    returnTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("authStates", {
      state: args.state,
      userId: args.userId,
      redirectUri: args.redirectUri,
      // @ts-ignore - Temporary bypass to allow codegen to update schema
      returnTo: args.returnTo,
      createdAt: Date.now(),
    });
  },
});

// Get user by OAuth state (for callback)
export const getUserByState = internalMutation({
  args: {
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const authState = await ctx.db
      .query("authStates")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .unique();

    if (!authState) {
      return null;
    }

    // Optional: Delete state after use (one-time use)
    await ctx.db.delete(authState._id);

    return {
      userId: authState.userId,
      redirectUri: authState.redirectUri,
      // @ts-ignore
      returnTo: authState.returnTo,
    };
  },
});
