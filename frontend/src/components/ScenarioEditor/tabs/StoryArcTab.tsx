import React, { useCallback, useState } from 'react';
import { FaDownload, FaProjectDiagram, FaTimes } from 'react-icons/fa';
import { useAuthenticatedUser } from '../../../contexts/AuthenticatedUserContext';
import { generateStoryArc, rewriteStoryArc } from '../../../services/storyGenerator';
import ImportModal from '../../common/ImportModal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TabProps } from '../types';
import './StoryArcTab.css';

export const StoryArcTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);
  const { refreshCredits } = useAuthenticatedUser();

  const handleStoryArcChange = useCallback((value: string) => {
    onScenarioChange({ storyarc: value });
  }, [onScenarioChange]);

  const handleGenerateStoryArc = useCallback(async () => {
    try {
      setIsGenerating(true);
      onScenarioChange({ storyarc: '' }); // Clear existing content
      
      let accumulated = '';
      const generationResult = await generateStoryArc(
        scenario,
        {
          onProgress: (generatedText) => {
            accumulated += generatedText;
            onScenarioChange({ storyarc: accumulated });
          }
        }
      );
      
      setCancelGeneration(() => generationResult.cancelGeneration);
      
      try {
        const generatedStoryArc = await generationResult.result;
        onScenarioChange({ storyarc: generatedStoryArc });
        // Refresh credits after successful generation with a small delay
        setTimeout(() => {
          refreshCredits();
        }, 1000);
      } catch (error) {
        console.log('Story arc generation was interrupted:', error);
        // Keep the accumulated text
        // Still refresh credits in case of partial consumption with a small delay
        setTimeout(() => {
          refreshCredits();
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating story arc:', error);
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  }, [scenario, onScenarioChange]);

  const handleRewriteStoryArc = useCallback(async () => {
    if (!scenario.storyarc || scenario.storyarc.trim() === '') {
      return;
    }
    
    try {
      setIsGenerating(true);
      onScenarioChange({ storyarc: '' }); // Clear existing content
      
      let accumulated = '';
      const generationResult = await rewriteStoryArc(
        scenario,
        {
          onProgress: (generatedText) => {
            accumulated += generatedText;
            onScenarioChange({ storyarc: accumulated });
          }
        }
      );
      
      setCancelGeneration(() => generationResult.cancelGeneration);
      
      try {
        const rewrittenStoryArc = await generationResult.result;
        onScenarioChange({ storyarc: rewrittenStoryArc });
        // Refresh credits after successful generation with a small delay
        setTimeout(() => {
          refreshCredits();
        }, 1000);
      } catch (error) {
        console.log('Story arc rewriting was interrupted:', error);
        // Keep the accumulated text
        // Still refresh credits in case of partial consumption with a small delay
        setTimeout(() => {
          refreshCredits();
        }, 1000);
      }
    } catch (error) {
      console.error('Error rewriting story arc:', error);
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  }, [scenario, onScenarioChange]);

  const handleCancelGeneration = useCallback(() => {
    if (cancelGeneration) {
      cancelGeneration();
    }
  }, [cancelGeneration]);

  const handleImport = useCallback((importedContent: string) => {
    onScenarioChange({ storyarc: importedContent });
  }, [onScenarioChange]);

  return (
    <div className="storyarc-tab">
      <div className="storyarc-tab__header">
        <div className="storyarc-tab__title-section">
          <div className="storyarc-tab__icon">
            <FaProjectDiagram />
          </div>
          <h3 className="storyarc-tab__title">Story Arc & Plot</h3>
        </div>
        
        <div className="storyarc-tab__actions">
          {!isGenerating ? (
            <>
              <Button
                variant="primary"
                onClick={handleGenerateStoryArc}
                disabled={isLoading}
              >
                ✨ Generate Story Arc
              </Button>
              <Button
                variant="secondary"
                onClick={handleRewriteStoryArc}
                disabled={isLoading || !scenario.storyarc || scenario.storyarc.trim() === ''}
              >
                ✨ Rewrite Story Arc
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowImportModal(true)}
                icon={<FaDownload />}
              >
                Import
              </Button>
            </>
          ) : (
            <Button
              variant="danger"
              onClick={handleCancelGeneration}
              icon={<FaTimes />}
            >
              Cancel Generation
            </Button>
          )}
        </div>
      </div>

      <p className="storyarc-tab__description">
        Outline the main plot structure, key story beats, and character development arcs. 
        This should include the story's progression from beginning to end, major plot points, 
        conflicts, and resolution.
      </p>

      <div className="storyarc-tab__content">
        <Input
          label="Story Arc"
          value={scenario.storyarc || ''}
          onChange={handleStoryArcChange}
          placeholder="Outline your story's plot structure. Include the opening, inciting incident, rising action, climax, falling action, and resolution. Describe key plot points, character development, conflicts, and how the story progresses..."
          multiline
          rows={15}
          disabled={isGenerating}
        />
        
        <div className="storyarc-tab__hints">
          <h4 className="storyarc-tab__hints-title">Story Structure Elements:</h4>
          <div className="storyarc-tab__structure">
            <div className="storyarc-tab__structure-item">
              <h5>Opening/Setup</h5>
              <p>Introduce characters, setting, and normal world</p>
            </div>
            <div className="storyarc-tab__structure-item">
              <h5>Inciting Incident</h5>
              <p>The event that starts the main conflict</p>
            </div>
            <div className="storyarc-tab__structure-item">
              <h5>Rising Action</h5>
              <p>Building tension and developing conflicts</p>
            </div>
            <div className="storyarc-tab__structure-item">
              <h5>Climax</h5>
              <p>The highest point of tension and main confrontation</p>
            </div>
            <div className="storyarc-tab__structure-item">
              <h5>Falling Action</h5>
              <p>Events following the climax</p>
            </div>
            <div className="storyarc-tab__structure-item">
              <h5>Resolution</h5>
              <p>Conclusion and new equilibrium</p>
            </div>
          </div>
        </div>
      </div>

      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Story Arc"
        onImport={handleImport}
        extractContent={(scenario) => scenario.storyarc || ''}
      />
    </div>
  );
};
