"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

interface Props {
  assetCount: number;
  consumableCount: number;
  staffCount: number;
  regionCount: number;
}

export function BackupClient({ assetCount, consumableCount, staffCount, regionCount }: Props) {
  const { addToast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (type: "all" | "assets" | "consumables" | "staff" | "regions") => {
    setDownloading(type);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Backup failed");
      const data = await res.json();

      if (type === "all") {
        for (const key of ["assets", "consumables", "staff", "regions"] as const) {
          const file = data.files[key];
          if (file.count === 0) continue;
          downloadFile(file.filename, file.content);
          await new Promise((r) => setTimeout(r, 300));
        }
        addToast("Full backup downloaded", "success");
      } else {
        const file = data.files[type];
        if (file.count === 0) {
          addToast(`No ${type} data to download`, "warning");
        } else {
          downloadFile(file.filename, file.content);
          addToast(`${file.count} ${type} downloaded`, "success");
        }
      }
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Download failed", "error");
    }
    setDownloading(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-shark-900 tracking-tight">Data Backup</h1>
        <p className="text-sm text-shark-400 mt-1">Download your data as CSV files that can be re-imported anytime</p>
      </div>

      {/* Full Backup */}
      <Card className="border-l-4 border-l-action-500">
        <CardContent className="py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-shark-900">Full Backup</h3>
              <p className="text-sm text-shark-400 mt-0.5">
                Downloads all 4 files at once — assets, consumables, staff, and regions
              </p>
              <p className="text-xs text-shark-400 mt-1">
                {assetCount + consumableCount + staffCount + regionCount} total records
              </p>
            </div>
            <Button onClick={() => handleDownload("all")} loading={downloading === "all"} disabled={!!downloading}>
              <Icon name="download" size={14} className="mr-1.5" />
              Download All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual Downloads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { key: "assets" as const, label: "Assets", count: assetCount, icon: "package" as const, description: "Name, category, serial number, status, assigned to, purchase info" },
          { key: "consumables" as const, label: "Consumables", count: consumableCount, icon: "droplet" as const, description: "Name, category, unit type, quantity, thresholds, supplier" },
          { key: "staff" as const, label: "Staff", count: staffCount, icon: "users" as const, description: "Name, email, phone, role, region, status" },
          { key: "regions" as const, label: "Regions", count: regionCount, icon: "map-pin" as const, description: "Region name, state, region ID for reference" },
        ].map((item) => (
          <Card key={item.key}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-action-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name={item.icon} size={18} className="text-action-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-shark-900">{item.label}</h4>
                    <p className="text-xs text-shark-400 mt-0.5">{item.description}</p>
                    <p className="text-xs text-shark-500 font-medium mt-1">{item.count} records</p>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-3"
                onClick={() => handleDownload(item.key)}
                loading={downloading === item.key}
                disabled={!!downloading || item.count === 0}
              >
                <Icon name="download" size={14} className="mr-1.5" />
                Download CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Restore Info */}
      <Card className="bg-shark-50/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Icon name="help-circle" size={18} className="text-shark-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-shark-700">How to restore from backup</h4>
              <p className="text-sm text-shark-500 mt-1">
                Go to <Link href="/admin/import" className="text-action-500 hover:text-action-600 font-medium">Import Data</Link> and
                upload any of the downloaded CSV files. The column headers will be matched automatically. Assets and consumables will be
                created in their original regions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
