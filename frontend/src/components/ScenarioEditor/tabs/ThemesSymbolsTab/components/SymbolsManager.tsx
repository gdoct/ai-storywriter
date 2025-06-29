import React, { useCallback, useState } from 'react';
import { FaCog, FaEye, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';
import { Symbol } from '../types/themesSymbols';

type SymbolType = 'object' | 'color' | 'animal' | 'nature' | 'action' | 'concept' | 'other';
type SymbolFrequency = 'recurring' | 'bookend' | 'climactic' | 'subtle';

interface SymbolsManagerProps {
  symbols: Symbol[];
  onSymbolsChange: (symbols: Symbol[]) => void;
  readonly?: boolean;
}

const SymbolsManager: React.FC<SymbolsManagerProps> = ({
  symbols,
  onSymbolsChange,
  readonly = false
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Symbol>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState<Partial<Symbol>>({
    name: '',
    description: '',
    type: 'object',
    meaning: '',
    culturalContext: '',
    appearances: [],
    evolution: '',
    characters: [],
    locations: [],
    frequency: 'recurring',
    tags: []
  });

  const handleStartEdit = useCallback((symbol: Symbol) => {
    setEditingId(symbol.id);
    setEditForm(symbol);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({});
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId || !editForm.name?.trim()) return;

    const updatedSymbols = symbols.map(symbol =>
      symbol.id === editingId
        ? { ...symbol, ...editForm, name: editForm.name!.trim() }
        : symbol
    );

    onSymbolsChange(updatedSymbols);
    setEditingId(null);
    setEditForm({});
  }, [editingId, editForm, symbols, onSymbolsChange]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this symbol?')) {
      const updatedSymbols = symbols.filter(symbol => symbol.id !== id);
      onSymbolsChange(updatedSymbols);
    }
  }, [symbols, onSymbolsChange]);

  const handleStartAdd = useCallback(() => {
    setIsAdding(true);
    setNewSymbol({
      name: '',
      description: '',
      type: 'object',
      meaning: '',
      culturalContext: '',
      appearances: [],
      evolution: '',
      characters: [],
      locations: [],
      frequency: 'recurring',
      tags: []
    });
  }, []);

  const handleCancelAdd = useCallback(() => {
    setIsAdding(false);
    setNewSymbol({
      name: '',
      description: '',
      type: 'object',
      meaning: '',
      culturalContext: '',
      appearances: [],
      evolution: '',
      characters: [],
      locations: [],
      frequency: 'recurring',
      tags: []
    });
  }, []);

  const handleSaveAdd = useCallback(() => {
    if (!newSymbol.name?.trim()) return;

    const symbol: Symbol = {
      id: `symbol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newSymbol.name!.trim(),
      description: newSymbol.description || '',
      type: newSymbol.type || 'object',
      meaning: newSymbol.meaning || '',
      culturalContext: newSymbol.culturalContext || '',
      appearances: newSymbol.appearances || [],
      evolution: newSymbol.evolution || '',
      characters: newSymbol.characters || [],
      locations: newSymbol.locations || [],
      frequency: newSymbol.frequency || 'recurring',
      photoUrl: newSymbol.photoUrl,
      tags: newSymbol.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSymbolsChange([...symbols, symbol]);
    setIsAdding(false);
    setNewSymbol({
      name: '',
      description: '',
      type: 'object',
      meaning: '',
      culturalContext: '',
      appearances: [],
      evolution: '',
      characters: [],
      locations: [],
      frequency: 'recurring',
      tags: []
    });
  }, [newSymbol, symbols, onSymbolsChange]);

  const handleArrayFieldChange = useCallback((
    field: 'characters' | 'locations' | 'tags',
    value: string,
    isEditing: boolean = false
  ) => {
    const items = value.split('\n').map(item => item.trim()).filter(item => item);
    
    if (isEditing) {
      setEditForm(prev => ({ ...prev, [field]: items }));
    } else {
      setNewSymbol(prev => ({ ...prev, [field]: items }));
    }
  }, []);

  const typeOptions: { value: SymbolType; label: string }[] = [
    { value: 'object', label: 'Object' },
    { value: 'color', label: 'Color' },
    { value: 'animal', label: 'Animal' },
    { value: 'nature', label: 'Nature' },
    { value: 'action', label: 'Action' },
    { value: 'concept', label: 'Concept' },
    { value: 'other', label: 'Other' }
  ];

  const frequencyOptions: { value: SymbolFrequency; label: string }[] = [
    { value: 'recurring', label: 'Recurring' },
    { value: 'bookend', label: 'Bookend' },
    { value: 'climactic', label: 'Climactic' },
    { value: 'subtle', label: 'Subtle' }
  ];

  const getTypeColor = (type: SymbolType) => {
    const colors = {
      object: '#3498db',
      color: '#e74c3c',
      animal: '#2ecc71',
      nature: '#27ae60',
      action: '#f39c12',
      concept: '#9b59b6',
      other: '#95a5a6'
    };
    return colors[type] || '#95a5a6';
  };

  const getFrequencyColor = (frequency: SymbolFrequency) => {
    switch (frequency) {
      case 'recurring': return '#e74c3c';
      case 'bookend': return '#f39c12';
      case 'climactic': return '#e67e22';
      case 'subtle': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  if (symbols.length === 0 && !isAdding) {
    return (
      <div className="empty-state">
        <FaEye className="empty-icon" />
        <h3>No Symbols Yet</h3>
        <p>Symbols are objects, images, or concepts that represent deeper meanings in your story.</p>
        {!readonly && (
          <button 
            className="btn btn-primary"
            onClick={handleStartAdd}
          >
            <FaPlus /> Add First Symbol
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="symbols-manager">
      <div className="symbols-header">
        <div className="symbols-stats">
          <div className="stat-item">
            <span className="stat-label">Total Symbols:</span>
            <span className="stat-value">{symbols.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Recurring:</span>
            <span className="stat-value">
              {symbols.filter(s => s.frequency === 'recurring').length}
            </span>
          </div>
        </div>
        {!readonly && (
          <div className="symbols-actions">
            <button 
              className="btn btn-primary"
              onClick={handleStartAdd}
              disabled={isAdding}
            >
              <FaPlus /> Add Symbol
            </button>
            <button 
              className="btn btn-secondary"
              disabled
              title="AI analysis coming soon"
            >
              <FaCog /> Analyze Symbols
            </button>
          </div>
        )}
      </div>

      <div className="symbols-list">
        {symbols.map(symbol => (
          <div key={symbol.id} className="symbol-card">
            {editingId === symbol.id ? (
              <div className="symbol-edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Symbol name..."
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={editForm.type || 'object'}
                      onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as SymbolType }))}
                    >
                      {typeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Frequency</label>
                    <select
                      value={editForm.frequency || 'recurring'}
                      onChange={(e) => setEditForm(prev => ({ ...prev, frequency: e.target.value as SymbolFrequency }))}
                    >
                      {frequencyOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the symbol..."
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Meaning</label>
                  <textarea
                    value={editForm.meaning || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, meaning: e.target.value }))}
                    placeholder="What does this symbol represent or mean?"
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Cultural Context</label>
                  <textarea
                    value={editForm.culturalContext || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, culturalContext: e.target.value }))}
                    placeholder="Cultural or historical significance..."
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Evolution</label>
                  <textarea
                    value={editForm.evolution || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, evolution: e.target.value }))}
                    placeholder="How does the symbol's meaning change throughout the story?"
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Associated Characters (one per line)</label>
                  <textarea
                    value={(editForm.characters || []).join('\n')}
                    onChange={(e) => handleArrayFieldChange('characters', e.target.value, true)}
                    placeholder="Characters associated with this symbol..."
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Locations (one per line)</label>
                  <textarea
                    value={(editForm.locations || []).join('\n')}
                    onChange={(e) => handleArrayFieldChange('locations', e.target.value, true)}
                    placeholder="Where this symbol appears..."
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Tags (one per line)</label>
                  <textarea
                    value={(editForm.tags || []).join('\n')}
                    onChange={(e) => handleArrayFieldChange('tags', e.target.value, true)}
                    placeholder="Tags for categorization..."
                    rows={2}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={handleSaveEdit}
                    disabled={!editForm.name?.trim()}
                  >
                    <FaCog /> Save
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="symbol-view">
                <div className="symbol-header">
                  <div className="symbol-title">
                    <h3>{symbol.name}</h3>
                    <div className="symbol-badges">
                      <span 
                        className="badge type-badge"
                        style={{ backgroundColor: getTypeColor(symbol.type) }}
                      >
                        {symbol.type}
                      </span>
                      <span 
                        className="badge frequency-badge"
                        style={{ backgroundColor: getFrequencyColor(symbol.frequency) }}
                      >
                        {symbol.frequency}
                      </span>
                    </div>
                  </div>
                  {!readonly && (
                    <div className="symbol-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => handleStartEdit(symbol)}
                        title="Edit symbol"
                      >
                        <FaCog />
                      </button>
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => handleDelete(symbol.id)}
                        title="Delete symbol"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>

                {symbol.description && (
                  <div className="symbol-description">
                    <p>{symbol.description}</p>
                  </div>
                )}

                {symbol.meaning && (
                  <div className="symbol-meaning">
                    <strong>Meaning:</strong>
                    <p className="meaning-text">{symbol.meaning}</p>
                  </div>
                )}

                <div className="symbol-details">
                  {symbol.culturalContext && (
                    <div className="symbol-detail">
                      <strong>Cultural Context:</strong>
                      <p>{symbol.culturalContext}</p>
                    </div>
                  )}

                  {symbol.evolution && (
                    <div className="symbol-detail">
                      <strong>Evolution:</strong>
                      <p>{symbol.evolution}</p>
                    </div>
                  )}

                  {symbol.characters && symbol.characters.length > 0 && (
                    <div className="symbol-detail">
                      <strong>Associated Characters:</strong>
                      <div className="related-tags">
                        {symbol.characters.map((character, index) => (
                          <span key={index} className="tag character-tag">{character}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {symbol.locations && symbol.locations.length > 0 && (
                    <div className="symbol-detail">
                      <strong>Locations:</strong>
                      <div className="related-tags">
                        {symbol.locations.map((location, index) => (
                          <span key={index} className="tag location-tag">{location}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {symbol.tags && symbol.tags.length > 0 && (
                    <div className="symbol-detail">
                      <strong>Tags:</strong>
                      <div className="related-tags">
                        {symbol.tags.map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="symbol-card symbol-add-form">
            <h3>Add New Symbol</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newSymbol.name || ''}
                  onChange={(e) => setNewSymbol(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Symbol name..."
                  autoFocus
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select
                  value={newSymbol.type || 'object'}
                  onChange={(e) => setNewSymbol(prev => ({ ...prev, type: e.target.value as SymbolType }))}
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Frequency</label>
                <select
                  value={newSymbol.frequency || 'recurring'}
                  onChange={(e) => setNewSymbol(prev => ({ ...prev, frequency: e.target.value as SymbolFrequency }))}
                >
                  {frequencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newSymbol.description || ''}
                onChange={(e) => setNewSymbol(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the symbol..."
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Meaning</label>
              <textarea
                value={newSymbol.meaning || ''}
                onChange={(e) => setNewSymbol(prev => ({ ...prev, meaning: e.target.value }))}
                placeholder="What does this symbol represent or mean?"
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Cultural Context</label>
              <textarea
                value={newSymbol.culturalContext || ''}
                onChange={(e) => setNewSymbol(prev => ({ ...prev, culturalContext: e.target.value }))}
                placeholder="Cultural or historical significance..."
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Evolution</label>
              <textarea
                value={newSymbol.evolution || ''}
                onChange={(e) => setNewSymbol(prev => ({ ...prev, evolution: e.target.value }))}
                placeholder="How does the symbol's meaning change throughout the story?"
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Associated Characters (one per line)</label>
              <textarea
                value={(newSymbol.characters || []).join('\n')}
                onChange={(e) => handleArrayFieldChange('characters', e.target.value)}
                placeholder="Characters associated with this symbol..."
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Locations (one per line)</label>
              <textarea
                value={(newSymbol.locations || []).join('\n')}
                onChange={(e) => handleArrayFieldChange('locations', e.target.value)}
                placeholder="Where this symbol appears..."
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Tags (one per line)</label>
              <textarea
                value={(newSymbol.tags || []).join('\n')}
                onChange={(e) => handleArrayFieldChange('tags', e.target.value)}
                placeholder="Tags for categorization..."
                rows={2}
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={handleSaveAdd}
                disabled={!newSymbol.name?.trim()}
              >
                <FaCog /> Add Symbol
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleCancelAdd}
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

export default SymbolsManager;
