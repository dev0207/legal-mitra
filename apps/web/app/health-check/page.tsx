"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Languages,
  FileText,
} from "lucide-react";
import DisclaimerBanner from "../../components/DisclaimerBanner";
import RiskBadge from "../../components/RiskBadge";
import { useDocument, type HealthData } from "../../contexts/DocumentContext";
import { API_BASE } from "../../lib/api";

export default function HealthCheckPage() {
  const { doc } = useDocument();
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("EN");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthData | null>(null);
  const [error, setError] = useState("");

  // Pre-fill from context
  useEffect(() => {
    if (doc.textPreview && !text) setText(doc.textPreview);
    if (doc.healthCheck) setResult(doc.healthCheck);
  }, [doc.textPreview, doc.healthCheck]);

  async function analyze() {
    if (text.trim().length < 20) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/legal-health/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const riskPct = result ? Math.round(result.risk_score * 100) : 0;

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 className="section-title">Legal Health Check</h1>
          <p className="section-subtitle">
            Detect risky clauses, missing sections, and get a risk assessment
          </p>
        </div>
      </div>

      {doc.docId && !result && (
        <div className="card bg-blue-50/50 border-blue-100">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <FileText size={14} />
            <span>Document <strong>{doc.filename}</strong> is loaded from context. Click &quot;Run Health Check&quot; to analyze.</span>
          </div>
        </div>
      )}

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <span className="label-text mb-0">Paste your legal document</span>
          <div className="flex items-center gap-2">
            <Languages size={16} className="text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="select-field w-auto"
            >
              <option value="EN">English</option>
              <option value="HI">Hindi</option>
              <option value="MR">Marathi</option>
            </select>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Paste a rent agreement, employment contract, legal notice, etc..."
          className="textarea-field"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {text.length} chars (min 20)
          </span>
          <button
            onClick={analyze}
            disabled={text.trim().length < 20 || loading}
            className="btn-primary"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
            ) : (
              <><ShieldCheck size={16} /> Run Health Check</>
            )}
          </button>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
      </div>

      {result && (
        <>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Overall Risk Level</p>
                <div className="mt-1">
                  <RiskBadge level={result.risk_level} score={result.risk_score} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-slate-900">{riskPct}%</div>
                <p className="text-xs text-slate-400">Risk Score</p>
              </div>
            </div>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  riskPct >= 70 ? "bg-rose-500" : riskPct >= 35 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${riskPct}%` }}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <AlertTriangle size={16} className="text-rose-500" /> Risky Clauses
              </h3>
              {result.risky_clauses.length > 0 ? (
                <ul className="space-y-2">
                  {result.risky_clauses.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm text-slate-600">
                      <XCircle size={14} className="mt-0.5 shrink-0 text-rose-400" />
                      <span className="capitalize">{c.replace(/_/g, " ")}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 size={14} /> No risky clauses detected
                </p>
              )}
            </div>
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <AlertTriangle size={16} className="text-amber-500" /> Missing Sections
              </h3>
              {result.missing_sections.length > 0 ? (
                <ul className="space-y-2">
                  {result.missing_sections.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-slate-600">
                      <XCircle size={14} className="mt-0.5 shrink-0 text-amber-400" />
                      <span className="capitalize">{s.replace(/_/g, " ")}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 size={14} /> All expected sections present
                </p>
              )}
            </div>
          </div>

          <div className="card bg-slate-50/50">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Plain Explanation</h3>
            <ul className="space-y-1.5">
              {result.plain_explanation.map((e, i) => (
                <li key={i} className="text-sm leading-relaxed text-slate-600">{e}</li>
              ))}
            </ul>
          </div>
        </>
      )}
      <DisclaimerBanner />
    </div>
  );
}
