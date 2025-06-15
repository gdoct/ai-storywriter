import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StoryCard from '../components/StoryCard';
import { getByGenre, getLatest, getMostPopular, getStaffPicks, getTopRated } from '../services/marketPlaceApi';
import { MarketStoryCard } from '../types/marketplace';
import './Marketplace.css';

interface SectionData {
  title: string;
  stories: MarketStoryCard[];
  loading: boolean;
  error: string | null;
}

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sections, setSections] = useState<Record<string, SectionData>>({
    staffPicks: { title: 'Staff Picks', stories: [], loading: true, error: null },
    topRated: { title: 'Top Rated', stories: [], loading: true, error: null },
    mostPopular: { title: 'Most Popular', stories: [], loading: true, error: null },
    latest: { title: 'Latest Stories', stories: [], loading: true, error: null },
    fantasy: { title: 'Fantasy', stories: [], loading: true, error: null },
    sciFi: { title: 'Science Fiction', stories: [], loading: true, error: null },
    romance: { title: 'Romance', stories: [], loading: true, error: null },
  });

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    const sectionLoaders = [
      { key: 'staffPicks', loader: () => getStaffPicks(6) },
      { key: 'topRated', loader: () => getTopRated(6) },
      { key: 'mostPopular', loader: () => getMostPopular(6) },
      { key: 'latest', loader: () => getLatest(6) },
      { key: 'fantasy', loader: () => getByGenre('Fantasy', 6) },
      { key: 'sciFi', loader: () => getByGenre('Science Fiction', 6) },
      { key: 'romance', loader: () => getByGenre('Romance', 6) },
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
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleStoryClick = (storyId: number) => {
    navigate(`/marketplace/story/${storyId}`);
  };

  const handleViewMore = (sectionKey: string) => {
    const sectionTitles: Record<string, string> = {
      topRated: 'top-rated',
      mostPopular: 'most-popular',
      latest: 'latest',
      fantasy: 'genre/Fantasy',
      sciFi: 'genre/Science Fiction',
      romance: 'genre/Romance'
    };
    
    if (sectionKey === 'staffPicks') {
      navigate('/marketplace/browse?staff_picks=true');
    } else {
      navigate(`/marketplace/browse?section=${sectionTitles[sectionKey]}`);
    }
  };

  const renderSection = (sectionKey: string) => {
    const section = sections[sectionKey];
    
    if (section.loading) {
      return (
        <div className="section-loading">
          <div className="loading-spinner"></div>
          <span>Loading {section.title.toLowerCase()}...</span>
        </div>
      );
    }

    if (section.error) {
      return (
        <div className="section-error">
          <p>Failed to load {section.title.toLowerCase()}</p>
          <button onClick={loadSections} className="retry-button">Retry</button>
        </div>
      );
    }

    if (section.stories.length === 0) {
      return (
        <div className="section-empty">
          <p>No stories available in {section.title.toLowerCase()}</p>
        </div>
      );
    }

    return (
      <div className="stories-carousel">
        {section.stories.map(story => (
          <StoryCard
            key={story.id}
            story={story}
            onClick={handleStoryClick}
            compact
          />
        ))}
      </div>
    );
  };

  return (
    <div className="marketplace">
      <div className="marketplace-container">
        {/* Header section similar to dashboard */}
        <div className="marketplace-header">
          <div className="marketplace-welcome-section">
            <h1>Story Marketplace</h1>
            <p>Discover amazing stories from our community of writers</p>
          </div>
          <div className="header-actions">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-button">
                  🔍
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="marketplace-content">
          {/* Quick Access Badges */}
          <div className="quick-actions">
            <div className="quick-actions-grid">
              <button
                className="quick-action-card"
                onClick={() => navigate('/marketplace/browse?sort_by=rating&sort_order=desc')}
              >
                <div className="quick-action-icon">⭐</div>
                <div className="quick-action-content">
                  <h3>Top Rated</h3>
                  <p>Best stories by rating</p>
                </div>
              </button>
              <button
                className="quick-action-card"
                onClick={() => navigate('/marketplace/browse?sort_by=downloads&sort_order=desc')}
              >
                <div className="quick-action-icon">🔥</div>
                <div className="quick-action-content">
                  <h3>Most Popular</h3>
                  <p>Most downloaded stories</p>
                </div>
              </button>
              <button
                className="quick-action-card"
                onClick={() => navigate('/marketplace/browse?sort_by=published_at&sort_order=desc')}
              >
                <div className="quick-action-icon">🆕</div>
                <div className="quick-action-content">
                  <h3>Latest Stories</h3>
                  <p>Recently published</p>
                </div>
              </button>
              <button
                className="quick-action-card"
                onClick={() => navigate('/stories')}
              >
                <div className="quick-action-icon">📝</div>
                <div className="quick-action-content">
                  <h3>Publish Story</h3>
                  <p>Share your own stories</p>
                </div>
              </button>
            </div>
          </div>

        {/* Staff Picks Section */}
        {sections.staffPicks.stories.length > 0 && (
          <section className="marketplace-section featured">
            <div className="section-header">
              <h2>✨ Staff Picks</h2>
              <button 
                className="view-more-button"
                onClick={() => handleViewMore('staffPicks')}
              >
                View More
              </button>
            </div>
            {renderSection('staffPicks')}
          </section>
        )}

        {/* Top Rated Section */}
        <section className="marketplace-section">
          <div className="section-header">
            <h2>⭐ Top Rated Stories</h2>
            <button 
              className="view-more-button"
              onClick={() => handleViewMore('topRated')}
            >
              View More
            </button>
          </div>
          {renderSection('topRated')}
        </section>

        {/* Most Popular Section */}
        <section className="marketplace-section">
          <div className="section-header">
            <h2>🔥 Most Popular</h2>
            <button 
              className="view-more-button"
              onClick={() => handleViewMore('mostPopular')}
            >
              View More
            </button>
          </div>
          {renderSection('mostPopular')}
        </section>

        {/* Latest Stories Section */}
        <section className="marketplace-section">
          <div className="section-header">
            <h2>🆕 Latest Stories</h2>
            <button 
              className="view-more-button"
              onClick={() => handleViewMore('latest')}
            >
              View More
            </button>
          </div>
          {renderSection('latest')}
        </section>

        {/* Genre Sections */}
        <section className="marketplace-section">
          <div className="section-header">
            <h2>⚔️ Fantasy</h2>
            <button 
              className="view-more-button"
              onClick={() => handleViewMore('fantasy')}
            >
              View More
            </button>
          </div>
          {renderSection('fantasy')}
        </section>

        <section className="marketplace-section">
          <div className="section-header">
            <h2>🚀 Science Fiction</h2>
            <button 
              className="view-more-button"
              onClick={() => handleViewMore('sciFi')}
            >
              View More
            </button>
          </div>
          {renderSection('sciFi')}
        </section>

        <section className="marketplace-section">
          <div className="section-header">
            <h2>💕 Romance</h2>
            <button 
              className="view-more-button"
              onClick={() => handleViewMore('romance')}
            >
              View More
            </button>
          </div>
          {renderSection('romance')}
        </section>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
