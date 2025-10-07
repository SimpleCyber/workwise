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
]);

export default convexAuthNextjsMiddleware((req) => {
  if (!isPublicPage(req) && !isAuthenticatedNextjs()) {
    return nextjsMiddlewareRedirect(req, "/home");
  }

  if (
    isPublicPage(req) &&
    isAuthenticatedNextjs() &&
    req.nextUrl.pathname === "/auth"
  ) {
    return nextjsMiddlewareRedirect(req, "/");
  }
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
