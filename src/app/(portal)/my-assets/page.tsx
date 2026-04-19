import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/lib/utils";
import { ConfirmReceiptButton } from "./confirm-receipt-button";
import { ReturnAssetButton } from "./return-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Assets",
  description: "View assets assigned to you",
};

export default async function MyAssetsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const assignments = await db.assetAssignment.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
      OR: [
        { starterKitApplicationId: null },
        { acknowledgedAt: { not: null } },
      ],
    },
    include: {
      asset: {
        include: { region: true },
      },
    },
    orderBy: { checkoutDate: "desc" },
  });

  return (
    <Card padding="none">
    <div className="p-4 sm:p-5 space-y-8">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
          <Icon name="package" size={14} className="text-action-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-shark-900">My Assets</h3>
          <p className="text-xs text-shark-400">
            {assignments.length} item{assignments.length !== 1 ? "s" : ""} currently assigned to you
          </p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-shark-400">No assets currently assigned to you.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((a) => (
            <Card key={a.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  {/* Photo */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-shark-50 flex items-center justify-center shrink-0">
                    {a.asset.imageUrl ? (
                      <img src={a.asset.imageUrl} alt={a.asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="package" size={20} className="text-shark-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-shark-900">{a.asset.name}</h3>
                        <p className="text-xs font-mono text-shark-400 mt-0.5">{a.asset.assetCode}</p>
                      </div>
                      <Badge status={a.assignmentType} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-shark-500">
                  <p>Category: {a.asset.category}</p>
                  <p>Region: {a.asset.region.name}</p>
                  <p>Assigned: {formatDate(a.checkoutDate)}</p>
                </div>
                {a.asset.notes && (
                  <div className="mt-3 bg-shark-50 rounded-lg p-2.5">
                    <p className="text-xs font-medium text-shark-400 mb-0.5">Notes</p>
                    <p className="text-sm text-shark-600 whitespace-pre-wrap">{a.asset.notes}</p>
                  </div>
                )}
                {a.asset.isHighValue && (
                  <p className="mt-2 text-xs text-gold-600 font-medium">★ High-value asset — handle with care</p>
                )}
                {a.acknowledgedAt ? (
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-action-600 flex items-center gap-1">
                      <Icon name="check" size={12} />
                      Receipt confirmed {formatDate(a.acknowledgedAt)}
                    </p>
                    <ReturnAssetButton assignmentId={a.id} assetName={a.asset.name} />
                  </div>
                ) : (
                  <ConfirmReceiptButton assignmentId={a.id} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </Card>
  );
}
