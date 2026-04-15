import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

interface RegionCost {
  regionName: string;
  total: number;
  pending: number;
  approved: number;
  ordered: number;
  hasCosting: boolean;
}

interface Props {
  regions: RegionCost[];
}

function fmt(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

export function OrderCostSummary({ regions }: Props) {
  const grandTotal = regions.reduce((s, r) => s + r.total, 0);
  const pendingTotal = regions.reduce((s, r) => s + r.pending, 0);
  const approvedTotal = regions.reduce((s, r) => s + r.approved, 0);
  const orderedTotal = regions.reduce((s, r) => s + r.ordered, 0);

  return (
    <Card className="border-action-100 bg-gradient-to-r from-action-50/40 to-transparent">
      <CardContent className="py-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
            <Icon name="bar-chart" size={14} className="text-action-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-shark-900">Procurement Pipeline</h3>
            <p className="text-xs text-shark-400">Active purchase orders by region (excl. received)</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-shark-900">{fmt(grandTotal)}</p>
            <p className="text-[10px] text-shark-400">total committed</p>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-2">
          {pendingTotal > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Pending approval: {fmt(pendingTotal)}
            </span>
          )}
          {approvedTotal > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Approved: {fmt(approvedTotal)}
            </span>
          )}
          {orderedTotal > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-green-50 text-green-600 border border-green-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              On order: {fmt(orderedTotal)}
            </span>
          )}
        </div>

        {/* Per-region breakdown */}
        <div className="bg-white rounded-xl border border-shark-100 divide-y divide-shark-50 overflow-hidden">
          {regions.map((region) => {
            const pct = grandTotal > 0 ? (region.total / grandTotal) * 100 : 0;
            return (
              <div key={region.regionName} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-shark-800 truncate">{region.regionName}</span>
                      <span className="text-sm font-bold text-shark-900 ml-2 shrink-0">{fmt(region.total)}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-shark-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-action-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {/* Status breakdown */}
                    <div className="flex gap-3 mt-1.5 flex-wrap">
                      {region.pending > 0 && (
                        <span className="text-[10px] text-amber-500 font-medium">Pending {fmt(region.pending)}</span>
                      )}
                      {region.approved > 0 && (
                        <span className="text-[10px] text-blue-500 font-medium">Approved {fmt(region.approved)}</span>
                      )}
                      {region.ordered > 0 && (
                        <span className="text-[10px] text-green-500 font-medium">Ordered {fmt(region.ordered)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {regions.some((r) => !r.hasCosting) && (
          <p className="text-[10px] text-shark-400">
            * Some items have no unit cost set — totals may be understated. Add costs via Consumables → Edit.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
