import React, { useCallback, useState } from 'react';
import { FaCog, FaPlus, FaRedo, FaTimes, FaTrash } from 'react-icons/fa';
import { Motif } from '../types/themesSymbols';

interface MotifsManagerProps {
  motifs: Motif[];
  onMotifsChange: (motifs: Motif[]) => void;
  readonly?: boolean;
}

const MotifsManager: React.FC<MotifsManagerProps> = ({
  motifs,
  onMotifsChange,
  readonly = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newMotif, setNewMotif] = useState({ name: '', description: '' });

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this motif?')) {
      const updatedMotifs = motifs.filter(motif => motif.id !== id);
      onMotifsChange(updatedMotifs);
    }
  }, [motifs, onMotifsChange]);

  const handleAdd = useCallback(() => {
    if (!newMotif.name.trim()) return;

    const motif: Motif = {
      id: `motif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newMotif.name.trim(),
      description: newMotif.description.trim(),
      type: 'image',
      pattern: '',
      significance: '',
      variations: [],
      themeConnections: [],
      frequency: 1,
      distribution: '',
      impact: '',
      examples: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onMotifsChange([...motifs, motif]);
    setNewMotif({ name: '', description: '' });
    setIsAdding(false);
  }, [newMotif, motifs, onMotifsChange]);

  if (motifs.length === 0 && !isAdding) {
    return (
      <div className="empty-state">
        <FaRedo className="empty-icon" />
        <h3>No Motifs Yet</h3>
        <p>Motifs are recurring elements or patterns that contribute to the story's theme.</p>
        {!readonly && (
          <button 
            className="btn btn-primary"
            onClick={() => setIsAdding(true)}
          >
            <FaPlus /> Add First Motif
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="motifs-manager">
      <div className="motifs-header">
        <div className="motifs-stats">
          <div className="stat-item">
            <span className="stat-label">Total Motifs:</span>
            <span className="stat-value">{motifs.length}</span>
          </div>
        </div>
        {!readonly && (
          <div className="motifs-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
            >
              <FaPlus /> Add Motif
            </button>
            <button 
              className="btn btn-secondary"
              disabled
              title="AI analysis coming soon"
            >
              <FaCog /> Analyze Motifs
            </button>
          </div>
        )}
      </div>

      <div className="motifs-list">
        {motifs.map(motif => (
          <div key={motif.id} className="motif-card">
            <div className="motif-header">
              <h3>{motif.name}</h3>
              {!readonly && (
                <button 
                  className="btn-icon btn-danger"
                  onClick={() => handleDelete(motif.id)}
                  title="Delete motif"
                >
                  <FaTrash />
                </button>
              )}
            </div>
            {motif.description && (
              <p className="motif-description">{motif.description}</p>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="motif-card motif-add-form">
            <h3>Add New Motif</h3>
            
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={newMotif.name}
                onChange={(e) => setNewMotif(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Motif name..."
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newMotif.description}
                onChange={(e) => setNewMotif(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this motif..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={!newMotif.name.trim()}
              >
                <FaCog /> Add Motif
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setIsAdding(false);
                  setNewMotif({ name: '', description: '' });
                }}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MotifsManager;
