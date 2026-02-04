import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProject, getDocuments, ingestDocument, getFiles } from '../api';
import { Project, Document } from '../types';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
      loadFiles();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      const p = await getProject(parseInt(id));
      setProject(p);
      const docs = await getDocuments(parseInt(id));
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    }
  };

  const loadFiles = async () => {
    try {
      const files = await getFiles();
      setAvailableFiles(files);
      if (files.length > 0) setSelectedFile(files[0]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleIngest = async () => {
    if (!id || !selectedFile) return;
    setIngesting(true);
    try {
      await ingestDocument(parseInt(id), selectedFile);
      await loadData();
    } catch (e) {
      alert('Ingestion failed: ' + e);
    } finally {
      setIngesting(false);
    }
  };

  if (!project) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link to="/">Back to Projects</Link>
            <h2>{project.name}</h2>
          </div>
          <Link to={`/projects/${project.id}/evaluation`} className="button-link" style={{ background: '#9b59b6', color: 'white', padding: '8px 16px', borderRadius: '4px', textDecoration: 'none' }}>
            View Evaluation Report
          </Link>
      </div>
      <p>{project.description}</p>

      <div className="card">
        <h3>Ingest Document</h3>
        <p>Select a file from the <code>data/</code> folder:</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={selectedFile}
            onChange={e => setSelectedFile(e.target.value)}
            style={{ padding: '8px' }}
          >
            {availableFiles.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button onClick={handleIngest} disabled={ingesting}>
            {ingesting ? 'Ingesting...' : 'Ingest'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Documents</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Filename</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(d => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.filename}</td>
                <td>{d.status}</td>
                <td>{new Date(d.created_at).toLocaleString()}</td>
                <td>
                  <Link to={`/documents/${d.id}`}>Review</Link>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={5}>No documents ingested yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
