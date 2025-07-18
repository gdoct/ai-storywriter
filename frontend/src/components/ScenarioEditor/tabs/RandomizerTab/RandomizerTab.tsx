import { AiTextArea, AiTextBox, Button } from '@drdata/ai-styles';
import React, { useCallback, useMemo, useState } from 'react';
import { FaDownload, FaDice, FaPlus, FaTrash, FaUser, FaTimes } from 'react-icons/fa';
import { createRandomizer, getRandomizedKeywords, getRandomizedKeywordsFromAll } from '../../../../services/scenario';
import { Randomizer } from '../../../../types/ScenarioTypes';
import ImportModal from '../../../common/ImportModal';
import { TabProps } from '../../types';
import './RandomizerTab.css';

export const RandomizerTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const randomizers = useMemo(() => scenario.randomizers?.randomizers || [], [scenario.randomizers?.randomizers]);
  const generalNotes = useMemo(() => scenario.randomizers?.generalNotes || '', [scenario.randomizers?.generalNotes]);
  const [expandedRandomizer, setExpandedRandomizer] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [previewKeywords, setPreviewKeywords] = useState<string[]>([]);
  const [newKeywordInputs, setNewKeywordInputs] = useState<{ [randomizerId: string]: string }>({});

  const handleAddRandomizer = useCallback(() => {
    const newRandomizer = createRandomizer('New Randomizer', [], 1);
    const updatedRandomizers = [...randomizers, newRandomizer];
    onScenarioChange({ 
      randomizers: { 
        randomizers: updatedRandomizers, 
        generalNotes 
      } 
    });
    setExpandedRandomizer(newRandomizer.id);
  }, [randomizers, generalNotes, onScenarioChange]);

  const handleRemoveRandomizer = useCallback((randomizerId: string) => {
    const updatedRandomizers = randomizers.filter(r => r.id !== randomizerId);
    onScenarioChange({ 
      randomizers: { 
        randomizers: updatedRandomizers, 
        generalNotes 
      } 
    });
    if (expandedRandomizer === randomizerId) {
      setExpandedRandomizer(null);
    }
  }, [randomizers, generalNotes, onScenarioChange, expandedRandomizer]);

  const handleRandomizerChange = useCallback((randomizerId: string, field: keyof Randomizer, value: any) => {
    const updatedRandomizers = randomizers.map(randomizer =>
      randomizer.id === randomizerId
        ? { ...randomizer, [field]: value, updatedAt: new Date().toISOString() }
        : randomizer
    );
    onScenarioChange({ 
      randomizers: { 
        randomizers: updatedRandomizers, 
        generalNotes 
      } 
    });
  }, [randomizers, generalNotes, onScenarioChange]);

  const handleAddKeyword = useCallback((randomizerId: string) => {
    const newKeyword = newKeywordInputs[randomizerId]?.trim();
    if (!newKeyword) return;

    const randomizer = randomizers.find(r => r.id === randomizerId);
    if (randomizer && !randomizer.keywords.includes(newKeyword)) {
      const updatedKeywords = [...randomizer.keywords, newKeyword];
      handleRandomizerChange(randomizerId, 'keywords', updatedKeywords);
      
      // Update selectedCount if it's greater than available keywords
      if (randomizer.selectedCount > updatedKeywords.length) {
        handleRandomizerChange(randomizerId, 'selectedCount', updatedKeywords.length);
      }
    }
    
    // Clear the input
    setNewKeywordInputs(prev => ({ ...prev, [randomizerId]: '' }));
  }, [randomizers, newKeywordInputs, handleRandomizerChange]);

  const handleRemoveKeyword = useCallback((randomizerId: string, keywordToRemove: string) => {
    const randomizer = randomizers.find(r => r.id === randomizerId);
    if (randomizer) {
      const updatedKeywords = randomizer.keywords.filter(k => k !== keywordToRemove);
      handleRandomizerChange(randomizerId, 'keywords', updatedKeywords);
      
      // Adjust selectedCount if necessary
      if (randomizer.selectedCount > updatedKeywords.length) {
        handleRandomizerChange(randomizerId, 'selectedCount', Math.max(1, updatedKeywords.length));
      }
    }
  }, [randomizers, handleRandomizerChange]);

  const handleKeywordInputChange = useCallback((randomizerId: string, value: string) => {
    setNewKeywordInputs(prev => ({ ...prev, [randomizerId]: value }));
  }, []);

  const handleKeywordInputKeyPress = useCallback((e: React.KeyboardEvent, randomizerId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword(randomizerId);
    }
  }, [handleAddKeyword]);

  const handleGeneralNotesChange = useCallback((notes: string) => {
    onScenarioChange({ 
      randomizers: { 
        randomizers, 
        generalNotes: notes 
      } 
    });
  }, [randomizers, onScenarioChange]);

  const toggleRandomizerExpanded = useCallback((randomizerId: string) => {
    setExpandedRandomizer(expandedRandomizer === randomizerId ? null : randomizerId);
  }, [expandedRandomizer]);

  const handleImport = useCallback((importedRandomizers: Randomizer[]) => {
    const existingIds = new Set(randomizers.map(r => r.id));
    const newRandomizers = importedRandomizers.map(rand => ({
      ...rand,
      id: existingIds.has(rand.id) ? crypto.randomUUID() : rand.id
    }));
    
    const updatedRandomizers = [...randomizers, ...newRandomizers];
    onScenarioChange({ 
      randomizers: { 
        randomizers: updatedRandomizers, 
        generalNotes 
      } 
    });
    setShowImportModal(false);
  }, [randomizers, generalNotes, onScenarioChange]);

  const handlePreviewRandomization = useCallback(() => {
    const keywords = getRandomizedKeywordsFromAll(randomizers.filter(r => r.isActive));
    setPreviewKeywords(keywords);
  }, [randomizers]);

  const handleSliderChange = useCallback((randomizerId: string, value: number) => {
    const randomizer = randomizers.find(r => r.id === randomizerId);
    if (randomizer && value <= randomizer.keywords.length && value >= 1) {
      handleRandomizerChange(randomizerId, 'selectedCount', value);
    }
  }, [randomizers, handleRandomizerChange]);

  return (
    <div className="randomizer-tab">
      <div className="randomizer-tab__header">
        <h3 className="randomizer-tab__title">Randomizers</h3>
        <div className="randomizer-tab__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowImportModal(true)}
            disabled={isLoading}
          >
            <FaDownload /> Import
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePreviewRandomization}
            disabled={isLoading}
          >
            <FaDice /> Preview
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddRandomizer}
            disabled={isLoading}
          >
            <FaPlus /> Add Randomizer
          </Button>
        </div>
      </div>

      {previewKeywords.length > 0 && (
        <div className="randomizer-tab__preview">
          <h4>Preview Keywords:</h4>
          <div className="randomizer-tab__preview-keywords">
            {previewKeywords.map((keyword, index) => (
              <span key={index} className="randomizer-tab__preview-keyword">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="randomizer-tab__content">
        {randomizers.length === 0 ? (
          <div className="randomizer-tab__empty">
            <p>No randomizers yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="randomizer-tab__list">
            {randomizers.map((randomizer) => (
              <div key={randomizer.id} className="randomizer-tab__item">
                <div className="randomizer-tab__item-header">
                  <div className="randomizer-tab__item-title" onClick={() => toggleRandomizerExpanded(randomizer.id)}>
                    <span>{randomizer.name || 'Unnamed Randomizer'}</span>
                    <span className="randomizer-tab__item-count">
                      ({randomizer.selectedCount}/{randomizer.keywords.length})
                    </span>
                  </div>
                  <div className="randomizer-tab__item-actions">
                    <button
                      className="randomizer-tab__toggle-btn"
                      onClick={() => handleRandomizerChange(randomizer.id, 'isActive', !randomizer.isActive)}
                      title={randomizer.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {randomizer.isActive ? <FaUser /> : <FaTimes />}
                    </button>
                    <button
                      className="randomizer-tab__preview-btn"
                      onClick={() => setPreviewKeywords(getRandomizedKeywords(randomizer))}
                      disabled={!randomizer.isActive}
                      title="Preview this randomizer"
                    >
                      <FaDice />
                    </button>
                    <button
                      className="randomizer-tab__remove-btn"
                      onClick={() => handleRemoveRandomizer(randomizer.id)}
                      title="Remove randomizer"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {expandedRandomizer === randomizer.id && (
                  <div className="randomizer-tab__item-details">
                    <div className="randomizer-tab__field">
                      <label>Name:</label>
                      <AiTextBox
                        value={randomizer.name}
                        onChange={(value) => handleRandomizerChange(randomizer.id, 'name', value)}
                        placeholder="Enter randomizer name"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="randomizer-tab__field">
                      <label>Description:</label>
                      <AiTextArea
                        value={randomizer.description || ''}
                        onChange={(value) => handleRandomizerChange(randomizer.id, 'description', value)}
                        placeholder="Optional description"
                        disabled={isLoading}
                        rows={2}
                      />
                    </div>

                    <div className="randomizer-tab__field">
                      <label>Keywords:</label>
                      <div className="randomizer-tab__keyword-input">
                        <input
                          type="text"
                          value={newKeywordInputs[randomizer.id] || ''}
                          onChange={(e) => handleKeywordInputChange(randomizer.id, e.target.value)}
                          placeholder="Enter a keyword and press Enter"
                          disabled={isLoading}
                          onKeyPress={(e) => handleKeywordInputKeyPress(e, randomizer.id)}
                          className="randomizer-tab__keyword-input-field"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddKeyword(randomizer.id)}
                          disabled={isLoading || !newKeywordInputs[randomizer.id]?.trim()}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="randomizer-tab__keywords-list">
                        {randomizer.keywords.map((keyword, index) => (
                          <span key={index} className="randomizer-tab__keyword-tag">
                            {keyword}
                            <button
                              className="randomizer-tab__keyword-remove"
                              onClick={() => handleRemoveKeyword(randomizer.id, keyword)}
                              disabled={isLoading}
                              title="Remove keyword"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {randomizer.keywords.length === 0 && (
                          <span className="randomizer-tab__no-keywords">No keywords yet. Add some above!</span>
                        )}
                      </div>
                    </div>

                    {randomizer.keywords.length > 0 && (
                      <div className="randomizer-tab__field">
                        <label>Number of keywords to select: {randomizer.selectedCount}</label>
                        <input
                          type="range"
                          min="1"
                          max={randomizer.keywords.length}
                          value={Math.min(randomizer.selectedCount, randomizer.keywords.length)}
                          onChange={(e) => handleSliderChange(randomizer.id, parseInt(e.target.value))}
                          className="randomizer-tab__slider"
                          disabled={isLoading}
                        />
                        <div className="randomizer-tab__slider-labels">
                          <span>1</span>
                          <span>{randomizer.keywords.length}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="randomizer-tab__notes">
          <label>General Notes:</label>
          <AiTextArea
            value={generalNotes}
            onChange={handleGeneralNotesChange}
            placeholder="Add any general notes about your randomizers..."
            disabled={isLoading}
            rows={4}
          />
        </div>
      </div>

      {showImportModal && (
        <ImportModal
          show={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
          extractContent={(scenario) => scenario.randomizers?.randomizers || []}
          title="Import Randomizers"
        />
      )}
    </div>
  );
};