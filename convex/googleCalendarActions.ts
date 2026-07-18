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
        "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email",
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

    // Fetch user profile to get email
    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      },
    );

    let email = undefined;
    let color = undefined;

    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      email = profile.email;
      const colors = [
        "#4285F4",
        "#EA4335",
        "#FBBC05",
        "#34A853",
        "#8E24AA",
        "#F6BF26",
        "#039BE5",
        "#3F51B5",
      ];
      color = colors[Math.floor(Math.random() * colors.length)];
    }

    // Use secure internal mutation that accepts userId
    await ctx.runMutation(internal.googleAuth.storeGoogleTokensInternal, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || "",
      expiresAt: now + tokens.expires_in * 1000,
      scope: tokens.scope,
      userId: userId,
      email: email,
      color: color,
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
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get tokens array
    const tokensArray: any = await ctx.runQuery(api.googleAuth.getGoogleTokens);
    if (!tokensArray || tokensArray.length === 0) {
      throw new Error("Google Calendar not connected");
    }

    let tokens = tokensArray[0];
    if (args.email) {
      const match = tokensArray.find((t: any) => t.email === args.email);
      if (match) tokens = match;
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
        email: tokens.email,
        color: tokens.color,
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

    // Get tokens array
    const tokensArray: any = await ctx.runQuery(api.googleAuth.getGoogleTokens);
    if (!tokensArray || tokensArray.length === 0) {
      throw new Error("Google Calendar not connected");
    }

    let totalSynced = 0;
    let totalSkipped = 0;
    let totalEvents = 0;

    for (const tokens of tokensArray) {
      let accessToken: string = tokens.accessToken;

      // Refresh token if expired
      if (tokens.expiresAt < Date.now() + 60000) {
        if (!tokens.refreshToken) {
          console.warn(
            `Token expired for ${tokens.email} but no refresh token available. Skipping.`,
          );
          continue;
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
          console.error(`Failed to refresh token for ${tokens.email}.`);
          continue;
        }

        const newTokens: any = await refreshResponse.json();
        accessToken = newTokens.access_token;

        await ctx.runMutation(internal.googleAuth.storeGoogleTokens, {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || tokens.refreshToken,
          expiresAt: Date.now() + newTokens.expires_in * 1000,
          scope: newTokens.scope || tokens.scope,
          email: tokens.email,
          color: tokens.color,
        });
      }

      // Fetch calendar list to get all active calendars (Birthdays, etc.)
      const calListResponse = await fetch(
        `${CALENDAR_API_URL}/users/me/calendarList`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      let calendarsToSync = ["primary"];

      if (calListResponse.ok) {
        const calData: any = await calListResponse.json();
        if (calData.items && Array.isArray(calData.items)) {
          // Sync only calendars the user has actively selected/checked in Google UI
          calendarsToSync = calData.items
            .filter((c: any) => c.selected)
            .map((c: any) => c.id);

          // Fallback to primary if empty
          if (calendarsToSync.length === 0) calendarsToSync = ["primary"];
        }
      }

      const timeMin = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(); // Past 30 days
      const timeMax = new Date(
        Date.now() + 400 * 24 * 60 * 60 * 1000,
      ).toISOString(); // Future 400 days (1+ yr for birthdays)

      for (const calendarId of calendarsToSync) {
        const calendarResponse = await fetch(
          `${CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=2500&singleEvents=true&orderBy=startTime`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        if (!calendarResponse.ok) {
          console.error(
            `Failed to fetch Google Calendar events for ${tokens.email} from calendar ${calendarId}`,
          );
          continue;
        }

        const data: any = await calendarResponse.json();
        const googleEvents = data.items || [];
        totalEvents += googleEvents.length;

        for (const gEvent of googleEvents) {
          // Skip cancelled events
          if (gEvent.status === "cancelled") continue;

          const title = gEvent.summary || "(No title)";
          const description = gEvent.description || undefined;
          const location = gEvent.location || undefined;
          const meetLink = gEvent.hangoutLink || undefined;
          const googleEventId = gEvent.id;

          let startTime: number;
          let endTime: number;

          if (gEvent.start?.dateTime) {
            startTime = new Date(gEvent.start.dateTime).getTime();
          } else if (gEvent.start?.date) {
            startTime = new Date(gEvent.start.date).getTime();
          } else {
            continue;
          }

          if (gEvent.end?.dateTime) {
            endTime = new Date(gEvent.end.dateTime).getTime();
          } else if (gEvent.end?.date) {
            endTime = new Date(gEvent.end.date).getTime();
          } else {
            endTime = startTime + 60 * 60 * 1000;
          }

          const attendees = gEvent.attendees
            ? gEvent.attendees.map((a: any) => a.email).filter(Boolean)
            : undefined;

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
              googleAccountEmail: tokens.email,
            },
          );

          if (upsertResult.created) {
            totalSynced++;
          } else {
            totalSkipped++;
          }
        }
      }
    }

    return {
      synced: totalEvents,
      newlyCreated: totalSynced,
      skipped: totalSkipped,
      total: totalEvents,
    };
  },
});
