import { Button } from '@drdata/ai-styles';
import React from 'react';
import { Link } from 'react-router-dom';

const AnonymousNav: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-md)'
    }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-lg)'
      }}>
        <Link 
          to="/marketplace" 
          style={{
            textDecoration: 'none',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-sm)',
            transition: 'color 0.2s ease'
          }}
          data-test-id="nav-marketplace"
        >
          Marketplace
        </Link>
        <Link 
          to="/features" 
          style={{
            textDecoration: 'none',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-sm)',
            transition: 'color 0.2s ease'
          }}
          data-test-id="nav-features"
        >
          Features
        </Link>
        <Link 
          to="/pricing" 
          style={{
            textDecoration: 'none',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-sm)',
            transition: 'color 0.2s ease'
          }}
          data-test-id="nav-pricing"
        >
          Pricing
        </Link>
        <Button 
          as={Link} 
          to="/login" 
          variant="secondary" 
          size="sm"
          data-test-id="nav-login"
        >
          Login
        </Button>
        <Button 
          as={Link} 
          to="/signup" 
          variant="primary" 
          size="sm"
          data-test-id="nav-signup"
        >
          Sign Up
        </Button>
      </nav>
    </div>
  );
};

export default AnonymousNav;
