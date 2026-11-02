"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMindsy } from "@/components/MindsyProvider";
import { extractErrorMessage } from "@/lib/format";

export default function LoginPage() {
  const { login, user, busy } = useMindsy();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    try {
      await login({ email: email.trim(), password });
      router.push("/garden");
    } catch (caught) {
      setError(extractErrorMessage(caught));
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-[2.5rem] border border-white/70 bg-gradient-to-b from-white/90 via-lavender-50 to-blush-50 p-7 shadow-lift sm:p-10">
        <p className="m-eyebrow">welcome back</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-ink">Sign in to Mindsy</h1>
        <p className="mt-2 text-muted">
          Your garden, journal and gratitude wall are waiting where you left them.
        </p>

        {user ? (
          <div className="mt-6 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm">
            You&apos;re already signed in as <strong>{user.email}</strong>.{" "}
            <Link href="/garden" className="m-link">
              Go to your garden
            </Link>
            .
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="m-label">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="m-input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="m-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="m-input"
              placeholder="Your password"
              required
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-2xl border border-blush-200 bg-blush-100/80 px-4 py-3 text-sm">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={busy} className="m-btn-primary w-full">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/signup" className="m-link">
            Create an account
          </Link>{" "}
          — or keep exploring as a guest.
        </p>
      </div>
    </div>
  );
}
