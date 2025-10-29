"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <Card className="max-w-md w-full shadow-xl border border-green-100">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-semibold">
            Welcome to <span className="text-green-700">CoolTipp Research Cloud</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {!sent ? (
            <>
              <p className="text-sm text-gray-600 text-center">
                Sign in with your email to access your research dashboard.
              </p>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                onClick={handleLogin}
                disabled={loading || !email}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? "Sending magic link..." : "Send Login Link"}
              </Button>

              {error && (
                <p className="text-red-600 text-sm text-center mt-2">{error}</p>
              )}
            </>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-green-700 font-medium">
                Magic link sent! 🎉
              </p>
              <p className="text-sm text-gray-600">
                Check your inbox and click the link to sign in.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

