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

export default convexAuthNextjsMiddleware(
  async (req) => {
    const isPublic = isPublicPage(req);
    const isAuthenticated = await isAuthenticatedNextjs();

    console.log(`Middleware: ${req.nextUrl.pathname}`, {
      isPublic,
      isAuthenticated,
      cookies: req.cookies.getAll().map((c) => c.name),
    });

    if (!isPublic && !isAuthenticated) {
      console.log(
        "Middleware: Redirecting to /home due to unauthenticated access",
      );
      return nextjsMiddlewareRedirect(req, "/home");
    }

    if (isPublic && isAuthenticated && req.nextUrl.pathname === "/auth") {
      return nextjsMiddlewareRedirect(req, "/");
    }
  },
  {
    cookieConfig: {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "None",
      secure: true,
    } as any,
  },
);

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
