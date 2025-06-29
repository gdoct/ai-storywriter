import React, { useState } from 'react';
import MarkdownViewer from '../ReadingPane/MarkDownViewer';
import TTSPlayer from '../TTS/TTSPlayer';
import './StoryReader.css';

interface StoryReaderProps {
  content: string;
  isLoading?: boolean;
  title?: string;
  metadata?: {
    scenario: string;
    created: string;
    wordCount: number;
  };
  onDownload?: () => void;
  onEditScenario?: () => void;
  onDelete?: () => void;
}

const StoryReader: React.FC<StoryReaderProps> = ({
  content,
  isLoading = false,
  title,
  metadata,
  onDownload,
  onEditScenario,
  onDelete
}) => {
  const [fontFamily, setFontFamily] = useState<string>('Georgia');
  const [fontSize, setFontSize] = useState<string>('24px');

  const fontOptions = [
    'Georgia',
    'Times New Roman',
    'Garamond',
    'Arial',
    'Verdana',
    'Helvetica',
    'Courier New'
  ];

  const sizeOptions = [
    '12px', '14px', '16px', '18px', '20px', '22px', '24px',
    '28px', '32px', '36px', '40px', '44px', '48px',
  ];

  if (isLoading) {
    return (
      <div className="story-reader">
        <div className="story-reader-loading">
          <div className="loading-spinner"></div>
          <p>Loading story content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="story-reader">
      {/* Reading Controls */}
      <div className="story-reader-controls">
        <div className="font-controls">
          <div className="control-group">
            <label htmlFor="font-selector">Font:</label>
            <select
              id="font-selector"
              value={fontFamily}
              onChange={e => setFontFamily(e.target.value)}
            >
              {fontOptions.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label htmlFor="size-selector">Size:</label>
            <select
              id="size-selector"
              value={fontSize}
              onChange={e => setFontSize(e.target.value)}
            >
              {sizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="action-controls">
          {onDownload && (
            <button className="btn btn-secondary" onClick={onDownload}>
              📥 Download
            </button>
          )}
          {onEditScenario && (
            <button className="btn btn-primary" onClick={onEditScenario}>
              ✏️ Edit Scenario
            </button>
          )}
          {onDelete && (
            <button className="btn btn-danger" onClick={onDelete}>
              🗑️ Delete Story
            </button>
          )}
        </div>
      </div>

      {/* Story Metadata */}
      {metadata && (
        <div className="story-reader-metadata">
          <div className="metadata-item">
            <strong>Scenario:</strong> {metadata.scenario}
          </div>
          <div className="metadata-item">
            <strong>Created:</strong> {metadata.created}
          </div>
          <div className="metadata-item">
            <strong>Word Count:</strong> {metadata.wordCount} words
          </div>
        </div>
      )}

      {/* Text-to-Speech Player */}
      {content && (
        <TTSPlayer 
          text={content}
          className="story-reader-tts"
        />
      )}

      {/* Story Content */}
      <div 
        className="story-reader-content"
        style={{
          fontSize: fontSize,
          fontFamily: fontFamily,
        }}
      >
        {content ? (
          <>
            <div className="saved-story-badge">Saved Story</div>
            <MarkdownViewer content={content} isGenerating={false} />
          </>
        ) : (
          <div className="story-reader-empty">
            <p>No story content available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryReader;
