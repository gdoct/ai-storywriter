import { AiTextArea } from '@drdata/ai-styles';
import React, { useCallback, useMemo } from 'react';
import { FaBook, FaUser } from 'react-icons/fa';
import { FillIn } from '../../../../types/ScenarioTypes';
import { TabProps } from '../../types';
import './FillInTab.css';

export const FillInTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty: _isDirty,
  isLoading,
}) => {
  const fillIn = useMemo(() => scenario.fillIn || {}, [scenario.fillIn]);

  const handleFillInChange = useCallback((updates: Partial<FillIn>) => {
    const updatedFillIn = { ...fillIn, ...updates };
    onScenarioChange({ fillIn: updatedFillIn });
  }, [fillIn, onScenarioChange]);

  return (
    <div className="fill-in-tab">
      <div className="fill-in-tab__header">
        <div className="fill-in-tab__title">
          <FaBook className="fill-in-tab__icon" />
          <h2>Fill-In Story</h2>
        </div>
        <p className="fill-in-tab__description">
          Provide the beginning and/or ending of your story, and let AI fill in the middle parts. 
          Both fields are optional - you can provide just the beginning, just the ending, or both.
        </p>
      </div>

      <div className="fill-in-tab__content">
        <div className="fill-in-tab__section">
          <div className="fill-in-tab__section-header">
            <FaUser className="fill-in-tab__section-icon" />
            <h3>Story Beginning</h3>
            <span className="fill-in-tab__optional">Optional</span>
          </div>
          <p className="fill-in-tab__section-description">
            Start your {scenario.writingStyle?.genre ?? 'custom'} story here. The AI will continue from this point.
          </p>
          <AiTextArea
            value={fillIn.beginning || ''}
            onChange={(value) => handleFillInChange({ beginning: value })}
            placeholder="Once upon a time, in a small village nestled between rolling hills..."
            rows={6}
            className="fill-in-tab__textarea"
            disabled={isLoading}
          />
        </div>

        <div className="fill-in-tab__section">
          <div className="fill-in-tab__section-header">
            <FaBook className="fill-in-tab__section-icon" />
            <h3>Story Ending</h3>
            <span className="fill-in-tab__optional">Optional</span>
          </div>
          <p className="fill-in-tab__section-description">
            How should your story conclude? The AI will work towards this ending.
          </p>
          <AiTextArea
            value={fillIn.ending || ''}
            onChange={(value) => handleFillInChange({ ending: value })}
            placeholder="...and they all lived happily ever after, knowing that their adventure had changed them forever."
            rows={6}
            className="fill-in-tab__textarea"
            disabled={isLoading}
          />
        </div>

        {(fillIn.beginning?.trim() || fillIn.ending?.trim()) && (
          <div className="fill-in-tab__preview">
            <h4>Story Structure Preview:</h4>
            <div className="fill-in-tab__structure">
              {fillIn.beginning?.trim() && (
                <div className="fill-in-tab__structure-part beginning">
                  <span className="fill-in-tab__structure-label">Beginning (You)</span>
                  <div className="fill-in-tab__structure-content">
                    {fillIn.beginning.substring(0, 100)}
                    {fillIn.beginning.length > 100 && '...'}
                  </div>
                </div>
              )}
              
              <div className="fill-in-tab__structure-part middle">
                <span className="fill-in-tab__structure-label">Middle (AI)</span>
                <div className="fill-in-tab__structure-content ai-generated">
                  The AI will generate the middle part of your story here...
                </div>
              </div>
              
              {fillIn.ending?.trim() && (
                <div className="fill-in-tab__structure-part ending">
                  <span className="fill-in-tab__structure-label">Ending (You)</span>
                  <div className="fill-in-tab__structure-content">
                    {fillIn.ending.substring(0, 100)}
                    {fillIn.ending.length > 100 && '...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FillInTab;