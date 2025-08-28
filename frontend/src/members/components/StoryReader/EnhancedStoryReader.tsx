import React from 'react';
import { AiStoryReader } from '@drdata/ai-styles';
import './EnhancedStoryReader.css';

interface Character {
  name: string;
  description: string;
  imageUrl?: string;
}

interface ScenarioData {
  title?: string;
  description?: string;
  imageUrl?: string;
  characters?: Character[];
  setting?: string;
  genre?: string;
}

interface EnhancedStoryReaderProps {
  content: string;
  isLoading?: boolean;
  title?: string;
  author?: string;
  publishedAt?: string;
  wordCount?: number;
  imageUri?: string;
  scenarioJson?: string;
  storyId?: number;
  averageRating?: number;
  ratingCount?: number;
  userRating?: number;
  onRatingChange?: (rating: number) => void;
  onDownload?: () => void;
}

const EnhancedStoryReader: React.FC<EnhancedStoryReaderProps> = ({
  content,
  isLoading = false,
  title,
  author,
  wordCount,
  imageUri,
  scenarioJson,
  onDownload
}) => {
  // Parse scenario data
  let scenarioData: ScenarioData = {};
  if (scenarioJson) {
    try {
      scenarioData = JSON.parse(scenarioJson);
    } catch (error) {
      console.error('Error parsing scenario JSON:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="enhanced-story-reader-loading">
        <div className="loading-spinner"></div>
        <p>Loading story content...</p>
      </div>
    );
  }

  return (
    <div className="enhanced-story-reader">
      <AiStoryReader
        text={content}
        title={title}
        author={author}
        readingTime={wordCount ? Math.ceil(wordCount / 200) : undefined}
        coverImage={imageUri || scenarioData.imageUrl}
        characters={scenarioData.characters?.map((char, index) => ({
          id: index.toString(),
          name: char.name,
          image: char.imageUrl || '/default-avatar.png'
        }))}
        enableTTS={true}
        enableBookmark={true}
        enableHighlight={true}
        enableFullScreen={true}
        displayMode="scroll"
        onDownload={onDownload}
      />
    </div>
  );
};

export default EnhancedStoryReader;