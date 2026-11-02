import type { Metadata } from "next";

import "./globals.css";
import { Atmosphere } from "@/components/Atmosphere";
import { MindsyProvider } from "@/components/MindsyProvider";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Mindsy — a softer place to check in",
  description:
    "Mindsy is a pastel, uplifting space for emotional check-ins, gentle reflection and a Living Garden that grows with every feeling you acknowledge.",
  applicationName: "Mindsy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Atmosphere />
        <MindsyProvider>
          <Nav />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-6xl px-4 pb-10 text-center text-sm text-muted sm:px-6 lg:px-8">
            <p className="mx-auto max-w-2xl">
              Mindsy is a wellness journal, not a medical service. It does not diagnose, treat or
              replace professional care. If you are in crisis, contact your local emergency number.
            </p>
            <p className="mt-3 opacity-70">Made with care · {new Date().getFullYear()}</p>
          </footer>
        </MindsyProvider>
      </body>
    </html>
  );
}
