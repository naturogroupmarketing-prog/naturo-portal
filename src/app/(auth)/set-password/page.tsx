"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 10) score++;
  if (pw.length >= 14) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score: 4, label: "Strong", color: "bg-green-500" };
  return { score: 5, label: "Very strong", color: "bg-green-600" };
}

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-shark-50 dark:bg-shark-950 px-4">
        <div className="text-center space-y-4">
          <p className="text-shark-600 dark:text-shark-300 text-sm">
            This invite link is invalid. Please contact your administrator.
          </p>
          <Link href="/login" className="text-sm text-action-500 hover:text-action-600 font-medium">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setEmail(data.email || "");
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-shark-50 dark:bg-shark-950 px-4 transition-colors">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size={64} className="mx-auto mb-2" />
          <p className="text-sm text-shark-400 dark:text-shark-200 mt-1">Asset & Consumable Tracker</p>
        </div>

        <div className="bg-white dark:bg-shark-900 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-shark-100 dark:border-shark-700 overflow-hidden transition-colors">
          <div className="p-8">
            {success ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-action-50 dark:bg-action-900/30 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-action-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-shark-900 dark:text-white">All set!</h2>
                  <p className="text-sm text-shark-500 dark:text-shark-300 mt-1">
                    Your password has been created. Redirecting to sign in…
                  </p>
                  {email && (
                    <p className="text-xs text-shark-400 mt-2">Sign in with <strong>{email}</strong></p>
                  )}
                </div>
                <Link
                  href="/login"
                  className="inline-block text-sm text-action-500 dark:text-action-400 hover:text-action-600 font-medium"
                >
                  Sign In →
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-shark-900 dark:text-white text-center mb-1">
                  Welcome! Set your password
                </h2>
                <p className="text-sm text-shark-400 dark:text-shark-300 text-center mb-6">
                  Choose a strong password to secure your account
                </p>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-sm text-red-600 dark:text-red-400 text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-shark-700 dark:text-shark-100 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Min 10 characters"
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-shark-400 hover:text-shark-600 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                    {password && (() => {
                      const strength = getPasswordStrength(password);
                      return (
                        <div className="mt-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-colors ${
                                  i <= strength.score ? strength.color : "bg-shark-200 dark:bg-shark-700"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-shark-400 dark:text-shark-300 mt-1">{strength.label}</p>
                        </div>
                      );
                    })()}
                    <p className="text-xs text-shark-400 mt-1.5">
                      Min 10 chars · uppercase · lowercase · number · special character
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-shark-700 dark:text-shark-100 mb-1">
                      Confirm Password
                    </label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading || (!!confirmPassword && password !== confirmPassword)}
                  >
                    {loading ? "Setting password…" : "Set Password & Sign In"}
                  </Button>
                </form>
              </>
            )}

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-shark-400 dark:text-shark-200 hover:text-shark-600 dark:hover:text-shark-100">
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-shark-50 dark:bg-shark-950">Loading...</div>}>
      <SetPasswordForm />
    </Suspense>
  );
}
