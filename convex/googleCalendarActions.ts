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
    returnTo: v.optional(v.string()),
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
      // @ts-ignore
      returnTo: args.returnTo,
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

    return { success: true, returnTo: authRecord.returnTo };
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

// ---- Sync Google Calendar Events ----

export const syncGoogleCalendar = action({
  args: {
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

      await ctx.runMutation(internal.googleAuth.storeGoogleTokens, {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refreshToken,
        expiresAt: Date.now() + newTokens.expires_in * 1000,
        scope: newTokens.scope || tokens.scope,
      });
    }

    // Fetch events from Google Calendar (next 90 days + past 30 days)
    const timeMin = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const timeMax = new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const calendarResponse = await fetch(
      `${CALENDAR_API_URL}/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=250&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      throw new Error(`Failed to fetch Google Calendar events: ${errorText}`);
    }

    const data: any = await calendarResponse.json();
    const googleEvents = data.items || [];

    let synced = 0;
    let skipped = 0;

    for (const gEvent of googleEvents) {
      // Skip cancelled events
      if (gEvent.status === "cancelled") continue;

      const title = gEvent.summary || "(No title)";
      const description = gEvent.description || undefined;
      const location = gEvent.location || undefined;
      const meetLink = gEvent.hangoutLink || undefined;
      const googleEventId = gEvent.id;

      // Parse start/end times — handle both dateTime and date (all-day events)
      let startTime: number;
      let endTime: number;

      if (gEvent.start?.dateTime) {
        startTime = new Date(gEvent.start.dateTime).getTime();
      } else if (gEvent.start?.date) {
        startTime = new Date(gEvent.start.date).getTime();
      } else {
        continue; // Skip events without valid time
      }

      if (gEvent.end?.dateTime) {
        endTime = new Date(gEvent.end.dateTime).getTime();
      } else if (gEvent.end?.date) {
        endTime = new Date(gEvent.end.date).getTime();
      } else {
        endTime = startTime + 60 * 60 * 1000; // Default 1 hour
      }

      // Extract attendees
      const attendees = gEvent.attendees
        ? gEvent.attendees.map((a: any) => a.email).filter(Boolean)
        : undefined;

      // Upsert: check if this googleEventId already exists
      const upsertResult = await ctx.runMutation(
        internal.calendarEvents.upsertGoogleEvent,
        {
          googleEventId,
          title,
          description,
          startTime,
          endTime,
          location,
          meetLink,
          attendees,
          userId,
          workspaceId: args.workspaceId,
        },
      );

      if (upsertResult.created) {
        synced++;
      } else {
        skipped++;
      }
    }

    return { synced, skipped, total: googleEvents.length };
  },
});
