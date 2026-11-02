"use client";

import { useEffect, useRef, useState } from "react";
import { Send, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/format";

type Message = {
  id: string;
  role: "you" | "companion";
  text: string;
  crisis?: boolean;
  suggestions?: string[];
};

const STARTERS = [
  "I feel anxious about tomorrow.",
  "Today was actually a good day.",
  "I'm exhausted and I can't explain why.",
  "I don't know what I'm feeling.",
];

const DISCLAIMER =
  "Mindsy's companion is a supportive rule-based listener, not a therapist, doctor or emergency service.";

const OFFLINE_REPLY =
  "I can't reach the Mindsy API right now, but I'm glad you wrote that down. One small next step: take three slow breaths, then name one thing that would make the next hour 5% easier. If you are in danger, please contact your local emergency number.";

export default function CompanionPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "companion",
      text:
        "Hi. I'm the Mindsy companion. You can tell me what's going on, however small or messy. I'll reflect it back and offer a couple of gentle options — never a diagnosis.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setError(null);
    setSending(true);
    setInput("");
    setMessages((previous) => [
      ...previous,
      { id: `you-${Date.now()}`, role: "you", text: trimmed },
    ]);

    try {
      const reply = await api.companion(trimmed);
      setMessages((previous) => [
        ...previous,
        {
          id: `companion-${Date.now()}`,
          role: "companion",
          text: reply.reply,
          crisis: reply.crisis,
          suggestions: reply.suggestions,
        },
      ]);
    } catch (caught) {
      const message = extractErrorMessage(caught);
      setError(message);
      setMessages((previous) => [
        ...previous,
        { id: `companion-offline-${Date.now()}`, role: "companion", text: OFFLINE_REPLY },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="companion"
        title="A supportive listener"
        description="Reflective, gentle and honest about its limits. It won't diagnose you, and it will always point you toward real people when that matters."
      />

      <div className="mb-4 flex items-start gap-3 rounded-3xl border border-white/70 bg-butter-100/70 px-5 py-4 text-sm text-ink shadow-soft">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          {DISCLAIMER} This demo uses a transparent rule-based engine and needs no paid AI provider.
          If you are in crisis, contact your local emergency number.
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-white/65 shadow-soft backdrop-blur-md">
        <div className="max-h-[26rem] space-y-4 overflow-y-auto p-5 sm:p-6" aria-live="polite">
          {messages.map((message) =>
            message.role === "you" ? (
              <div key={message.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-3xl rounded-br-lg bg-gradient-to-br from-lavender-200 to-lavender-300 px-4 py-3 text-ink shadow-soft">
                  {message.text}
                </p>
              </div>
            ) : (
              <div key={message.id} className="flex justify-start">
                <div
                  className={`max-w-[92%] rounded-3xl rounded-bl-lg px-4 py-3 shadow-soft ${
                    message.crisis
                      ? "border border-blush-200 bg-blush-100/90"
                      : "bg-gradient-to-br from-mint-50 to-sky-50"
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed text-ink">{message.text}</p>
                  {message.suggestions && message.suggestions.length > 0 ? (
                    <ul className="mt-3 space-y-1.5 text-sm text-muted">
                      {message.suggestions.map((suggestion) => (
                        <li key={suggestion} className="flex gap-2">
                          <span aria-hidden="true">·</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ),
          )}
          {sending ? (
            <div className="flex justify-start">
              <p className="rounded-3xl bg-mint-50 px-4 py-3 text-muted shadow-soft">Thinking gently…</p>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="border-t border-white/70 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => void send(starter)}
                className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-sm text-muted transition hover:-translate-y-0.5 hover:text-ink hover:shadow-soft"
              >
                {starter}
              </button>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2"
          >
            <label htmlFor="companion-input" className="sr-only">
              Message the companion
            </label>
            <textarea
              id="companion-input"
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 1000))}
              rows={2}
              placeholder="Say anything. There's no wrong way to start."
              className="m-input flex-1 resize-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="m-btn-primary h-12 w-12 shrink-0 !px-0"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>

          {error ? (
            <p role="alert" className="mt-3 rounded-2xl border border-blush-200 bg-blush-100/80 px-4 py-2 text-sm">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-muted">
        Nothing you type here is diagnosed, scored or stored by Mindsy.
      </p>
    </div>
  );
}
