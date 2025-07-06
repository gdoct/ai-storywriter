import { Button, Card } from '@drdata/ai-styles';
import React from 'react';
import { Link } from 'react-router-dom';

const CTASection: React.FC = () => {
  return (
    <section style={{ 
      padding: 'var(--spacing-5xl) var(--spacing-xl)',
      background: 'var(--color-primary-50)'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto'
      }}>
        <Card style={{ 
          textAlign: 'center',
          background: 'var(--color-surface)',
          padding: 'var(--spacing-4xl)'
        }}>
          <h2 style={{ 
            fontSize: 'var(--font-size-3xl)', 
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            Start Writing Today - It's Free!
          </h2>
          <p style={{ 
            fontSize: 'var(--font-size-lg)', 
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-2xl)',
            lineHeight: '1.6'
          }}>
            Join thousands of writers using AI to enhance their creativity. 
            No credit card required to get started.
          </p>
          <div style={{ 
            display: 'flex', 
            gap: 'var(--spacing-md)', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <Link to="/signup">
              <Button>
                Create Free Account
              </Button>
            </Link>
            <Link to="/features">
              <Button>
                Learn More
              </Button>
            </Link>
          </div>
          <p style={{ 
            fontSize: 'var(--font-size-sm)', 
            color: 'var(--color-text-secondary)'
          }}>
            🔒 Free forever • No hidden fees • Cancel anytime
          </p>
        </Card>
      </div>
    </section>
  );
};

export default CTASection;
