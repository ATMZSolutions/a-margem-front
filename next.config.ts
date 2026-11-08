import type { NextConfig } from "next";

const supabaseImageHost = (() => {
  try {
    const url = new URL(process.env.SUPABASE_URL ?? "");
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return {
      protocol: url.protocol.slice(0, -1) as "http" | "https",
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: supabaseImageHost ? [supabaseImageHost] : [] },
  async redirects() {
    return [
      ...Array.from({ length: 9 }, (_, index) => ({
        source: `/home/img${index + 1}.jpg`,
        destination: `/home/img${index + 1}.webp`,
        permanent: true,
      })),
      {
        source: "/grito-de-guerra.svg",
        destination: "/grito-de-guerra.webp",
        permanent: true,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ...(process.env.NODE_ENV === "production"
        ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
        : []),
    ];

    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
