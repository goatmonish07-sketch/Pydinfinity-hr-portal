import type { NextConfig } from "next";

/** Static export: `npm run build` writes a plain HTML/JS site to ./out for Cloudflare Pages. */
const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
