import Link from "next/link";

export function GuestNote({ context }: { context: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/70 bg-mint-50/70 px-5 py-4 text-sm text-ink shadow-soft backdrop-blur-sm">
      <p className="max-w-xl leading-relaxed">
        <span aria-hidden="true">🌱 </span>
        You&apos;re in guest mode, so {context} stays in this browser. Create a free account whenever
        you want it kept safely and synced to your own garden.
      </p>
      <div className="flex items-center gap-2">
        <Link
          href="/signup"
          className="rounded-full border border-white/80 bg-white/85 px-4 py-1.5 font-semibold text-ink shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
        >
          Create account
        </Link>
        <Link
          href="/login"
          className="rounded-full px-3 py-1.5 text-muted transition hover:text-ink"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
