import React from 'react';
import './DashboardCard.css';

interface DashboardCardProps {
  title: string;
  metadata: Array<{
    icon: string;
    text: string;
  }>;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'text';
  }>;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  metadata,
  actions
}) => {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-content">
        <h4 className="dashboard-card-title">{title}</h4>
        <div className="dashboard-card-metadata">
          {metadata.map((item, index) => (
            <span key={index} className="metadata-badge">
              <span className="metadata-icon">{item.icon}</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>
      <div className="dashboard-card-actions">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`btn ${action.variant ? `btn-${action.variant}` : 'btn-text'}`}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardCard;
