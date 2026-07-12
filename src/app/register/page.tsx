"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is enabled there is no session yet.
    if (!data.session) {
      setNeedsConfirm(true);
      setLoading(false);
      return;
    }
    router.push("/members");
    router.refresh();
  }

  if (needsConfirm) {
    return (
      <AuthShell title="Check your inbox 📬" subtitle="One more step.">
        <p className="text-sm leading-relaxed text-mist/70">
          We&apos;ve sent a confirmation link to <strong>{email}</strong>.
          Click it to activate your account, then sign in.
        </p>
        <Link href="/login" className="btn-liquid mt-6 w-full py-3 text-sm">
          Go to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Join CESR Coach"
      subtitle="Free to register — book sessions, watch presentations, download resources."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
        <div>
          <label className="label" htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            required
            autoComplete="name"
            className="field"
            placeholder="Dr. Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
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
            minLength={8}
            autoComplete="new-password"
            className="field"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-liquid w-full py-3 text-sm">
          {loading ? "Creating account…" : "Create my account"}
        </button>
        <p className="text-center text-sm text-mist/50">
          Already a member?{" "}
          <Link href="/login" className="font-semibold text-cyan-300 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
