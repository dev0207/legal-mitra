import { AlertTriangle } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
      <p className="text-sm text-amber-800">
        <span className="font-semibold">Disclaimer:</span> This is AI-generated
        guidance and not a substitute for a qualified lawyer. Always consult a
        legal professional for critical decisions.
      </p>
    </div>
  );
}
