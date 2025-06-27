# Revision Notes Tab - Feature Specification

## Overview
The Revision Notes tab provides writers with comprehensive tools for tracking edits, managing feedback, planning revisions, and maintaining version control throughout the writing process. This tab supports both self-editing and collaborative revision workflows.


### High Level Implementation
The tab will be hosted in the ScenarioEditor component. It will be accessible via the main navigation bar and will be part of the ScenarioEditor state management system. The tab should support the isDirty state to indicate unsaved changes, and it should be able to auto-detect existing data when a scenario is loaded. It should support importing existing  data from other scenarios, similar to the other tabs. The tab will also support AI generation features to help writers create content for the tab. The tab's styling will be similar to the other tabs, such as the CharactersTab, but will focus on revision management rather than character details. The tab will include features for revision rounds, editing notes, feedback collection, version control, goal setting, and progress tracking.

## Data Structure

### Scenario Data Extension
```typescript
interface ScenarioData {
  // ...existing fields...
  revisions?: {
    revisionRounds: RevisionRound[];
    editingNotes: EditingNote[];
    feedback: Feedback[];
    versions: Version[];
    checklist: RevisionChecklist[];
    goals: RevisionGoal[];
    trackingMetrics: TrackingMetric[];
    generalNotes: string;
  };
}

interface RevisionRound {
  id: string;
  name: string;
  type: 'developmental' | 'structural' | 'line' | 'copy' | 'proofreading' | 'polish' | 'custom';
  status: 'planned' | 'in-progress' | 'review' | 'completed' | 'paused';
  startDate: string;
  targetDate?: string;
  completionDate?: string;
  description: string;
  scope: RevisionScope;
  priorities: string[];
  focus: string[];
  methods: string[];
  progress: number; // 0-100%
  notes: EditingNote[];
  feedback: string[]; // Feedback IDs
  changes: RevisionChange[];
  metrics: RoundMetrics;
  nextSteps: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface EditingNote {
  id: string;
  revisionRoundId?: string;
  type: 'issue' | 'improvement' | 'idea' | 'question' | 'research' | 'style' | 'continuity' | 'other';
  priority: 'critical' | 'high' | 'medium' | 'low' | 'minor';
  status: 'open' | 'in-progress' | 'resolved' | 'deferred' | 'rejected';
  title: string;
  description: string;
  location: NoteLocation;
  category: string;
  assignedTo?: string; // For collaborative editing
  dueDate?: string;
  resolution?: string;
  relatedNotes: string[]; // Related note IDs
  attachments: NoteAttachment[];
  discussions: Discussion[];
  effort: 'quick' | 'moderate' | 'significant' | 'major';
  impact: 'minor' | 'moderate' | 'significant' | 'major';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface Feedback {
  id: string;
  source: FeedbackSource;
  type: 'developmental' | 'structural' | 'style' | 'character' | 'plot' | 'pacing' | 'dialogue' | 'general';
  format: 'written' | 'verbal' | 'annotation' | 'meeting' | 'survey' | 'review';
  priority: 'critical' | 'important' | 'useful' | 'optional';
  content: string;
  specificPoints: FeedbackPoint[];
  suggestions: string[];
  positives: string[];
  concerns: string[];
  questions: string[];
  actionItems: ActionItem[];
  status: 'received' | 'reviewed' | 'addressed' | 'deferred' | 'rejected';
  response?: string;
  implementation: FeedbackImplementation[];
  receivedDate: string;
  reviewedDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Version {
  id: string;
  name: string;
  type: 'draft' | 'revision' | 'milestone' | 'submission' | 'published';
  number: string; // e.g., "1.0", "2.3", "Draft 4"
  description: string;
  changes: VersionChange[];
  metrics: VersionMetrics;
  files: VersionFile[];
  parentVersion?: string;
  branchPoint?: string;
  mergedVersions?: string[];
  status: 'current' | 'archived' | 'branched' | 'merged';
  significance: 'minor' | 'moderate' | 'major' | 'milestone';
  createdDate: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface RevisionChecklist {
  id: string;
  name: string;
  type: 'developmental' | 'structural' | 'line' | 'copy' | 'proofreading' | 'submission' | 'custom';
  description: string;
  items: ChecklistItem[];
  applicability: 'always' | 'conditional' | 'genre-specific' | 'custom';
  conditions?: string[];
  progress: number; // 0-100%
  isTemplate: boolean;
  isCustom: boolean;
  source: 'default' | 'imported' | 'user-created' | 'ai-generated';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface RevisionGoal {
  id: string;
  title: string;
  description: string;
  type: 'improvement' | 'fix' | 'enhancement' | 'experiment' | 'polish';
  scope: 'global' | 'section' | 'chapter' | 'scene' | 'element';
  target: string; // What to improve
  measurable: boolean;
  metrics?: GoalMetric[];
  deadline?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'planned' | 'active' | 'completed' | 'deferred' | 'cancelled';
  progress: number; // 0-100%
  methods: string[];
  obstacles: string[];
  resources: string[];
  milestones: GoalMilestone[];
  results?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface TrackingMetric {
  id: string;
  name: string;
  type: 'count' | 'percentage' | 'score' | 'time' | 'custom';
  category: 'progress' | 'quality' | 'efficiency' | 'engagement' | 'structure';
  description: string;
  unit: string;
  currentValue: number;
  targetValue?: number;
  history: MetricHistory[];
  isActive: boolean;
  frequency: 'daily' | 'session' | 'weekly' | 'milestone' | 'manual';
  calculation?: string; // How it's calculated
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface RevisionScope {
  elements: string[]; // What to revise
  chapters?: string[];
  characters?: string[];
  themes?: string[];
  exclusions?: string[]; // What NOT to change
}

interface RevisionChange {
  type: 'addition' | 'deletion' | 'modification' | 'restructure' | 'style';
  description: string;
  location: string;
  before?: string;
  after?: string;
  reasoning: string;
  impact: 'minor' | 'moderate' | 'significant' | 'major';
  effort: number; // Hours or points
}

interface RoundMetrics {
  changesCount: number;
  issuesResolved: number;
  wordsChanged: number;
  timeSpent: number; // Hours
  efficiency: number; // Changes per hour
  qualityScore?: number;
}

interface NoteLocation {
  type: 'general' | 'chapter' | 'scene' | 'character' | 'element';
  reference: string;
  page?: number;
  line?: number;
  context?: string;
}

interface NoteAttachment {
  type: 'screenshot' | 'document' | 'audio' | 'link' | 'image';
  url: string;
  description: string;
  size?: number;
}

interface Discussion {
  participantId: string;
  participantName: string;
  message: string;
  timestamp: string;
  type: 'comment' | 'suggestion' | 'question' | 'resolution';
}

interface FeedbackSource {
  type: 'editor' | 'beta-reader' | 'critique-group' | 'mentor' | 'peer' | 'professional' | 'self';
  name: string;
  credentials?: string;
  relationship: string;
  contactInfo?: string;
  expertise: string[];
  perspective: string;
}

interface FeedbackPoint {
  location: string;
  issue: string;
  suggestion?: string;
  priority: 'critical' | 'important' | 'minor';
  category: string;
}

interface ActionItem {
  action: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  effort: 'quick' | 'moderate' | 'significant';
  status: 'pending' | 'in-progress' | 'completed' | 'deferred';
  notes?: string;
}

interface FeedbackImplementation {
  actionItem: string;
  implementation: string;
  result: string;
  effectiveness: number; // 1-5 rating
  notes?: string;
}

interface VersionChange {
  type: 'feature' | 'improvement' | 'fix' | 'style' | 'structure' | 'content';
  description: string;
  impact: 'minor' | 'moderate' | 'major';
  details?: string;
}

interface VersionMetrics {
  wordCount: number;
  characterCount: number;
  pageCount?: number;
  readingTime?: number; // minutes
  complexity?: number;
  readability?: number;
  customMetrics?: { [key: string]: number };
}

interface VersionFile {
  name: string;
  format: string;
  size: number;
  checksum: string;
  url: string;
  isPrimary: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
  description?: string;
  category: string;
  isCompleted: boolean;
  priority: 'critical' | 'important' | 'optional';
  applicability?: string[];
  resources?: string[];
  completedDate?: string;
  notes?: string;
}

interface GoalMetric {
  metric: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  progress: number; // 0-100%
}

interface GoalMilestone {
  name: string;
  description: string;
  targetDate: string;
  isCompleted: boolean;
  completedDate?: string;
  deliverables: string[];
}

interface MetricHistory {
  date: string;
  value: number;
  notes?: string;
  context?: string;
}
```

## User Interface Design

### Layout Structure
```
┌─ Revision Notes Tab ────────────────────────────────────────┐
│                                                             │
│ ┌─ View Tabs ─────────────────────────────────────────────┐ │
│ │ Dashboard | Rounds | Notes | Feedback | Versions | Goals │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Revision Dashboard ────────────────────────────────────┐ │
│ │ ┌─ Current Round ──────┐ ┌─ Progress ───────────────────┐ │ │
│ │ │ Line Edit v2.1      │ │ ████████░░ 80% Complete    │ │ │
│ │ │ Due: Dec 15         │ │ 24/30 Notes Resolved      │ │ │
│ │ │ Status: In Progress │ │ 5 Critical Issues Left    │ │ │
│ │ │ [View Details]      │ │ [View All Issues]         │ │ │
│ │ └─────────────────────┘ └─────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─ Recent Activity ────┐ ┌─ Quick Actions ─────────────┐ │ │
│ │ │ • Note resolved     │ │ [+] Add Note              │ │ │
│ │ │ • Feedback received │ │ [📝] Start Round          │ │ │
│ │ │ • Version created   │ │ [📋] Checklist            │ │ │
│ │ │ [View History]      │ │ [📊] Reports              │ │ │
│ │ └─────────────────────┘ └─────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Active Notes Panel ────────────────────────────────────┐ │
│ │ ┌─ Filter/Sort ────────────────────────────────────────┐  │ │
│ │ │ Type:[All▼] Priority:[High▼] Status:[Open▼] [🔍]    │  │ │
│ │ └─────────────────────────────────────────────────────┘  │ │
│ │                                                         │ │
│ │ 🔴 CRITICAL: Plot hole in Chapter 3 [Ch3:Scene2]       │ │
│ │ 🟡 HIGH: Character motivation unclear [Main:Alice]      │ │
│ │ 🟢 MEDIUM: Dialogue feels stiff [Ch7:Scene1]           │ │
│ │ [+] Add Note [📤] Export [🎲] Generate Suggestions     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Sub-Tabs Navigation
- **Dashboard**: Overview of current revision status and activity
- **Rounds**: Revision round planning and management
- **Notes**: Detailed editing notes and issue tracking
- **Feedback**: External feedback collection and management
- **Versions**: Version control and change tracking
- **Goals**: Revision objectives and progress tracking

## Component Architecture

### File Structure
```
frontend/src/components/ScenarioEditor/tabs/
├── RevisionTab/
│   ├── index.ts                          # Export barrel
│   ├── RevisionTab.tsx                   # Main tab component
│   ├── RevisionTab.css                   # Tab-specific styles
│   ├── components/
│   │   ├── RevisionDashboard.tsx         # Overview dashboard
│   │   ├── RoundsManager.tsx             # Revision rounds management
│   │   ├── NotesManager.tsx              # Editing notes interface
│   │   ├── FeedbackManager.tsx           # Feedback collection/tracking
│   │   ├── VersionsManager.tsx           # Version control interface
│   │   ├── GoalsManager.tsx              # Revision goals tracking
│   │   ├── RevisionRoundForm.tsx         # Round creation/editing
│   │   ├── EditingNoteForm.tsx           # Note creation/editing
│   │   ├── FeedbackForm.tsx              # Feedback input form
│   │   ├── VersionForm.tsx               # Version management
│   │   ├── ChecklistManager.tsx          # Revision checklists
│   │   ├── MetricsTracker.tsx            # Progress metrics
│   │   ├── ProgressVisualization.tsx     # Charts and graphs
│   │   ├── FeedbackAnalyzer.tsx          # Feedback analysis
│   │   ├── ChangeTracker.tsx             # Change documentation
│   │   └── RevisionReports.tsx           # Generated reports
│   ├── types/
│   │   └── revision.ts                   # TypeScript interfaces
│   ├── hooks/
│   │   ├── useRevisionData.ts            # Data management hook
│   │   ├── useRevisionGeneration.ts      # AI generation hook
│   │   ├── useVersionControl.ts          # Version management
│   │   ├── useMetricsTracking.ts         # Progress tracking
│   │   └── useRevisionAnalysis.ts        # Analysis and insights
│   └── utils/
│       ├── revisionCalculations.ts       # Progress calculations
│       ├── versionComparison.ts          # Version diff utilities
│       ├── feedbackAnalysis.ts           # Feedback processing
│       ├── checklistTemplates.ts         # Default checklists
│       └── revisionReporting.ts          # Report generation
```

### Service Layer
```
frontend/src/services/
├── revisionService.ts                    # CRUD operations
├── revisionGenerationService.ts          # AI generation logic
├── versionControlService.ts              # Version management
├── feedbackAnalysisService.ts            # Feedback processing
└── revisionReportingService.ts           # Report generation
```

## LLM Generation Features

### Generation Capabilities
1. **Issue Identification**:
   - Analyze text for common editing issues
   - Generate revision suggestions and priorities
   - Identify structural and developmental problems
   - Suggest improvement opportunities

2. **Checklist Creation**:
   - Generate custom revision checklists based on story type
   - Create genre-specific editing guidelines
   - Suggest review criteria for different revision types
   - Generate quality assurance checklists

3. **Feedback Analysis**:
   - Synthesize multiple feedback sources
   - Identify common themes in feedback
   - Prioritize feedback points by importance
   - Generate action plans from feedback

4. **Goal Setting**:
   - Suggest revision goals based on story analysis
   - Create measurable improvement objectives
   - Generate milestone plans for complex revisions
   - Recommend revision strategies and methods

### Generation Prompts
```typescript
interface RevisionPrompts {
  issues: {
    identification: "Analyze this text for editing issues: [text sample]";
    prioritization: "Prioritize these revision issues based on impact: [issues list]";
    solutions: "Suggest solutions for this editing problem: [issue description]";
  };
  checklists: {
    creation: "Create a revision checklist for [genre] [type] editing focusing on [aspects]";
    customization: "Adapt this checklist for [specific needs]: [base checklist]";
    validation: "Evaluate the completeness of this revision: [checklist status]";
  };
  feedback: {
    synthesis: "Synthesize these feedback points into actionable items: [feedback]";
    analysis: "Identify the most critical issues from this feedback: [feedback]";
    planning: "Create an action plan to address this feedback: [feedback summary]";
  };
  goals: {
    setting: "Suggest revision goals for improving [story aspect] in [genre]";
    breakdown: "Break down this revision goal into manageable steps: [goal]";
    measurement: "How can we measure progress on this revision goal: [goal]";
  };
}
```

### Context Integration
- Analyze existing story content for revision opportunities
- Reference character development and plot structure
- Consider genre conventions and expectations
- Maintain consistency with established story elements

## Data Management

### Auto-Detection Logic
```typescript
export const hasRevisionData = (scenario: ScenarioData): boolean => {
  const revisions = scenario.revisions;
  if (!revisions) return false;
  
  return (
    (revisions.revisionRounds && revisions.revisionRounds.length > 0) ||
    (revisions.editingNotes && revisions.editingNotes.length > 0) ||
    (revisions.feedback && revisions.feedback.length > 0) ||
    (revisions.versions && revisions.versions.length > 0) ||
    (revisions.goals && revisions.goals.length > 0) ||
    (revisions.generalNotes && revisions.generalNotes.trim().length > 0)
  );
};
```

### Progress Tracking
- Automatic calculation of revision progress
- Metrics tracking and trend analysis
- Goal achievement monitoring
- Efficiency and quality measurements

## User Experience Features

### Visual Progress Tracking
- Progress bars and completion percentages
- Timeline visualization of revision activities
- Metrics charts and trend analysis
- Goal achievement dashboards

### Collaborative Features
- Multi-user feedback collection
- Comment threads and discussions
- Assignment and responsibility tracking
- Notification and reminder systems

### Smart Organization
- Automatic categorization of notes and feedback
- Priority-based sorting and filtering
- Context-aware search across all revision data
- Related item suggestions and linking

### Export and Reporting
- Comprehensive revision reports
- Feedback summaries and action plans
- Progress tracking documents
- Version comparison reports

## Integration Points

### Story Integration
- Link revision notes to specific story elements
- Track changes across characters, plot, and themes
- Reference world building and research in revisions
- Maintain story consistency through revisions

### Timeline Integration
- Connect revisions to story timeline events
- Track character development through revisions
- Reference historical accuracy in revision notes
- Maintain chronological consistency

### Character Integration
- Character-specific revision tracking
- Development arc consistency checking
- Character voice and dialogue refinement
- Relationship consistency across revisions

## Implementation Phases

### Phase 1: Core Structure
1. Create data types and revision models
2. Implement basic CRUD operations
3. Set up component architecture
4. Add to tab configuration

### Phase 2: Basic UI
1. Create revision dashboard and overview
2. Implement notes and feedback management
3. Add basic version tracking
4. Create simple progress indicators

### Phase 3: Advanced Features
1. Implement comprehensive metrics tracking
2. Add collaborative feedback features
3. Create advanced reporting capabilities
4. Build intelligent organization tools

### Phase 4: AI Integration
1. Implement generation and analysis services
2. Add smart issue identification
3. Create automated suggestion systems
4. Integrate with story analysis tools

## Future Enhancements

### Advanced Features
- **AI-Powered Editing Assistant**: Real-time editing suggestions and improvements
- **Collaborative Editing Workflows**: Multi-user editing with conflict resolution
- **Version Branching and Merging**: Git-like version control for complex revisions
- **Automated Quality Assessment**: AI evaluation of revision quality and completeness
- **Integration with External Tools**: Connect with professional editing software

### AI Enhancements
- **Intelligent Issue Detection**: Advanced AI analysis of structural and stylistic problems
- **Personalized Revision Strategies**: AI-customized editing approaches based on writing style
- **Predictive Revision Planning**: Estimate revision time and effort requirements
- **Quality Prediction**: Forecast revision outcomes and story improvement potential
- **Automated Proofreading**: AI-powered grammar, style, and consistency checking

This Revision Notes tab will provide writers with professional-grade revision management tools while maintaining the clean architecture and user experience standards of the application.
