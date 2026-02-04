Legal Tabular Review Demo

Minimal skeleton for the Legal Tabular Review take-home project. The system
ingests multiple legal documents, extracts key fields into a structured table,
and supports side-by-side comparison with review workflows and custom field
templates.

## Implementation Status

- **Backend**: FastAPI + SQLModel (SQLite). Supports project management, document ingestion (PDF/HTML), and LLM extraction via Groq.
- **Frontend**: React + Vite. Supports project listing, document ingestion, and side-by-side tabular review.
- **Extraction**: Uses Groq (LLaMA 3 70B) to extract key legal fields (Title, Effective Date, Parties, etc.) with confidence scores and citations.

## Setup & Running

Please refer to [SETUP.md](SETUP.md) for detailed instructions on how to install dependencies and run the application.

## Testing

Smoke tests are available in the `backend/` directory:
- `python test_ingest_smoke.py`: Verifies ingestion.
- `python test_e2e_flow.py`: Verifies the full API flow.

## Architecture

- **Database**: SQLite (`database.db`). Tables: `Project`, `Document`, `ExtractedRecord`.
- **API**: FastAPI serving REST endpoints.
- **Parsers**: `pypdf` for PDF, `BeautifulSoup` for HTML.
- **LLM**: Groq API for JSON extraction.

## Features

1.  **Project Management**: Create projects to organize documents.
2.  **Ingestion**: Parse text from PDF and HTML files in the `data/` directory.
3.  **Extraction**: AI-powered extraction of fields with Normalization, Confidence, and Citations.
4.  **Review**: Side-by-side view of original document text and extracted table.
