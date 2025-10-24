export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
    {
      domain: "https://accounts.google.com",
      applicationID: "convex",
    },
    {
      domain: "https://github.com",
      applicationID: "convex",
    },
  ],
};
