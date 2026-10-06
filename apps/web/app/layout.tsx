import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import DocBanner from "../components/DocBanner";
import Providers from "../components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Legal Mitra — AI Legal Assistance",
  description:
    "AI-powered legal assistance for Indian citizens. Document analysis, legal Q&A, fraud detection, lawyer recommendations, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>
        <Providers>
          <Navbar />
          <DocBanner />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center gap-2 text-center text-sm text-slate-500">
                <p className="font-medium text-slate-700">
                  Legal Mitra &mdash; AI Legal Assistance Platform
                </p>
                <p>
                  AI-generated guidance, not a substitute for a qualified
                  lawyer.
                </p>
                <p className="text-xs text-slate-400">
                  Supports English, Hindi &amp; Marathi &bull; Indian legal
                  context
                </p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
