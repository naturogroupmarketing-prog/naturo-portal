"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Redirect to dashboard — server will route based on role
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-shark-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size={64} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-shark-900">Check It Out</h1>
          <p className="text-sm text-shark-400 mt-1">Asset Consumable Tracker</p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-shark-100 overflow-hidden">
          <div className="p-8">
            <h2 className="text-lg font-semibold text-shark-900 text-center mb-1">
              Sign In
            </h2>
            <p className="text-sm text-shark-400 text-center mb-6">
              Enter your credentials to continue
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
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-shark-400 mt-6">
          Internal use only. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
