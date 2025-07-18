import { MarketStoriesResponse, MarketStory, MarketplaceFilters } from "../types/marketplace";
import axios from "./http";

interface CreditsResponse {
    credits: number;
    cached: boolean;
}

/**export interface MarketStory {
  id: number;
  title: string;
  author: string;
  author_id: string;
  content?: string; <-- KEEP EMPTY FOR NOW
  ai_summary: string;
  ai_genres: string[];
  average_rating: number;
  rating_count: number;
  total_downloads: number;
  total_donated_credits: number;
  published_at: string;
  is_staff_pick: boolean;
  user_rating?: number; // User's own rating if authenticated
} */

  
export async function getStaffPicks(count: number): Promise<Array<MarketStory>> {
    try {
        const response = await axios.get(`/api/marketplace/sections/staff-picks?limit=${count}`);
        return response.data.stories;
    } catch (error) {
        console.error('Error fetching staff picks:', error);
        throw error;
    }
}

// also implement these functions:
export async function getMarketStory(storyId: number): Promise<MarketStory | null> {
    try {
        const response = await axios.get(`/api/marketplace/market-stories/${storyId}`);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null;
        }
        console.error('Error fetching market story:', error);
        throw error;
    }
}
export async function downloadStory(storyId: number): Promise<void> {
    try {
        await axios.post(`/api/marketplace/market-stories/${storyId}/download`);
        console.log(`Downloaded story with ID: ${storyId}`);
    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new Error("Story not found");
        }
        console.error('Error downloading story:', error);
        throw error;
    }
}

export async function rateStory(
    storyId: number,
    rating: number
): Promise<{ average_rating: number; rating_count: number }> {
    try {
        const response = await axios.post(`/api/marketplace/market-stories/${storyId}/rate`, {
            rating
        });
        return {
            average_rating: response.data.average_rating,
            rating_count: response.data.rating_count
        };
    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new Error("Story not found");
        } else if (error.response?.status === 400) {
            throw new Error(error.response.data?.error || "Invalid rating");
        }
        console.error('Error rating story:', error);
        throw error;
    }
}

export async function donateCredits(storyId: number, donationAmount: number): Promise<{ message: string }> {
    try {
        const response = await axios.post(`/api/marketplace/market-stories/${storyId}/donate`, {
            credits: donationAmount
        });
        return { message: response.data.message || 'Thank you for your donation!' };
    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new Error("Story not found");
        } else if (error.response?.status === 400) {
            throw new Error(error.response.data?.error || "Invalid donation amount");
        }
        console.error('Error donating credits:', error);
        throw error;
    }
}

export async function getTopRated(count: number): Promise<Array<MarketStory>> {
    try {
        const response = await axios.get(`/api/marketplace/sections/top-rated?limit=${count}`);
        return response.data.stories;
    } catch (error) {
        console.error('Error fetching top rated stories:', error);
        throw error;
    }
}
export async function getMostPopular(count: number): Promise<Array<MarketStory>> {
    try {
        const response = await axios.get(`/api/marketplace/sections/most-popular?limit=${count}`);
        return response.data.stories;
    } catch (error) {
        console.error('Error fetching most popular stories:', error);
        throw error;
    }
}
export async function getLatest(count: number): Promise<Array<MarketStory>> {
    try {
        const response = await axios.get(`/api/marketplace/sections/latest?limit=${count}`);
        return response.data.stories;
    } catch (error) {
        console.error('Error fetching latest stories:', error);
        throw error;
    }
}
export async function getByGenre(genre: string, count: number): Promise<Array<MarketStory>> {
    try {
        const response = await axios.get(`/api/marketplace/sections/genre/${encodeURIComponent(genre)}?limit=${count}`);
        return response.data.stories;
    } catch (error) {
        console.error('Error fetching stories by genre:', error);
        throw error;
    }
}

export async function getAvailableGenres(): Promise<Array<{name: string, count: number}>> {
    try {
        const response = await axios.get('/api/marketplace/genres');
        return response.data.genres;
    } catch (error) {
        console.error('Error fetching available genres:', error);
        throw error;
    }
}

export async function publishStory(storyId: number, {
        title,
        allow_ai,
        terms_accepted
      }: {
        title: string;
        allow_ai: boolean;
        terms_accepted: boolean;
      }): Promise<void> {
    try {
        const response = await axios.post(`/api/marketplace/publish/${storyId}`, {
            title,
            allow_ai,
            terms_accepted
        });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new Error("Story not found or access denied");
        } else if (error.response?.status === 409) {
            throw new Error("Story is already published to marketplace");
        } else if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        } else {
            throw new Error("Failed to publish story");
        }
    }
}

/**
 * Get the current user's credit balance
 */
export async function getUserCredits(): Promise<CreditsResponse> {
    try {
        const response = await axios.get('/api/marketplace/user/credits');
        return response.data;
    } catch (error) {
        console.error('Error fetching user credits:', error);
        throw error;
    }
}

/**
 * Clear the user's credits cache (useful after transactions)
 */
export async function clearCreditsCache(): Promise<void> {
    try {
        await axios.post('/api/marketplace/user/credits/clear-cache');
    } catch (error) {
        console.error('Error clearing credits cache:', error);
        throw error;
    }
}

/**
 * Get marketplace stories with filtering, sorting, and pagination
 */
export async function getMarketStories(
    page: number = 1,
    perPage: number = 20,
    filters: MarketplaceFilters = {}
): Promise<MarketStoriesResponse> {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
            ...Object.fromEntries(
                Object.entries(filters).filter(([_, value]) => value !== undefined && value !== "")
            )
        });

        const response = await axios.get(`/api/marketplace/market-stories?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching marketplace stories:', error);
        throw error;
    }
}
