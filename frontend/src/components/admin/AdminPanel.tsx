/**
 * Admin Panel Component
 * Provides administrative interface with tabs for different management sections
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModals } from '../../hooks/useModals';
import { AlertModal, ConfirmModal } from '../Modal';
import { AdminOnly } from '../PermissionGate';
import './AdminPanel.css';
import LLMSettings from './LLMSettings';
import { UserManagement } from './UserManagement';

export { }; // Make this a module

type AdminTab = 'users' | 'llm';

export const AdminPanel: React.FC = () => {
  const { userProfile } = useAuth();
  const { alertState, confirmState, hideAlert, hideConfirm, customAlert, customConfirm } = useModals();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const tabs = [
    { id: 'users' as AdminTab, label: 'User Management', icon: '👥' },
    { id: 'llm' as AdminTab, label: 'LLM Settings', icon: '🤖' },
  ];

  return (
    <AdminOnly fallback={<div>Access denied. Administrator permissions required.</div>}>
      <div className="admin-panel">
        <div className="panel-header">
          <h1>Administration Panel</h1>
          <div className="admin-info">
            <span>Logged in as: <strong>{userProfile?.username}</strong></span>
          </div>
        </div>

        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="panel-sections">
          {activeTab === 'users' && (
            <UserManagement 
              onAlert={customAlert}
              onConfirm={customConfirm}
            />
          )}
          {activeTab === 'llm' && <LLMSettings />}
        </div>

        {/* Custom Modal Components */}
        <AlertModal
          isOpen={alertState.isOpen}
          onClose={hideAlert}
          message={alertState.message}
          title={alertState.title}
        />
        
        <ConfirmModal
          isOpen={confirmState.isOpen}
          onClose={hideConfirm}
          onConfirm={confirmState.onConfirm || (() => {})}
          message={confirmState.message}
          title={confirmState.title}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          variant={confirmState.variant}
        />
      </div>
    </AdminOnly>
  );
};
