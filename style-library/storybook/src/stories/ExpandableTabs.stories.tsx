import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FaBook, FaDice, FaEye, FaStickyNote, FaUsers } from 'react-icons/fa';
import { ExpandableTabs, ThemeProvider, ThemeToggle, type TabConfig } from '../../../ai-styles/src';

const meta: Meta<typeof ExpandableTabs> = {
  title: 'Components/ExpandableTabs',
  component: ExpandableTabs,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <div style={{ width: '100%', maxWidth: '800px', padding: '2rem' }}>
          <ThemeToggle />
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ExpandableTabs>;

const mockTabs: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    icon: FaBook,
    optional: false, // Cannot be removed
  },
  {
    id: 'characters',
    label: 'Characters',
    icon: FaUsers,
    optional: true,
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: FaStickyNote,
    optional: true,
  },
  {
    id: 'storyarc',
    label: 'Story Arc',
    icon: FaEye,
    optional: true,
  },
  {
    id: 'worldbuilding',
    label: 'World Building',
    icon: FaDice,
    optional: true,
  },
];

// Sample content components for each tab
const TabContent = ({ tabId }: { tabId: string }) => {
  const contentMap: Record<string, React.ReactNode> = {
    general: (
      <div style={{ padding: '1rem' }}>
        <h3>General Tab</h3>
        <p>This is the general information tab. It cannot be removed and is always visible.</p>
        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title:</label>
          <input type="text" placeholder="Enter story title..." style={{ width: '100%', padding: '0.5rem' }} />
        </div>
      </div>
    ),
    characters: (
      <div style={{ padding: '1rem' }}>
        <h3>Characters Tab</h3>
        <p>Manage your story characters here.</p>
        <button style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>Add Character</button>
      </div>
    ),
    notes: (
      <div style={{ padding: '1rem' }}>
        <h3>Notes Tab</h3>
        <p>Keep track of important story notes and ideas.</p>
        <textarea 
          placeholder="Enter your notes..." 
          style={{ width: '100%', height: '100px', padding: '0.5rem', marginTop: '1rem' }}
        />
      </div>
    ),
    storyarc: (
      <div style={{ padding: '1rem' }}>
        <h3>Story Arc Tab</h3>
        <p>Plan your story's structure and progression.</p>
        <div style={{ marginTop: '1rem' }}>
          <div>Act 1: Setup</div>
          <div>Act 2: Confrontation</div>
          <div>Act 3: Resolution</div>
        </div>
      </div>
    ),
    worldbuilding: (
      <div style={{ padding: '1rem' }}>
        <h3>World Building Tab</h3>
        <p>Create and develop your story's world and setting.</p>
        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Setting:</label>
          <input type="text" placeholder="Describe the setting..." style={{ width: '100%', padding: '0.5rem' }} />
        </div>
      </div>
    ),
  };

  return <>{contentMap[tabId] || <div>Content for {tabId}</div>}</>;
};

export const Default: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('general');
    const [visibleTabs, setVisibleTabs] = useState(['general', 'characters']);

    const handleTabAdd = (tabId: string) => {
      console.log('Adding tab:', tabId);
      setVisibleTabs(prev => [...prev, tabId]);
      setActiveTab(tabId);
    };

    const handleTabRemove = (tabId: string) => {
      console.log('Removing tab:', tabId);
      setVisibleTabs(prev => prev.filter(id => id !== tabId));
      if (activeTab === tabId) {
        setActiveTab('general');
      }
    };

    const handleTabChange = (tabId: string) => {
      console.log('Switching to tab:', tabId);
      setActiveTab(tabId);
    };

    return (
      <div>
        <ExpandableTabs
          tabs={mockTabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          visibleTabs={visibleTabs}
          onTabAdd={handleTabAdd}
          onTabRemove={handleTabRemove}
        />
        
        {/* External content rendering - this is where the actual tab content goes */}
        <div style={{ 
          marginTop: '1rem', 
          border: '1px solid var(--color-border, #e5e7eb)', 
          borderRadius: '8px',
          backgroundColor: 'var(--color-surface, white)'
        }}>
          <TabContent tabId={activeTab} />
        </div>
      </div>
    );
  },
};

export const WithoutAddRemove: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('general');

    return (
      <div>
        <ExpandableTabs
          tabs={mockTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          visibleTabs={['general', 'characters', 'notes']}
          // No onTabAdd/onTabRemove means no add/remove functionality
        />
        
        <div style={{ 
          marginTop: '1rem', 
          border: '1px solid var(--color-border, #e5e7eb)', 
          borderRadius: '8px',
          backgroundColor: 'var(--color-surface, white)'
        }}>
          <TabContent tabId={activeTab} />
        </div>
      </div>
    );
  },
};
