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
} from "lucide-react";
import DisclaimerBanner from "../../components/DisclaimerBanner";

const MODULES = [
  { title: "Document Summarizer", href: "/summarizer", icon: FileText, color: "text-blue-600 bg-blue-50" },
  { title: "Legal Health Check", href: "/health-check", icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" },
  { title: "AI Legal Q&A", href: "/qa", icon: MessageSquare, color: "text-violet-600 bg-violet-50" },
  { title: "Fake Notice Detector", href: "/notice-detector", icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
  { title: "Speech-to-Legal Advice", href: "/speech", icon: Mic, color: "text-pink-600 bg-pink-50" },
  { title: "Dispute Predictor", href: "/dispute", icon: TrendingUp, color: "text-orange-600 bg-orange-50" },
  { title: "Find Lawyer", href: "/lawyers", icon: Users, color: "text-cyan-600 bg-cyan-50" },
  { title: "Fraud Community Detector", href: "/fraud", icon: ShieldAlert, color: "text-rose-600 bg-rose-50" },
];

export default function WorkspacePage() {
  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="section-title text-3xl">Workspace</h1>
        <p className="section-subtitle">
          All Legal Mitra modules — each module now has its own dedicated page
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((mod) => (
          <Link key={mod.href} href={mod.href} className="group">
            <div className="card h-full transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${mod.color}`}>
                <mod.icon size={20} />
              </div>
              <h3 className="font-semibold text-slate-900">{mod.title}</h3>
              <div className="mt-3 flex items-center gap-1 text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <DisclaimerBanner />
    </div>
  );
}
