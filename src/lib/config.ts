export const googleConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ].join(" "),
};

export const validateGoogleConfig = () => {
  if (!googleConfig.clientId) {
    console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
  }
  if (!googleConfig.apiKey) {
    console.warn("NEXT_PUBLIC_GOOGLE_API_KEY is not set");
  }
};
