"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";
import { INDUSTRY_LIST } from "@/lib/industry-templates";
import { completeOnboarding, skipOnboarding } from "@/app/actions/onboarding";
import type { IndustryId } from "@/lib/industry-templates";
// OnboardingData type is used via completeOnboarding params

// ─── Step config ──────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

// ─── Choice option type ───────────────────────────────────────────────────────

interface ChoiceOption {
  value: string;
  label: string;
  sublabel: string;
  icon?: string;
}

const LOCATION_OPTIONS: ChoiceOption[] = [
  { value: "1", label: "Just one", sublabel: "Single site or office" },
  { value: "2-5", label: "2–5", sublabel: "A few locations" },
  { value: "6-20", label: "6–20", sublabel: "Regional or state-wide" },
  { value: "20+", label: "20+", sublabel: "Large multi-site operation" },
];

const TEAM_OPTIONS: ChoiceOption[] = [
  { value: "1-5", label: "1–5 people", sublabel: "Small, tight-knit team" },
  { value: "6-20", label: "6–20 people", sublabel: "Growing team" },
  { value: "21-100", label: "21–100 people", sublabel: "Mid-size organisation" },
  { value: "100+", label: "100+ people", sublabel: "Large enterprise" },
];

const PRIORITY_OPTIONS: ChoiceOption[] = [
  { value: "track-assets", label: "Track assets", sublabel: "Know where everything is" },
  { value: "consumables", label: "Control consumables", sublabel: "Stop running out of supplies" },
  { value: "reduce-loss", label: "Reduce loss", sublabel: "Cut missing or stolen items" },
  { value: "multi-location", label: "Multi-location visibility", sublabel: "See across all sites at once" },
  { value: "accountability", label: "Staff accountability", sublabel: "Know who has what" },
  { value: "compliance", label: "Compliance & auditing", sublabel: "Meet regulatory requirements" },
];

// ─── Generation steps ─────────────────────────────────────────────────────────

const GENERATION_STEPS = [
  "Analysing your industry profile…",
  "Creating asset categories…",
  "Setting up consumable types…",
  "Configuring workflow automations…",
  "Preparing your dashboard…",
  "Your workspace is ready!",
];

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-action-500 flex items-center justify-center">
        <Icon name="package" size={14} className="text-white" />
      </div>
      <span className="text-sm font-bold text-shark-900 tracking-tight">trackio</span>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);
  return (
    <div className="w-full h-0.5 bg-shark-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-action-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Industry card ────────────────────────────────────────────────────────────

function IndustryCard({
  industry,
  selected,
  onSelect,
}: {
  industry: (typeof INDUSTRY_LIST)[0];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-150 group relative ${
        selected
          ? "border-action-500 bg-action-50 shadow-sm"
          : "border-shark-100 bg-white hover:border-shark-200 hover:shadow-sm"
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-action-500 flex items-center justify-center">
          <Icon name="check" size={11} className="text-white" />
        </div>
      )}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
          selected ? "bg-action-500" : "bg-action-50 group-hover:bg-action-100"
        }`}
      >
        <Icon
          name={industry.icon}
          size={18}
          className={selected ? "text-white" : "text-action-600"}
        />
      </div>
      <p className={`text-sm font-semibold mb-1 ${selected ? "text-action-700" : "text-shark-900"}`}>
        {industry.name}
      </p>
      <p className="text-xs text-shark-400 leading-relaxed">{industry.description}</p>
    </button>
  );
}

// ─── Choice tile ──────────────────────────────────────────────────────────────

function ChoiceTile({
  option,
  selected,
  onSelect,
  cols,
}: {
  option: ChoiceOption;
  selected: boolean;
  onSelect: () => void;
  cols?: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 relative ${
        selected
          ? "border-action-500 bg-action-50 shadow-sm"
          : "border-shark-100 bg-white hover:border-shark-200 hover:shadow-sm"
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-action-500 flex items-center justify-center">
          <Icon name="check" size={11} className="text-white" />
        </div>
      )}
      <p className={`text-base font-bold mb-0.5 ${selected ? "text-action-700" : "text-shark-900"}`}>
        {option.label}
      </p>
      <p className="text-xs text-shark-400">{option.sublabel}</p>
    </button>
  );
}

// ─── Generation animation ─────────────────────────────────────────────────────

function GeneratingScreen({
  industry,
  onDone,
}: {
  industry: IndustryId;
  onDone: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const template = INDUSTRY_LIST.find((i) => i.id === industry);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= GENERATION_STEPS.length - 1) {
        clearInterval(interval);
        setTimeout(onDone, 600);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [onDone]);

  const isDone = currentStep >= GENERATION_STEPS.length - 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center px-4">
      {/* Animated icon */}
      <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${isDone ? "bg-action-500 scale-110" : "bg-action-50"}`}>
        {isDone ? (
          <Icon name="check-circle" size={36} className="text-white" />
        ) : (
          <>
            <Icon name={template?.icon ?? "package"} size={32} className="text-action-600" />
            {/* Spinner ring */}
            <svg
              className="absolute inset-0 w-full h-full animate-spin"
              style={{ animationDuration: "1.5s" }}
              viewBox="0 0 80 80"
            >
              <circle
                cx="40" cy="40" r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeOpacity="0.12"
                className="text-action-500"
              />
              <circle
                cx="40" cy="40" r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="60 160"
                strokeLinecap="round"
                className="text-action-500"
              />
            </svg>
          </>
        )}
      </div>

      {/* Step list */}
      <div className="space-y-2 w-full max-w-xs">
        {GENERATION_STEPS.map((label, idx) => {
          const done = idx < currentStep;
          const active = idx === currentStep;
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                done
                  ? "opacity-100"
                  : active
                  ? "opacity-100 bg-action-50"
                  : "opacity-0"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  done ? "bg-action-500" : active ? "bg-action-100" : "bg-shark-100"
                }`}
              >
                {done ? (
                  <Icon name="check" size={10} className="text-white" />
                ) : active ? (
                  <div className="w-2 h-2 rounded-full bg-action-500 animate-pulse" />
                ) : null}
              </div>
              <span
                className={`text-sm text-left ${
                  done ? "text-shark-500 line-through" : active ? "text-shark-900 font-medium" : "text-shark-300"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({
  industry,
  orgName,
  onEnter,
}: {
  industry: IndustryId;
  orgName: string;
  onEnter: () => void;
}) {
  const template = INDUSTRY_LIST.find((i) => i.id === industry);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center text-center px-4 max-w-lg mx-auto gap-6 py-8">
      <div className="w-16 h-16 rounded-2xl bg-action-500 flex items-center justify-center shadow-lg shadow-action-500/30">
        <Icon name={template?.icon ?? "check-circle"} size={28} className="text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-shark-900 mb-2">
          Your workspace is ready! 🎉
        </h2>
        <p className="text-shark-500 text-sm leading-relaxed">
          We&apos;ve set up <span className="font-semibold text-shark-700">{orgName}</span> as a{" "}
          <span className="font-semibold text-action-600">{template?.name}</span> operation —
          with industry-specific categories and workflow automations pre-configured.
        </p>
      </div>

      {/* What was created */}
      <div className="w-full bg-shark-50 rounded-2xl p-4 text-left space-y-2">
        <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest mb-3">What we set up for you</p>
        {[
          `${template?.assetCategories.length ?? 0} asset categories`,
          `${template?.consumableCategories.length ?? 0} consumable categories`,
          `${template?.defaultWorkflows.length ?? 0} workflow automations`,
        ].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-action-500 flex items-center justify-center shrink-0">
              <Icon name="check" size={9} className="text-white" />
            </div>
            <span className="text-sm text-shark-700">{item}</span>
          </div>
        ))}
      </div>

      {/* Next steps */}
      {template && (
        <div className="w-full text-left">
          <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest mb-3">Suggested next steps</p>
          <div className="space-y-2">
            {template.postSetupChecklist.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full border-2 border-shark-200 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-shark-400">{i + 1}</span>
                </div>
                <span className="text-sm text-shark-600">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => startTransition(onEnter)}
        disabled={isPending}
        className="w-full py-3 px-6 bg-action-500 hover:bg-action-600 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.98] text-sm disabled:opacity-60"
      >
        {isPending ? "Opening your workspace…" : "Enter trackio →"}
      </button>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

interface SetupWizardProps {
  orgName: string;
  alreadySkipped: boolean;
  existingIndustry?: string;
}

export function SetupWizard({ orgName, alreadySkipped, existingIndustry }: SetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Answers
  const [industry, setIndustry] = useState<IndustryId | "">(
    (existingIndustry as IndustryId) ?? ""
  );
  const [locationCount, setLocationCount] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [mainPriority, setMainPriority] = useState("");

  const selectedTemplate = INDUSTRY_LIST.find((i) => i.id === industry);

  // ─ Navigation ─
  function goTo(target: number, dir: "forward" | "back") {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(target);
      setAnimating(false);
    }, 180);
  }

  function next() {
    if (step < TOTAL_STEPS) goTo(step + 1, "forward");
  }

  function back() {
    if (step > 1) goTo(step - 1, "back");
  }

  // ─ Skip ─
  function handleSkip() {
    startTransition(async () => {
      await skipOnboarding();
      router.push("/dashboard");
    });
  }

  // ─ Submit ─
  function handleGenerate() {
    if (!industry || !locationCount || !teamSize || !mainPriority) return;
    setGenerating(true);
    setError(null);
  }

  async function handleGenerationDone() {
    try {
      await completeOnboarding({
        industry: industry as IndustryId,
        locationCount,
        teamSize,
        mainPriority,
      });
      setGenerating(false);
      setGenerated(true);
    } catch (err) {
      setGenerating(false);
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  // ─ Can continue? ─
  const canContinue =
    (step === 1 && !!industry) ||
    (step === 2 && !!locationCount) ||
    (step === 3 && !!teamSize) ||
    (step === 4 && !!mainPriority);

  // Auto-advance on selection for steps 1-4
  function selectAndAdvance<T>(setter: (v: T) => void, value: T, stepNum: number) {
    setter(value);
    if (step === stepNum) {
      setTimeout(() => goTo(stepNum + 1, "forward"), 300);
    }
  }

  // ─ Animation classes ─
  const enterClass = direction === "forward" ? "translate-x-6 opacity-0" : "-translate-x-6 opacity-0";
  const contentClass = animating
    ? `${enterClass} pointer-events-none`
    : "translate-x-0 opacity-100";

  // ─ Generating / Success ─
  if (generated) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-shark-100">
          <Logo />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <SuccessScreen
            industry={industry as IndustryId}
            orgName={orgName}
            onEnter={() => router.push("/dashboard")}
          />
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-shark-100">
          <Logo />
          <span className="text-xs text-shark-400">Setting up {orgName}…</span>
        </header>
        <div className="flex-1">
          <GeneratingScreen
            industry={industry as IndustryId}
            onDone={handleGenerationDone}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-shark-100">
        <Logo />

        <div className="hidden sm:flex items-center gap-3 flex-1 mx-8 max-w-xs">
          <span className="text-[11px] text-shark-400 font-medium shrink-0">Step {step} of {TOTAL_STEPS}</span>
          <ProgressBar step={step} />
        </div>

        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending}
          className="text-sm text-shark-400 hover:text-shark-600 transition-colors disabled:opacity-50"
        >
          {alreadySkipped ? "Exit" : "Skip for now"}
        </button>
      </header>

      {/* Mobile progress */}
      <div className="sm:hidden px-5 pt-3">
        <ProgressBar step={step} />
        <p className="text-[11px] text-shark-400 mt-1.5">Step {step} of {TOTAL_STEPS}</p>
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-start px-5 sm:px-8 py-8 sm:py-12">
        <div
          className={`w-full max-w-3xl transition-all duration-180 ease-out ${contentClass}`}
          style={{ transitionDuration: "180ms" }}
        >
          {/* ── Step 1: Industry ── */}
          {step === 1 && (
            <div>
              <div className="mb-8 text-center">
                <p className="text-[11px] font-semibold text-action-500 uppercase tracking-widest mb-2">Step 1</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-shark-900 mb-2">
                  What best describes your business?
                </h1>
                <p className="text-shark-400 text-sm">
                  We&apos;ll pre-configure trackio with the right categories, workflows, and terminology for your industry.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {INDUSTRY_LIST.map((ind) => (
                  <IndustryCard
                    key={ind.id}
                    industry={ind}
                    selected={industry === ind.id}
                    onSelect={() => selectAndAdvance(setIndustry, ind.id as IndustryId, 1)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Locations ── */}
          {step === 2 && (
            <div>
              <div className="mb-8 text-center">
                <p className="text-[11px] font-semibold text-action-500 uppercase tracking-widest mb-2">Step 2</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-shark-900 mb-2">
                  How many {selectedTemplate?.terminology.location.toLowerCase() ?? "location"}s do you operate?
                </h1>
                <p className="text-shark-400 text-sm">
                  This helps us recommend the right regional structure for your account.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
                {LOCATION_OPTIONS.map((opt) => (
                  <ChoiceTile
                    key={opt.value}
                    option={opt}
                    selected={locationCount === opt.value}
                    onSelect={() => selectAndAdvance(setLocationCount, opt.value, 2)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Team size ── */}
          {step === 3 && (
            <div>
              <div className="mb-8 text-center">
                <p className="text-[11px] font-semibold text-action-500 uppercase tracking-widest mb-2">Step 3</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-shark-900 mb-2">
                  How many {selectedTemplate?.terminology.staff.toLowerCase() ?? "staff"} are on your team?
                </h1>
                <p className="text-shark-400 text-sm">
                  We&apos;ll size your account and recommend the right role structure.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
                {TEAM_OPTIONS.map((opt) => (
                  <ChoiceTile
                    key={opt.value}
                    option={opt}
                    selected={teamSize === opt.value}
                    onSelect={() => selectAndAdvance(setTeamSize, opt.value, 3)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Priority ── */}
          {step === 4 && (
            <div>
              <div className="mb-8 text-center">
                <p className="text-[11px] font-semibold text-action-500 uppercase tracking-widest mb-2">Step 4</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-shark-900 mb-2">
                  What&apos;s your main priority right now?
                </h1>
                <p className="text-shark-400 text-sm">
                  We&apos;ll surface the most relevant features first on your dashboard.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto">
                {PRIORITY_OPTIONS.map((opt) => (
                  <ChoiceTile
                    key={opt.value}
                    option={opt}
                    selected={mainPriority === opt.value}
                    onSelect={() => selectAndAdvance(setMainPriority, opt.value, 4)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Step 5: Review & generate ── */}
          {step === 5 && (
            <div className="max-w-lg mx-auto">
              <div className="mb-8 text-center">
                <p className="text-[11px] font-semibold text-action-500 uppercase tracking-widest mb-2">Step 5</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-shark-900 mb-2">
                  Ready to build your workspace
                </h1>
                <p className="text-shark-400 text-sm">
                  Here&apos;s a summary of what we&apos;ll set up for you.
                </p>
              </div>

              {/* Summary card */}
              <div className="bg-shark-50 rounded-2xl p-5 space-y-4 mb-6">
                <SummaryRow label="Industry" value={selectedTemplate?.name ?? ""} icon={selectedTemplate?.icon ?? "package"} />
                <SummaryRow label="Locations" value={locationCount} icon="map-pin" />
                <SummaryRow label="Team size" value={teamSize} icon="users" />
                <SummaryRow label="Main priority" value={PRIORITY_OPTIONS.find(p => p.value === mainPriority)?.label ?? mainPriority} icon="star" />
              </div>

              {/* What will be created */}
              {selectedTemplate && (
                <div className="border border-shark-100 rounded-2xl p-5 mb-6 bg-white">
                  <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest mb-4">We&apos;ll automatically create</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-action-50 rounded-xl p-3">
                      <p className="text-xl font-bold text-action-600">{selectedTemplate.assetCategories.length}</p>
                      <p className="text-[11px] text-shark-500 mt-0.5">Asset categories</p>
                    </div>
                    <div className="bg-action-50 rounded-xl p-3">
                      <p className="text-xl font-bold text-action-600">{selectedTemplate.consumableCategories.length}</p>
                      <p className="text-[11px] text-shark-500 mt-0.5">Consumable types</p>
                    </div>
                    <div className="bg-action-50 rounded-xl p-3">
                      <p className="text-xl font-bold text-action-600">{selectedTemplate.defaultWorkflows.length}</p>
                      <p className="text-[11px] text-shark-500 mt-0.5">Automations</p>
                    </div>
                  </div>

                  {/* Industry tip */}
                  <div className="mt-4 flex items-start gap-2.5 bg-blue-50 rounded-xl p-3">
                    <Icon name="info" size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {selectedTemplate.recommendations[0]}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4">{error}</p>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                className="w-full py-3.5 bg-action-500 hover:bg-action-600 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.98] text-sm"
              >
                Generate my workspace →
              </button>

              <p className="text-center text-xs text-shark-400 mt-3">
                You can change anything after setup • Takes about 3 seconds
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      {step < 5 && (
        <footer className="border-t border-shark-100 px-5 sm:px-8 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 1}
            className="flex items-center gap-1.5 text-sm text-shark-500 hover:text-shark-700 transition-colors disabled:opacity-0"
          >
            <Icon name="arrow-left" size={14} />
            Back
          </button>

          <button
            type="button"
            onClick={next}
            disabled={!canContinue}
            className="flex items-center gap-1.5 text-sm font-medium px-5 py-2 bg-action-500 text-white rounded-xl hover:bg-action-600 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm"
          >
            Continue
            <Icon name="arrow-right" size={14} />
          </button>
        </footer>
      )}
    </div>
  );
}

// ─── Summary row ──────────────────────────────────────────────────────────────

function SummaryRow({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-white border border-shark-200 flex items-center justify-center shrink-0">
          <Icon name={icon} size={13} className="text-shark-500" />
        </div>
        <span className="text-sm text-shark-500">{label}</span>
      </div>
      <span className="text-sm font-semibold text-shark-900">{value}</span>
    </div>
  );
}
