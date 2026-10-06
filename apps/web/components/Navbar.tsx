"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scale,
  FileText,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Users,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Scale },
  { href: "/summarizer", label: "Summarizer", icon: FileText },
  { href: "/health-check", label: "Health Check", icon: ShieldCheck },
  { href: "/qa", label: "AI Q&A", icon: MessageSquare },
  { href: "/notice-detector", label: "Notice Detector", icon: AlertTriangle },
  { href: "/lawyers", label: "Find Lawyer", icon: Users },
  { href: "/fraud", label: "Fraud Detector", icon: ShieldAlert },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 transition-transform group-hover:scale-105">
            <Scale size={18} />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Legal Mitra
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile toggle */}
        <button
          className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2">
          <div className="grid grid-cols-2 gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
