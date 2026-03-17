import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";


export default async function RegionDetailPage({ params }: { params: Promise<{ regionId: string }> }) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) redirect("/dashboard");

  const { regionId } = await params;

  const region = await db.region.findUnique({
    where: { id: regionId },
    include: { state: true },
  });
  if (!region) notFound();

  const [assets, consumables, staff, lowStockCount] = await Promise.all([
    db.asset.findMany({
      where: { regionId },
      include: {
        assignments: {
          where: { isActive: true },
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.consumable.findMany({
      where: { regionId, isActive: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { regionId },
      orderBy: { name: "asc" },
    }),
    db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Consumable"
      WHERE "regionId" = ${regionId} AND "isActive" = true AND "quantityOnHand" <= "minimumThreshold"
    `.then((r) => Number(r[0].count)),
  ]);

  const stats = [
    { label: "Total Assets", value: assets.length, icon: "package" as const, color: "text-action-500", bg: "bg-action-50", border: "border-action-400" },
    { label: "Consumables", value: consumables.length, icon: "droplet" as const, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-400" },
    { label: "Staff", value: staff.length, icon: "users" as const, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-400" },
    { label: "Low Stock", value: lowStockCount, icon: "alert-triangle" as const, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-shark-400">
        <Link href="/admin/locations" className="hover:text-action-500 transition-colors">
          Locations
        </Link>
        <span>/</span>
        <span>{region.state.name}</span>
        <span>/</span>
        <span className="text-shark-700 font-medium">{region.name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-shark-900">{region.name}</h1>
        <p className="text-sm text-shark-400 mt-1">{region.state.name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={`border-l-4 ${stat.border}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-shark-900">{stat.value}</p>
                  <p className="text-xs text-shark-400 mt-0.5">{stat.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon name={stat.icon} size={18} className={stat.color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assets Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="package" size={18} className="text-action-500" />
            Assets ({assets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <p className="text-sm text-shark-400 py-4">No assets in this region.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-shark-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} className="border-b border-shark-50 hover:bg-shark-50/50">
                      <td className="px-4 py-3 text-sm font-mono text-shark-500">{asset.assetCode}</td>
                      <td className="px-4 py-3 text-sm font-medium text-shark-800">
                        {asset.name}
                        {asset.isHighValue && <span className="text-amber-500 ml-1">★</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-shark-500">{asset.category}</td>
                      <td className="px-4 py-3"><Badge status={asset.status} /></td>
                      <td className="px-4 py-3 text-sm text-shark-500">
                        {asset.assignments[0]?.user?.name || asset.assignments[0]?.user?.email || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consumables Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="droplet" size={18} className="text-blue-500" />
            Consumables ({consumables.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consumables.length === 0 ? (
            <p className="text-sm text-shark-400 py-4">No consumables in this region.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-shark-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Minimum</th>
                  </tr>
                </thead>
                <tbody>
                  {consumables.map((item) => (
                    <tr key={item.id} className="border-b border-shark-50 hover:bg-shark-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-shark-800">
                        {item.name}
                        <span className="text-shark-400 ml-1 text-xs">({item.unitType})</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-shark-500">{item.category}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={item.quantityOnHand <= item.minimumThreshold ? "text-red-600 font-semibold" : "text-shark-700"}>
                          {item.quantityOnHand}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-shark-400">{item.minimumThreshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="users" size={18} className="text-emerald-500" />
            Staff ({staff.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-sm text-shark-400 py-4">No staff assigned to this region.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-shark-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((user) => (
                    <tr key={user.id} className="border-b border-shark-50 hover:bg-shark-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-shark-800">{user.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-shark-500">{user.email}</td>
                      <td className="px-4 py-3"><Badge status={user.role} /></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs ${user.isActive ? "text-emerald-600" : "text-shark-400"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-shark-300"}`} />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
