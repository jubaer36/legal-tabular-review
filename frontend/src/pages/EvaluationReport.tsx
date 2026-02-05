import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvaluation, getProject, EvaluationStats, Project } from '../api';

export const EvaluationReport: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [stats, setStats] = useState<EvaluationStats | null>(null);

    useEffect(() => {
        if (id) {
            getProject(parseInt(id)).then(setProject);
            getEvaluation(parseInt(id)).then(setStats);
        }
    }, [id]);

    if (!project || !stats) return <div>Loading...</div>;

    return (
        <div>
            <Link to={`/projects/${id}`}>Back to Project</Link>
            <h2>Evaluation Report: {project.name}</h2>

            <div className="card">
                <h3>Overall Metrics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div style={{ textAlign: 'center', background: '#e3f2fd', padding: '20px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#1565c0' }}>{stats.accuracy}%</div>
                        <div>Accuracy</div>
                    </div>
                    <div style={{ textAlign: 'center', background: '#e8f5e9', padding: '20px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#2e7d32' }}>{stats.reviewed_fields} / {stats.total_fields}</div>
                        <div>Fields Reviewed</div>
                    </div>
                     <div style={{ textAlign: 'center', background: '#fff3e0', padding: '20px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#ef6c00' }}>{stats.correct_fields}</div>
                        <div>Correct Fields (Match AI)</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Field Accuracy Breakdown</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Field Name</th>
                            <th>Accuracy</th>
                            <th>Reviewed / Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.field_breakdown && stats.field_breakdown.map(f => (
                            <tr key={f.field_name}>
                                <td>{f.field_name}</td>
                                <td>
                                    <strong>{f.accuracy}%</strong>
                                    <div style={{ width: '100px', height: '6px', background: '#eee', marginTop: '5px', borderRadius: '3px' }}>
                                        <div style={{ width: `${f.accuracy}%`, height: '100%', background: f.accuracy > 80 ? '#2ecc71' : f.accuracy > 50 ? '#f1c40f' : '#e74c3c', borderRadius: '3px' }}></div>
                                    </div>
                                </td>
                                <td>{f.reviewed} / {f.total}</td>
                                <td>
                                    {f.reviewed === 0 ? <span style={{ color: '#999' }}>No Data</span> :
                                     f.accuracy < 50 ? <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Needs Attention</span> :
                                     f.accuracy > 90 ? <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>Excellent</span> :
                                     'Good'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card">
                <h3>Notes</h3>
                <p>Accuracy is calculated based on fields that have been reviewed (Approved or Manual Updated).</p>
                <p>Formula: <code>(Correct Fields / Reviewed Fields) * 100</code></p>
                <p>A field is considered "Correct" if the final reviewed value matches the original AI extraction.</p>
            </div>
        </div>
    );
};
