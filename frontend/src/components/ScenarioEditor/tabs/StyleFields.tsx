import React from 'react';
import { FaDice } from 'react-icons/fa';
import { Button } from '../common/Button';
import { Dropdown } from '../common/Dropdown';
import { Input } from '../common/Input';
import { StyleSettings } from '../../../types/ScenarioTypes';

interface StyleFieldsProps {
  writingStyle: StyleSettings;
  onStyleChange: (field: keyof StyleSettings, value: string) => void;
  randomizeField: (field: keyof StyleSettings, options: string[]) => void;
}

const StyleFields: React.FC<StyleFieldsProps> = ({ writingStyle, onStyleChange, randomizeField }) => {
  const styleOptions = ['Modern', 'Classic', 'Minimalist', 'Gothic', 'Stream of consciousness', 'Epistolary', 'Journalistic', 'Academic', 'Poetic', 'Narrative', 'Descriptive', 'Persuasive', 'Technical', 'Lyrical', 'Dramatic'];
  const genreOptions = ['Science Fiction', 'Drama', 'Adventure', 'Fantasy', 'Mystery', 'Romance', 'Horror', 'Comedy', 'Thriller', 'Historical Fiction', "autobiography", "Manual", 'Self-help', 'Biography', 'Non-fiction', 'Poetry', 'Satire', 'Dystopian', 'Cyberpunk', 'Magical Realism'];
  const toneOptions = ['Serious', 'Humorous', 'Whimsical', 'Dark', 'Inspirational', 'Satirical', 'Suspenseful', 'Melancholic', 'Romantic', 'Philosophical', 'Optimistic', 'Pessimistic', 'Nostalgic', 'Critical', 'Reflective', 'Urgent', 'Detached', 'Intimate', 'Cynical', 'Hopeful'];
  const languageOptions = ['Simple', 'Elaborate', 'Technical', 'Pirate', 'Conversational', 'Formal', 'Archaic', 'Slang-heavy',  'Minimal', 'Descriptive', 'Colloquial', 'Poetic', 'Jargon-heavy', 'Academic', 'Narrative', 'Journalistic', 'Lyrical', 'Streamlined', 'Verbose', 'Concise'];
  const themeOptions = ['Coming of age', 'Redemption', 'Power and corruption', 'Love and sacrifice', 'Man vs. nature', 'Technology and humanity', 'Identity', 'Survival', 'Justice', 'Freedom', 'Isolation', 'Family and relationships', 'War and peace', 'Good vs. evil', 'Fate vs. free will', 'Memory and nostalgia', 'Courage and bravery', 'Greed and ambition', 'Tradition vs. change', 'Hope and despair', 'Truth and deception'];

  return (
    <div className="general-tab__style-grid">
      <div className="general-tab__style-field">
        <Dropdown
          label="Writing Style"
          value={writingStyle.style || ''}
          onChange={(value) => onStyleChange('style', value)}
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
          onChange={(value) => onStyleChange('genre', value)}
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
          onChange={(value) => onStyleChange('tone', value)}
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
          onChange={(value) => onStyleChange('language', value)}
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
          onChange={(value) => onStyleChange('theme', value)}
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
