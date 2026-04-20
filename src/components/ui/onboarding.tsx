"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./button";

interface PlacePrediction {
  name: string;
  address: string;
  full: string;
}

const TOTAL_STEPS = 7;

export function OnboardingOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  // Form data
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [industry, setIndustry] = useState("");
  const [branchCount, setBranchCount] = useState(1);
  const [branchNames, setBranchNames] = useState<string[]>([""]);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [goal, setGoal] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+61");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Places autocomplete
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setPredictions(data.predictions || []);
      setShowDropdown((data.predictions || []).length > 0);
    } catch {
      setPredictions([]);
      setShowDropdown(false);
    }
  }, []);

  const handleCompanyInput = (value: string) => {
    setCompanyName(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(value), 300);
  };

  const selectPrediction = (prediction: PlacePrediction) => {
    setCompanyName(prediction.name);
    setPredictions([]);
    setShowDropdown(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleNext = () => {
    if (step >= TOTAL_STEPS - 1) {
      setVisible(false);
      setTimeout(onComplete, 300);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = () => {
    setVisible(false);
    setTimeout(onComplete, 300);
  };

  const teamSizes = ["1-5", "6-10", "11-30", "31-50", "51-100", "101-200", "201-500", "500+"];

  const industries = [
    "Construction",
    "Healthcare",
    "Hospitality",
    "Retail",
    "Cleaning",
    "Manufacturing",
    "Security",
    "Education",
    "Field Services",
    "Other",
  ];

  const goals = [
    "Track equipment & assets",
    "Manage supply items",
    "Multi-location oversight",
    "Reduce equipment loss",
    "Replace spreadsheets",
    "All of the above",
  ];

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ backgroundColor: "rgba(0,0,0,0.32)" }}
    >
      <div className={`bg-white dark:bg-shark-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-all duration-300 ${visible ? "scale-100" : "scale-95"}`}>

        {/* Step indicator — connected dots with lines */}
        <div className="flex items-center justify-center gap-0 pt-6 pb-4 px-12">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? "bg-action-500 ring-4 ring-action-100"
                    : i < step
                    ? "bg-action-500"
                    : "bg-shark-200 dark:bg-shark-700"
                }`}
              />
              {i < TOTAL_STEPS - 1 && (
                <div className={`w-8 h-px ${i < step ? "bg-action-400" : "bg-shark-200 dark:bg-shark-700"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="px-8 pb-8">

          {/* Step 1: Company name + role */}
          {step === 0 && (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-shark-900 dark:text-shark-100 mb-6">
                Set up your workspace
              </h2>

              <p className="text-sm text-shark-600 dark:text-shark-300 mb-2 text-left">Company name</p>
              <div className="relative mb-5" ref={dropdownRef}>
                <input
                  type="text"
                  placeholder="Start typing to search..."
                  value={companyName}
                  onChange={(e) => handleCompanyInput(e.target.value)}
                  onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                  className="w-full border border-shark-200 dark:border-shark-700 rounded-lg px-3.5 py-2.5 text-sm text-shark-900 dark:text-shark-100 bg-white dark:bg-shark-800 placeholder-shark-400 focus:outline-none focus:ring-2 focus:ring-action-500/30 focus:border-action-500 transition-colors"
                />
                {showDropdown && predictions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-shark-800 border border-shark-200 dark:border-shark-700 rounded-lg shadow-lg overflow-hidden z-10">
                    {predictions.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => selectPrediction(p)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-700 transition-colors border-b border-shark-100 dark:border-shark-700 last:border-b-0"
                      >
                        <span className="text-sm font-medium text-shark-900 dark:text-shark-100">{p.name}</span>
                        {p.address && (
                          <span className="text-xs text-shark-400 ml-1.5">{p.address}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-sm text-shark-600 dark:text-shark-300 mb-2 text-left">Your role</p>
              <input
                type="text"
                placeholder="e.g. Operations Manager"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full border border-shark-200 dark:border-shark-700 rounded-lg px-3.5 py-2.5 text-sm text-shark-900 dark:text-shark-100 bg-white dark:bg-shark-800 placeholder-shark-400 focus:outline-none focus:ring-2 focus:ring-action-500/30 focus:border-action-500 transition-colors"
              />
            </div>
          )}

          {/* Step 2: Team size + Industry */}
          {step === 1 && (
            <div>
              <p className="text-sm text-shark-600 dark:text-shark-300 mb-3">Team size</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {teamSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setTeamSize(size)}
                    className={`px-3.5 py-1.5 rounded-full text-sm transition-all ${
                      teamSize === size
                        ? "bg-action-500 text-white"
                        : "bg-white dark:bg-shark-800 text-shark-600 dark:text-shark-300 border border-shark-200 dark:border-shark-700 hover:border-shark-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <p className="text-sm text-shark-600 dark:text-shark-300 mb-3">Industry</p>
              <div className="flex flex-wrap gap-2">
                {industries.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => setIndustry(ind)}
                    className={`px-3.5 py-1.5 rounded-full text-sm transition-all ${
                      industry === ind
                        ? "bg-action-500 text-white"
                        : "bg-white dark:bg-shark-800 text-shark-600 dark:text-shark-300 border border-shark-200 dark:border-shark-700 hover:border-shark-300"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Branches */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-shark-900 dark:text-shark-100 mb-1 text-center">
                How many branches do you have?
              </h2>
              <p className="text-sm text-shark-500 dark:text-shark-400 mb-6 text-center">
                A branch is a physical location or site you manage.
              </p>

              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => {
                    const n = Math.max(1, branchCount - 1);
                    setBranchCount(n);
                    setBranchNames((prev) => prev.slice(0, n));
                  }}
                  className="w-10 h-10 rounded-full border border-shark-200 dark:border-shark-700 flex items-center justify-center text-shark-500 dark:text-shark-400 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors text-lg"
                >
                  −
                </button>
                <span className="text-3xl font-semibold text-shark-900 dark:text-shark-100 w-12 text-center tabular-nums">
                  {branchCount}
                </span>
                <button
                  onClick={() => {
                    const n = branchCount + 1;
                    setBranchCount(n);
                    setBranchNames((prev) => [...prev, ""]);
                  }}
                  className="w-10 h-10 rounded-full border border-shark-200 dark:border-shark-700 flex items-center justify-center text-shark-500 dark:text-shark-400 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors text-lg"
                >
                  +
                </button>
              </div>

              <p className="text-sm text-shark-600 dark:text-shark-300 mb-3">Name your branches</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {branchNames.map((name, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`Branch ${i + 1}`}
                    value={name}
                    onChange={(e) => {
                      const updated = [...branchNames];
                      updated[i] = e.target.value;
                      setBranchNames(updated);
                    }}
                    className="w-full border border-shark-200 dark:border-shark-700 rounded-lg px-3.5 py-2.5 text-sm text-shark-900 dark:text-shark-100 bg-white dark:bg-shark-800 placeholder-shark-400 focus:outline-none focus:ring-2 focus:ring-action-500/30 focus:border-action-500 transition-colors"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Make it your own */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-shark-900 dark:text-shark-100 mb-1 text-center">
                Make it your own
              </h2>
              <p className="text-sm text-shark-500 dark:text-shark-400 mb-1 text-center">
                This will help us make your dashboard fit your company
              </p>
              <p className="text-sm text-shark-400 mb-6 text-center">
                Change from the settings menu at any time
              </p>

              <p className="text-sm text-shark-600 dark:text-shark-300 mb-2 text-center">Add your company website</p>
              <input
                type="url"
                placeholder="Company website"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                className="w-full border border-shark-200 dark:border-shark-700 rounded-lg px-3.5 py-2.5 text-sm text-shark-900 dark:text-shark-100 bg-white dark:bg-shark-800 placeholder-shark-400 focus:outline-none focus:ring-2 focus:ring-action-500/30 focus:border-action-500 transition-colors mb-6"
              />

              <p className="text-sm text-shark-600 dark:text-shark-300 mb-3 text-center">Add your company logo</p>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith("image/")) {
                    setCompanyLogo(file);
                    setLogoPreview(URL.createObjectURL(file));
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 flex items-center gap-4 transition-colors ${
                  isDragging
                    ? "border-action-400 bg-action-50"
                    : "border-shark-200 dark:border-shark-700 bg-shark-50/50 dark:bg-shark-800/50"
                }`}
              >
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-shark-300 dark:border-shark-600 flex items-center justify-center shrink-0 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-action-400">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                </div>
                <div className="text-sm">
                  <p className="text-shark-500 dark:text-shark-400">Drag your logo here</p>
                  <p className="text-shark-400 dark:text-shark-500 dark:text-shark-400">
                    Or{" "}
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="text-action-500 hover:text-action-600 font-medium"
                    >
                      Browse
                    </button>
                  </p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCompanyLogo(file);
                      setLogoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 5: Primary goal */}
          {step === 4 && (
            <div>
              <p className="text-sm text-shark-600 dark:text-shark-300 mb-3">What brings you to trackio?</p>
              <div className="space-y-2">
                {goals.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center gap-3 ${
                      goal === g
                        ? "bg-action-50 text-action-700 border border-action-500"
                        : "bg-white dark:bg-shark-800 text-shark-600 dark:text-shark-300 border border-shark-200 dark:border-shark-700 hover:border-shark-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      goal === g ? "border-action-500" : "border-shark-300"
                    }`}>
                      {goal === g && <div className="w-2 h-2 rounded-full bg-action-500" />}
                    </div>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Mobile number */}
          {step === 5 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-action-50 flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-action-500">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <path d="M12 18h.01" />
                  <path d="M15 6l-3 4 3 4" />
                  <path d="M9 10l3 4" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-shark-900 dark:text-shark-100 mb-2">
                What&apos;s your mobile number?
              </h2>
              <p className="text-sm text-shark-500 dark:text-shark-400 mb-6 leading-relaxed">
                Log in to your app easily and securely<br />with your mobile phone number
              </p>

              <div className="flex items-center border border-shark-200 dark:border-shark-700 rounded-lg overflow-hidden mb-3">
                <div className="flex items-center gap-1.5 px-3 py-2.5 border-r border-shark-200 dark:border-shark-700 bg-shark-50/50 dark:bg-shark-800/50 shrink-0">
                  <span className="text-base">🇦🇺</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-shark-400"><path d="M6 9l6 6 6-6"/></svg>
                </div>
                <input
                  type="tel"
                  placeholder="+61"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm text-shark-900 dark:text-shark-100 bg-white dark:bg-shark-800 placeholder-shark-400 focus:outline-none"
                />
              </div>

              <p className="text-xs text-shark-400">
                We&apos;ll text you the link to download your mobile app
              </p>
            </div>
          )}

          {/* Step 7: All set */}
          {step === 6 && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-shark-900 dark:text-shark-100 mb-1">
                You&apos;re all set
              </h2>
              <p className="text-sm text-shark-500 dark:text-shark-400 leading-relaxed">
                Start by adding a location and inviting your team.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-shark-100 dark:border-shark-800">
            <div>
              {step > 0 ? (
                <button
                  onClick={handleBack}
                  className="text-sm text-shark-400 hover:text-shark-600 dark:text-shark-400 transition-colors flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                  Back
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  className="text-sm text-shark-400 hover:text-shark-600 dark:text-shark-400 transition-colors"
                >
                  Skip
                </button>
              )}
            </div>

            <Button onClick={handleNext} size="sm">
              {step === TOTAL_STEPS - 1 ? "Access Dashboard" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
