import React, { useCallback, useMemo, useState } from 'react';
import { FaDice, FaDownload, FaRandom } from 'react-icons/fa';
import { generateScenarioSynopsis, generateStoryTitle } from '../../../services/storyGenerator';
import { StyleSettings } from '../../../types/ScenarioTypes';
import { GENRE_OPTIONS, LANGUAGE_OPTIONS, STYLE_OPTIONS, THEME_OPTIONS, TONE_OPTIONS } from '../../../types/styleoptions';
import ImportModal from '../../common/ImportModal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TabProps } from '../types';
import './GeneralTab.css';
import StyleFields from './StyleFields';

export const GeneralTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  // Wrap writingStyle in useMemo to stabilize reference for useCallback deps
  const writingStyle: StyleSettings = useMemo(() => scenario.writingStyle || {}, [scenario.writingStyle]);
  const [showImportModal, setShowImportModal] = useState(false);

  const handleBasicFieldChange = useCallback((field: string, value: string) => {
    onScenarioChange({ [field]: value });
  }, [onScenarioChange]);

  const handleDynamicFieldChange = useCallback((field: string, value: Promise<string>) => {
    value.then((resolvedValue) => {
      onScenarioChange({ [field]: resolvedValue });
    }).catch((error) => {
      console.error(`Error resolving ${field}:`, error);
    });
  }, [onScenarioChange]);


  const handleStyleChange = useCallback((field: keyof StyleSettings, value: string) => {
    const updatedStyle = { ...writingStyle, [field]: value };
    onScenarioChange({ writingStyle: updatedStyle });
  }, [writingStyle, onScenarioChange]);

  const randomizeField = useCallback((field: keyof StyleSettings, options: string[]) => {
    const randomOption = options[Math.floor(Math.random() * options.length)];
    handleStyleChange(field, randomOption);
  }, [handleStyleChange]);

  const randomizeTitle = useCallback(() => {
    generateStoryTitle(scenario).then((title) => {
      handleDynamicFieldChange('title', title.result);
    }
    ).catch((error) => {
      console.error('Error generating title:', error);
    });
  }, [handleBasicFieldChange]);

  const randomizeSynopsis = useCallback(() => {
    generateScenarioSynopsis(scenario).then((synopsis) => {
      handleDynamicFieldChange('synopsis', synopsis.result);
    }).catch((error) => {
      console.error('Error generating synopsis:', error);
    });
  }, [scenario, handleBasicFieldChange]);

  const randomizeAllStyle = useCallback(() => {
    const randomStyle: StyleSettings = {
      style: STYLE_OPTIONS[Math.floor(Math.random() * STYLE_OPTIONS.length)],
      genre: GENRE_OPTIONS[Math.floor(Math.random() * GENRE_OPTIONS.length)],
      tone: TONE_OPTIONS[Math.floor(Math.random() * TONE_OPTIONS.length)],
      language: LANGUAGE_OPTIONS[Math.floor(Math.random() * LANGUAGE_OPTIONS.length)],
      theme: THEME_OPTIONS[Math.floor(Math.random() * THEME_OPTIONS.length)],
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
            data-test-id="story-title-input"
            value={scenario.title || ''}
            onChange={(value) => handleBasicFieldChange('title', value)}
            placeholder="Enter your story title..."
          /> <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => randomizeTitle()}
                    icon={<FaDice />}
                    className="general-tab__randomize-title-btn"
                  >
                    Random
                  </Button>
          <Input
            label="Synopsis"
            data-test-id="story-synopsis-input"
            value={scenario.synopsis || ''}
            onChange={(value) => handleBasicFieldChange('synopsis', value)}
            placeholder="Brief description of your story..."
            className='general-tab__synopsis-input'
            multiline
            rows={4}
          />
          <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => randomizeSynopsis()}
                    icon={<FaDice />}
                    className="general-tab__randomize-synopsis-btn"
                  >
                    Random
                  </Button>
        </div>
      </div>

      <div className="general-tab__section">
        <div className="general-tab__section-header">
          <h3 className="general-tab__section-title">Story Style</h3>
          <Button
            variant="secondary"
            size="sm"
            data-test-id="randomize-all-style-btn"
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
        
        <StyleFields
          writingStyle={writingStyle}
          onStyleChange={handleStyleChange}
          randomizeField={randomizeField}
        />
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
