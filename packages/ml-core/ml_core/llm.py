"""
LLM Service — Ollama integration via LangChain.

Provides a unified interface for all LLM-powered features.
Falls back gracefully to rule-based results when Ollama is unavailable.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "60"))

# Prompts tuned for Indian legal context
SYSTEM_PROMPT = (
    "You are Legal Mitra, an AI legal assistant for Indian citizens. "
    "You provide guidance in simple language. You are NOT a lawyer. "
    "Always remind users this is AI-generated guidance, not legal advice. "
    "Context: Indian legal system (IPC, CrPC, civil law, rent control acts, labor law, family law)."
)

SUMMARIZE_PROMPT = """Analyze this legal document and provide:
1. **Summary**: 4-6 bullet points in simple language explaining what this document says
2. **Obligations**: List all obligations/duties mentioned (things someone must do)
3. **Deadlines**: List any dates, time limits, or deadlines mentioned

Document text:
---
{text}
---

Respond in this exact JSON format (no markdown, just raw JSON):
{{"summary_bullets": ["point 1", "point 2", ...], "obligations": ["obligation 1", ...], "deadlines": ["deadline 1", ...]}}"""

HEALTH_CHECK_PROMPT = """Analyze this legal document for risks and issues.

Rule-based analysis already found:
- Risky clauses: {risky_clauses}
- Missing sections: {missing_sections}

Document text:
---
{text}
---

Provide a plain-language explanation of the risks in 2-3 sentences.
Also identify any additional risky phrases the rules may have missed.

Respond in this exact JSON format (no markdown, just raw JSON):
{{"plain_explanation": ["explanation sentence 1", "sentence 2"], "additional_risks": ["risk 1", ...], "risk_level": "LOW|MEDIUM|HIGH"}}"""

NOTICE_VERIFY_PROMPT = """Analyze this legal notice to determine if it is genuine or potentially fraudulent.

Rule-based signals already detected: {signals}

Notice text:
---
{text}
---

Look for these red flags:
- Missing advocate details / enrollment number
- Urgency tactics ("immediate arrest", "pay now")
- Misspelled court names or legal terms
- Requests for payment via UPI/crypto/gift cards
- No proper case reference number

Respond in this exact JSON format (no markdown, just raw JSON):
{{"is_suspicious": true/false, "fraud_probability": 0.0-1.0, "reasons": ["reason 1", ...], "verdict": "one sentence summary"}}"""

QA_PROMPT = """You are Legal Mitra AI assistant. Answer the user's legal question using ONLY the provided context from uploaded documents.

Context from documents:
---
{context}
---

Conversation history:
{history}

User's question: {question}

Instructions:
- Answer based on the document context provided above
- If the context doesn't contain relevant information, say so clearly
- Keep the answer concise and in simple language
- Mention relevant sections/clauses from the document if applicable
- End with the disclaimer that this is AI guidance, not legal advice"""

SPEECH_INTENT_PROMPT = """A user described their legal situation verbally. Classify the intent and provide guidance.

User's statement: "{transcript}"

Analyze and respond in this exact JSON format (no markdown, just raw JSON):
{{
  "detected_intent": "brief description of what user needs",
  "legal_category": "rental|family|property|labor|criminal|civil|other",
  "rights_explanation": "explain their rights in 2-3 simple sentences",
  "suggested_actions": ["action 1", "action 2", "action 3"]
}}"""


class LLMService:
    """Wrapper around Ollama LLM via LangChain. Gracefully degrades if unavailable."""

    def __init__(
        self,
        model: str = OLLAMA_MODEL,
        base_url: str = OLLAMA_BASE_URL,
        timeout: int = OLLAMA_TIMEOUT,
    ):
        self.model = model
        self.base_url = base_url
        self.timeout = timeout
        self._llm = None
        self._available: Optional[bool] = None

    @property
    def available(self) -> bool:
        if self._available is not None:
            return self._available
        try:
            self._init_llm()
            self._available = True
        except Exception as exc:
            logger.warning("Ollama not available: %s", exc)
            self._available = False
        return self._available

    def _init_llm(self) -> None:
        if self._llm is not None:
            return
        from langchain_ollama import ChatOllama
        self._llm = ChatOllama(
            model=self.model,
            base_url=self.base_url,
            timeout=self.timeout,
            temperature=0.3,
        )
        # Quick health check — will throw if Ollama isn't running
        self._llm.invoke("ping")

    def _invoke(self, system: str, user_prompt: str) -> Optional[str]:
        """Send a message to the LLM, return text or None on failure."""
        if not self.available:
            return None
        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            messages = [
                SystemMessage(content=system),
                HumanMessage(content=user_prompt),
            ]
            response = self._llm.invoke(messages)
            return response.content
        except Exception as exc:
            logger.error("LLM call failed: %s", exc)
            # Mark as unavailable to avoid repeated failures
            self._available = False
            return None

    def _parse_json(self, text: Optional[str]) -> Optional[dict]:
        """Try to extract JSON from LLM response."""
        if not text:
            return None
        import json
        # Strip markdown code fences if present
        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            cleaned = "\n".join(lines)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Try to find JSON within the text
            start = cleaned.find("{")
            end = cleaned.rfind("}") + 1
            if start >= 0 and end > start:
                try:
                    return json.loads(cleaned[start:end])
                except json.JSONDecodeError:
                    pass
        logger.warning("Failed to parse LLM JSON response")
        return None

    def summarize(self, text: str) -> Optional[dict]:
        """Generate summary with LLM. Returns dict with summary_bullets, obligations, deadlines."""
        # Truncate to avoid token limits
        truncated = text[:6000]
        raw = self._invoke(SYSTEM_PROMPT, SUMMARIZE_PROMPT.format(text=truncated))
        return self._parse_json(raw)

    def health_check(self, text: str, risky_clauses: list[str], missing_sections: list[str]) -> Optional[dict]:
        """LLM-enhanced health check analysis."""
        truncated = text[:6000]
        prompt = HEALTH_CHECK_PROMPT.format(
            text=truncated,
            risky_clauses=", ".join(risky_clauses) or "none",
            missing_sections=", ".join(missing_sections) or "none",
        )
        raw = self._invoke(SYSTEM_PROMPT, prompt)
        return self._parse_json(raw)

    def verify_notice(self, text: str, rule_signals: list[str]) -> Optional[dict]:
        """LLM-enhanced fake notice detection."""
        truncated = text[:4000]
        prompt = NOTICE_VERIFY_PROMPT.format(
            text=truncated,
            signals=", ".join(rule_signals) or "none detected by rules",
        )
        raw = self._invoke(SYSTEM_PROMPT, prompt)
        return self._parse_json(raw)

    def answer_question(
        self,
        question: str,
        context_chunks: list[str],
        history: list[dict],
    ) -> Optional[str]:
        """RAG-based Q&A using document context."""
        context = "\n\n".join(context_chunks[:5]) if context_chunks else "No documents uploaded yet."
        history_text = ""
        if history:
            for msg in history[-6:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")[:200]
                history_text += f"{role}: {content}\n"

        prompt = QA_PROMPT.format(
            context=context[:5000],
            history=history_text or "No previous conversation.",
            question=question,
        )
        return self._invoke(SYSTEM_PROMPT, prompt)

    def classify_speech_intent(self, transcript: str) -> Optional[dict]:
        """Classify intent from speech transcript."""
        prompt = SPEECH_INTENT_PROMPT.format(transcript=transcript[:2000])
        raw = self._invoke(SYSTEM_PROMPT, prompt)
        return self._parse_json(raw)
