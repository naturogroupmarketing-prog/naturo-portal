"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { reportDamage } from "@/app/actions/damage";

interface Assignment {
  id: string;
  asset: { id: string; name: string; assetCode: string };
}

export function ReportDamageClient({ assignments }: { assignments: Assignment[] }) {
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-shark-900">Report Damage / Loss</h1>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-shark-900">Report Damage / Loss</h1>
        <p className="text-sm text-shark-400 mt-1">Report a damaged or lost asset assigned to you.</p>
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
                <Select
                  name="assetId"
                  required
                  onChange={(e) => {
                    if (e.target.value) {
                      setTimeout(() => descRef.current?.focus(), 100);
                    }
                  }}
                >
                  <option value="">Select the asset</option>
                  {assignments.map((a) => (
                    <option key={a.asset.id} value={a.asset.id}>
                      {a.asset.name} ({a.asset.assetCode})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Report Type *</label>
                <Select name="type" required>
                  <option value="DAMAGE">Damage</option>
                  <option value="LOSS">Loss</option>
                </Select>
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
