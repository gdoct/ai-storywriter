import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@drdata/docomo';
import CreditsBadge from '../TopBar/CreditsBadge';

interface HeaderSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch?: (e: React.FormEvent) => void;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ searchQuery, setSearchQuery, onSearch }) => {
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(e);
    } else {
      // Fallback behavior
      if (searchQuery.trim()) {
        navigate(`/marketplace/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  return (
    <Card style={{ marginBottom: 'var(--spacing-xl)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--spacing-lg)'
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-sm)'
          }}>
            Story Marketplace
          </h1>
          <p style={{
            fontSize: 'var(--font-size-md)',
            color: 'var(--color-text-secondary)',
            margin: 0
          }}>
            Discover amazing stories from our community of writers
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)'
        }}>
          <CreditsBadge />
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
                minWidth: '250px'
              }}
            />
            <Button type="submit" variant="primary" size="sm">
              🔍
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
};

export default HeaderSection;
