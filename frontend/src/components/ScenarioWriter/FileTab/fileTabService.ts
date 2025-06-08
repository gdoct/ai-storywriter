import {
    generateBackstory,
    generateRandomCharacter,
    generateRandomScenarioName,
    generateRandomWritingStyle,
    generateStoryArc,
} from '../../../services/storyGenerator';
import { Scenario } from '../../../types/ScenarioTypes';

export function handleCreateNewScenarioService({
  isDirty,
  setConfirmAction,
  setShowConfirm,
  setShowTitleInput,
  scenarios,
  setNewTitle,
}: any) {
  const createAction = () => {
    setShowTitleInput(true);
    setShowConfirm(false);

    let defaultTitle = "new story";
    const existingTitles = scenarios.map((s: any) => s.title || '');

    if (existingTitles.includes(defaultTitle)) {
      let counter = 1;
      while (existingTitles.includes(`${defaultTitle} (${counter})`)) {
        counter++;
      }
      defaultTitle = `${defaultTitle} (${counter})`;
    }

    setNewTitle(defaultTitle);
  };

  if (isDirty) {
    setConfirmAction(() => createAction);
    setShowConfirm(true);
  } else {
    createAction();
  }
}

export function handleRandomizeScenarioService({
  isDirty,
  setConfirmAction,
  setShowConfirm,
  currentScenario,
  setShowRandomScenarioModal,
}: any) {
  const openAction = () => {
    if (!currentScenario) {
      alert('Please create or select a scenario first.');
      return;
    }
    setShowRandomScenarioModal(true);
    setShowConfirm(false);
  };

  if (isDirty) {
    setConfirmAction(() => openAction);
    setShowConfirm(true);
  } else {
    openAction();
  }
}

export function handleRenameScenarioService({
  currentScenario,
  setShowRenameInput,
  setRenameTitle,
}: any) {
  if (!currentScenario) return;
  setShowRenameInput(true);
  setRenameTitle(currentScenario.title || '');
}

export function handleSaveAsScenarioService({
  setShowSaveAsInput,
  setSaveAsTitle,
  currentScenario,
}: any) {
  setShowSaveAsInput(true);
  setSaveAsTitle(currentScenario?.title || '');
}

export async function confirmNewScenarioService({
  newTitle,
  setErrorMessage,
  onNewScenario,
  setShowTitleInput,
  fetchScenarios,
}: any) {
  if (!newTitle.trim()) {
    setErrorMessage('Title cannot be empty');
    return;
  }
  try {
    await onNewScenario(newTitle.trim());
    setShowTitleInput(false);
    fetchScenarios();
  } catch (error) {
    console.error('Failed to create new scenario:', error);
    setErrorMessage('Failed to create scenario');
  }
}

export async function confirmSaveAsService({
  saveAsTitle,
  setErrorMessage,
  scenarios,
  currentScenario,
  onSaveScenario,
  setShowSaveAsInput,
  fetchScenarios,
  onSaveComplete,
}: any) {
  if (!saveAsTitle.trim()) {
    setErrorMessage('Title cannot be empty');
    return;
  }
  if (scenarios.some((s: any) => s.title === saveAsTitle && s.id !== currentScenario?.id)) {
    setErrorMessage('A scenario with this title already exists');
    return;
  }
  try {
    if (currentScenario) {
      const updatedScenario = { ...currentScenario, title: saveAsTitle.trim(), id: '' };
      await onSaveScenario(updatedScenario);
      setShowSaveAsInput(false);
      fetchScenarios();
      if (onSaveComplete) onSaveComplete();
    }
  } catch (error) {
    console.error('Failed to save scenario as:', error);
    setErrorMessage('Failed to save scenario');
  }
}

export async function confirmRenameScenarioService(
  currentScenario: Scenario,
  renameTitle: string,
  scenarios: any[],
  setErrorMessage: (msg: string) => void,
  onLoadScenario: (s: Scenario) => void,
  setShowRenameInput: (b: boolean) => void,
  fetchScenarios: () => void
) {
  // ...existing logic from confirmRenameScenarioService...
}

export async function handleGenerateRandomScenarioService({
  extraInstructions,
  currentScenario,
  setIsGeneratingScenario,
  setGenerationProgress,
  setRandomScenarioName,
  setGenerationCancelHandler,
  randomScenarioOptions,
  onLoadScenario,
  onSwitchTab,
  setShowRandomScenarioModal,
}: any) {
  try {
    if (!currentScenario) {
      alert('No active scenario to randomize.');
      setShowRandomScenarioModal(false);
      return;
    }
    setIsGeneratingScenario(true);
    const updatedScenario = { ...currentScenario };
    const shouldGenerateNewName = extraInstructions.includes("rename") ||
      extraInstructions.includes("new title") ||
      extraInstructions.includes("new name");

    if (shouldGenerateNewName) {
      setGenerationProgress('Generating scenario name...');
      const nameGenerationResult = await generateRandomScenarioName({
        onProgress: (text: string) => {
          setRandomScenarioName(text);
        }
      });
      setGenerationCancelHandler(() => nameGenerationResult.cancelGeneration);
      try {
        const name = await nameGenerationResult.result;
        updatedScenario.title = name;
        setRandomScenarioName(name);
      } catch (error) {
        console.error('Error generating scenario name:', error);
      }
    } else {
      setRandomScenarioName(updatedScenario.title || 'Current Scenario');
    }

    if (randomScenarioOptions.generateStyle) {
      setGenerationProgress('Generating writing style...');
      const styleGenerationResult = await generateRandomWritingStyle({
        onProgress: (text: string) => {
          setGenerationProgress('Generating writing style...\n' + text);
        }
      });
      setGenerationCancelHandler(() => styleGenerationResult.cancelGeneration);
      try {
        const style = await styleGenerationResult.result;
        updatedScenario.writingStyle = style;
      } catch (error) {
        console.error('Error generating writing style:', error);
        if (!updatedScenario.writingStyle) {
          updatedScenario.writingStyle = { genre: 'General Fiction' };
        }
      }
    }

    if (randomScenarioOptions.generateCharacters) {
      setGenerationProgress('Generating protagonist character...');
      const characterGenerationResult = await generateRandomCharacter(
        updatedScenario,
        'protagonist',
        {
          onProgress: (text: string) => {
            setGenerationProgress('Generating protagonist character...\n' + text);
          }
        }
      );
      setGenerationCancelHandler(() => characterGenerationResult.cancelGeneration);
      try {
        const character = await characterGenerationResult.result;
        character.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        updatedScenario.characters = [character];
        setGenerationProgress('Generating antagonist character...');
        const antagonistGenerationResult = await generateRandomCharacter(
          updatedScenario,
          'antagonist',
          {
            onProgress: (text: string) => {
              setGenerationProgress('Generating antagonist character...\n' + text);
            }
          }
        );
        setGenerationCancelHandler(() => antagonistGenerationResult.cancelGeneration);
        try {
          const antagonist = await antagonistGenerationResult.result;
          antagonist.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
          updatedScenario.characters.push(antagonist);
        } catch (error) {
          console.error('Error generating antagonist character:', error);
        }
      } catch (error) {
        console.error('Error generating protagonist character:', error);
      }
    }

    if (randomScenarioOptions.generateBackstory) {
      setGenerationProgress('Generating backstory...');
      if (extraInstructions) {
        updatedScenario.notes = `Extra instructions for generation: ${extraInstructions}`;
      }
      try {
        const backstoryResult = await generateBackstory(updatedScenario, {
          onProgress: (generatedText: string) => {
            setGenerationProgress('Generating backstory...\n' + generatedText);
            updatedScenario.backstory = generatedText;
          }
        });
        const generatedBackstory = await backstoryResult.result;
        updatedScenario.backstory = generatedBackstory;
      } catch (error) {
        console.error('Error generating backstory:', error);
        updatedScenario.backstory = "Error generating backstory.";
      }
    }

    if (randomScenarioOptions.generateStoryArc) {
      setGenerationProgress('Generating story arc...');
      try {
        const storyArcResult = await generateStoryArc(updatedScenario, {
          onProgress: (generatedText: string) => {
            setGenerationProgress('Generating story arc...\n' + generatedText);
            updatedScenario.storyarc = generatedText;
          }
        });
        const generatedStoryArc = await storyArcResult.result;
        updatedScenario.storyarc = generatedStoryArc;
      } catch (error) {
        console.error('Error generating story arc:', error);
        updatedScenario.storyarc = "Error generating story arc.";
      }
    }

    setGenerationProgress('Updating scenario...');
    onLoadScenario(updatedScenario);
    if (onSwitchTab) {
      onSwitchTab('main');
    }
  } catch (error) {
    console.error('Error randomizing scenario:', error);
    alert('There was an error while randomizing the scenario. Please try again.');
  } finally {
    setIsGeneratingScenario(false);
    setGenerationCancelHandler(null);
  }
}
