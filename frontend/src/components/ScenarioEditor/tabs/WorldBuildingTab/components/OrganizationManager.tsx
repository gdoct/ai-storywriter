import { AiTextArea, AiTextBox, Button } from '@drdata/docomo';
import React, { useCallback, useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { Organization, Scenario } from '../../../../../types/ScenarioTypes';
import './WorldBuildingManagers.css';

interface OrganizationManagerProps {
  organizations: Organization[];
  onOrganizationsChange: (organizations: Organization[]) => void;
  scenario: Scenario;
  isLoading: boolean;
}

export const OrganizationManager: React.FC<OrganizationManagerProps> = ({
  organizations,
  onOrganizationsChange,
  scenario,
  isLoading,
}) => {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  const organizationTypes = [
    { value: 'guild', label: 'Guild' },
    { value: 'government', label: 'Government' },
    { value: 'military', label: 'Military' },
    { value: 'religious', label: 'Religious' },
    { value: 'criminal', label: 'Criminal' },
    { value: 'academic', label: 'Academic' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'other', label: 'Other' },
  ];

  const handleAddOrganization = useCallback(() => {
    const newOrganization: Organization = {
      id: uuidv4(),
      name: '',
      type: 'other',
      description: '',
      purpose: '',
      structure: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedOrganizations = [...organizations, newOrganization];
    onOrganizationsChange(updatedOrganizations);
    setSelectedOrganization(newOrganization);
  }, [organizations, onOrganizationsChange]);

  const handleOrganizationChange = useCallback((organizationId: string, field: keyof Organization, value: any) => {
    const updatedOrganizations = organizations.map(organization =>
      organization.id === organizationId
        ? { ...organization, [field]: value, updatedAt: new Date().toISOString() }
        : organization
    );
    onOrganizationsChange(updatedOrganizations);
    
    if (selectedOrganization?.id === organizationId) {
      setSelectedOrganization(prev => prev ? { ...prev, [field]: value } : null);
    }
  }, [organizations, onOrganizationsChange, selectedOrganization]);

  const handleDeleteOrganization = useCallback((organizationId: string) => {
    const updatedOrganizations = organizations.filter(organization => organization.id !== organizationId);
    onOrganizationsChange(updatedOrganizations);
    if (selectedOrganization?.id === organizationId) {
      setSelectedOrganization(null);
    }
  }, [organizations, onOrganizationsChange, selectedOrganization]);

  return (
    <div className="organization-manager">
      <div className="organization-manager__header">
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddOrganization}
          icon={<FaPlus />}
          disabled={isLoading}
        >
          Add Organization
        </Button>
      </div>

      <div className="organization-manager__content">
        <div className="organization-manager__list">
          {organizations.length === 0 ? (
            <div className="organization-manager__empty">
              <div className="organization-manager__empty-icon">
                <FaPlus />
              </div>
              <p>No organizations created yet.</p>
              <p>Click "Add Organization" to create your first organization.</p>
            </div>
          ) : (
            <div className="organization-manager__items">
              {organizations.map(organization => (
                <div
                  key={organization.id}
                  className={`organization-manager__item ${
                    selectedOrganization?.id === organization.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedOrganization(organization)}
                >
                  <div className="organization-manager__item-content">
                    <h4>{organization.name || 'Unnamed Organization'}</h4>
                    <p className="organization-type">{organization.type}</p>
                    {organization.description && (
                      <p className="organization-description">
                        {organization.description.slice(0, 100)}
                        {organization.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <button
                    className="organization-manager__delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOrganization(organization.id);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedOrganization && (
          <div className="organization-manager__details">
            <div className="organization-manager__form">
              <AiTextBox
                label="Name"
                value={selectedOrganization.name}
                onChange={(value) => handleOrganizationChange(selectedOrganization.id, 'name', value)}
                placeholder="Organization name"
                disabled={isLoading}
              />

              <div className="form-row">
                <label htmlFor="organization-type">Type</label>
                <select
                  id="organization-type"
                  value={selectedOrganization.type}
                  onChange={(e) => handleOrganizationChange(selectedOrganization.id, 'type', e.target.value)}
                  disabled={isLoading}
                >
                  {organizationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <AiTextArea
                label="Description"
                value={selectedOrganization.description}
                onChange={(value) => handleOrganizationChange(selectedOrganization.id, 'description', value)}
                placeholder="Describe this organization..."
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Purpose"
                value={selectedOrganization.purpose}
                onChange={(value) => handleOrganizationChange(selectedOrganization.id, 'purpose', value)}
                placeholder="What is the organization's purpose and goals?"
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Structure"
                value={selectedOrganization.structure}
                onChange={(value) => handleOrganizationChange(selectedOrganization.id, 'structure', value)}
                placeholder="How is the organization structured?"
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Membership"
                value={selectedOrganization.membership || ''}
                onChange={(value) => handleOrganizationChange(selectedOrganization.id, 'membership', value)}
                placeholder="Who can join? What are the requirements?"
                rows={2}
                disabled={isLoading}
              />

              <AiTextArea
                label="Resources"
                value={selectedOrganization.resources || ''}
                onChange={(value) => handleOrganizationChange(selectedOrganization.id, 'resources', value)}
                placeholder="What resources does the organization have?"
                rows={2}
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
