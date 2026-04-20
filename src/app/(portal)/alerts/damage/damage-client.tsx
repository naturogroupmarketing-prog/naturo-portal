"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { resolveDamageReport } from "@/app/actions/damage";

interface DamageReport {
  id: string;
  type: string;
  description: string;
  photoUrl: string | null;
  createdAt: string;
  asset: { name: string; assetCode: string; category: string; status: string; region: { id: string; name: string; state: { name: string } } };
  reportedBy: { name: string | null; email: string };
}

export function UnresolvedDamageClient({ reports, focusRegionId }: { reports: DamageReport[]; focusRegionId?: string }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set(
    focusRegionId
      ? [focusRegionId]
      : [...new Set(reports.map((r) => r.asset.region.id))]
  ));
  const [resolvingReport, setResolvingReport] = useState<DamageReport | null>(null);
  const [resolution, setResolution] = useState("REPAIRED");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const toggleRegion = (id: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResolve = async () => {
    if (!resolvingReport) return;
    setResolving(true);
    try {
      await resolveDamageReport({ reportId: resolvingReport.id, resolution, notes: resolutionNotes || undefined });
      addToast(`Resolved: ${resolvingReport.asset.name} — ${resolution}`, "success");
      setResolvingReport(null);
      setResolutionNotes("");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to resolve", "error");
    }
    setResolving(false);
  };

  // Group by region
  const byRegion = new Map<string, { name: string; stateName: string; regionId: string; items: DamageReport[] }>();
  for (const report of reports) {
    const key = report.asset.region.id;
    if (!byRegion.has(key)) byRegion.set(key, { name: report.asset.region.name, stateName: report.asset.region.state.name, regionId: key, items: [] });
    byRegion.get(key)!.items.push(report);
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-shark-400 hover:text-action-500 transition-colors">
          <Icon name="arrow-left" size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-shark-900 dark:text-shark-100 tracking-tight">Damage</h1>
          <p className="text-sm text-shark-400 mt-0.5">{reports.length} unresolved report{reports.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-action-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="check" size={24} className="text-action-600" />
            </div>
            <p className="text-lg font-semibold text-shark-900 dark:text-shark-100">No Unresolved Reports</p>
            <p className="text-sm text-shark-400 mt-1">All damage and loss reports have been resolved.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...byRegion.values()].map((group) => {
            const isExpanded = expandedRegions.has(group.regionId);
            return (
              <Card key={group.regionId} className="overflow-hidden">
                <button
                  onClick={() => toggleRegion(group.regionId)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-shark-50 dark:hover:bg-shark-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                      <Icon name="alert-triangle" size={16} className="text-red-600" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-shark-900 dark:text-shark-100">{group.name}</span>
                      <span className="ml-2 text-xs text-shark-400">{group.stateName}</span>
                    </div>
                    <span className="ml-2 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {group.items.length} report{group.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Icon name="chevron-down" size={16} className={`text-shark-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-shark-100 dark:border-shark-700 divide-y divide-shark-50 dark:divide-shark-800">
                    {group.items.map((report) => (
                      <div key={report.id} className="px-5 py-4 hover:bg-shark-50 dark:hover:bg-shark-800/30">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${report.type === "DAMAGE" ? "bg-amber-100 text-[#E8532E]" : "bg-red-100 text-red-700"}`}>
                                {report.type}
                              </span>
                              <p className="text-sm font-semibold text-shark-800 dark:text-shark-200">{report.asset.name}</p>
                              <span className="text-xs font-mono text-shark-400">{report.asset.assetCode}</span>
                            </div>
                            <p className="text-sm text-shark-600 dark:text-shark-400 mt-1">{report.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-shark-400">
                              <span>Reported by {report.reportedBy.name || report.reportedBy.email}</span>
                              <span>&middot;</span>
                              <span>{new Date(report.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => { setResolvingReport(report); setResolution("REPAIRED"); setResolutionNotes(""); }}>
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Resolve Modal */}
      <Modal open={!!resolvingReport} onClose={() => setResolvingReport(null)} title={`Resolve: ${resolvingReport?.asset.name || ""}`}>
        {resolvingReport && (
          <div className="space-y-4">
            <div className="bg-shark-50 dark:bg-shark-800 rounded-xl p-3">
              <p className="text-sm text-shark-700 dark:text-shark-300">{resolvingReport.description}</p>
              <p className="text-xs text-shark-400 mt-1">Reported {new Date(resolvingReport.createdAt).toLocaleDateString("en-AU")}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Resolution *</label>
              <Select value={resolution} onChange={(e) => setResolution(e.target.value)}>
                <option value="REPAIRED">Repaired — asset returned to service</option>
                <option value="REPLACED">Replaced — new asset provided</option>
                <option value="WRITTEN_OFF">Written Off — asset retired</option>
                <option value="INSURANCE_CLAIM">Insurance Claim — claim filed</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Notes</label>
              <Input value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="Optional resolution details" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setResolvingReport(null)}>Cancel</Button>
              <Button onClick={handleResolve} disabled={resolving} loading={resolving}>Resolve</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
