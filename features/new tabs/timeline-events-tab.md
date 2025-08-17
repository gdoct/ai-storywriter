# Timeline & Events Tab - Feature Specification

## Overview
The Timeline & Events tab provides writers with chronological organization tools for their story's background, plot events, and future planning. This tab helps maintain continuity, track cause-and-effect relationships, and ensure logical story progression.

## High level implementation
The tab will be hosted in the ScenarioEditor component: frontend/src/components/ScenarioEditor/ScenarioEditor.tsx
The ScenarioEditor provides a number of tabs that the user can optionally select for scenario development. The Timeline & Events tab will be one of these tabs, allowing users to manage the chronological aspects of their story.

## UX
the timelines tab should look like a flowchart. each event in the timeline is represented by a box. an event can have one or multiple children, whih are parallel events (eg some events lead to someone getting married, while others lead to a war breaking out).
so a user can click on a node in the flowchart and add children. the children will be displayed in the row below the event. An event box has two small toolbuttons: one to add a child and one to remove the node. If a node is removed, its children will be connected to the removed node's parent

ascii mockup:
          +-------------------+
          |   Story start     |
          +-------------------+
                    |
          +-------------------+
          |   Event           |
          +-------------------+
                |           |
  +-------------------+ +-------------------+
  |   Event 2         | |   Event 3         |
  +-------------------+ +-------------------+
                |           |
  +-------------------+     |
  |   Event 4         |     |
  +-------------------+     |
                  |         |
          +-------------------+
          |   Finale          |
          +-------------------+

Data Storage & Persistence

  - Event data structure: timeline should be a property of the scenario object. the data is stored as json so the schema is loose.
  - Data format: events should be stored as a
  tree/graph structure

  Visual Implementation
  - UI Library:use the existing
  @drdata/ai-styles components for generic controls. for the flowchart editor develop new components and store them in a subfolder of the tab. make sure to use the design tokens.
  - Pick a layout algorithm to automatically position nodes to avoid overlaps, especially
  with multiple parallel branches. the max parallel branches should be 3 on all rows.
  - Use responsive design
  - Build this with SVG/Canvas for performance

  User Interaction

  - Event name editing is inline. details are in a modal.
  - Event content: The fields for each event are: title, description, date, characters involved.
  - Drag & drop:  users should be able to reorder events by dragging.
  - Visual connections: if an event has no children, it will always be connected to the first event in the next row, so there are no open ends.
  Do not implement the AiTextBox logic or similar logic to generate content for the fields in this tab. That is phase 2.

  Integration with Existing System

  - Story generation: The timeline property in the scenario object should be rendered by the storyGeneratorService and the scenarioToMarkdown classes.
  - Export/import: timelines should support the import/export function like all other tabs do.

  Technical Implementation

  - State management: Make sure to efficiently manage the tree structure in React state.
  - Rendering performance: With large timelines, ensure smooth scrolling and interaction.
  - Undo/redo: No undo or redo at this time
  - Event IDs: events should have UUIDs for reliable parent-child relationships
  - Tree traversal: after deletion or move, rebuild the tree and ensure all the connections are correct
  - Root node: there should always be a single root "Story start" node

  SVG/Canvas Implementation

  - Zoom/pan: allow users be able to zoom and pan large timelines
  - Selection state: There can be one selected node. This node should have a glowing border.

  Layout Algorithm

  - Row spacing: allow enough vertical space between rows for the connector
  - Branch merging: When parallel branches converge, how to handle the visual connection points? - prefer straight paths, if something merges back it should have a 45 degrees line connector
  - 3-branch limit: prevent the user from trying to create a 4th parallel branch


  - Markdown rendering: render it like this
```markdown
  ## event
  <description>
  date: <date>
  ### characters involved
  * <character name>
    description of involvement
```
