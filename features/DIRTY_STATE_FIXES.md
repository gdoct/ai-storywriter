# Dirty State Bug Fixes

## Issues Fixed

### 1. Loading scenarios triggers dirty state
**Problem**: When loading a scenario from the dropdown, the `updateContent` function was called which set `isDirty(true)`, even though we were just loading existing data.

**Solution**: 
- Added `isLoadingScenario` state to track when we're loading a scenario
- Modified `updateContent` to check `!isLoadingScenario` before setting dirty state
- Set loading flag in `handleLoadScenario` and clear it after loading is complete

### 2. Save As creates endless loop 
**Problem**: The "Save As" functionality was creating a new scenario with `id: ''`, which would trigger the scenario loading logic and cause flickering between scenarios.

**Solution**:
- Fixed the `confirmSaveAsService` to properly handle the response from saving
- Added `onSaveComplete` callback to clear dirty state after successful save operations

### 3. Story generation sets dirty state
**Problem**: When generating stories in the ReadingPane, the `onStoryGenerated` callback was setting `isDirty(true)`, but story generation doesn't modify the scenario itself.

**Solution**:
- Removed `setIsDirty(true)` from the `onStoryGenerated` callback
- Story generation no longer marks the scenario as dirty

### 4. Tab switching causes unnecessary dirty state
**Problem**: Any content update through tabs would set dirty state, even when just switching tabs or loading existing scenario data.

**Solution**:
- The loading state check prevents dirty state updates during scenario loading
- Normal user edits still properly set the dirty state

## Files Modified

1. **ScenarioWriter.tsx**:
   - Added `isLoadingScenario` state
   - Modified `updateContent` to respect loading state
   - Modified `handleLoadScenario` to use loading state
   - Removed dirty state setting from story generation
   - Added `onSaveComplete` callback to FileTab

2. **FileTab.tsx**:
   - Fixed dependency array for currentScenario effect to only depend on ID
   - Added proper handling of the `onSaveComplete` callback

3. **fileTabService.ts**:
   - Fixed `confirmSaveAsService` to properly handle the save response

## Testing

To test the fixes:

1. **Load a scenario**: Should not trigger "unsaved changes" dialog
2. **Save As**: Should not cause flickering between scenarios 
3. **Generate story**: Should not mark scenario as dirty
4. **Switch tabs**: Should not trigger dirty state when no actual edits are made
5. **Make actual edits**: Should properly mark scenario as dirty

The dirty state should now only be triggered by actual user edits to scenario content, not by loading existing data or generating stories.
