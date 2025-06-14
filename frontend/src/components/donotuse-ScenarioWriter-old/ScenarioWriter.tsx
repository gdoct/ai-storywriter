// filepath: /home/guido/storywriter/frontend/src/components/ScenarioWriter.tsx
import React, { useEffect, useRef, useState } from 'react';
import { FaBookOpen, FaCog, FaComment, FaEye, FaFileAlt, FaFont, FaProjectDiagram, FaStickyNote, FaUserFriends } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { createScenario, fetchGeneratedStory, fetchScenarioById, updateScenario } from '../../services/scenario';
import './ScenarioWriter.css';

// Import tab components
import { Scenario } from '../../types/ScenarioTypes';
import ReadingPane from '../ReadingPane/ReadingPane';
import BackstoryTab from './BackstoryTab/BackstoryTab';
import CharactersTab from './CharactersTab/CharactersTab';
import ChatTab from './ChatTab/ChatTab';
import FileTab from './FileTab/FileTab';
import NotesTab from './NotesTab/NotesTab';
import PromptPreviewTab from './PromptPreviewTab/PromptPreviewTab';
//import ScenesTab from './ScenesTab/ScenesTab';
import Settings from '../../pages/Settings';
import StoryArcTab from './StoryArcTab/StoryArcTab';
import StoryStyleTab from './StoryStyleTab/StoryStyleTab';

interface ScenarioWriterProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  seed?: number | null;
  initialScenarioId?: string | null;
}

const ScenarioWriter: React.FC<ScenarioWriterProps> = ({ value, onChange, onSubmit, seed, initialScenarioId }) => {
  const [activeTab, setActiveTab] = useState('file');
  const [mainContent, setMainContent] = useState(value);
  const [characters, setCharacters] = useState('');
  const [scenes, setScenes] = useState('');
  const [backstory, setBackstory] = useState('');
  const [storyArc, setStoryArc] = useState('');
  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isLoadingScenario, setIsLoadingScenario] = useState(false); // Add loading state
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [currentStoryTimestamp, setCurrentStoryTimestamp] = useState<string | null>(null);
  const [isStoryDropdownDisabled, setIsStoryDropdownDisabled] = useState(false);
  const [isTabCollapsed, setIsTabCollapsed] = useState(false);
  
  // Splitter state and refs
  const [isDragging, setIsDragging] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50); // Default 50% split
  const splitterRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set initial scenario with default values
    if (!currentScenario) {
      const username = localStorage.getItem('username') || 'anonymous';
      setCurrentScenario({
        id: '',
        userId: username,
        title: '',
        synopsis: '',
        createdAt: new Date(),
        backstory: backstory,
        storyarc: storyArc,
        notes: notes,
        characters: [],
        scenes: [],
      });
    }
  }, [currentScenario, backstory, storyArc, notes]);

  // Auto-load scenario from URL parameter
  useEffect(() => {
    if (initialScenarioId && initialScenarioId.trim()) {
      const loadInitialScenario = async () => {
        try {
          setIsLoadingScenario(true);
          const scenario = await fetchScenarioById(initialScenarioId);
          let generatedStory = null;
          
          // Try to fetch the most recent generated story for this scenario
          try {
            const storyResponse = await fetchGeneratedStory(initialScenarioId);
            if (storyResponse && storyResponse.content) {
              generatedStory = storyResponse.content;
            }
          } catch (error) {
            console.log('No generated story found for this scenario');
          }
          
          handleLoadScenario(scenario, generatedStory);
        } catch (error) {
          console.error('Failed to load scenario from URL parameter:', error);
        } finally {
          setIsLoadingScenario(false);
        }
      };
      
      loadInitialScenario();
    }
  }, [initialScenarioId]); // Only run when initialScenarioId changes

  // Setup the drag event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      
      // Calculate percentage position (constrain between 20% and 80%)
      const newPosition = Math.min(Math.max((mouseX / containerWidth) * 100, 20), 80);
      
      setSplitPosition(newPosition);
      e.preventDefault();
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle starting the drag operation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  // Update the parent component whenever any content changes
  const updateContent = (tabName: string, content: string) => {
    // Don't set dirty state if we're currently loading a scenario
    if (isLoadingScenario) {
      console.log('Skipping dirty state update during scenario loading');
    }
    
    switch (tabName) {
      case 'main':
        setMainContent(content);
        onChange(content); // Always sync main content with parent
        if (!isLoadingScenario) setIsDirty(true);
        
        // Update the scenario with the latest style content
        if (currentScenario) {
          try {
            const parsedStyle = JSON.parse(content);
            setCurrentScenario({...currentScenario, writingStyle: parsedStyle});
            console.log('Updated scenario with new style settings');
          } catch (e) {
            console.error('Failed to parse style settings during update:', e);
          }
        }
        break;
      case 'characters':
        setCharacters(content);
        if (!isLoadingScenario) setIsDirty(true);
        
        // Update the scenario with the latest characters content
        if (currentScenario) {
          try {
            const parsedCharacters = JSON.parse(content);
            setCurrentScenario({...currentScenario, characters: parsedCharacters});
            console.log('Updated scenario with new characters:', parsedCharacters.length);
          } catch (e) {
            console.error('Failed to parse characters during update:', e);
          }
        }
        break;
      case 'scenes':
        console.log('ScenarioWriter received scenes update:', content); // Debug log
        // Important: make sure we store scene data properly
        setScenes(content);
        if (!isLoadingScenario) setIsDirty(true);
        
        // Update the scenario with the latest scenes content
        if (currentScenario) {
          try {
            const parsedScenes = JSON.parse(content);
            const updatedScenario = {...currentScenario, scenes: parsedScenes};
            setCurrentScenario(updatedScenario);
            console.log('Updated scenario with new scenes:', updatedScenario.scenes.length); // Debug log
          } catch (e) {
            console.error('Failed to parse scenes during update:', e);
          }
        }
        break;
      case 'backstory':
        setBackstory(content);
        if (!isLoadingScenario) setIsDirty(true);
        if (currentScenario) {
          setCurrentScenario({...currentScenario, backstory: content});
        }
        break;
      case 'storyArc':
        setStoryArc(content);
        if (!isLoadingScenario) setIsDirty(true);
        if (currentScenario) {
          setCurrentScenario({...currentScenario, storyarc: content});
        }
        break;
      case 'notes':
        setNotes(content);
        if (!isLoadingScenario) setIsDirty(true);
        if (currentScenario) {
          setCurrentScenario({...currentScenario, notes: content});
        }
        break;
    }
  };

  const handleLoadScenario = (scenario: Scenario, generatedStory?: string | null) => {
    // Set loading flag to prevent dirty state updates
    setIsLoadingScenario(true);
    
    // Convert writingStyle object to JSON string for StoryStyleTab component
    if (scenario.writingStyle) {
      const styleJson = JSON.stringify(scenario.writingStyle);
      setMainContent(styleJson);
      // We need to sync with parent during loading
      onChange(styleJson);
    } else {
      setMainContent('');
      onChange('');
    }
    
    setBackstory(scenario.backstory || '');
    setStoryArc(scenario.storyarc || '');
    setNotes(scenario.notes || '');
    
    // Don't automatically display generated story when loading scenario
    // User should explicitly generate or select a story from the saved stories dropdown
    setGeneratedStory(null);
    setCurrentStoryTimestamp(null); // Reset timestamp when loading a new scenario
    
    // Handle characters (this might need more processing depending on implementation)
    if (scenario.characters && Array.isArray(scenario.characters)) {
      setCharacters(JSON.stringify(scenario.characters));
    } else {
      setCharacters('');
    }
    
    // Handle scenes
    if (scenario.scenes && Array.isArray(scenario.scenes)) {
      setScenes(JSON.stringify(scenario.scenes));
    } else {
      setScenes('');
    }
    
    setCurrentScenario(scenario);
    
    // Clear loading state and ensure clean state after loading
    setTimeout(() => {
      setIsLoadingScenario(false);
      setIsDirty(false);
    }, 0);
  };

  const handleSaveScenario = async (scenario: Scenario) => {
    try {
      let parsedStyle;
      try {
        // Parse the style content if it's a valid JSON
        parsedStyle = JSON.parse(mainContent);
      } catch (e) {
        // If parsing fails, create a basic style object
        parsedStyle = { style: mainContent, genre: 'Default' };
      }

      const scenarioToSave = {
        ...scenario,
        writingStyle: parsedStyle, // Use the correct field name from ScenarioTypes
        backstory: backstory,
        storyarc: storyArc,
        notes: notes,
        characters: characters ? JSON.parse(characters) : [],
        scenes: scenes ? JSON.parse(scenes) : [],
        updatedAt: new Date()
      };

      let response;
      
      if (scenario.id) {
        // Update existing scenario
        response = await updateScenario(scenarioToSave);
      } else {
        // Create new scenario
        scenarioToSave.id = uuidv4();
        scenarioToSave.createdAt = new Date();
        response = await createScenario(scenarioToSave);
      }
      
      setCurrentScenario(response);
      setIsDirty(false);
      return response;
    } catch (error) {
      console.error('Failed to save scenario:', error);
      throw error;
    }
  };

  const handleNewScenario = async (title: string) => {
    const username = localStorage.getItem('username') || 'anonymous';
    
    let parsedStyle;
    try {
      // Parse the style content if it's a valid JSON
      parsedStyle = JSON.parse(mainContent);
    } catch (e) {
      // If parsing fails, create a basic style object
      parsedStyle = { style: mainContent, genre: 'Default' };
    }
    
    const newScenario: Scenario = {
      id: uuidv4(),
      userId: username,
      title: title,
      synopsis: '',
      createdAt: new Date(),
      writingStyle: parsedStyle,
      backstory: '',
      storyarc: '',
      notes: '',
      characters: [],
      scenes: []
    };

    try {
      const response = await createScenario(newScenario);
      setCurrentScenario(response);
      
      // Reset all content
      setMainContent('');
      onChange('');
      setBackstory('');
      setStoryArc('');
      setNotes('');
      setCharacters('');
      setScenes('');
      setGeneratedStory(null);
      setCurrentStoryTimestamp(null);
      
      setIsDirty(false);
      return response;
    } catch (error) {
      console.error('Failed to create new scenario:', error);
      throw error;
    }
  };

  const handleStoryVersionSelect = async (timestamp: string) => {
    if (!currentScenario) return;
    
    try {
      const storyResponse = await fetchGeneratedStory(currentScenario.id, timestamp);
      if (storyResponse && storyResponse.content) {
        setGeneratedStory(storyResponse.content);
        setCurrentStoryTimestamp(timestamp);
      }
    } catch (error) {
      console.error('Failed to load story version:', error);
    }
  };

  const tabs = [
    { id: 'file', label: 'File', icon: <FaFileAlt /> },
    { id: 'main', label: 'Story Style', icon: <FaFont /> },
    { id: 'characters', label: 'Characters', icon: <FaUserFriends /> },
    { id: 'backstory', label: 'Backstory', icon: <FaBookOpen /> },
    { id: 'storyArc', label: 'Story Arc', icon: <FaProjectDiagram /> },
    // { id: 'scenes', label: 'Scenes', icon: <FaListUl /> },
    { id: 'notes', label: 'Notes', icon: <FaStickyNote /> },
    { id: 'chat', label: 'Chat', icon: <FaComment /> },
    { id: 'preview', label: 'Prompt Preview', icon: <FaEye /> },
    { id: 'settings', label: 'Settings', icon: <FaCog /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'file':
        return (
          <FileTab
            currentScenario={currentScenario}
            isDirty={isDirty}
            onSaveScenario={handleSaveScenario}
            onSaveAsScenario={handleSaveScenario} // You may want a separate handler for Save As
          />
        );
      case 'main':
        return (
          <StoryStyleTab 
            content={mainContent} 
            updateContent={(content: string) => updateContent('main', content)}
            currentScenario={currentScenario}
          />
        );
      case 'characters':
        return (
          <CharactersTab 
            content={characters} 
            updateContent={(content) => updateContent('characters', content)} 
            currentScenario={currentScenario}
          />
        );
      // case 'scenes':
      //   return (
      //     <ScenesTab
      //       content={scenes}
      //       updateContent={(content) => updateContent('scenes', content)}
      //       currentScenario={currentScenario}
      //     />
      //   );
      case 'backstory':
        return (
          <BackstoryTab 
            content={backstory} 
            updateContent={(content) => updateContent('backstory', content)}
            currentScenario={currentScenario}
          />
        );
      case 'storyArc':
        return (
          <StoryArcTab 
            content={storyArc} 
            updateContent={(content) => updateContent('storyArc', content)}
            currentScenario={currentScenario}
          />
        );
      case 'notes':
        return (
          <NotesTab 
            content={notes} 
            updateContent={(content) => updateContent('notes', content)}
            currentScenario={currentScenario}
          />
        );
      case 'chat':
        return (
          <ChatTab 
            content="" 
            updateContent={() => {}} // Chat doesn't need to update parent content
            currentScenario={currentScenario}
          />
        );
      case 'preview':
        return (
          <PromptPreviewTab 
            currentScenario={currentScenario} 
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  // Tab button click handler with collapse logic
  const handleTabClick = (tabId: string) => {
    if (activeTab === tabId && !isTabCollapsed) {
      setIsTabCollapsed(true); // Collapse if clicking active tab
    } else {
      setActiveTab(tabId);
      setIsTabCollapsed(false); // Un-collapse and show new tab
    }
  };

  return (
    <div className="scenario-writer-container">
      <div className="scenario-sidebar">
        <div className="scenario-sidebar-tabs" style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`scenario-sidebar-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              title={tab.label}
              style={tab.id === 'settings' ? { fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      </div>
      <div className="scenario-workspace" ref={containerRef}>
        {!isTabCollapsed && (
          <div 
            className="scenario-editor-panel scenario-editor-panel-scroll" 
            style={{ flex: `0 0 ${splitPosition}%`, overflowY: 'scroll' }}
          >
            {renderTabContent()}

          </div>
        )}
        <div 
          className="splitter" 
          ref={splitterRef}
          onMouseDown={handleMouseDown}
        >
          <div className="splitter-handle"></div>
        </div>
        <div 
          className="scenario-reading-panel"
          style={{ flex: isTabCollapsed ? '1 1 100%' : `0 0 ${100 - splitPosition}%` }}
        >
          <ReadingPane 
            content={generatedStory === null ? '' : generatedStory || ''}
            onSubmit={onSubmit}
            canSubmit={!!mainContent.trim() && !!currentScenario}
            currentScenario={currentScenario}
            currentTimestamp={currentStoryTimestamp}
            onStoryVersionSelect={handleStoryVersionSelect}
            onStoryGenerated={(story: string | null) => {
              setGeneratedStory(story);
              // Don't set dirty state when generating stories - story generation doesn't modify the scenario
            }}
            onDisableStoryDropdown={setIsStoryDropdownDisabled}
            isStoryDropdownDisabled={isStoryDropdownDisabled}
          />
                      
        </div>
      </div>
    </div>
  );
};

export default ScenarioWriter;
