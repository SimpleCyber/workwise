import { type NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = req.nextUrl.origin;

  if (error) {
    console.error("Google OAuth Error:", error);
    return NextResponse.redirect(`${baseUrl}/?error=${error}`);
  }

  if (!code || !state) {
    console.error("Missing code or state in callback");
    return NextResponse.redirect(`${baseUrl}/`);
  }

  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Call the exchangeCode action
    const result = await convex.action(api.googleCalendarActions.exchangeCode, {
      code,
      state,
    });

    const returnTo = result?.returnTo || "/";

    // Success! Redirect back to previous URL or home
    return NextResponse.redirect(`${baseUrl}${returnTo === "/" ? "" : returnTo}`);
  } catch (err: any) {
    console.error("Failed to exchange code in API route:", err);
    return NextResponse.redirect(`${baseUrl}/?error=exchange_failed`);
  }
}
