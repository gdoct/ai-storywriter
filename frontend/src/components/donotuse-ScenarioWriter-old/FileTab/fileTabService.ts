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
      const savedScenario = await onSaveScenario(updatedScenario);
      setShowSaveAsInput(false);
      fetchScenarios();
      if (onSaveComplete) onSaveComplete();
      // Return the saved scenario so the caller can update the selected scenario ID
      return savedScenario;
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
