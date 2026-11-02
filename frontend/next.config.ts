import type { NextConfig } from "next";

/**
 * The browser talks to the API at NEXT_PUBLIC_API_URL.
 *
 * When that variable is empty the frontend calls its own origin and Next.js
 * proxies /api/* to the backend below, which avoids CORS entirely. This is handy
 * for single-host previews. When it is set to a full URL the browser calls the
 * API directly and the backend's CORS_ORIGINS must include this site.
 */
const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8010";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
