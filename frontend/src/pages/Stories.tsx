import React from 'react';
import { Link } from 'react-router-dom';
import './Stories.css';

const Stories: React.FC = () => {
  // This is a placeholder page for the stories collection
  // In the future, this would fetch and display user's stories
  
  const placeholderStories = [
    { id: 1, title: 'The Mysterious Garden', created: '2 days ago', wordCount: 1250, excerpt: 'In a forgotten corner of the estate...' },
    { id: 2, title: 'Space Adventure Chronicles', created: '1 week ago', wordCount: 2340, excerpt: 'Captain Sara looked out at the vast expanse...' },
    { id: 3, title: 'Detective in the Rain', created: '2 weeks ago', wordCount: 890, excerpt: 'The neon lights reflected off the wet pavement...' },
  ];

  return (
    <div className="stories-page">
      <div className="stories-container">
        <header className="stories-header">
          <div className="header-content">
            <h1>Your Stories</h1>
            <p>Manage and organize your creative works</p>
          </div>
          <Link to="/app" className="btn btn-primary">
            <span className="btn-icon">✏️</span>
            New Story
          </Link>
        </header>

        <div className="stories-content">
          <div className="stories-grid">
            {placeholderStories.map(story => (
              <div key={story.id} className="story-card">
                <div className="story-header">
                  <h3 className="story-title">{story.title}</h3>
                  <div className="story-menu">⋮</div>
                </div>
                <p className="story-excerpt">{story.excerpt}</p>
                <div className="story-footer">
                  <div className="story-meta">
                    <span className="story-date">{story.created}</span>
                    <span className="story-separator">•</span>
                    <span className="story-words">{story.wordCount} words</span>
                  </div>
                  <div className="story-actions">
                    <button className="btn btn-text">Edit</button>
                    <button className="btn btn-text">View</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {placeholderStories.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No stories yet</h3>
              <p>Start writing your first story to see it here</p>
              <Link to="/app" className="btn btn-primary">Create Your First Story</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stories;
