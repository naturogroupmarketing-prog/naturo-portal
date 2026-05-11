import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateQRCodeDataURL, buildAssetQRData } from "@/lib/qr";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetCode: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`qr:${session.user.id}`, RATE_LIMITS.api);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { assetCode } = await params;
  const asset = await db.asset.findUnique({
    where: { assetCode },
    include: { region: { include: { state: true } } },
  });

  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Org isolation — user can only access assets from their org
  if (asset.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Region isolation for branch managers
  if (session.user.role === "BRANCH_MANAGER" && session.user.regionId && asset.regionId !== session.user.regionId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const qrData = await generateQRCodeDataURL(buildAssetQRData(assetCode));

  return NextResponse.json({
    assetCode: asset.assetCode,
    name: asset.name,
    category: asset.category,
    state: asset.region.state.name,
    region: asset.region.name,
    status: asset.status,
    qrCodeDataURL: qrData,
  });
}
