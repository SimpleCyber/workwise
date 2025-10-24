// Google Calendar API integration utilities

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
}

export class GoogleCalendarAPI {
  private accessToken: string;
  private refreshToken: string;
  private onTokenRefresh?: (tokens: {
    accessToken: string;
    refreshToken?: string;
  }) => void;

  constructor(
    accessToken: string,
    refreshToken?: string,
    onTokenRefresh?: (tokens: {
      accessToken: string;
      refreshToken?: string;
    }) => void,
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken || "";
    this.onTokenRefresh = onTokenRefresh;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: this.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh access token");
    }

    const tokens = await response.json();
    this.accessToken = tokens.access_token;

    // Call the callback if provided
    if (this.onTokenRefresh) {
      this.onTokenRefresh({
        accessToken: this.accessToken,
        refreshToken: tokens.refresh_token || this.refreshToken,
      });
    }
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    let response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // If token is expired, try to refresh it once
    if (response.status === 401 && this.refreshToken) {
      console.log("Access token expired, attempting refresh...");
      await this.refreshAccessToken();

      // Retry the request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch {
        // Ignore JSON parsing errors
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async createEvent(event: GoogleCalendarEvent): Promise<any> {
    return this.makeRequest(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        body: JSON.stringify(event),
      },
    );
  }

  async updateEvent(
    eventId: string,
    event: Partial<GoogleCalendarEvent>,
  ): Promise<any> {
    return this.makeRequest(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "PATCH",
        body: JSON.stringify(event),
      },
    );
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.makeRequest(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
      },
    );
  }

  async listEvents(timeMin: string, timeMax: string): Promise<any> {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
    });

    return this.makeRequest(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    );
  }

  // Verify the token is valid and has calendar scope
  async verifyAuth(): Promise<boolean> {
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v1/tokeninfo",
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
