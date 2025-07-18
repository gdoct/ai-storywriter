import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="quick-actions">
      <div className="quick-actions-grid">
        <button
          className="quick-action-card"
          onClick={() => navigate('/marketplace/browse?section=top-rated')}
        >
          <div className="quick-action-icon">⭐</div>
          <div className="quick-action-content">
            <h3>Top Rated</h3>
            <p>Best stories by rating</p>
          </div>
        </button>
        <button
          className="quick-action-card"
          onClick={() => navigate('/marketplace/browse?section=most-popular')}
        >
          <div className="quick-action-icon">🔥</div>
          <div className="quick-action-content">
            <h3>Most Popular</h3>
            <p>Most downloaded stories</p>
          </div>
        </button>
        <button
          className="quick-action-card"
          onClick={() => navigate('/marketplace/browse?section=latest')}
        >
          <div className="quick-action-icon">🆕</div>
          <div className="quick-action-content">
            <h3>Latest Stories</h3>
            <p>Recently published</p>
          </div>
        </button>
        <button
          className="quick-action-card"
          onClick={() => navigate('/stories')}
        >
          <div className="quick-action-icon">📝</div>
          <div className="quick-action-content">
            <h3>Publish Story</h3>
            <p>Share your own stories</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
