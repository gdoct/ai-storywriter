import { deleteScenario, fetchAllScenarios, fetchGeneratedStory, fetchScenarioById, updateScenario } from '../../../services/scenario';
import { Scenario } from '../../../types/ScenarioTypes';

export async function fetchScenarios(setScenarios: (scenarios: {id: string, title: string, synopsis: string}[]) => void) {
  try {
    const data = await fetchAllScenarios();
    setScenarios(data);
  } catch (error) {
    console.error('Failed to fetch scenarios:', error);
  }
}

export async function loadScenario(
  id: string,
  onLoadScenario: (scenario: Scenario, generatedStory?: string | null) => void,
  setShowConfirm: (show: boolean) => void,
  setShowSaveConfirm: (show: boolean) => void,
  setIsDropdownOpen: (open: boolean) => void
) {
  if (!id) return;
  try {
    const scenario = await fetchScenarioById(id);
    let generatedStory = null;
    try {
      const storyResponse = await fetchGeneratedStory(id);
      if (storyResponse && storyResponse.content) {
        generatedStory = storyResponse.content;
      }
    } catch (error) {
      console.log('No generated story found for this scenario');
    }
    onLoadScenario(scenario, generatedStory);
    setShowConfirm(false);
    setShowSaveConfirm(false);
    setIsDropdownOpen(false);
  } catch (error) {
    console.error('Failed to load scenario:', error);
  }
}

export async function handleSaveAndLoad(
  currentScenario: Scenario | null,
  onSaveScenario: (scenario: Scenario) => Promise<void>,
  pendingScenarioId: string,
  loadScenarioFn: (id: string) => Promise<void>,
  setPendingScenarioId: (id: string) => void
) {
  if (!currentScenario) return;
  try {
    await onSaveScenario(currentScenario);
    if (pendingScenarioId) {
      await loadScenarioFn(pendingScenarioId);
      setPendingScenarioId('');
    }
  } catch (error) {
    console.error('Failed to save scenario:', error);
  }
}

export function handleDiscardAndLoad(
  pendingScenarioId: string,
  loadScenarioFn: (id: string) => void,
  setPendingScenarioId: (id: string) => void,
  setShowSaveConfirm: (show: boolean) => void
) {
  if (pendingScenarioId) {
    loadScenarioFn(pendingScenarioId);
    setPendingScenarioId('');
  }
  setShowSaveConfirm(false);
}

export function handleCancelSwitch(
  currentScenario: Scenario | null,
  setSelectedScenarioId: (id: string) => void,
  setPendingScenarioId: (id: string) => void,
  setShowSaveConfirm: (show: boolean) => void
) {
  if (currentScenario?.id) {
    setSelectedScenarioId(currentScenario.id);
  } else {
    setSelectedScenarioId('');
  }
  setPendingScenarioId('');
  setShowSaveConfirm(false);
}

export async function confirmRenameScenario(
  currentScenario: Scenario | null,
  renameTitle: string,
  scenarios: {id: string, title: string, synopsis: string}[],
  setErrorMessage: (msg: string) => void,
  onLoadScenario: (scenario: Scenario) => void,
  setShowRenameInput: (show: boolean) => void,
  fetchScenarios: () => void
) {
  if (!renameTitle.trim()) {
    setErrorMessage('Title cannot be empty');
    return;
  }
  if (scenarios.some(s => s.title === renameTitle && s.id !== currentScenario?.id)) {
    setErrorMessage('A scenario with this title already exists');
    return;
  }
  try {
    if (currentScenario) {
      const updatedScenario = { ...currentScenario, title: renameTitle.trim() };
      const result = await updateScenario(updatedScenario);
      onLoadScenario(result);
      setShowRenameInput(false);
      fetchScenarios();
    }
  } catch (error) {
    console.error('Failed to rename scenario:', error);
    setErrorMessage('Failed to rename scenario');
  }
}

export async function confirmDeleteScenario(
  scenarioToDelete: string,
  currentScenario: Scenario | null,
  onLoadScenario: (scenario: Scenario) => void,
  setSelectedScenarioId: (id: string) => void,
  setShowDeleteConfirm: (show: boolean) => void,
  fetchScenarios: () => void
) {
  try {
    await deleteScenario(scenarioToDelete);
    if (currentScenario && currentScenario.id === scenarioToDelete) {
      const username = localStorage.getItem('username') || 'anonymous';
      const emptyScenario: Scenario = {
        id: '',
        userId: username,
        title: '',
        synopsis: '',
        createdAt: new Date(),
      };
      onLoadScenario(emptyScenario);
    }
    setSelectedScenarioId('');
    setShowDeleteConfirm(false);
    fetchScenarios();
  } catch (error) {
    console.error('Failed to delete scenario:', error);
  }
}
