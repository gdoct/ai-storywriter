import React from 'react';
import { DisplayMode, ThemeSettings } from './types';
import './ReaderControls.css';

interface ReaderControlsProps {
  displayMode: DisplayMode;
  settings: ThemeSettings;
  onModeChange: (mode: DisplayMode) => void;
  onSettingsChange: (settings: ThemeSettings) => void;
}

export const ReaderControls: React.FC<ReaderControlsProps> = ({
  displayMode,
  settings,
  onModeChange,
  onSettingsChange,
}) => {
  const handleThemeChange = (theme: ThemeSettings['theme']) => {
    onSettingsChange({ ...settings, theme });
  };

  const handleFontChange = (fontFamily: string) => {
    onSettingsChange({ ...settings, fontFamily });
  };

  const handleFontSizeChange = (fontSize: string) => {
    onSettingsChange({ ...settings, fontSize });
  };

  return (
    <div className="reader-controls" role="toolbar" aria-label="Reading preferences">
      <div className="reader-controls__section">
        <label htmlFor="display-mode">View Mode:</label>
        <select
          id="display-mode"
          value={displayMode}
          onChange={(e) => onModeChange(e.target.value as DisplayMode)}
        >
          <option value="scroll">Continuous</option>
          <option value="paginated">Pages</option>
          <option value="preview">Preview</option>
        </select>
      </div>

      <div className="reader-controls__section">
        <label htmlFor="theme">Theme:</label>
        <select
          id="theme"
          value={settings.theme}
          onChange={(e) => handleThemeChange(e.target.value as ThemeSettings['theme'])}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="sepia">Sepia</option>
          <option value="high-contrast">High Contrast</option>
        </select>
      </div>

      <div className="reader-controls__section">
        <label htmlFor="font-family">Font:</label>
        <select
          id="font-family"
          value={settings.fontFamily}
          onChange={(e) => handleFontChange(e.target.value)}
        >
          <option value="serif">Serif</option>
          <option value="sans-serif">Sans Serif</option>
          <option value="monospace">Monospace</option>
        </select>
      </div>

      <div className="reader-controls__section">
        <label htmlFor="font-size">Size:</label>
        <select
          id="font-size"
          value={settings.fontSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
        >
          <option value="16px">Small</option>
          <option value="18px">Medium</option>
          <option value="20px">Large</option>
          <option value="24px">Extra Large</option>
        </select>
      </div>
    </div>
  );
};
