"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      setSent(true);
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
              Forgot Password
            </h2>

            {sent ? (
              <div className="text-center space-y-4 mt-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-shark-600">
                  If an account exists with <strong>{email}</strong>, you will receive a password reset code.
                </p>
                <p className="text-sm text-shark-400">
                  Check your email and use the code to reset your password.
                </p>
                <Link
                  href={`/reset-password?email=${encodeURIComponent(email)}`}
                  className="inline-block text-sm text-action-500 hover:text-action-600 font-medium"
                >
                  Enter reset code →
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-shark-400 text-center mb-6">
                  Enter your email and we&apos;ll send you a reset code
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
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Code"}
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
