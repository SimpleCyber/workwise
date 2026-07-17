import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  isAuthenticatedNextjs,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublicPage = createRouteMatcher([
  "/auth",
  "/home",
  "/api/calendar/google",
  "/api/calendar/google(.*)",
  "/calendar-callback(.*)",
]);

const convexMiddleware = convexAuthNextjsMiddleware(
  async (req) => {
    const isPublic = isPublicPage(req);
    const isAuthenticated = await isAuthenticatedNextjs();

    if (!isPublic && !isAuthenticated) {
      return nextjsMiddlewareRedirect(req, "/home");
    }

    if (isPublic && isAuthenticated && req.nextUrl.pathname === "/auth") {
      return nextjsMiddlewareRedirect(req, "/");
    }
  },
  {
    cookieConfig: {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    } as any,
  },
);

import { NextResponse, type NextRequest } from "next/server";

export default function middleware(req: NextRequest, ev: any) {
  // Explicitly ignore our custom Google Calendar OAuth callback
  // so Convex Auth doesn't incorrectly intercept the code=... param
  if (req.nextUrl.pathname.startsWith("/api/calendar")) {
    return NextResponse.next();
  }
  return convexMiddleware(req, ev);
}

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
