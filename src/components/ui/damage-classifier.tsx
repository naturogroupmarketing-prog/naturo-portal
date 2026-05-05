"use client";

import { useState } from "react";
import type { DamageClassification } from "@/app/api/vision/classify-damage/route";

interface DamageClassifierProps {
  imageBase64: string | null;
  assetName: string;
  assetCategory: string;
  onClassification: (result: DamageClassification) => void;
}

const SEVERITY_STYLES: Record<DamageClassification["severity"], { badge: string; label: string }> = {
  minor: { badge: "bg-green-100 text-green-700 ring-1 ring-green-200", label: "Minor" },
  moderate: { badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200", label: "Moderate" },
  severe: { badge: "bg-orange-100 text-orange-700 ring-1 ring-orange-200", label: "Severe" },
  totalled: { badge: "bg-red-100 text-red-700 ring-1 ring-red-200", label: "Totalled" },
};

const RECOMMENDATION_STYLES: Record<DamageClassification["repairRecommendation"], string> = {
  repair: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  replace: "bg-red-50 text-red-700 ring-1 ring-red-200",
  monitor: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  decommission: "bg-shark-100 dark:bg-shark-800 text-shark-600 dark:text-shark-400 ring-1 ring-shark-200",
};

export function DamageClassifier({
  imageBase64,
  assetName,
  assetCategory,
  onClassification,
}: DamageClassifierProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DamageClassification | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyse() {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/vision/classify-damage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, assetName, assetCategory }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      if (!data.success || !data.classification) throw new Error("Invalid response");

      setResult(data.classification);
      onClassification(data.classification);
    } catch {
      setError("Analysis failed. Please fill in manually.");
    } finally {
      setLoading(false);
    }
  }

  const sev = result ? SEVERITY_STYLES[result.severity] : null;
  const confidencePct = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="mt-3">
      {!result && (
        <button
          type="button"
          onClick={handleAnalyse}
          disabled={!imageBase64 || loading}
          className={`inline-flex items-center gap-2 rounded-[28px] px-4 py-2.5 text-sm font-medium transition-all ${
            !imageBase64
              ? "bg-shark-100 dark:bg-shark-800 text-shark-400 cursor-not-allowed"
              : loading
              ? "bg-action-50 text-action-500 cursor-wait"
              : "bg-action-600 text-white hover:bg-action-700 shadow-sm hover:shadow active:scale-[0.98]"
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Analysing image...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 13.5V19a2 2 0 002 2h16a2 2 0 002-2v-5.5" />
                <path d="M12 2v13" />
                <path d="m9 12 3 3 3-3" />
                <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              Analyse Damage with AI
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500/80 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {result && sev && (
        <div className="mt-3 ai-card-border"><div className="ai-card-inner">
        <div className="rounded-none border-0 bg-white dark:bg-shark-800 shadow-sm overflow-hidden">
          {/* Header bar */}
          <div className="px-4 py-3 bg-shark-50/60 dark:bg-shark-800/60 border-b border-shark-100 dark:border-shark-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-action-500">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span className="text-xs font-semibold text-shark-600 dark:text-shark-400 uppercase tracking-wide">AI Damage Analysis</span>
            </div>
            <button
              type="button"
              onClick={() => { setResult(null); setError(null); }}
              className="text-xs text-shark-400 hover:text-shark-600 dark:text-shark-400 transition-colors"
            >
              Re-analyse
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-4 space-y-3">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${sev.badge}`}>
                {sev.label} Damage
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200 capitalize">
                {result.category}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${RECOMMENDATION_STYLES[result.repairRecommendation]}`}>
                {result.repairRecommendation === "decommission" ? "Decommission" : `Recommended: ${result.repairRecommendation}`}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-shark-700 dark:text-shark-300 leading-relaxed">{result.description}</p>

            {/* Confidence bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-shark-400 font-medium">Confidence</span>
                <span className="text-xs font-semibold text-shark-700 dark:text-shark-300">{confidencePct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-shark-100 dark:bg-shark-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    confidencePct >= 80
                      ? "bg-green-500"
                      : confidencePct >= 60
                      ? "bg-amber-400"
                      : "bg-red-400"
                  }`}
                  style={{ width: `${confidencePct}%` }}
                />
              </div>
            </div>

            {/* Details list */}
            {result.details.length > 0 && (
              <ul className="space-y-1">
                {result.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-shark-600 dark:text-shark-400">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-shark-300 shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            )}

            {/* Complexity pill */}
            <p className="text-xs text-shark-400">
              Repair complexity:{" "}
              <span className={`font-semibold ${
                result.estimatedRepairComplexity === "low"
                  ? "text-green-600"
                  : result.estimatedRepairComplexity === "medium"
                  ? "text-amber-600"
                  : "text-red-600"
              } capitalize`}>
                {result.estimatedRepairComplexity}
              </span>
            </p>
          </div>
        </div>
        </div></div>
      )}
    </div>
  );
}
