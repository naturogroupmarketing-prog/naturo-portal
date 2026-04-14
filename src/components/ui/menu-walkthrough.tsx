"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";
import { Icon, type IconName } from "./icon";

interface WalkthroughStep {
  label: string;
  icon: IconName;
  description: string;
}

const ADMIN_STEPS: WalkthroughStep[] = [
  { label: "Dashboard", icon: "dashboard", description: "Your command centre — overview of all regions, stats, health scores, and quick actions." },
  { label: "Inventory", icon: "package", description: "View all assets and consumables across every region. Click a region to manage its items." },
  { label: "Purchase Orders", icon: "truck", description: "Track orders from pending to received. Auto-generated when stock runs low." },
  { label: "Staff", icon: "users", description: "Manage your team — create accounts, assign regions, view equipment, and track usage." },
  { label: "Starter Kits", icon: "box", description: "Pre-built equipment bundles. Apply to new staff to assign all their items in one click." },
  { label: "Returns", icon: "arrow-left", description: "Review and confirm items returned by staff. Verified items go back into stock." },
  { label: "Maintenance", icon: "settings", description: "Schedule and track maintenance for assets. Get alerts when service is due." },
  { label: "Reports", icon: "clipboard", description: "Export data, view analytics, and generate reports for your organisation." },
  { label: "Inspections", icon: "search", description: "Set up condition check schedules for staff and review submitted inspections." },
];

const STAFF_STEPS: WalkthroughStep[] = [
  { label: "Dashboard", icon: "dashboard", description: "Your personal hub — see assigned items, pending checklists, and condition checks." },
  { label: "My Assets", icon: "package", description: "View equipment assigned to you. Confirm receipt of new items here." },
  { label: "My Consumables", icon: "droplet", description: "Track consumables you've received. Mark items as used when finished." },
  { label: "My Requests", icon: "clipboard", description: "View status of your consumable requests — pending, approved, or rejected." },
  { label: "Request Consumables", icon: "plus", description: "Need more supplies? Submit a request to your manager for approval." },
  { label: "Report Damage", icon: "alert-triangle", description: "Report damaged or lost equipment. Your manager will be notified." },
];

const STORAGE_KEY = "trackio-menu-walkthrough-complete";

export function MenuWalkthrough({ role }: { role: string }) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps = role === "STAFF" ? STAFF_STEPS : ADMIN_STEPS;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay to let sidebar render
      const t = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const updateTarget = useCallback(() => {
    if (!active || step >= steps.length) return;
    const current = steps[step];
    // Find the sidebar link by its text content
    const links = document.querySelectorAll("nav a");
    for (const link of links) {
      if (link.textContent?.trim().startsWith(current.label)) {
        setTargetRect(link.getBoundingClientRect());
        return;
      }
    }
    setTargetRect(null);
  }, [active, step, steps]);

  useEffect(() => {
    updateTarget();
    window.addEventListener("resize", updateTarget);
    return () => window.removeEventListener("resize", updateTarget);
  }, [updateTarget]);

  const handleNext = () => {
    if (step >= steps.length - 1) {
      finish();
    } else {
      setStep(step + 1);
    }
  };

  const finish = () => {
    setActive(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!active || typeof document === "undefined") return null;

  const current = steps[step];

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      {/* Slightly darkened click-away layer */}
      <div className="absolute inset-0 bg-black/15" onClick={finish} />

      {/* Highlight + tooltip */}
      {targetRect && (
        <>
          {/* Subtle highlight ring around menu item — no solid background */}
          <div
            className="absolute rounded-xl ring-2 ring-action-500 ring-offset-2 transition-all duration-300 z-[81] pointer-events-none"
            style={{
              top: targetRect.top - 2,
              left: targetRect.left - 2,
              width: targetRect.width + 4,
              height: targetRect.height + 4,
            }}
          />

          {/* Google-style tooltip — light, clean, with subtle shadow */}
          <div
            className="absolute z-[82] transition-all duration-300"
            style={{
              top: targetRect.top - 8,
              left: targetRect.right + 16,
            }}
          >
            <div className="bg-white/95 dark:bg-shark-800/95 backdrop-blur-sm rounded-xl shadow-lg shadow-shark-900/10 border border-shark-100 dark:border-shark-700 p-4 max-w-xs w-64">
              {/* Arrow pointing left */}
              <div className="absolute -left-1.5 top-5 w-3 h-3 bg-white/95 dark:bg-shark-800/95 rotate-45 border-l border-b border-shark-100 dark:border-shark-700" />

              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-action-500 flex items-center justify-center shrink-0">
                  <Icon name={current.icon} size={16} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">{current.label}</h3>
              </div>

              <p className="text-xs text-shark-500 dark:text-shark-400 leading-relaxed mb-3">{current.description}</p>

              {/* Progress + actions */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-shark-400">{step + 1} / {steps.length}</span>
                <div className="flex items-center gap-2">
                  <button onClick={finish} className="text-xs text-shark-400 hover:text-shark-600 dark:hover:text-shark-300 transition-colors">
                    Skip
                  </button>
                  <Button size="sm" onClick={handleNext}>
                    {step >= steps.length - 1 ? "Done" : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>,
    document.body
  );
}
