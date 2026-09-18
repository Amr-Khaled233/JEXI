import { readUpload } from "@/lib/storage";

// Serves admin-uploaded images from UPLOAD_DIR. (Files added to /public after
// build aren't served by `next start`, hence this route.)
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (path.length !== 1) return new Response("Not found", { status: 404 });
  const file = await readUpload(path[0]);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
