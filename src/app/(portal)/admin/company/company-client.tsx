"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { updateCompanyDetails } from "@/app/actions/admin";

interface Props {
  org: {
    id: string;
    name: string;
    logo: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    website: string | null;
    abn: string | null;
  };
}

export function CompanyClient({ org }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(org.logo || "");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast("Image must be under 5 MB", "error");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      addToast("Please use JPEG, PNG, WebP, HEIC or SVG", "error");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "logos");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setLogoUrl(json.url);
      addToast("Logo uploaded", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function removeLogo() {
    setLogoUrl("");
  }

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-shark-900 dark:text-shark-100 tracking-tight">Company Details</h1>
        <p className="text-sm text-shark-400 mt-1">Manage your organisation information</p>
      </div>

      <Card>
        <CardContent>
          <form
            action={async (fd) => {
              setSaving(true);
              try {
                const result = await updateCompanyDetails(fd);
                if (result.success) {
                  addToast("Company details updated", "success");
                  router.refresh();
                } else {
                  addToast(result.error || "Failed to update", "error");
                }
              } catch (e) {
                addToast(e instanceof Error ? e.message : "Something went wrong — please try again", "error");
              }
              setSaving(false);
            }}
            className="space-y-5"
          >
            {/* Hidden input carries the logo URL into the server action */}
            <input type="hidden" name="logo" value={logoUrl} />

            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Company Name *</label>
              <Input name="name" required defaultValue={org.name} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Phone</label>
                <Input name="phone" type="tel" defaultValue={org.phone || ""} placeholder="e.g. 03 1234 5678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Email</label>
                <Input name="email" type="email" defaultValue={org.email || ""} placeholder="e.g. info@company.com.au" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Address</label>
              <Input name="address" defaultValue={org.address || ""} placeholder="e.g. 123 Main St, Melbourne VIC 3000" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Website</label>
                <Input name="website" defaultValue={org.website || ""} placeholder="e.g. www.company.com.au" />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">ABN</label>
                <Input name="abn" defaultValue={org.abn || ""} placeholder="e.g. 12 345 678 901" />
              </div>
            </div>

            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-2">Logo</label>

              {logoUrl ? (
                /* Preview */
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-[28px] border border-shark-200 dark:border-shark-700 bg-shark-50 dark:bg-shark-800 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-medium text-action-600 dark:text-action-400 hover:underline text-left"
                    >
                      Replace image
                    </button>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="text-sm text-red-500 hover:underline text-left"
                    >
                      Remove logo
                    </button>
                  </div>
                </div>
              ) : (
                /* Drop zone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 cursor-pointer
                    rounded-[28px] border-2 border-dashed px-6 py-8 transition-colors
                    ${dragOver
                      ? "border-action-400 bg-action-50 dark:bg-action-500/10"
                      : "border-shark-200 dark:border-shark-700 hover:border-action-300 dark:hover:border-action-700 bg-shark-50 dark:bg-shark-800/50"
                    }
                  `}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-action-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-shark-500">Uploading…</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-shark-100 dark:bg-shark-700 flex items-center justify-center">
                        <Icon name="upload" size={18} className="text-shark-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-shark-700 dark:text-shark-300">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-xs text-shark-400 mt-0.5">PNG, JPG, WebP, SVG · Max 5 MB</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/svg+xml"
                className="hidden"
                onChange={onFileChange}
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-shark-100 dark:border-shark-700">
              <Button type="submit" disabled={saving || uploading} loading={saving}>
                <Icon name="check" size={14} className="mr-1.5" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
