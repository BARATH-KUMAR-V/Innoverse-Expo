/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
