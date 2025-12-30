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
  "/calendar-callback",
]);

export default convexAuthNextjsMiddleware(
  async (req) => {
    if (!isPublicPage(req) && !(await isAuthenticatedNextjs())) {
      return nextjsMiddlewareRedirect(req, "/home");
    }

    if (
      isPublicPage(req) &&
      (await isAuthenticatedNextjs()) &&
      req.nextUrl.pathname === "/auth"
    ) {
      return nextjsMiddlewareRedirect(req, "/");
    }
  },
  {
    cookieConfig: {
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  },
);

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
