# Feature: Story Marketplace

## 1. Overview

The Story Marketplace is a platform where users can publish their own stories and discover, read, rate, and support stories written by other users. The marketplace aims to foster a community of writers and readers, providing a space for sharing creative work and receiving feedback and appreciation. Key features include AI-generated summaries and genres, robust search and filtering capabilities, and a system for users to donate credits to their favorite authors.

## 2. User Stories

*   **As a Writer, I want to publish my stories to the marketplace so that others can read and appreciate my work.**
*   **As a Writer, I want the AI to help generate a compelling summary and appropriate genres for my story to attract readers.**
*   **As a Writer, I want to see how many times my story has been downloaded, rated, and how many credits I've received.**
*   **As a Reader, I want to easily browse and discover new stories based on my interests (genre, popularity, ratings).**
*   **As a Reader, I want to read AI-generated summaries and genres to quickly decide if a story interests me.**
*   **As a Reader, I want to download stories I like so I can read them offline.**
*   **As a Reader, I want to rate stories to share my opinion and help other readers.**
*   **As a Reader, I want to be able to donate credits to writers whose stories I enjoy, as a token of appreciation.**
*   **As a User, I want a visually appealing and intuitive interface to navigate the marketplace.**

## 3. Functional Requirements

### 3.1. Marketplace Home Page

*   **Accessibility:** A clear "Marketplace" link should be present in the main navigation bar.
*   **Layout:**
    *   Resemble a modern app store (e.g., Android Play Store) layout with carousels and categorized sections.
    *   Prominent search bar at the top.
*   **Content Sections:**
    *   **Hero/Featured Section:** Displaying a few hand-picked or algorithmically highlighted stories (e.g., "Staff Picks," "Trending Now").
    *   **Badges/Quick Links:** Visual badges for "Top Rated," "Most Popular," "Latest Stories."
    *   **Genre Sections:** Dedicated carousels or grids for popular genres (e.g., "Science Fiction," "Fantasy," "Romance," "Mystery"). Each section will display a selection of stories from that genre.
    *   **Special Lists:**
        *   Top Rated Stories
        *   Most Popular Stories (by downloads/views)
        *   Latest Stories
        *   Most Downloaded Stories
        *   Most Donated-to Stories
        *   Staff Recommended Stories
*   **Story Cards:** Each story displayed in lists or carousels should show:
    *   Cover Image (if applicable, placeholder if not)
    *   Title
    *   Author
    *   Average Rating (e.g., star icons)
    *   Short AI-generated summary (on hover or truncated)

### 3.2. Search, Filter, and Sort

*   **Search:**
    *   Users can search by story title, author name, or keywords within the story content/summary.
    *   Search results page should display stories in a list or grid format, similar to the home page story cards.
*   **Filter:**
    *   Filter options available on the search results page and potentially on genre-specific pages.
    *   Filter by:
        *   Genre (multi-select)
        *   Average Rating (e.g., 4 stars and up, 3 stars and up)
        *   Story Length (e.g., Short, Medium, Long - defined by word count ranges)
        *   Date Published (e.g., Last week, Last month, Last year)
*   **Sort:**
    *   Sort options available on the search results page and category listings.
    *   Sort by:
        *   Relevance (for search results)
        *   Average Rating (highest to lowest, lowest to highest)
        *   Popularity (most downloads/views first)
        *   Date Published (newest first, oldest first)
        *   Number of Donations

### 3.3. Story Detail Page

*   **Navigation:** Accessed by clicking a story card from the home page, search results, or any story list.
*   **Content Display:**
    *   Full Title
    *   Author Name (clickable, leading to an author profile page - future enhancement)
    *   AI-Generated Summary
    *   AI-Generated Genre(s) (displayed as tags)
    *   Full Story Content (paginated or scrollable if long)
    *   Average Rating (e.g., 4.5/5 stars)
    *   Total number of ratings
    *   Number of Downloads
    *   Total Credits Donated
    *   Date Published
*   **User Actions:**
    *   **Download Story:** Button to download the story (format TBD, e.g., .txt, .epub).
    *   **Rate Story:** Interface to submit a rating (e.g., 1-5 stars). Users can change their rating.
    *   **Donate Credits:** Button to open a modal/form to specify the amount of credits to donate to the author.
    *   **View/Add Comments:** A section for user comments (future enhancement, for now, focus on core marketplace).

### 3.4. Publishing Stories

*   **Trigger:** A "Publish to Marketplace" button available on the user's "My Stories" page (or next to each individual story they own).
*   **Publishing Modal/Form:**
    *   **Title:** Pre-filled if publishing an existing story, editable. (Required)
    *   **Author:** Pre-filled with the current user's name (read-only).
    *   **Story Content:** Pre-filled from the selected story (read-only preview, or link to the story editor).
    *   **AI Assistance:**
        *   Checkbox: "Allow AI to generate summary and genre." (Default: checked)
        *   If unchecked, fields for manual entry of summary and genre selection appear.
    *   **Terms & Conditions:** A checkbox confirming the user agrees to marketplace publishing terms (e.g., "I confirm I own the rights to this story and agree to the publishing terms."). (Required)
    *   **Buttons:**
        *   "Publish Story": Submits the story to the marketplace. Triggers AI processing if selected.
        *   "Cancel": Closes the modal.
*   **Post-Publish:**
    *   The story undergoes AI processing for summary and genre tagging.
    *   Once processed, it becomes visible in the marketplace.
    *   The writer receives a notification (optional).

### 3.5. AI Content Generation

*   **Summary Generation:** Upon publishing, the system sends the story content to an AI service to generate a concise summary (e.g., 100-200 words).
*   **Genre Tagging:** The AI service also analyzes the story content to suggest relevant genres (e.g., up to 3 genres).
*   **Moderation:** (Consideration for future) AI could also flag potentially problematic content, though manual review might be needed.

### 3.6. Credits and Donations

*   **User Credits:** Assumes a system where users have credits (earned, purchased, or awarded).
*   **Donation Process:**
    *   On the Story Detail Page, a "Donate Credits" button.
    *   Modal prompts the user to enter the amount of credits to donate.
    *   Confirmation step.
    *   Credits are deducted from the reader's balance and added to the writer's balance (or a pending balance).
*   **Tracking:** Writers can see total credits earned per story and overall.

## 4. Non-Functional Requirements

*   **Usability:** Intuitive navigation, clear calls to action, responsive design for various screen sizes.
*   **Performance:** Fast page load times, quick search results, efficient AI processing.
*   **Scalability:** The system should handle a growing number of stories and users.
*   **Security:** Protect user data and story content. Ensure donation transactions are secure.
*   **Reliability:** High uptime for the marketplace.

## 5. Page Mockups (ASCII Art)

### 5.1. Marketplace Home Page

```ascii
+--------------------------------------------------------------------------+
| [Logo] StoryWriter Marketplace   [Search Bar: Enter title, author, genre] |
| [Nav: Home | My Stories | Marketplace | Profile | Logout]                  |
+--------------------------------------------------------------------------+
|                                                                          |
|  +-------------------------+  +----------------------+  +-------------+  |
|  |      STAFF PICKS        |  |     TOP RATED        |  | LATEST      |  |
|  | [Story Cover]           |  | [Story Cover]        |  | [StoryCover]|  |
|  | Title 1 by Author A     |  | Title X by Author Y  |  | Title Z by  |  |
|  | ★★★★☆                   |  | ★★★★★                  |  | Author W    |  |
|  +-------------------------+  +----------------------+  +-------------+  |
|                                                                          |
|  --- Science Fiction --------------------------------------------------  |
|  +-------------+ +-------------+ +-------------+ +-------------+ (More) |
|  | [Cover]     | | [Cover]     | | [Cover]     | | [Cover]     |        |
|  | Title B     | | Title C     | | Title D     | | Title E     |        |
|  | Author F    | | Author G    | | Author H    | | Author I    |        |
|  | ★★★★☆       | | ★★★☆☆       | | ★★★★★       | | ★★★★☆       |        |
|  +-------------+ +-------------+ +-------------+ +-------------+        |
|                                                                          |
|  --- Fantasy --------------------------------------------------------  |
|  +-------------+ +-------------+ +-------------+ +-------------+ (More) |
|  | [Cover]     | | [Cover]     | | [Cover]     | | [Cover]     |        |
|  | Title J     | | Title K     | | Title L     | | Title M     |        |
|  | Author N    | | Author O    | | Author P    | | Author Q    |        |
|  | ★★★★★       | | ★★★★☆       | | ★★★★☆       | | ★★★☆☆       |        |
|  +-------------+ +-------------+ +-------------+ +-------------+        |
|                                                                          |
|  ... (Other sections: Most Popular, Most Downloaded, etc.) ...           |
+--------------------------------------------------------------------------+
```

### 5.2. Story Detail Page

```ascii
+--------------------------------------------------------------------------+
| [Logo] StoryWriter Marketplace   [Search Bar]                            |
| [Nav: Home | My Stories | Marketplace | Profile | Logout]                  |
+--------------------------------------------------------------------------+
|                                                                          |
|  < Back to Marketplace                                                   |
|                                                                          |
|  ## The Grand Adventure of Sir Reginald Featherbottom                    |
|  By: Penelope Writer                                                     |
|                                                                          |
|  [Genre: Fantasy] [Genre: Adventure] [Genre: Comedy]                     |
|                                                                          |
|  Average Rating: ★★★★☆ (125 ratings) | Downloads: 350 | Donations: 500 Cr |
|  Published: June 10, 2025                                                |
|                                                                          |
|  **AI Summary:**                                                         |
|  Sir Reginald, a knight known more for his elaborate hats than his       |
|  heroics, embarks on an unexpected quest to find the legendary Golden    |
|  Spatula, aided by a talking squirrel with a penchant for sarcasm...     |
|                                                                          |
|  [ Download Story (TXT) ]  [ Rate: ☆☆☆☆☆ ]  [ Donate Credits ]         |
|                                                                          |
|  --- Story Content ----------------------------------------------------  |
|  Chapter 1                                                               |
|                                                                          |
|  It was a Tuesday, which Sir Reginald usually reserved for advanced      |
|  nap-taking. However, destiny, in the form of a frantic royal messenger  |
|  tripping over a misplaced chamber pot, had other plans. The King's      |
|   prized Golden Spatula, an artifact of immense culinary power, had      |
|  vanished...                                                             |
|  [....................................................................] |
|  [....................................................................] |
|  (Scroll for more)                                                       |
|                                                                          |
|  --- Comments (Future Enhancement) -------------------------------------  |
|  [User X: Great story! Loved the squirrel!]                              |
|  [User Y: A bit slow in the middle, but the ending was fantastic!]       |
|  [Add your comment...]                                                   |
|                                                                          |
+--------------------------------------------------------------------------+
```

### 5.3. Publish Story Modal

```ascii
+------------------------------------------------------+
| Publish Your Story to the Marketplace                |
|------------------------------------------------------|
|                                                      |
| Title: [ The Whispering Woods         ] (Editable)   |
|                                                      |
| Author: [ CurrentUserName            ] (Read-only)  |
|                                                      |
| Story Preview:                                       |
|   (A short, non-editable preview of the story's      |
|    beginning, or a link to the full story if too long|
|    for a modal.)                                     |
|                                                      |
| [X] Allow AI to generate summary and genre           |
|     (If unchecked, show fields below)                |
|     Summary: [_____________________________________] |
|     Genre:   [Dropdown/Tag Input for Genre(s)_____] |
|                                                      |
| [X] I confirm I own the rights to this story and     |
|     agree to the marketplace publishing terms.       |
|                                                      |
|   [ Publish Story ]      [ Cancel ]                  |
|                                                      |
+------------------------------------------------------+
```

## 6. Open Questions / Future Considerations

*   **Cover Images:** How will cover images be handled? User upload? AI generation? Default placeholders?
*   **Story Formats for Download:** What formats should be supported (.txt, .epub, .pdf)?
*   **Author Profiles:** Expand author names into clickable profiles showing all their published stories.
*   **Commenting System:** Detailed requirements for a commenting/discussion feature.
*   **Moderation Workflow:** How will content moderation (manual or AI-assisted) be managed?
*   **Credit System Details:** If not already in place, define how users acquire and manage credits.
*   **Analytics for Writers:** More detailed dashboards for writers to track their story performance.
*   **Private/Unlisted Stories:** Option for writers to share stories with specific users before public marketplace release.
*   **Legal Framework:** Detailed terms of service for publishing, content ownership, and use of AI.
*   **Notifications:** System for notifying writers of new ratings, donations, or comments.

## 7. Implementation Plan

This feature will be implemented in phases to allow for iterative development and feedback.

### Phase 1: Core Marketplace & Publishing (MVP)

*   **Goal:** Allow users to publish stories and basic browsing/discovery.
*   **Backend:**
    *   Modify database schema:
        *   New table `market_stories`: This table will store copies of stories published to the marketplace. It will include relevant fields from the original `stories` table (e.g., `original_story_id`, `user_id`, `title`, `content`, `created_at_original`, `updated_at_original`) plus marketplace-specific fields: `ai_summary`, `ai_genres` (JSON or separate table), `total_downloads`, `average_rating`, `rating_count`, `total_donated_credits`, `published_at`.
        *   New table `market_story_ratings`: `market_story_id` (FK to `market_stories`), `user_id`, `rating`, `rated_at`.
        *   New table `market_story_donations`: `market_story_id` (FK to `market_stories`), `donor_user_id`, `recipient_user_id`, `credits_donated`, `donated_at`.
    *   API Endpoints:
        *   `POST /api/marketplace/publish/{original_story_id}`: Endpoint to handle story publishing.
            *   Input: Original Story ID from user's private `stories` table, user confirmation of terms.
            *   Logic: Copies the specified story from the user's private `stories` table to the `market_stories` table. Sets initial marketplace-specific fields (e.g., `published_at`, `original_story_id`). Triggers AI processing for summary and genre for the new `market_stories` entry.
        *   `PUT /api/marketplace/market-stories/{market_story_id}/ai_details`: Internal endpoint for AI service to update summary and genre on the `market_stories` entry.
        *   `GET /api/marketplace/market-stories`: List published stories from `market_stories` (with pagination, basic sorting by date).
        *   `GET /api/marketplace/market-stories/{market_story_id}`: Get details for a single published story from `market_stories`.
        *   `POST /api/marketplace/market-stories/{market_story_id}/download`: Increment download count for the `market_stories` entry.
        *   `POST /api/marketplace/market-stories/{market_story_id}/rate`: Allow user to submit/update a rating for the `market_stories` entry. Recalculate average rating on `market_stories`.
        *   `POST /api/marketplace/market-stories/{market_story_id}/donate`: Handle credit donation logic, linking to the `market_stories` entry.
*   **Frontend:**
    *   New "Marketplace" link in the main navigation.
    *   **Marketplace Home Page (Basic):**
        *   Simple list view of latest published stories.
        *   Story cards displaying: Title, Author, AI Summary (if available), Genre(s) (if available).
    *   **Story Detail Page (Basic):**
        *   Display full story details (title, author, content, AI summary, AI genres).
        *   "Download" button.
        *   "Rate" button/widget (1-5 stars).
        *   "Donate Credits" button and modal.
    *   **Publishing Flow:**
        *   "Publish to Marketplace" button on "My Stories" page.
        *   Modal for publishing (Title, Author (auto), AI consent, Terms consent).
*   **AI Integration (Basic):**
    *   Set up a basic service (e.g., a new Python module `ai_marketplace_processor.py`) that takes story content and:
        *   Generates a summary (using an existing LLM service).
        *   Generates genre tags (using an existing LLM service, simple classification).
    *   This service will be called asynchronously after a story is submitted for publishing.
*   **Testing:**
    *   Unit tests for new backend logic (publishing, rating, donation).
    *   Basic UI tests for publishing and viewing stories.

### Phase 2: Enhanced Discovery - Search, Filter, Sort & Homepage Sections

*   **Goal:** Improve story discovery with advanced search, filtering, sorting, and a richer homepage.
*   **Backend:**
    *   Enhance `GET /api/marketplace/market-stories` to support:
        *   Search parameters (title, author, keywords - consider full-text search capabilities in DB).
        *   Filtering parameters (genre, rating, length - requires defining length categories).
        *   Sorting parameters (rating, popularity, date, donations).
    *   New Endpoints for homepage sections:
        *   `GET /api/marketplace/sections/top-rated`
        *   `GET /api/marketplace/sections/most-popular`
        *   `GET /api/marketplace/sections/latest`
        *   `GET /api/marketplace/sections/genre/{genre_name}`
*   **Frontend:**
    *   **Marketplace Home Page (Enhanced):**
        *   Implement search bar.
        *   Add sections for "Top Rated," "Most Popular," "Latest."
        *   Add genre-based carousels/sections.
    *   **Search Results Page:**
        *   Display search results.
        *   Implement filter UI (dropdowns, checkboxes).
        *   Implement sort UI (dropdown).
*   **Testing:**
    *   Test search functionality with various queries.
    *   Test filter and sort combinations.
    *   Test new homepage sections.

### Phase 3: Polish & Additional Features

*   **Goal:** Refine UI/UX, add "Staff Picks" and other curated lists.
*   **Backend:**
    *   Mechanism for admins/staff to mark stories as "Staff Picks."
    *   `GET /api/marketplace/sections/staff-picks`
    *   Endpoints for other curated lists (e.g., "Most Downloaded," "Most Donated To").
*   **Frontend:**
    *   Implement "Staff Picks" section on the homepage.
    *   Implement other curated list sections.
    *   UI/UX improvements based on feedback from Phase 1 & 2.
    *   Refine story card design.
    *   Improve story detail page layout.
*   **AI Integration (Refinement):**
    *   Evaluate and improve summary and genre generation quality.
*   **Testing:**
    *   Test admin functionality for "Staff Picks."
    *   Usability testing.

### Future Phases (Post-MVP Enhancements):

*   **Author Profiles:** Clickable author names leading to pages listing all their stories.
*   **Commenting System:** Allow users to comment on stories.
*   **Advanced AI:**
    *   Cover image generation.
    *   Content moderation flags.
*   **Notifications:** For writers (new ratings, donations, comments).
*   **More Download Formats:** EPUB, PDF.
*   **Detailed Analytics for Writers.**

### Technology Stack Considerations:

*   **Backend:** Python/Flask (existing).
*   **Frontend:** React/TypeScript (existing).
*   **Database:** SQLite (existing - consider if scaling needs require a different DB for marketplace features in the long term).
*   **AI Services:** Existing LLM integration (e.g., via `llm_service.py`).

### Team & Timeline:

*   (To be filled in based on resource availability)
*   **Phase 1 (MVP):** Estimated X weeks.
*   **Phase 2:** Estimated Y weeks.
*   **Phase 3:** Estimated Z weeks.

This plan provides a structured approach to developing the Story Marketplace. Each phase builds upon the previous one, allowing for continuous delivery and adaptation.