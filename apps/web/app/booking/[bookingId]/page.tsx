"use client";

import { useParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import TrackBookingForm from "../../../components/TrackBookingForm";
import DisclaimerBanner from "../../../components/DisclaimerBanner";

export default function BookingDetailsPage() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId ?? "";

  return (
    <div className="page-container space-y-6">
      <div className="card bg-emerald-50/50 border-emerald-200">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 size={20} />
          <h1 className="text-xl font-bold">Booking Confirmation</h1>
        </div>
        <p className="mt-2 text-sm text-emerald-800">
          Your booking has been submitted. Use the ID below to track status.
        </p>
        <code className="mt-2 inline-block rounded-lg bg-white px-3 py-1.5 font-mono text-sm text-slate-700">
          {bookingId}
        </code>
      </div>
      <TrackBookingForm initialBookingId={bookingId} />
      <DisclaimerBanner />
    </div>
  );
}
