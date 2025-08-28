import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderSection from '../components/MarketPlace/HeaderSection';
import QuickActions from '../components/MarketPlace/QuickActions';
import StorySections from '../components/MarketPlace/StorySections';
import { useAuth } from '../contexts/AuthContext';
import { getByGenre, getLatest, getMostPopular, getStaffPicks, getTopRated, getAvailableGenres } from '../services/marketPlaceApi';
import { MarketStoryCard, Genre } from '../types/marketplace';
import './Marketplace.css';

interface SectionData {
  title: string;
  stories: MarketStoryCard[];
  loading: boolean;
  error: string | null;
}

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [sections, setSections] = useState<Record<string, SectionData>>({
    staffPicks: { title: 'Staff Picks', stories: [], loading: true, error: null },
    topRated: { title: 'Top Rated', stories: [], loading: true, error: null },
    mostPopular: { title: 'Most Popular', stories: [], loading: true, error: null },
    latest: { title: 'Latest Stories', stories: [], loading: true, error: null },
  });

  const loadGenres = async () => {
    try {
      const availableGenres = await getAvailableGenres();
      setGenres(availableGenres);
    } catch (error) {
      console.error('Failed to load genres:', error);
    }
  };

  const loadSections = useCallback(async () => {
    // Initialize genre sections based on fetched genres
    const genreSections: Record<string, SectionData> = {};
    genres.forEach(genre => {
      const genreKey = `genre_${genre.name.replace(/\s+/g, '_').toLowerCase()}`;
      genreSections[genreKey] = {
        title: `${genre.name} (${genre.count})`,
        stories: [],
        loading: true,
        error: null
      };
    });

    // Combine base sections with genre sections
    setSections(prev => ({
      ...prev,
      ...genreSections
    }));

    const sectionLoaders = [
      { key: 'staffPicks', loader: () => getStaffPicks(6) },
      { key: 'topRated', loader: () => getTopRated(6) },
      { key: 'mostPopular', loader: () => getMostPopular(6) },
      { key: 'latest', loader: () => getLatest(6) },
      // Add genre loaders
      ...genres.map(genre => ({
        key: `genre_${genre.name.replace(/\s+/g, '_').toLowerCase()}`,
        loader: () => getByGenre(genre.name, 6)
      }))
    ];

    // Load sections in parallel
    await Promise.allSettled(
      sectionLoaders.map(async ({ key, loader }) => {
        try {
          const response = await loader();
          setSections(prev => ({
            ...prev,
            [key]: { ...prev[key], stories: response, loading: false }
          }));
        } catch (error) {
          setSections(prev => ({
            ...prev,
            [key]: { ...prev[key], loading: false, error: error instanceof Error ? error.message : 'Failed to load' }
          }));
        }
      })
    );
  }, [genres]);

  useEffect(() => {
    loadGenres();
  }, []);

  useEffect(() => {
    if (genres.length > 0) {
      loadSections();
    }
  }, [genres, loadSections]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleViewMore = (sectionKey: string) => {
    const sectionTitles: Record<string, string> = {
      topRated: 'top-rated',
      mostPopular: 'most-popular',
      latest: 'latest',
    };
    
    if (sectionKey === 'staffPicks') {
      navigate('/marketplace/browse?staff_picks=true');
    } else if (sectionKey.startsWith('genre_')) {
      // Extract genre name from the key
      const genreName = sectionKey.replace('genre_', '').replace(/_/g, ' ');
      const originalGenre = genres.find(g => g.name.toLowerCase().replace(/\s+/g, ' ') === genreName);
      if (originalGenre) {
        navigate(`/marketplace/browse?section=genre/${encodeURIComponent(originalGenre.name)}`);
      }
    } else {
      navigate(`/marketplace/browse?section=${sectionTitles[sectionKey]}`);
    }
  };

  const handleModerationAction = (_storyId: number, _action: string) => {
    // Refresh the sections after moderation action
    loadSections();
  };

  return (
    <div className="marketplace">
      <div className="marketplace-container">
        <HeaderSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
        />

        <QuickActions />

        <StorySections
          sections={sections}
          hasRole={hasRole}
          handleModerationAction={handleModerationAction}
          loadSections={loadSections}
          onViewMore={handleViewMore}
        />
      </div>
    </div>
  );
};

export default Marketplace;
