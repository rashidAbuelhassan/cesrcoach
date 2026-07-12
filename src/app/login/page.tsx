"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AuthShell from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") ? "Sign-in link was invalid or expired. Please try again." : null
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(params.get("next") ?? "/members");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
      <div>
        <label className="label" htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="field"
          placeholder="doctor@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          className="field"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" disabled={loading} className="btn-liquid w-full py-3 text-sm">
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-mist/50">
        New here?{" "}
        <Link href="/register" className="font-semibold text-cyan-300 hover:underline">
          Create a free account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your member area.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
