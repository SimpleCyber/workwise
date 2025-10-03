import { type NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI =`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?error=${error}`,
    );
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID || "",
        client_secret: GOOGLE_CLIENT_SECRET || "",
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenResponse.json();

    // Store tokens in a cookie or session
    // For now, redirect with tokens in URL (not secure for production)
    const redirectUrl = new URL(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    );
    redirectUrl.searchParams.set("google_auth", "success");
    redirectUrl.searchParams.set("access_token", tokens.access_token);
    redirectUrl.searchParams.set("refresh_token", tokens.refresh_token);
    redirectUrl.searchParams.set(
      "expires_at",
      String(Date.now() + tokens.expires_in * 1000),
    );

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?error=auth_failed`,
    );
  }
}
