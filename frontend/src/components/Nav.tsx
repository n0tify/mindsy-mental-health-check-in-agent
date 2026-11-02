"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, Flower2, LogOut, Sparkles } from "lucide-react";
import { useState } from "react";

import { useMindsy } from "./MindsyProvider";

const LINKS = [
  { href: "/", label: "Home", tint: "from-lavender-100 to-white", primary: true },
  { href: "/checkin", label: "Check-in", tint: "from-blush-100 to-white", primary: true },
  { href: "/garden", label: "Garden", tint: "from-mint-100 to-white", primary: true },
  { href: "/insights", label: "Insights", tint: "from-sky-100 to-white", primary: true },
  { href: "/journal", label: "Journal", tint: "from-peach-100 to-white", primary: true },
  { href: "/joy-deck", label: "Joy Deck", tint: "from-butter-100 to-white", primary: false },
  { href: "/breathe", label: "Breathe", tint: "from-sky-100 to-white", primary: false },
  { href: "/weather", label: "Weather", tint: "from-lavender-100 to-white", primary: false },
  { href: "/gratitude", label: "Gratitude", tint: "from-blush-100 to-white", primary: false },
  { href: "/companion", label: "Companion", tint: "from-mint-100 to-white", primary: false },
  { href: "/support", label: "Support", tint: "from-peach-100 to-white", primary: false },
];

function NavPill({
  href,
  label,
  tint,
  active,
}: {
  href: string;
  label: string;
  tint: string;
  active: boolean;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="shrink-0">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`block rounded-full border px-3.5 py-1.5 text-[0.95rem] transition-all duration-200 ${
          active
            ? "border-lavender-200 bg-gradient-to-b from-white to-lavender-100 font-semibold text-ink shadow-lift ring-1 ring-lavender-200"
            : `border-white/70 bg-gradient-to-b ${tint} text-muted shadow-soft hover:border-lavender-200 hover:text-ink hover:shadow-lift`
        }`}
      >
        {label}
      </Link>
    </motion.div>
  );
}

export function Nav() {
  const pathname = usePathname();
  const { user, isGuest, logout } = useMindsy();
  const [showAll, setShowAll] = useState(false);

  const visibleLinks = showAll ? LINKS : LINKS.filter((link) => link.primary);

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/55 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-lavender-200 via-blush-200 to-mint-200 text-ink shadow-soft transition group-hover:scale-105">
              <Flower2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-2xl font-semibold tracking-tight text-ink">Mindsy</span>
              <span className="block text-xs uppercase tracking-[0.22em] text-muted">
                a softer place to check in
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {user ? (
              <>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3.5 py-1.5 text-sm text-ink shadow-soft">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-lavender-200 to-mint-200 text-xs font-semibold uppercase">
                    {user.name.slice(0, 1)}
                  </span>
                  <span className="max-w-[9rem] truncate">{user.name}</span>
                </span>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => void logout()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-sm text-muted shadow-soft transition hover:-translate-y-0.5 hover:text-ink hover:shadow-lift"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </motion.button>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-mint-50/80 px-3.5 py-1.5 text-sm text-muted shadow-soft">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {isGuest ? "Guest mode" : "Loading"}
                </span>
                <Link
                  href="/login"
                  className="rounded-full border border-white/80 bg-white/75 px-3.5 py-1.5 text-sm text-ink shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-gradient-to-b from-blush-200 via-lavender-200 to-lavender-300 px-3.5 py-1.5 text-sm font-semibold text-ink shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>

        <nav aria-label="Main navigation" className="mt-3 flex flex-wrap items-center gap-1.5">
          {visibleLinks.map((link) => (
            <NavPill
              key={link.href}
              href={link.href}
              label={link.label}
              tint={link.tint}
              active={pathname === link.href}
            />
          ))}
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            aria-expanded={showAll}
            className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-sm text-muted shadow-soft transition hover:text-ink hover:shadow-lift sm:hidden"
          >
            {showAll ? "Less" : "More"}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </nav>
      </div>
    </header>
  );
}
