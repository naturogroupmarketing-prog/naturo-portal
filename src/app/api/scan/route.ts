import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim();
  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  const organizationId = session.user.organizationId!;

  // 1. Try as asset code
  const asset = await db.asset.findFirst({
    where: { assetCode: code, organizationId },
    select: {
      id: true, name: true, assetCode: true, status: true, category: true,
      imageUrl: true,
      region: { select: { name: true } },
      assignments: {
        where: { isActive: true },
        select: { id: true, user: { select: { name: true } } },
        take: 1,
      },
    },
  });

  if (asset) {
    const assigned = asset.assignments[0];
    return NextResponse.json({
      found: true,
      type: "asset",
      id: asset.id,
      name: asset.name,
      code: asset.assetCode,
      status: asset.status,
      category: asset.category,
      imageUrl: asset.imageUrl,
      regionName: asset.region.name,
      assignedTo: assigned?.user?.name || null,
      actions: buildAssetActions(asset.status),
    });
  }

  // 2. Try as consumable ID or name (partial)
  const consumable = await db.consumable.findFirst({
    where: {
      organizationId,
      isActive: true,
      OR: [{ id: code }, { name: { contains: code, mode: "insensitive" } }],
    },
    select: {
      id: true, name: true, unitType: true, quantityOnHand: true,
      minimumThreshold: true, imageUrl: true,
      region: { select: { name: true } },
    },
  });

  if (consumable) {
    return NextResponse.json({
      found: true,
      type: "consumable",
      id: consumable.id,
      name: consumable.name,
      unitType: consumable.unitType,
      quantityOnHand: consumable.quantityOnHand,
      minimumThreshold: consumable.minimumThreshold,
      imageUrl: consumable.imageUrl,
      regionName: consumable.region.name,
      actions: [
        { label: "Issue to Staff", href: `/consumables?action=issue&id=${consumable.id}`, icon: "arrow-right", variant: "primary" },
        { label: "Request Supply", href: `/consumables?action=request&id=${consumable.id}`, icon: "clipboard", variant: "secondary" },
        { label: "Create PO", href: `/purchase-orders?action=create&consumableId=${consumable.id}`, icon: "truck", variant: "secondary" },
        { label: "View Details", href: `/consumables`, icon: "droplet", variant: "ghost" },
      ],
    });
  }

  return NextResponse.json({ found: false });
}

function buildAssetActions(status: string) {
  const actions = [];
  if (status === "AVAILABLE") {
    actions.push({ label: "Check Out", href: `/assets?action=checkout`, icon: "arrow-right", variant: "primary" });
  }
  if (status === "CHECKED_OUT" || status === "ASSIGNED") {
    actions.push({ label: "Return Asset", href: `/returns`, icon: "arrow-left", variant: "primary" });
  }
  actions.push({ label: "Report Damage", href: `/report-damage`, icon: "alert-triangle", variant: "danger" });
  actions.push({ label: "View Details", href: `/assets`, icon: "package", variant: "ghost" });
  return actions;
}
