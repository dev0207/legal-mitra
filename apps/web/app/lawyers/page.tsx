"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  MapPin,
  Star,
  Briefcase,
  Languages,
  IndianRupee,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import DisclaimerBanner from "../../components/DisclaimerBanner";
import BookLawyerForm from "../../components/BookLawyerForm";
import { API_BASE } from "../../lib/api";

type Lawyer = {
  lawyer_id: string;
  name: string;
  city: string;
  state: string;
  practice_areas: string[];
  languages: string[];
  years_experience: number;
  fee_range: string;
  rating: number;
  latitude?: number;
  longitude?: number;
};

export default function LawyersPage() {
  const [city, setCity] = useState("Pune");
  const [state, setState] = useState("Maharashtra");
  const [practiceArea, setPracticeArea] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [error, setError] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function search() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (state) params.set("state", state);
      if (practiceArea) params.set("practice_area", practiceArea);
      if (language) params.set("language", language);
      params.set("limit", "25");

      const res = await fetch(`${API_BASE}/lawyers/search?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Search failed");
      setLawyers(data.lawyers || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    search();
  }, []);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const compareLawyers = lawyers.filter((l) => selectedIds.has(l.lawyer_id));

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
          <Users size={22} />
        </div>
        <div>
          <h1 className="section-title">Find a Lawyer</h1>
          <p className="section-subtitle">
            Search nearby lawyers by location, practice area, and language
          </p>
        </div>
      </div>

      {/* Search Filters */}
      <div className="card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label-text">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="input-field"
              placeholder="e.g., Pune"
            />
          </div>
          <div>
            <label className="label-text">State</label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="input-field"
              placeholder="e.g., Maharashtra"
            />
          </div>
          <div>
            <label className="label-text">Practice Area</label>
            <select
              value={practiceArea}
              onChange={(e) => setPracticeArea(e.target.value)}
              className="select-field"
            >
              <option value="">All Areas</option>
              <option value="rental">Rental</option>
              <option value="family">Family</option>
              <option value="property">Property</option>
              <option value="labor">Labor</option>
              <option value="criminal">Criminal</option>
              <option value="civil">Civil</option>
              <option value="corporate">Corporate</option>
              <option value="tax">Tax</option>
              <option value="consumer">Consumer</option>
            </select>
          </div>
          <div>
            <label className="label-text">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="select-field"
            >
              <option value="">Any</option>
              <option value="EN">English</option>
              <option value="HI">Hindi</option>
              <option value="MR">Marathi</option>
              <option value="GU">Gujarati</option>
              <option value="TA">Tamil</option>
              <option value="TE">Telugu</option>
              <option value="KN">Kannada</option>
              <option value="BN">Bengali</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={search} disabled={loading} className="btn-primary w-full justify-center">
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Search
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {lawyers.length} lawyer{lawyers.length !== 1 ? "s" : ""} found
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => { setCompareMode(!compareMode); setSelectedIds(new Set()); }}
            className={compareMode ? "btn-primary" : "btn-secondary"}
          >
            {compareMode ? "Exit Compare" : "Compare Fees"}
          </button>
          <button
            onClick={() => setShowBooking(!showBooking)}
            className="btn-secondary"
          >
            {showBooking ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Book Lawyer
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      {compareMode && compareLawyers.length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Fee Comparison ({compareLawyers.length} selected)
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="pb-2 font-medium text-slate-500">Lawyer</th>
                <th className="pb-2 font-medium text-slate-500">City</th>
                <th className="pb-2 font-medium text-slate-500">Experience</th>
                <th className="pb-2 font-medium text-slate-500">Fee Range</th>
                <th className="pb-2 font-medium text-slate-500">Rating</th>
                <th className="pb-2 font-medium text-slate-500">Areas</th>
              </tr>
            </thead>
            <tbody>
              {compareLawyers.map((l) => (
                <tr key={l.lawyer_id} className="border-b border-slate-100">
                  <td className="py-2 font-medium">{l.name}</td>
                  <td className="py-2">{l.city}</td>
                  <td className="py-2">{l.years_experience} yrs</td>
                  <td className="py-2 font-semibold text-indigo-600">
                    ₹{l.fee_range}
                  </td>
                  <td className="py-2">{l.rating}</td>
                  <td className="py-2">{l.practice_areas.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lawyer Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lawyers.map((lawyer) => (
          <div
            key={lawyer.lawyer_id}
            className={`card transition-all hover:shadow-md ${
              compareMode ? "cursor-pointer" : ""
            } ${
              selectedIds.has(lawyer.lawyer_id)
                ? "ring-2 ring-indigo-500 border-indigo-200"
                : ""
            }`}
            onClick={() => compareMode && toggleSelect(lawyer.lawyer_id)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {lawyer.name}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={13} />
                  {lawyer.city}, {lawyer.state}
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1">
                <Star size={13} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold text-amber-700">
                  {lawyer.rating}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Briefcase size={14} className="text-slate-400" />
                {lawyer.practice_areas.join(", ")}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Languages size={14} className="text-slate-400" />
                {lawyer.languages.join(", ")}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={14} className="text-slate-400" />
                {lawyer.years_experience} years experience
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <IndianRupee size={14} />
                {lawyer.fee_range}
              </div>
            </div>

            {compareMode && (
              <div className="mt-3">
                <span
                  className={`badge ${
                    selectedIds.has(lawyer.lawyer_id)
                      ? "badge-blue"
                      : "badge-gray"
                  }`}
                >
                  {selectedIds.has(lawyer.lawyer_id)
                    ? "Selected for comparison"
                    : "Click to compare"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Booking Form */}
      {showBooking && (
        <BookLawyerForm defaultCity={city} defaultState={state} />
      )}

      <DisclaimerBanner />
    </div>
  );
}
