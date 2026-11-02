import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Times New Roman everywhere, with no sans-serif fallback sneaking in.
        sans: ['"Times New Roman"', "Times", "serif"],
        serif: ['"Times New Roman"', "Times", "serif"],
      },
      colors: {
        ink: "#3A3145",
        muted: "#6C6178",
        lavender: {
          50: "#F5F1FF",
          100: "#E9E1FF",
          200: "#D8CCFF",
          300: "#C8B6FF",
        },
        blush: {
          50: "#FFF5F9",
          100: "#FFE0EB",
          200: "#FFC8DC",
          300: "#F5B6D2",
        },
        sky: {
          50: "#F2F8FF",
          100: "#DCEEFF",
          200: "#C9E4FF",
          300: "#B9D8F5",
        },
        mint: {
          50: "#F1FDF6",
          100: "#DDF7E8",
          200: "#C7F0D8",
          300: "#B5E8CA",
        },
        peach: {
          50: "#FFF7F1",
          100: "#FFE4D1",
          200: "#FFD6BA",
          300: "#FFC9A5",
        },
        butter: {
          50: "#FFFCEF",
          100: "#FFF4C9",
          200: "#FFECA8",
        },
      },
      borderRadius: {
        blob: "2.5rem",
      },
      boxShadow: {
        soft: "0 18px 40px -24px rgba(86, 68, 122, 0.45)",
        lift: "0 26px 60px -26px rgba(86, 68, 122, 0.55)",
        inner: "inset 0 1px 0 rgba(255,255,255,0.75)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(14px,-22px,0) scale(1.05)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.25", transform: "scale(0.85)" },
          "50%": { opacity: "0.9", transform: "scale(1.1)" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-1.5deg)" },
          "50%": { transform: "rotate(1.5deg)" },
        },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        bob: "bob 6s ease-in-out infinite",
        twinkle: "twinkle 5s ease-in-out infinite",
        sway: "sway 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
