# Research Notes Tab - Feature Specification

## Overview
The Research Notes tab provides writers with organized storage and management for research materials, references, inspiration sources, and fact-checking resources. This tab supports both fiction and non-fiction writers with tools for organizing, categorizing, and connecting research to story elements.


### High Level Implementation
The tab will be hosted in the ScenarioEditor component. It will be accessible via the main navigation bar and will be part of the ScenarioEditor state management system. The tab should support the isDirty state to indicate unsaved changes, and it should be able to auto-detect existing data when a scenario is loaded. It should support importing existing  data from other scenarios, similar to the other tabs. The tab will also support AI generation features to help writers create content for the tab. The tab's styling will be similar to the other tabs, such as the CharactersTab, but will focus on research management rather than character details. The tab will include a rich text editor for notes, a structured format for sources, and tools for tracking research topics and fact-checking.
## Data Structure

### Scenario Data Extension
```typescript
interface ScenarioData {
  // ...existing fields...
  research?: {
    notes: ResearchNote[];
    sources: ResearchSource[];
    topics: ResearchTopic[];
    factChecks: FactCheck[];
    inspiration: Inspiration[];
    references: Reference[];
    generalNotes: string;
  };
}

interface ResearchNote {
  id: string;
  title: string;
  content: string;
  type: 'fact' | 'quote' | 'data' | 'observation' | 'interview' | 'idea' | 'other';
  category: string; // User-defined categories
  topics: string[]; // Topic IDs
  sources: string[]; // Source IDs
  credibility: 'verified' | 'reliable' | 'questionable' | 'unverified';
  relevance: 'critical' | 'important' | 'useful' | 'tangential';
  usage: ResearchUsage[];
  keyQuotes: string[];
  keywords: string[];
  dateCreated: string;
  dateAccessed?: string;
  photoUrl?: string;
  attachments: Attachment[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ResearchSource {
  id: string;
  title: string;
  type: 'book' | 'article' | 'website' | 'documentary' | 'interview' | 'journal' | 'database' | 'other';
  author: string;
  publication: string;
  publicationDate: string;
  url?: string;
  isbn?: string;
  doi?: string;
  pages?: string;
  edition?: string;
  credibility: 'academic' | 'journalistic' | 'expert' | 'popular' | 'opinion' | 'unknown';
  accessDate?: string;
  notes: string;
  quotePpermissions: boolean;
  citation: SourceCitation;
  relatedNotes: string[]; // Note IDs
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ResearchTopic {
  id: string;
  name: string;
  description: string;
  type: 'historical' | 'scientific' | 'cultural' | 'technical' | 'geographical' | 'biographical' | 'other';
  importance: 'essential' | 'important' | 'supporting' | 'background';
  completeness: number; // 0-100% research completion
  questions: ResearchQuestion[];
  findings: string[];
  gaps: string[];
  relatedTopics: string[]; // Topic IDs
  storyConnections: TopicConnection[];
  deadline?: string;
  notes: string[];
  sources: string[]; // Source IDs
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface FactCheck {
  id: string;
  claim: string;
  context: string;
  verification: 'verified' | 'disputed' | 'false' | 'pending' | 'unclear';
  sources: string[]; // Source IDs
  evidence: string[];
  counterEvidence: string[];
  confidence: number; // 0-100%
  importance: 'critical' | 'important' | 'minor';
  storyLocation: string; // Where it appears in story
  alternativeFacts: string[];
  lastChecked: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Inspiration {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'video' | 'audio' | 'text' | 'experience' | 'dream' | 'conversation' | 'other';
  source: string;
  content: string;
  inspirationType: 'character' | 'plot' | 'setting' | 'theme' | 'style' | 'mood' | 'dialogue' | 'general';
  storyElements: string[]; // What it inspired
  captureDate: string;
  location?: string;
  mood: string;
  keyInsights: string[];
  development: string; // How it was developed
  photoUrl?: string;
  attachments: Attachment[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Reference {
  id: string;
  title: string;
  type: 'style' | 'format' | 'grammar' | 'terminology' | 'convention' | 'template' | 'checklist';
  category: string;
  content: string;
  examples: ReferenceExample[];
  application: string;
  frequency: 'constant' | 'regular' | 'occasional' | 'reference';
  lastUsed?: string;
  effectiveness: number; // 1-5 rating
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ResearchUsage {
  location: string; // Where in story
  purpose: string; // How it's used
  adaptation: string; // How it was modified
  effectiveness: number; // 1-5 rating
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'link';
  url: string;
  size?: number;
  description: string;
}

interface SourceCitation {
  apa: string;
  mla: string;
  chicago: string;
  custom?: string;
}

interface ResearchQuestion {
  question: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'researching' | 'answered' | 'abandoned';
  answer?: string;
  sources?: string[];
  notes?: string;
}

interface TopicConnection {
  element: 'character' | 'plot' | 'setting' | 'theme' | 'worldbuilding';
  elementId: string;
  connection: string;
  importance: 'critical' | 'important' | 'supporting';
}

interface ReferenceExample {
  example: string;
  context: string;
  explanation: string;
}
```

## User Interface Design

### Layout Structure
```
┌─ Research Notes Tab ────────────────────────────────────────┐
│                                                             │
│ ┌─ Category Tabs ──────────────────────────────────────────┐ │
│ │ Notes | Sources | Topics | Facts | Inspiration | Refs    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Content Area ──────────────────────────────────────────┐ │
│ │                                                         │ │
│ │ ┌─ Research Items ──┐  ┌─ Item Details ─────────────────┐ │ │
│ │ │ [+] Add New     │  │                               │ │ │
│ │ │ [📥] Import     │  │ Title: [________________]     │ │ │
│ │ │                 │  │ Type: [Fact▼] Category: [___] │ │ │
│ │ │ 📄 Historical   │  │                               │ │ │
│ │ │ 🔬 Scientific   │  │ Content:                      │ │ │
│ │ │ 🌍 Cultural     │  │ [Rich Text Editor__________]  │ │ │
│ │ │ 💡 Inspiration  │  │                               │ │ │
│ │ │                 │  │ Sources: [Multi-Select____]   │ │ │
│ │ │ [🔍] Search     │  │ Tags: [Tag Input__________]   │ │ │
│ │ │ [🏷] Filter     │  │                               │ │ │
│ │ │ [📊] Stats      │  │ [📎] Attachments [🎲] Generate │ │ │
│ │ └───────────────┘  │ [💾] Save  [🗑] Delete        │ │ │
│ │                    └───────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Research Dashboard ────────────────────────────────────┐ │
│ │ ┌─ Progress ──────┐ ┌─ Recent ─────────┐ ┌─ Quick ─────┐ │ │
│ │ │ Topics: 75%    │ │ • Added source   │ │ [Import]    │ │ │
│ │ │ Facts: 60%     │ │ • Fact verified  │ │ [Cite]      │ │ │
│ │ │ Sources: 90%   │ │ • Note updated   │ │ [Export]    │ │ │
│ │ └───────────────┘ └─────────────────┘ └───────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Sub-Tabs Navigation
- **Notes**: Research findings, quotes, observations, data
- **Sources**: Books, articles, websites, interviews, references
- **Topics**: Research areas, questions, progress tracking
- **Facts**: Fact-checking, verification, claims validation
- **Inspiration**: Creative sparks, ideas, visual references
- **References**: Style guides, templates, checklists, conventions

## Component Architecture

### File Structure
```
frontend/src/components/ScenarioEditor/tabs/
├── ResearchTab/
│   ├── index.ts                          # Export barrel
│   ├── ResearchTab.tsx                   # Main tab component
│   ├── ResearchTab.css                   # Tab-specific styles
│   ├── components/
│   │   ├── NotesManager.tsx              # Research notes management
│   │   ├── SourcesManager.tsx            # Sources management
│   │   ├── TopicsManager.tsx             # Research topics
│   │   ├── FactCheckManager.tsx          # Fact verification
│   │   ├── InspirationManager.tsx        # Creative inspiration
│   │   ├── ReferencesManager.tsx         # Style and format references
│   │   ├── ResearchDashboard.tsx         # Progress and statistics
│   │   ├── NoteForm.tsx                  # Note creation/editing
│   │   ├── SourceForm.tsx                # Source creation/editing
│   │   ├── TopicForm.tsx                 # Topic management
│   │   ├── FactCheckForm.tsx             # Fact verification form
│   │   ├── InspirationForm.tsx           # Inspiration capture
│   │   ├── RichTextEditor.tsx            # Enhanced text editing
│   │   ├── AttachmentManager.tsx         # File attachments
│   │   ├── CitationGenerator.tsx         # Auto-citation tools
│   │   ├── ResearchImporter.tsx          # Import from external sources
│   │   └── ResearchExporter.tsx          # Export functionality
│   ├── types/
│   │   └── research.ts                   # TypeScript interfaces
│   ├── hooks/
│   │   ├── useResearchData.ts            # Data management hook
│   │   ├── useResearchGeneration.ts      # AI generation hook
│   │   ├── useResearchImport.ts          # Import functionality
│   │   └── useResearchAnalysis.ts        # Analysis and insights
│   └── utils/
│       ├── citationFormats.ts            # Citation formatting
│       ├── researchSearch.ts             # Advanced search
│       ├── factVerification.ts           # Verification helpers
│       └── researchCategories.ts         # Category management
```

### Service Layer
```
frontend/src/services/
├── researchService.ts                    # CRUD operations
├── researchGenerationService.ts          # AI generation logic
├── citationService.ts                    # Citation management
├── factCheckingService.ts                # Verification tools
└── researchImportService.ts              # External data import
```

## LLM Generation Features

### Generation Capabilities
1. **Research Suggestions**:
   - Generate research topics based on story elements
   - Suggest relevant sources and databases
   - Create research questions and investigation paths
   - Recommend fact-checking priorities

2. **Content Enhancement**:
   - Expand research notes with additional context
   - Generate related research questions
   - Suggest connections between research topics
   - Create research summaries and syntheses

3. **Source Discovery**:
   - Recommend sources based on research needs
   - Generate search strategies and keywords
   - Suggest expert interviews and primary sources
   - Create source evaluation criteria

4. **Inspiration Development**:
   - Expand on inspiration snippets
   - Generate creative connections
   - Suggest story applications for research
   - Create inspiration-to-story-element mappings

### Generation Prompts
```typescript
interface ResearchPrompts {
  topics: {
    generation: "Generate research topics for a [genre] story about [premise]";
    expansion: "What additional research is needed for [topic] in [context]";
    questions: "Create research questions about [topic] for [story purpose]";
  };
  sources: {
    discovery: "Recommend authoritative sources for researching [topic]";
    evaluation: "How reliable is [source] for [research purpose]";
    alternatives: "Suggest alternative sources to [existing sources] for [topic]";
  };
  verification: {
    checking: "Fact-check this claim: [claim] in the context of [context]";
    evidence: "What evidence supports or refutes [statement]";
    alternatives: "If [fact] is incorrect, what are accurate alternatives";
  };
  inspiration: {
    development: "Develop this inspiration into story elements: [inspiration]";
    connections: "How might [inspiration] connect to [existing story elements]";
    expansion: "Expand on this creative idea: [idea] for [story context]";
  };
}
```

### Context Integration
- Generate research relevant to existing story elements
- Suggest fact-checking based on story claims
- Connect inspiration to character and plot development
- Maintain research consistency with established world building

## Data Management

### Auto-Detection Logic
```typescript
export const hasResearchData = (scenario: ScenarioData): boolean => {
  const research = scenario.research;
  if (!research) return false;
  
  return (
    (research.notes && research.notes.length > 0) ||
    (research.sources && research.sources.length > 0) ||
    (research.topics && research.topics.length > 0) ||
    (research.factChecks && research.factChecks.length > 0) ||
    (research.inspiration && research.inspiration.length > 0) ||
    (research.references && research.references.length > 0) ||
    (research.generalNotes && research.generalNotes.trim().length > 0)
  );
};
```

### Advanced Search
- Full-text search across all research content
- Tag-based filtering and categorization
- Date range and credibility filtering
- Cross-reference search between topics and sources

## User Experience Features

### Rich Text Editing
- Enhanced text editor with formatting
- Image embedding and annotation
- Link insertion and management
- Quote highlighting and attribution

### Import/Export Capabilities
- Import from research databases and tools
- Export to citation managers (Zotero, Mendeley)
- Generate bibliographies and source lists
- Create research reports and summaries

### Collaboration Features
- Share research with co-authors or editors
- Comment and annotation system
- Version tracking for research updates
- Collaborative fact-checking workflows

### Visual Organization
- Research topic mind maps
- Source relationship diagrams
- Progress tracking dashboards
- Research timeline visualization

## Integration Points

### Story Integration
- Link research to specific story elements
- Track research usage across chapters
- Validate story claims against research
- Generate story-research consistency reports

### Character Integration
- Connect biographical research to characters
- Link cultural research to character development
- Track character-specific research needs
- Generate character authenticity checks

### World Building Integration
- Connect historical research to world development
- Link scientific research to technology systems
- Reference cultural research in society building
- Validate world building against research

## Implementation Phases

### Phase 1: Core Structure
1. Create data types and interfaces
2. Implement basic CRUD operations
3. Set up component architecture
4. Add to tab configuration

### Phase 2: Basic UI
1. Create management components for each category
2. Implement rich text editing capabilities
3. Add basic search and filtering
4. Create attachment management

### Phase 3: Advanced Features
1. Implement import/export functionality
2. Add citation generation tools
3. Create fact-checking workflows
4. Build research dashboard

### Phase 4: AI Integration
1. Implement generation services
2. Add smart research suggestions
3. Create fact-checking assistance
4. Integrate with story elements

## Future Enhancements

### Advanced Features
- **AI Research Assistant**: Automated research discovery and summarization
- **Plagiarism Detection**: Ensure proper attribution and originality
- **Research Collaboration**: Multi-user research environments
- **Voice Note Integration**: Audio research capture and transcription
- **OCR Capabilities**: Extract text from images and documents
- **Research Scheduling**: Deadline tracking and research planning

### AI Enhancements
- **Smart Source Evaluation**: AI assessment of source credibility and relevance
- **Automated Fact-Checking**: Real-time verification of claims and statements
- **Research Gap Analysis**: Identify missing research areas automatically
- **Citation Style Detection**: Automatically format citations in required styles
- **Research Synthesis**: AI-generated summaries and connections between sources

This Research Notes tab will provide writers with comprehensive research management tools while maintaining the clean architecture and user experience standards of the application.
