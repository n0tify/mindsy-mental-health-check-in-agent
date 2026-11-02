"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMindsy } from "@/components/MindsyProvider";
import { extractErrorMessage } from "@/lib/format";

export default function SignupPage() {
  const { signup, user, busy } = useMindsy();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Let us know what to call you.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("That email address doesn't look complete.");
      return;
    }
    if (password.length < 8) {
      setError("Passwords need at least eight characters.");
      return;
    }
    if (!/[a-zA-Z]/.test(password)) {
      setError("Add at least one letter to your password.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    try {
      await signup({ name: name.trim(), email: email.trim(), password });
      router.push("/garden");
    } catch (caught) {
      setError(extractErrorMessage(caught));
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-[2.5rem] border border-white/70 bg-gradient-to-b from-white/90 via-mint-50 to-lavender-50 p-7 shadow-lift sm:p-10">
        <p className="m-eyebrow">a place that remembers</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-ink">Create your account</h1>
        <p className="mt-2 text-muted">
          An account keeps your garden, journal and gratitude notes safe — and moves anything you
          made as a guest into it.
        </p>

        {user ? (
          <div className="mt-6 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm">
            You&apos;re signed in as <strong>{user.email}</strong>.{" "}
            <Link href="/garden" className="m-link">
              Go to your garden
            </Link>
            .
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="signup-name" className="m-label">
              Name
            </label>
            <input
              id="signup-name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="m-input"
              placeholder="What should we call you?"
              maxLength={80}
              required
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="m-label">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="m-input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="signup-password" className="m-label">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="m-input"
                placeholder="8+ characters"
                required
              />
            </div>
            <div>
              <label htmlFor="signup-confirm" className="m-label">
                Confirm
              </label>
              <input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className="m-input"
                placeholder="Repeat it"
                required
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="rounded-2xl border border-blush-200 bg-blush-100/80 px-4 py-3 text-sm">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={busy} className="m-btn-primary w-full">
            {busy ? "Creating your garden…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="m-link">
            Sign in
          </Link>
          .
        </p>
        <p className="mt-3 text-center text-xs text-muted">
          Passwords are hashed with bcrypt and never stored in plain text. Mindsy is a wellness tool,
          not a medical service.
        </p>
      </div>
    </div>
  );
}
