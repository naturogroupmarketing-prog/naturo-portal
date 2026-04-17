import { formatDistanceToNow } from "date-fns";

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

function KpiCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-shark-400 dark:text-shark-500 mb-2">
        {label}
      </p>
      <p className="text-3xl font-bold text-shark-900 dark:text-white">
        {value}
        {suffix && <span className="text-lg font-medium text-shark-400 ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

function AlertCard({ label, value, description }: { label: string; value: number; description: string }) {
  const isWarning = value > 0;
  return (
    <div
      className={`rounded-xl border p-5 ${
        isWarning
          ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
          : "bg-white border-shark-100 dark:bg-shark-900 dark:border-shark-800"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-shark-400 dark:text-shark-500 mb-2">
        {label}
      </p>
      <p
        className={`text-3xl font-bold mb-1 ${
          isWarning ? "text-amber-700 dark:text-amber-400" : "text-shark-900 dark:text-white"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-shark-500 dark:text-shark-400">{description}</p>
    </div>
  );
}

export function AuditorDashboard({ orgName, stats, recentActivity }: AuditorDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-shark-900 dark:text-white">
            Executive Overview
            <span className="text-shark-400 dark:text-shark-500 font-normal"> · {orgName}</span>
          </h1>
          <p className="text-sm text-shark-500 dark:text-shark-400 mt-0.5">
            Organisation-wide summary
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-shark-100 dark:bg-shark-800 text-shark-500 dark:text-shark-400 border border-shark-200 dark:border-shark-700 self-start sm:self-auto">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Read-only access
        </span>
      </div>

      {/* Read-only notice banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
        <svg className="mt-0.5 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          You have read-only access. Contact your administrator to make changes.
        </span>
      </div>

      {/* Top KPI row */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-shark-400 dark:text-shark-500 mb-3">
          Key Metrics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Assets" value={stats.totalAssets} />
          <KpiCard label="Total Consumables" value={stats.totalConsumables} />
          <KpiCard label="Total Staff" value={stats.totalStaff} />
          <KpiCard label="Health Score" value={stats.healthScore} suffix="/100" />
        </div>
      </div>

      {/* Alert metrics row */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-shark-400 dark:text-shark-500 mb-3">
          Alerts
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AlertCard
            label="Low Stock"
            value={stats.lowStockCount}
            description="Items at or below minimum threshold"
          />
          <AlertCard
            label="Damage Reports"
            value={stats.damageReports}
            description="Unresolved damage or loss reports"
          />
          <AlertCard
            label="Pending POs"
            value={stats.pendingPOs}
            description="Purchase orders awaiting approval"
          />
          <AlertCard
            label="Overdue Returns"
            value={stats.overdueReturns}
            description="Items not returned by due date"
          />
        </div>
      </div>

      {/* Recent Activity feed */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-shark-400 dark:text-shark-500 mb-3">
          Recent Activity
        </h2>
        <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800">
          {recentActivity.length === 0 ? (
            <p className="px-5 py-6 text-sm text-shark-400 dark:text-shark-500 text-center">
              No recent activity to display.
            </p>
          ) : (
            recentActivity.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-3 px-5 py-3">
                <div className="mt-0.5 w-7 h-7 rounded-full bg-shark-100 dark:bg-shark-800 flex items-center justify-center flex-shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-shark-400">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-shark-800 dark:text-shark-100 truncate">
                    {entry.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-shark-400 dark:text-shark-500">
                    by {entry.performedBy}
                  </p>
                </div>
                <span className="text-xs text-shark-400 dark:text-shark-500 flex-shrink-0 mt-0.5">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
