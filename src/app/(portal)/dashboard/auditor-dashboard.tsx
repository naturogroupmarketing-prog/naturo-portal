import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

interface AuditorDashboardProps {
  orgName: string;
  stats: {
    totalAssets: number;
    totalConsumables: number;
    totalStaff: number;
    healthScore: number;
    lowStockCount: number;
    damageReports: number;
    pendingPOs: number;
    overdueReturns: number;
  };
  recentActivity: Array<{
    action: string;
    performedBy: string;
    createdAt: Date;
    metadata?: Record<string, unknown>;
  }>;
}

function KpiCard({ label, value, suffix, icon }: { label: string; value: number; suffix?: string; icon: "package" | "droplet" | "users" | "bar-chart" }) {
  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-action-500 flex items-center justify-center flex-shrink-0">
            <Icon name={icon} size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-shark-500 truncate">{label}</p>
            <p className="text-xl font-bold text-shark-900 dark:text-shark-100">
              {value}{suffix && <span className="text-sm font-medium text-shark-400 ml-0.5">{suffix}</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertCard({ label, value, description, icon }: { label: string; value: number; description: string; icon: "alert-triangle" | "truck" | "clock" | "x" }) {
  const isWarning = value > 0;
  return (
    <Card className={`hover:shadow-md transition-all duration-200 ${isWarning ? "border-amber-200" : ""}`}>
      <CardContent className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isWarning ? "bg-[#E8532E]" : "bg-action-500"}`}>
            <Icon name={icon} size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-shark-500 truncate">{label}</p>
            <p className={`text-xl font-bold ${isWarning ? "text-[#E8532E]" : "text-shark-900 dark:text-shark-100"}`}>{value}</p>
            <p className="text-[10px] text-shark-400 leading-tight mt-0.5">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AuditorDashboard({ orgName, stats, recentActivity }: AuditorDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
            <Icon name="bar-chart" size={14} className="text-action-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">
              Executive Overview
              <span className="text-shark-400 font-normal"> · {orgName}</span>
            </h3>
            <p className="text-xs text-shark-400">Organisation-wide summary</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-shark-100 dark:bg-shark-700 text-shark-500 border border-shark-200 dark:border-shark-700 self-start sm:self-auto">
          <Icon name="lock" size={12} />
          Read-only access
        </span>
      </div>

      {/* Read-only notice banner */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-blue-50 border border-blue-100">
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <Icon name="info" size={14} className="text-blue-600" />
        </div>
        <p className="text-sm text-blue-700 leading-relaxed">
          You have read-only access. Contact your administrator to make changes.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Key Metrics</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <KpiCard label="Total Assets" value={stats.totalAssets} icon="package" />
          <KpiCard label="Total Consumables" value={stats.totalConsumables} icon="droplet" />
          <KpiCard label="Total Staff" value={stats.totalStaff} icon="users" />
          <KpiCard label="Health Score" value={stats.healthScore} suffix="/100" icon="bar-chart" />
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Alerts</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <AlertCard label="Low Stock" value={stats.lowStockCount} description="Items at or below minimum threshold" icon="alert-triangle" />
          <AlertCard label="Damage Reports" value={stats.damageReports} description="Unresolved damage or loss reports" icon="x" />
          <AlertCard label="Pending POs" value={stats.pendingPOs} description="Purchase orders awaiting approval" icon="truck" />
          <AlertCard label="Overdue Returns" value={stats.overdueReturns} description="Items not returned by due date" icon="clock" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Recent Activity</p>
        <Card>
          <div className="divide-y divide-shark-50 dark:divide-shark-800">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                <div className="w-10 h-10 rounded-full bg-shark-100 dark:bg-shark-700 flex items-center justify-center">
                  <Icon name="clock" size={18} className="text-shark-400" />
                </div>
                <p className="text-sm text-shark-400">No recent activity to display.</p>
              </div>
            ) : (
              recentActivity.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-action-50 flex items-center justify-center flex-shrink-0">
                    <Icon name="clock" size={14} className="text-action-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">
                      {entry.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-shark-400">by {entry.performedBy}</p>
                  </div>
                  <span className="text-xs text-shark-400 flex-shrink-0">
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
