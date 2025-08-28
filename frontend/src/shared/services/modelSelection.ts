// Service for managing the currently selected model
// This is independent of the LLM settings and stores the model selection in localStorage

const MODEL_STORAGE_KEY = 'storywriter_selected_model';

export function getSelectedModel(): string | null {
  return localStorage.getItem(MODEL_STORAGE_KEY);
}

export function setSelectedModel(model: string): void {
  localStorage.setItem(MODEL_STORAGE_KEY, model);
}

export function clearSelectedModel(): void {
  localStorage.removeItem(MODEL_STORAGE_KEY);
}
