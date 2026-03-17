import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateQRCodeDataURL, buildAssetQRData } from "@/lib/qr";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetCode: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assetCode } = await params;
  const asset = await db.asset.findUnique({
    where: { assetCode },
    include: { region: { include: { state: true } } },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
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
