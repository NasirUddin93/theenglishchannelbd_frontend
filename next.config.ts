import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
const backendUrlObj = new URL(backendUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: backendUrlObj.protocol.replace(':', '') as 'http' | 'https',
        hostname: backendUrlObj.hostname,
        port: backendUrlObj.port,
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;