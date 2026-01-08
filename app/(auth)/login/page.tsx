"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, is_active")
          .eq("id", data.user.id)
          .single();

        if (!profile) {
          setError("Profile not found. Please contact admin.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (!profile.is_active) {
          setError("Your account is inactive.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-3 sm:px-4 py-6">
      <div className="w-full max-w-md">
        <Card className="shadow-sm">
          <CardHeader className="space-y-1.5 sm:space-y-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl font-semibold">
              Thikadari Hisab
            </CardTitle>
            <p className="text-xs sm:text-sm text-gray-600">
              Sign in to continue
            </p>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3">
                  <p className="text-red-700 text-xs sm:text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={loading}
                  className="text-sm h-9 sm:h-10"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="text-sm h-9 sm:h-10"
                />
              </div>

              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full text-sm h-9 sm:h-10"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
              No account?{" "}
              <Link
                href="/signup"
                className="text-blue-600 hover:text-blue-800"
              >
                Create one
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-4 sm:mt-6">
          <Link
            href="/"
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
