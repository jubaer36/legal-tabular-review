import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectSchema, addSchemaField, deleteSchemaField, ExtractionSchema } from '../api';

export const ProjectSettings: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [schema, setSchema] = useState<ExtractionSchema[]>([]);
    const [newField, setNewField] = useState({ field_name: '', field_description: '', data_type: 'string' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) loadSchema();
    }, [id]);

    const loadSchema = async () => {
        if (!id) return;
        try {
            const data = await getProjectSchema(parseInt(id));
            setSchema(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAdd = async () => {
        if (!id || !newField.field_name) return;
        setLoading(true);
        try {
            await addSchemaField(parseInt(id), newField);
            setNewField({ field_name: '', field_description: '', data_type: 'string' });
            await loadSchema();
        } catch (e) {
            alert("Failed to add field");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (fieldId: number) => {
        if (!id) return;
        if (!confirm("Are you sure? This will not affect existing extractions but will remove it from future ones.")) return;
        try {
            await deleteSchemaField(parseInt(id), fieldId);
            await loadSchema();
        } catch (e) {
            alert("Failed to delete");
        }
    };

    return (
        <div>
            <Link to={`/projects/${id}`}>Back to Project</Link>
            <h2>Schema Configuration</h2>
            <p>Define the fields you want to extract for documents in this project.</p>

            <div className="card">
                <h3>Add New Field</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                    <div>
                        <label htmlFor="fname">Field Name</label>
                        <input
                            id="fname"
                            type="text"
                            value={newField.field_name}
                            onChange={e => setNewField({...newField, field_name: e.target.value})}
                            placeholder="e.g. Liability Cap"
                        />
                    </div>
                    <div>
                        <label htmlFor="fdesc">Description</label>
                        <input
                            id="fdesc"
                            type="text"
                            value={newField.field_description}
                            onChange={e => setNewField({...newField, field_description: e.target.value})}
                            placeholder="Instructions for the AI..."
                        />
                    </div>
                    <div>
                        <label htmlFor="ftype">Type</label>
                         <select
                            id="ftype"
                            value={newField.data_type}
                            onChange={e => setNewField({...newField, data_type: e.target.value})}
                         >
                             <option value="string">String</option>
                             <option value="number">Number</option>
                             <option value="date">Date</option>
                         </select>
                    </div>
                    <button onClick={handleAdd} disabled={loading}>Add</button>
                </div>
            </div>

            <div className="card">
                <h3>Current Schema</h3>
                {schema.length === 0 ? (
                    <p style={{ color: '#666' }}>No custom schema defined. Using Default Schema (Title, Date, Parties, etc.)</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schema.map(f => (
                                <tr key={f.id}>
                                    <td>{f.field_name}</td>
                                    <td>{f.field_description}</td>
                                    <td>{f.data_type}</td>
                                    <td>
                                        <button onClick={() => handleDelete(f.id)} style={{ background: '#e74c3c' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
