import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getAdmin } from "@/lib/auth";
import { IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/storage";

function validPath(pathname: string) {
  return pathname.startsWith("jexi/") && !pathname.includes("..");
}

// Issues short-lived tokens so the admin's browser can upload images straight
// to Vercel Blob (bypassing the 4.5 MB serverless request limit).
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  // Token requests come from the admin's browser: check the session before anything else.
  // (Upload-completed callbacks come from Vercel and are verified by handleUpload itself.)
  if (body.type === "blob.generate-client-token") {
    if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!validPath(body.payload.pathname)) return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await getAdmin())) throw new Error("Unauthorized");
        if (!validPath(pathname)) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: Object.keys(IMAGE_TYPES),
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[blob upload]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 400 });
  }
}
