import React from 'react';
import { DashboardStats, formatRelativeTime } from '../../services/dashboardService';

interface WritingStatsProps {
  stats: DashboardStats;
}

const WritingStats: React.FC<WritingStatsProps> = ({ stats }) => {
  return (
    <div className="stats-section">
      <h2>Your Writing Stats</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📖</div>
          <div className="stat-content">
            <div className="stat-number">{stats.scenariosCreated}</div>
            <div className="stat-label">Scenarios Created</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✍️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.storiesGenerated.toLocaleString()}</div>
            <div className="stat-label">Stories generated</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <div className="stat-number">{stats.modelsUsed}</div>
            <div className="stat-label">AI Models Used</div>
          </div>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">✍️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.storiesPublished}</div>
            <div className="stat-label">Stories published</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <div className="stat-number">{stats.scenariosPublished}</div>
            <div className="stat-label">Scenarios published</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-number">{formatRelativeTime(stats.lastActivity)}</div>
            <div className="stat-label">Last Activity</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingStats;
