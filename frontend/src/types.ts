export interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Document {
  id: number;
  project_id: number;
  filename: string;
  content: string;
  file_path: string;
  status: 'uploaded' | 'ingested' | 'extracted' | 'error';
  created_at: string;
}

export interface ExtractedRecord {
  id: number;
  document_id: number;
  field_name: string;
  value: string | null;
  confidence: number | null;
  citation: string | null;
  normalization: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'manual_updated';
}
