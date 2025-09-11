declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: GoogleIdentityConfig): void;
          prompt(callback?: (notification: GooglePromptNotification) => void): void;
          renderButton(element: HTMLElement, config: GoogleButtonConfig): void;
          disableAutoSelect(): void;
          storeCredential(credential: GoogleCredential, callback?: () => void): void;
          cancel(): void;
          onGoogleLibraryLoad?: () => void;
          revoke(hint: string, callback: (response: GoogleRevokeResponse) => void): void;
        };
        oauth2: {
          initTokenClient(config: GoogleTokenClientConfig): GoogleTokenClient;
          hasGrantedAnyScope(tokenResponse: GoogleTokenResponse, ...scopes: string[]): boolean;
          hasGrantedAllScopes(tokenResponse: GoogleTokenResponse, ...scopes: string[]): boolean;
          revoke(accessToken: string, callback?: () => void): void;
        };
      };
    };
  }
}

export interface GoogleIdentityConfig {
  client_id: string;
  callback: (credentialResponse: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
}

export interface GoogleCredentialResponse {
  credential: string; // JWT token
  select_by: 'auto' | 'user' | 'user_1tap' | 'user_2tap' | 'btn' | 'btn_confirm' | 'btn_add_session' | 'btn_confirm_add_session';
}

export interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string | number;
  locale?: string;
}

export interface GooglePromptNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
  isDismissedMoment(): boolean;
  getNotDisplayedReason(): 'browser_not_supported' | 'invalid_client' | 'missing_client_id' | 'opt_out_or_no_session' | 'secure_http_required' | 'suppressed_by_user' | 'unregistered_origin' | 'unknown_reason';
  isDisplayMoment(): boolean;
  isDisplayed(): boolean;
  getSkippedReason(): 'auto_cancel' | 'user_cancel' | 'tap_outside' | 'issuing_failed';
  getDismissedReason(): 'credential_returned' | 'cancel_called' | 'flow_restarted';
  getMomentType(): 'display' | 'skipped' | 'dismissed';
}

export interface GoogleCredential {
  id: string;
  password: string;
}

export interface GoogleRevokeResponse {
  successful: boolean;
  error?: string;
}

export interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (tokenResponse: GoogleTokenResponse) => void;
  error_callback?: (error: GoogleError) => void;
  state?: string;
  enable_granular_consent?: boolean;
  include_granted_scopes?: boolean;
  prompt?: '' | 'none' | 'consent' | 'select_account';
}

export interface GoogleTokenClient {
  requestAccessToken(overrideConfig?: Partial<GoogleTokenClientConfig>): void;
}

export interface GoogleTokenResponse {
  access_token: string;
  authuser: string;
  expires_in: number;
  hd?: string;
  prompt: string;
  scope: string;
  state?: string;
  token_type: 'Bearer';
}

export interface GoogleError {
  type: 'popup_closed' | 'popup_failed_to_open' | 'unknown';
  message?: string;
}

export {};