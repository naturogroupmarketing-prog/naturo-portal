"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface Props {
  org: {
    name: string;
    subscriptionStatus: string;
    maxUsers: number;
    maxAssets: number;
    trialEndsAt: string | null;
    _count: { users: number; assets: number };
  };
}

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    features: ["Up to 3 users", "50 assets", "Basic reporting", "Community support"],
    highlighted: false,
    current: "FREE",
  },
  {
    name: "Admin",
    price: "$47",
    period: "/month",
    features: ["Up to 15 users", "500 assets", "AI assistant", "Advanced reporting", "Email support"],
    highlighted: false,
    current: "ADMIN",
  },
  {
    name: "Professional",
    price: "$79",
    period: "/month",
    features: ["Up to 75 users", "2,000 assets", "AI assistant", "Full reporting", "Priority support", "Condition checks"],
    highlighted: true,
    current: "PRO",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["Unlimited users", "Unlimited assets", "Custom onboarding", "Dedicated support", "SLA guarantee", "API access"],
    highlighted: false,
    current: "ENTERPRISE",
  },
];

export function BillingClient({ org }: Props) {
  const { addToast } = useToast();
  const [backingUp, setBackingUp] = useState(false);
  const trialEnds = org.trialEndsAt ? new Date(org.trialEndsAt) : null;
  const isTrialing = org.subscriptionStatus === "TRIALING";
  const trialDaysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Backup failed");
      const data = await res.json();

      // Download each CSV file
      for (const key of ["assets", "consumables", "staff", "regions"] as const) {
        const file = data.files[key];
        if (file.count === 0) continue;
        const blob = new Blob([file.content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.filename;
        a.click();
        URL.revokeObjectURL(url);
        // Small delay between downloads so browser doesn't block them
        await new Promise((r) => setTimeout(r, 300));
      }

      addToast(`Backup downloaded: ${data.files.assets.count} assets, ${data.files.consumables.count} consumables, ${data.files.staff.count} staff`, "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Backup failed", "error");
    }
    setBackingUp(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-shark-900">Billing & Plans</h1>
        <p className="text-sm text-shark-400 mt-1">Manage your subscription and usage</p>
      </div>

      {/* Current Plan */}
      <Card>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-shark-900">Current Plan</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge status={org.subscriptionStatus} />
                {isTrialing && trialDaysLeft > 0 && (
                  <span className="text-xs text-[#E8532E] font-medium">{trialDaysLeft} days left in trial</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-shark-400">Organisation</p>
              <p className="text-sm font-semibold text-shark-800">{org.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="bg-shark-50 rounded-xl px-4 py-3">
              <p className="text-xs text-shark-400">Users</p>
              <p className="text-lg font-bold text-shark-900">{org._count.users} <span className="text-sm font-normal text-shark-400">/ {org.maxUsers}</span></p>
              <div className="w-full h-1.5 bg-shark-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-action-500 rounded-full" style={{ width: `${Math.min(100, (org._count.users / org.maxUsers) * 100)}%` }} />
              </div>
            </div>
            <div className="bg-shark-50 rounded-xl px-4 py-3">
              <p className="text-xs text-shark-400">Assets</p>
              <p className="text-lg font-bold text-shark-900">{org._count.assets} <span className="text-sm font-normal text-shark-400">/ {org.maxAssets}</span></p>
              <div className="w-full h-1.5 bg-shark-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-action-500 rounded-full" style={{ width: `${Math.min(100, (org._count.assets / org.maxAssets) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Plans */}
      <div>
        <h3 className="text-lg font-semibold text-shark-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={plan.highlighted ? "ring-2 ring-action-500 relative" : ""}>
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-action-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="px-5 py-5">
                <h4 className="text-lg font-bold text-shark-900">{plan.name}</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-shark-900">{plan.price}</span>
                  <span className="text-sm text-shark-400">{plan.period}</span>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-shark-600">
                      <Icon name="check" size={14} className="text-action-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full mt-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-action-500 text-white hover:bg-action-600"
                      : "border-2 border-shark-200 text-shark-700 hover:border-action-500 hover:text-action-500"
                  }`}
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Upgrade"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Data Backup */}
      <Card>
        <div className="px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="download" size={18} className="text-action-500" />
                <h3 className="text-lg font-semibold text-shark-900">Data Backup</h3>
              </div>
              <p className="text-sm text-shark-400 mt-1">
                Download all your assets, consumables, and staff data as CSV files. These files can be re-uploaded via Import Data if needed.
              </p>
            </div>
            <Button onClick={handleBackup} loading={backingUp} disabled={backingUp} className="shrink-0">
              <Icon name="download" size={14} className="mr-1.5" />
              {backingUp ? "Downloading..." : "Download Backup"}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-shark-400">
            <span className="bg-shark-50 px-2 py-1 rounded">Assets CSV</span>
            <span className="bg-shark-50 px-2 py-1 rounded">Consumables CSV</span>
            <span className="bg-shark-50 px-2 py-1 rounded">Staff CSV</span>
            <span className="bg-shark-50 px-2 py-1 rounded">Regions CSV</span>
          </div>
          <p className="text-xs text-shark-400 mt-3">
            To restore from backup, go to <a href="/admin/import" className="text-action-500 hover:text-action-600 font-medium">Import Data</a> and upload the CSV files.
          </p>
        </div>
      </Card>

      <p className="text-xs text-shark-400 text-center">
        Need help choosing a plan? Contact us at support@trackio.com.au
      </p>
    </div>
  );
}
