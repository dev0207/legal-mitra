"use client";

import { useRef, useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import DisclaimerBanner from "../../components/DisclaimerBanner";
import { useDocument } from "../../contexts/DocumentContext";
import { API_BASE } from "../../lib/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { source: string; score: number; snippet: string }[];
  confidence?: number;
};

export default function QAPage() {
  const { doc, uploading: ctxUploading, uploadDocument } = useDocument();
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevDocId = useRef<string | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show system message when a doc is loaded from context
  useEffect(() => {
    if (doc.docId && doc.docId !== prevDocId.current) {
      prevDocId.current = doc.docId;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Document "${doc.filename}" is loaded (${doc.chunksIndexed} chunks indexed). You can now ask questions about it.`,
        },
      ]);
    }
  }, [doc.docId, doc.filename, doc.chunksIndexed]);

  async function askQuestion() {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/qa/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          session_id: sessionId || null,
          top_k: 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Q&A failed");

      if (data.session_id) setSessionId(data.session_id);

      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I could not process your question. Make sure you have uploaded documents first.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setSessionId("");
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 className="section-title">AI Legal Q&A</h1>
            <p className="section-subtitle">
              Ask questions about uploaded documents — context-aware with memory
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <label className="btn-secondary cursor-pointer">
            <Upload size={16} />
            {ctxUploading ? "Uploading..." : "Upload Doc"}
            <input
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadDocument(f);
              }}
            />
          </label>
          {messages.length > 0 && (
            <button onClick={clearChat} className="btn-secondary">
              <Trash2 size={16} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="mt-6 card p-0 flex flex-col" style={{ height: "calc(100vh - 300px)", minHeight: 400 }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Bot size={48} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">
                Start a conversation
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
                Upload a legal document first, then ask questions about it. The
                AI will provide answers grounded in your document content.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
                {msg.confidence !== undefined && (
                  <p className="mt-2 text-xs opacity-70">
                    Confidence: {Math.round(msg.confidence * 100)}%
                  </p>
                )}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 border-t border-slate-200/50 pt-2">
                    <p className="text-xs font-medium opacity-70 mb-1">
                      Sources:
                    </p>
                    {msg.sources.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 text-xs opacity-60"
                      >
                        <FileText size={10} />
                        {s.source} ({Math.round(s.score * 100)}%)
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <Bot size={16} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && askQuestion()}
              placeholder="Ask a question about your uploaded documents..."
              className="input-field flex-1"
              disabled={loading}
            />
            <button
              onClick={askQuestion}
              disabled={!input.trim() || loading}
              className="btn-primary"
            >
              <Send size={16} />
            </button>
          </div>
          {sessionId && (
            <p className="mt-2 text-xs text-slate-400">
              Session: {sessionId.slice(0, 8)}...
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <DisclaimerBanner />
      </div>
    </div>
  );
}
