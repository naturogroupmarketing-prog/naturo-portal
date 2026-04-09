import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { isR2Configured, uploadToR2 } from "@/lib/r2";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit uploads — 20 per minute per user
  const rl = await rateLimit(`upload:${session.user.id}`, RATE_LIMITS.upload);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait." },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: JPEG, PNG, WebP, HEIC" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudflare R2 if configured, otherwise fallback to base64
    if (isR2Configured()) {
      const url = await uploadToR2(buffer, file.type, folder);
      return NextResponse.json({ url });
    }

    // Fallback: base64 data URL (stores in DB — not recommended for production)
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;
    return NextResponse.json({ url: dataUrl });
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 400 });
  }
}
