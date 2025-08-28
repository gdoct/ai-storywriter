import React, { useState } from 'react';
import { publishStory } from '../../../shared/services/marketPlaceApi';
import './PublishStoryModal.css';

interface PublishStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: number;
  storyTitle: string;
  onSuccess: () => void;
}

const PublishStoryModal: React.FC<PublishStoryModalProps> = ({
  isOpen,
  onClose,
  storyId,
  storyTitle,
  onSuccess
}) => {
  const [title, setTitle] = useState(storyTitle);
  const [allowAI, setAllowAI] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!termsAccepted) {
      setError('You must accept the terms and conditions');
      return;
    }
    
    try {
      setIsPublishing(true);
      setError(null);
      
      await publishStory(storyId, {
        title: title.trim(),
        allow_ai: allowAI,
        terms_accepted: termsAccepted
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to publish story');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    if (!isPublishing) {
      onClose();
      setError(null);
      setTitle(storyTitle);
      setAllowAI(true);
      setTermsAccepted(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="publish-modal">
        <div className="modal-header">
          <h2>Publish Your Story to the Marketplace</h2>
          <button onClick={handleClose} className="close-button" disabled={isPublishing}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="publish-form">
          <div className="form-group">
            <label htmlFor="story-title">Title *</label>
            <input
              id="story-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter story title"
              required
              disabled={isPublishing}
              className="title-input"
            />
          </div>

          <div className="form-group">
            <label>Author</label>
            <input
              type="text"
              value={localStorage.getItem('username') || 'Your Username'}
              disabled
              className="author-input"
            />
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={allowAI}
                  onChange={(e) => setAllowAI(e.target.checked)}
                  disabled={isPublishing}
                />
                <span className="checkmark"></span>
                Allow AI to generate summary and genre tags
              </label>
              <p className="checkbox-description">
                Our AI will analyze your story and create an engaging summary and appropriate genre tags to help readers discover your work.
              </p>
            </div>
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <label className="checkbox-label required">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={isPublishing}
                  required
                />
                <span className="checkmark"></span>
                I confirm I own the rights to this story and agree to the marketplace publishing terms
              </label>
              <p className="checkbox-description">
                By checking this box, you confirm that you have the legal right to publish this story and agree to our marketplace terms of service.
              </p>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="cancel-button"
              disabled={isPublishing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="publish-button"
              data-testid="publish-story-button"
              disabled={isPublishing || !title.trim() || !termsAccepted}
            >
              {isPublishing ? 'Publishing...' : 'Publish Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublishStoryModal;
