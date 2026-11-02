import Link from "next/link";
import { HeartHandshake, LifeBuoy, PhoneCall, Wind } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";

const GROUNDING = [
  { count: 5, sense: "things you can see", hint: "Name them silently, slowly." },
  { count: 4, sense: "things you can feel", hint: "The chair, your sleeves, the floor." },
  { count: 3, sense: "things you can hear", hint: "Near sounds first, then far ones." },
  { count: 2, sense: "things you can smell", hint: "Or two smells you like." },
  { count: 1, sense: "thing you can taste", hint: "Or one thing you're glad exists." },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="support"
        title="If today is heavy"
        description="Grounding tools, gentle next steps, and clear guidance on where real human help lives. Mindsy is not an emergency service."
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="m-card" aria-labelledby="grounding">
          <h2 id="grounding" className="flex items-center gap-2 text-2xl font-semibold text-ink">
            <HeartHandshake className="h-5 w-5" aria-hidden="true" />
            The 5-4-3-2-1 grounding round
          </h2>
          <p className="mt-2 text-muted">
            A way to give your attention somewhere concrete when everything feels loud. Go slowly,
            and skip anything that feels uncomfortable.
          </p>
          <ol className="mt-5 space-y-3">
            {GROUNDING.map((step) => (
              <li
                key={step.count}
                className="flex items-start gap-4 rounded-2xl border border-white/70 bg-gradient-to-r from-white/85 to-lavender-50/70 px-4 py-3"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lavender-100 text-lg font-semibold text-ink">
                  {step.count}
                </span>
                <span>
                  <span className="block text-ink">{step.sense}</span>
                  <span className="block text-sm text-muted">{step.hint}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-5">
          <section className="rounded-[2rem] border border-blush-200 bg-gradient-to-b from-blush-100/90 to-white p-6 shadow-soft" aria-labelledby="crisis">
            <h2 id="crisis" className="flex items-center gap-2 text-2xl font-semibold text-ink">
              <LifeBuoy className="h-5 w-5" aria-hidden="true" />
              If you are in crisis
            </h2>
            <p className="mt-3 leading-relaxed text-ink/85">
              If you are in immediate danger or thinking about ending your life, please contact your
              local emergency number now, or go to the nearest emergency department.
            </p>
            <p className="mt-3 leading-relaxed text-ink/85">
              For a directory of crisis lines by country, Befrienders Worldwide lists services
              worldwide:
            </p>
            <a
              href="https://befrienders.org"
              target="_blank"
              rel="noreferrer noopener"
              className="m-btn-secondary mt-4"
            >
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              befrienders.org
            </a>
            <p className="mt-4 text-sm text-muted">
              Mindsy does not list phone numbers, because a wrong number in a crisis is worse than no
              number. A production deployment should add region-specific, verified resources.
            </p>
          </section>

          <section className="m-card" aria-labelledby="tools">
            <h2 id="tools" className="text-2xl font-semibold text-ink">
              Tools that might help
            </h2>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/breathe" className="flex items-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-ink transition hover:bg-sky-100">
                  <Wind className="h-4 w-4" aria-hidden="true" />
                  Guided breathing
                </Link>
              </li>
              <li>
                <Link href="/companion" className="flex items-center gap-2 rounded-2xl bg-mint-50 px-4 py-3 text-ink transition hover:bg-mint-100">
                  <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                  Talk it through with the companion
                </Link>
              </li>
              <li>
                <Link href="/gratitude" className="flex items-center gap-2 rounded-2xl bg-butter-50 px-4 py-3 text-ink transition hover:bg-butter-100">
                  <span aria-hidden="true">🌼</span>
                  Pin one small good thing
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-soft">
        <h2 className="text-2xl font-semibold text-ink">Reaching a human</h2>
        <p className="mt-3 leading-relaxed text-muted">
          Tell one person today. A friend, a family member, a tutor, a GP, a counsellor. You do not
          need the perfect words — &ldquo;I&apos;m not okay and I don&apos;t want to be alone with
          it&rdquo; is enough. If talking feels impossible, send a message instead.
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          Mindsy can hold a record of how you&apos;ve been feeling, and that record can be useful in
          a real appointment. It cannot take the place of one.
        </p>
      </section>
    </div>
  );
}
