import React, { useEffect, useState } from 'react';
import { generateStory } from '../../services/storyGenerator';
import { Scenario } from '../../types/ScenarioTypes';
import MarkdownViewer from './MarkDownViewer';
import './ReadingPane.css';
import ReadingPaneHeader from './ReadingPaneHeader';

// Helper: for resetting dropdown selection in header
type ReadingPaneHeaderRef = {
  resetDbStoryDropdown: () => void;
};

interface ReadingPaneProps {
  content: string; // Initial content for the current scenario
  onSubmit?: () => void;
  canSubmit?: boolean;
  currentScenario?: Scenario | null;
  onStoryGenerated?: (story: string | null) => void;
  onStoryVersionSelect?: (timestamp: string) => void;
  currentTimestamp?: string | null; // Timestamp for the initial content
  onDisableStoryDropdown?: (disabled: boolean) => void;
  isStoryDropdownDisabled?: boolean;
}

interface Tab {
  id: string;
  title: string;
  content: string;
  source: 'generated' | 'database' | 'none';
  scenarioId: string;
  dbStoryId?: number | null;
  isGenerating?: boolean;
  fontFamily: string;
  fontSize: string;
}

const formatDateForTabTitle = (dateString?: string): string => {
  if (!dateString) return 'New';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Date Error';
  }
};

const generateTabId = (prefix: string = 'tab') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const ReadingPane: React.FC<ReadingPaneProps> = ({
  content, // Initial content for currentScenario
  onSubmit,
  canSubmit = false,
  currentScenario = null,
  onStoryGenerated, // Callback when a story in an active tab is finalized or selected
  onStoryVersionSelect, // Callback to inform parent about version selection (e.g., to clear it)
  currentTimestamp, // Timestamp if `content` is a specific version
  onDisableStoryDropdown,
  isStoryDropdownDisabled = false,
}) => {
  // Global state for all tabs across all scenarios
  const [tabs, setTabs] = useState<Tab[]>([]);
  // Ref for ReadingPaneHeader to reset dropdown
  const headerRef = React.useRef<ReadingPaneHeaderRef>(null);
  // Global state for the currently active tab's ID (could be from any scenario)
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  // Ref to track which scenarios already have tabs
  const scenariosWithTabsRef = React.useRef<Set<string>>(new Set());

  // Derived state: tabs for the current scenario
  const [scenarioTabs, setScenarioTabs] = useState<Tab[]>([]);
  // Derived state: active tab ID within the current scenario's tabs
  const [activeScenarioTabId, setActiveScenarioTabId] = useState<string | null>(null);

  // Default font settings for new tabs
  const [fontFamily, setFontFamily] = useState<string>('Georgia');
  const [fontSize, setFontSize] = useState<string>('16px');

  // Story generation state
  const [isGeneratingGlobal, setIsGeneratingGlobal] = useState<boolean>(false);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);

  // Effect to manage tabs based on currentScenario
  useEffect(() => {
    if (!currentScenario) {
      setScenarioTabs([]);
      setActiveScenarioTabId(null);
      return;
    }

    const currentScenarioId = currentScenario.id;
    const tabsForCurrentScenario = tabs.filter(t => t.scenarioId === currentScenarioId);
    setScenarioTabs(tabsForCurrentScenario);

    if (tabsForCurrentScenario.length > 0) {
      const globalActiveTabIsForCurrentScenario = tabsForCurrentScenario.find(t => t.id === activeTabId);

      if (globalActiveTabIsForCurrentScenario) {
        if (activeScenarioTabId !== activeTabId) {
          setActiveScenarioTabId(activeTabId);
        }
      } else {
        const firstTab = tabsForCurrentScenario[0];
        setActiveScenarioTabId(firstTab.id);
        setActiveTabId(firstTab.id);
      }
    } else {
      setActiveScenarioTabId(null);
    }
  }, [currentScenario, activeTabId, activeScenarioTabId, tabs]);

  // Separate useEffect for creating initial tabs
  useEffect(() => {
    if (!currentScenario || !content) return;
    
    const currentScenarioId = currentScenario.id;
    
    // Only create a tab if we haven't already created one for this scenario
    if (!scenariosWithTabsRef.current.has(currentScenarioId)) {
      const newTabId = generateTabId(`initial-${currentScenarioId}`);
      const initialTab: Tab = {
        id: newTabId,
        title: currentTimestamp ? `DB: ${formatDateForTabTitle(currentTimestamp)}` : `Story 1`,
        content: content,
        source: currentTimestamp ? 'database' : 'none',
        scenarioId: currentScenarioId,
        dbStoryId: currentTimestamp ? undefined : null,
        fontFamily: fontFamily,
        fontSize: fontSize,
        isGenerating: false,
      };
      
      setTabs(prevGlobalTabs => [...prevGlobalTabs, initialTab]);
      setActiveTabId(newTabId);
      
      // Mark this scenario as having tabs now
      scenariosWithTabsRef.current.add(currentScenarioId);
      
      // Notify parent if this is a new tab addition
      if (onStoryGenerated) onStoryGenerated(initialTab.content);
    }
  }, [currentScenario, content, currentTimestamp, fontFamily, fontSize, onStoryGenerated]);

  const activeScenarioTab = scenarioTabs.find(t => t.id === activeScenarioTabId);

  const handleCancelGeneration = () => {
    if (cancelGeneration) {
      cancelGeneration();
    }
    setIsGeneratingGlobal(false);
    setCancelGeneration(null);
    if (onDisableStoryDropdown) onDisableStoryDropdown(false);

    // Update the tab that was generating
    setTabs(prevTabs =>
      prevTabs.map(t =>
        t.isGenerating ? { ...t, isGenerating: false, source: t.content ? t.source : 'none', title: t.content ? t.title : "Cancelled" } : t
      )
    );
  };

  const handleGenerateStory = async () => {
    if (!currentScenario || isGeneratingGlobal) return;

    setIsGeneratingGlobal(true);
    if (onDisableStoryDropdown) onDisableStoryDropdown(true);
    if (onStoryVersionSelect) onStoryVersionSelect(''); // Clear parent's selected version
    // Parent's onStoryGenerated(null) to indicate no stable story yet
    if (onStoryGenerated) onStoryGenerated(null);

    const newTabId = generateTabId(`gen-${currentScenario.id}`);
    const newGeneratedTab: Tab = {
      id: newTabId,
      title: `Generating...`,
      content: '',
      source: 'generated',
      scenarioId: currentScenario.id,
      fontFamily: fontFamily,
      fontSize: fontSize,
      isGenerating: true,
    };

    setTabs(prevGlobalTabs => [...prevGlobalTabs, newGeneratedTab]);
    setActiveTabId(newTabId);
    // activeScenarioTabId will be set by the useEffect

    setCancelGeneration(null);

    try {
      const { result, cancelGeneration: newCancel } = await generateStory(currentScenario, {
        onProgress: (text: string) => {
          setTabs(prevGlobalTabs =>
            prevGlobalTabs.map(t =>
              t.id === newTabId ? { ...t, content: text } : t
            )
          );
        }
      });

      setCancelGeneration(() => newCancel);
      const fullStory = await result;

      setTabs(prevGlobalTabs =>
        prevGlobalTabs.map(t =>
          t.id === newTabId ? { ...t, content: fullStory.completeText, title: `Generated Story`, isGenerating: false } : t
        )
      );
      if (onStoryGenerated) {
        onStoryGenerated(fullStory.completeText);
      }
    } catch (error) {
      console.error('Error generating story:', error);
      setTabs(prevGlobalTabs =>
        prevGlobalTabs.map(t =>
          t.id === newTabId ? { ...t, title: 'Generation Failed', isGenerating: false, source: 'none' } : t
        )
      );
    } finally {
      setIsGeneratingGlobal(false);
      // Tab's isGenerating flag is updated above
      if (onDisableStoryDropdown) onDisableStoryDropdown(false);
    }

    if (onSubmit) onSubmit();
  };

  const handleSetFontFamily = (family: string) => {
    setFontFamily(prev => {
      if (prev !== family) {
        if (activeScenarioTabId) {
          setTabs(prevTabs => prevTabs.map(t => t.id === activeScenarioTabId ? { ...t, fontFamily: family } : t));
        }
        return family;
      }
      return prev;
    });
  };

  const handleSetFontSize = (size: string) => {
    setFontSize(prev => {
      if (prev !== size) {
        if (activeScenarioTabId) {
          setTabs(prevTabs => prevTabs.map(t => t.id === activeScenarioTabId ? { ...t, fontSize: size } : t));
        }
        return size;
      }
      return prev;
    });
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId); // Set global active tab; useEffect will sync activeScenarioTabId
    // activeScenarioTabId will be set by the useEffect
    const selectedTab = tabs.find(t => t.id === tabId);
    if (selectedTab && onStoryGenerated) {
        onStoryGenerated(selectedTab.content); // Notify parent of content change
    }
  };

  const handleCloseTab = (tabIdToClose: string) => {
    const tabBeingClosed = tabs.find(t => t.id === tabIdToClose);
    if (!tabBeingClosed) return;

    if (tabBeingClosed.isGenerating && cancelGeneration) {
      handleCancelGeneration(); // This will also update the tab's state
    }

    const updatedGlobalTabs = tabs.filter(t => t.id !== tabIdToClose);
    setTabs(updatedGlobalTabs);

    if (tabIdToClose === activeScenarioTabId) {
      const remainingScenarioTabs = updatedGlobalTabs.filter(t => t.scenarioId === currentScenario?.id);
      if (remainingScenarioTabs.length > 0) {
        const newActiveTab = remainingScenarioTabs[0];
        setActiveTabId(newActiveTab.id); // useEffect will handle activeScenarioTabId
        if (onStoryGenerated) onStoryGenerated(newActiveTab.content);
      } else {
        setActiveTabId(null); // No tabs left for this scenario, clear global active
        // useEffect will set activeScenarioTabId to null
        if (onStoryGenerated) onStoryGenerated(null);
      }
    } else if (tabIdToClose === activeTabId) {
        // If a globally active tab (not necessarily in current scenario view) was closed
        if (updatedGlobalTabs.length > 0) {
            setActiveTabId(updatedGlobalTabs[0].id); // Make the first of remaining global tabs active
             if (onStoryGenerated) onStoryGenerated(updatedGlobalTabs[0].content);
        } else {
            setActiveTabId(null);
            if (onStoryGenerated) onStoryGenerated(null);
        }
    }
  };

  const handleDbStorySelected = (storyText: string | null, dbStoryId?: number | null, storyCreatedAt?: string) => {
    if (!currentScenario) return;

    if (!storyText || !dbStoryId) { // User selected "Select a saved story..." or cleared
      if (onStoryGenerated) onStoryGenerated(null);
      return;
    }

    const existingTab = tabs.find(t => t.scenarioId === currentScenario.id && t.dbStoryId === dbStoryId);

    if (existingTab) {
      setActiveTabId(existingTab.id); // Set global active; useEffect will sync activeScenarioTabId
      // Ensure content is up-to-date if it could have changed (unlikely for DB)
      setTabs(prev => prev.map(t => t.id === existingTab.id ? {...t, content: storyText, title: `Saved: ${formatDateForTabTitle(storyCreatedAt)}`} : t));
      if (onStoryGenerated) onStoryGenerated(storyText);
    } else {
      const newTabId = generateTabId(`db-${currentScenario.id}-${dbStoryId}`);
      const newDbTab: Tab = {
        id: newTabId,
        title: `Saved: ${formatDateForTabTitle(storyCreatedAt)}`,
        content: storyText,
        source: 'database',
        scenarioId: currentScenario.id,
        dbStoryId: dbStoryId,
        fontFamily: fontFamily,
        fontSize: fontSize,
        isGenerating: false,
      };
      setTabs(prevGlobalTabs => [...prevGlobalTabs, newDbTab]);
      setActiveTabId(newTabId); // Set global active; useEffect will sync activeScenarioTabId
      if (onStoryGenerated) onStoryGenerated(storyText);
    }
    // Reset the dropdown in the header after selection
    if (headerRef.current) headerRef.current.resetDbStoryDropdown();
  };

  return (
    <div className="reading-pane">
      <ReadingPaneHeader
        ref={headerRef as any}
        currentScenario={currentScenario}
        displayContent={activeScenarioTab?.content || ''}
        onStorySelectedFromDb={handleDbStorySelected}
        onGenerateStory={handleGenerateStory}
        onCancelGeneration={handleCancelGeneration}
        isGenerating={isGeneratingGlobal}
        canSubmit={canSubmit}
        onSubmit={onSubmit}
        displaySource={activeScenarioTab?.source || 'none'}
        isStoryDropdownDisabled={isStoryDropdownDisabled || isGeneratingGlobal}
        fontFamily={fontFamily}
        fontSize={fontSize}
        setFontFamily={handleSetFontFamily}
        setFontSize={handleSetFontSize}
      />

      <div className="tabs-container">
        {scenarioTabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${tab.id === activeScenarioTabId ? 'active' : ''}`}
            onClick={() => handleSelectTab(tab.id)}
          >
            {tab.title.length > 20 ? `${tab.title.substring(0, 17)}...` : tab.title}
            {tab.isGenerating && <span className="tab-loading-spinner">⏳</span>}
            <span className="close-tab-button" onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}>×</span>
          </button>
        ))}
      </div>

      <div
        className="reading-content"
        style={{
          fontSize: activeScenarioTab?.fontSize || fontSize,
          fontFamily: activeScenarioTab?.fontFamily || fontFamily,
        }}
      >
        {activeScenarioTab && activeScenarioTab.content ? (
          <>
            {activeScenarioTab.source === 'generated' &&
              <div className="generated-story-badge">Generated Story</div>}
            {activeScenarioTab.source === 'database' &&
              <div className="saved-story-badge">Saved Story</div>}
            <MarkdownViewer content={activeScenarioTab.content} />
          </>
        ) : (
          <p className="placeholder-text">
            {currentScenario ? "Your story will appear here. Generate one or select a saved version." : "Select a scenario to begin."}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReadingPane;
