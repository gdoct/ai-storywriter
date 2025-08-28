// Marketplace-related TypeScript types

export interface MarketStory {
  id: number;
  title: string;
  author: string;
  author_id: string;
  content?: string;
  ai_summary: string;
  ai_genres: string[];
  average_rating: number;
  rating_count: number;
  total_downloads: number;
  total_donated_credits: number;
  published_at: string;
  is_staff_pick: boolean;
  user_rating?: number; // User's own rating if authenticated
  image_uri?: string; // Add image URI for background
  scenario_json?: string; // Scenario data with characters and settings
}

export interface MarketStoryCard {
  id: number;
  title: string;
  author: string;
  author_id?: string; // Add optional author_id for moderation actions
  ai_summary: string;
  ai_genres: string[];
  average_rating: number;
  rating_count: number;
  total_downloads: number;
  is_staff_pick: boolean;
  image_uri?: string; // Add image URI for background
}

export interface MarketStoriesResponse {
  stories: MarketStoryCard[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
}

export interface PublishStoryData {
  title: string;
  allow_ai: boolean;
  terms_accepted: boolean;
}

export interface RatingData {
  rating: number;
}

export interface DonationData {
  credits: number;
}

export interface MarketplaceFilters {
  search?: string;
  genre?: string;
  min_rating?: number;
  sort_by?: 'published_at' | 'rating' | 'downloads' | 'donations' | 'title';
  sort_order?: 'asc' | 'desc';
}

export interface MarketplaceSectionResponse {
  stories: MarketStoryCard[];
}

export interface Genre {
  name: string;
  count: number;
}
