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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if tokens already exist
    const existingTokens = await ctx.db
      .query("googleTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

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
  },
  handler: async (ctx, args) => {
    // Check if tokens already exist
    const existingTokens = await ctx.db
      .query("googleTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();

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
      .unique();

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
      .unique();

    return !!tokens && tokens.expiresAt > Date.now();
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
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const tokens = await ctx.db
      .query("googleTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (tokens) {
      await ctx.db.delete(tokens._id);
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("authStates", {
      state: args.state,
      userId: args.userId,
      redirectUri: args.redirectUri,
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

    return { userId: authState.userId, redirectUri: authState.redirectUri };
  },
});
