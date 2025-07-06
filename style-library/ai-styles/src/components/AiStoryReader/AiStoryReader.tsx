import React, { useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import './AiStoryReader.css';

export interface AiStoryReaderProps {
  text: string;
  font?: string;
  fontSize?: string;
  onFontChange?: (font: string) => void;
  onFontSizeChange?: (size: string) => void;
  availableFonts?: string[];
  availableFontSizes?: string[];
  disabled?: boolean;
}

const DEFAULT_FONTS = ['serif', 'sans-serif', 'monospace'];
const DEFAULT_FONT_SIZES = ['16px', '18px', '20px', '24px'];

export const AiStoryReader: React.FC<AiStoryReaderProps> = ({
  text,
  font: initialFont = 'serif',
  fontSize: initialFontSize = '18px',
  onFontChange,
  onFontSizeChange,
  availableFonts = DEFAULT_FONTS,
  availableFontSizes = DEFAULT_FONT_SIZES,
  disabled = false,
}) => {
  const { theme } = useTheme();

  // State for font and fontSize
  const [font, setFont] = useState(initialFont);
  const [fontSize, setFontSize] = useState(initialFontSize);

  const handleFontChange = (newFont: string) => {
    setFont(newFont);
    onFontChange?.(newFont);
  };

  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize);
    onFontSizeChange?.(newSize);
  };

  return (
    <div className={`ds-story-reader ${theme}`}>
      <div className="ds-story-reader__controls">
        <label>
          Font:
          <select
            value={font}
            onChange={e => handleFontChange(e.target.value)}
            disabled={disabled}
            data-testid="font-select"
          >
            {availableFonts.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <label>
          Size:
          <select
            value={fontSize}
            onChange={e => handleFontSizeChange(e.target.value)}
            disabled={disabled}
            data-testid="font-size-select"
          >
            {availableFontSizes.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <textarea
        className="ds-story-reader__textarea"
        style={{ fontFamily: font, fontSize }}
        value={text}
        readOnly
        disabled={disabled}
        data-testid="story-textarea"
      />
    </div>
  );
};

export default AiStoryReader;
