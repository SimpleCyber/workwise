"use strict";
import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper for state
function generateState() {
  return (
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2)
  );
}

// Google OAuth configuration
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3";

export const generateAuthUrl = action({
  args: {
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;

    if (!clientId) {
      throw new Error("Missing Google Client ID");
    }

    const state = generateState();

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: args.redirectUri,
      response_type: "code",
      scope:
        "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
      access_type: "offline",
      prompt: "consent",
      state: state, // Secure random state
    });

    // Store state and redirectUri in DB
    await ctx.runMutation(internal.googleAuth.storeOAuthState, {
      state,
      userId,
      redirectUri: args.redirectUri,
    });

    const url = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    console.log("Generated Google OAuth URL:", url);
    return url;
  },
});

export const exchangeCode = action({
  args: {
    code: v.string(),
    state: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Look up the state to recover user ID and redirectUri
    const authRecord: any = await ctx.runMutation(
      internal.googleAuth.getUserByState,
      { state: args.state },
    );

    if (!authRecord) {
      throw new Error("Invalid or expired OAuth state");
    }

    const userId = authRecord.userId;
    const redirectUri = authRecord.redirectUri;

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Missing Google Client credentials or Redirect URI");
    }

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: args.code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const tokens = await response.json();
    const now = Date.now();

    // Use secure internal mutation that accepts userId
    await ctx.runMutation(internal.googleAuth.storeGoogleTokensInternal, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || "",
      expiresAt: now + tokens.expires_in * 1000,
      scope: tokens.scope,
      userId: userId,
    });

    return { success: true };
  },
});

export const createMeeting = action({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    attendees: v.optional(v.array(v.string())),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get tokens
    const tokens: any = await ctx.runQuery(api.googleAuth.getGoogleTokens);
    if (!tokens) {
      throw new Error("Google Calendar not connected");
    }

    let accessToken: string = tokens.accessToken;

    // Refresh token if expired
    if (tokens.expiresAt < Date.now() + 60000) {
      // Buffer of 1 minute
      if (!tokens.refreshToken) {
        throw new Error(
          "Token expired and no refresh token available. Please reconnect Google Calendar.",
        );
      }

      const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

      const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: tokens.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh token");
      }

      const newTokens: any = await refreshResponse.json();
      accessToken = newTokens.access_token;

      // Update tokens in DB
      await ctx.runMutation(internal.googleAuth.storeGoogleTokens, {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refreshToken, // Keep old refresh token if not rotated
        expiresAt: Date.now() + newTokens.expires_in * 1000,
        scope: newTokens.scope || tokens.scope,
      });
    }

    // Create event in Google Calendar
    const event = {
      summary: args.title,
      description: args.description,
      start: {
        dateTime: new Date(args.startTime).toISOString(),
      },
      end: {
        dateTime: new Date(args.endTime).toISOString(),
      },
      attendees: args.attendees?.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(7),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    const calendarResponse = await fetch(
      `${CALENDAR_API_URL}/calendars/primary/events?conferenceDataVersion=1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      },
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      throw new Error(`Failed to create Google Calendar event: ${errorText}`);
    }

    const googleEvent: any = await calendarResponse.json();

    // Save to Convex DB
    await ctx.runMutation((api.calendarEvents as any).createEvent, {
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      attendees: args.attendees,
      workspaceId: args.workspaceId,
      googleEventId: googleEvent.id,
      meetLink: googleEvent.hangoutLink,
      location: googleEvent.location,
    });

    return googleEvent;
  },
});
