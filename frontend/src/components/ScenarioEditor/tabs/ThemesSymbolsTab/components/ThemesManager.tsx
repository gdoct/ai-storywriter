import React, { useCallback, useState } from 'react';
import { FaBook, FaCog, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';
import { Theme } from '../types/themesSymbols';

type ThemeType = 'central' | 'secondary' | 'subtle' | 'emerging';

interface ThemesManagerProps {
  themes: Theme[];
  onThemesChange: (themes: Theme[]) => void;
  readonly?: boolean;
}

const ThemesManager: React.FC<ThemesManagerProps> = ({
  themes,
  onThemesChange,
  readonly = false
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Theme>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newTheme, setNewTheme] = useState<Partial<Theme>>({
    title: '',
    description: '',
    type: 'central',
    statement: '',
    questions: [],
    expressions: [],
    characterConnections: [],
    plotConnections: [],
    symbolConnections: [],
    development: '',
    resolution: '',
    examples: [],
    tags: []
  });

  const handleStartEdit = useCallback((theme: Theme) => {
    setEditingId(theme.id);
    setEditForm(theme);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({});
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId || !editForm.title?.trim()) return;

    const updatedThemes = themes.map(theme =>
      theme.id === editingId
        ? { ...theme, ...editForm, title: editForm.title!.trim() }
        : theme
    );

    onThemesChange(updatedThemes);
    setEditingId(null);
    setEditForm({});
  }, [editingId, editForm, themes, onThemesChange]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this theme?')) {
      const updatedThemes = themes.filter(theme => theme.id !== id);
      onThemesChange(updatedThemes);
    }
  }, [themes, onThemesChange]);

  const handleStartAdd = useCallback(() => {
    setIsAdding(true);
    setNewTheme({
      title: '',
      description: '',
      type: 'central',
      statement: '',
      questions: [],
      expressions: [],
      characterConnections: [],
      plotConnections: [],
      symbolConnections: [],
      development: '',
      resolution: '',
      examples: [],
      tags: []
    });
  }, []);

  const handleCancelAdd = useCallback(() => {
    setIsAdding(false);
    setNewTheme({
      title: '',
      description: '',
      type: 'central',
      statement: '',
      questions: [],
      expressions: [],
      characterConnections: [],
      plotConnections: [],
      symbolConnections: [],
      development: '',
      resolution: '',
      examples: [],
      tags: []
    });
  }, []);

  const handleSaveAdd = useCallback(() => {
    if (!newTheme.title?.trim()) return;

    const theme: Theme = {
      id: `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newTheme.title!.trim(),
      description: newTheme.description || '',
      type: newTheme.type || 'central',
      statement: newTheme.statement || '',
      questions: newTheme.questions || [],
      expressions: newTheme.expressions || [],
      characterConnections: newTheme.characterConnections || [],
      plotConnections: newTheme.plotConnections || [],
      symbolConnections: newTheme.symbolConnections || [],
      development: newTheme.development || '',
      resolution: newTheme.resolution || '',
      examples: newTheme.examples || [],
      tags: newTheme.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onThemesChange([...themes, theme]);
    setIsAdding(false);
    setNewTheme({
      title: '',
      description: '',
      type: 'central',
      statement: '',
      questions: [],
      expressions: [],
      characterConnections: [],
      plotConnections: [],
      symbolConnections: [],
      development: '',
      resolution: '',
      examples: [],
      tags: []
    });
  }, [newTheme, themes, onThemesChange]);

  const handleArrayFieldChange = useCallback((
    field: 'examples' | 'questions' | 'tags' | 'characterConnections' | 'plotConnections' | 'symbolConnections',
    value: string,
    isEditing: boolean = false
  ) => {
    const items = value.split('\n').map(item => item.trim()).filter(item => item);
    
    if (isEditing) {
      setEditForm(prev => ({ ...prev, [field]: items }));
    } else {
      setNewTheme(prev => ({ ...prev, [field]: items }));
    }
  }, []);

  const typeOptions: { value: ThemeType; label: string }[] = [
    { value: 'central', label: 'Central' },
    { value: 'secondary', label: 'Secondary' },
    { value: 'subtle', label: 'Subtle' },
    { value: 'emerging', label: 'Emerging' }
  ];

  const getTypeColor = (type: ThemeType) => {
    switch (type) {
      case 'central': return '#e74c3c';
      case 'secondary': return '#f39c12';
      case 'subtle': return '#95a5a6';
      case 'emerging': return '#3498db';
      default: return '#95a5a6';
    }
  };

  if (themes.length === 0 && !isAdding) {
    return (
      <div className="empty-state">
        <FaBook className="empty-icon" />
        <h3>No Themes Yet</h3>
        <p>Themes are the central ideas, messages, or underlying meanings in your story.</p>
        {!readonly && (
          <button 
            className="btn btn-primary"
            onClick={handleStartAdd}
          >
            <FaPlus /> Add First Theme
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="themes-manager">
      <div className="themes-header">
        <div className="themes-stats">
          <div className="stat-item">
            <span className="stat-label">Total Themes:</span>
            <span className="stat-value">{themes.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Central Themes:</span>
            <span className="stat-value">
              {themes.filter(t => t.type === 'central').length}
            </span>
          </div>
        </div>
        {!readonly && (
          <div className="themes-actions">
            <button 
              className="btn btn-primary"
              onClick={handleStartAdd}
              disabled={isAdding}
            >
              <FaPlus /> Add Theme
            </button>
            <button 
              className="btn btn-secondary"
              disabled
              title="AI analysis coming soon"
            >
              <FaCog /> Analyze Themes
            </button>
          </div>
        )}
      </div>

      <div className="themes-list">
        {themes.map(theme => (
          <div key={theme.id} className="theme-card">
            {editingId === theme.id ? (
              <div className="theme-edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Theme title..."
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={editForm.type || 'central'}
                      onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as ThemeType }))}
                    >
                      {typeOptions.map(option => (
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
                    placeholder="Describe this theme and its significance..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Thematic Statement</label>
                  <textarea
                    value={editForm.statement || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, statement: e.target.value }))}
                    placeholder="A clear statement of what the theme represents..."
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Development</label>
                  <textarea
                    value={editForm.development || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, development: e.target.value }))}
                    placeholder="How does this theme develop throughout the story?"
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Resolution</label>
                  <textarea
                    value={editForm.resolution || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, resolution: e.target.value }))}
                    placeholder="How is this theme resolved or concluded?"
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Questions (one per line)</label>
                  <textarea
                    value={(editForm.questions || []).join('\n')}
                    onChange={(e) => handleArrayFieldChange('questions', e.target.value, true)}
                    placeholder="What questions does this theme explore?"
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Examples (one per line)</label>
                  <textarea
                    value={(editForm.examples || []).join('\n')}
                    onChange={(e) => handleArrayFieldChange('examples', e.target.value, true)}
                    placeholder="Specific examples or instances of this theme..."
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
                    disabled={!editForm.title?.trim()}
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
              <div className="theme-view">
                <div className="theme-header">
                  <div className="theme-title">
                    <h3>{theme.title}</h3>
                    <div className="theme-badges">
                      <span 
                        className="badge type-badge"
                        style={{ backgroundColor: getTypeColor(theme.type) }}
                      >
                        {theme.type}
                      </span>
                    </div>
                  </div>
                  {!readonly && (
                    <div className="theme-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => handleStartEdit(theme)}
                        title="Edit theme"
                      >
                        <FaCog />
                      </button>
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => handleDelete(theme.id)}
                        title="Delete theme"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>

                {theme.description && (
                  <div className="theme-description">
                    <p>{theme.description}</p>
                  </div>
                )}

                {theme.statement && (
                  <div className="theme-statement">
                    <strong>Statement:</strong>
                    <p className="statement-text">{theme.statement}</p>
                  </div>
                )}

                <div className="theme-details">
                  {theme.development && (
                    <div className="theme-detail">
                      <strong>Development:</strong>
                      <p>{theme.development}</p>
                    </div>
                  )}

                  {theme.resolution && (
                    <div className="theme-detail">
                      <strong>Resolution:</strong>
                      <p>{theme.resolution}</p>
                    </div>
                  )}

                  {theme.questions && theme.questions.length > 0 && (
                    <div className="theme-detail">
                      <strong>Questions Explored:</strong>
                      <ul>
                        {theme.questions.map((question, index) => (
                          <li key={index}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {theme.examples && theme.examples.length > 0 && (
                    <div className="theme-detail">
                      <strong>Examples:</strong>
                      <ul>
                        {theme.examples.map((example, index) => (
                          <li key={index}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {theme.tags && theme.tags.length > 0 && (
                    <div className="theme-detail">
                      <strong>Tags:</strong>
                      <div className="related-tags">
                        {theme.tags.map((tag, index) => (
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
          <div className="theme-card theme-add-form">
            <h3>Add New Theme</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newTheme.title || ''}
                  onChange={(e) => setNewTheme(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Theme title..."
                  autoFocus
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select
                  value={newTheme.type || 'central'}
                  onChange={(e) => setNewTheme(prev => ({ ...prev, type: e.target.value as ThemeType }))}
                >
                  {typeOptions.map(option => (
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
                value={newTheme.description || ''}
                onChange={(e) => setNewTheme(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this theme and its significance..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Thematic Statement</label>
              <textarea
                value={newTheme.statement || ''}
                onChange={(e) => setNewTheme(prev => ({ ...prev, statement: e.target.value }))}
                placeholder="A clear statement of what the theme represents..."
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Development</label>
              <textarea
                value={newTheme.development || ''}
                onChange={(e) => setNewTheme(prev => ({ ...prev, development: e.target.value }))}
                placeholder="How does this theme develop throughout the story?"
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Resolution</label>
              <textarea
                value={newTheme.resolution || ''}
                onChange={(e) => setNewTheme(prev => ({ ...prev, resolution: e.target.value }))}
                placeholder="How is this theme resolved or concluded?"
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Questions (one per line)</label>
              <textarea
                value={(newTheme.questions || []).join('\n')}
                onChange={(e) => handleArrayFieldChange('questions', e.target.value)}
                placeholder="What questions does this theme explore?"
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Examples (one per line)</label>
              <textarea
                value={(newTheme.examples || []).join('\n')}
                onChange={(e) => handleArrayFieldChange('examples', e.target.value)}
                placeholder="Specific examples or instances of this theme..."
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Tags (one per line)</label>
              <textarea
                value={(newTheme.tags || []).join('\n')}
                onChange={(e) => handleArrayFieldChange('tags', e.target.value)}
                placeholder="Tags for categorization..."
                rows={2}
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={handleSaveAdd}
                disabled={!newTheme.title?.trim()}
              >
                <FaCog /> Add Theme
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

export default ThemesManager;
