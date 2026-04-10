"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { reportDamage } from "@/app/actions/damage";

interface Assignment {
  id: string;
  asset: { id: string; name: string; assetCode: string; imageUrl?: string | null };
}

// Custom styled dropdown matching app design
function CustomSelect({ value, onChange, options, placeholder, name }: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; sublabel?: string; imageUrl?: string | null }[];
  placeholder: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    const handle = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-xl border border-shark-200 bg-white px-3.5 py-2.5 text-sm min-h-[44px] transition-all ${
          open ? "border-action-400 ring-2 ring-action-400/20" : "hover:border-shark-300"
        } ${value ? "text-shark-900" : "text-shark-400"}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <Icon name="chevron-down" size={16} className={`text-shark-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white rounded-xl shadow-lg border border-shark-100 py-1 max-h-64 overflow-y-auto"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                opt.value === value ? "bg-action-50 text-action-700 font-medium" : "text-shark-700 hover:bg-shark-50"
              }`}
            >
              {opt.imageUrl && (
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-shark-50 border border-shark-100 shrink-0">
                  <img src={opt.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {!opt.imageUrl && opt.sublabel && (
                <div className="w-8 h-8 rounded-lg bg-shark-50 border border-shark-100 flex items-center justify-center shrink-0">
                  <Icon name="package" size={14} className="text-shark-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate">{opt.label}</p>
                {opt.sublabel && <p className="text-xs text-shark-400">{opt.sublabel}</p>}
              </div>
              {opt.value === value && <Icon name="check" size={16} className="text-action-500 ml-auto shrink-0" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

export function ReportDamageClient({ assignments }: { assignments: Assignment[] }) {
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [reportType, setReportType] = useState("DAMAGE");
  const fileRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.url) setPhotoUrl(data.url);
      else throw new Error("No URL returned");
    } catch {
      setUploadError("Photo upload failed. You can still submit without a photo.");
      setPhotoUrl("");
    }
    setUploading(false);
  }

  if (submitted) {
    return (
      <div className="space-y-10">
        <h1 className="text-3xl font-bold text-shark-900 tracking-tight">Report Damage / Loss</h1>
        <Card>
          <CardContent className="py-12 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4 animate-check-pop">
              <Icon name="alert-triangle" size={28} className="text-[#E8532E]" />
            </div>
            <h2 className="text-lg font-semibold text-shark-900">Report Submitted</h2>
            <p className="text-sm text-shark-400 mt-2">
              Your manager has been notified and will review this report.
            </p>
            <Button className="mt-4" onClick={() => { setSubmitted(false); setPhotoUrl(""); }}>
              Submit Another Report
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-shark-900 tracking-tight">Report Damage / Loss</h1>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-shark-400">You have no assigned assets to report.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6">
            <form
              action={async (fd) => {
                setSubmitting(true);
                setError(null);
                if (photoUrl) fd.set("photoUrl", photoUrl);
                try {
                  await reportDamage(fd);
                  setSubmitted(true);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to submit report");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-4 max-w-md"
            >
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Asset *</label>
                <CustomSelect
                  name="assetId"
                  value={selectedAssetId}
                  onChange={(val) => {
                    setSelectedAssetId(val);
                    setTimeout(() => descRef.current?.focus(), 100);
                  }}
                  placeholder="Select the asset"
                  options={assignments.map((a) => ({
                    value: a.asset.id,
                    label: a.asset.name,
                    sublabel: a.asset.assetCode,
                    imageUrl: a.asset.imageUrl,
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Report Type *</label>
                <CustomSelect
                  name="type"
                  value={reportType}
                  onChange={setReportType}
                  placeholder="Select type"
                  options={[
                    { value: "DAMAGE", label: "Damage" },
                    { value: "LOSS", label: "Loss" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Description *</label>
                <textarea
                  ref={descRef}
                  name="description"
                  required
                  className="w-full rounded-xl border border-shark-200 px-3.5 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors"
                  rows={4}
                  maxLength={2000}
                  placeholder="Describe the damage or circumstances of loss..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Photo (optional)</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                  className="w-full text-sm text-shark-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-action-50 file:text-action-600 hover:file:bg-action-100"
                />
                {uploading && <p className="text-xs text-shark-400 mt-1">Uploading...</p>}
                {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
                {photoUrl && !uploadError && <p className="text-xs text-action-600 mt-1">Photo uploaded successfully.</p>}
              </div>
              <input type="hidden" name="photoUrl" value={photoUrl} />
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              {submitting ? (
                <div className="flex flex-col items-center py-4 animate-fade-in">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                    <svg className="animate-spinner text-[#E8532E]" width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-shark-700">Submitting report...</p>
                  <p className="text-xs text-shark-400 mt-0.5">Notifying your manager</p>
                </div>
              ) : (
                <Button type="submit" size="lg" className="w-full" disabled={uploading}>
                  Submit Report
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
