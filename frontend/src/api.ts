import axios from 'axios';
import { Project, Document, ExtractedRecord } from './types';

const API_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
});

export const getProjects = async () => {
  const response = await api.get<Project[]>('/projects');
  return response.data;
};

export const createProject = async (name: string, description: string) => {
  const response = await api.post<Project>('/projects', { name, description });
  return response.data;
};

export const getProject = async (id: number) => {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
};

export const getFiles = async () => {
    const response = await api.get<string[]>('/files');
    return response.data;
}

export const ingestDocument = async (projectId: number, filename: string) => {
  const response = await api.post<Document>(`/projects/${projectId}/ingest`, { filename });
  return response.data;
};

export const getDocuments = async (projectId: number) => {
  const response = await api.get<Document[]>(`/projects/${projectId}/documents`);
  return response.data;
};

export const getDocument = async (docId: number) => {
  const response = await api.get<Document>(`/documents/${docId}`);
  return response.data;
};

export const extractDocument = async (docId: number) => {
  const response = await api.post<ExtractedRecord[]>(`/documents/${docId}/extract`);
  return response.data;
};

export const getRecords = async (docId: number) => {
  const response = await api.get<ExtractedRecord[]>(`/documents/${docId}/records`);
  return response.data;
};

export const updateRecord = async (recordId: number, value: string, status: string) => {
    const response = await api.put<ExtractedRecord>(`/records/${recordId}`, { value, status });
    return response.data;
};

export interface EvaluationStats {
    total_fields: number;
    reviewed_fields: number;
    correct_fields: number;
    accuracy: number;
}

export const getEvaluation = async (projectId: number) => {
    const response = await api.get<EvaluationStats>(`/projects/${projectId}/evaluation`);
    return response.data;
};
