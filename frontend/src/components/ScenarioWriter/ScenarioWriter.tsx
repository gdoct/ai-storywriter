// filepath: /home/guido/storywriter/frontend/src/components/ScenarioWriter.tsx
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createScenario, fetchGeneratedStory, updateScenario } from '../../services/scenario';
import './ScenarioWriter.css';

// Import tab components
import { Scenario } from '../../types/ScenarioTypes';
import ReadingPane from '../ReadingPane/ReadingPane';
import BackstoryTab from '../tabs/BackstoryTab';
import CharactersTab from '../tabs/CharactersTab';
import FileTab from '../tabs/FileTab';
import NotesTab from '../tabs/NotesTab';
import PromptPreviewTab from '../tabs/PromptPreviewTab';
import ScenesTab from '../tabs/ScenesTab';
import StoryArcTab from '../tabs/StoryArcTab';
import StoryStyleTab from '../tabs/StoryStyleTab';

interface ScenarioWriterProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}

const ScenarioWriter: React.FC<ScenarioWriterProps> = ({ value, onChange, onSubmit }) => {
  const [activeTab, setActiveTab] = useState('file');
  const [mainContent, setMainContent] = useState(value);
  const [characters, setCharacters] = useState('');
  const [scenes, setScenes] = useState('');
  const [backstory, setBackstory] = useState('');
  const [storyArc, setStoryArc] = useState('');
  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [currentStoryTimestamp, setCurrentStoryTimestamp] = useState<string | null>(null);
  
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
    switch (tabName) {
      case 'main':
        setMainContent(content);
        onChange(content); // Only sync main content with parent
        setIsDirty(true);
        
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
        setIsDirty(true);
        
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
        setIsDirty(true);
        
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
        setIsDirty(true);
        if (currentScenario) {
          setCurrentScenario({...currentScenario, backstory: content});
        }
        break;
      case 'storyArc':
        setStoryArc(content);
        setIsDirty(true);
        if (currentScenario) {
          setCurrentScenario({...currentScenario, storyarc: content});
        }
        break;
      case 'notes':
        setNotes(content);
        setIsDirty(true);
        if (currentScenario) {
          setCurrentScenario({...currentScenario, notes: content});
        }
        break;
    }
  };

  const handleLoadScenario = (scenario: Scenario, generatedStory?: string | null) => {
    // Convert writingStyle object to JSON string for StoryStyleTab component
    if (scenario.writingStyle) {
      const styleJson = JSON.stringify(scenario.writingStyle);
      setMainContent(styleJson);
      onChange(styleJson);
    } else {
      setMainContent('');
      onChange('');
    }
    
    setBackstory(scenario.backstory || '');
    setStoryArc(scenario.storyarc || '');
    setNotes(scenario.notes || '');
    
    // Set the generated story if provided and is not empty
    setGeneratedStory(generatedStory && generatedStory.trim() ? generatedStory : null);
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
    setIsDirty(false); // Only set dirty to false after everything is loaded
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
    { id: 'file', label: 'File' },
    { id: 'main', label: 'Story Style' },
    { id: 'characters', label: 'Characters' },
    { id: 'backstory', label: 'Backstory' },
    { id: 'storyArc', label: 'Story Arc' },
    { id: 'scenes', label: 'Scenes' },
    { id: 'notes', label: 'Notes' },
    { id: 'preview', label: 'Prompt Preview' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'file':
        return (
          <FileTab
            currentScenario={currentScenario}
            isDirty={isDirty}
            onLoadScenario={handleLoadScenario}
            onSaveScenario={handleSaveScenario}
            onNewScenario={handleNewScenario}
            onSwitchTab={setActiveTab}
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
      case 'scenes':
        return (
          <ScenesTab
            content={scenes}
            updateContent={(content) => updateContent('scenes', content)}
            currentScenario={currentScenario}
          />
        );
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
      case 'preview':
        return (
          <PromptPreviewTab 
            currentScenario={currentScenario} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="scenario-writer-container">
      <div className="scenario-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`scenario-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="scenario-workspace" ref={containerRef}>
        <div 
          className="scenario-editor-panel" 
          style={{ flex: `0 0 ${splitPosition}%` }}
        >
          {renderTabContent()}
        </div>
        <div 
          className="splitter" 
          ref={splitterRef}
          onMouseDown={handleMouseDown}
        >
          <div className="splitter-handle"></div>
        </div>
        <div 
          className="scenario-reading-panel"
          style={{ flex: `0 0 ${100 - splitPosition}%` }}
        >
          <ReadingPane 
            content={generatedStory === null ? '' : generatedStory || ''}
            onSubmit={onSubmit}
            canSubmit={!!mainContent.trim() && !!currentScenario}
            isGeneratedStory={!!generatedStory}
            currentScenario={currentScenario}
            currentTimestamp={currentStoryTimestamp}
            onStoryVersionSelect={handleStoryVersionSelect}
            onStoryGenerated={(story: string | null) => {
              setGeneratedStory(story);
              setIsDirty(true);
            }}
            scenes={currentScenario?.scenes || []}
          />
        </div>
      </div>
    </div>
  );
};

export default ScenarioWriter;
