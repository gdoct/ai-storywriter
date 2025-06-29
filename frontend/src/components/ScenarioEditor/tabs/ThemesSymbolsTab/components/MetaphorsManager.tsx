import React, { useCallback, useState } from 'react';
import { FaCog, FaPlus, FaTimes, FaTrash, FaUser } from 'react-icons/fa';
import { Metaphor } from '../types/themesSymbols';

interface MetaphorsManagerProps {
  metaphors: Metaphor[];
  onMetaphorsChange: (metaphors: Metaphor[]) => void;
  readonly?: boolean;
}

const MetaphorsManager: React.FC<MetaphorsManagerProps> = ({
  metaphors,
  onMetaphorsChange,
  readonly = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newMetaphor, setNewMetaphor] = useState({ title: '', description: '' });

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this metaphor?')) {
      const updatedMetaphors = metaphors.filter(metaphor => metaphor.id !== id);
      onMetaphorsChange(updatedMetaphors);
    }
  }, [metaphors, onMetaphorsChange]);

  const handleAdd = useCallback(() => {
    if (!newMetaphor.title.trim()) return;

    const metaphor: Metaphor = {
      id: `metaphor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newMetaphor.title.trim(),
      description: newMetaphor.description.trim(),
      type: 'extended',
      vehicle: '',
      tenor: '',
      comparison: '',
      context: '',
      effect: '',
      examples: [],
      relatedSymbols: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onMetaphorsChange([...metaphors, metaphor]);
    setNewMetaphor({ title: '', description: '' });
    setIsAdding(false);
  }, [newMetaphor, metaphors, onMetaphorsChange]);

  if (metaphors.length === 0 && !isAdding) {
    return (
      <div className="empty-state">
        <FaUser className="empty-icon" />
        <h3>No Metaphors Yet</h3>
        <p>Metaphors create powerful comparisons that enhance understanding and emotional impact.</p>
        {!readonly && (
          <button 
            className="btn btn-primary"
            onClick={() => setIsAdding(true)}
          >
            <FaPlus /> Add First Metaphor
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="metaphors-manager">
      <div className="metaphors-header">
        <div className="metaphors-stats">
          <div className="stat-item">
            <span className="stat-label">Total Metaphors:</span>
            <span className="stat-value">{metaphors.length}</span>
          </div>
        </div>
        {!readonly && (
          <div className="metaphors-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
            >
              <FaPlus /> Add Metaphor
            </button>
            <button 
              className="btn btn-secondary"
              disabled
              title="AI analysis coming soon"
            >
              <FaCog /> Analyze Metaphors
            </button>
          </div>
        )}
      </div>

      <div className="metaphors-list">
        {metaphors.map(metaphor => (
          <div key={metaphor.id} className="metaphor-card">
            <div className="metaphor-header">
              <h3>{metaphor.title}</h3>
              {!readonly && (
                <button 
                  className="btn-icon btn-danger"
                  onClick={() => handleDelete(metaphor.id)}
                  title="Delete metaphor"
                >
                  <FaTrash />
                </button>
              )}
            </div>
            {metaphor.description && (
              <p className="metaphor-description">{metaphor.description}</p>
            )}
            {metaphor.comparison && (
              <div className="metaphor-comparison">
                <strong>Comparison:</strong> {metaphor.comparison}
              </div>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="metaphor-card metaphor-add-form">
            <h3>Add New Metaphor</h3>
            
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={newMetaphor.title}
                onChange={(e) => setNewMetaphor(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Metaphor title..."
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newMetaphor.description}
                onChange={(e) => setNewMetaphor(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this metaphor..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={!newMetaphor.title.trim()}
              >
                <FaCog /> Add Metaphor
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setIsAdding(false);
                  setNewMetaphor({ title: '', description: '' });
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

export default MetaphorsManager;
