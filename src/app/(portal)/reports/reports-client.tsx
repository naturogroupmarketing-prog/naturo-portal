"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";

const reports: { id: string; name: string; description: string; icon: IconName; iconBg: string; iconColor: string; superAdminOnly?: boolean }[] = [
  { id: "assets", name: "Asset Register", description: "Full list of all assets with status and assignments", icon: "package", iconBg: "bg-action-500", iconColor: "text-white" },
  { id: "consumables", name: "Consumables by Location", description: "Stock levels by region", icon: "droplet", iconBg: "bg-action-500", iconColor: "text-white" },
  { id: "assignments", name: "Staff Assignments", description: "Assets assigned to each staff member", icon: "user", iconBg: "bg-action-500", iconColor: "text-white" },
  { id: "staff-consumable-usage", name: "Staff Consumable Usage", description: "Per-staff breakdown of consumable items issued", icon: "users", iconBg: "bg-action-500", iconColor: "text-white", superAdminOnly: true },
  { id: "stock-movement", name: "Stock Movement", description: "Consumable issue and restock history", icon: "bar-chart", iconBg: "bg-action-500", iconColor: "text-white" },
  { id: "requests", name: "Request History", description: "All consumable requests with status", icon: "clipboard", iconBg: "bg-action-500", iconColor: "text-white" },
  { id: "damage-loss", name: "Damage & Loss", description: "Damage and loss reports", icon: "alert-triangle", iconBg: "bg-action-500", iconColor: "text-white" },
  { id: "audit", name: "Audit Trail", description: "Complete system audit history", icon: "lock", iconBg: "bg-action-500", iconColor: "text-white" },
  { id: "maintenance", name: "Maintenance Schedule", description: "All maintenance tasks with due dates and history", icon: "settings", iconBg: "bg-action-500", iconColor: "text-white" },
];

export function ReportsClient({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const visibleReports = reports.filter((r) => !r.superAdminOnly || isSuperAdmin);

  function openPrintableReport(reportType: string) {
    window.open(`/api/reports/pdf?type=${reportType}`, "_blank");
  }

  async function downloadReport(reportId: string) {
    const res = await fetch(`/api/reports/${reportId}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trackio-${reportId}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-shark-900">Reports</h1>
        <p className="text-sm text-shark-400 mt-1">Export data as CSV or printable reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleReports.map((report) => (
          <Card key={report.id} className="hover:border-shark-200 hover:shadow-md transition-all duration-200">
            <CardContent className="py-5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${report.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon name={report.icon} size={18} className={report.iconColor} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-shark-800">{report.name}</h3>
                  <p className="text-xs text-shark-400 mt-1">{report.description}</p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadReport(report.id)}
                    >
                      <Icon name="download" size={14} className="mr-1.5" />
                      CSV
                    </Button>
                    {["assets", "consumables", "maintenance"].includes(report.id) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPrintableReport(report.id)}
                      >
                        <Icon name="file-text" size={14} className="mr-1.5" />
                        Print
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
