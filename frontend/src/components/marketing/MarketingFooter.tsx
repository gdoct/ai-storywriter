import React from 'react';
import { Link } from 'react-router-dom';

const MarketingFooter: React.FC = () => {
  return (
    <footer style={{
      marginTop: 'var(--spacing-5xl)',
      background: 'var(--color-surface)',
      padding: 'var(--spacing-4xl) var(--spacing-xl)',
      borderTop: '1px solid var(--color-border)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-2xl)',
          marginBottom: 'var(--spacing-3xl)'
        }}>
          <div>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-md)'
            }}>
              StoryWriter
            </h3>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
              lineHeight: '1.6'
            }}>
              AI-powered story generation for creative writers
            </p>
          </div>
          
          <div>
            <h4 style={{
              fontSize: 'var(--font-size-md)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-md)'
            }}>
              Product
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <Link to="/features" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Features</Link>
              <Link to="/pricing" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Pricing</Link>
              <Link to="/templates" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Templates</Link>
            </div>
          </div>
          
          <div>
            <h4 style={{
              fontSize: 'var(--font-size-md)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-md)'
            }}>
              Company
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <a href="mailto:support@storywriter.app" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Support</a>
              <a href="mailto:contact@storywriter.app" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Contact</a>
            </div>
          </div>
          
          <div>
            <h4 style={{
              fontSize: 'var(--font-size-md)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-md)'
            }}>
              Legal
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <Link to="/privacy" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Privacy Policy</Link>
              <Link to="/terms" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Terms of Service</Link>
            </div>
          </div>
        </div>
        
        <div style={{
          paddingTop: 'var(--spacing-xl)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-md)'
        }}>
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)'
          }}>
            © 2025 StoryWriter. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <Link to="/privacy" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Privacy</Link>
            <Link to="/terms" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
