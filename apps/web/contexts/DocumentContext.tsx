"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { API_BASE } from "../lib/api";

// ── Types ──

export type SummaryData = {
  summary_bullets: string[];
  obligations: string[];
  deadlines: string[];
  language?: string;
};

export type HealthData = {
  risk_score: number;
  risk_level: string;
  risky_clauses: string[];
  missing_sections: string[];
  suspicious_phrases: string[];
  plain_explanation: string[];
};

export type NoticeData = {
  fraud_risk_score: number;
  risk_level: string;
  reasons: string[];
  suggested_next_steps: string[];
};

export type DocumentState = {
  docId: string | null;
  filename: string | null;
  textPreview: string | null;
  textChars: number;
  chunksIndexed: number;
  summary: SummaryData | null;
  healthCheck: HealthData | null;
  noticeVerification: NoticeData | null;
};

type DocumentContextType = {
  doc: DocumentState;
  uploading: boolean;
  uploadError: string;
  uploadDocument: (file: File) => Promise<void>;
  setText: (text: string) => void;
  clearDocument: () => void;
};

const INITIAL_STATE: DocumentState = {
  docId: null,
  filename: null,
  textPreview: null,
  textChars: 0,
  chunksIndexed: 0,
  summary: null,
  healthCheck: null,
  noticeVerification: null,
};

// ── Context ──

const DocumentContext = createContext<DocumentContextType>({
  doc: INITIAL_STATE,
  uploading: false,
  uploadError: "",
  uploadDocument: async () => {},
  setText: () => {},
  clearDocument: () => {},
});

export function useDocument() {
  return useContext(DocumentContext);
}

// ── Provider ──

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [doc, setDoc] = useState<DocumentState>(INITIAL_STATE);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const uploadDocument = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError("");

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/docs/upload`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      const analysis = data.analysis || {};
      const summaryRaw = analysis.summary || {};
      const healthRaw = analysis.legal_health || null;
      const noticeRaw = analysis.notice_verification || null;

      // Normalize summary: strip "- " prefix from bullets
      const summary: SummaryData | null = summaryRaw.summary_bullets
        ? {
            summary_bullets: summaryRaw.summary_bullets,
            obligations: summaryRaw.obligations || [],
            deadlines: summaryRaw.deadlines || [],
            language: summaryRaw.language,
          }
        : null;

      setDoc({
        docId: data.doc_id,
        filename: data.filename,
        textPreview: data.text_preview || null,
        textChars: data.text_chars || 0,
        chunksIndexed: data.chunks_indexed || 0,
        summary,
        healthCheck: healthRaw,
        noticeVerification: noticeRaw,
      });
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const setText = useCallback((text: string) => {
    setDoc((prev) => ({ ...prev, textPreview: text, textChars: text.length }));
  }, []);

  const clearDocument = useCallback(() => {
    setDoc(INITIAL_STATE);
    setUploadError("");
  }, []);

  return (
    <DocumentContext.Provider
      value={{ doc, uploading, uploadError, uploadDocument, setText, clearDocument }}
    >
      {children}
    </DocumentContext.Provider>
  );
}
