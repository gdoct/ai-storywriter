import { Button } from '@drdata/ai-styles';
import React, { useState } from 'react';
import { FaCog, FaPlus, FaUser } from 'react-icons/fa';
import { Chapter } from '../../../../../types/chapters';
import { Scenario } from '../../../../../types/ScenarioTypes';
import ChapterCard from './ChapterCard';

interface ChaptersListProps {
  chapters: Chapter[];
  onChaptersChange: (chapters: Chapter[]) => void;
  scenario: Scenario;
  isLoading: boolean;
}

const ChaptersList: React.FC<ChaptersListProps> = ({
  chapters,
  onChaptersChange,
  scenario,
  isLoading
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddChapter = () => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: `Chapter ${chapters.length + 1}`,
      number: chapters.length + 1,
      description: '',
      status: 'planned',
      wordCountTarget: scenario.multipleChapters?.globalSettings.defaultWordCount || 1500,
      generatedVersions: [],
      selectedVersionId: null,
      customContent: '',
      synopsis: {
        shortSummary: '',
        detailedSummary: '',
        keyEvents: [],
        characterDevelopments: []
      },
      outline: null,
      objectives: null,
      plotPoints: null,
      characterArcs: null,
      linkedEvents: [],
      linkedCharacters: [],
      linkedLocations: [],
      linkedThemes: []
    };

    onChaptersChange([...chapters, newChapter]);
  };

  const handleUpdateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    const updatedChapters = chapters.map(chapter =>
      chapter.id === chapterId ? { ...chapter, ...updates } : chapter
    );
    onChaptersChange(updatedChapters);
  };

  const handleDeleteChapter = (chapterId: string) => {
    const filteredChapters = chapters.filter(chapter => chapter.id !== chapterId);
    // Renumber chapters
    const renumberedChapters = filteredChapters.map((chapter, index) => ({
      ...chapter,
      number: index + 1,
      title: chapter.title.replace(/Chapter \d+/, `Chapter ${index + 1}`)
    }));
    onChaptersChange(renumberedChapters);
  };

  const handleReorderChapters = (fromIndex: number, toIndex: number) => {
    const reorderedChapters = [...chapters];
    const [movedChapter] = reorderedChapters.splice(fromIndex, 1);
    reorderedChapters.splice(toIndex, 0, movedChapter);
    
    // Renumber chapters
    const renumberedChapters = reorderedChapters.map((chapter, index) => ({
      ...chapter,
      number: index + 1
    }));
    
    onChaptersChange(renumberedChapters);
  };

  if (chapters.length === 0) {
    return (
      <div className="chapters-list chapters-list--empty">
        <div className="chapters-list__empty-state">
          <h4>No Chapters Created</h4>
          <p>Start building your story by adding your first chapter.</p>
          <Button
            variant="primary"
            onClick={handleAddChapter}
            disabled={isLoading}
            icon={<FaPlus />}
          >
            Add First Chapter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="chapters-list">
      <div className="chapters-list__header">
        <div className="chapters-list__controls">
          <div className="chapters-list__view-toggle">
            <button
              className={`chapters-list__view-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              disabled={isLoading}
            >
              <FaCog />
            </button>
            <button
              className={`chapters-list__view-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              disabled={isLoading}
            >
              <FaUser />
            </button>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddChapter}
            disabled={isLoading}
            icon={<FaPlus />}
          >
            Add Chapter
          </Button>
        </div>
      </div>

      <div className={`chapters-list__content chapters-list__content--${viewMode}`}>
        {chapters.map((chapter, index) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            index={index}
            viewMode={viewMode}
            onUpdate={(updates) => handleUpdateChapter(chapter.id, updates)}
            onDelete={() => handleDeleteChapter(chapter.id)}
            onReorder={handleReorderChapters}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};

export default ChaptersList;
