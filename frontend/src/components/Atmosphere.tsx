const BLOBS = [
  { className: "left-[-8%] top-[-6%] h-[26rem] w-[26rem] bg-lavender-200/55 animate-drift" },
  { className: "right-[-10%] top-[4%] h-[22rem] w-[22rem] bg-blush-200/50 animate-drift [animation-delay:-6s]" },
  { className: "left-[18%] top-[38%] h-[18rem] w-[18rem] bg-sky-200/45 animate-drift [animation-delay:-11s]" },
  { className: "right-[6%] bottom-[6%] h-[24rem] w-[24rem] bg-mint-200/45 animate-drift [animation-delay:-3s]" },
  { className: "left-[-4%] bottom-[-8%] h-[20rem] w-[20rem] bg-peach-200/45 animate-drift [animation-delay:-15s]" },
];

const SPARKLES = [
  { left: "12%", top: "18%", delay: "0s", size: 6 },
  { left: "78%", top: "12%", delay: "1.2s", size: 4 },
  { left: "62%", top: "34%", delay: "2.4s", size: 5 },
  { left: "28%", top: "56%", delay: "0.8s", size: 4 },
  { left: "88%", top: "62%", delay: "3.1s", size: 6 },
  { left: "48%", top: "82%", delay: "1.8s", size: 4 },
  { left: "8%", top: "76%", delay: "2.7s", size: 5 },
];

/**
 * Purely decorative layer.
 *
 * It is fixed, behind all content and `pointer-events-none`, so it can never
 * intercept a click or focus event from the app above it.
 */
export function Atmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {BLOBS.map((blob, index) => (
        <div
          key={index}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
        />
      ))}
      {SPARKLES.map((sparkle, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)] animate-twinkle"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: sparkle.delay,
          }}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/50 to-transparent" />
    </div>
  );
}
