import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDocument, getRecords, extractDocument } from '../api';
import { Document, ExtractedRecord } from '../types';

export const DocumentReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [records, setRecords] = useState<ExtractedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await getDocument(parseInt(id));
      setDoc(d);
      const r = await getRecords(parseInt(id));
      setRecords(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!id) return;
    setExtracting(true);
    try {
      const newRecords = await extractDocument(parseInt(id));
      setRecords(newRecords);
      // Refresh doc to update status
      const d = await getDocument(parseInt(id));
      setDoc(d);
    } catch (e) {
      alert('Extraction failed (Ensure API Key is set): ' + e);
    } finally {
      setExtracting(false);
    }
  };

  if (!doc) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '10px', background: '#eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <Link to={`/projects/${doc.project_id}`}>Back</Link> |
           <strong> {doc.filename}</strong> ({doc.status})
        </div>
        <div>
          <button onClick={handleExtract} disabled={extracting || loading}>
            {extracting ? 'Extracting...' : 'Re-Extract'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Document Text View */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', borderRight: '1px solid #ccc', background: 'white' }}>
          <h3>Document Text</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {doc.content}
          </pre>
        </div>

        {/* Extracted Table View */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f9f9f9' }}>
          <h3>Extracted Data</h3>
          {records.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <p>No data extracted yet.</p>
              <button onClick={handleExtract} disabled={extracting} style={{ fontSize: '1.2em' }}>
                Start Extraction
              </button>
            </div>
          ) : (
            <table className="review-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                  <th>Conf.</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>
                        <strong>{r.field_name}</strong>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>{r.citation}</div>
                    </td>
                    <td>
                        <div>{r.value}</div>
                        {r.normalization && r.normalization !== r.value && (
                            <div style={{ fontSize: '0.8em', color: 'blue' }}>Norm: {r.normalization}</div>
                        )}
                    </td>
                    <td>{r.confidence}</td>
                    <td>
                        <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: r.status === 'pending' ? 'orange' : 'green',
                            color: 'white',
                            fontSize: '0.8em'
                        }}>
                            {r.status}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
