"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { DashboardClient } from "./dashboard-client";
import { StaffDashboardClient } from "./staff-dashboard-client";

interface Props {
  managerProps: React.ComponentProps<typeof DashboardClient>;
  staffProps: React.ComponentProps<typeof StaffDashboardClient>;
  briefingWidget?: React.ReactNode;
}

export function BranchManagerDashboard({ managerProps, staffProps, briefingWidget }: Props) {
  const [view, setView] = useState<"manager" | "staff">("manager");

  // Notify sidebar of view change
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("bm-dashboard-view", { detail: { view } }));
  }, [view]);

  // Reset to manager view when unmounting (navigating away)
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent("bm-dashboard-view", { detail: { view: "manager" } }));
    };
  }, []);

  return (
    <div>
      {/* View toggle — sits above everything */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex items-center gap-1 bg-shark-50 dark:bg-shark-800/60 rounded-xl p-1">
          <button
            onClick={() => setView("manager")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "manager"
                ? "bg-white dark:bg-shark-800 text-shark-900 dark:text-shark-100 shadow-sm"
                : "text-shark-500 dark:text-shark-400 hover:text-shark-700"
            }`}
          >
            <Icon name="bar-chart" size={14} />
            Manager
          </button>
          <button
            onClick={() => setView("staff")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "staff"
                ? "bg-white dark:bg-shark-800 text-shark-900 dark:text-shark-100 shadow-sm"
                : "text-shark-500 dark:text-shark-400 hover:text-shark-700"
            }`}
          >
            <Icon name="user" size={14} />
            Staff
          </button>
        </div>
      </div>

      {/* AI Briefing — between toggle and dashboard content */}
      {briefingWidget && <div className="mb-6">{briefingWidget}</div>}

      {view === "manager" ? (
        <DashboardClient {...managerProps} />
      ) : (
        <StaffDashboardClient {...staffProps} />
      )}
    </div>
  );
}
