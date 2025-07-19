import React from 'react';
import './NavigationBar.css';

interface NavigationBarProps {
  progress: number;
  enableBookmark: boolean;
  enableTTS: boolean;
  onProgressChange: (progress: number) => void;
  onBookmarkToggle: () => void;
  onTTSToggle: () => void;
  isPlaying?: boolean;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  progress,
  enableBookmark,
  enableTTS,
  onProgressChange,
  onBookmarkToggle,
  onTTSToggle,
  isPlaying,
}) => {
  return (
    <div className="navigation-bar" role="navigation" aria-label="Story navigation">
      <div className="navigation-bar__progress">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => onProgressChange(Number(e.target.value))}
          aria-label="Reading progress"
        />
        <span aria-hidden="true">{Math.round(progress)}%</span>
      </div>

      <div className="navigation-bar__controls">
        {enableBookmark && (
          <button
            onClick={onBookmarkToggle}
            aria-label="Toggle bookmark"
            className="navigation-bar__button"
          >
            <span className="icon-bookmark" aria-hidden="true" />
          </button>
        )}

        {enableTTS && (
          <button
            onClick={onTTSToggle}
            aria-label={isPlaying ? 'Pause text-to-speech' : 'Start text-to-speech'}
            className="navigation-bar__button"
          >
            <span className={`icon-${isPlaying ? 'pause' : 'play'}`} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
