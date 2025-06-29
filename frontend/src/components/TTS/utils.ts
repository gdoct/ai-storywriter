/**
 * Utility functions for text-to-speech processing
 */

/**
 * Strips markdown formatting from text for better TTS readability
 * @param text - The markdown text to clean
 * @returns Clean text suitable for TTS
 */
export const stripMarkdownForTTS = (text: string): string => {
  if (!text) return '';
  
  return text
    // Remove markdown headers (# ## ###)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers (**text** *text* __text__ _text_)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove strikethrough (~~text~~)
    .replace(/~~(.*?)~~/g, '$1')
    // Remove code blocks (```code```)
    .replace(/```[\s\S]*?```/g, '[Code Block]')
    // Remove inline code (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images ![alt](url) -> alt text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove horizontal rules (--- or ***)
    .replace(/^(-{3,}|\*{3,})$/gm, '[Section Break]')
    // Remove blockquotes (> text)
    .replace(/^>\s+/gm, '')
    // Remove list markers (- * + 1.)
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Replace multiple line breaks with double space (pause for TTS)
    .replace(/\n\s*\n/g, '  ')
    // Replace single line breaks with space
    .replace(/\n/g, ' ')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Estimates reading time for text
 * @param text - The text to analyze
 * @param wordsPerMinute - Average reading speed (default: 200 WPM)
 * @returns Estimated reading time in minutes
 */
export const estimateReadingTime = (text: string, wordsPerMinute: number = 200): number => {
  if (!text) return 0;
  
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

/**
 * Gets a human-readable time format
 * @param minutes - Time in minutes
 * @returns Human-readable time string
 */
export const formatReadingTime = (minutes: number): string => {
  if (minutes < 1) return 'Less than 1 minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 1 && remainingMinutes === 0) return '1 hour';
  if (hours === 1) return `1 hour ${remainingMinutes} minutes`;
  if (remainingMinutes === 0) return `${hours} hours`;
  
  return `${hours} hours ${remainingMinutes} minutes`;
};
