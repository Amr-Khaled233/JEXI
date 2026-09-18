import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // When a Vercel Blob store is connected, admin image uploads go to Blob;
    // otherwise they're saved to UPLOAD_DIR (local development).
    NEXT_PUBLIC_BLOB_UPLOADS: process.env.BLOB_READ_WRITE_TOKEN ? "1" : "",
  },
  images: {
    // Bundled sample images, brand assets, and local uploads (served by the /uploads route).
    localPatterns: [{ pathname: "/samples/**" }, { pathname: "/brand/**" }, { pathname: "/uploads/**" }],
    // Admin uploads stored on Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
