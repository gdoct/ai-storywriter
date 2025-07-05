import { AiTextBox, Button } from '@drdata/docomo';
import React, { useCallback, useMemo, useState } from 'react';
import { FaBook, FaCog, FaDownload, FaEye, FaPlus, FaUser } from 'react-icons/fa';
import { MultipleChapters } from '../../../../types/chapters';
import { TabProps } from '../../types';
import ChapterOverview from './components/ChapterOverview';
import ChaptersList from './components/ChaptersList';
import './MultipleChaptersTab.css';

export type MultipleChaptersSubTab = 'overview' | 'chapters' | 'structure' | 'generation' | 'analysis';

const MultipleChaptersTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<MultipleChaptersSubTab>('overview');
  const [showImportModal, setShowImportModal] = useState(false);

  // Initialize multiple chapters data if it doesn't exist
  const multipleChapters = useMemo((): MultipleChapters => {
    if (!scenario.multipleChapters) {
      return {
        chapters: [],
        chapterStructure: 'three-act',
        globalSettings: {
          namingConvention: 'Chapter %',
          defaultWordCount: 1500,
        },
        crossReferences: [],
      };
    }
    return scenario.multipleChapters;
  }, [scenario.multipleChapters]);

  const updateMultipleChapters = useCallback((updates: Partial<MultipleChapters>) => {
    const updatedMultipleChapters = { ...multipleChapters, ...updates };
    onScenarioChange({ multipleChapters: updatedMultipleChapters });
  }, [multipleChapters, onScenarioChange]);

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'overview':
        return (
          <ChapterOverview
            multipleChapters={multipleChapters}
            onMultipleChaptersChange={updateMultipleChapters}
            scenario={scenario}
            isLoading={isLoading}
          />
        );
      case 'chapters':
        return (
          <ChaptersList
            chapters={multipleChapters.chapters}
            onChaptersChange={(chapters) => updateMultipleChapters({ chapters })}
            scenario={scenario}
            isLoading={isLoading}
          />
        );
      case 'structure':
        return (
          <div className="multiple-chapters-tab__structure">
            <h4>Chapter Structure</h4>
            <div className="structure-settings">
              <div className="form-group">
                <label>Story Structure</label>
                <select 
                  value={multipleChapters.chapterStructure}
                  onChange={(e) => updateMultipleChapters({ chapterStructure: e.target.value })}
                  disabled={isLoading}
                >
                  <option value="three-act">Three-Act Structure</option>
                  <option value="hero-journey">Hero's Journey</option>
                  <option value="seven-point">Seven-Point Story Structure</option>
                  <option value="freytag">Freytag's Pyramid</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 'generation':
        return (
          <div className="multiple-chapters-tab__generation">
            <h4>Generation Settings</h4>
            <div className="global-settings">
              <AiTextBox
                label="Naming Convention"
                value={multipleChapters.globalSettings.namingConvention}
                onChange={(value) => updateMultipleChapters({
                  globalSettings: {
                    ...multipleChapters.globalSettings,
                    namingConvention: value
                  }
                })}
                placeholder="Use % for chapter number (e.g., 'Chapter %')"
                disabled={isLoading}
              />
              <AiTextBox
                label="Default Word Count Target"
                type="number"
                value={multipleChapters.globalSettings.defaultWordCount.toString()}
                onChange={(value) => updateMultipleChapters({
                  globalSettings: {
                    ...multipleChapters.globalSettings,
                    defaultWordCount: parseInt(value) || 1500
                  }
                })}
                disabled={isLoading}
              />
            </div>
          </div>
        );
      case 'analysis':
        return (
          <div className="multiple-chapters-tab__analysis">
            <h4>Story Analysis</h4>
            <p>Analysis features coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  const subTabs = [
    { id: 'overview' as const, label: 'Overview', icon: FaEye },
    { id: 'chapters' as const, label: 'Chapters', icon: FaBook },
    { id: 'structure' as const, label: 'Structure', icon: FaCog },
    { id: 'generation' as const, label: 'Generation', icon: FaPlus },
    { id: 'analysis' as const, label: 'Analysis', icon: FaUser },
  ];

  return (
    <div className="multiple-chapters-tab">
      <div className="multiple-chapters-tab__header">
        <h3 className="multiple-chapters-tab__title">Multiple Chapters</h3>
        <div className="multiple-chapters-tab__actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImportModal(true)}
            icon={<FaDownload />}
          >
            Import
          </Button>
        </div>
      </div>

      <div className="multiple-chapters-tab__content">
        <div className="multiple-chapters-tab__sub-tabs">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              className={`multiple-chapters-tab__sub-tab ${activeSubTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab.id)}
              disabled={isLoading}
            >
              <tab.icon className="multiple-chapters-tab__sub-tab-icon" />
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="multiple-chapters-tab__stats">
          <span className="multiple-chapters-tab__stat">
            Chapters: {multipleChapters.chapters.length}
          </span>
          <span className="multiple-chapters-tab__stat">
            Completed: {multipleChapters.chapters.filter(c => c.status === 'finalized').length}
          </span>
          <span className="multiple-chapters-tab__stat">
            Total Words: {multipleChapters.chapters.reduce((acc, c) => 
              acc + (c.generatedVersions.find(v => v.id === c.selectedVersionId)?.wordCount || 0), 0
            )}
          </span>
        </div>
      </div>

      <div className="multiple-chapters-tab__sub-content">
        {renderSubTabContent()}
      </div>
    </div>
  );
};

export default MultipleChaptersTab;
