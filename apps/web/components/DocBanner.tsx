"use client";

import { FileText, X } from "lucide-react";
import { useDocument } from "../contexts/DocumentContext";

/**
 * Sticky banner shown when a document is loaded in context.
 * Visible across all module pages so users know their doc is active.
 */
export default function DocBanner() {
  const { doc, clearDocument } = useDocument();

  if (!doc.docId) return null;

  return (
    <div className="border-b border-indigo-100 bg-indigo-50/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-indigo-700">
          <FileText size={14} />
          <span className="font-medium">{doc.filename}</span>
          <span className="text-indigo-400">
            &bull; {doc.chunksIndexed} chunks &bull;{" "}
            {doc.textChars.toLocaleString()} chars
          </span>
        </div>
        <button
          onClick={clearDocument}
          className="rounded-md p-1 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600"
          title="Clear document"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
