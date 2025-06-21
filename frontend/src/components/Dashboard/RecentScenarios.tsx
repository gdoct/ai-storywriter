import React from 'react';
import { Link } from 'react-router-dom';
import { formatRelativeTime, RecentScenario } from '../../services/dashboardService';
import DashboardCard from './DashboardCard';

interface RecentScenariosProps {
  recentScenarios: RecentScenario[];
  handleEditScenario: (scenarioId: string) => void;
}

const RecentScenarios: React.FC<RecentScenariosProps> = ({
  recentScenarios,
  handleEditScenario,
}) => {
  return (
    <div className="recent-stories-section">
      <div className="section-header">
        <h3>Recent Scenarios</h3>
        <Link to="/scenarios" className="btn btn-secondary btn-small btn__scenarios_all">View All</Link>
      </div>
      <div className="stories-list">
        {recentScenarios.map(scenario => (
          <DashboardCard
            key={scenario.id}
            title={scenario.title}
            metadata={[
              { icon: "📅", text: formatRelativeTime(scenario.lastModified) },
              { icon: "📝", text: `${scenario.generatedStoryCount} generated stories` }
            ]}
            actions={[
              {
                label: "Edit",
                onClick: () => handleEditScenario(scenario.id),
                variant: "text"
              },
            ]}
          />
        ))}
        {recentScenarios.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h4>No scenarios yet</h4>
            <p>Create your first scenario to get started!</p>
            <Link to="/app" className="btn btn-primary">Start Writing</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentScenarios;
