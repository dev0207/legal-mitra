"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Download,
  Loader2,
  RefreshCcw,
  Users,
  MapPin,
  Calendar,
} from "lucide-react";
import { API_BASE } from "../../../lib/api";

type Booking = {
  booking_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  city: string;
  state: string;
  legal_category: string;
  status: string;
  matched_lawyer_ids: string[];
  created_at: string;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/lawyer-bookings?limit=200`, {
        cache: "no-store",
      });
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="section-title">Admin — Bookings</h1>
            <p className="section-subtitle text-rose-500">
              Internal use route — public in v1 (no auth)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary">
            <RefreshCcw size={14} /> Refresh
          </button>
          <a
            href={`${API_BASE}/admin/lawyer-bookings/export.csv`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <Download size={14} /> Export CSV
          </a>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No bookings found
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">ID</th>
                <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="px-4 py-3 font-medium text-slate-500">
                  Location
                </th>
                <th className="px-4 py-3 font-medium text-slate-500">
                  Category
                </th>
                <th className="px-4 py-3 font-medium text-slate-500">
                  Contact
                </th>
                <th className="px-4 py-3 font-medium text-slate-500">
                  Matched
                </th>
                <th className="px-4 py-3 font-medium text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.booking_id}
                  className="border-b border-slate-100 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {b.booking_id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 font-medium">{b.full_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-500">
                      <MapPin size={12} /> {b.city}, {b.state}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-blue">{b.legal_category}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {b.phone || b.email || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Users size={12} />{" "}
                      {(b.matched_lawyer_ids || []).length}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-green">{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />{" "}
                      {b.created_at
                        ? new Date(b.created_at).toLocaleDateString()
                        : "-"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
