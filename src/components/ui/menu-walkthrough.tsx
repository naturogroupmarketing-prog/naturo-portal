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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={finish} />

      {/* Highlight cutout + tooltip */}
      {targetRect && (
        <>
          {/* Highlighted menu item */}
          <div
            className="absolute bg-white rounded-xl shadow-lg shadow-action-500/20 ring-2 ring-action-500 transition-all duration-300 z-[81]"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          />

          {/* Tooltip */}
          <div
            className="absolute z-[82] transition-all duration-300"
            style={{
              top: targetRect.top - 8,
              left: targetRect.right + 16,
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-xs w-72">
              {/* Arrow pointing left */}
              <div className="absolute -left-2 top-6 w-4 h-4 bg-white rotate-45 shadow-lg" />

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-action-500 flex items-center justify-center shrink-0">
                  <Icon name={current.icon} size={20} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-shark-900">{current.label}</h3>
              </div>

              <p className="text-sm text-shark-500 leading-relaxed mb-4">{current.description}</p>

              {/* Progress + actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === step ? "bg-action-500 w-4" : i < step ? "bg-action-300" : "bg-shark-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={finish} className="text-xs text-shark-400 hover:text-shark-600 transition-colors">
                    Skip
                  </button>
                  <Button size="sm" onClick={handleNext}>
                    {step >= steps.length - 1 ? "Done" : "Next"}
                  </Button>
                </div>
              </div>

              <p className="text-[10px] text-shark-300 mt-3">{step + 1} of {steps.length}</p>
            </div>
          </div>
        </>
      )}
    </div>,
    document.body
  );
}
