import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Store Google OAuth tokens
export const storeGoogleTokens = mutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scope: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

    // Check if tokens already exist
    const existingTokens = await ctx.db
      .query("googleTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique()

    const now = Date.now()

    if (existingTokens) {
      // Update existing tokens
      await ctx.db.patch(existingTokens._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope,
        updatedAt: now,
      })
      return existingTokens._id
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
      })
      return tokenId
    }
  },
})

// Get Google OAuth tokens for current user
export const getGoogleTokens = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return null
    }

    const tokens = await ctx.db
      .query("googleTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique()

    return tokens
  },
})

// Check if user has valid Google tokens
export const hasGoogleAuth = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return false
    }

    const tokens = await ctx.db
      .query("googleTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique()

    return !!tokens && tokens.expiresAt > Date.now()
  },
})

// Delete Google OAuth tokens (disconnect)
export const deleteGoogleTokens = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

    const tokens = await ctx.db
      .query("googleTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique()

    if (tokens) {
      await ctx.db.delete(tokens._id)
    }

    return { success: true }
  },
})
