"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { API_BASE } from "../lib/api";

type Props = {
  defaultCity?: string;
  defaultState?: string;
};

type BookingResult = {
  booking_id: string;
  status: string;
  matched_lawyer_ids: string[];
};

export default function BookLawyerForm({
  defaultCity = "",
  defaultState = "",
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      full_name: String(fd.get("full_name") || ""),
      phone: String(fd.get("phone") || "") || null,
      email: String(fd.get("email") || "") || null,
      city: String(fd.get("city") || ""),
      state: String(fd.get("state") || ""),
      legal_category: String(fd.get("legal_category") || "other"),
      issue_summary: String(fd.get("issue_summary") || ""),
      preferred_language: String(fd.get("preferred_language") || "EN"),
      budget_range: String(fd.get("budget_range") || ""),
      preferred_contact_time: String(fd.get("preferred_contact_time") || ""),
      consent_to_contact: Boolean(fd.get("consent_to_contact")),
    };

    try {
      const res = await fetch(`${API_BASE}/lawyers/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || JSON.stringify(data));
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        Book a Lawyer Consultation
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label-text">Full Name</label>
          <input name="full_name" required className="input-field" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label-text">Phone</label>
            <input
              name="phone"
              className="input-field"
              placeholder="9999999999"
            />
          </div>
          <div>
            <label className="label-text">Email</label>
            <input
              name="email"
              type="email"
              className="input-field"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="label-text">Language Preference</label>
            <select
              name="preferred_language"
              defaultValue="EN"
              className="select-field"
            >
              <option value="EN">English</option>
              <option value="HI">Hindi</option>
              <option value="MR">Marathi</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label-text">City</label>
            <input
              name="city"
              defaultValue={defaultCity}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="label-text">State</label>
            <input
              name="state"
              defaultValue={defaultState}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="label-text">Legal Category</label>
            <select
              name="legal_category"
              defaultValue="rental"
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
        </div>

        <div>
          <label className="label-text">Describe Your Issue</label>
          <textarea
            name="issue_summary"
            rows={4}
            required
            minLength={20}
            className="textarea-field"
            placeholder="Briefly describe your legal issue or question..."
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label-text">Budget Range (₹)</label>
            <input
              name="budget_range"
              required
              className="input-field"
              placeholder="2000-5000"
            />
          </div>
          <div>
            <label className="label-text">Contact Time</label>
            <input
              name="preferred_contact_time"
              required
              className="input-field"
              placeholder="Evening"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                name="consent_to_contact"
                type="checkbox"
                required
                className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
              />
              I consent to be contacted
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full justify-center"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Submitting...
            </>
          ) : (
            "Submit Booking Request"
          )}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 size={18} />
            <span className="font-semibold">Booking Submitted!</span>
          </div>
          <div className="mt-2 space-y-1 text-sm text-emerald-800">
            <p>
              Booking ID: <code className="font-mono">{result.booking_id}</code>
            </p>
            <p>Status: {result.status}</p>
            <p>
              Matched lawyers: {result.matched_lawyer_ids?.length || 0}
            </p>
          </div>
          <Link
            href={`/booking/${result.booking_id}`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Track your booking <ExternalLink size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
