import { AiTextArea, AiTextBox, Button } from '@drdata/ai-styles';
import React, { useCallback, useMemo, useState } from 'react';
import { FaDice, FaDownload, FaRandom } from 'react-icons/fa';
import { generateScenarioSynopsis, generateStoryTitle } from '../../../../services/storyGenerator';
import { StyleSettings } from '../../../../types/ScenarioTypes';
import { GENRE_OPTIONS, STYLE_OPTIONS, THEME_OPTIONS, TONE_OPTIONS, WRITING_STYLE_VARIATIONS } from '../../../../types/styleoptions';
import ImportModal from '../../../common/ImportModal';
import { TabProps } from '../../types';
import './GeneralTab.css';
import { ScenarioImage } from '../ScenarioImage';
import { StyleFields } from '../StyleFields';

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
  }, [handleDynamicFieldChange, scenario]);

  const randomizeSynopsis = useCallback(() => {
    generateScenarioSynopsis(scenario).then((synopsis) => {
      handleDynamicFieldChange('synopsis', synopsis.result);
    }).catch((error) => {
      console.error('Error generating synopsis:', error);
    });
  }, [scenario, handleDynamicFieldChange]);

  const randomizeAllStyle = useCallback(() => {
    const randomStyle: StyleSettings = {
      style: STYLE_OPTIONS[Math.floor(Math.random() * STYLE_OPTIONS.length)],
      genre: GENRE_OPTIONS[Math.floor(Math.random() * GENRE_OPTIONS.length)],
      tone: TONE_OPTIONS[Math.floor(Math.random() * TONE_OPTIONS.length)],
      communicationStyle: WRITING_STYLE_VARIATIONS[Math.floor(Math.random() * WRITING_STYLE_VARIATIONS.length)],
      theme: THEME_OPTIONS[Math.floor(Math.random() * THEME_OPTIONS.length)],
      other: '',
    };
    onScenarioChange({ writingStyle: randomStyle });
  }, [onScenarioChange]);

  const handleImport = useCallback((importedStyle: StyleSettings) => {
    const normalizedStyle: StyleSettings = {
      style: importedStyle.style || scenario.writingStyle?.style || '',
      genre: importedStyle.genre || scenario.writingStyle?.genre || '',
      tone: importedStyle.tone || scenario.writingStyle?.tone || '',
      communicationStyle: importedStyle.communicationStyle || scenario.writingStyle?.communicationStyle || '',
      theme: importedStyle.theme || scenario.writingStyle?.theme || '',
      other: importedStyle.other || scenario.writingStyle?.other || '',
      language: importedStyle.language || scenario.writingStyle?.language || '',
    };
    onScenarioChange({ writingStyle: normalizedStyle });
  }, [onScenarioChange, scenario.writingStyle?.style, scenario.writingStyle?.genre, scenario.writingStyle?.tone, scenario.writingStyle?.communicationStyle, scenario.writingStyle?.theme, scenario.writingStyle?.other, scenario.writingStyle?.language]);

  return (
    <div className="general-tab">
      <div className="general-tab__section">
        <h3 className="general-tab__section-title">Basic Information</h3>
        <div className="general-tab__info-container">
          <div className="general-tab__image-section">
            <ScenarioImage 
              scenario={scenario}
              onScenarioChange={onScenarioChange}
              className="general-tab__scenario-image"
              genre={scenario.writingStyle?.genre}
            />
          </div>
          <div className="general-tab__fields-section">
            <AiTextBox
              label="Scenario Title"
              data-testid="story-title-input"
              className='general-tab__title-input'
              value={scenario.title || ''}
              onChange={(value) => handleBasicFieldChange('title', value)}
              placeholder="Enter your scenario title..."
              aiIcon={<FaDice />}
              onAiClick={() => randomizeTitle()}
            />
            <AiTextArea
              label="Synopsis"
              data-testid="story-synopsis-input"
              value={scenario.synopsis || ''}
              onChange={(value) => handleBasicFieldChange('synopsis', value)}
              placeholder="Brief description of your scenario..."
              className='general-tab__synopsis-input'
              rows={4}
              aiIcon={<FaDice />}
              onAiClick={() => randomizeSynopsis()}
            />
          </div>
        </div>
      </div>

      <div className="general-tab__section">
        <div className="general-tab__section-header">
          <h3 className="general-tab__section-title">Writing Style</h3>
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
            communicationStyle: '',
            theme: '',
            other: '',
            language: '',
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
                    communicationStyle: parsedStyle.communicationStyle || '',
                    theme: parsedStyle.theme || '',
                    other: parsedStyle.other || '',
                    language: parsedStyle.language || '',
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
          return result;
        }}
      />
    </div>
  );
};
