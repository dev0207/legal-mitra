"use client";

import { useState } from "react";
import {
  TrendingUp,
  Scale,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
} from "lucide-react";
import DisclaimerBanner from "../../components/DisclaimerBanner";
import { API_BASE } from "../../lib/api";

type PredictResult = {
  status: string;
  win_probability: number | null;
  confidence: number;
  confidence_band: string;
  reasons: string[];
  disclaimer: string;
};

export default function DisputePage() {
  const [caseType, setCaseType] = useState("civil");
  const [court, setCourt] = useState("District Court");
  const [jurisdiction, setJurisdiction] = useState("Pune");
  const [opponentType, setOpponentType] = useState("Private Party");
  const [evidenceStrength, setEvidenceStrength] = useState(0.6);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [error, setError] = useState("");

  async function predict() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/dispute/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_type: caseType,
          court,
          jurisdiction,
          evidence_strength: evidenceStrength,
          opponent_type: opponentType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Prediction failed");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const winPct = result?.win_probability != null ? Math.round(result.win_probability * 100) : null;
  const confPct = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <TrendingUp size={22} />
        </div>
        <div>
          <h1 className="section-title">Dispute Outcome Predictor</h1>
          <p className="section-subtitle">
            Estimate your dispute outcome based on case parameters
          </p>
        </div>
      </div>

      <div className="card">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label-text">Case Type</label>
            <select
              value={caseType}
              onChange={(e) => setCaseType(e.target.value)}
              className="select-field"
            >
              <option value="rental">Rental</option>
              <option value="family">Family</option>
              <option value="property">Property</option>
              <option value="labor">Labor</option>
              <option value="criminal">Criminal</option>
              <option value="civil">Civil</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label-text">Court</label>
            <input
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              className="input-field"
              placeholder="e.g., District Court"
            />
          </div>
          <div>
            <label className="label-text">Jurisdiction</label>
            <input
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="input-field"
              placeholder="e.g., Pune"
            />
          </div>
          <div>
            <label className="label-text">Opponent Type</label>
            <input
              value={opponentType}
              onChange={(e) => setOpponentType(e.target.value)}
              className="input-field"
              placeholder="e.g., Private Party, Government"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="label-text">
              Evidence Strength: {Math.round(evidenceStrength * 100)}%
            </label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">Weak</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={evidenceStrength}
                onChange={(e) =>
                  setEvidenceStrength(Number(e.target.value))
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600"
              />
              <span className="text-xs text-slate-400">Strong</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={predict}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Predicting...
              </>
            ) : (
              <>
                <Scale size={16} /> Predict Outcome
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
          {/* Win Probability */}
          <div className="card flex flex-col items-center justify-center text-center">
            {result.status === "predicted" ? (
              <>
                <div
                  className={`text-6xl font-bold ${
                    (winPct ?? 0) >= 60
                      ? "text-emerald-600"
                      : (winPct ?? 0) >= 40
                        ? "text-amber-600"
                        : "text-rose-600"
                  }`}
                >
                  {winPct}%
                </div>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Estimated Win Probability
                </p>
                <div className="mt-3 h-3 w-48 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      (winPct ?? 0) >= 60
                        ? "bg-emerald-500"
                        : (winPct ?? 0) >= 40
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                    style={{ width: `${winPct}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <MinusCircle size={48} className="text-slate-400" />
                <p className="mt-3 text-lg font-semibold text-slate-700">
                  Prediction Abstained
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Insufficient data for reliable prediction
                </p>
              </>
            )}
          </div>

          {/* Confidence & Reasoning */}
          <div className="card">
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-500">Confidence</p>
              <div className="mt-1 flex items-center gap-3">
                <div className="text-2xl font-bold text-slate-900">
                  {confPct}%
                </div>
                <span
                  className={`badge ${
                    result.confidence_band === "high"
                      ? "badge-green"
                      : result.confidence_band === "medium"
                        ? "badge-yellow"
                        : "badge-red"
                  }`}
                >
                  {result.confidence_band}
                </span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Reasoning
              </p>
              <ul className="space-y-2">
                {result.reasons.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    {result.status === "predicted" ? (
                      <CheckCircle2
                        size={14}
                        className="mt-0.5 shrink-0 text-emerald-400"
                      />
                    ) : (
                      <AlertCircle
                        size={14}
                        className="mt-0.5 shrink-0 text-amber-400"
                      />
                    )}
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
