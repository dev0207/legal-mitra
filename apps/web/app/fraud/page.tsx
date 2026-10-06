"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Send,
  Loader2,
  AlertTriangle,
  BarChart3,
  Phone,
  Mail,
  MapPin,
  Radio,
  CheckCircle2,
} from "lucide-react";
import DisclaimerBanner from "../../components/DisclaimerBanner";
import RiskBadge from "../../components/RiskBadge";
import { API_BASE } from "../../lib/api";

type FraudAlert = {
  key: string;
  count: number;
  risk_level: string;
  sample_signals: string[];
};

export default function FraudPage() {
  const [reportText, setReportText] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [channel, setChannel] = useState("whatsapp");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [error, setError] = useState("");

  async function submitReport() {
    if (reportText.trim().length < 10) return;
    setSubmitting(true);
    setError("");
    setSubmitResult(null);

    try {
      const res = await fetch(`${API_BASE}/fraud/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_text: reportText,
          phone_number: phone || null,
          email: email || null,
          city: city || null,
          channel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Submit failed");
      setSubmitResult(data.report_id);
      setReportText("");
      setPhone("");
      setEmail("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function loadAlerts() {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`${API_BASE}/fraud/alerts`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to load alerts");
      setAlerts(data.alerts || []);
    } catch {
      setError("Failed to load fraud alerts");
    } finally {
      setLoadingAlerts(false);
    }
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <ShieldAlert size={22} />
        </div>
        <div>
          <h1 className="section-title">Fraud Community Detector</h1>
          <p className="section-subtitle">
            Report scams and view community alerts with pattern detection
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Report Form */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Report a Scam
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label-text">What happened?</label>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows={4}
                placeholder="Describe the scam/fraud you encountered..."
                className="textarea-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text">
                  <Phone size={12} className="inline mr-1" />
                  Scammer Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="label-text">
                  <Mail size={12} className="inline mr-1" />
                  Scammer Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text">
                  <MapPin size={12} className="inline mr-1" />
                  City
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input-field"
                  placeholder="Your city"
                />
              </div>
              <div>
                <label className="label-text">
                  <Radio size={12} className="inline mr-1" />
                  Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="select-field"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="phone_call">Phone Call</option>
                  <option value="in_person">In Person</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button
              onClick={submitReport}
              disabled={reportText.trim().length < 10 || submitting}
              className="btn-primary w-full justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send size={16} /> Submit Report
                </>
              )}
            </button>

            {submitResult && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 size={16} />
                Report submitted! ID: {submitResult.slice(0, 8)}...
              </div>
            )}
            {error && (
              <p className="text-sm font-medium text-rose-600">{error}</p>
            )}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Community Alerts
            </h2>
            <button
              onClick={loadAlerts}
              disabled={loadingAlerts}
              className="btn-secondary"
            >
              {loadingAlerts ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <BarChart3 size={14} />
              )}
              Refresh
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldAlert size={40} className="text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">
                No active alerts yet. Click refresh to load, or submit reports to build patterns.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        size={16}
                        className={
                          alert.risk_level === "HIGH"
                            ? "text-rose-500"
                            : "text-amber-500"
                        }
                      />
                      <span className="text-sm font-semibold text-slate-800">
                        {alert.key}
                      </span>
                    </div>
                    <RiskBadge level={alert.risk_level} />
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span>{alert.count} reports</span>
                    {alert.sample_signals.length > 0 && (
                      <span>
                        Signals: {alert.sample_signals.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
