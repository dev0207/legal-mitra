# Model Cards (v1 implementation)

## Legal Health Check
- Method: Rule engine + legal-risk patterns
- Planned upgrade: Legal-BERT fine-tuned clause classifier

## Dispute Predictor
- Method: Conservative heuristic with confidence gate
- Planned upgrade: Calibrated LightGBM/XGBoost trained on outcome dataset

## Summarizer
- Method: Extractive bullet summarization + obligations/deadline regex
- Planned upgrade: local quantized Qwen2.5 7B instruction model

## Fake Notice Detector
- Method: Scam-pattern rules + risk scoring
- Planned upgrade: binary classifier with weak-label bootstrapping

## Speech Bot
- Method: transcript-first intent classification
- Planned upgrade: faster-whisper-small audio pipeline

## Q&A Memory
- Method: FAISS retrieval + contextual response template
- Planned upgrade: multilingual-e5 embeddings + local generation model

## Lawyer Recommendation
- Method: static CSV + weighted ranking
- Planned upgrade: richer ranking features + feedback loop

## Fraud Community Detector
- Method: grouped signal clustering by identifiers
- Planned upgrade: HDBSCAN + graph anomaly scoring
