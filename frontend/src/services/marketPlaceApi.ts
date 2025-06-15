import { MarketStory } from "../types/marketplace";
import { fakestories } from "./mockedStoryService";
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

  
export function getStaffPicks(count: number): Promise<Array<MarketStory>> {
    // return fake data for now
    return new Promise((resolve) => {
        // pick six random items from the randomstories and return in random order
        const staffPicks = fakestories.sort(() => 0.5 - Math.random()).slice(0, count);
        resolve(staffPicks);
    });
}

// also implement these functions:
export function getMarketStory(storyId: number): Promise<MarketStory | null> {
    return new Promise((resolve) => {
        const story = fakestories.find(s => s.id === storyId) || null;
        resolve(story);
    });
}
export function downloadStory(storyId: number): Promise<void> {
    return getMarketStory(storyId).then(story => {
        if (story) {
            // Simulate download logic
            console.log(`Downloading story: ${story.title}`);
        } else {
            throw new Error("Story not found");
        }
    });
}

export function rateStory(
    storyId: number,
    rating: number
): Promise<{ average_rating: number; rating_count: number }> {
    return getMarketStory(storyId).then(story => {
        if (story) {
            // Simulate rating logic
            console.log(`Rating story: ${story.title} with ${rating} stars`);
            return {
                average_rating: (story.average_rating * story.rating_count + rating) / (story.rating_count + 1),
                rating_count: story.rating_count + 1
            };
        } else {
            throw new Error("Story not found");
        }
    });
}

export function donateCredits(storyId: number, donationAmount: number): Promise<{ message: string }> {
    return getMarketStory(storyId).then(story => {
        if (story) {
            // Simulate donation logic
            console.log(`Donating ${donationAmount} credits to story: ${story.title}`);
            return { message: 'thank you for your donation' };
        } else {
            throw new Error("Story not found");
        }
    });
}

export function getTopRated(count: number): Promise<Array<MarketStory>> {
    return new Promise((resolve) => {
        const topRated = fakestories.sort((a, b) => b.average_rating - a.average_rating).slice(0, count);
        resolve(topRated);
    });
}
export function getMostPopular(count: number): Promise<Array<MarketStory>> {
    return new Promise((resolve) => {
        const mostPopular = fakestories.sort((a, b) => b.total_downloads - a.total_downloads).slice(0, count);
        resolve(mostPopular);
    });
}
export function getLatest(count: number): Promise<Array<MarketStory>> {
    return new Promise((resolve) => {
        const latest = fakestories.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()).slice(0, count);
        resolve(latest);
    });
}
export function getByGenre(genre: string, count: number): Promise<Array<MarketStory>> {
    return new Promise((resolve) => {
        const byGenre = fakestories.filter(story => story.ai_genres.includes(genre)).slice(0, count);
        resolve(byGenre);
    });
}

export function publishStory(storyId: number, {
        title,
        allow_ai,
        terms_accepted
      }: {
        title: string;
        allow_ai: boolean;
        terms_accepted: boolean;
      }): Promise<void> {
    return getMarketStory(storyId).then(story => {
        if (story) {
            // Simulate publish logic
            console.log(`Publishing story: ${story.title}`);
        } else {
            throw new Error("Story not found");
        }
    });
}
