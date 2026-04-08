"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { requestConsumable } from "@/app/actions/consumables";

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

interface Consumable {
  id: string;
  name: string;
  category: string;
  unitType: string;
  imageUrl: string | null;
  region: { name: string };
}

interface Category {
  id: string;
  name: string;
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
  consumables: Consumable[];
  categories: Category[];
  recentRequests: Request[];
}

export function RequestConsumablesClient({ consumables, categories, recentRequests }: Props) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const { addToast } = useToast();

  const toggleSection = (name: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Filter
  const filtered = search
    ? consumables.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase())
      )
    : consumables;

  // Group by category
  const consumablesByCategory = new Map<string, Consumable[]>();
  for (const c of filtered) {
    if (!consumablesByCategory.has(c.category)) consumablesByCategory.set(c.category, []);
    consumablesByCategory.get(c.category)!.push(c);
  }

  // Build ordered sections — only categories with actual consumables
  const sectionNames = new Set<string>();
  for (const cat of consumablesByCategory.keys()) sectionNames.add(cat);

  const orderedSections = Array.from(sectionNames)
    .sort((a, b) => {
      const aIdx = categories.findIndex((c) => c.name === a);
      const bIdx = categories.findIndex((c) => c.name === b);
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
      if (aIdx >= 0) return -1;
      if (bIdx >= 0) return 1;
      return a.localeCompare(b);
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-shark-900 tracking-tight">Request Consumables</h1>
        <p className="text-sm text-shark-400 mt-1">
          Browse items and request what you need
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder="Search consumables..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {/* Sections */}
      {orderedSections.map((sectionName, idx) => {
        const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
        const sectionConsumables = consumablesByCategory.get(sectionName) || [];
        const collapsed = collapsedSections.has(sectionName);

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
                <span className="text-xs font-medium text-shark-400 bg-shark-100 px-2 py-0.5 rounded-full">
                  {sectionConsumables.length}
                </span>
              </div>
              <Icon
                name="chevron-down"
                size={16}
                className={`text-shark-400 group-hover:text-shark-600 transition-transform ${collapsed ? "-rotate-90" : ""}`}
              />
            </button>

            {!collapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-2">
                {sectionConsumables.map((c) => (
                  <ConsumableRequestCard key={c.id} consumable={c} addToast={addToast} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {orderedSections.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="droplet" size={40} className="text-shark-200 mx-auto mb-3" />
            <p className="text-shark-400">
              {search ? "No consumables match your search." : "No consumables available to request."}
            </p>
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

// ─── Consumable Card with Request Button ────────────────────

function ConsumableRequestCard({
  consumable: c,
  addToast,
}: {
  consumable: Consumable;
  addToast: (message: string, type: "success" | "error") => void;
}) {
  const [showRequest, setShowRequest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reqQty, setReqQty] = useState(1);
  const [reqNotes, setReqNotes] = useState("");

  const handleRequest = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("consumableId", c.id);
      fd.set("quantity", reqQty.toString());
      fd.set("notes", reqNotes);
      await requestConsumable(fd);
      addToast(`Requested ${reqQty} ${c.unitType} of ${c.name}`, "success");
      setShowRequest(false);
      setReqQty(1);
      setReqNotes("");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to request", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
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
            <h3 className="font-semibold text-shark-900 truncate">{c.name}</h3>
            <p className="text-xs text-shark-400 mt-0.5">{c.unitType} &middot; {c.region.name}</p>
          </div>
        </div>

        {/* Request form */}
        {showRequest && (
          <div className="mt-3 space-y-2 bg-shark-50 rounded-lg p-3">
            <p className="text-xs font-medium text-shark-600">How many do you need?</p>
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
              <Button size="sm" onClick={handleRequest} disabled={loading} loading={loading} className="text-xs">
                Send Request
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowRequest(false); setReqQty(1); setReqNotes(""); }} disabled={loading} className="text-xs">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Request button */}
        {!showRequest && (
          <Button variant="outline" size="sm" onClick={() => setShowRequest(true)} className="mt-3 w-full">
            <Icon name="plus" size={14} className="mr-1.5" />
            Request
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
