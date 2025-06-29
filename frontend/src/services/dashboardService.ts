import axios from 'axios';

// Type definitions
export interface DashboardStats {
  scenariosCreated: number;
  storiesGenerated: number;
  storiesPublished: number;
  scenariosPublished: number;
  modelsUsed: number;
  lastActivity: string | null;
}

export interface RecentScenario {
  id: string;
  title: string;
  created: string;
  generatedStoryCount: number;
  lastModified: string;
}

export interface RecentStory {
  id: number;
  scenarioId: string;
  scenarioTitle: string;
  created: string;
  wordCount: number;
  preview: string;
  isPublished: boolean;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ScenariosResponse {
  scenarios: RecentScenario[];
  pagination: PaginationInfo;
}

export interface StoriesResponse {
  stories: RecentStory[];
  pagination: PaginationInfo;
}

export interface LastActivity {
  lastActivity: string | null;
  activityType: string | null;
  description: string;
}

// API Service functions
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await axios.get('/api/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const fetchRecentScenarios = async (limit = 5, offset = 0): Promise<ScenariosResponse> => {
  try {
    const response = await axios.get('/api/dashboard/recent-scenarios', {
      params: { limit, offset }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent scenarios:', error);
    throw error;
  }
};

export const fetchRecentStories = async (limit = 5, offset = 0): Promise<StoriesResponse> => {
  try {
    const response = await axios.get('/api/dashboard/recent-stories', {
      params: { limit, offset }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent stories:', error);
    throw error;
  }
};

export const fetchLastActivity = async (): Promise<LastActivity> => {
  try {
    const response = await axios.get('/api/dashboard/last-activity');
    return response.data;
  } catch (error) {
    console.error('Error fetching last activity:', error);
    throw error;
  }
};

export const deleteScenario = async (scenarioId: string): Promise<void> => {
  try {
    await axios.delete(`/api/scenario/${scenarioId}`);
  } catch (error) {
    console.error('Error deleting scenario:', error);
    throw error;
  }
};

// Utility function to format dates for display
export const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  
  // Parse the UTC date string properly
  // Backend stores dates in UTC using Python's isoformat() which doesn't include 'Z'
  // We need to ensure we're treating these as UTC dates
  let utcDateString = dateString;
  
  // If the string doesn't have timezone info, treat it as UTC
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    utcDateString = `${dateString}Z`;
  }
  
  const date = new Date(utcDateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString);
    return 'Invalid date';
  }
  
  // Use UTC time for the current time to ensure consistent calculation
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  } else {
    // Format the date in the user's local timezone
    return date.toLocaleDateString();
  }
};
