"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XOctagon,
  Loader2,
  ArrowRight,
  FileText,
} from "lucide-react";
import DisclaimerBanner from "../../components/DisclaimerBanner";
import RiskBadge from "../../components/RiskBadge";
import { useDocument, type NoticeData } from "../../contexts/DocumentContext";
import { API_BASE } from "../../lib/api";

type NoticeResult = NoticeData;

const SAMPLE_NOTICE = `URGENT LEGAL NOTICE - FINAL WARNING

From: Legal Department, Suprem Court of India
Subject: Immediate arrest warrant pending

Dear Sir/Madam,

This is to inform you that a case has been registered against your Aadhaar number. You are required to pay a fine of Rs. 50,000 immediately via UPI to avoid arrest.

Failure to comply within 24 hours will result in immediate arrest and prosecution.

Pay now to: legal.dept@upi
Reference: CASE/2026/URGENT/001`;

export default function NoticeDetectorPage() {
  const { doc } = useDocument();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NoticeResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (doc.textPreview && !text) setText(doc.textPreview);
    if (doc.noticeVerification) setResult(doc.noticeVerification);
  }, [doc.textPreview, doc.noticeVerification]);

  async function verify() {
    if (text.trim().length < 20) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/notice/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Verification failed");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const riskPct = result ? Math.round(result.fraud_risk_score * 100) : 0;

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <AlertTriangle size={22} />
        </div>
        <div>
          <h1 className="section-title">Fake Legal Notice Detector</h1>
          <p className="section-subtitle">
            Verify if a legal notice is genuine or a potential scam
          </p>
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <span className="label-text mb-0">Paste the notice text</span>
          <button
            onClick={() => setText(SAMPLE_NOTICE)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            Load sample fake notice
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Paste the legal notice you received via WhatsApp, email, or post..."
          className="textarea-field"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {text.length} chars (min 20)
          </span>
          <button
            onClick={verify}
            disabled={text.trim().length < 20 || loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Verifying...
              </>
            ) : (
              <>
                <ShieldAlert size={16} /> Verify Notice
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
        )}
      </div>

      {result && (
        <>
          {/* Result Card */}
          <div
            className={`card border-2 ${
              riskPct >= 65
                ? "border-rose-200 bg-rose-50/30"
                : riskPct >= 35
                  ? "border-amber-200 bg-amber-50/30"
                  : "border-emerald-200 bg-emerald-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {riskPct >= 65 ? (
                  <XOctagon size={32} className="text-rose-500" />
                ) : riskPct >= 35 ? (
                  <AlertTriangle size={32} className="text-amber-500" />
                ) : (
                  <CheckCircle2 size={32} className="text-emerald-500" />
                )}
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {riskPct >= 65
                      ? "Likely Fraudulent"
                      : riskPct >= 35
                        ? "Suspicious — Verify Further"
                        : "Appears Legitimate"}
                  </p>
                  <RiskBadge
                    level={result.risk_level}
                    score={result.fraud_risk_score}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-slate-900">
                  {riskPct}%
                </div>
                <p className="text-xs text-slate-500">Fraud Risk</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Reasons */}
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <AlertTriangle size={16} className="text-amber-500" />
                Detection Signals
              </h3>
              <ul className="space-y-2">
                {result.reasons.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ArrowRight size={16} className="text-indigo-500" />
                Recommended Next Steps
              </h3>
              <ul className="space-y-2">
                {result.suggested_next_steps.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 shrink-0 text-indigo-400"
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      <DisclaimerBanner />
    </div>
  );
}
