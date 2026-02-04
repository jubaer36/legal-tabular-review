import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, createProject, getFiles } from '../api';
import { Project } from '../types';

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async () => {
    if (!newProjectName) return;
    setLoading(true);
    try {
      await createProject(newProjectName, 'Created via UI');
      setNewProjectName('');
      await loadProjects();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Projects</h2>

      <div className="card">
        <h3>Create New Project</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Project Name"
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
          />
          <button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.description}</td>
                <td>{new Date(p.created_at).toLocaleString()}</td>
                <td>
                  <Link to={`/projects/${p.id}`}>View</Link>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5}>No projects found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
