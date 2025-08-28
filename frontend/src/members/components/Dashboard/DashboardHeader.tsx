import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

interface DashboardHeaderProps {
  username?: string;
  email?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ username, email }) => {
  return (
    <header className="dashboard-header">
      <div className="welcome-section">
        <h1>Welcome back, {username || email || 'User'}!</h1>
        <p>Ready to create some amazing stories today?</p>
      </div>
      <Link to="/app" className="btn btn-primary btn-large" data-testid="start-writing-link">
        <span className="btn-icon">✏️</span>
        Start Writing
      </Link>
    </header>
  );
};

export default DashboardHeader;
