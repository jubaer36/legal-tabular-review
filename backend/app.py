import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, get_session
from models import Project, Document, ExtractedRecord, ExtractionSchema
from parsers import parse_document
from extraction import extract_data_from_text
from pydantic import BaseModel
from vector_store import process_and_store_document

app = FastAPI(title="Legal Tabular Review API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}

# Projects
@app.post("/projects", response_model=Project)
def create_project(project: Project, session: Session = Depends(get_session)):
    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@app.get("/projects", response_model=List[Project])
def list_projects(session: Session = Depends(get_session)):
    projects = session.exec(select(Project)).all()
    return projects

@app.get("/projects/{project_id}", response_model=Project)
def get_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# Ingestion
class IngestRequest(BaseModel):
    filename: str

@app.get("/files")
def list_files():
    """List available files in the data directory."""
    if not os.path.exists(DATA_DIR):
        return []
    return [f for f in os.listdir(DATA_DIR) if os.path.isfile(os.path.join(DATA_DIR, f))]

@app.post("/projects/{project_id}/ingest", response_model=Document)
def ingest_document(project_id: int, request: IngestRequest, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    file_path = os.path.join(DATA_DIR, request.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File {request.filename} not found in data directory")

    try:
        content = parse_document(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    doc = Document(
        project_id=project_id,
        filename=request.filename,
        content=content,
        file_path=file_path,
        status="ingested"
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)

    # Ingest into Vector Store
    try:
        process_and_store_document(doc.id, doc.content)
    except Exception as e:
        print(f"Vector store ingestion failed: {e}")

    return doc

@app.get("/projects/{project_id}/documents", response_model=List[Document])
def list_documents(project_id: int, session: Session = Depends(get_session)):
    # Using strict SQLModel select
    statement = select(Document).where(Document.project_id == project_id)
    documents = session.exec(statement).all()
    return documents

@app.get("/documents/{document_id}", response_model=Document)
def get_document(document_id: int, session: Session = Depends(get_session)):
    doc = session.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

# Extraction
@app.post("/documents/{document_id}/extract", response_model=List[ExtractedRecord])
def extract_document(document_id: int, session: Session = Depends(get_session)):
    doc = session.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Check if already extracted? Optionally clear old records.
    # For now, let's clear old records to support "Update template" workflow sort of.
    old_records = session.exec(select(ExtractedRecord).where(ExtractedRecord.document_id == document_id)).all()
    for rec in old_records:
        session.delete(rec)

    try:
        results = extract_data_from_text(doc.content, document_id=doc.id)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    saved_records = []
    for res in results:
        record = ExtractedRecord(
            document_id=document_id,
            field_name=res.get("field_name"),
            value=res.get("value"),
            confidence=res.get("confidence"),
            citation=res.get("citation"),
            normalization=res.get("normalization"),
            status="pending"
        )
        session.add(record)
        saved_records.append(record)

    doc.status = "extracted"
    session.add(doc)
    session.commit()

    # Refresh to get IDs
    for rec in saved_records:
        session.refresh(rec)

    return saved_records

@app.get("/documents/{document_id}/records", response_model=List[ExtractedRecord])
def get_records(document_id: int, session: Session = Depends(get_session)):
    statement = select(ExtractedRecord).where(ExtractedRecord.document_id == document_id)
    records = session.exec(statement).all()
    return records
