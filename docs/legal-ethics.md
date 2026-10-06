# Legal and Ethical Guardrails

1. All user-facing outputs must include: "This is AI-generated guidance, not legal advice."
2. High-risk modules (dispute predictor) use confidence gating with abstention behavior.
3. Uploaded files are stored locally; production deployments should enforce retention and encryption policies.
4. Public no-auth mode is for v1 prototyping and should not be used for sensitive production traffic.
5. Fraud and authenticity checks provide risk indications only, not final legal determinations.
