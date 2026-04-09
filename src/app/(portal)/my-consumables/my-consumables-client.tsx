"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { markConsumableUsed, requestConsumable, acknowledgeConsumable } from "@/app/actions/consumables";
import { useRouter } from "next/navigation";

const SECTION_COLORS = [
  { color: "text-blue-600", bg: "bg-blue-50" },
  { color: "text-[#E8532E]", bg: "bg-amber-50" },
  { color: "text-cyan-600", bg: "bg-cyan-50" },
  { color: "text-red-600", bg: "bg-red-50" },
  { color: "text-action-600", bg: "bg-action-50" },
  { color: "text-shark-600", bg: "bg-shark-50" },
  { color: "text-gray-600", bg: "bg-gray-100" },
  { color: "text-orange-600", bg: "bg-orange-50" },
  { color: "text-pink-600", bg: "bg-pink-50" },
  { color: "text-lime-600", bg: "bg-lime-50" },
];

interface Assignment {
  id: string;
  consumableId: string;
  quantity: number;
  assignedDate: string;
  consumable: {
    id: string;
    name: string;
    category: string;
    unitType: string;
    imageUrl: string | null;
    notes: string | null;
    region: { name: string };
  };
}

interface Category {
  id: string;
  name: string;
  equipment: string[];
}

interface Consumable {
  id: string;
  name: string;
  category: string;
  unitType: string;
  imageUrl: string | null;
  region: { name: string };
}

interface Request {
  id: string;
  quantity: number;
  status: string;
  notes: string | null;
  rejectionNote: string | null;
  createdAt: string;
  consumable: {
    name: string;
    unitType: string;
    region: { name: string };
  };
}

interface Props {
  assignments: Assignment[];
  pendingAssignments?: Assignment[];
  categories: Category[];
  consumables: Consumable[];
  recentRequests: Request[];
}

export function MyConsumablesClient({ assignments, pendingAssignments = [], categories, consumables, recentRequests }: Props) {
  const router = useRouter();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const toggleSection = (name: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Group assignments by category
  const assignmentsByCategory = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const cat = a.consumable.category;
    if (!assignmentsByCategory.has(cat)) assignmentsByCategory.set(cat, []);
    assignmentsByCategory.get(cat)!.push(a);
  }

  // Group consumables by category (for requesting items not yet assigned)
  const consumablesByCategory = new Map<string, Consumable[]>();
  for (const c of consumables) {
    if (!consumablesByCategory.has(c.category)) consumablesByCategory.set(c.category, []);
    consumablesByCategory.get(c.category)!.push(c);
  }

  // Build sections: only categories that have actual items (assignments or consumables)
  const sectionNames = new Set<string>();
  for (const cat of assignmentsByCategory.keys()) sectionNames.add(cat);
  for (const cat of consumablesByCategory.keys()) sectionNames.add(cat);

  const orderedSections = Array.from(sectionNames).sort((a, b) => {
    const aIdx = categories.findIndex((c) => c.name === a);
    const bIdx = categories.findIndex((c) => c.name === b);
    if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
    if (aIdx >= 0) return -1;
    if (bIdx >= 0) return 1;
    return a.localeCompare(b);
  });

  const totalAssigned = assignments.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-shark-900 tracking-tight">My Consumables</h1>
        <p className="text-sm text-shark-400 mt-1">
          Your consumable assignments and requests
        </p>
      </div>

      {/* Pending Assignments — need confirmation */}
      {pendingAssignments.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Icon name="clipboard" size={14} className="text-[#E8532E]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-shark-900">Confirm Receipt</p>
                <p className="text-xs text-shark-400">{pendingAssignments.length} item{pendingAssignments.length !== 1 ? "s" : ""} awaiting confirmation</p>
              </div>
            </div>
            <div className="space-y-2">
              {pendingAssignments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-shark-100">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-shark-50 border border-shark-100 flex items-center justify-center shrink-0">
                    {a.consumable.imageUrl ? <img src={a.consumable.imageUrl} alt="" className="w-full h-full object-cover" /> : <Icon name="droplet" size={14} className="text-shark-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-shark-800 truncate">{a.quantity}x {a.consumable.name}</p>
                    <p className="text-xs text-shark-400">{a.consumable.unitType} · {a.consumable.category}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={confirmingId === a.id}
                    onClick={async () => {
                      setConfirmingId(a.id);
                      try {
                        await acknowledgeConsumable(a.id);
                        router.refresh();
                      } catch {
                        alert("Failed to confirm receipt.");
                      }
                      setConfirmingId(null);
                    }}
                  >
                    <Icon name="check" size={14} className="mr-1" />
                    {confirmingId === a.id ? "..." : "Confirm"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      {orderedSections.map((sectionName, idx) => {
        const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
        const sectionAssignments = assignmentsByCategory.get(sectionName) || [];
        const sectionConsumables = consumablesByCategory.get(sectionName) || [];
        const collapsed = collapsedSections.has(sectionName);
        const assignedConsumableIds = new Set(sectionAssignments.map((a) => a.consumableId));
        // Consumables in this section that the staff doesn't currently have assigned
        const unassignedConsumables = sectionConsumables.filter((c) => !assignedConsumableIds.has(c.id));

        return (
          <div key={sectionName} className="space-y-3">
            <button
              onClick={() => toggleSection(sectionName)}
              className="flex items-center gap-3 px-1 w-full text-left group"
            >
              <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                <Icon name="droplet" size={16} className={colors.color} />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <h2 className="text-lg font-semibold text-shark-900">{sectionName}</h2>
                {sectionAssignments.length > 0 && (
                  <span className="text-xs font-medium text-white bg-action-500 px-2 py-0.5 rounded-full">
                    {sectionAssignments.reduce((sum, a) => sum + a.quantity, 0)} assigned
                  </span>
                )}
              </div>
              <Icon
                name="chevron-down"
                size={16}
                className={`text-shark-400 group-hover:text-shark-600 transition-transform ${collapsed ? "-rotate-90" : ""}`}
              />
            </button>

            {!collapsed && (
              <div className="space-y-3 ml-2">
                {/* Assigned consumables */}
                {sectionAssignments.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sectionAssignments.map((ca) => (
                      <AssignmentCard key={ca.id} assignment={ca} />
                    ))}
                  </div>
                )}

                {/* Unassigned consumables in this section — request only */}
                {unassignedConsumables.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unassignedConsumables.map((c) => (
                      <UnassignedConsumableCard key={c.id} consumable={c} />
                    ))}
                  </div>
                )}

                {sectionAssignments.length === 0 && unassignedConsumables.length === 0 && (
                  <p className="text-sm text-shark-400 ml-11">No items in this section.</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {orderedSections.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-shark-400">No consumable sections have been set up yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Pending & Recent Requests */}
      {recentRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-shark-900 mb-3">Pending & Recent Requests</h2>
          <div className="space-y-3">
            {recentRequests.map((r) => (
              <Card key={r.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-shark-800">{r.consumable.name}</h3>
                      <p className="text-sm text-shark-400">
                        {r.quantity} {r.consumable.unitType} &middot; {r.consumable.region.name}
                      </p>
                    </div>
                    <Badge status={r.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-shark-400">
                    <span>Requested: {formatDate(r.createdAt)}</span>
                    {r.rejectionNote && (
                      <span className="text-red-500">Reason: {r.rejectionNote}</span>
                    )}
                  </div>
                  {r.notes && (
                    <p className="mt-2 text-sm text-shark-500 bg-shark-50 rounded-xl p-3">{r.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Assignment Card (has items assigned) ─────────────────────

function AssignmentCard({ assignment: ca }: { assignment: Assignment }) {
  const [mode, setMode] = useState<"idle" | "use" | "request">("idle");
  const [loading, setLoading] = useState(false);
  const [useQty, setUseQty] = useState(ca.quantity);
  const [reqQty, setReqQty] = useState(1);
  const [reqNotes, setReqNotes] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleMarkUsed = async () => {
    setLoading(true);
    try {
      await markConsumableUsed(ca.id, useQty);
      setMode("idle");
      setUseQty(0);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to mark as used.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("consumableId", ca.consumableId);
      fd.set("quantity", reqQty.toString());
      fd.set("notes", reqNotes);
      await requestConsumable(fd);
      setSuccess(`Requested ${reqQty} ${ca.consumable.unitType}`);
      setMode("idle");
      setReqQty(1);
      setReqNotes("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={ca.quantity === 0 ? "opacity-40" : ""}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          {/* Photo */}
          {ca.consumable.imageUrl ? (
            <img
              src={ca.consumable.imageUrl}
              alt={ca.consumable.name}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-shark-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-shark-100 flex items-center justify-center flex-shrink-0">
              <Icon name="droplet" size={20} className="text-shark-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-shark-900 truncate">{ca.consumable.name}</h3>
                <p className="text-xs text-shark-400 mt-0.5">{ca.consumable.unitType} · {ca.consumable.region.name}</p>
              </div>
              <span className={`text-lg font-bold ml-2 ${ca.quantity === 0 ? "text-shark-400" : "text-shark-800"}`}>×{ca.quantity}</span>
            </div>
            <p className="text-xs text-shark-400 mt-1">Assigned: {formatDate(ca.assignedDate)}</p>
          </div>
        </div>

        {ca.consumable.notes && (
          <div className="mt-3 bg-shark-50 rounded-lg p-2.5">
            <p className="text-xs font-medium text-shark-400 mb-0.5">Notes</p>
            <p className="text-sm text-shark-600 whitespace-pre-wrap">{ca.consumable.notes}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mt-3 flex items-center gap-2 text-xs text-action-600 font-medium">
            <Icon name="check" size={14} />
            {success}
          </div>
        )}

        {/* Mark Used mode */}
        {mode === "use" && !success && (
          <div className="mt-3 space-y-2 bg-shark-50 rounded-lg p-3">
            <p className="text-xs font-medium text-shark-600">How many did you use?</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setUseQty(Math.max(0, useQty - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-shark-200 flex items-center justify-center text-shark-500 hover:bg-shark-100"
                  disabled={useQty <= 0}
                >
                  <span className="text-sm font-bold leading-none">−</span>
                </button>
                <Input
                  type="number"
                  min={0}
                  max={ca.quantity}
                  value={useQty}
                  onChange={(e) => setUseQty(Math.min(ca.quantity, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-16 text-center text-sm"
                />
                <button
                  type="button"
                  onClick={() => setUseQty(Math.min(ca.quantity, useQty + 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-shark-200 flex items-center justify-center text-shark-500 hover:bg-shark-100"
                  disabled={useQty >= ca.quantity}
                >
                  <Icon name="plus" size={12} />
                </button>
              </div>
              <span className="text-xs text-shark-400">
                of {ca.quantity} · {ca.quantity - useQty} remaining
              </span>
            </div>
            {useQty >= ca.quantity && (
              <p className="text-xs text-[#E8532E]">All used — this will close the assignment.</p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={handleMarkUsed} disabled={loading || useQty === 0} loading={loading} className="text-xs">
                {`Use ${useQty}`}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setMode("idle"); setUseQty(ca.quantity); }} disabled={loading} className="text-xs">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Request More mode */}
        {mode === "request" && !success && (
          <div className="mt-3 space-y-2 bg-shark-50 rounded-lg p-3">
            <p className="text-xs font-medium text-shark-600">Request more</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setReqQty(Math.max(1, reqQty - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-shark-200 flex items-center justify-center text-shark-500 hover:bg-shark-100"
                  disabled={reqQty <= 1}
                >
                  <span className="text-sm font-bold leading-none">−</span>
                </button>
                <Input
                  type="number"
                  min={1}
                  value={reqQty}
                  onChange={(e) => setReqQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center text-sm"
                />
                <button
                  type="button"
                  onClick={() => setReqQty(reqQty + 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-shark-200 flex items-center justify-center text-shark-500 hover:bg-shark-100"
                >
                  <Icon name="plus" size={12} />
                </button>
              </div>
              <span className="text-xs text-shark-400">{ca.consumable.unitType}</span>
            </div>
            <Input
              placeholder="Notes (optional)"
              value={reqNotes}
              onChange={(e) => setReqNotes(e.target.value)}
              className="text-xs"
            />
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={handleRequest} disabled={loading} className="text-xs">
                {loading ? "Requesting..." : "Send Request"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setMode("idle"); setReqQty(1); setReqNotes(""); }} disabled={loading} className="text-xs">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {mode === "idle" && !success && (
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setMode("use"); setUseQty(ca.quantity); }} className="flex-1">
              <Icon name="check" size={14} className="mr-1.5" />
              Mark Used
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMode("request")} className="flex-1">
              <Icon name="plus" size={14} className="mr-1.5" />
              Request More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Unassigned Consumable Card (request only) ────────────────

function UnassignedConsumableCard({ consumable: c }: { consumable: Consumable }) {
  const [showRequest, setShowRequest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reqQty, setReqQty] = useState(1);
  const [reqNotes, setReqNotes] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("consumableId", c.id);
      fd.set("quantity", reqQty.toString());
      fd.set("notes", reqNotes);
      await requestConsumable(fd);
      setSuccess(`Requested ${reqQty} ${c.unitType}`);
      setShowRequest(false);
      setReqQty(1);
      setReqNotes("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-dashed opacity-50">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          {/* Photo */}
          {c.imageUrl ? (
            <img
              src={c.imageUrl}
              alt={c.name}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-shark-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-shark-50 flex items-center justify-center flex-shrink-0">
              <Icon name="droplet" size={20} className="text-shark-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-shark-600 truncate">{c.name}</h3>
            <p className="text-xs text-shark-400 mt-0.5">{c.unitType} · {c.region.name}</p>
            <p className="text-xs text-shark-400 mt-1">Not currently assigned</p>
          </div>
        </div>

        {success && (
          <div className="mt-3 flex items-center gap-2 text-xs text-action-600 font-medium">
            <Icon name="check" size={14} />
            {success}
          </div>
        )}

        {showRequest && !success && (
          <div className="mt-3 space-y-2 bg-shark-50 rounded-lg p-3">
            <p className="text-xs font-medium text-shark-600">Request this item</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setReqQty(Math.max(1, reqQty - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-shark-200 flex items-center justify-center text-shark-500 hover:bg-shark-100"
                  disabled={reqQty <= 1}
                >
                  <span className="text-sm font-bold leading-none">−</span>
                </button>
                <Input
                  type="number"
                  min={1}
                  value={reqQty}
                  onChange={(e) => setReqQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center text-sm"
                />
                <button
                  type="button"
                  onClick={() => setReqQty(reqQty + 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-shark-200 flex items-center justify-center text-shark-500 hover:bg-shark-100"
                >
                  <Icon name="plus" size={12} />
                </button>
              </div>
              <span className="text-xs text-shark-400">{c.unitType}</span>
            </div>
            <Input
              placeholder="Notes (optional)"
              value={reqNotes}
              onChange={(e) => setReqNotes(e.target.value)}
              className="text-xs"
            />
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={handleRequest} disabled={loading} className="text-xs">
                {loading ? "Requesting..." : "Send Request"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowRequest(false); setReqQty(1); setReqNotes(""); }} disabled={loading} className="text-xs">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!showRequest && !success && (
          <Button variant="outline" size="sm" onClick={() => setShowRequest(true)} className="mt-3 w-full">
            <Icon name="plus" size={14} className="mr-1.5" />
            Request
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
