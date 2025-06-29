import React, { useCallback, useState } from 'react';
import { FaCog, FaEye, FaPlus, FaTimes, FaTrash, FaUsers } from 'react-icons/fa';
import { Character } from '../../../../../types/ScenarioTypes';
import { CharacterGroup, GroupHierarchy, GroupMember } from '../types/relationships';

interface GroupsManagerProps {
  groups: CharacterGroup[];
  onGroupsChange: (groups: CharacterGroup[]) => void;
  characters: Character[];
  readonly?: boolean;
}

const GroupsManager: React.FC<GroupsManagerProps> = ({
  groups,
  onGroupsChange,
  characters,
  readonly = false,
}) => {
  const [editingGroup, setEditingGroup] = useState<CharacterGroup | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const handleCreateGroup = useCallback(() => {
    const newGroup: CharacterGroup = {
      id: `group_${Date.now()}`,
      name: '',
      description: '',
      type: 'social',
      members: [],
      hierarchy: [],
      purpose: '',
      dynamics: '',
      conflicts: [],
      bonds: [],
      traditions: [],
      secrets: [],
      influence: '',
      stability: 'stable',
      storyRole: '',
    };
    setEditingGroup(newGroup);
    setIsCreating(true);
  }, []);

  const handleSaveGroup = useCallback((group: CharacterGroup) => {
    if (isCreating) {
      onGroupsChange([...groups, group]);
      setIsCreating(false);
    } else {
      onGroupsChange(groups.map(g => g.id === group.id ? group : g));
    }
    setEditingGroup(null);
  }, [groups, onGroupsChange, isCreating]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    onGroupsChange(groups.filter(g => g.id !== groupId));
  }, [groups, onGroupsChange]);

  const handleCancelEdit = useCallback(() => {
    setEditingGroup(null);
    setIsCreating(false);
  }, []);

  const getCharacterName = useCallback((characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    return character ? character.name : 'Unknown Character';
  }, [characters]);

  return (
    <div className="groups-manager">
      <div className="groups-manager__header">
        <h3>Character Groups</h3>
        {!readonly && (
          <button
            className="btn btn--primary groups-manager__add-btn"
            onClick={handleCreateGroup}
            disabled={isCreating}
          >
            <FaPlus /> Add Group
          </button>
        )}
      </div>

      <div className="groups-manager__list">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const isEditing = editingGroup?.id === group.id;

          return (
            <div key={group.id} className="group-item">
              <div className="group-item__header">
                <button
                  className="group-item__expand-btn"
                  onClick={() => toggleExpanded(group.id)}
                >
                  <FaEye />
                </button>
                <div className="group-item__title">
                  <FaUsers className="group-item__icon" />
                  <h4>{group.name || 'Unnamed Group'}</h4>
                  <span className={`group-item__type group-item__type--${group.type}`}>
                    {group.type}
                  </span>
                  <span className={`group-item__stability group-item__stability--${group.stability}`}>
                    {group.stability}
                  </span>
                  <span className="group-item__member-count">
                    {group.members.length} members
                  </span>
                </div>
                {!readonly && (
                  <div className="group-item__actions">
                    <button
                      className="btn btn--secondary btn--small"
                      onClick={() => setEditingGroup(group)}
                    >
                      <FaCog />
                    </button>
                    <button
                      className="btn btn--danger btn--small"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="group-item__content">
                  {!isEditing ? (
                    <div className="group-item__view">
                      <div className="group-item__field">
                        <label>Description:</label>
                        <p>{group.description || 'No description provided'}</p>
                      </div>
                      {group.purpose && (
                        <div className="group-item__field">
                          <label>Purpose:</label>
                          <p>{group.purpose}</p>
                        </div>
                      )}
                      {group.members && group.members.length > 0 && (
                        <div className="group-item__field">
                          <label>Members:</label>
                          <div className="members-list">
                            {group.members.map((member, index) => (
                              <div key={index} className="member-item">
                                <span className="member-name">
                                  {getCharacterName(member.characterId)}
                                </span>
                                <span className="member-role">
                                  {member.role}
                                </span>
                                <span className={`member-status member-status--${member.status}`}>
                                  {member.status}
                                </span>
                                {member.influence && (
                                  <span className="member-influence">
                                    Influence: {member.influence}/10
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {group.hierarchy && group.hierarchy.length > 0 && (
                        <div className="group-item__field">
                          <label>Hierarchy:</label>
                          <div className="hierarchy-list">
                            {group.hierarchy
                              .sort((a, b) => a.level - b.level)
                              .map((level, index) => (
                                <div key={index} className="hierarchy-item">
                                  <span className="hierarchy-level">Level {level.level}</span>
                                  <span className="hierarchy-title">{level.title}</span>
                                  <span className="hierarchy-character">
                                    {getCharacterName(level.characterId)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      {group.dynamics && (
                        <div className="group-item__field">
                          <label>Group Dynamics:</label>
                          <p>{group.dynamics}</p>
                        </div>
                      )}
                      {group.conflicts && group.conflicts.length > 0 && (
                        <div className="group-item__field">
                          <label>Internal Conflicts:</label>
                          <ul>
                            {group.conflicts.map((conflict, index) => (
                              <li key={index}>{conflict}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {group.bonds && group.bonds.length > 0 && (
                        <div className="group-item__field">
                          <label>Shared Bonds:</label>
                          <ul>
                            {group.bonds.map((bond, index) => (
                              <li key={index}>{bond}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {group.traditions && group.traditions.length > 0 && (
                        <div className="group-item__field">
                          <label>Traditions:</label>
                          <ul>
                            {group.traditions.map((tradition, index) => (
                              <li key={index}>{tradition}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {group.secrets && group.secrets.length > 0 && (
                        <div className="group-item__field">
                          <label>Group Secrets:</label>
                          <ul>
                            {group.secrets.map((secret, index) => (
                              <li key={index}>{secret}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {group.influence && (
                        <div className="group-item__field">
                          <label>Group Influence:</label>
                          <p>{group.influence}</p>
                        </div>
                      )}
                      {group.storyRole && (
                        <div className="group-item__field">
                          <label>Story Role:</label>
                          <p>{group.storyRole}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <GroupEditor
                      group={group}
                      characters={characters}
                      onSave={handleSaveGroup}
                      onCancel={handleCancelEdit}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isCreating && editingGroup && (
          <div className="group-item group-item--creating">
            <div className="group-item__header">
              <h4>New Group</h4>
            </div>
            <div className="group-item__content">
              <GroupEditor
                group={editingGroup}
                characters={characters}
                onSave={handleSaveGroup}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        )}
      </div>

      {groups.length === 0 && !isCreating && (
        <div className="groups-manager__empty">
          <p>No character groups defined yet.</p>
          {!readonly && (
            <button
              className="btn btn--primary"
              onClick={handleCreateGroup}
            >
              <FaPlus /> Create Your First Group
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface GroupEditorProps {
  group: CharacterGroup;
  characters: Character[];
  onSave: (group: CharacterGroup) => void;
  onCancel: () => void;
}

const GroupEditor: React.FC<GroupEditorProps> = ({
  group,
  characters,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CharacterGroup>({ ...group });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
    }
  }, [formData, onSave]);

  const handleListChange = useCallback((field: 'conflicts' | 'bonds' | 'traditions' | 'secrets', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(item => item.length > 0)
    }));
  }, []);

  const handleMemberAdd = useCallback(() => {
    const newMember: GroupMember = {
      characterId: '',
      role: '',
      status: 'core',
      influence: 5,
      loyalty: 5,
      joinDate: '',
      contributions: [],
      conflicts: [],
    };
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, newMember]
    }));
  }, []);

  const handleMemberChange = useCallback((index: number, field: keyof GroupMember, value: any) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  }, []);

  const handleMemberRemove = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  }, []);

  const handleHierarchyAdd = useCallback(() => {
    const newHierarchy: GroupHierarchy = {
      level: 1,
      title: '',
      characterId: '',
      responsibilities: [],
      authority: [],
    };
    setFormData(prev => ({
      ...prev,
      hierarchy: [...prev.hierarchy, newHierarchy]
    }));
  }, []);

  const handleHierarchyChange = useCallback((index: number, field: keyof GroupHierarchy, value: any) => {
    setFormData(prev => ({
      ...prev,
      hierarchy: prev.hierarchy.map((hierarchy, i) => 
        i === index ? { ...hierarchy, [field]: value } : hierarchy
      )
    }));
  }, []);

  const handleHierarchyRemove = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      hierarchy: prev.hierarchy.filter((_, i) => i !== index)
    }));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="group-editor">
      <div className="form-group">
        <label htmlFor="group-name">Name *</label>
        <input
          id="group-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter group name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="group-description">Description</label>
        <textarea
          id="group-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe this group"
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="group-type">Type</label>
          <select
            id="group-type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
          >
            <option value="family">Family</option>
            <option value="team">Team</option>
            <option value="organization">Organization</option>
            <option value="social">Social</option>
            <option value="temporary">Temporary</option>
            <option value="alliance">Alliance</option>
            <option value="opposition">Opposition</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="group-stability">Stability</label>
          <select
            id="group-stability"
            value={formData.stability}
            onChange={(e) => setFormData(prev => ({ ...prev, stability: e.target.value as any }))}
          >
            <option value="stable">Stable</option>
            <option value="growing">Growing</option>
            <option value="declining">Declining</option>
            <option value="volatile">Volatile</option>
            <option value="transforming">Transforming</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="group-purpose">Purpose</label>
        <textarea
          id="group-purpose"
          value={formData.purpose}
          onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
          placeholder="What is the purpose of this group?"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label>Members</label>
        <div className="members-editor">
          {formData.members.map((member, index) => (
            <div key={index} className="member-editor-item">
              <div className="member-editor-row">
                <select
                  value={member.characterId}
                  onChange={(e) => handleMemberChange(index, 'characterId', e.target.value)}
                >
                  <option value="">Select Character</option>
                  {characters.map(character => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={member.role}
                  onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                  placeholder="Role"
                />
                <select
                  value={member.status}
                  onChange={(e) => handleMemberChange(index, 'status', e.target.value)}
                >
                  <option value="core">Core</option>
                  <option value="peripheral">Peripheral</option>
                  <option value="new">New</option>
                  <option value="leaving">Leaving</option>
                  <option value="expelled">Expelled</option>
                  <option value="honorary">Honorary</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={member.influence}
                  onChange={(e) => handleMemberChange(index, 'influence', parseInt(e.target.value))}
                  placeholder="Influence"
                />
                <button
                  type="button"
                  className="btn btn--danger btn--small"
                  onClick={() => handleMemberRemove(index)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn--secondary btn--small"
            onClick={handleMemberAdd}
          >
            <FaPlus /> Add Member
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Hierarchy</label>
        <div className="hierarchy-editor">
          {formData.hierarchy.map((hierarchy, index) => (
            <div key={index} className="hierarchy-editor-item">
              <div className="hierarchy-editor-row">
                <input
                  type="number"
                  min="1"
                  value={hierarchy.level}
                  onChange={(e) => handleHierarchyChange(index, 'level', parseInt(e.target.value))}
                  placeholder="Level"
                />
                <input
                  type="text"
                  value={hierarchy.title}
                  onChange={(e) => handleHierarchyChange(index, 'title', e.target.value)}
                  placeholder="Title"
                />
                <select
                  value={hierarchy.characterId}
                  onChange={(e) => handleHierarchyChange(index, 'characterId', e.target.value)}
                >
                  <option value="">Select Character</option>
                  {characters.map(character => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn--danger btn--small"
                  onClick={() => handleHierarchyRemove(index)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn--secondary btn--small"
            onClick={handleHierarchyAdd}
          >
            <FaPlus /> Add Hierarchy Level
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="group-dynamics">Group Dynamics</label>
        <textarea
          id="group-dynamics"
          value={formData.dynamics}
          onChange={(e) => setFormData(prev => ({ ...prev, dynamics: e.target.value }))}
          placeholder="Describe the group dynamics"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label htmlFor="group-conflicts">Internal Conflicts (comma-separated)</label>
        <input
          id="group-conflicts"
          type="text"
          value={formData.conflicts.join(', ')}
          onChange={(e) => handleListChange('conflicts', e.target.value)}
          placeholder="What conflicts exist within the group?"
        />
      </div>

      <div className="form-group">
        <label htmlFor="group-bonds">Shared Bonds (comma-separated)</label>
        <input
          id="group-bonds"
          type="text"
          value={formData.bonds.join(', ')}
          onChange={(e) => handleListChange('bonds', e.target.value)}
          placeholder="What bonds unite the group?"
        />
      </div>

      <div className="form-group">
        <label htmlFor="group-traditions">Traditions (comma-separated)</label>
        <input
          id="group-traditions"
          type="text"
          value={formData.traditions.join(', ')}
          onChange={(e) => handleListChange('traditions', e.target.value)}
          placeholder="Group traditions and customs"
        />
      </div>

      <div className="form-group">
        <label htmlFor="group-secrets">Group Secrets (comma-separated)</label>
        <input
          id="group-secrets"
          type="text"
          value={formData.secrets.join(', ')}
          onChange={(e) => handleListChange('secrets', e.target.value)}
          placeholder="Secrets known to the group"
        />
      </div>

      <div className="form-group">
        <label htmlFor="group-influence">Group Influence</label>
        <textarea
          id="group-influence"
          value={formData.influence}
          onChange={(e) => setFormData(prev => ({ ...prev, influence: e.target.value }))}
          placeholder="What influence does this group have?"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label htmlFor="group-story-role">Story Role</label>
        <textarea
          id="group-story-role"
          value={formData.storyRole}
          onChange={(e) => setFormData(prev => ({ ...prev, storyRole: e.target.value }))}
          placeholder="What role does this group play in the story?"
          rows={2}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          Save Group
        </button>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default GroupsManager;
