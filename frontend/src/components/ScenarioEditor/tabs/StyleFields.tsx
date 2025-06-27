import React from 'react';
import { FaDice } from 'react-icons/fa';
import { StyleSettings } from '../../../types/ScenarioTypes';
import { GENRE_OPTIONS, LANGUAGE_FLAGS, LANGUAGE_OPTIONS, STYLE_OPTIONS, THEME_OPTIONS, TONE_OPTIONS, WRITING_STYLE_VARIATIONS } from '../../../types/styleoptions';
import { Dropdown } from '../common/Dropdown';
import { Input } from '../common/Input';

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
        <Dropdown
          label="Writing Style"
          value={writingStyle.style || ''}
          onChange={(value) => onStyleChange('style', value)}
          options={styleOptions}
          className='writingstyle__dropdown'
          placeholder="Select or enter writing style..."
          icon={<FaDice />}
          onIconClick={() => randomizeField('style', styleOptions)}
        />
      </div>

      <div className="general-tab__style-field">
        <Dropdown
          label="Genre"
          value={writingStyle.genre || ''}
          onChange={(value) => onStyleChange('genre', value)}
          options={genreOptions}
          className='genre__dropdown'
          placeholder="Select or enter genre..."
          icon={<FaDice />}
          onIconClick={() => randomizeField('genre', genreOptions)}
        />
      </div>

      <div className="general-tab__style-field">
        <Dropdown
          label="Tone"
          value={writingStyle.tone || ''}
          onChange={(value) => onStyleChange('tone', value)}
          options={toneOptions}
          className='tone__dropdown'
          placeholder="Select or enter tone..."
          icon={<FaDice />}
          onIconClick={() => randomizeField('tone', toneOptions)}
        />
      </div>

      <div className="general-tab__style-field">
        <Dropdown
          label="Type of language"
          value={writingStyle.communicationStyle || ''}
          onChange={(value) => onStyleChange('communicationStyle', value)}
          options={communicationStyleOptions}
          className='communicationStyle__dropdown'
          placeholder="Select or enter the type of communication..."
          icon={<FaDice />}
          onIconClick={() => randomizeField('communicationStyle', communicationStyleOptions)}
        />
      </div>

      <div className="general-tab__style-field">
        <Dropdown
          label="Theme"
          value={writingStyle.theme || ''}
          onChange={(value) => onStyleChange('theme', value)}
          options={themeOptions}
          className='theme__dropdown'
          placeholder="Select or enter theme..."
          icon={<FaDice />}
          onIconClick={() => randomizeField('theme', themeOptions)}
        />
      </div>


      <div className="general-tab__style-field">
        <Dropdown
          label="Language"
          value={writingStyle.language || 'English'}
          onChange={(value) => onStyleChange('language', value)}
          options={languageOptions}
          className="language__dropdown"
          placeholder="Select language..."
          readOnly
          renderOption={renderLanguageOption}
          renderValue={renderLanguageValue}
        />

      </div>

      <div className="general-tab__style-field general-tab__style-field--full">
        <Input
          label="Other Style Notes"
          value={writingStyle.other || ''}
          onChange={(value) => onStyleChange('other', value)}
          placeholder="Any additional style preferences..."
          multiline
          rows={3}
        />
      </div>
    </div>
  );
};

export default StyleFields;
