// Image storage. The MVP writes to a local directory (UPLOAD_DIR, default ./uploads)
// served by src/app/uploads/[...path]/route.ts. To move to S3/Cloudinary, replace
// saveImage() so it uploads there and returns the public URL, then add that host to
// images.remotePatterns in next.config.ts.
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export function uploadDir() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || "./uploads");
}

export async function saveImage(file: File): Promise<string> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error(`Unsupported image type: ${file.type || "unknown"}`);
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 8 MB or smaller.");

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

/** Resolve an upload by file name, refusing anything that escapes the upload dir. */
export async function readUpload(name: string): Promise<{ data: Buffer; type: string } | null> {
  if (!/^[\w.-]+$/.test(name)) return null;
  const ext = name.split(".").pop()?.toLowerCase();
  const type = Object.entries(IMAGE_TYPES).find(([, e]) => e === ext)?.[0];
  if (!type) return null;
  try {
    return { data: await readFile(path.join(uploadDir(), name)), type };
  } catch {
    return null;
  }
}
