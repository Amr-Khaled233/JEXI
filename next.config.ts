import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local sources: bundled sample images, brand assets, and admin uploads
    // (served by the /uploads route handler). Add remotePatterns here if you
    // move uploads to S3/Cloudinary.
    localPatterns: [
      { pathname: "/samples/**" },
      { pathname: "/brand/**" },
      { pathname: "/uploads/**" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
