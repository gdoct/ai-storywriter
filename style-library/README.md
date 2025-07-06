# React Component Library

this repository contains a react component library @drdata/ai-styles
It uses modern react
it is written in typescript
it uses vite to build 
it uses jest for tests
it has scripts to test, typecheck, lint, lint+fix, build, start
the deliverable of this project is a component library, ready to be published in a registry such as npm
it has a separate site with a storybook for the components in the library
this site has puppteer tests to test the ux of the components

all projects should be created from scratch. the library should be created from scratch under /lib and the storybook under /storybook

# Implementation Plan

## Phase 1: Project Setup and Foundation
1. **Initialize Library Project Structure**
   - Create `/lib` directory structure
   - Initialize package.json with necessary dependencies
   - Configure TypeScript (tsconfig.json)
   - Setup Vite configuration for library build
   - Configure ESLint and Prettier for code quality

2. **Setup Testing Infrastructure**
   - Configure Jest for unit testing
   - Setup React Testing Library
   - Create test utilities and helpers
   - Configure test scripts in package.json

3. **Create Build and Development Scripts**
   - Setup Vite build process for library output
   - Configure development server
   - Create npm scripts for test, typecheck, lint, lint+fix, build, start
   - Setup package.json exports for proper library distribution

## Phase 2: Core Component Development
4. **Develop IconButton Component**
   - Create base IconButton component with TypeScript interfaces
   - Implement styling system with CSS modules or styled-components
   - Add props for className, width, height, disabled state
   - Implement onClick event handling
   - Add active/busy state management
   - Style as square button with appealing design
   - Add default icon implementation

5. **Write IconButton Tests**
   - Unit tests for all props and states
   - Test onClick event handling
   - Test disabled and active state behavior
   - Test styling and className application
   - Test accessibility features

6. **Develop AiTextBox Component**
   - Create base AiTextBox component structure
   - Implement text input with TypeScript interfaces
   - Add validation callback system
   - Implement placeholder, label, and message props
   - Integrate embedded IconButton for AI action (right-aligned)
   - Integrate embedded clear button (right-aligned)
   - Style component for visual appeal and usability
   - Setup react-icons/ri dependency and default RiAiGenerate2 icon

7. **Write AiTextBox Tests**
   - Unit tests for all props and features
   - Test validation callback functionality
   - Test embedded button interactions
   - Test clear functionality
   - Test message display (error, success, info)
   - Test accessibility features

## Phase 3: Storybook Development
8. **Initialize Storybook Project**
   - Create `/storybook` directory structure
   - Initialize Storybook configuration
   - Setup TypeScript support in Storybook
   - Configure build and development scripts

9. **Create Component Stories**
   - Develop IconButton stories demonstrating all features
   - Create stories for different IconButton states and props
   - Develop AiTextBox stories showcasing all functionality
   - Create interactive stories for user testing
   - Document component APIs and usage examples

10. **Style and Document Stories**
    - Ensure stories are well-organized and easy to navigate
    - Add comprehensive documentation for each component
    - Include usage examples and best practices
    - Setup story categories and organization

## Phase 4: Testing and Quality Assurance
11. **Setup Puppeteer E2E Testing**
    - Install and configure Puppeteer
    - Create test infrastructure for Storybook UX testing
    - Write E2E tests for component interactions
    - Test component behavior in browser environment

12. **Integration Testing**
    - Test component library build process
    - Verify TypeScript declarations are generated correctly
    - Test library import/export functionality
    - Validate package.json configuration for publishing

## Phase 5: Build and Distribution
13. **Optimize Build Process**
    - Configure Vite for optimal library bundling
    - Setup tree-shaking and code splitting
    - Generate TypeScript declaration files
    - Optimize bundle size and performance

14. **Prepare for Publishing**
    - Configure package.json for npm publishing
    - Setup proper semantic versioning
    - Create comprehensive README for the library package
    - Configure CI/CD pipeline if needed

15. **Documentation and Examples**
    - Create usage documentation
    - Provide integration examples
    - Document component APIs thoroughly
    - Create migration guides if applicable

EXAMPLE SOLUTION LAYOUT (do not create this folder structure upfront, this is an example of the desired endstate)
```
.
├── lib
│   ├── src
│       ├── components
│           ├── AiTextBox
│               ├── AiTextBox.tsx
│               └── .. etcetera
├── storybook
│   ├── src
│       ├── stories
│           ├── AiTextBox.stories.tsx
│           └── .. etcetera
├── tests
│   ├── src
│       ├── components
│           ├── AiTextBox
│               ├── AiTextBox.test.tsx
│               └── .. etcetera
├── scripts

```

# Library components
We start with two components: a button named 'IconButton' and a text box component named "AiTextBox".

# IconButton Component
The IconButton component is a simple button that can be used to trigger actions in the application and be busy while it executes.
It has the following features:

- It can be styled with a custom className.
- It can have width, height, and similar styling props set to it like a regular button.
- It can be disabled like a regular button.
- It can have a custom icon but one is provided by default.
- it should raise an 'onClick' event to its parent component when clicked.

the button is square and features only an icon and no text, it is styled as such that it is visually appealing and easy to use.
the button should have an 'active' state that is toggled on when clicking, disabling further clicks, and can be toggled back on by its parent component.
this state should indicate that the application is busy processing the click, and should look appealing to the user.

The IconButton should have jest tests to ensure that it behaves correctly when the user interacts with it.

# AiTextBox Component
The AiTextBox component is a simple text box that can be used to collect user input in the application.
It has the following features:
- It can be styled with a custom className.
- It can be disabled.
- It can have a custom validation callback function.
- It can have a custom placeholder text.
- It can have a custom label text.
- It can have a custom error message.
- It can have a custom success message.
- It can have a custom info message.
- It has an embedded IconButton to trigger an AI action. that button is aligned to the right of the textbox
- It has an embedded IconButton to clear the text box. that button is aligned to the right of the ai button
- The AiTextBox is styled as such that it is visually appealing and easy to use.

the default icon for the button is this one from react-icons/ri:
```jsx
import { RiAiGenerate2 } from "react-icons/ri";
<RiAiGenerate2 />
```

The AiTextBox should have jest tests to ensure that it behaves correctly when the user interacts with it.

# Storybook
The storybook should contain stories for the IconButton and AiTextBox components.
The stories should demonstrate the different features of the components and how they can be used in the application.
The stories should be written in a way that is easy to understand and follow.