import { Scenario } from '../../../../shared/types/ScenarioTypes';
import { TabId } from '../types';

/**
 * Determines which tabs should be visible based on scenario data
 * Always includes 'general' tab, adds others if they contain data
 */
export function getTabsWithData(scenario: Scenario): TabId[] {
  const tabsWithData: TabId[] = ['general']; // General tab is always visible

  // Check if characters tab has data
  if (scenario.characters && scenario.characters.length > 0) {
    // Check if any character has meaningful data
    const hasCharacterData = scenario.characters.some(char => 
      char.name?.trim() || 
      char.role?.trim() || 
      char.appearance?.trim() || 
      char.backstory?.trim() || 
      char.extraInfo?.trim()
    );
    if (hasCharacterData) {
      tabsWithData.push('characters');
    }
  }

  // Check if locations tab has data
  if (scenario.locations && scenario.locations.length > 0) {
    // Check if any location has meaningful data
    const hasLocationData = scenario.locations.some(loc => 
      loc.name?.trim() || 
      loc.visualDescription?.trim() || 
      loc.background?.trim() || 
      loc.extraInfo?.trim()
    );
    if (hasLocationData) {
      tabsWithData.push('locations');
    }
  }

  // Check if backstory tab has data
  if (scenario.backstory?.trim()) {
    tabsWithData.push('backstory');
  }

  // Check if story arc tab has data
  if (scenario.storyarc?.trim()) {
    tabsWithData.push('storyarc');
  }

  // Check if fill-in tab has data
  if (scenario.fillIn) {
    const fillIn = scenario.fillIn;
    const hasFillInData = (
      (fillIn.beginning && fillIn.beginning.trim().length > 0) ||
      (fillIn.ending && fillIn.ending.trim().length > 0)
    );
    if (hasFillInData) {
      tabsWithData.push('fillin');
    }
  }

  // Check if notes tab has data
  if (scenario.notes?.trim()) {
    tabsWithData.push('notes');
  }

  // Check if timeline tab has data
  if (scenario.timeline && scenario.timeline.length > 0) {
    // Check if there are events other than just the root
    const hasTimelineData = scenario.timeline.length > 1 || 
      (scenario.timeline.length === 1 && 
       (!!scenario.timeline[0].description?.trim() ||
        !!scenario.timeline[0].date?.trim() ||
        (scenario.timeline[0].charactersInvolved?.length || 0) > 0));
    if (hasTimelineData) {
      tabsWithData.push('timeline');
    }
  }

  // Check if multiple chapters tab has data
  if (scenario.multipleChapters) {
    const mc = scenario.multipleChapters;
    const hasMultipleChaptersData = (
      (mc.chapters && mc.chapters.length > 0) ||
      (mc.globalSettings && (
        mc.globalSettings.namingConvention !== 'Chapter %' ||
        mc.globalSettings.defaultWordCount !== 1500
      )) ||
      (mc.crossReferences && mc.crossReferences.length > 0)
    );
    if (hasMultipleChaptersData) {
      tabsWithData.push('multiplechapters');
    }
  }

  return tabsWithData;
}

/**
 * Gets the default visible tabs for a scenario
 * Uses persisted visibleTabs if available, otherwise detects from data
 */
export function getDefaultVisibleTabs(scenario: Scenario): TabId[] {
  // If scenario has persisted visible tabs, use those
  if (scenario.visibleTabs && scenario.visibleTabs.length > 0) {
    return scenario.visibleTabs as TabId[];
  }

  // For new scenarios (no ID), start with just general
  if (!scenario.id) {
    return ['general'];
  }

  // For existing scenarios, auto-detect tabs with data
  return getTabsWithData(scenario);
}

/**
 * Checks if a tab contains data (used for confirmation dialogs when removing)
 */
export function tabHasData(scenario: Scenario, tabId: TabId): boolean {
  switch (tabId) {
    case 'general':
      return true; // General tab always has some data (title, etc.)
    
    case 'characters':
      return scenario.characters && scenario.characters.length > 0 &&
        scenario.characters.some(char => 
          char.name?.trim() || 
          char.role?.trim() || 
          char.appearance?.trim() || 
          char.backstory?.trim() || 
          char.extraInfo?.trim()
        );
    
    case 'locations':
      return scenario.locations && scenario.locations.length > 0 &&
        scenario.locations.some(loc => 
          loc.name?.trim() || 
          loc.visualDescription?.trim() || 
          loc.background?.trim() || 
          loc.extraInfo?.trim()
        );
    
    case 'backstory':
      return !!scenario.backstory?.trim();
    
    case 'storyarc':
      return !!scenario.storyarc?.trim();
    
    case 'fillin': {
      if (!scenario.fillIn) return false;
      const fillIn = scenario.fillIn;
      return (
        (fillIn.beginning && fillIn.beginning.trim().length > 0) ||
        (fillIn.ending && fillIn.ending.trim().length > 0)
      );
    }
    
    case 'notes':
      return !!scenario.notes?.trim();
    
    case 'timeline':
      if (!scenario.timeline || scenario.timeline.length === 0) return false;
      // Check if there are events other than just the root, or if root has meaningful data
      return scenario.timeline.length > 1 || 
        (scenario.timeline.length === 1 && 
         (!!scenario.timeline[0].description?.trim() ||
          !!scenario.timeline[0].date?.trim() ||
          (scenario.timeline[0].charactersInvolved?.length || 0) > 0));
    
    default:
      return false;
  }
}
