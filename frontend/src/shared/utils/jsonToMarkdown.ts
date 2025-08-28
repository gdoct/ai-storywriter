/**
 * Utility module for converting JSON objects to Markdown format.
 * Converts JSON objects into a hierarchical Markdown representation where:
 * - Object properties become headers with their values as content
 * - Nested objects create deeper header levels (more #)
 * - Arrays are processed with each item as a sub-section
 */

/**
 * Convert a JSON object to Markdown string representation
 * @param json The JSON object to convert
 * @param options Configuration options for the conversion
 * @returns A string containing the markdown representation
 */
export function jsonToMarkdown(
  json: string, 
  options: {
    initialLevel?: number,
    arrayItemPrefix?: string
  } = {}
): string {
  const { 
    initialLevel = 1,
    arrayItemPrefix = '- '
  } = options;
  
  // StringBuilder for performance when building large markdown strings
  let markdownBuilder: string[] = [];
  
  // Process the JSON recursively
  processNode(json, initialLevel, markdownBuilder);
  
  return markdownBuilder.join('\n');
  
  /**
   * Helper function to process a node recursively
   * @param node The current node to process
   * @param level Current heading level (number of #)
   * @param result Array collecting markdown strings
   */
  function processNode(node: any, level: number, result: string[]): void {
    // Handle null or undefined
    if (node === null || node === undefined) {
      result.push('null');
      return;
    }
    
    // Handle different types of nodes
    switch (typeof node) {
      case 'object': {
        // Handle arrays
        if (Array.isArray(node)) {
          // Empty array
          if (node.length === 0) {
            result.push('[]');
            return;
          }
          
          // Process each array item
          node.forEach((item, index) => {
            // For primitive values in arrays, use a list format
            if (isPrimitive(item)) {
              result.push(`${arrayItemPrefix}${item}`);
            } else {
              // For objects in arrays, create a sub-section
              result.push('');
              processNode(item, level + 1, result);
            }
          });
          return;
        }
        
        // Handle regular objects
        const entries = Object.entries(node);
        if (entries.length === 0) {
          result.push('{}');
          return;
        }
        
        // Process each property of the object
        entries.forEach(([key, value], index) => {
          // Add an empty line between properties except for the first one
          if (index > 0) {
            result.push('');
          }
          
          // Property as header
          result.push(`${'#'.repeat(level)} ${key}`);
          
          // Process the value
          if (isPrimitive(value)) {
            result.push(`${value}`);
          } else {
            // Recursive call for object/array values with increased header level
            processNode(value, level + 1, result);
          }
        });
        break;
      }
        
      // Handle primitive types
      default:
        result.push(`${node}`);
        break;
    }
  }
  
  /**
   * Check if a value is a primitive
   * @param value Value to check
   * @returns True if the value is a primitive
   */
  function isPrimitive(value: any): boolean {
    return value === null || 
           value === undefined || 
           typeof value !== 'object';
  }
}

/**
 * Formats a JSON string or object into a Markdown string
 * @param jsonInput JSON string or object to convert
 * @returns A string containing the markdown representation
 * @throws Error if the input cannot be parsed as JSON
 */
export function formatJsonAsMarkdown(jsonInput: string | object): string {
  let jsonObject: any;
  
  // Parse input if it's a string
  if (typeof jsonInput === 'string') {
    try {
      jsonObject = JSON.parse(jsonInput);
    } catch (e) {
      throw new Error(`Invalid JSON input: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    jsonObject = jsonInput;
  }
  
  return jsonToMarkdown(jsonObject);
}

export default {
  jsonToMarkdown,
  formatJsonAsMarkdown
};
