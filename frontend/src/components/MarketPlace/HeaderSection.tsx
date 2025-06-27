import React from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="marketplace-header">
      <div className="marketplace-welcome-section">
        <h1>Story Marketplace</h1>
        <p>Discover amazing stories from our community of writers</p>
      </div>
      <div className="header-actions">
        <CreditsBadge className="header-badge" />
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
  );
};

export default HeaderSection;
