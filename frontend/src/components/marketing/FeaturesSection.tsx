import { Card } from '@drdata/ai-styles';
import React from 'react';

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
    <section style={{ 
      padding: 'var(--spacing-5xl) var(--spacing-xl)', 
      background: 'var(--color-background)' 
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: 'var(--spacing-4xl)' }}>
          <h2 style={{ 
            fontSize: 'var(--font-size-3xl)', 
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)', // Corrected to use design token
            marginBottom: 'var(--spacing-md)'
          }} className="features-header">
            Powerful Features for Creative Writers
          </h2>
          <p style={{ 
            fontSize: 'var(--font-size-lg)', 
            color: 'var(--color-text-secondary)', // Corrected to use design token
            maxWidth: '600px',
            margin: '0 auto'
          }} className="features-description">
            Everything you need to craft compelling stories with AI assistance
          </p>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: 'var(--spacing-xl)',
          textAlign: 'left'
        }}>
          {features.map((feature, index) => (
            <Card key={index} style={{ height: '100%' }} icon={feature.icon} children={<h2>{feature.title}</h2>} footer={feature.description} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
