# Story Reader Component Refactoring

## Problem Statement
The frontend currently contains multiple story reader implementations with varying features and options, leading to:
- Inconsistent user experience across different sections
- Duplicated code and maintenance overhead
- Fragmented feature implementation

## Solution
Standardize story reading functionality by using the `AiStoryReader` component from the style library (`/style-library/ai-styles/src/components/AiStoryReader/AiStoryReader.tsx`) as the single source of truth.

### Current Features in AiStoryReader
- Text display with customizable fonts
- Configurable font sizes
- Theme support via ThemeProvider
- Basic accessibility support

### Required Additional Features
1. UI Components
   - Progress indicator
   - Navigation controls
   - Font style selector
   - Theme toggle
   - Reading mode options (e.g., scroll, paginated)

2. Accessibility Enhancements
   - ARIA labels and roles
   - Keyboard navigation
   - Screen reader optimization
   - High contrast mode support

3. Reading Experience
   - Text highlighting
   - Bookmarking
   - Progress saving
   - Reading statistics

## Implementation Plan

### Phase 1: Component Enhancement (Style Library)

#### 1. Component Audit Results
Current Implementation:
- Uses basic textarea for story display
- Simple font and font size controls
- Theme support via context
- Basic props for customization
- No advanced reading features

Gaps Identified:
- Missing progress tracking system
- No keyboard navigation controls
- Limited ARIA support
- No advanced text manipulation features
- Missing story metadata display
- No TTS integration
- Missing modular UI components

#### 2. Required Component Updates

A. Core Component Structure
```typescript
export interface AiStoryReaderProps {
  // Existing props
  text: string;
  font?: string;
  fontSize?: string;
  
  // New core props
  title?: string;
  author?: string;
  readingTime?: number;
  progress?: number;
  
  // UI Mode props
  displayMode?: 'scroll' | 'paginated' | 'preview';
  isModal?: boolean;
  
  // Feature flags
  enableTTS?: boolean;
  enableBookmark?: boolean;
  enableHighlight?: boolean;
  enableRating?: boolean;
  
  // Event handlers
  onProgressChange?: (progress: number) => void;
  onBookmark?: (position: number) => void;
  onHighlight?: (selection: { text: string, start: number, end: number }) => void;
  onRating?: (rating: number) => void;
}
```

B. UI Components to Add
1. Navigation Bar
   - Progress indicator
   - Chapter/section navigation
   - Bookmark toggle
   - TTS controls when enabled
   
2. Reading Controls
   - Theme toggle
   - View mode selector
   - Text size/font controls
   - Line height/spacing controls

3. Interactive Elements
   - Text selection toolbar
   - Highlight management
   - Bookmark list
   - Rating widget

C. Accessibility Implementation
```typescript
// ARIA attributes and keyboard navigation
<div 
  role="document"
  aria-label={title}
  aria-describedby="story-metadata"
  tabIndex={0}
>
  <div id="story-metadata" aria-hidden="true">
    <h1>{title}</h1>
    <p>By {author}</p>
  </div>
  {/* Story content with proper heading structure */}
</div>
```

#### 3. Implementation Tasks
1. Core Updates (1-2 days)
   - [ ] Refactor component to use proper semantic HTML
   - [ ] Implement new prop interface
   - [ ] Add basic keyboard navigation

2. Feature Implementation (3-4 days)
   - [ ] Progress tracking system
   - [ ] Bookmarking functionality
   - [ ] Text highlighting
   - [ ] TTS integration
   - [ ] Rating system

3. UI Enhancement (2-3 days)
   - [ ] Navigation controls
   - [ ] Reading preference controls
   - [ ] Modal/preview modes
   - [ ] Responsive design improvements

4. Accessibility (2-3 days)
   - [ ] ARIA roles and labels
   - [ ] Keyboard navigation patterns
   - [ ] Screen reader optimization
   - [ ] High contrast theme support

5. Testing & Documentation (2-3 days)
   - [ ] Unit tests for new features
   - [ ] Integration tests
   - [ ] Accessibility tests
   - [ ] Storybook documentation
   - [ ] Usage examples

### Phase 2: Frontend Migration
1. Identify all story reader implementations:
   - Stories page (`/frontend/src/pages/Stories.tsx`)
     * Currently: Uses wrapper `StoryReader` component with TTS and ratings
     * Migration: Move TTS and rating features to `AiStoryReader` in style library
     * Remove wrapper after feature migration
   - Scenario editor (`/frontend/src/components/ScenarioEditor/modals/StoryModal.tsx`)
     * Currently: Basic text display in modal
     * Migration: Direct implementation of `AiStoryReader`
     * Add modal-specific layout handling in `AiStoryReader`
   - Dashboard page (`/frontend/src/pages/Dashboard.tsx`)
     * Currently: Story preview functionality using wrapper
     * Migration: Replace with direct `AiStoryReader` usage with preview mode
     * Remove any wrapper dependencies
   - Marketplace pages 
     * New implementation: Use `AiStoryReader` directly
     * Implement marketplace-specific features in `AiStoryReader`

2. Create migration plan for each implementation:
   - Map current features to new AiStoryReader props
   - Identify custom features that need to be added to AiStoryReader
   - Plan state management integration
   
3. Feature Migration to Style Library:
   - Move TTS integration from wrapper to `AiStoryReader`
   - Add rating system support to `AiStoryReader`
   - Add modal/preview mode support
   - Create new props for marketplace-specific features

4. Wrapper Removal Strategy:
   - Deprecate existing wrapper components
   - Update all imports to use `AiStoryReader` directly
   - Remove duplicate styling and functionality
   - Migrate state management to new implementation
   
3. Execute migrations:
   - Replace existing readers one at a time
   - Validate functionality
   - Update tests
   - Handle edge cases

### Phase 3: Clean-up and Documentation
1. Remove deprecated reader components
2. Update component documentation
3. Add migration guide for future implementations
4. Validate accessibility compliance

### Testing Strategy
- Unit tests for new features
- Integration tests for each migrated implementation
- Accessibility testing
- Performance benchmarking
- Cross-browser compatibility verification