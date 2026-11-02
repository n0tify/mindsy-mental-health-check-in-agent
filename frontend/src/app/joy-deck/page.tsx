"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { CARD_TONES, drawCard, JOY_DECK, type JoyCard } from "@/lib/joy";

export default function JoyDeckPage() {
  const [card, setCard] = useState<JoyCard | null>(null);
  const [history, setHistory] = useState<JoyCard[]>([]);
  const [draws, setDraws] = useState(0);

  function draw() {
    const next = drawCard(card?.id ?? null);
    setCard(next);
    setDraws((value) => value + 1);
    setHistory((previous) => [next, ...previous.filter((item) => item.id !== next.id)].slice(0, 4));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="joy deck"
        title="One small good thing"
        description="Draw a card when you want somewhere to start. Nothing here takes more than ten minutes, and nothing is mandatory."
      />

      <div className="relative">
        <div className="pointer-events-none absolute -left-6 top-10 h-24 w-24 rounded-full bg-butter-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -right-4 bottom-10 h-28 w-28 rounded-full bg-blush-100/70 blur-2xl" />

        <div className="relative flex min-h-[320px] items-center justify-center">
          <AnimatePresence mode="wait">
            {card ? (
              <motion.article
                key={card.id + "-" + draws}
                initial={{ opacity: 0, rotateY: -90, y: 20 }}
                animate={{ opacity: 1, rotateY: 0, y: 0 }}
                exit={{ opacity: 0, rotateY: 90, y: -20 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className={`w-full max-w-md rounded-[2.25rem] border border-white/80 bg-gradient-to-br ${CARD_TONES[card.tone]} p-8 shadow-lift`}
              >
                <div className="flex items-center justify-between">
                  <span className="m-eyebrow">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    joy card
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted">
                    {card.minutes} min
                  </span>
                </div>
                <h2 className="mt-6 text-3xl font-semibold leading-tight text-ink">{card.title}</h2>
                <p className="mt-3 text-lg leading-relaxed text-muted">{card.prompt}</p>
                <p className="mt-6 text-sm italic text-muted">
                  If it doesn&apos;t fit today, skip it. The deck is an offer, not an assignment.
                </p>
              </motion.article>
            ) : (
              <motion.div
                key="empty-deck"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-md rounded-[2.25rem] border border-white/80 bg-gradient-to-br from-lavender-100 via-blush-50 to-butter-100 p-10 text-center shadow-lift"
              >
                <p className="text-6xl" aria-hidden="true">
                  🃏
                </p>
                <h2 className="mt-5 text-3xl font-semibold text-ink">The deck is shuffled</h2>
                <p className="mt-2 text-lg text-muted">
                  {JOY_DECK.length} gentle prompts, one at a time.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={draw} className="m-btn-primary">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {card ? "Draw another card" : "Draw a card"}
          </button>
          <span className="text-sm text-muted">{draws > 0 ? `${draws} drawn` : "No pressure either way"}</span>
        </div>
      </div>

      {history.length > 0 ? (
        <section aria-labelledby="recent-cards" className="mt-10">
          <h2 id="recent-cards" className="text-2xl font-semibold text-ink">
            Recently drawn
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {history.map((item) => (
              <li
                key={item.id}
                className={`rounded-3xl border border-white/70 bg-gradient-to-br ${CARD_TONES[item.tone]} p-5 shadow-soft`}
              >
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.prompt}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
