import type { NextConfig } from "next";

// The Blob token looks like "vercel_blob_rw_<storeId>_<secret>"; images live at
// https://<storeid>.public.blob.vercel-storage.com. Only allow our own store.
const blobStoreId = process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([a-z0-9]+)_/i)?.[1];
const blobHost = blobStoreId ? `${blobStoreId.toLowerCase()}.public.blob.vercel-storage.com` : "*.public.blob.vercel-storage.com";

const securityHeaders = [
  // Stop the site (especially /admin) being framed by other sites (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // Browsers only honour HSTS over HTTPS, so this is harmless on localhost.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: {
    // When a Vercel Blob store is connected, admin image uploads go to Blob;
    // otherwise they're saved to UPLOAD_DIR (local development).
    NEXT_PUBLIC_BLOB_UPLOADS: process.env.BLOB_READ_WRITE_TOKEN ? "1" : "",
  },
  images: {
    // Bundled sample images, brand assets, and local uploads (served by the /uploads route).
    localPatterns: [{ pathname: "/samples/**" }, { pathname: "/brand/**" }, { pathname: "/uploads/**" }],
    // Admin uploads stored on Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: blobHost }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
