/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rightful-perch-882.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "fortunate-mole-938.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
