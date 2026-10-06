"""
RAG Q&A — combines vector search results with LLM for contextual answers.
Falls back to template-based answer if LLM is unavailable.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Iterable, Optional

from .vector_index import SearchHit

if TYPE_CHECKING:
    from .llm import LLMService

DISCLAIMER = "\n\nThis is AI-generated guidance, not a substitute for a qualified lawyer."


def compose_contextual_answer(
    question: str,
    hits: Iterable[SearchHit],
    history: list[dict],
    llm: Optional["LLMService"] = None,
) -> tuple[str, float]:
    """
    Generate an answer from search hits. Uses LLM if available,
    otherwise falls back to template-based response.
    """
    hits = list(hits)
    if not hits:
        return (
            "I could not find relevant information in indexed documents. "
            "Please upload related legal documents first." + DISCLAIMER,
            0.0,
        )

    top = hits[0]
    confidence = top.score
    context_chunks = [h.snippet for h in hits if h.snippet]

    # Try LLM-powered answer
    if llm and llm.available:
        llm_answer = llm.answer_question(question, context_chunks, history)
        if llm_answer:
            if "AI-generated" not in llm_answer and "not legal advice" not in llm_answer.lower():
                llm_answer += DISCLAIMER
            return llm_answer, float(max(0.0, min(1.0, confidence)))

    # Fallback: template-based answer
    history_line = ""
    if history:
        last_turn = history[-1]
        history_line = f" Previous context: {last_turn.get('content', '')[:140]}"

    answer = (
        f"Based on uploaded legal content, here is the best guidance for your question: '{question}'."
        f" The most relevant source indicates: {top.snippet}.{history_line}"
        + DISCLAIMER
    )
    return answer, float(max(0.0, min(1.0, confidence)))
