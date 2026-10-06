"""
Service singletons — initialized once at startup.
LLM service connects to Ollama and gracefully degrades if unavailable.
"""
from __future__ import annotations

import logging

from legal_mitra_api.core import bootstrap  # noqa: F401

from ml_core.lawyers import LawyerDirectory
from ml_core.llm import LLMService
from ml_core.storage import DuckDBStore
from ml_core.vector_index import FaissIndexStore

logger = logging.getLogger(__name__)

db = DuckDBStore()
index_store = FaissIndexStore()
lawyer_directory = LawyerDirectory()
llm = LLMService()

if llm.available:
    logger.info("LLM connected: model=%s at %s", llm.model, llm.base_url)
else:
    logger.warning(
        "Ollama not available — running in rule-based mode. "
        "Start Ollama with: ollama run %s",
        llm.model,
    )
