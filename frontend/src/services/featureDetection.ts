/**
 * Feature Detection Service
 * Detects available capabilities based on the current LLM backend
 */

import { BackendType } from '../types/LLMTypes';

export interface FeatureCapabilities {
  chat: boolean;
  multimodal: boolean;
  imageGeneration: boolean;
}

/**
 * Get feature capabilities for a given LLM backend
 */
export function getFeatureCapabilities(backend: BackendType): FeatureCapabilities {
  switch (backend) {
    case 'chatgpt':
      return {
        chat: true,
        multimodal: true,
        imageGeneration: true,
      };
    
    case 'github':
      return {
        chat: true,
        multimodal: true,
        imageGeneration: true,
      };
    
    case 'ollama':
      return {
        chat: true,
        multimodal: false,
        imageGeneration: false,
      };
    
    case 'lmstudio':
      return {
        chat: true,
        multimodal: true,
        imageGeneration: false,
      };
    
    default:
      return {
        chat: false,
        multimodal: false,
        imageGeneration: false,
      };
  }
}

/**
 * Check if image generation is available for the current backend
 */
export function isImageGenerationAvailable(backend: BackendType): boolean {
  const capabilities = getFeatureCapabilities(backend);
  return capabilities.imageGeneration;
}

/**
 * Check if multimodal features are available for the current backend
 */
export function isMultimodalAvailable(backend: BackendType): boolean {
  const capabilities = getFeatureCapabilities(backend);
  return capabilities.multimodal;
}

/**
 * Check if chat features are available for the current backend
 */
export function isChatAvailable(backend: BackendType): boolean {
  const capabilities = getFeatureCapabilities(backend);
  return capabilities.chat;
}