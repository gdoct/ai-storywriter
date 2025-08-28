import React from 'react';
import MarketingFooter from '../components/marketing/MarketingFooter';
import './FeaturesPage.css';

const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Story Generation',
      description: 'Generate compelling narratives from simple prompts using advanced AI models.',
      details: [
        'Support for multiple AI backends (LM Studio, Ollama, OpenAI)',
        'Smart prompt engineering for better story quality',
        'Context-aware narrative generation',
        'Customizable writing styles and tones'
      ]
    },
    {
      icon: '📝',
      title: 'Scenario Management',
      description: 'Create and manage complex story scenarios with detailed character development.',
      details: [
        'Rich scenario editor with character profiles',
        'Plot structure templates and guides',
        'Character relationship mapping',
        'Scene and chapter organization tools'
      ]
    },
    {
      icon: '⚡',
      title: 'Multiple AI Backends',
      description: 'Integrate with LM Studio, Ollama, OpenAI, and other AI providers seamlessly.',
      details: [
        'Local AI model support (LM Studio, Ollama)',
        'Cloud-based API integration (OpenAI, Anthropic)',
        'Automatic failover between providers',
        'Performance optimization and caching'
      ]
    },
    {
      icon: '💾',
      title: 'Story Persistence',
      description: 'Save, version, and manage your stories with powerful organization tools.',
      details: [
        'Automatic story versioning and backups',
        'Advanced search and filtering',
        'Tag-based organization system',
        'Export to multiple formats (PDF, DOCX, TXT)'
      ]
    },
    {
      icon: '🎛️',
      title: 'Advanced Controls',
      description: 'Fine-tune generation with temperature, seed, and model selection controls.',
      details: [
        'Temperature and creativity controls',
        'Reproducible generation with seeds',
        'Model-specific parameter tuning',
        'Real-time generation monitoring'
      ]
    },
    {
      icon: '🔒',
      title: 'Privacy Focused',
      description: 'Your stories remain private. Use your own API keys for full control.',
      details: [
        'Local data storage and processing',
        'Bring-your-own-key (BYOK) support',
        'No data sharing with third parties',
        'End-to-end encryption for cloud storage'
      ]
    }
  ];

  return (
    <div className="features-page">
      <div className="features-page-container">
        <header className="features-header">
          <h1>Powerful Features for Every Writer</h1>
          <p>Discover how StoryWriter's AI-powered tools can enhance your creative writing process</p>
        </header>

        <div className="features-detailed-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-detailed-card">
              <div className="feature-detailed-header">
                <div className="feature-detailed-icon">{feature.icon}</div>
                <div>
                  <h3 className="feature-detailed-title">{feature.title}</h3>
                  <p className="feature-detailed-description">{feature.description}</p>
                </div>
              </div>
              <ul className="feature-details-list">
                {feature.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="feature-detail-item">
                    <span className="check-icon">✓</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="features-cta-section">
          <h2>Ready to Start Writing?</h2>
          <p>Experience the power of AI-assisted storytelling today</p>
          <div className="features-cta-buttons">
            <a href="/signup" className="btn btn-primary btn-large">Get Started Free</a>
            <a href="/pricing" className="btn btn-secondary btn-large">View Pricing</a>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};

export default FeaturesPage;
