# Multiple Stories per Scenario

The StoryWriter application now supports storing multiple story versions for each scenario. This allows you to experiment with different generated stories for the same scenario setup.

## Key Features

1. **Multiple Stories per Scenario**: Each story is now stored as `stories/{scenario_id}/{timestamp}.txt`
2. **Version Selection**: The ReadingArea component now includes a dropdown to select from different story versions
3. **Automatic Versioning**: Every time you save a story, a new versioned file is created with the current timestamp

## Migration

To migrate existing stories from the old flat structure to the new directory-based structure, run:

```bash
./migrate_stories.py
```

This script will:
1. Convert all existing story files in the format `stories/{id}.txt` to `stories/{id}/{timestamp}.txt`
2. Maintain compatibility with the new system
3. Report on the migration process

## Technical Details

- Backend files updated: `scenario_controller.py`
- Frontend files updated: `ReadingArea.tsx`, `ScenarioWriter.tsx`, `FileTab.tsx`, `scenario.ts`
- New endpoints:
  - `GET /api/story/{scenario_id}/list` - Returns list of available story versions for a scenario
  - `GET /api/story/{scenario_id}?timestamp={timestamp}` - Gets a specific story version (defaults to most recent)
