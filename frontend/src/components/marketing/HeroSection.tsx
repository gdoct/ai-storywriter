import { Button } from '@drdata/ai-styles';
import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection: React.FC = () => {
  return (
    <div style={{
      padding: 'var(--spacing-5xl) var(--spacing-xl)',
      textAlign: 'center',
      background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: 'var(--font-size-4xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-lg)',
          lineHeight: '1.2'
        }}>
          Transform Your Ideas into Compelling Stories
        </h1>
        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-2xl)',
          maxWidth: '600px',
          margin: '0 auto var(--spacing-2xl) auto'
        }}>
          AI-powered narrative generation for writers. Create engaging stories from simple prompts with multiple AI backends.
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <Link to="/signup">
            <Button>
              Get Started Free
            </Button>
          </Link>
          <Link to="/features">
            <Button>
              See Demo
            </Button>
          </Link>
        </div>
        <div style={{ 
          background: 'var(--color-surface)', 
          padding: 'var(--spacing-lg)', 
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <div style={{ 
            color: 'var(--color-text-secondary)',
            fontFamily: 'monospace',
            fontSize: 'var(--font-size-sm)'
          }}>
            🤖 Writing your story...
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
