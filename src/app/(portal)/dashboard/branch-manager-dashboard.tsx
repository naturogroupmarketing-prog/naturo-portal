"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { DashboardClient } from "./dashboard-client";
import { StaffDashboardClient } from "./staff-dashboard-client";

interface Props {
  managerProps: React.ComponentProps<typeof DashboardClient>;
  staffProps: React.ComponentProps<typeof StaffDashboardClient>;
}

export function BranchManagerDashboard({ managerProps, staffProps }: Props) {
  const [view, setView] = useState<"manager" | "staff">("manager");

  return (
    <div>
      {/* View toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex items-center gap-1 bg-shark-100 rounded-xl p-1">
          <button
            onClick={() => setView("manager")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === "manager"
                ? "bg-white text-shark-900 shadow-sm"
                : "text-shark-500 hover:text-shark-700"
            }`}
          >
            <Icon name="bar-chart" size={14} />
            Manager
          </button>
          <button
            onClick={() => setView("staff")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === "staff"
                ? "bg-white text-shark-900 shadow-sm"
                : "text-shark-500 hover:text-shark-700"
            }`}
          >
            <Icon name="user" size={14} />
            My Equipment
          </button>
        </div>
      </div>

      {view === "manager" ? (
        <DashboardClient {...managerProps} />
      ) : (
        <StaffDashboardClient {...staffProps} />
      )}
    </div>
  );
}
