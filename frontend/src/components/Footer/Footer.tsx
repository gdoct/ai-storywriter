import React from 'react';
import StatusIndicator from './StatusIndicator';
import ModelSelector from './ModelSelector';
import ModelSettings from './ModelSettings';
import './NewFooter.css';

interface FooterProps {
  isLoading: boolean;
  onSeedChange?: (seed: number | null) => void;
}

const Footer: React.FC<FooterProps> = ({ isLoading, onSeedChange }) => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-section footer-status">
          <StatusIndicator />
        </div>
        
        <div className="footer-section footer-model">
          <ModelSelector />
        </div>
        
        <div className="footer-section footer-settings">
          <ModelSettings isLoading={isLoading} onSeedChange={onSeedChange} />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
