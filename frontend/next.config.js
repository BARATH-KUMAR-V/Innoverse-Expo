/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
             key: 'Permissions-Policy',
             value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ]
      }
    ]
  },

  images: {
    remotePatterns: [
      // Supabase Storage public URLs (https://<project-ref>.supabase.co/...)
      { protocol: "https", hostname: "*.supabase.co" },
      // Only used by the optional local sample data in db/seed.sql - safe to
      // remove once real teams replace the sample ones.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};


module.exports = nextConfig;
