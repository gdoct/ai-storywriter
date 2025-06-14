import React from 'react';

interface ScenarioDropdownProps {
  scenarios: { id: string; title: string; synopsis: string }[];
  selectedScenarioId: string;
  setSelectedScenarioId: (id: string) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  handleDeleteRequest: (id: string, event?: React.MouseEvent) => void;
}

const ScenarioDropdown: React.FC<ScenarioDropdownProps> = ({
  scenarios,
  selectedScenarioId,
  setSelectedScenarioId,
  isDropdownOpen,
  setIsDropdownOpen,
  dropdownRef,
  handleDeleteRequest,
}) => (
  <div className="scenario-select-wrapper">
    <div className="custom-dropdown" ref={dropdownRef}>
      <button
        className="dropdown-toggle tab-btn tab-btn-default"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        {selectedScenarioId
          ? scenarios.find((s) => s.id === selectedScenarioId)?.title
          : 'Select a scenario'}
        <span style={{ marginLeft: 8, color: '#90caf9' }}>▼</span>
      </button>
      {isDropdownOpen && (
        <div
          className="dropdown-menu"
          style={{
            background: '#23272e',
            color: '#e6e6e6',
            border: '1.5px solid #353b45',
            borderRadius: '10px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.32)',
            marginTop: '6px',
            minWidth: '220px',
            zIndex: 30,
          }}
        >
          {scenarios.length === 0 && (
            <div className="dropdown-item disabled" style={{ color: '#888', background: 'none' }}>
              No scenarios found
            </div>
          )}
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`dropdown-item ${scenario.id === selectedScenarioId ? 'active' : ''}`}
              style={{
                background: scenario.id === selectedScenarioId ? '#353b45' : 'none',
                color: '#e6e6e6',
                padding: '12px 18px',
                cursor: 'pointer',
                fontWeight: scenario.id === selectedScenarioId ? 600 : 500,
                borderLeft: scenario.id === selectedScenarioId ? '4px solid #61dafb' : '4px solid transparent',
                transition: 'background 0.15s, color 0.15s',
              }}
              onClick={() => {
                if (scenario.id !== selectedScenarioId) {
                  setSelectedScenarioId(scenario.id);
                }
                setIsDropdownOpen(false);
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#353b45';
                e.currentTarget.style.color = '#61dafb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = scenario.id === selectedScenarioId ? '#353b45' : 'none';
                e.currentTarget.style.color = '#e6e6e6';
              }}
            >
              <span>{scenario.title || '(Untitled)'}</span>
              <button
                className="card-btn card-btn-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRequest(scenario.id);
                }}
                title="Delete scenario"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default ScenarioDropdown;
