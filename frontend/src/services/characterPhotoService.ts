import { Character } from '../types/ScenarioTypes';
import axios from './http';

export interface CharacterPhotoResponse {
  success: boolean;
  character: Character;
  photoId: string;
  photoUrl: string;
  message: string;
}

/**
 * Upload a photo and generate a character from it
 */
export const createCharacterFromPhoto = async (
  file: File, 
  prompt: string
): Promise<CharacterPhotoResponse> => {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('prompt', prompt);

  const response = await axios.post<CharacterPhotoResponse>(
    '/api/characters/create-from-photo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

/**
 * Delete a character photo
 */
export const deleteCharacterPhoto = async (photoId: string): Promise<void> => {
  await axios.delete(`/api/character-photos/${photoId}`);
};

/**
 * Upload a photo for an existing character
 */
export const uploadCharacterPhoto = async (
  characterId: string,
  file: File
): Promise<{ photoId: string; photoUrl: string }> => {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('characterId', characterId);

  const response = await axios.post<{ photoId: string; photoUrl: string }>(
    '/api/characters/upload-photo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

/**
 * Generate a specific field from a character photo
 */
export const generateFieldFromPhoto = async (
  photoId: string,
  fieldName: string = 'appearance',
  characterContext: string = '',
  prompt: string = ''
): Promise<{ fieldValue: string }> => {
  const formData = new FormData();
  formData.append('photoId', photoId);
  formData.append('field', fieldName);
  formData.append('characterContext', characterContext);
  formData.append('prompt', prompt);

  const response = await axios.post<{ success: boolean; fieldValue: string }>(
    '/api/characters/generate-field-from-photo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return { fieldValue: response.data.fieldValue };
};

/**
 * Generate character appearance from a photo using a properly formatted prompt
 */
export const generateAppearanceFromPhoto = async (
  photoId: string,
  prompt: string
): Promise<{ appearance: string }> => {
  const formData = new FormData();
  formData.append('photoId', photoId);
  formData.append('prompt', prompt);

  const response = await axios.post<{ success: boolean; appearance: string }>(
    '/api/characters/generate-appearance-from-photo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return { appearance: response.data.appearance };
};
