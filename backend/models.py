from typing import Optional, List
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship, JSON

class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    documents: List["Document"] = Relationship(back_populates="project")

class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    filename: str
    content: str  # Storing full text content for now
    file_path: str # Path relative to repo root
    status: str = Field(default="uploaded") # uploaded, extracted, error
    created_at: datetime = Field(default_factory=datetime.utcnow)

    project: Optional[Project] = Relationship(back_populates="documents")
    extracted_records: List["ExtractedRecord"] = Relationship(back_populates="document")

class ExtractionSchema(SQLModel, table=True):
    """Defines the fields we want to extract for a project"""
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    field_name: str
    field_description: str
    data_type: str = Field(default="string") # string, number, date

    # We might want to link this to Project more directly later,
    # but for now let's assume one schema per project or just global.
    # Actually, the requirements say "Field Template & Schema Management".
    # Let's keep it simple: A project has many schema definitions.

class ExtractedRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    document_id: int = Field(foreign_key="document.id")
    field_name: str

    # Current Value (Editable)
    value: Optional[str] = None

    # Original AI Value (Audit Trail)
    ai_value: Optional[str] = None
    ai_confidence: Optional[float] = None

    citation: Optional[str] = None
    normalization: Optional[str] = None
    status: str = Field(default="pending") # pending, approved, rejected, manual_updated

    document: Optional[Document] = Relationship(back_populates="extracted_records")
