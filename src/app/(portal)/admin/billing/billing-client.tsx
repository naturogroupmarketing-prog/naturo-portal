"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { changePlan } from "@/app/actions/billing";

interface Props {
  org: {
    name: string;
    plan: string;
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
    key: "FREE",
    price: "$0",
    period: "",
    users: 3,
    assets: 50,
    features: ["Up to 3 users", "50 assets", "Basic reporting", "Community support"],
  },
  {
    name: "Admin",
    key: "ADMIN",
    price: "$47",
    period: "/month",
    users: 15,
    assets: 500,
    features: ["Up to 15 users", "500 assets", "AI assistant", "Advanced reporting", "Email support"],
  },
  {
    name: "Professional",
    key: "PRO",
    price: "$79",
    period: "/month",
    users: 75,
    assets: 2000,
    features: ["Up to 75 users", "2,000 assets", "AI assistant", "Full reporting", "Priority support", "Condition checks"],
  },
  {
    name: "Enterprise",
    key: "ENTERPRISE",
    price: "Custom",
    period: "",
    users: Infinity,
    assets: Infinity,
    features: ["Unlimited users", "Unlimited assets", "Custom onboarding", "Dedicated support", "SLA guarantee", "API access"],
  },
];

export function BillingClient({ org }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [changing, setChanging] = useState<string | null>(null);
  const trialEnds = org.trialEndsAt ? new Date(org.trialEndsAt) : null;
  const isTrialing = org.subscriptionStatus === "TRIALING";
  const trialDaysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const currentPlan = PLANS.find((p) => p.key === org.plan) || PLANS[0];
  const currentPlanIndex = PLANS.findIndex((p) => p.key === org.plan);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-shark-900 dark:text-shark-100 tracking-tight">Billing & Plans</h1>
        <p className="text-sm text-shark-400 mt-1">Manage your subscription and usage</p>
      </div>

      {/* Current Plan */}
      <Card className="">
        <div className="px-4 sm:px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-shark-900 dark:text-shark-100">Current Plan: {currentPlan.name}</h3>
                <Badge status={org.subscriptionStatus} />
              </div>
              {isTrialing && trialDaysLeft > 0 && (
                <p className="text-xs text-[#E8532E] font-medium mt-1">{trialDaysLeft} days left in trial</p>
              )}
              <p className="text-sm text-shark-400 mt-1">{org.name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-shark-900 dark:text-shark-100">{currentPlan.price}</p>
              {currentPlan.period && <p className="text-xs text-shark-400">{currentPlan.period}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="bg-shark-50 rounded-xl px-4 py-3">
              <p className="text-xs text-shark-400">Users</p>
              <p className="text-lg font-bold text-shark-900 dark:text-shark-100">{org._count.users} <span className="text-sm font-normal text-shark-400">/ {currentPlan.users === Infinity ? "Unlimited" : currentPlan.users}</span></p>
              {currentPlan.users !== Infinity && (
                <div className="w-full h-1.5 bg-shark-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-action-500 rounded-full" style={{ width: `${Math.min(100, (org._count.users / currentPlan.users) * 100)}%` }} />
                </div>
              )}
            </div>
            <div className="bg-shark-50 rounded-xl px-4 py-3">
              <p className="text-xs text-shark-400">Assets</p>
              <p className="text-lg font-bold text-shark-900 dark:text-shark-100">{org._count.assets} <span className="text-sm font-normal text-shark-400">/ {currentPlan.assets === Infinity ? "Unlimited" : currentPlan.assets}</span></p>
              {currentPlan.assets !== Infinity && (
                <div className="w-full h-1.5 bg-shark-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-action-500 rounded-full" style={{ width: `${Math.min(100, (org._count.assets / currentPlan.assets) * 100)}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Plans */}
      <div>
        <h3 className="text-lg font-semibold text-shark-900 dark:text-shark-100 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan, idx) => {
            const isCurrent = plan.key === org.plan;
            const isUpgrade = idx > currentPlanIndex;
            const isDowngrade = idx < currentPlanIndex;
            const isPopular = plan.key === "PRO";

            return (
              <Card
                key={plan.key}
                className={
                  isCurrent ? "ring-2 ring-action-500 relative" :
                  isPopular ? "ring-1 ring-action-200 relative" : ""
                }
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-action-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    Current Plan
                  </div>
                )}
                {!isCurrent && isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-shark-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Popular
                  </div>
                )}
                <div className="px-4 sm:px-5 py-5">
                  <h4 className="text-lg font-bold text-shark-900 dark:text-shark-100">{plan.name}</h4>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-shark-900 dark:text-shark-100">{plan.price}</span>
                    <span className="text-sm text-shark-400">{plan.period}</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-shark-600">
                        <Icon name="check" size={14} className="text-action-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={isCurrent || changing === plan.key}
                    onClick={async () => {
                      if (isCurrent || plan.price === "Custom") return;
                      setChanging(plan.key);
                      try {
                        await changePlan(plan.key);
                        addToast(`Plan changed to ${plan.name}`, "success");
                        router.refresh();
                      } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
                      setChanging(null);
                    }}
                    className={`w-full mt-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isCurrent
                        ? "bg-action-50 text-action-600 cursor-default"
                        : isUpgrade
                          ? "bg-action-500 text-white hover:bg-action-600"
                          : isDowngrade
                            ? "border-2 border-shark-200 dark:border-shark-700 text-shark-500 hover:border-shark-300 dark:hover:border-shark-600"
                            : "border-2 border-shark-200 dark:border-shark-700 text-shark-700 dark:text-shark-300 hover:border-action-500 hover:text-action-500"
                    }`}
                  >
                    {changing === plan.key ? "Changing..." :
                     isCurrent ? "Current Plan" :
                     plan.price === "Custom" ? "Contact Sales" :
                     isUpgrade ? "Upgrade" : "Downgrade"}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-shark-400 text-center">
        Need help choosing a plan? Contact us at support@trackio.com.au
      </p>
    </div>
  );
}
