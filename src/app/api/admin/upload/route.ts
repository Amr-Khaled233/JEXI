import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { saveImage } from "@/lib/storage";

export async function POST(request: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
  if (files.length > 10) return NextResponse.json({ error: "Upload up to 10 images at a time." }, { status: 400 });

  try {
    const urls = await Promise.all(files.map(saveImage));
    return NextResponse.json({ urls });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed." }, { status: 400 });
  }
}
