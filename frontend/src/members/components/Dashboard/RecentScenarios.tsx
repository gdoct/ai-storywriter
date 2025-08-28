import { Button } from '@drdata/ai-styles';
import React from 'react';
import { Link } from 'react-router-dom';
import { formatRelativeTime, RecentScenario } from '../../../shared/services/dashboardService';
import './Dashboard.css';

interface RecentScenariosProps {
  recentScenarios: RecentScenario[];
  handleEditScenario: (scenarioId: string) => void;
  handleGenerateSimilar: (scenarioId: string) => void;
}

const RecentScenarios: React.FC<RecentScenariosProps> = ({
  recentScenarios,
  handleEditScenario,
  handleGenerateSimilar,
}) => { 
  return (
    <div className="recent-section">
      {/* Header row - 20% height */}
      <div className="recent-section-header">
        <h3 className="recent-section-title">
          <span className="recent-section-icon">📝</span>
          Recent Scenarios
        </h3>
        <Button as={Link} to="/scenarios" variant="secondary" size="sm">
          View All
        </Button>
      </div>

      {/* Content row - 80% height */}
      <div className="recent-section-content">
        {recentScenarios.length === 0 ? (
          <div className="recent-section-empty">
            <div className="recent-section-empty-icon">📝</div>
            <h4 className="recent-section-empty-title">No scenarios yet</h4>
            <p className="recent-section-empty-description">
              Create your first scenario to get started!
            </p>
            <Button as={Link} to="/app" variant="primary">
              Start Writing
            </Button>
          </div>
        ) : (
          <div>
            {recentScenarios.map((scenario) => (
                <div key={scenario.id} className="recent-item">
                <div className="recent-item-image">
                  <img
                  src={scenario.imageUrl || '/placeholder-image.png'}
                  alt={scenario.title || 'Scenario Image'}
                  className="recent-item-thumbnail"
                  />
                </div>
                <div className="recent-item-content">
                  <h4 className="recent-item-title">{scenario.title || 'Untitled'}</h4>
                  <p className="recent-item-meta">
                  📅 {formatRelativeTime(scenario.lastModified)} • 
                  📝 {scenario.generatedStoryCount} generated stories
                  </p>
                  <div style={{ marginTop: 'var(--spacing-sm)', display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleEditScenario(scenario.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleGenerateSimilar(scenario.id)}
                  >
                    Generate Similar...
                  </Button>
                  </div>
                </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentScenarios;
