/**
 * Service for generating character names using unique-names-generator
 * This service provides a centralized way to generate character names that can be easily
 * swapped out for other name generation libraries or APIs in the future.
 * 
 * @example
 * ```typescript
 * // Generate a full name for any gender
 * const name = await generateFullName();
 * console.log(name); // "John Smith"
 * 
 * // Generate a female name
 * const femaleName = await generateFullName('female');
 * console.log(femaleName); // "Sarah Johnson"
 * 
 * // Generate just a first name
 * const firstName = await generateFirstName('male');
 * console.log(firstName); // "Michael"
 * ```
 */

export type Gender = 'male' | 'female' | 'other' | undefined;

export interface NameGeneratorOptions {
  gender?: Gender;
  includeLastName?: boolean;
}

export interface GeneratedName {
  firstName: string;
  lastName?: string;
  fullName: string;
}

// Common surname suffixes and patterns for generating realistic last names
const surnameSuffixes = ['son', 'sen', 'ton', 'wood', 'field', 'stein', 'berg', 'man', 'worth'];
const surnamePatterns = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris'];

/**
 * Generate a character name using unique-names-generator
 * @param options Name generation options
 * @returns Promise resolving to generated name object
 */
export async function generateCharacterName(options: NameGeneratorOptions = {}): Promise<GeneratedName> {
  const { includeLastName = true } = options;
  
  // Dynamic import to avoid loading unique-names-generator unless needed
  const { uniqueNamesGenerator, names } = await import('unique-names-generator');
  
  // Generate first name using the names dictionary
  const firstName = uniqueNamesGenerator({
    dictionaries: [names],
    separator: '',
    length: 1,
  });
  
  // Generate last name if requested
  let lastName: string | undefined;
  if (includeLastName) {
    // Mix of common surnames and generated surnames
    if (Math.random() < 0.6) {
      // 60% chance: Use a common surname
      lastName = surnamePatterns[Math.floor(Math.random() * surnamePatterns.length)];
    } else {
      // 40% chance: Generate a surname using name + suffix
      const baseName = uniqueNamesGenerator({
        dictionaries: [names],
        separator: '',
        length: 1,
      });
      const suffix = surnameSuffixes[Math.floor(Math.random() * surnameSuffixes.length)];
      lastName = baseName + suffix;
    }
  }
  
  // Combine names
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  
  return {
    firstName,
    lastName,
    fullName
  };
}

/**
 * Generate just a first name
 * @param gender Optional gender preference
 * @returns Promise resolving to first name string
 */
export async function generateFirstName(gender?: Gender): Promise<string> {
  const result = await generateCharacterName({ gender, includeLastName: false });
  return result.firstName;
}

/**
 * Generate a full name (first + last)
 * @param gender Optional gender preference
 * @returns Promise resolving to full name string
 */
export async function generateFullName(gender?: Gender): Promise<string> {
  const result = await generateCharacterName({ gender, includeLastName: true });
  return result.fullName;
}

/**
 * Generate multiple character names at once
 * @param count Number of names to generate
 * @param options Name generation options
 * @returns Promise resolving to array of generated names
 */
export async function generateMultipleNames(count: number, options: NameGeneratorOptions = {}): Promise<GeneratedName[]> {
  const names: GeneratedName[] = [];
  for (let i = 0; i < count; i++) {
    names.push(await generateCharacterName(options));
  }
  return names;
}