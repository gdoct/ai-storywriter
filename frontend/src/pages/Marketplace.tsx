import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderSection from '../components/MarketPlace/HeaderSection';
import QuickActions from '../components/MarketPlace/QuickActions';
import StorySections from '../components/MarketPlace/StorySections';
import StoryTooltip from '../components/MarketPlace/StoryTooltip';
import { useAuth } from '../contexts/AuthContext';
import { useAuthenticatedUser } from '../contexts/AuthenticatedUserContext';
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
  const { hasRole } = useAuth();
  const { creditRefreshTrigger } = useAuthenticatedUser(); // Ensure creditRefreshTrigger is of type number
  const [searchQuery, setSearchQuery] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
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
    setSelectedStoryId(storyId);
    setShowTooltip(true);
  };

  const handleCloseTooltip = () => {
    setShowTooltip(false);
    setSelectedStoryId(null);
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

  const handleModerationAction = (storyId: number, action: string) => {
    // Refresh the sections after moderation action
    loadSections();
  };

  return (
    <div className="marketplace">
      <div className="marketplace-container">
        <HeaderSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          creditRefreshTrigger={creditRefreshTrigger}
        />

        <QuickActions />

        <StorySections
          sections={sections}
          hasRole={hasRole}
          handleModerationAction={handleModerationAction}
          loadSections={loadSections}
        />

        <StoryTooltip
          storyId={selectedStoryId}
          showTooltip={showTooltip}
          handleCloseTooltip={handleCloseTooltip}
        />
      </div>
    </div>
  );
};

export default Marketplace;
