import React, { useState } from 'react';
import { ExpandableTabs } from '@drdata/docomo';
import { FaBook, FaUser, FaUsers } from 'react-icons/fa';

// Simple test data for the tabs
const testTabs = [
  {
    id: 'general',
    label: 'General',
    icon: FaBook,
    component: () => <div style={{ padding: '20px' }}>General Tab Content</div>,
    optional: false,
  },
  {
    id: 'characters',
    label: 'Characters',
    icon: FaUsers,
    component: () => <div style={{ padding: '20px' }}>Characters Tab Content</div>,
    optional: true,
  },
  {
    id: 'backstory',
    label: 'Backstory',
    icon: FaUser,
    component: () => <div style={{ padding: '20px' }}>Backstory Tab Content</div>,
    optional: true,
  },
];

const Test: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [visibleTabs, setVisibleTabs] = useState(['general']);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleTabAdd = (tabId: string) => {
    if (!visibleTabs.includes(tabId)) {
      setVisibleTabs([...visibleTabs, tabId]);
    }
  };

  const handleTabRemove = (tabId: string) => {
    if (tabId !== 'general') { // Don't allow removing general tab
      setVisibleTabs(visibleTabs.filter(id => id !== tabId));
      if (activeTab === tabId) {
        setActiveTab('general');
      }
    }
  };

  // Get the active tab component
  const activeTabConfig = testTabs.find(tab => tab.id === activeTab);
  const ActiveTabComponent = activeTabConfig?.component;

  return (
    <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1>ExpandableTabs Test Page</h1>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ExpandableTabs
          tabs={testTabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          visibleTabs={visibleTabs}
          onTabAdd={handleTabAdd}
          onTabRemove={handleTabRemove}
        />

        <div style={{ flex: 1, background: 'white', padding: '20px', marginTop: '10px' }}>
          {ActiveTabComponent && <ActiveTabComponent />}
        </div>
      </div>
    </div>
  );
};

export default Test;