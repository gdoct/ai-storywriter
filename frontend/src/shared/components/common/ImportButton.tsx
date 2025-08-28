import React from 'react';
import '../ScenarioWriter/common/TabStylesNew.css';

interface ImportButtonProps {
  onClick: () => void;
  title: string;
  label?: string;
}

const ImportButton: React.FC<ImportButtonProps> = ({ onClick, title, label }) => {
  return (
    <button 
      className="tab-btn tab-btn-import"
      onClick={onClick} 
      title={title}
    >
      <span className="tab-btn-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1V9M8 9L5 6M8 9L11 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12H14V15H2V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </span>
      {label || 'Import'}
    </button>
  );
};

export default ImportButton;
