import { type NextRequest, NextResponse } from "next/server";

function getClientId() {
  return process.env.GOOGLE_CLIENT_ID || "";
}

function getClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET || "";
}

function getRedirectUri(req: NextRequest) {
  const origin = new URL(req.url).origin;
  return `${origin}/api/calendar/google`;
}

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const origin = url.origin;

  const action = searchParams.get("action");
  const error = searchParams.get("error");
  const code = searchParams.get("code");

  const CLIENT_ID = getClientId();
  const CLIENT_SECRET = getClientSecret();
  const REDIRECT_URI = getRedirectUri(req);
  console.log("Redirect URI being used:", REDIRECT_URI);

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET" },
      { status: 500 },
    );
  }

  if (action === "login") {
    const state =
      globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const authorizeUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    authorizeUrl.searchParams.set("client_id", CLIENT_ID);
    authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", SCOPES);
    authorizeUrl.searchParams.set("access_type", "offline");
    authorizeUrl.searchParams.set("prompt", "consent");
    authorizeUrl.searchParams.set("include_granted_scopes", "true");
    authorizeUrl.searchParams.set("state", state);

    const res = NextResponse.redirect(authorizeUrl.toString());
    res.cookies.set("google_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https://"),
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });
    return res;
  }

  if (error) {
    const appUrl = new URL(origin);
    appUrl.searchParams.set("error", error);
    return NextResponse.redirect(appUrl.toString());
  }

  const state = searchParams.get("state");
  const cookieState = req.cookies.get("google_oauth_state")?.value ?? null;
  if (state && cookieState && state !== cookieState) {
    const appUrl = new URL(origin);
    appUrl.searchParams.set("error", "state_mismatch");
    const res = NextResponse.redirect(appUrl.toString());
    // clear cookie
    res.cookies.set("google_oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  }

  if (!code) {
    const appUrl = new URL(origin);
    appUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(appUrl.toString());
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      // console.log("[v0] token exchange failed:", tokenResponse.status, body)
      throw new Error(
        `Failed to exchange code for tokens: ${tokenResponse.status} ${body}`,
      );
    }

    const tokens = await tokenResponse.json();
    const expiresAt = Date.now() + (tokens.expires_in ?? 0) * 1000;

    const redirectUrl = new URL(origin);
    redirectUrl.searchParams.set("google_auth", "success");
    if (tokens.access_token) {
      redirectUrl.searchParams.set("access_token", tokens.access_token);
    }
    if (tokens.refresh_token) {
      redirectUrl.searchParams.set("refresh_token", tokens.refresh_token);
    } else {
      redirectUrl.searchParams.set("missing_refresh_token", "1");
    }
    redirectUrl.searchParams.set("expires_at", String(expiresAt));

    const res = NextResponse.redirect(redirectUrl.toString());
    // clear state cookie after successful exchange
    res.cookies.set("google_oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  } catch (e: any) {
    const appUrl = new URL(origin);
    appUrl.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(appUrl.toString());
  }
}
