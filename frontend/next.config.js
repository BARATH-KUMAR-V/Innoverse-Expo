/** @type {import('next').NextConfig} */

// BACKEND_URL is a server-only env var (no NEXT_PUBLIC_ prefix) used by the
// Vercel rewrite proxy below. Set it in Vercel's environment variables:
//   BACKEND_URL = https://innoverse-expo.onrender.com
// Locally it falls back to http://localhost:4000 so no change is needed in
// .env.local for the rewrite config.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

const nextConfig = {
  reactStrictMode: true,

  // Proxy every backend path through Vercel so session cookies are first-party
  // (vercel.app domain) rather than third-party (onrender.com). This is the
  // recommended solution for cross-site session cookie problems in modern
  // browsers that block SameSite=None cookies by default.
  async rewrites() {
    return [
      { source: "/auth/:path*",    destination: `${BACKEND_URL}/auth/:path*` },
      { source: "/teams/:path*",   destination: `${BACKEND_URL}/teams/:path*` },
      { source: "/votes/:path*",   destination: `${BACKEND_URL}/votes/:path*` },
      { source: "/admin/:path*",   destination: `${BACKEND_URL}/admin/:path*` },
      { source: "/results/:path*", destination: `${BACKEND_URL}/results/:path*` },
      { source: "/health",         destination: `${BACKEND_URL}/health` },
    ];
  },

  images: {
    remotePatterns: [
      // Supabase Storage public URLs (https://<project-ref>.supabase.co/...)
      { protocol: "https", hostname: "*.supabase.co" },
      // Only used by the optional local sample data in backend/src/db/seed.sql -
      // safe to remove once real teams replace the sample ones.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;
