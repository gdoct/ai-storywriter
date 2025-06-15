import React, { useCallback, useState } from 'react';
import { FaDice, FaDownload, FaRandom } from 'react-icons/fa';
import { StyleSettings } from '../../../types/ScenarioTypes';
import ImportModal from '../../common/ImportModal';
import { Button } from '../common/Button';
import { Dropdown } from '../common/Dropdown';
import { Input } from '../common/Input';
import { TabProps } from '../types';
import './GeneralTab.css';

// Style option arrays
const styleOptions = ['Modern', 'Classic', 'Minimalist', 'Baroque', 'Gothic', 'Stream of consciousness', 'Epistolary', 'Journalistic', 'Academic', 'Poetic'];
const genreOptions = ['Science Fiction', 'Fantasy', 'Mystery', 'Romance', 'Horror', 'Comedy', 'Drama', 'Adventure', 'Thriller', 'Historical Fiction'];
const toneOptions = ['Serious', 'Humorous', 'Whimsical', 'Dark', 'Inspirational', 'Satirical', 'Suspenseful', 'Melancholic', 'Romantic', 'Philosophical'];
const languageOptions = ['Simple', 'Elaborate', 'Technical', 'Poetic', 'Conversational', 'Formal', 'Archaic', 'Slang-heavy', 'Multi-lingual', 'Minimal'];
const themeOptions = ['Coming of age', 'Redemption', 'Power and corruption', 'Love and sacrifice', 'Man vs. nature', 'Technology and humanity', 'Identity', 'Survival', 'Justice', 'Freedom'];

export const GeneralTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const writingStyle: StyleSettings = scenario.writingStyle || {};
  const [showImportModal, setShowImportModal] = useState(false);

  const handleBasicFieldChange = useCallback((field: string, value: string) => {
    onScenarioChange({ [field]: value });
  }, [onScenarioChange]);

  const handleStyleChange = useCallback((field: keyof StyleSettings, value: string) => {
    const updatedStyle = { ...writingStyle, [field]: value };
    onScenarioChange({ writingStyle: updatedStyle });
  }, [writingStyle, onScenarioChange]);

  const randomizeField = useCallback((field: keyof StyleSettings, options: string[]) => {
    const randomOption = options[Math.floor(Math.random() * options.length)];
    handleStyleChange(field, randomOption);
  }, [handleStyleChange]);

  const randomizeAllStyle = useCallback(() => {
    const randomStyle: StyleSettings = {
      style: styleOptions[Math.floor(Math.random() * styleOptions.length)],
      genre: genreOptions[Math.floor(Math.random() * genreOptions.length)],
      tone: toneOptions[Math.floor(Math.random() * toneOptions.length)],
      language: languageOptions[Math.floor(Math.random() * languageOptions.length)],
      theme: themeOptions[Math.floor(Math.random() * themeOptions.length)],
      other: '',
    };
    onScenarioChange({ writingStyle: randomStyle });
  }, [onScenarioChange]);

  const handleImport = useCallback((importedStyle: StyleSettings) => {
    const normalizedStyle: StyleSettings = {
      style: importedStyle.style || '',
      genre: importedStyle.genre || '',
      tone: importedStyle.tone || '',
      language: importedStyle.language || '',
      theme: importedStyle.theme || '',
      other: importedStyle.other || '',
    };
    onScenarioChange({ writingStyle: normalizedStyle });
  }, [onScenarioChange]);

  return (
    <div className="general-tab">
      <div className="general-tab__section">
        <h3 className="general-tab__section-title">Basic Information</h3>
        <div className="general-tab__grid">
          <Input
            label="Story Title"
            value={scenario.title || ''}
            onChange={(value) => handleBasicFieldChange('title', value)}
            placeholder="Enter your story title..."
          />
          <Input
            label="Synopsis"
            value={scenario.synopsis || ''}
            onChange={(value) => handleBasicFieldChange('synopsis', value)}
            placeholder="Brief description of your story..."
            multiline
            rows={4}
          />
        </div>
      </div>

      <div className="general-tab__section">
        <div className="general-tab__section-header">
          <h3 className="general-tab__section-title">Story Style</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={randomizeAllStyle}
            icon={<FaRandom />}
          >
            Randomize All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImportModal(true)}
            icon={<FaDownload />}
          >
            Import Style
          </Button>
        </div>
        
        <div className="general-tab__style-grid">
          <div className="general-tab__style-field">
            <Dropdown
              label="Writing Style"
              value={writingStyle.style || ''}
              onChange={(value) => handleStyleChange('style', value)}
              options={styleOptions}
              placeholder="Select or enter writing style..."
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => randomizeField('style', styleOptions)}
              icon={<FaDice />}
              className="general-tab__randomize-btn"
            >
              Random
            </Button>
          </div>

          <div className="general-tab__style-field">
            <Dropdown
              label="Genre"
              value={writingStyle.genre || ''}
              onChange={(value) => handleStyleChange('genre', value)}
              options={genreOptions}
              placeholder="Select or enter genre..."
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => randomizeField('genre', genreOptions)}
              icon={<FaDice />}
              className="general-tab__randomize-btn"
            >
              Random
            </Button>
          </div>

          <div className="general-tab__style-field">
            <Dropdown
              label="Tone"
              value={writingStyle.tone || ''}
              onChange={(value) => handleStyleChange('tone', value)}
              options={toneOptions}
              placeholder="Select or enter tone..."
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => randomizeField('tone', toneOptions)}
              icon={<FaDice />}
              className="general-tab__randomize-btn"
            >
              Random
            </Button>
          </div>

          <div className="general-tab__style-field">
            <Dropdown
              label="Language Style"
              value={writingStyle.language || ''}
              onChange={(value) => handleStyleChange('language', value)}
              options={languageOptions}
              placeholder="Select or enter language style..."
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => randomizeField('language', languageOptions)}
              icon={<FaDice />}
              className="general-tab__randomize-btn"
            >
              Random
            </Button>
          </div>

          <div className="general-tab__style-field">
            <Dropdown
              label="Theme"
              value={writingStyle.theme || ''}
              onChange={(value) => handleStyleChange('theme', value)}
              options={themeOptions}
              placeholder="Select or enter theme..."
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => randomizeField('theme', themeOptions)}
              icon={<FaDice />}
              className="general-tab__randomize-btn"
            >
              Random
            </Button>
          </div>

          <div className="general-tab__style-field general-tab__style-field--full">
            <Input
              label="Other Style Notes"
              value={writingStyle.other || ''}
              onChange={(value) => handleStyleChange('other', value)}
              placeholder="Any additional style preferences..."
              multiline
              rows={3}
            />
          </div>
        </div>
      </div>

      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Writing Style"
        onImport={handleImport}
        extractContent={(scenario) => {
          console.log('Extracting content from scenario:', scenario);
          
          // Handle multiple possible sources for style data
          if (scenario.writingStyle) {
            console.log('Found writingStyle:', scenario.writingStyle);
            return scenario.writingStyle;
          }
          
          // Initialize default style settings
          const result: StyleSettings = {
            style: '',
            genre: '',
            tone: '',
            language: '',
            theme: '',
            other: '',
          };

          // Check if style data is stored in the style field
          if (scenario.style) {
            if (typeof scenario.style === 'string') {
              try {
                const parsedStyle = JSON.parse(scenario.style);
                if (typeof parsedStyle === 'object' && parsedStyle !== null) {
                  console.log('Parsed style from string:', parsedStyle);
                  return {
                    style: parsedStyle.style || '',
                    genre: parsedStyle.genre || '',
                    tone: parsedStyle.tone || '',
                    language: parsedStyle.language || '',
                    theme: parsedStyle.theme || '',
                    other: parsedStyle.other || '',
                  };
                } else {
                  result.style = scenario.style;
                }
              } catch (error) {
                console.warn('Failed to parse style string:', error);
                result.style = scenario.style;
              }
            } else if (typeof scenario.style === 'object' && scenario.style !== null) {
              console.log('Using style object:', scenario.style);
              Object.assign(result, scenario.style);
            }
          }

          // Check for direct properties on scenario
          if (scenario.genre && typeof scenario.genre === 'string') result.genre = scenario.genre;
          if (scenario.tone && typeof scenario.tone === 'string') result.tone = scenario.tone;
          if (scenario.language && typeof scenario.language === 'string') result.language = scenario.language;
          if (scenario.theme && typeof scenario.theme === 'string') result.theme = scenario.theme;
          if (scenario.other && typeof scenario.other === 'string') result.other = scenario.other;

          console.log('Extracted style result:', result);
          return result;
        }}
      />
    </div>
  );
};
