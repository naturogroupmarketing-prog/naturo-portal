"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess(true);
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
          <p className="text-sm text-shark-400 mt-1">Asset & Consumable Tracker</p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-shark-100 overflow-hidden">
          <div className="p-8">
            <h2 className="text-lg font-semibold text-shark-900 text-center mb-1">
              Reset Password
            </h2>

            {success ? (
              <div className="text-center space-y-4 mt-4">
                <div className="w-12 h-12 rounded-full bg-action-50 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-action-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-shark-600">
                  Your password has been reset successfully!
                </p>
                <Link
                  href="/login"
                  className="inline-block text-sm text-action-500 hover:text-action-600 font-medium"
                >
                  Sign In →
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-shark-400 text-center mb-6">
                  Enter your reset code and new password
                </p>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-shark-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-shark-700 mb-1">
                      Reset Code
                    </label>
                    <Input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                      placeholder="6-digit code"
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-shark-700 mb-1">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Min 8 characters"
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-shark-700 mb-1">
                      Confirm Password
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm new password"
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </>
            )}

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-shark-400 hover:text-shark-600">
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-shark-50 dark:bg-shark-950">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
