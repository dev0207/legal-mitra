"use client";

import { useState } from "react";
import { Search, Loader2, CheckCircle2 } from "lucide-react";
import { API_BASE } from "../lib/api";

type Props = {
  initialBookingId?: string;
};

export default function TrackBookingForm({ initialBookingId = "" }: Props) {
  const [bookingId, setBookingId] = useState(initialBookingId);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function track() {
    if (!bookingId) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params = new URLSearchParams();
      if (phone) params.set("phone", phone);
      if (email) params.set("email", email);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(
        `${API_BASE}/lawyers/bookings/${bookingId}${qs}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Not found");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">
        Track Booking
      </h3>
      <div className="space-y-3">
        <div>
          <label className="label-text">Booking ID</label>
          <input
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-text">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-text">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="input-field"
            />
          </div>
        </div>
        <button onClick={track} disabled={loading} className="btn-primary">
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
          Track
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <CheckCircle2 size={16} />
            <span className="font-semibold">
              Status: {String(result.status)}
            </span>
          </div>
          <p className="text-emerald-800">
            Matched:{" "}
            {Array.isArray(result.matched_lawyer_ids)
              ? result.matched_lawyer_ids.join(", ")
              : "None"}
          </p>
          <p className="text-emerald-800">
            Created: {String(result.created_at)}
          </p>
          {typeof result.disclaimer === "string" && (
            <p className="mt-2 text-xs text-slate-500">
              {result.disclaimer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
