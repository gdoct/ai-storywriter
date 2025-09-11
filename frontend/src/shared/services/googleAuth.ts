import { GoogleCredentialResponse, GoogleIdentityConfig, GoogleButtonConfig } from '../types/google';

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE'; // Replace with your actual client ID

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private isInitialized = false;

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        resolve();
        return;
      }

      if (window.google?.accounts?.id) {
        this.isInitialized = true;
        resolve();
        return;
      }

      // Wait for Google Identity Services to load
      const checkGoogle = () => {
        if (window.google?.accounts?.id) {
          this.isInitialized = true;
          resolve();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };

      // Start checking after a short delay
      setTimeout(checkGoogle, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.isInitialized) {
          reject(new Error('Google Identity Services failed to load'));
        }
      }, 10000);
    });
  }

  public async initializeGoogleAuth(callback: (response: GoogleCredentialResponse) => void): Promise<void> {
    await this.initialize();

    const config: GoogleIdentityConfig = {
      client_id: GOOGLE_CLIENT_ID,
      callback: callback,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin'
    };

    window.google!.accounts.id.initialize(config);
  }

  public async renderButton(element: HTMLElement, theme: 'outline' | 'filled_blue' = 'outline'): Promise<void> {
    await this.initialize();

    const config: GoogleButtonConfig = {
      theme: theme,
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: '100%'
    };

    window.google!.accounts.id.renderButton(element, config);
  }

  public async promptOneTap(callback: (response: GoogleCredentialResponse) => void): Promise<void> {
    await this.initializeGoogleAuth(callback);
    window.google!.accounts.id.prompt();
  }

  public disableAutoSelect(): void {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  public cancel(): void {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.cancel();
    }
  }
}