import React, { useState } from 'react';
import { AiStoryReader } from '@drdata/docomo';
import MarkdownViewer from '../ReadingPane/MarkDownViewer';
import TTSPlayer from '../TTS/TTSPlayer';

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
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 'var(--spacing-5xl)',
        color: 'var(--color-text-secondary)'
      }}>
        <div style={{ 
          fontSize: 'var(--font-size-lg)',
          marginBottom: 'var(--spacing-md)'
        }}>
          Loading story content...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-lg)'
    }}>
      {/* Action Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-lg)',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: 'var(--spacing-md)'
      }}>
        <h2 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
          margin: 0
        }}>
          {title || 'Story Reader'}
        </h2>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {onDownload && (
            <button 
              onClick={onDownload}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: 'var(--color-secondary)',
                color: 'var(--color-secondary-contrast)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              📥 Download
            </button>
          )}
          {onEditScenario && (
            <button 
              onClick={onEditScenario}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: 'var(--color-primary)',
                color: 'var(--color-primary-contrast)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              ✏️ Edit Scenario
            </button>
          )}
          {onDelete && (
            <button 
              onClick={onDelete}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: 'var(--color-error)',
                color: 'var(--color-error-contrast)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              🗑️ Delete Story
            </button>
          )}
        </div>
      </div>

      {/* Story Metadata */}
      {metadata && (
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)',
          padding: 'var(--spacing-md)',
          background: 'var(--color-background)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)'
        }}>
          <div>
            <strong>Scenario:</strong> {metadata.scenario}
          </div>
          <div>
            <strong>Created:</strong> {metadata.created}
          </div>
          <div>
            <strong>Word Count:</strong> {metadata.wordCount} words
          </div>
        </div>
      )}

      {/* Text-to-Speech Player */}
      {content && (
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <TTSPlayer 
            text={content}
          />
        </div>
      )}

      {/* AI Story Reader */}
      {content ? (
        <AiStoryReader
          text={content}
          font={fontFamily}
          fontSize={fontSize}
          onFontChange={setFontFamily}
          onFontSizeChange={setFontSize}
          availableFonts={fontOptions}
          availableFontSizes={sizeOptions}
        />
      ) : (
        <div style={{ 
          textAlign: 'center',
          padding: 'var(--spacing-4xl)',
          color: 'var(--color-text-secondary)'
        }}>
          <p>No story content available.</p>
        </div>
      )}
    </div>
  );
};

export default StoryReader;
