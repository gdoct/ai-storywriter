import React from 'react';
import { Link } from 'react-router-dom';
import MarketingFooter from '../../anonymous/components/marketing/MarketingFooter';
import './Templates.css';

const Templates: React.FC = () => {
  const templates = [
    {
      id: 1,
      title: 'Mystery Thriller',
      description: 'Classic detective story with suspense and intrigue',
      category: 'Mystery',
      icon: '🔍',
      prompts: ['Who is the detective?', 'What is the crime?', 'Where does it take place?']
    },
    {
      id: 2,
      title: 'Science Fiction Adventure',
      description: 'Space exploration and futuristic technology',
      category: 'Sci-Fi',
      icon: '🚀',
      prompts: ['What year is it?', 'Which planet or location?', 'What technology exists?']
    },
    {
      id: 3,
      title: 'Fantasy Quest',
      description: 'Magical worlds with heroes and mythical creatures',
      category: 'Fantasy',
      icon: '⚔️',
      prompts: ['Who is the hero?', 'What is their quest?', 'What magical elements exist?']
    },
    {
      id: 4,
      title: 'Romance Drama',
      description: 'Love stories with emotional depth and conflict',
      category: 'Romance',
      icon: '💕',
      prompts: ['Who are the main characters?', 'What brings them together?', 'What keeps them apart?']
    },
    {
      id: 5,
      title: 'Historical Fiction',
      description: 'Stories set in specific historical periods',
      category: 'Historical',
      icon: '🏛️',
      prompts: ['What time period?', 'Which historical events?', 'Who are the characters?']
    },
    {
      id: 6,
      title: 'Horror Suspense',
      description: 'Dark and atmospheric tales of fear',
      category: 'Horror',
      icon: '👻',
      prompts: ['What is the source of horror?', 'Who are the victims?', 'What is the setting?']
    }
  ];

  const categories = ['All', 'Mystery', 'Sci-Fi', 'Fantasy', 'Romance', 'Historical', 'Horror'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  return (
    <div className="templates-page">
      <div className="templates-container">
        <header className="templates-header">
          <div className="header-content">
            <h1>Story Templates</h1>
            <p>Get started with professionally crafted story structures</p>
          </div>
          <Link to="/app" className="btn btn-primary">
            <span className="btn-icon">✏️</span>
            Start From Scratch
          </Link>
        </header>

        <div className="templates-filters">
          <div className="filter-buttons">
            {categories.map(category => (
              <button
                key={category}
                className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="templates-grid">
          {filteredTemplates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <div className="template-icon">{template.icon}</div>
                <div className="template-category">{template.category}</div>
              </div>
              <h3 className="template-title">{template.title}</h3>
              <p className="template-description">{template.description}</p>
              
              <div className="template-prompts">
                <h4>Key Questions:</h4>
                <ul>
                  {template.prompts.map((prompt, index) => (
                    <li key={index}>{prompt}</li>
                  ))}
                </ul>
              </div>

              <div className="template-actions">
                <Link to="/app" className="btn btn-primary btn-full">
                  Use This Template
                </Link>
                <button className="btn btn-secondary btn-full">Preview</button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No templates found</h3>
            <p>Try selecting a different category</p>
          </div>
        )}
      </div>
      <MarketingFooter />
    </div>
  );
};

export default Templates;
