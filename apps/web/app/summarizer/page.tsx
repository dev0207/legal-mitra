"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  FileUp,
  List,
  Clock,
  CheckCircle2,
  Loader2,
  Languages,
} from "lucide-react";
import DisclaimerBanner from "../../components/DisclaimerBanner";
import { useDocument, type SummaryData } from "../../contexts/DocumentContext";
import { API_BASE } from "../../lib/api";

export default function SummarizerPage() {
  const { doc, uploading, uploadError, uploadDocument } = useDocument();
  const [mode, setMode] = useState<"upload" | "text">("upload");
  const [language, setLanguage] = useState("EN");
  const [processing, setProcessing] = useState(false);
  const [text, setText] = useState("");
  const [summaryResult, setSummaryResult] = useState<SummaryData | null>(null);
  const [error, setError] = useState("");

  // Sync context into local state when doc changes
  useEffect(() => {
    if (doc.textPreview && !text) setText(doc.textPreview);
    if (doc.summary) setSummaryResult(doc.summary);
  }, [doc.textPreview, doc.summary]);

  async function handleSummarize() {
    if (text.trim().length < 20) return;
    setProcessing(true);
    setError("");
    setSummaryResult(null);

    try {
      const res = await fetch(`${API_BASE}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Summarization failed");
      setSummaryResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FileText size={22} />
        </div>
        <div>
          <h1 className="section-title">Document Summarizer</h1>
          <p className="section-subtitle">
            Upload a legal document or paste text to get a plain-language summary
          </p>
        </div>
      </div>

      {/* Context indicator */}
      {doc.docId && (
        <div className="card bg-blue-50/50 border-blue-100">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
            <CheckCircle2 size={16} />
            Document loaded: <strong>{doc.filename}</strong> ({doc.chunksIndexed} chunks, {doc.textChars.toLocaleString()} chars)
          </div>
          <p className="mt-1 text-xs text-blue-500">
            This document is shared across all modules. Upload a new one to replace it.
          </p>
        </div>
      )}

      {/* Input Section */}
      <div className="card">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setMode("upload")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "upload"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Upload size={14} /> Upload File
            </button>
            <button
              onClick={() => setMode("text")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "text"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileText size={14} /> Paste Text
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
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

        {mode === "upload" ? (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30">
            <FileUp size={36} className="text-slate-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                Drop your PDF or TXT file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Supported: PDF, TXT &bull; Max 10MB
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadDocument(f);
              }}
            />
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-indigo-600">
                <Loader2 size={16} className="animate-spin" />
                Uploading and analyzing...
              </div>
            )}
          </label>
        ) : (
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="Paste your legal document text here (rent agreement, notice, contract, etc.)..."
              className="textarea-field"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {text.length} characters (min 20 required)
              </span>
              <button
                onClick={handleSummarize}
                disabled={text.trim().length < 20 || processing}
                className="btn-primary"
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <FileText size={16} /> Summarize
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {(error || uploadError) && (
          <p className="mt-3 text-sm font-medium text-rose-600">
            {error || uploadError}
          </p>
        )}
      </div>

      {/* Summary Results */}
      {summaryResult && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <List size={16} className="text-blue-500" />
              Key Points
            </div>
            <ul className="space-y-2">
              {summaryResult.summary_bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                  {b.replace(/^-\s*/, "")}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Obligations
            </div>
            <ul className="space-y-2">
              {summaryResult.obligations.map((o, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Clock size={16} className="text-amber-500" />
              Deadlines
            </div>
            <ul className="space-y-2">
              {summaryResult.deadlines.map((d, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
