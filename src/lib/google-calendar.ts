// Google Calendar API integration utilities

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: string;
  }>;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
    }>;
  };
  location?: string;
}

class GoogleCalendarAPI {
  private accessToken: string | null = null;

  async authenticate(): Promise<boolean> {
    try {
      // Initialize Google Auth
      if (typeof window !== "undefined" && window.gapi) {
        await new Promise((resolve) => {
          window.gapi.load("auth2", resolve);
        });

        const authInstance = window.gapi.auth2.getAuthInstance();
        if (!authInstance) {
          await window.gapi.auth2.init({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            scope:
              "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
          });
        }

        const auth = window.gapi.auth2.getAuthInstance();
        const user = await auth.signIn();
        this.accessToken = user.getAuthResponse().access_token;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Authentication failed:", error);
      return false;
    }
  }

  async getEvents(
    timeMin?: string,
    timeMax?: string,
  ): Promise<GoogleCalendarEvent[]> {
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    try {
      const params = new URLSearchParams({
        access_token: this.accessToken,
        singleEvents: "true",
        orderBy: "startTime",
        ...(timeMin && { timeMin }),
        ...(timeMax && { timeMax }),
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Failed to get events:", error);
      return [];
    }
  }

  async createEvent(event: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    attendees?: string[];
    location?: string;
    includeMeet?: boolean;
  }): Promise<GoogleCalendarEvent | null> {
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    try {
      const eventData: Partial<GoogleCalendarEvent> = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: event.location,
      };

      if (event.attendees && event.attendees.length > 0) {
        eventData.attendees = event.attendees.map((email) => ({ email }));
      }

      if (event.includeMeet) {
        eventData.conferenceData = {
          createRequest: {
            requestId: Math.random().toString(36).substring(2, 15),
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        };
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&access_token=${this.accessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to create event:", error);
      return null;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?access_token=${this.accessToken}`,
        {
          method: "DELETE",
        },
      );

      return response.ok;
    } catch (error) {
      console.error("Failed to delete event:", error);
      return false;
    }
  }

  async updateEvent(
    eventId: string,
    updates: Partial<GoogleCalendarEvent>,
  ): Promise<GoogleCalendarEvent | null> {
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?access_token=${this.accessToken}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to update event:", error);
      return null;
    }
  }
}

export const googleCalendarAPI = new GoogleCalendarAPI();

// Utility functions
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString();
};

export const parseAPIDate = (dateString: string): Date => {
  return new Date(dateString);
};
