import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" } : {}),
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
