import { Scenario } from '../../../types/ScenarioTypes';
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

  // Check if character relationships tab has data
  if (scenario.characterRelationships) {
    const cr = scenario.characterRelationships;
    const hasCharacterRelationshipsData = (
      (cr.relationships && cr.relationships.length > 0) ||
      (cr.relationshipTypes && cr.relationshipTypes.length > 0) ||
      (cr.dynamics && cr.dynamics.length > 0) ||
      (cr.conflicts && cr.conflicts.length > 0) ||
      (cr.histories && cr.histories.length > 0) ||
      (cr.groups && cr.groups.length > 0) ||
      (cr.generalNotes && cr.generalNotes.trim().length > 0)
    );
    if (hasCharacterRelationshipsData) {
      tabsWithData.push('characterrelationships');
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

  // Check if notes tab has data
  if (scenario.notes?.trim()) {
    tabsWithData.push('notes');
  }

  // Check if world building tab has data
  if (scenario.worldBuilding) {
    const wb = scenario.worldBuilding;
    const hasWorldBuildingData = (
      (wb.locations && wb.locations.length > 0) ||
      (wb.cultures && wb.cultures.length > 0) ||
      (wb.magicSystems && wb.magicSystems.length > 0) ||
      (wb.technologies && wb.technologies.length > 0) ||
      (wb.religions && wb.religions.length > 0) ||
      (wb.organizations && wb.organizations.length > 0) ||
      (wb.generalNotes && wb.generalNotes.trim().length > 0)
    );
    if (hasWorldBuildingData) {
      tabsWithData.push('worldbuilding');
    }
  }

  // Check if timeline tab has data
  if (scenario.timeline) {
    const tl = scenario.timeline;
    const hasTimelineData = (
      (tl.events && tl.events.length > 0) ||
      (tl.eras && tl.eras.length > 0) ||
      (tl.calendars && tl.calendars.length > 0) ||
      (tl.generalNotes && tl.generalNotes.trim().length > 0)
    );
    if (hasTimelineData) {
      tabsWithData.push('timeline');
    }
  }

  // Check if objects & actions tab has data
  if (scenario.objectsAndActions) {
    const oa = scenario.objectsAndActions;
    const hasObjectsActionsData = (
      (oa.objects && oa.objects.length > 0) ||
      (oa.actions && oa.actions.length > 0) ||
      (oa.interactions && oa.interactions.length > 0) ||
      (oa.sequences && oa.sequences.length > 0) ||
      (oa.generalNotes && oa.generalNotes.trim().length > 0)
    );
    if (hasObjectsActionsData) {
      tabsWithData.push('objectsactions');
    }
  }

  // Check if themes & symbols tab has data
  if (scenario.themesAndSymbols) {
    const ts = scenario.themesAndSymbols;
    const hasThemesSymbolsData = (
      (ts.themes && ts.themes.length > 0) ||
      (ts.symbols && ts.symbols.length > 0) ||
      (ts.motifs && ts.motifs.length > 0) ||
      (ts.metaphors && ts.metaphors.length > 0) ||
      (ts.archetypes && ts.archetypes.length > 0) ||
      (ts.literaryDevices && ts.literaryDevices.length > 0) ||
      (ts.generalNotes && ts.generalNotes.trim().length > 0)
    );
    if (hasThemesSymbolsData) {
      tabsWithData.push('themessymbols');
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

  // Check if randomizers tab has data
  if (scenario.randomizers) {
    const r = scenario.randomizers;
    const hasRandomizersData = (
      (r.randomizers && r.randomizers.length > 0) ||
      (r.generalNotes && r.generalNotes.trim().length > 0)
    );
    if (hasRandomizersData) {
      tabsWithData.push('randomizers');
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
    
    case 'characterrelationships':
      if (!scenario.characterRelationships) return false;
      const cr = scenario.characterRelationships;
      return (
        (cr.relationships && cr.relationships.length > 0) ||
        (cr.relationshipTypes && cr.relationshipTypes.length > 0) ||
        (cr.dynamics && cr.dynamics.length > 0) ||
        (cr.conflicts && cr.conflicts.length > 0) ||
        (cr.histories && cr.histories.length > 0) ||
        (cr.groups && cr.groups.length > 0) ||
        (cr.generalNotes && cr.generalNotes.trim().length > 0)
      );
    
    case 'backstory':
      return !!scenario.backstory?.trim();
    
    case 'storyarc':
      return !!scenario.storyarc?.trim();
    
    case 'notes':
      return !!scenario.notes?.trim();
    
    case 'worldbuilding':
      if (!scenario.worldBuilding) return false;
      const wb = scenario.worldBuilding;
      return (
        (wb.locations && wb.locations.length > 0) ||
        (wb.cultures && wb.cultures.length > 0) ||
        (wb.magicSystems && wb.magicSystems.length > 0) ||
        (wb.technologies && wb.technologies.length > 0) ||
        (wb.religions && wb.religions.length > 0) ||
        (wb.organizations && wb.organizations.length > 0) ||
        (wb.generalNotes && wb.generalNotes.trim().length > 0)
      );
    
    case 'timeline':
      if (!scenario.timeline) return false;
      const tl = scenario.timeline;
      return (
        (tl.events && tl.events.length > 0) ||
        (tl.eras && tl.eras.length > 0) ||
        (tl.calendars && tl.calendars.length > 0) ||
        (tl.generalNotes && tl.generalNotes.trim().length > 0)
      );
    
    case 'objectsactions':
      if (!scenario.objectsAndActions) return false;
      const oa = scenario.objectsAndActions;
      return (
        (oa.objects && oa.objects.length > 0) ||
        (oa.actions && oa.actions.length > 0) ||
        (oa.interactions && oa.interactions.length > 0) ||
        (oa.sequences && oa.sequences.length > 0) ||
        (oa.generalNotes && oa.generalNotes.trim().length > 0)
      );
    
    case 'themessymbols':
      if (!scenario.themesAndSymbols) return false;
      const ts = scenario.themesAndSymbols;
      return (
        (ts.themes && ts.themes.length > 0) ||
        (ts.symbols && ts.symbols.length > 0) ||
        (ts.motifs && ts.motifs.length > 0) ||
        (ts.metaphors && ts.metaphors.length > 0) ||
        (ts.archetypes && ts.archetypes.length > 0) ||
        (ts.literaryDevices && ts.literaryDevices.length > 0) ||
        (ts.generalNotes && ts.generalNotes.trim().length > 0)
      );
    
    case 'multiplechapters':
      if (!scenario.multipleChapters) return false;
      const mc = scenario.multipleChapters;
      return (
        (mc.chapters && mc.chapters.length > 0) ||
        (mc.globalSettings && (
          mc.globalSettings.namingConvention !== 'Chapter %' ||
          mc.globalSettings.defaultWordCount !== 1500
        )) ||
        (mc.crossReferences && mc.crossReferences.length > 0)
      );
    
    case 'randomizers':
      if (!scenario.randomizers) return false;
      const r = scenario.randomizers;
      return (
        (r.randomizers && r.randomizers.length > 0) ||
        (r.generalNotes && r.generalNotes.trim().length > 0)
      );
    
    default:
      return false;
  }
}
