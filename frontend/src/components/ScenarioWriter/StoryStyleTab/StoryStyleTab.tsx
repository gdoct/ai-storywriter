// filepath: /home/guido/storywriter/frontend/src/components/tabs/StoryStyleTab.tsx
import React, { useState } from 'react';
import { generateRandomWritingStyle } from '../../../services/storyGenerator';
import ActionButton from '../../common/ActionButton';
import ImportButton from '../../common/ImportButton';
import ImportModal from '../../common/ImportModal';
import { TabProps } from '../common/TabInterface';
import '../common/TabStylesNew.css';

// Define the suggestion options for each dropdown
const styleOptions = ['Modern', 'Classic', 'Minimalist', 'Baroque', 'Gothic', 'Stream of consciousness', 'Epistolary', 'Journalistic', 'Academic', 'Poetic'];
const genreOptions = ['Science Fiction', 'Fantasy', 'Mystery', 'Romance', 'Horror', 'Comedy', 'Drama', 'Adventure', 'Thriller', 'Historical Fiction'];
const toneOptions = ['Serious', 'Humorous', 'Whimsical', 'Dark', 'Inspirational', 'Satirical', 'Suspenseful', 'Melancholic', 'Romantic', 'Philosophical'];
const languageOptions = ['Simple', 'Elaborate', 'Technical', 'Poetic', 'Conversational', 'Formal', 'Archaic', 'Slang-heavy', 'Multi-lingual', 'Minimal'];
const themeOptions = ['Coming of age', 'Redemption', 'Power and corruption', 'Love and sacrifice', 'Man vs. nature', 'Technology and humanity', 'Identity', 'Survival', 'Justice', 'Freedom'];

// Custom dropdown component that allows both selection from options and free text input
const StyleDropdown: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labelStyle?: React.CSSProperties; // Optional custom style for the label
}> = ({ label, value, onChange, options, labelStyle }) => {
  // Track if dropdown is showing or not
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="form-field">
      <label style={labelStyle}>{label}</label>
      <div className="custom-dropdown">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={`Select or enter ${label.toLowerCase()}...`}
          className="form-input"
        />
        {isOpen && (
          <ul className="dropdown-options">
            {options.map((option, index) => (
              <li key={index} onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}>
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const StoryStyleTab: React.FC<TabProps> = ({ content, updateContent, currentScenario }) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [styleGenerationInProgress, setStyleGenerationInProgress] = useState(false);
  
  // Define default empty style settings
  const defaultStyleSettings = {
    style: '',
    genre: '',
    tone: '',
    language: '',
    theme: '',
    other: ''
  };

  // Parse stored JSON content or initialize with empty values
  const [styleSettings, setStyleSettings] = useState<{
    style: string;
    genre: string;
    tone: string;
    language: string;
    theme: string;
    other: string;
  }>(() => {
    try {
      if (!content) {
        return defaultStyleSettings;
      }
      
      // Try to parse content as JSON
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch {
        // If parsing fails, return empty values
        return defaultStyleSettings;
      }
      
      // Return the parsed content with defaults for any missing fields
      return {
        style: parsedContent.style || '',
        genre: parsedContent.genre || '',
        tone: parsedContent.tone || '',
        language: parsedContent.language || '',
        theme: parsedContent.theme || '',
        other: parsedContent.other || ''
      };
    } catch {
      return defaultStyleSettings;
    }
  });

  // Update the content each time any setting changes
  const handleSettingChange = (key: string, value: string) => {
    const newSettings = { ...styleSettings, [key]: value };
    setStyleSettings(newSettings);
    // Save as JSON string
    updateContent(JSON.stringify(newSettings));
  };

  const handleImport = (importedSettings: any) => {
    // Simply normalize the settings with defaults for any missing properties
    const normalizedSettings = {
      style: importedSettings.style || '',
      genre: importedSettings.genre || '',
      tone: importedSettings.tone || '',
      language: importedSettings.language || '',
      theme: importedSettings.theme || '',
      other: importedSettings.other || ''
    };
    
    setStyleSettings(normalizedSettings);
    updateContent(JSON.stringify(normalizedSettings));
  };

  // Handler for generating a random writing style
  const handleGenerateRandomStyle = async () => {
    console.log('Generate random style button clicked');
    
    try {
      setStyleGenerationInProgress(true);
      
      // Generate a random writing style
      const generationResult = await generateRandomWritingStyle({
        onProgress: (generatedText) => {
          // For JSON results, we don't need to update intermediate progress
          // as it might not be valid JSON until complete
          console.log('Generating writing style...');
        }
      });

      // Wait for the generation to complete
      try {
        const randomStyle = await generationResult.result;
        
        // Update the style settings with the generated style
        const newSettings = {
          style: randomStyle.style || '',
          genre: randomStyle.genre || '',
          tone: randomStyle.tone || '',
          language: randomStyle.language || '',
          theme: randomStyle.theme || '',
          other: randomStyle.other || ''
        };
        
        setStyleSettings(newSettings);
        
        // Save as JSON string
        updateContent(JSON.stringify(newSettings));
        
        console.log('Random style generated:', newSettings);
      } catch (error) {
        console.log('Style generation was interrupted or invalid:', error);
      }
    } catch (error) {
      console.error('Error generating random style:', error);
    } finally {
      setStyleGenerationInProgress(false);
    }
  };

  return (
    <div className="tab-container scenario-editor-panel">
      <div className="scenario-tab-title">
        Story Style
      </div>
      <div className="tab-description" style={{ color: '#bfc7d5', fontWeight: 500, marginBottom: 32 }}>
          Use these options to influence the style of your story. All fields are optional.
      </div>
      <div className="tab-actions">
        <div className="tab-actions-primary">
          {!styleGenerationInProgress ? (
            <ActionButton 
              onClick={handleGenerateRandomStyle}
              label="✨ Generate Random Style"
              variant="success"
              title="Generate a random writing style using AI"
              disabled={styleGenerationInProgress}
            />
          ) : (
            <ActionButton 
              onClick={() => {}}
              label="✨ Generating Style..."
              variant="default"
              disabled={true}
            />
          )}
        </div>
        <div className="tab-actions-secondary">
          <ImportButton
            onClick={() => setShowImportModal(true)}
            title="Import style settings from another scenario"
            label="Import Style"
          />
        </div>
      </div>
      
      <div className="tab-section" style={{
        background: '#181b20',
        borderRadius: '12px',
        padding: '36px 0 48px 0',
        margin: '0',
        boxShadow: 'none',
        minHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

      <div className="style-options-container" style={{
        background: '#23272f',
        border: '1.5px solid #444',
        borderRadius: '10px',
        color: '#fff',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        margin: '0 auto 24px auto',
        padding: '32px 32px 22px 32px',
        minWidth: '580px',
        maxWidth: '820px',
        fontSize: '1.08rem',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}>
        <StyleDropdown
          label="Style"
          value={styleSettings.style}
          onChange={(value) => handleSettingChange('style', value)}
          options={styleOptions}
          labelStyle={{ color: '#90caf9', fontWeight: 600, fontSize: '1.04rem', marginBottom: 4 }}
        />

        <StyleDropdown
          label="Genre"
          value={styleSettings.genre}
          onChange={(value) => handleSettingChange('genre', value)}
          options={genreOptions}
          labelStyle={{ color: '#90caf9', fontWeight: 600, fontSize: '1.04rem', marginBottom: 4 }}
        />

        <StyleDropdown
          label="Tone"
          value={styleSettings.tone}
          onChange={(value) => handleSettingChange('tone', value)}
          options={toneOptions}
          labelStyle={{ color: '#90caf9', fontWeight: 600, fontSize: '1.04rem', marginBottom: 4 }}
        />

        <StyleDropdown
          label="Language"
          value={styleSettings.language}
          onChange={(value) => handleSettingChange('language', value)}
          options={languageOptions}
          labelStyle={{ color: '#90caf9', fontWeight: 600, fontSize: '1.04rem', marginBottom: 4 }}
        />

        <StyleDropdown
          label="Theme"
          value={styleSettings.theme}
          onChange={(value) => handleSettingChange('theme', value)}
          options={themeOptions}
          labelStyle={{ color: '#90caf9', fontWeight: 600, fontSize: '1.04rem', marginBottom: 4 }}
        />

        <div className="form-field">
          <label style={{ color: '#90caf9', fontWeight: 600, fontSize: '1.04rem', marginBottom: 4 }}>Other Instructions</label>
          <textarea
            value={styleSettings.other}
            onChange={(e) => handleSettingChange('other', e.target.value)}
            placeholder="Add any additional style instructions here..."
            className="form-textarea"
            style={{
              background: '#181b20',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '6px',
              fontSize: '1rem',
              padding: '10px',
              marginTop: '4px',
              minHeight: '96px',
            }}
          />
        </div>
      </div>

      
      </div>
      
      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Style Settings"
        onImport={handleImport}
        renderItemLabel={(styleSettings) => {
          // Simply display the settings we have
          const hasStyle = !!styleSettings.style;
          const hasGenre = !!styleSettings.genre;
          const hasTone = !!styleSettings.tone;
          const hasLanguage = !!styleSettings.language;
          const hasTheme = !!styleSettings.theme;
          
          return (
            <div className="style-settings-preview">
              <div className="style-settings-grid">
                {hasStyle && <div><strong>Style:</strong> {styleSettings.style}</div>}
                {hasGenre && <div><strong>Genre:</strong> {styleSettings.genre}</div>}
                {hasTone && <div><strong>Tone:</strong> {styleSettings.tone}</div>}
                {hasLanguage && <div><strong>Language:</strong> {styleSettings.language}</div>}
                {hasTheme && <div><strong>Theme:</strong> {styleSettings.theme}</div>}
              </div>
            </div>
          );
        }}
        extractContent={(scenario) => {
          if (!scenario) return { style: '', genre: '', tone: '', language: '', theme: '', other: '' };
          
          try {
            // Default empty result
            const result = { 
              style: '',
              genre: '',
              tone: '',
              language: '',
              theme: '',
              other: ''
            };
            
            // First priority: check for writingStyle property (backend format)
            if (scenario.writingStyle) {
              return {
                style: scenario.writingStyle.style || '',
                genre: scenario.writingStyle.genre || '',
                tone: scenario.writingStyle.tone || '',
                language: scenario.writingStyle.language || '',
                theme: scenario.writingStyle.theme || '',
                other: scenario.writingStyle.other || ''
              };
            }
            
            // Second priority: try to parse style as JSON
            if (scenario.style) {
              if (typeof scenario.style === 'string') {
                try {
                  const parsedStyle = JSON.parse(scenario.style);
                  if (typeof parsedStyle === 'object' && parsedStyle !== null) {
                    return {
                      style: parsedStyle.style || '',
                      genre: parsedStyle.genre || '',
                      tone: parsedStyle.tone || '',
                      language: parsedStyle.language || '',
                      theme: parsedStyle.theme || '',
                      other: parsedStyle.other || ''
                    };
                  } else {
                    result.style = scenario.style;
                  }
                } catch {
                  result.style = scenario.style;
                }
              } else if (typeof scenario.style === 'object' && scenario.style !== null) {
                Object.assign(result, scenario.style);
              }
            }
            
            // Finally check for direct properties on scenario
            if (typeof scenario.genre === 'string') result.genre = scenario.genre;
            if (typeof scenario.tone === 'string') result.tone = scenario.tone;
            if (typeof scenario.language === 'string') result.language = scenario.language;
            if (typeof scenario.theme === 'string') result.theme = scenario.theme;
            if (typeof scenario.other === 'string') result.other = scenario.other;
            
            return result;
          } catch (error) {
            console.error('Error extracting style settings:', error);
            return {
              style: '',
              genre: '',
              tone: '',
              language: '',
              theme: '',
              other: ''
            };
          }
        }}
      />
    </div>
  );
};

export default StoryStyleTab;
