"use client";

import { useState, useRef } from "react";
import {
  Mic,
  MicOff,
  Languages,
  Loader2,
  Target,
  BookOpen,
  ListChecks,
  Shield,
} from "lucide-react";
import DisclaimerBanner from "../../components/DisclaimerBanner";
import { API_BASE } from "../../lib/api";

type SpeechResult = {
  detected_intent: string;
  legal_category: string;
  rights_explanation: string;
  suggested_actions: string[];
};

export default function SpeechPage() {
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("EN");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  function toggleRecording() {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setError("Speech recognition not supported in this browser. Please paste text instead.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    const langMap: Record<string, string> = {
      EN: "en-IN",
      HI: "hi-IN",
      MR: "mr-IN",
    };
    recognition.lang = langMap[language] || "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = () => {
      setRecording(false);
      setError("Speech recognition error. Please try again or paste text.");
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    setError("");
  }

  async function analyze() {
    if (transcript.trim().length < 5) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/speech/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, language }),
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

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
          <Mic size={22} />
        </div>
        <div>
          <h1 className="section-title">Speech-to-Legal Advice</h1>
          <p className="section-subtitle">
            Speak or type your legal situation to get AI-powered guidance
          </p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
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

        {/* Mic Button */}
        <div className="mb-4 flex justify-center">
          <button
            onClick={toggleRecording}
            className={`flex h-24 w-24 items-center justify-center rounded-full transition-all ${
              recording
                ? "bg-rose-500 text-white shadow-lg shadow-rose-200 animate-pulse"
                : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md"
            }`}
          >
            {recording ? <MicOff size={36} /> : <Mic size={36} />}
          </button>
        </div>
        <p className="mb-4 text-center text-sm text-slate-500">
          {recording
            ? "Listening... Click to stop"
            : "Click the microphone to start speaking, or type below"}
        </p>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={5}
          placeholder="Your spoken words will appear here, or type your legal situation manually..."
          className="textarea-field"
        />

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {transcript.length} chars (min 5)
          </span>
          <button
            onClick={analyze}
            disabled={transcript.trim().length < 5 || loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Target size={16} /> Analyze Intent
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
        )}
      </div>

      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card">
            <div className="mb-3 flex items-center gap-2">
              <Target size={18} className="text-pink-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                Detected Intent
              </h3>
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {result.detected_intent}
            </p>
            <div className="mt-2">
              <span className="badge-blue">
                {result.legal_category}
              </span>
            </div>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center gap-2">
              <Shield size={18} className="text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                Your Rights
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              {result.rights_explanation}
            </p>
          </div>

          <div className="card md:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <ListChecks size={18} className="text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                Suggested Actions
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {result.suggested_actions.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                    {i + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
