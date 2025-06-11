import React from 'react';
import './FeaturesSection.css';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Story Generation',
      description: 'Generate compelling narratives from simple prompts using advanced AI models.'
    },
    {
      icon: '📝',
      title: 'Scenario Management',
      description: 'Create and manage complex story scenarios with detailed character development.'
    },
    {
      icon: '⚡',
      title: 'Multiple AI Backends',
      description: 'Integrate with LM Studio, Ollama, OpenAI, and other AI providers seamlessly.'
    },
    {
      icon: '💾',
      title: 'Story Persistence',
      description: 'Save, version, and manage your stories with powerful organization tools.'
    },
    {
      icon: '🎛️',
      title: 'Advanced Controls',
      description: 'Fine-tune generation with temperature, seed, and model selection controls.'
    },
    {
      icon: '🔒',
      title: 'Privacy Focused',
      description: 'Your stories remain private. Use your own API keys for full control.'
    }
  ];

  return (
    <section className="features-section">
      <div className="features-container">
        <div className="features-header">
          <h2>Powerful Features for Creative Writers</h2>
          <p>Everything you need to craft compelling stories with AI assistance</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
