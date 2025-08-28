import { Button, Card } from '@drdata/ai-styles';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableGenres } from '../../services/marketPlaceApi';

interface HeaderSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch?: (e: React.FormEvent) => void;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ searchQuery, setSearchQuery, onSearch }) => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState<Array<{name: string, count: number}>>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [loadingGenres, setLoadingGenres] = useState(false);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      setLoadingGenres(true);
      const availableGenres = await getAvailableGenres();
      setGenres(availableGenres);
    } catch (error) {
      console.error('Failed to load genres:', error);
    } finally {
      setLoadingGenres(false);
    }
  };

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

  const handleGenreExplore = () => {
    if (selectedGenre) {
      navigate(`/marketplace/browse?section=genre/${encodeURIComponent(selectedGenre)}`);
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
          gap: 'var(--spacing-lg)'
        }}>
          {/* Search Form */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid var(--color-border-primary)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
                minWidth: '250px',
                transition: 'border-color var(--transition-fast)',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-border-focus)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border-primary)';
              }}
            />
            <Button type="submit" variant="primary" size="sm">
              🔍
            </Button>
          </form>

          {/* Genre Explorer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <label style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap'
            }}>
              Explore Genres:
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              disabled={loadingGenres}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid var(--color-border-primary)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
                minWidth: '180px',
                cursor: loadingGenres ? 'wait' : 'pointer'
              }}
            >
              <option value="">
                {loadingGenres ? 'Loading...' : 'Select a genre'}
              </option>
              {genres.map((genre) => (
                <option key={genre.name} value={genre.name}>
                  {genre.name} ({genre.count})
                </option>
              ))}
            </select>
            <Button 
              onClick={handleGenreExplore}
              variant="secondary" 
              size="sm"
              disabled={!selectedGenre || loadingGenres}
            >
              View
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HeaderSection;
