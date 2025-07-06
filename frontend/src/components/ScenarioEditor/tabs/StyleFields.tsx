import { AiDropdown, AiTextArea, Label } from '@drdata/ai-styles';
import React from 'react';
import { StyleSettings } from '../../../types/ScenarioTypes';
import { GENRE_OPTIONS, LANGUAGE_FLAGS, LANGUAGE_OPTIONS, STYLE_OPTIONS, THEME_OPTIONS, TONE_OPTIONS, WRITING_STYLE_VARIATIONS } from '../../../types/styleoptions';

interface StyleFieldsProps {
  writingStyle: StyleSettings;
  onStyleChange: (field: keyof StyleSettings, value: string) => void;
  randomizeField: (field: keyof StyleSettings, options: string[]) => void;
}

const StyleFields: React.FC<StyleFieldsProps> = ({ writingStyle, onStyleChange, randomizeField }) => {
  const styleOptions = STYLE_OPTIONS;
  const genreOptions = GENRE_OPTIONS;
  const toneOptions = TONE_OPTIONS;
  const communicationStyleOptions = WRITING_STYLE_VARIATIONS;
  const themeOptions = THEME_OPTIONS;
  const languageOptions = LANGUAGE_OPTIONS;

  // Render function for language options with flags
  const renderLanguageOption = (language: string) => (
    <>
      <span style={{ fontSize: '1.2em', marginRight: '0.5rem' }}>
        {LANGUAGE_FLAGS[language] || '🏳️'}
      </span>
      {language}
    </>
  );

  const renderLanguageValue = (language: string) => (
    <>
      <span style={{ fontSize: '1.2em', marginRight: '0.5rem' }}>
        {LANGUAGE_FLAGS[language] || '🏳️'}
      </span>
      {language}
    </>
  );

    return (
    <div className="general-tab__style-grid">
      <div className="general-tab__style-field">
        <div>
          <Label style={{ marginBottom: 'var(--spacing-xs)', display: 'block' }}>Writing Style</Label>
          <AiDropdown
            value={writingStyle.style || ''}
            onChange={(value) => onStyleChange('style', value)}
            options={styleOptions.map(opt => ({ value: opt, label: opt }))}
            className='writingstyle__dropdown'
            placeholder="Select or enter writing style..."
            onAiClick={() => randomizeField('style', styleOptions)}
          />
        </div>
      </div>

      <div className="general-tab__style-field">
        <div>
          <Label style={{ marginBottom: 'var(--spacing-xs)', display: 'block' }}>Genre</Label>
          <AiDropdown
            value={writingStyle.genre || ''}
            onChange={(value) => onStyleChange('genre', value)}
            options={genreOptions.map(opt => ({ value: opt, label: opt }))}
            className='genre__dropdown'
            placeholder="Select or enter genre..."
            onAiClick={() => randomizeField('genre', genreOptions)}
          />
        </div>
      </div>

      <div className="general-tab__style-field">
        <div>
          <Label style={{ marginBottom: 'var(--spacing-xs)', display: 'block' }}>Tone</Label>
          <AiDropdown
            value={writingStyle.tone || ''}
            onChange={(value) => onStyleChange('tone', value)}
            options={toneOptions.map(opt => ({ value: opt, label: opt }))}
            className='tone__dropdown'
            placeholder="Select or enter tone..."
            onAiClick={() => randomizeField('tone', toneOptions)}
          />
        </div>
      </div>

      <div className="general-tab__style-field">
        <div>
          <Label style={{ marginBottom: 'var(--spacing-xs)', display: 'block' }}>Type of language</Label>
          <AiDropdown
            value={writingStyle.communicationStyle || ''}
            onChange={(value) => onStyleChange('communicationStyle', value)}
            options={communicationStyleOptions.map(opt => ({ value: opt, label: opt }))}
            className='communicationStyle__dropdown'
            placeholder="Select or enter the type of communication..."
            onAiClick={() => randomizeField('communicationStyle', communicationStyleOptions)}
          />
        </div>
      </div>

      <div className="general-tab__style-field">
        <div>
          <Label style={{ marginBottom: 'var(--spacing-xs)', display: 'block' }}>Theme</Label>
          <AiDropdown
            value={writingStyle.theme || ''}
            onChange={(value) => onStyleChange('theme', value)}
            options={themeOptions.map(opt => ({ value: opt, label: opt }))}
            className='theme__dropdown'
            placeholder="Select or enter theme..."
            onAiClick={() => randomizeField('theme', themeOptions)}
          />
        </div>
      </div>


      <div className="general-tab__style-field">
        <div>
          <Label style={{ marginBottom: 'var(--spacing-xs)', display: 'block' }}>Language</Label>
          <AiDropdown
            value={writingStyle.language || 'English'}
            onChange={(value) => onStyleChange('language', value)}
            options={languageOptions.map(opt => ({ value: opt, label: opt }))}
            className="language__dropdown"
            placeholder="Select language..."
            disabled
            renderOption={(option) => renderLanguageOption(option.value)}
            renderValue={renderLanguageValue}
          />
        </div>

      </div>

      <div className="general-tab__style-field general-tab__style-field--full">
        <div>
          <Label style={{ marginBottom: 'var(--spacing-xs)', display: 'block' }}>Other Style Notes</Label>
          <AiTextArea
            value={writingStyle.other || ''}
            onChange={(value) => onStyleChange('other', value)}
            placeholder="Any additional style preferences..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default StyleFields;
