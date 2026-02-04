import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDocument, getRecords, extractDocument, updateRecord } from '../api';
import { Document, ExtractedRecord } from '../types';

const ReviewRow: React.FC<{ record: ExtractedRecord, onUpdate: (id: number, val: string, status: string) => void }> = ({ record, onUpdate }) => {
    const [editValue, setEditValue] = useState(record.value || '');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setEditValue(record.value || '');
    }, [record.value]);

    const handleSave = () => {
        onUpdate(record.id, editValue, 'manual_updated');
        setIsEditing(false);
    };

    const handleApprove = () => {
        onUpdate(record.id, record.value || '', 'approved');
    };

    return (
        <tr style={{ background: record.status === 'approved' ? '#e8f5e9' : record.status === 'manual_updated' ? '#e3f2fd' : 'white' }}>
            <td>
                <strong>{record.field_name}</strong>
                <div style={{ fontSize: '0.8em', color: '#666' }}>{record.citation}</div>
            </td>
            <td>
                {isEditing ? (
                    <div>
                        <textarea
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            style={{ width: '100%', minHeight: '60px', padding: '5px' }}
                        />
                        <div style={{ marginTop: '5px' }}>
                            <button onClick={handleSave} style={{ marginRight: '5px', background: '#2ecc71' }}>Save</button>
                            <button onClick={() => setIsEditing(false)} style={{ background: '#95a5a6' }}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div onClick={() => setIsEditing(true)} style={{ cursor: 'pointer', minHeight: '20px' }} title="Click to edit">
                        {record.value || <em style={{ color: '#ccc' }}>Empty</em>}
                    </div>
                )}
                 {record.ai_value && record.ai_value !== record.value && (
                    <div style={{ fontSize: '0.8em', color: '#e67e22', marginTop: '5px' }}>
                        <strong>Original AI:</strong> {record.ai_value}
                    </div>
                )}
            </td>
            <td>{record.ai_confidence}</td>
            <td>
                <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                    <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: record.status === 'pending' ? 'orange' : record.status === 'approved' ? '#2ecc71' : '#3498db',
                        color: 'white',
                        fontSize: '0.8em',
                        textAlign: 'center'
                    }}>
                        {record.status}
                    </span>
                    {record.status !== 'approved' && (
                        <button onClick={handleApprove} style={{ padding: '4px', fontSize: '0.8em', background: '#27ae60' }}>
                            Approve
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

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

  const handleUpdateRecord = async (recordId: number, value: string, status: string) => {
      try {
          await updateRecord(recordId, value, status);
          // Optimistic update or refresh
          const updatedRecords = records.map(r => r.id === recordId ? { ...r, value, status } : r);
          // Actually typing is tricky for 'status' union, assume API returns valid
          // Better to refresh
          // setRecords(updatedRecords);
          const r = await getRecords(parseInt(id!));
          setRecords(r);
      } catch (e) {
          alert("Update failed: " + e);
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
                  <th style={{ width: '30%' }}>Field</th>
                  <th style={{ width: '40%' }}>Value</th>
                  <th>Conf.</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <ReviewRow key={r.id} record={r} onUpdate={handleUpdateRecord} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
