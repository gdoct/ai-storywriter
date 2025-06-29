import React from 'react';
import { FaBook, FaCog, FaPlus, FaUser } from 'react-icons/fa';
import { Chapter, MultipleChapters } from '../../../../../types/chapters';
import { Scenario } from '../../../../../types/ScenarioTypes';
import { Button } from '../../../common/Button';

interface ChapterOverviewProps {
  multipleChapters: MultipleChapters;
  onMultipleChaptersChange: (updates: Partial<MultipleChapters>) => void;
  scenario: Scenario;
  isLoading: boolean;
}

const ChapterOverview: React.FC<ChapterOverviewProps> = ({
  multipleChapters,
  onMultipleChaptersChange,
  scenario,
  isLoading
}) => {
  const { chapters } = multipleChapters;

  const stats = {
    total: chapters.length,
    planned: chapters.filter(c => c.status === 'planned').length,
    drafted: chapters.filter(c => c.status === 'drafted').length,
    finalized: chapters.filter(c => c.status === 'finalized').length,
    totalWords: chapters.reduce((acc, chapter) => {
      const selectedVersion = chapter.generatedVersions.find(v => v.id === chapter.selectedVersionId);
      return acc + (selectedVersion?.wordCount || 0);
    }, 0),
    targetWords: chapters.reduce((acc, chapter) => acc + chapter.wordCountTarget, 0)
  };

  const handleCreateFirstChapter = () => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: 'Chapter 1',
      number: 1,
      description: '',
      status: 'planned',
      wordCountTarget: multipleChapters.globalSettings.defaultWordCount,
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

    onMultipleChaptersChange({
      chapters: [newChapter]
    });
  };

  if (chapters.length === 0) {
    return (
      <div className="chapter-overview chapter-overview--empty">
        <div className="chapter-overview__empty-state">
          <FaBook className="chapter-overview__empty-icon" />
          <h4>No Chapters Yet</h4>
          <p>Start organizing your story by creating your first chapter.</p>
          <Button
            variant="primary"
            onClick={handleCreateFirstChapter}
            disabled={isLoading}
            icon={<FaPlus />}
          >
            Create First Chapter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="chapter-overview">
      <div className="chapter-overview__stats">
        <div className="chapter-overview__stat-grid">
          <div className="chapter-overview__stat-card">
            <div className="chapter-overview__stat-value">{stats.total}</div>
            <div className="chapter-overview__stat-label">Total Chapters</div>
          </div>
          <div className="chapter-overview__stat-card">
            <div className="chapter-overview__stat-value">{stats.finalized}</div>
            <div className="chapter-overview__stat-label">Completed</div>
          </div>
          <div className="chapter-overview__stat-card">
            <div className="chapter-overview__stat-value">{stats.totalWords.toLocaleString()}</div>
            <div className="chapter-overview__stat-label">Words Written</div>
          </div>
          <div className="chapter-overview__stat-card">
            <div className="chapter-overview__stat-value">{stats.targetWords.toLocaleString()}</div>
            <div className="chapter-overview__stat-label">Target Words</div>
          </div>
        </div>
      </div>

      <div className="chapter-overview__progress">
        <h4>Progress Overview</h4>
        <div className="chapter-overview__progress-bars">
          <div className="chapter-overview__progress-item">
            <span className="chapter-overview__progress-label">Planned ({stats.planned})</span>
            <div className="chapter-overview__progress-bar">
              <div 
                className="chapter-overview__progress-fill chapter-overview__progress-fill--planned"
                style={{ width: `${stats.total > 0 ? (stats.planned / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="chapter-overview__progress-item">
            <span className="chapter-overview__progress-label">Drafted ({stats.drafted})</span>
            <div className="chapter-overview__progress-bar">
              <div 
                className="chapter-overview__progress-fill chapter-overview__progress-fill--drafted"
                style={{ width: `${stats.total > 0 ? (stats.drafted / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="chapter-overview__progress-item">
            <span className="chapter-overview__progress-label">Finalized ({stats.finalized})</span>
            <div className="chapter-overview__progress-bar">
              <div 
                className="chapter-overview__progress-fill chapter-overview__progress-fill--finalized"
                style={{ width: `${stats.total > 0 ? (stats.finalized / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="chapter-overview__recent">
        <h4>Recent Activity</h4>
        <div className="chapter-overview__activity-list">
          {chapters.slice(0, 5).map(chapter => (
            <div key={chapter.id} className="chapter-overview__activity-item">
              <div className="chapter-overview__activity-icon">
                {chapter.status === 'finalized' ? <FaBook /> : 
                 chapter.status === 'drafted' ? <FaCog /> : <FaUser />}
              </div>
              <div className="chapter-overview__activity-content">
                <span className="chapter-overview__activity-title">{chapter.title}</span>
                <span className="chapter-overview__activity-status">
                  {chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChapterOverview;
