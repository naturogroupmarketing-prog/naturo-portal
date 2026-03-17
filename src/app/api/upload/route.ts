import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";

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

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await uploadFile(file, "uploads");
    return NextResponse.json({ url: result.url, filename: result.key });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
