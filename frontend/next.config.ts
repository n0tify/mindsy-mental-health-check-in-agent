import type { NextConfig } from "next";

/**
 * The browser talks to the API at NEXT_PUBLIC_API_URL.
 *
 * When that variable is empty the frontend calls its own origin and Next.js
 * proxies /api/* to API_PROXY_TARGET, which avoids CORS entirely. When the
 * public URL is set, the browser calls the API directly and backend CORS must
 * include this site.
 */
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const configuredProxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/+$/, "");
const apiProxyTarget =
  configuredProxyTarget ||
  (process.env.NODE_ENV === "production"
    ? undefined
    : "http://127.0.0.1:8010");
const isProductionRuntime =
  process.env.NODE_ENV === "production" &&
  !process.argv.some((argument) => argument === "lint");

if (isProductionRuntime) {
  const productionApiUrl = publicApiUrl || apiProxyTarget;
  if (!productionApiUrl) {
    throw new Error(
      "Set API_PROXY_TARGET for production builds when NEXT_PUBLIC_API_URL is empty.",
    );
  }

  let parsedApiUrl: URL;
  try {
    parsedApiUrl = new URL(productionApiUrl);
  } catch {
    throw new Error("Production API configuration must be an absolute HTTPS URL.");
  }

  const hostname = parsedApiUrl.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    parsedApiUrl.protocol !== "https:" ||
    parsedApiUrl.username ||
    parsedApiUrl.password ||
    parsedApiUrl.search ||
    parsedApiUrl.hash ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    /^127\./.test(hostname)
  ) {
    throw new Error(
      "Production API configuration must use a public HTTPS URL without embedded credentials.",
    );
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
