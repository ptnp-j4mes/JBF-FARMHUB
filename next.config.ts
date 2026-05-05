import type { NextConfig } from 'next';

const apiServer = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!apiServer) {
  throw new Error('Missing required env: NEXT_PUBLIC_API_URL');
}

if (!apiServer.startsWith('http://') && !apiServer.startsWith('https://')) {
  throw new Error('NEXT_PUBLIC_API_URL must start with http:// or https://');
}

const normalizedApiServer = apiServer.replace(/\/$/, '');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
  async rewrites() {
    return {
      beforeFiles: [
        {
          // Proxy non-auth API calls to backend before catch-all routes.
          // Keep API routes that have dedicated Next handlers so they can add
          // request-specific auth/header normalization first.
          source:
            '/api/:path((?!auth(?:/|$)|Operations/Analytics/overview(?:/|$)|Operations/Dashboard/command-center(?:/|$)).*)',
          destination: `${normalizedApiServer}/api/:path`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
