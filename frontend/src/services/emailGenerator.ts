/**
 * Service for generating creative email addresses using unique-names-generator
 * This service creates fun and unique email addresses for testing purposes.
 */

export interface EmailGeneratorOptions {
  useCreativeDomain?: boolean;
  domainStyle?: 'adjectives-animals' | 'colors-countries' | 'mixed';
}

export interface GeneratedEmail {
  localPart: string;
  domain: string;
  fullEmail: string;
}

/**
 * Generate a creative email address
 * @param localPart The part before @ (if not provided, will be generated)
 * @param options Email generation options
 * @returns Promise resolving to generated email object
 */
export async function generateEmail(localPart?: string, options: EmailGeneratorOptions = {}): Promise<GeneratedEmail> {
  const { useCreativeDomain = true, domainStyle = 'mixed' } = options;
  
  // Dynamic import to avoid loading unique-names-generator unless needed
  const { uniqueNamesGenerator, adjectives, animals, colors, countries } = await import('unique-names-generator');
  
  // Generate local part if not provided
  let emailLocalPart = localPart;
  if (!emailLocalPart) {
    emailLocalPart = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: '.',
      length: 2,
    });
  }
  
  // Generate creative domain
  let domain: string;
  if (useCreativeDomain) {
    let domainName: string;
    
    switch (domainStyle) {
      case 'adjectives-animals':
        domainName = uniqueNamesGenerator({
          dictionaries: [adjectives, animals],
          separator: '',
          length: 2,
        });
        break;
      case 'colors-countries':
        domainName = uniqueNamesGenerator({
          dictionaries: [colors, countries],
          separator: '',
          length: 2,
        });
        break;
      case 'mixed':
      default: {
        // Randomly choose between the two styles
        const useMixed = Math.random() < 0.5;
        if (useMixed) {
          domainName = uniqueNamesGenerator({
            dictionaries: [adjectives, animals],
            separator: '',
            length: 2,
          });
        } else {
          domainName = uniqueNamesGenerator({
            dictionaries: [colors, countries],
            separator: '',
            length: 2,
          });
        }
        break;
      }
    }
    
    // Add common TLD
    const tlds = ['com', 'org', 'net', 'dev', 'io'];
    const tld = tlds[Math.floor(Math.random() * tlds.length)];
    domain = `${domainName.toLowerCase()}.${tld}`;
  } else {
    // Use common test domains
    const commonDomains = ['example.com', 'test.org', 'demo.net'];
    domain = commonDomains[Math.floor(Math.random() * commonDomains.length)];
  }
  
  const fullEmail = `${emailLocalPart.toLowerCase()}@${domain}`;
  
  return {
    localPart: emailLocalPart.toLowerCase(),
    domain,
    fullEmail
  };
}

/**
 * Generate an email using a person's name as the local part
 * @param firstName First name to use
 * @param lastName Last name to use (optional)
 * @param options Email generation options
 * @returns Promise resolving to generated email
 */
export async function generateEmailFromName(
  firstName: string, 
  lastName?: string, 
  options: EmailGeneratorOptions = {}
): Promise<GeneratedEmail> {
  // Create local part from name
  const localPart = lastName 
    ? `${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, '.')
    : firstName.toLowerCase().replace(/\s+/g, '.');
  
  return generateEmail(localPart, options);
}

/**
 * Generate a completely random email address
 * @param options Email generation options
 * @returns Promise resolving to generated email
 */
export async function generateRandomEmail(options: EmailGeneratorOptions = {}): Promise<GeneratedEmail> {
  return generateEmail(undefined, options);
}

/**
 * Generate multiple email addresses
 * @param count Number of emails to generate
 * @param options Email generation options
 * @returns Promise resolving to array of generated emails
 */
export async function generateMultipleEmails(count: number, options: EmailGeneratorOptions = {}): Promise<GeneratedEmail[]> {
  const emails: GeneratedEmail[] = [];
  for (let i = 0; i < count; i++) {
    emails.push(await generateRandomEmail(options));
  }
  return emails;
}