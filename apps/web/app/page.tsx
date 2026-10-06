import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Mic,
  TrendingUp,
  Users,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Globe,
  Scale,
} from "lucide-react";
import DisclaimerBanner from "../components/DisclaimerBanner";

const MODULES = [
  {
    title: "Document Summarizer",
    description:
      "Upload legal documents and get plain-language summaries, obligations, and deadlines.",
    href: "/summarizer",
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Legal Health Check",
    description:
      "Detect risky clauses, missing sections, and get a risk score for any legal document.",
    href: "/health-check",
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "AI Legal Q&A",
    description:
      "Ask questions about uploaded documents and get context-aware answers with sources.",
    href: "/qa",
    icon: MessageSquare,
    color: "bg-violet-50 text-violet-600",
  },
  {
    title: "Fake Notice Detector",
    description:
      "Verify legal notices for fraud patterns, fake court formats, and scam signals.",
    href: "/notice-detector",
    icon: AlertTriangle,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "Speech-to-Legal Advice",
    description:
      "Speak or paste a transcript to get intent classification and legal guidance.",
    href: "/speech",
    icon: Mic,
    color: "bg-pink-50 text-pink-600",
  },
  {
    title: "Dispute Predictor",
    description:
      "Predict dispute outcomes based on case type, evidence strength, and court.",
    href: "/dispute",
    icon: TrendingUp,
    color: "bg-orange-50 text-orange-600",
  },
  {
    title: "Find Lawyer",
    description:
      "Search nearby lawyers by city, practice area, and language with fee comparison.",
    href: "/lawyers",
    icon: Users,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    title: "Fraud Community Detector",
    description:
      "Report scams and view community fraud alerts with pattern detection.",
    href: "/fraud",
    icon: ShieldAlert,
    color: "bg-rose-50 text-rose-600",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <Sparkles size={14} />
              AI-Powered Legal Assistance for Every Citizen
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Legal help,
              <br />
              <span className="text-indigo-200">instantly accessible.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-indigo-100">
              Upload documents, detect fraud, get AI legal guidance, and connect
              with lawyers near you. Available in English, Hindi &amp; Marathi.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/summarizer"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                Get Started <ArrowRight size={16} />
              </Link>
              <Link
                href="/lawyers"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Find a Lawyer
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-3 gap-6 rounded-2xl bg-white/10 p-6 backdrop-blur-sm sm:max-w-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">8</div>
              <div className="text-xs text-indigo-200">AI Modules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">3</div>
              <div className="text-xs text-indigo-200">Languages</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <Scale size={18} /> Free
              </div>
              <div className="text-xs text-indigo-200">No Login Required</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-container">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-600">
          <Globe size={16} />
          Core Modules
        </div>
        <h2 className="section-title text-3xl">
          Everything you need for legal clarity
        </h2>
        <p className="section-subtitle mb-8 max-w-2xl">
          Each module is designed for the Indian legal context. No login
          required — just start using.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href} className="group">
              <div className="card h-full transition-all hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5">
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${mod.color} transition-transform group-hover:scale-110`}
                >
                  <mod.icon size={20} />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {mod.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {mod.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Open module <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <DisclaimerBanner />
        </div>
      </section>
    </div>
  );
}
