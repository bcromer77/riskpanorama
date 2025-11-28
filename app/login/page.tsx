"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    signIn("credentials", {
      email: "you@rareearthminerals.ai",
      password: "anything",
      redirect: false,
    }).then((res) => {
      if (res?.ok) {
        router.push("/instrument");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-emerald-950 flex items-center justify-center">
      <div className="bg-slate-900/90 border border-emerald-800 rounded-2xl p-16 text-center">
        <h1 className="text-5xl font-black text-emerald-400 mb-8">REM Risk Intelligence</h1>
        <p className="text-2xl text-slate-300 mb-12">Founder Auto-Login</p>
        <div className="text-8xl animate-pulse">🚀</div>
        <p className="text-slate-400 mt-8 text-lg">Logging you in...</p>
      </div>
    </div>
  );
}
