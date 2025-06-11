# Epic: Public Launch & Monetization Strategy

## 🎯 Goal

To evolve the application from a single-user, self-hosted tool into a public, multi-tiered service. This involves creating a public-facing presence, implementing a robust user account system, and integrating a flexible monetization model to support Free, BYOK (Bring Your Own Key), and Premium (credit-based) users.

---

## 👥 User Tiers Definition

The application will support three distinct user levels:

| Tier | Description | AI Access Method | Cost to User |
| :--- | :--- | :--- | :--- |
| **Free** | Entry-level access for trial and light usage. | Uses the application's API key. Heavily rate-limited and may use a faster, less powerful model. | Free |
| **BYOK** | For technical users who want to use their own AI provider accounts. | Uses the user's own provided API key. The application acts as a UI/workflow tool. | Free (user pays their own API provider) |
| **Premium** | For users wanting a seamless, integrated experience with full capabilities. | Uses the application's API key with premium, powerful models. | Paid (via a credit-based system) |

---

## ✨ Feature Breakdown

This epic is broken down into the following features. The initial focus will be on implementing the frontend components, followed by the backend logic.

### Feature 1: Public Homepage & Core Navigation

*   **Description:** Create the initial public-facing marketing page and update the application's core navigation to support anonymous and logged-in states.
*   **User Stories / Tasks:**
    *   As an **anonymous visitor**, I want to see a compelling homepage that showcases the app's features, explains the user tiers, and has clear "Login" and "Sign Up" buttons.
    *   As a **user**, I want the main navigation bar to change based on my login status.
        *   *Anonymous:* Shows "Features," "Pricing," "Login," "Sign Up."
        *   *Logged-in:* Shows my user avatar/email, a link to my dashboard, and a "Logout" button.
    *   The existing login/signup flow needs to be integrated into this new structure.

### Feature 2: User Account Dashboard

*   **Description:** A centralized hub for logged-in users to manage their account, settings, and billing information.
*   **User Stories / Tasks:**
    *   As a **logged-in user**, I want a main dashboard page that welcomes me and provides an overview of my current status (e.g., "You are on the Free plan").
    *   As a **BYOK user**, I need a settings page where I can securely enter, update, and remove my personal API key. The input field should obscure the key for security.
    *   As a **Premium user**, I need a billing/credits page that clearly displays my current credit balance and a history of my credit usage.
    *   As a **Free or BYOK user**, I want to see prompts and "Upgrade" buttons on the dashboard that guide me toward the Premium plan.

### Feature 3: Premium Tier & Mocked Payment Flow

*   **Description:** Implement the UI and frontend logic for the credit-based premium system. The actual payment processing will be mocked initially.
*   **User Stories / Tasks:**
    *   As a **user**, I need a dedicated "Buy Credits" page.
    *   This page should display different credit packages (e.g., "€5 for 500 credits," "€10 for 1200 credits").
    *   When I click a package, a "mock" payment modal will appear. It should simulate a successful or failed payment.
    *   On a "successful" mock payment, the UI should update to reflect my new credit balance.

### Feature 4: Legal & Trust Framework

*   **Description:** Establish trust with users by providing clear legal documentation.
*   **User Stories / Tasks:**
    *   As a **user**, I want to be able to access and read a clear **Privacy Policy** page that explains what data is collected and how it is used, especially concerning my prompts and API keys.
    *   As a **user**, I want to be able to access a **Terms of Service** page that outlines the rules of using the application.
    *   The "Sign Up" page must include a checkbox and a link to these documents, requiring users to agree before creating an account.

### Feature 5: Backend Architecture for Multi-Tier Logic (To be implemented later)

*   **Description:** Refactor the backend to handle requests from different user tiers, apply the correct logic, and manage data securely.
*   **User Stories / Tasks:**
    *   **Database Schema:** The `users` table needs to be extended to include `tier` (e.g., 'free', 'byok', 'premium'), `credits` (integer), and `api_key` (encrypted string).
    *   **API Middleware:** Create a middleware that intercepts every AI request. It will check the user's token, load their profile from the database, and determine their tier.
    *   **AI Request Router:** The `/proxy/llm/v1/chat/completions` endpoint logic must be updated:
        *   If `tier == 'free'`, enforce a strict rate limit before using the app's internal key.
        *   If `tier == 'byok'`, retrieve the user's decrypted API key and use it for the request. Handle potential invalid key errors gracefully.
        *   If `tier == 'premium'`, check if `user.credits > 0`. If so, make the request with the app's internal key, and upon successful response, decrement the user's credit balance. If credits are zero, return an "Insufficient Credits" error.
    *   **Secure API Key Storage:** Ensure user-provided API keys are encrypted at rest in the database.

---

## 🗺️ Phased Rollout Plan

1.  **Phase 1: Frontend First.** Implement all UI/UX changes from Features 1, 2, 3, and 4. The application will be visually complete. API key fields will not save, and the "Buy Credits" button will trigger a simple alert or modal. The goal is to build the entire user journey in the browser.
2.  **Phase 2: Backend Implementation.** Implement all backend logic from Feature 5. Connect the frontend components to the live backend endpoints.
3.  **Phase 3: Launch.** Go live with the Free and BYOK tiers first to gather feedback. Fully integrate a real payment provider (like Stripe) to replace the mock flow and enable the Premium tier for public access.