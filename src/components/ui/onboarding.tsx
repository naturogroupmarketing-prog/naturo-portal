"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import { Icon } from "./icon";

const ONBOARDING_STEPS = [
  {
    title: "Welcome to trackio!",
    description: "Let's take a quick tour of your dashboard. This will only take 30 seconds.",
    icon: "dashboard" as const,
  },
  {
    title: "Manage Assets",
    description: "Track all your equipment — assign to staff, generate QR codes, monitor condition, and handle returns.",
    icon: "package" as const,
  },
  {
    title: "Track Consumables",
    description: "Monitor stock levels with automatic low-stock alerts and purchase order generation when items run low.",
    icon: "droplet" as const,
  },
  {
    title: "AI Assistant",
    description: "Use the chat bubble (bottom right) to search inventory, compare regions, create items, and get insights — all in plain English.",
    icon: "message-circle" as const,
  },
  {
    title: "Quick Navigation",
    description: "Press Cmd+K (or Ctrl+K) anytime to instantly jump to any page in the app.",
    icon: "search" as const,
  },
];

export function OnboardingOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay for mount animation
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setVisible(false);
      setTimeout(onComplete, 300);
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    setVisible(false);
    setTimeout(onComplete, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className={`bg-white dark:bg-shark-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-all duration-300 ${visible ? "scale-100" : "scale-95"}`}>
        {/* Progress bar */}
        <div className="h-1 bg-shark-100">
          <div
            className="h-full bg-action-500 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="px-8 py-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-action-500 flex items-center justify-center mx-auto mb-5">
            <Icon name={current.icon} size={28} className="text-white" />
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold text-shark-900 dark:text-shark-100 mb-3">{current.title}</h2>
          <p className="text-sm text-shark-500 leading-relaxed mb-8">{current.description}</p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-shark-400 hover:text-shark-600 transition-colors"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-3">
              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                {ONBOARDING_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === step ? "bg-action-500 w-5" : i < step ? "bg-action-300" : "bg-shark-200"
                    }`}
                  />
                ))}
              </div>

              <Button onClick={handleNext} size="sm">
                {isLast ? "Get Started" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
