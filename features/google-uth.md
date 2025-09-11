# feature: authenticate with google
REMAINING BUG
in the user settings, i can link my google account and it will show as linked. but after I link my google account, then go to the dashboard and back to the user settings page, it shows as unlinked. I think the setting does not persist properly in the database.

This feature allows users to authenticate using their Google account via OAuth 2.0 Authorization Code Flow.
If a user successfully authenticates, and the user does not exist, create a new user with the same email address. otherwise log in as the existing user.
this means the user table should have an extra column indicating if it is a local account or a remote account

these changes will need to be done at the frontend (the login page) and the backend (the login controller)

## Technical Implementation Details

### OAuth Flow
- **Flow Type**: Authorization Code Flow with PKCE (recommended for SPAs)
- **Authentication**: JWT tokens for session management (integrates with existing auth system)
- **Token Storage**: Frontend stores JWT in localStorage/sessionStorage, backend validates
- **State Parameter**: CSRF protection with random state validation
- **Error Handling**: Graceful fallback to regular login on OAuth failures

### Security Requirements
- **Client ID**: Can be public (stored in frontend config)
- **Client Secret**: Backend-only, stored in .env file (NEVER commit to git)
- **HTTPS**: Required for production (redirects must use HTTPS)
- **Token Validation**: Backend validates Google tokens before issuing JWT

### Configuration (store in .env)
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Google Cloud Console Settings
**Authorized origins:**
- http://localhost:3000 (frontend dev)
- http://localhost:5600 (backend dev)  
- http://nuc-guido.drdata.nl:5600 (production)

**Redirect URIs:**
- http://localhost:3000/oauth-callback (frontend dev)
- http://localhost:5600/api/auth/google/callback (backend dev)
- http://nuc-guido.drdata.nl:5600/api/auth/google/callback (production)

### Database Schema Changes
Add to users table:
- `auth_provider` VARCHAR(20) DEFAULT 'local' (values: 'local', 'google')
- `google_id` VARCHAR(255) UNIQUE NULL (Google user ID)
- `profile_picture` VARCHAR(500) NULL (Google profile image URL)

Feature: Authenticate with Google
  As a user
  I want to authenticate using my Google account
  So that I can easily log in without creating a new account

## Scenario: User authenticates with Google for the first time
  Given the user is on the login page
  When the user clicks on the "Login with Google" button
  And the user successfully authenticates with their Google account
  Then a new user account is created with the user's email address
  And the user is logged in

## Scenario: User authenticates with Google and already has an account
    Given the user is on the login page
    When the user clicks on the "Login with Google" button
    And the user successfully authenticates with their Google account
    And the user already has an account with the same email address
    Then the user is logged in to their existing account    

## Scenario: User fails to authenticate with Google
    Given the user is on the login page
    When the user clicks on the "Login with Google" button
    And the user fails to authenticate with their Google account
    Then the user sees an error message indicating that authentication failed
    And the user remains on the login page

