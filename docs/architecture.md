# Legal Mitra Architecture (v1)

## Stack
- Backend: FastAPI (`apps/api`)
- Frontend: Next.js (`apps/web`)
- Worker: local polling worker (`apps/worker`)
- Structured storage: DuckDB (`artifacts/duckdb/legal_mitra.duckdb`)
- Semantic retrieval: FAISS (`artifacts/indices/legal_mitra.index`)
- Dataset registry: `datasets/registry/dataset_manifest.yaml`

## No-Auth Policy
- v1 is fully public.
- Admin-lite pages are isolated by route but not protected.

## Core Data Tables
- `documents`
- `qa_messages`
- `fraud_reports`
- `bookings`
- `tasks`

## Booking Flow
1. User searches lawyers.
2. User submits booking form.
3. API validates required fields + consent.
4. API matches top lawyers and stores booking.
5. User gets `booking_id` and tracks status.
