/**
 * Utility functions for handling and displaying errors to users
 */

/**
 * Checks if an error is related to insufficient credits
 */
export function isInsufficientCreditsError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes('insufficient credits') || 
         (message.includes('credit') && (message.includes('needed') || message.includes('required')));
}

/**
 * Shows a user-friendly error message with appropriate actions using custom modal functions
 */
export async function showUserFriendlyErrorWithModals(
  error: Error, 
  context: string = 'operation',
  customAlert: (message: string, title?: string) => void,
  customConfirm: (message: string, options?: any) => Promise<boolean>
): Promise<void> {
  const errorMessage = error.message;
  
  if (isInsufficientCreditsError(error)) {
    const shouldRedirect = await customConfirm(
      `${errorMessage}\n\nWould you like to purchase more credits now?`,
      {
        title: `${context} Failed - Insufficient Credits`,
        confirmText: 'Buy Credits',
        cancelText: 'Cancel'
      }
    );
    
    if (shouldRedirect) {
      window.location.href = '/buy-credits';
    }
  } else {
    customAlert(errorMessage, `${context} Error`);
  }
}

/**
 * Shows a user-friendly error message with appropriate actions (legacy version using native dialogs)
 * @deprecated Use showUserFriendlyErrorWithModals instead
 */
export function showUserFriendlyError(error: Error, context: string = 'operation'): void {
  const errorMessage = error.message;
  
  if (isInsufficientCreditsError(error)) {
    const shouldRedirect = window.confirm(
      `❌ ${context} Failed - Insufficient Credits\n\n` +
      `${errorMessage}\n\n` +
      `Would you like to purchase more credits now?\n\n` +
      `Click OK to go to the Buy Credits page, or Cancel to stay here.`
    );
    
    if (shouldRedirect) {
      window.location.href = '/buy-credits';
    }
  } else {
    window.alert(`❌ ${context} Error\n\n${errorMessage}`);
  }
}

/**
 * Extracts a user-friendly error message from various error formats
 */
export function getUserFriendlyErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallbackMessage;
}
