import { AiTextArea, AiTextBox, Button } from '@drdata/docomo';
import React, { useState } from 'react';
import { FaBook, FaCog, FaEye, FaTrash, FaUser } from 'react-icons/fa';
import { Chapter } from '../../../../../types/chapters';

interface ChapterCardProps {
  chapter: Chapter;
  index: number;
  viewMode: 'grid' | 'list';
  onUpdate: (updates: Partial<Chapter>) => void;
  onDelete: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  isLoading: boolean;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  index,
  viewMode,
  onUpdate,
  onDelete,
  onReorder,
  isLoading
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chapter.title);
  const [editDescription, setEditDescription] = useState(chapter.description);

  const selectedVersion = chapter.generatedVersions.find(v => v.id === chapter.selectedVersionId);
  const wordCount = selectedVersion?.wordCount || 0;

  const handleSaveEdit = () => {
    onUpdate({
      title: editTitle,
      description: editDescription
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(chapter.title);
    setEditDescription(chapter.description);
    setIsEditing(false);
  };

  const handleStatusChange = (status: Chapter['status']) => {
    onUpdate({ status });
  };

  const getStatusIcon = () => {
    switch (chapter.status) {
      case 'finalized':
        return <FaBook className="chapter-card__status-icon chapter-card__status-icon--finalized" />;
      case 'drafted':
        return <FaCog className="chapter-card__status-icon chapter-card__status-icon--drafted" />;
      case 'planned':
      default:
        return <FaUser className="chapter-card__status-icon chapter-card__status-icon--planned" />;
    }
  };

  const getStatusColor = () => {
    switch (chapter.status) {
      case 'finalized':
        return '#28a745';
      case 'drafted':
        return '#ffc107';
      case 'planned':
      default:
        return '#6c757d';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="chapter-card chapter-card--list">
        <div className="chapter-card__content">
          <div className="chapter-card__header">
            <div className="chapter-card__status">
              {getStatusIcon()}
            </div>
            <div className="chapter-card__title-section">
              {isEditing ? (
                <AiTextBox
                  value={editTitle}
                  onChange={setEditTitle}
                  placeholder="Chapter title"
                  disabled={isLoading}
                />
              ) : (
                <h4 className="chapter-card__title">{chapter.title}</h4>
              )}
            </div>
            <div className="chapter-card__meta">
              <span className="chapter-card__word-count">
                {wordCount.toLocaleString()} / {chapter.wordCountTarget.toLocaleString()} words
              </span>
            </div>
            <div className="chapter-card__actions">
              {isEditing ? (
                <>
                  <Button variant="primary" size="sm" onClick={handleSaveEdit} disabled={isLoading}>
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={isLoading}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditing(true)} 
                    disabled={isLoading}
                    icon={<FaCog />}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onDelete} 
                    disabled={isLoading}
                    icon={<FaTrash />}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
          {isEditing && (
            <div className="chapter-card__description-edit">
              <AiTextArea
                value={editDescription}
                onChange={setEditDescription}
                placeholder="Chapter description"
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chapter-card chapter-card--grid">
      <div className="chapter-card__content">
        <div className="chapter-card__header">
          <div className="chapter-card__status">
            {getStatusIcon()}
          </div>
          <div className="chapter-card__number">#{chapter.number}</div>
        </div>
        
        <div className="chapter-card__body">
          {isEditing ? (
            <>
              <AiTextBox
                value={editTitle}
                onChange={setEditTitle}
                placeholder="Chapter title"
                disabled={isLoading}
              />
              <AiTextArea
                value={editDescription}
                onChange={setEditDescription}
                placeholder="Chapter description"
                disabled={isLoading}
              />
            </>
          ) : (
            <>
              <h4 className="chapter-card__title">{chapter.title}</h4>
              <p className="chapter-card__description">
                {chapter.description || 'No description'}
              </p>
            </>
          )}
        </div>

        <div className="chapter-card__footer">
          <div className="chapter-card__meta">
            <div className="chapter-card__word-count">
              <span>{wordCount.toLocaleString()}</span> / {chapter.wordCountTarget.toLocaleString()}
            </div>
            <div className="chapter-card__status-badge">
              <select
                value={chapter.status}
                onChange={(e) => handleStatusChange(e.target.value as Chapter['status'])}
                disabled={isLoading || isEditing}
                style={{ borderColor: getStatusColor() }}
              >
                <option value="planned">Planned</option>
                <option value="drafted">Drafted</option>
                <option value="finalized">Finalized</option>
              </select>
            </div>
          </div>
          
          <div className="chapter-card__actions">
            {isEditing ? (
              <>
                <Button variant="primary" size="sm" onClick={handleSaveEdit} disabled={isLoading}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={isLoading}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(true)} 
                  disabled={isLoading}
                  icon={<FaCog />}
                >
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={isLoading}
                  icon={<FaEye />}
                  title="View chapter details"
                >
                  View
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onDelete} 
                  disabled={isLoading}
                  icon={<FaTrash />}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterCard;
