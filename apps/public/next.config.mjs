/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a minimal server bundle for the container image.
  output: 'standalone',
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  poweredByHeader: false,
  // Workspace packages ship TypeScript source, so Next compiles them with the app.
  transpilePackages: ['@ecom/ui', '@ecom/api-client', '@ecom/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: { optimizePackageImports: ['@ecom/ui'] },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
