"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface ScanAction {
  label: string;
  href: string;
  icon: IconName;
  variant: "primary" | "secondary" | "danger" | "ghost";
}

interface ScanResult {
  found: boolean;
  type?: "asset" | "consumable";
  id?: string;
  name?: string;
  code?: string;
  status?: string;
  category?: string;
  unitType?: string;
  quantityOnHand?: number;
  imageUrl?: string | null;
  regionName?: string;
  assignedTo?: string | null;
  actions?: ScanAction[];
}

interface BulkItem {
  code: string;
  name: string;
  type: "asset" | "consumable";
  status?: string;
}

// Parse asset code from a scanned URL or direct code
function parseCode(text: string): string {
  text = text.trim();
  try {
    const url = new URL(text);
    const parts = url.pathname.split("/").filter(Boolean);
    // /assets/[assetCode]
    const assetsIdx = parts.indexOf("assets");
    if (assetsIdx !== -1 && parts[assetsIdx + 1]) return parts[assetsIdx + 1];
  } catch { /* not a URL */ }
  return text;
}

const VARIANT_STYLES: Record<ScanAction["variant"], string> = {
  primary:   "bg-action-500 hover:bg-action-600 text-white",
  secondary: "bg-shark-100 hover:bg-shark-200 text-shark-800",
  danger:    "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
  ghost:     "text-shark-500 hover:bg-shark-50",
};

export default function ScanPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef<{ clear: () => void } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Look up an asset/consumable by code
  const lookup = useCallback(async (rawText: string) => {
    const code = parseCode(rawText);
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/scan?code=${encodeURIComponent(code)}`);
      const data: ScanResult = await res.json();
      if (data.found && bulkMode) {
        // Add to bulk list
        setBulkItems((prev) => {
          const exists = prev.some((i) => i.code === (data.code || data.id));
          if (exists) return prev;
          return [...prev, {
            code: data.code || data.id || code,
            name: data.name || code,
            type: data.type!,
            status: data.status,
          }];
        });
        setResult(null);
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to look up item. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [bulkMode]);

  // Initialize html5-qrcode scanner
  useEffect(() => {
    if (mode !== "camera") return;
    let scanner: { clear: () => Promise<void> } | null = null;

    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
        false
      ) as any;
      s.render(
        (decodedText: string) => { lookup(decodedText); },
        () => { /* ignore scan errors */ }
      );
      setScannerReady(true);
      scannerRef.current = { clear: () => s.clear().catch(() => {}) };
      scanner = s;
    }).catch(() => {
      setMode("manual");
    });

    return () => {
      scanner?.clear().catch(() => {});
    };
  }, [mode, lookup]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) lookup(manualCode.trim());
  };

  const resetScan = () => {
    setResult(null);
    setManualCode("");
    setError(null);
    if (mode === "manual") inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-shark-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <Icon name="arrow-left" size={16} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold">QR Scanner</h1>
          <p className="text-xs text-white/50">Scan or enter an asset code</p>
        </div>
        {/* Bulk mode toggle */}
        <button
          onClick={() => { setBulkMode((p) => !p); setResult(null); }}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
            bulkMode ? "bg-action-500 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          {bulkMode ? "✓ Bulk" : "Bulk"}
        </button>
        {/* Camera / Manual toggle */}
        <div className="flex bg-white/10 rounded-full p-0.5 gap-0.5">
          <button
            onClick={() => { setMode("camera"); setResult(null); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${mode === "camera" ? "bg-white text-shark-900" : "text-white/60 hover:text-white"}`}
          >
            <Icon name="qr-code" size={13} />
          </button>
          <button
            onClick={() => { setMode("manual"); setResult(null); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${mode === "manual" ? "bg-white text-shark-900" : "text-white/60 hover:text-white"}`}
          >
            <Icon name="edit" size={13} />
          </button>
        </div>
      </div>

      {/* Scanner / Manual area */}
      <div className="flex-1 flex flex-col">
        {/* Camera view */}
        {mode === "camera" && !result && (
          <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-6">
            <div id="qr-reader" className="w-full max-w-sm rounded-2xl overflow-hidden" />
            {!scannerReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/60 text-sm">Starting camera…</div>
              </div>
            )}
            <p className="text-white/40 text-xs mt-4 text-center">
              Point at any QR code on an asset label
            </p>
          </div>
        )}

        {/* Manual entry */}
        {mode === "manual" && !result && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
              <Icon name="qr-code" size={36} className="text-white/60" />
            </div>
            <div className="w-full max-w-sm">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter asset code (e.g. TOOL-001)"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-action-400 focus:bg-white/15"
                />
                <button
                  type="submit"
                  disabled={loading || !manualCode.trim()}
                  className="w-full bg-action-500 hover:bg-action-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  {loading ? "Looking up…" : "Find Item"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && !result && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white/60 text-sm animate-pulse">Looking up item…</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline text-xs">Dismiss</button>
          </div>
        )}

        {/* Result — Action Sheet */}
        {result && !loading && (
          <div className="flex-1 flex flex-col">
            {result.found ? (
              <>
                {/* Item card */}
                <div className="mx-4 mt-6 bg-white/10 rounded-2xl p-4 flex items-center gap-3">
                  {result.imageUrl ? (
                    <img src={result.imageUrl} alt={result.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Icon name={result.type === "asset" ? "package" : "droplet"} size={24} className="text-white/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-base truncate">{result.name}</p>
                    {result.code && <p className="text-white/50 text-xs font-mono">{result.code}</p>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {result.regionName && (
                        <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{result.regionName}</span>
                      )}
                      {result.status && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          result.status === "AVAILABLE" ? "bg-green-500/20 text-green-400" :
                          result.status === "CHECKED_OUT" || result.status === "ASSIGNED" ? "bg-amber-500/20 text-amber-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {result.status.replace("_", " ")}
                        </span>
                      )}
                      {result.quantityOnHand !== undefined && (
                        <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full">
                          {result.quantityOnHand} {result.unitType} in stock
                        </span>
                      )}
                    </div>
                    {result.assignedTo && (
                      <p className="text-[11px] text-white/40 mt-1">Assigned to {result.assignedTo}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mx-4 mt-4 space-y-2">
                  {result.actions?.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-semibold text-sm transition-colors ${VARIANT_STYLES[action.variant]}`}
                    >
                      <Icon name={action.icon as IconName} size={16} />
                      {action.label}
                    </Link>
                  ))}
                </div>

                {/* Scan again */}
                <button
                  onClick={resetScan}
                  className="mx-4 mt-3 py-3 text-white/50 hover:text-white/80 text-sm font-medium transition-colors text-center"
                >
                  ← Scan another item
                </button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <Icon name="alert-triangle" size={28} className="text-red-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Item not found</p>
                  <p className="text-sm text-white/40 mt-1">No asset or supply matched this code</p>
                </div>
                <button onClick={resetScan} className="text-action-400 hover:text-action-300 font-semibold text-sm">
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bulk list */}
        {bulkMode && bulkItems.length > 0 && (
          <div className="mx-4 mt-4 bg-white/5 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-semibold">{bulkItems.length} items scanned</span>
              <button onClick={() => setBulkItems([])} className="text-xs text-white/40 hover:text-white/70">Clear</button>
            </div>
            <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
              {bulkItems.map((item) => (
                <div key={item.code} className="flex items-center gap-3 px-4 py-2.5">
                  <Icon name={item.type === "asset" ? "package" : "droplet"} size={14} className="text-white/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-white/40 font-mono">{item.code}</p>
                  </div>
                  <button
                    onClick={() => setBulkItems((p) => p.filter((i) => i.code !== item.code))}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
            </div>
            {/* Bulk actions */}
            <div className="px-4 py-3 border-t border-white/10 grid grid-cols-2 gap-2">
              <Link
                href={`/returns`}
                className="bg-action-500 hover:bg-action-600 text-white text-xs font-semibold px-3 py-2.5 rounded-xl text-center transition-colors"
              >
                Return All
              </Link>
              <Link
                href={`/report-damage`}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold px-3 py-2.5 rounded-xl text-center transition-colors"
              >
                Report All
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
