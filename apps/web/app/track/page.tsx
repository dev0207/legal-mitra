"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Users,
} from "lucide-react";
import DisclaimerBanner from "../../components/DisclaimerBanner";
import { API_BASE } from "../../lib/api";

type BookingData = {
  booking_id: string;
  status: string;
  full_name?: string;
  city?: string;
  state?: string;
  legal_category?: string;
  issue_summary?: string;
  matched_lawyer_ids?: string[];
  created_at?: string;
  disclaimer?: string;
};

export default function TrackPage() {
  const [bookingId, setBookingId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BookingData | null>(null);
  const [error, setError] = useState("");

  async function track() {
    if (!bookingId.trim()) return;
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
      setError(e instanceof Error ? e.message : "Failed to track booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Search size={22} />
        </div>
        <div>
          <h1 className="section-title">Track Booking</h1>
          <p className="section-subtitle">
            Check the status of your lawyer consultation request
          </p>
        </div>
      </div>

      <div className="card max-w-2xl">
        <div className="space-y-3">
          <div>
            <label className="label-text">Booking ID</label>
            <input
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="input-field"
              placeholder="Enter your booking ID"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Phone (for verification)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="label-text">Email (for verification)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="input-field"
                placeholder="Optional"
              />
            </div>
          </div>
          <button
            onClick={track}
            disabled={!bookingId.trim() || loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Tracking...
              </>
            ) : (
              <>
                <Search size={16} /> Track Booking
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
        )}
      </div>

      {result && (
        <div className="card max-w-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Booking Details
            </h2>
            <span className="badge-blue">{result.status}</span>
          </div>
          <div className="space-y-3 text-sm">
            {result.full_name && (
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle2 size={14} className="text-slate-400" />
                <span className="font-medium">Name:</span> {result.full_name}
              </div>
            )}
            {result.city && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={14} className="text-slate-400" />
                <span className="font-medium">Location:</span> {result.city},{" "}
                {result.state}
              </div>
            )}
            {result.legal_category && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} className="text-slate-400" />
                <span className="font-medium">Category:</span>{" "}
                {result.legal_category}
              </div>
            )}
            {result.issue_summary && (
              <div className="rounded-lg bg-slate-50 p-3 text-slate-600">
                <span className="font-medium">Issue:</span>{" "}
                {result.issue_summary}
              </div>
            )}
            {result.matched_lawyer_ids &&
              result.matched_lawyer_ids.length > 0 && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Users size={14} className="text-slate-400" />
                  <span className="font-medium">Matched Lawyers:</span>{" "}
                  {result.matched_lawyer_ids.join(", ")}
                </div>
              )}
            {result.created_at && (
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={14} className="text-slate-400" />
                <span className="font-medium">Created:</span>{" "}
                {new Date(result.created_at).toLocaleString()}
              </div>
            )}
          </div>
          {result.disclaimer && (
            <p className="mt-4 text-xs text-slate-400">{result.disclaimer}</p>
          )}
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
