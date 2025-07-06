import { fireEvent, render, screen } from '@testing-library/react';
import { FaBook, FaStickyNote } from 'react-icons/fa';
import { ExpandableTabs, TabConfig } from './ExpandableTabs';
import { ThemeProvider } from '../../providers/ThemeProvider';

describe('ExpandableTabs', () => {
  const mockTabs: TabConfig[] = [
    {
      id: 'general',
      label: 'General',
      icon: FaBook,
      optional: false
    },
    {
      id: 'notes', 
      label: 'Notes',
      icon: FaStickyNote,
      optional: true
    },
    {
      id: 'characters',
      label: 'Characters', 
      icon: FaBook,
      optional: true
    }
  ];

  const mockOnTabChange = jest.fn();
  const mockOnTabAdd = jest.fn();
  const mockOnTabRemove = jest.fn();

  // Helper to render with ThemeProvider
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider defaultTheme="light">
        {ui}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders visible tabs', () => {
    renderWithTheme(
      <ExpandableTabs
        tabs={mockTabs}
        activeTab="general"
        onTabChange={mockOnTabChange}
        visibleTabs={['general', 'notes']}
      />
    );
    
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.queryByText('Characters')).not.toBeInTheDocument();
  });

  it('shows active tab with correct styling', () => {
    renderWithTheme(
      <ExpandableTabs
        tabs={mockTabs}
        activeTab="notes"
        onTabChange={mockOnTabChange}
        visibleTabs={['general', 'notes']}
      />
    );
    
    const notesTab = screen.getByTestId('notes-tab');
    expect(notesTab).toHaveClass('ai-expandable-tabs__tab--active');
  });

  it('calls onTabChange when tab is clicked', () => {
    renderWithTheme(
      <ExpandableTabs
        tabs={mockTabs}
        activeTab="general"
        onTabChange={mockOnTabChange}
        visibleTabs={['general', 'notes']}
      />
    );
    
    fireEvent.click(screen.getByText('Notes'));
    expect(mockOnTabChange).toHaveBeenCalledWith('notes');
  });

  it('shows add tab button when there are hidden optional tabs', () => {
    renderWithTheme(
      <ExpandableTabs
        tabs={mockTabs}
        activeTab="general"
        onTabChange={mockOnTabChange}
        visibleTabs={['general']}
        onTabAdd={mockOnTabAdd}
      />
    );
    
    expect(screen.getByTitle('Add tab')).toBeInTheDocument();
  });

  it('shows add dropdown with available tabs when clicked', () => {
    renderWithTheme(
      <ExpandableTabs
        tabs={mockTabs}
        activeTab="general"
        onTabChange={mockOnTabChange}
        visibleTabs={['general']}
        onTabAdd={mockOnTabAdd}
      />
    );
    
    fireEvent.click(screen.getByTitle('Add tab'));
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Characters')).toBeInTheDocument();
  });

  it('calls onTabAdd when adding a tab from dropdown', () => {
    renderWithTheme(
      <ExpandableTabs
        tabs={mockTabs}
        activeTab="general"
        onTabChange={mockOnTabChange}
        visibleTabs={['general']}
        onTabAdd={mockOnTabAdd}
      />
    );
    
    fireEvent.click(screen.getByTitle('Add tab'));
    fireEvent.click(screen.getByText('Notes'));
    expect(mockOnTabAdd).toHaveBeenCalledWith('notes');
  });

  it('shows close button for removable tabs', () => {
    renderWithTheme(
      <ExpandableTabs
        tabs={mockTabs}
        activeTab="general"
        onTabChange={mockOnTabChange}
        visibleTabs={['general', 'notes']}
        onTabRemove={mockOnTabRemove}
      />
    );
    
    // General tab should not have close button (not removable)
    const generalTab = screen.getByTestId('general-tab');
    expect(generalTab.querySelector('.ai-expandable-tabs__tab-close')).toBeNull();
    
    // Notes tab should have close button
    const notesTab = screen.getByTestId('notes-tab');
    expect(notesTab.querySelector('.ai-expandable-tabs__tab-close')).toBeInTheDocument();
  });

  it('calls onTabRemove when close button is clicked', () => {
    renderWithTheme(
      <ExpandableTabs
        tabs={mockTabs}
        activeTab="general"
        onTabChange={mockOnTabChange}
        visibleTabs={['general', 'notes']}
        onTabRemove={mockOnTabRemove}
      />
    );
    
    const closeButton = screen.getByTitle('Close Notes tab');
    fireEvent.click(closeButton);
    expect(mockOnTabRemove).toHaveBeenCalledWith('notes');
  });
});
