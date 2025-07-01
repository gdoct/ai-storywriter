import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '@drdata/docomo';
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
    <Card>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--spacing-lg)',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: 'var(--spacing-md)'
      }}>
        <h3 style={{ 
          fontSize: 'var(--font-size-lg)', 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          margin: 0
        }}>
          Recent Scenarios
        </h3>
        <Button as={Link} to="/scenarios" variant="secondary" size="sm">
          View All
        </Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
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
          <div style={{ 
            textAlign: 'center',
            padding: 'var(--spacing-4xl)',
            color: 'var(--color-text-secondary)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-lg)' }}>📝</div>
            <h4 style={{ 
              fontSize: 'var(--font-size-lg)', 
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              No scenarios yet
            </h4>
            <p style={{ 
              marginBottom: 'var(--spacing-xl)',
              fontSize: 'var(--font-size-md)'
            }}>
              Create your first scenario to get started!
            </p>
            <Button as={Link} to="/app" variant="primary">
              Start Writing
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecentScenarios;
