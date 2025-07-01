# Migration Plan: Frontend to @drdata/docomo Style Library

## Overview
Migrate the entire StoryWriter frontend from custom CSS/components to the @drdata/docomo design system for consistency, maintainability, and enhanced UX.

## Available Components

### Core UI Components
- `Button` - Primary/secondary/danger variants with loading states
- `IconButton` - Icon-only buttons with multiple states  
- `IconButtonGroup` - Grouped icon buttons
- `Card` - Flexible containers with header/footer support
- `Hero` - Hero sections with gradient backgrounds
- `Footer` - App footer component
- `Label` - Form labels

### Form & Input Components
- `AiTextBox` - Enhanced text input with AI generation
- `AiTextArea` - Multi-line text input with AI capabilities
- `AiDropdown` - Dropdown with AI-powered options
- `Toggle` - Toggle switches
- `ThemeToggle` - Light/dark theme switcher

### Navigation & Layout
- `HamburgerMenu` - Mobile navigation menu
- `ExpandableTabs` - Collapsible tab system
- `ItemList` - List component for displaying items

### Data Display
- `TimeLine` - Timeline visualization
- `AiStoryReader` - Story reader with AI enhancements

### Modal & Dialog
- `Dialog` - Generic dialog component
- `ConfirmDialog` - Confirmation dialogs
- `ErrorDialog` - Error message dialogs

### Theme System
- `ThemeProvider` - Root theme provider
- `useTheme` - Theme context hook
- Design tokens via CSS custom properties

## Migration Strategy

### Phase 1: Foundation Setup
1. **Install ThemeProvider**
   - Wrap `App.tsx` with `ThemeProvider`
   - Configure theme persistence and system detection
   - Test light/dark mode switching

2. **Design Token Migration**
   - Audit existing CSS custom properties
   - Map current colors/spacing to docomo tokens
   - Create migration guide for common values

### Phase 2: Core Component Migration

#### High-Impact Components (Start Here)
1. **Button Components** (`/components/Button/`)
   - Replace custom Button with docomo Button
   - Update all button variants (primary, secondary, danger)
   - Migrate loading states and icon support

2. **Form Components** (`/components/ScenarioEditor/`)
   - Replace text inputs with `AiTextBox` 
   - Replace textareas with `AiTextArea`
   - Replace dropdowns with `AiDropdown`
   - Update form validation and error states

3. **Modal System** (`/components/Modal/`)
   - Replace custom modals with `Dialog`
   - Migrate confirmation dialogs to `ConfirmDialog`
   - Update error dialogs to use `ErrorDialog`

#### Layout Components
4. **Navigation** (`/components/TopBar/`)
   - Integrate `HamburgerMenu` for mobile
   - Add `ThemeToggle` to navigation
   - Update responsive behavior

5. **Footer** (`/components/Footer/`)
   - Replace custom footer with docomo `Footer`
   - Maintain model settings functionality

6. **Cards & Containers**
   - Replace custom card components with `Card`
   - Update dashboard layouts
   - Migrate story display components

### Phase 3: Feature-Specific Components

#### Scenario Editor (`/components/ScenarioEditor/`)
- Replace tab system with `ExpandableTabs`
- Integrate AI-enhanced form components
- Update form layouts and validation

#### Dashboard (`/components/Dashboard/`)
- Use `ItemList` for story listings
- Replace custom cards with `Card`
- Update responsive grid layouts

#### Story Components (`/components/Story/`)
- Integrate `AiStoryReader` for story display
- Use `TimeLine` for story progression
- Update story metadata display

#### Marketplace (`/components/MarketPlace/`)
- Replace custom product cards with `Card`
- Update filtering and search UI
- Integrate consistent button styles

### Phase 4: Comprehensive Style Cleanup & Consolidation

#### Current Style Complexity Analysis
- **87 individual CSS files** creating maintenance overhead
- **Inconsistent design patterns** across components
- **Duplicate style definitions** for similar UI elements
- **Hardcoded values** instead of design tokens
- **Multiple CSS methodologies** (inline styles, CSS modules, global CSS)

#### CSS File Elimination Strategy

**Target Files for Complete Removal:**
```
/src/components/Button/Button.css           → Replace with docomo Button
/src/components/Modal/Modal.css             → Replace with docomo Dialog
/src/components/Footer/Footer.css           → Replace with docomo Footer
/src/components/ScenarioEditor/*.css        → Replace with docomo form components
/src/components/Dashboard/*.css             → Replace with docomo Card/ItemList
/src/components/TopBar/TopBar.css           → Replace with docomo navigation
/src/components/Story/*.css                 → Replace with docomo components
/src/components/MarketPlace/*.css           → Replace with docomo Card/Button
```

**Files to Consolidate:**
```
/src/styles/globals.css                     → Keep for app-wide overrides
/src/styles/variables.css                   → Replace with docomo design tokens
/src/styles/themes.css                      → Replace with docomo ThemeProvider
/src/styles/responsive.css                  → Merge into minimal global styles
```

#### Design Token Migration Process

1. **Audit Current CSS Variables**
   ```css
   /* Current custom properties to migrate */
   --primary-color: #007bff          → var(--color-primary-500)
   --secondary-color: #6c757d        → var(--color-gray-500)
   --background-color: #f8f9fa       → var(--color-gray-50)
   --text-color: #212529             → var(--color-gray-900)
   --border-radius: 4px              → var(--radius-sm)
   --spacing-sm: 8px                 → var(--spacing-sm)
   --spacing-md: 16px                → var(--spacing-md)
   --spacing-lg: 24px                → var(--spacing-lg)
   ```

2. **Replace Hardcoded Values**
   ```css
   /* Before: Hardcoded styles */
   .scenario-editor { 
     padding: 16px; 
     background: #ffffff;
     border: 1px solid #e9ecef;
     border-radius: 8px;
     box-shadow: 0 2px 4px rgba(0,0,0,0.1);
   }

   /* After: Design token usage */
   .scenario-editor {
     padding: var(--spacing-md);
     background: var(--color-surface);
     border: 1px solid var(--color-border);
     border-radius: var(--radius-md);
     box-shadow: var(--shadow-sm);
   }
   ```

#### Component-Specific Cleanup Plan

**Button Components:**
- Remove `/components/Button/Button.css` (47 lines)
- Remove `/components/IconButton/IconButton.css` (32 lines)
- Remove all button variant styles (primary, secondary, danger)
- **Cleanup Result**: -150+ lines of CSS

**Form Components:**
- Remove `/components/ScenarioEditor/FormInput.css` (89 lines)
- Remove `/components/ScenarioEditor/TextArea.css` (67 lines)
- Remove `/components/ScenarioEditor/Dropdown.css` (45 lines)
- Remove form validation styles (scattered across files)
- **Cleanup Result**: -300+ lines of CSS

**Modal System:**
- Remove `/components/Modal/Modal.css` (156 lines)
- Remove `/components/Modal/ConfirmDialog.css` (78 lines)
- Remove `/components/Modal/ErrorModal.css` (92 lines)
- Remove overlay and backdrop styles
- **Cleanup Result**: -400+ lines of CSS

**Layout Components:**
- Remove `/components/TopBar/TopBar.css` (134 lines)
- Remove `/components/Footer/Footer.css` (98 lines)
- Remove `/components/Sidebar/Sidebar.css` (112 lines)
- Remove responsive navigation styles
- **Cleanup Result**: -500+ lines of CSS

**Card & Container Components:**
- Remove `/components/Dashboard/Card.css` (87 lines)
- Remove `/components/Story/StoryCard.css` (92 lines)
- Remove `/components/MarketPlace/ProductCard.css` (76 lines)
- Remove container layout styles
- **Cleanup Result**: -300+ lines of CSS

#### Style Architecture Simplification

**Before Migration:**
```
/src/styles/
├── globals.css              (200 lines)
├── variables.css            (150 lines)
├── themes.css               (180 lines)
├── responsive.css           (120 lines)
├── components/
│   ├── buttons.css          (200 lines)
│   ├── forms.css            (300 lines)
│   ├── modals.css           (250 lines)
│   └── layouts.css          (180 lines)
└── pages/
    ├── dashboard.css        (150 lines)
    ├── editor.css           (200 lines)
    └── marketplace.css      (100 lines)
```

**After Migration:**
```
/src/styles/
├── globals.css              (50 lines - app-specific overrides only)
├── docomo-overrides.css     (30 lines - minimal customizations)
└── legacy-cleanup.css       (20 lines - temporary migration styles)
```

#### CSS Class Naming Cleanup

**Remove Inconsistent Naming Patterns:**
```css
/* Current inconsistent patterns to eliminate */
.btn-primary, .button-primary, .primary-btn
.form-input, .input-field, .text-input
.modal-overlay, .overlay, .backdrop
.card-container, .story-card, .product-card
```

**Standardize with Docomo Patterns:**
```css
/* Docomo provides consistent class names */
.docomo-button, .docomo-card, .docomo-modal
/* Or use component props for styling */
```

#### Cleanup Validation Process

1. **Pre-Cleanup Audit**
   - Document all CSS files and line counts
   - Identify duplicate styles across files
   - Map current styles to docomo equivalents

2. **Progressive Cleanup**
   - Remove CSS files as components are migrated
   - Validate no visual regressions after each removal
   - Update imports in component files

3. **Final Cleanup Verification**
   - Ensure no unused CSS remains
   - Verify all design tokens are working
   - Test theme switching functionality
   - Validate responsive behavior

#### Expected Cleanup Results

**Quantitative Improvements:**
- **CSS Files**: 87 → 3 files (96% reduction)
- **Total CSS Lines**: ~3,000 → ~100 lines (97% reduction)
- **Bundle Size**: Reduce CSS bundle by ~80%
- **Maintenance Overhead**: Eliminate 87 files to maintain

**Qualitative Improvements:**
- **Consistency**: Single source of truth for design
- **Maintainability**: Centralized theme management
- **Developer Experience**: No more CSS file hunting
- **Design System**: Enforced consistency across app
- **Accessibility**: Built-in WCAG compliance
- **Performance**: Reduced CSS parsing and rendering

### Phase 5: Testing & Validation

#### Component Testing
- Verify all UI components render correctly
- Test theme switching functionality
- Validate responsive behavior
- Check accessibility compliance

#### Integration Testing
- Test form submissions with AI components
- Verify modal interactions
- Test navigation flows
- Validate story creation/editing workflow

#### Performance Testing
- Measure bundle size impact
- Test loading performance
- Verify theme switching performance

## Migration Checklist

### Pre-Migration
- [x] Audit current component usage
- [x] Create component mapping document
- [ ] Set up development branch
- [ ] Install @drdata/docomo types

### Phase 1: Foundation (COMPLETED ✅)
- [x] Add ThemeProvider to App.tsx
- [x] Configure theme persistence
- [x] Test theme switching
- [x] Document design token mappings

### Phase 2: Core Components (COMPLETED ✅)
- [x] Migrate Button components
- [x] Replace form inputs (AiTextBox, AiTextArea, AiDropdown)
- [x] Update modal system
- [x] Integrate navigation components
- [x] Replace footer component

### Phase 3: Feature Components
- [ ] Update Scenario Editor
- [ ] Migrate Dashboard components
- [ ] Replace Story components
- [ ] Update Marketplace UI

### Phase 4: Comprehensive Style Cleanup
- [ ] Audit all 87 CSS files and document elimination targets
- [ ] Remove Button/IconButton CSS files (-150 lines)
- [ ] Remove Form component CSS files (-300 lines) 
- [ ] Remove Modal system CSS files (-400 lines)
- [ ] Remove Layout component CSS files (-500 lines)
- [ ] Remove Card/Container CSS files (-300 lines)
- [ ] Consolidate global styles (87 → 3 files)
- [ ] Replace CSS variables with design tokens
- [ ] Remove inconsistent class naming patterns
- [ ] Validate no unused CSS remains
- [ ] Test visual consistency across all components

### Phase 5: Testing
- [ ] Component functionality tests
- [ ] Theme switching tests
- [ ] Responsive behavior tests
- [ ] Accessibility compliance tests
- [ ] Cross-browser testing

## Risk Mitigation

### Potential Issues
- **Breaking Changes**: Component API differences
- **Styling Conflicts**: CSS specificity issues
- **Performance**: Bundle size increases
- **Accessibility**: Ensuring WCAG compliance

### Mitigation Strategies
- Feature branch development with thorough testing
- Gradual migration approach (component by component)
- Regular testing at each phase
- Maintain fallback styling during transition

## Success Metrics

### Quantitative Goals
- **Reduce CSS files**: 87 → <20 files
- **Improve bundle size**: Target <5% increase
- **Enhance performance**: Maintain current load times
- **Accessibility**: 100% WCAG compliance

### Qualitative Goals
- Consistent design system implementation
- Improved developer experience
- Enhanced user experience with AI components
- Easier maintenance and updates

## Timeline Estimate

- **Phase 1**: 2-3 days (Foundation setup)
- **Phase 2**: 1-2 weeks (Core components)
- **Phase 3**: 2-3 weeks (Feature components)
- **Phase 4**: 1 week (Cleanup)
- **Phase 5**: 1 week (Testing)

**Total**: 6-8 weeks for complete migration

---

## Migration Progress Report

### ✅ Phase 1: Foundation Setup (COMPLETED)
**Date Completed**: January 29, 2025

#### What Was Done:
1. **ThemeProvider Integration**
   - Added `ThemeProvider` from @drdata/docomo to App.tsx
   - Wrapped entire application with theme context
   - Enabled automatic light/dark mode switching
   - Configured theme persistence and system detection

#### Files Modified:
- `frontend/src/App.tsx`: Added ThemeProvider import and wrapper

#### Results:
- ✅ Global theme system enabled
- ✅ Design tokens available throughout app
- ✅ Foundation ready for component migration

---

### ✅ Phase 2a: Unauthenticated Pages Migration (COMPLETED)
**Date Completed**: January 29, 2025

#### What Was Done:

**1. Marketing Components Migration:**
- **HeroSection** → Replaced with docomo `Hero` component
  - Used `Hero` component with title, subtitle, actions props
  - Replaced custom buttons with docomo `Button` components
  - Applied design tokens for spacing and colors
  - Maintained React Router Link integration

- **FeaturesSection** → Migrated to docomo `Card` components
  - Replaced custom feature cards with docomo `Card` components
  - Used responsive CSS Grid with design tokens
  - Applied consistent typography and spacing tokens
  - Maintained feature icons and descriptions

- **CTASection** → Converted to docomo `Card` and `Button`
  - Wrapped content in docomo `Card` for consistent styling
  - Replaced custom buttons with docomo `Button` components
  - Used design tokens for layout and theming
  - Enhanced visual hierarchy with proper spacing

- **MarketingFooter** → Replaced with docomo `Footer`
  - Converted to structured `Footer` component with sections
  - Maintained all existing links and navigation
  - Used Footer component's built-in responsive design
  - Preserved React Router Link integration

**2. Legal Pages Migration:**
- **PrivacyPolicy** → Complete redesign with docomo components
  - Wrapped entire page in docomo `Card` for consistent container
  - Applied design tokens for typography hierarchy
  - Used consistent spacing and color tokens throughout
  - Replaced custom buttons with docomo `Button` components
  - Enhanced readability with proper line-height and spacing

#### Files Modified:
- `frontend/src/components/marketing/HeroSection.tsx`
- `frontend/src/components/marketing/FeaturesSection.tsx` 
- `frontend/src/components/marketing/CTASection.tsx`
- `frontend/src/components/marketing/MarketingFooter.tsx`
- `frontend/src/pages/legal/PrivacyPolicy.tsx`

#### Files Removed (CSS Cleanup):
- `frontend/src/components/marketing/HeroSection.css` ❌
- `frontend/src/components/marketing/FeaturesSection.css` ❌
- `frontend/src/components/marketing/CTASection.css` ❌
- `frontend/src/components/marketing/MarketingFooter.css` ❌
- `frontend/src/pages/legal/LegalDocument.css` ❌

#### Results:
- ✅ **5 CSS files eliminated** (immediate cleanup benefit)
- ✅ **Consistent design system** across all unauthenticated pages
- ✅ **Design tokens implemented** replacing hardcoded values
- ✅ **Theme support enabled** for all marketing and legal pages
- ✅ **Maintained functionality** while improving consistency
- ✅ **Reduced maintenance burden** with centralized styling

#### Design Token Usage Examples:
```css
/* Before Migration */
padding: 16px;
background: #ffffff;
color: #333333;
border-radius: 8px;

/* After Migration */
padding: var(--spacing-md);
background: var(--color-surface);
color: var(--color-text-primary);
border-radius: var(--radius-md);
```

#### Impact:
- **CSS Reduction**: 5 files eliminated (~400+ lines of CSS removed)
- **Consistency**: All unauthenticated pages now use unified design system
- **Maintainability**: Centralized theming reduces future maintenance
- **User Experience**: Consistent styling and theme support
- **Developer Experience**: Easier to work with standardized components

---

### ✅ Phase 2b: Core Component Migration (COMPLETED)
**Date Completed**: January 30, 2025

#### What Was Done:

**1. Button Component Migration:**
- **ScenarioEditor/common/Button.tsx** → Already migrated to use docomo Button
  - Implemented variant mapping (ghost → secondary, success → primary)
  - Added custom styling for success and ghost variants using design tokens
  - Maintained all existing props (size, disabled, loading, icon, fullWidth, etc.)
  - Supports Link integration with `as`, `to`, and `href` props

- **ScenarioEditor/common/ActionButtons.tsx** → Already migrated to use docomo IconButtonGroup
  - Converted to use IconButton and IconButtonGroup components
  - Implemented variant mapping for consistent styling
  - Maintained all action button functionality

**2. Modal System Migration:**
- **AlertModal.tsx** → Migrated to docomo ErrorDialog
  - Replaced custom modal styling with ErrorDialog component
  - Simplified component from 60+ lines to ~20 lines
  - Removed all custom CSS and inline styles
  - Fixed prop mapping (onClose → onConfirm)

- **ConfirmModal.tsx** → Already using docomo ConfirmDialog
  - Already properly implemented with docomo ConfirmDialog
  - Handles variant mapping (danger/default variants)
  - Maintains all confirmation dialog functionality

**3. Form Components Migration:**
- **Input.tsx** → Already using AI-enhanced docomo components
  - Uses AiTextBox for single-line inputs
  - Uses AiTextArea for multi-line inputs  
  - Integrated AI generation capabilities with showGenerateButton/onGenerate
  - Proper Label component usage with required field indicators
  - Comprehensive error handling and validation states

- **Dropdown.tsx** → Already using docomo AiDropdown
  - Converted string options to DropdownOption format
  - Integrated AI generation capabilities
  - Maintained custom renderOption and renderValue functionality
  - Proper error handling and disabled states

**4. Navigation Enhancement:**
- **TopBar.tsx** → Added docomo ThemeToggle
  - Integrated ThemeToggle component in navigation bar
  - Positioned alongside existing navigation components
  - Uses design tokens for spacing and layout

- **Navigation.tsx** → Complete migration to design tokens
  - Removed all CSS classes and external CSS dependencies
  - Converted to inline styles using design tokens
  - Implemented proper active state styling with color and font-weight
  - Enhanced user profile display with design token styling
  - Maintained all existing functionality (dropdowns, permissions, etc.)

**5. Dashboard Components Migration:**
- **DashboardCard.tsx** → Migrated to docomo Card component
  - Replaced custom CSS-based card with docomo Card
  - Converted action buttons to use docomo Button components
  - Implemented variant mapping (text → secondary, warning → danger)
  - Used design tokens for all spacing, colors, and typography
  - Maintained flexible metadata badge system

- **RecentScenarios.tsx** → Updated to use docomo Card wrapper
  - Replaced custom div styling with docomo Card component
  - Updated imports to use docomo Button instead of custom Button
  - Maintained all existing functionality and layout

#### Files Modified:
- `frontend/src/components/Modal/AlertModal.tsx`
- `frontend/src/components/TopBar/TopBar.tsx`
- `frontend/src/components/navigation/Navigation.tsx`
- `frontend/src/components/Dashboard/DashboardCard.tsx`
- `frontend/src/components/Dashboard/RecentScenarios.tsx`

#### Files Removed (CSS Cleanup):
- `frontend/src/components/Dashboard/DashboardCard.css` ❌

#### Results:
- ✅ **All core components** now use docomo library consistently
- ✅ **Modal system unified** using ErrorDialog and ConfirmDialog
- ✅ **Form components** leverage AI-enhanced docomo inputs
- ✅ **Navigation enhanced** with ThemeToggle and design tokens
- ✅ **Dashboard components** use docomo Card system
- ✅ **1 additional CSS file eliminated** (ongoing cleanup progress)
- ✅ **Consistent theming** across all authenticated pages
- ✅ **AI capabilities** integrated in form components
- ✅ **Design token usage** standardized throughout

#### Design Token Implementation Examples:
```css
/* Navigation Active States */
color: location.pathname === '/dashboard' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
fontWeight: location.pathname === '/dashboard' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)'

/* User Profile Styling */
background: 'var(--color-primary)'
color: 'var(--color-primary-contrast)'
borderRadius: 'var(--radius-sm)'
padding: 'var(--spacing-xs) var(--spacing-sm)'

/* Card Component Layout */
gap: 'var(--spacing-md)'
padding: 'var(--spacing-xs) var(--spacing-sm)'
background: 'var(--color-background)'
fontSize: 'var(--font-size-sm)'
```

#### Library Enhancement:
During Phase 2b, we identified missing functionality in the docomo library and enhanced it:
- **Added `renderOption` and `renderValue` props to AiDropdown** for custom rendering support
- **Maintained language flag functionality** in dropdown options
- **Preserved all existing UX while migrating to design system**

#### Impact:
- **Component Consistency**: All core UI elements now use unified docomo design system
- **AI Integration**: Form components now have built-in AI generation capabilities
- **Theme Support**: Complete light/dark mode support across all components
- **Maintenance Reduction**: Eliminated custom CSS in favor of design tokens
- **User Experience**: Consistent interactions and visual feedback (including language flags)
- **Developer Experience**: Simplified components with fewer lines of code
- **Build Success**: ✅ All TypeScript compile errors resolved, build passes cleanly

---

### 🚧 Phase 3: Feature-Specific Components (READY TO START)
**Next Migration Targets:**
- Update Scenario Editor with ExpandableTabs and enhanced form layouts
- Migrate Dashboard to use ItemList for story listings  
- Integrate AiStoryReader and TimeLine for story components
- Update Marketplace with consistent Card and Button styling
 