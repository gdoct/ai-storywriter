import React, { useState } from 'react';
import LLMSettings from '../components/admin/LLMSettings';
import { UserManagement } from '../components/admin/UserManagement';
import { AlertModal, ConfirmModal } from '../../shared/components/Modal';

type AdminTab = 'users' | 'llm';

const Administration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  
  // Alert Modal state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    message: '',
    title: ''
  });
  
  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    title: '',
    confirmText: '',
    cancelText: '',
    onConfirm: () => {}
  });

  const tabs = [
    { id: 'users' as AdminTab, label: 'User Management', icon: '👥' },
    { id: 'llm' as AdminTab, label: 'LLM Settings', icon: '🤖' },
  ];

  const handleAlert = (message: string, title?: string) => {
    setAlertModal({
      isOpen: true,
      message,
      title: title || 'Alert'
    });
  };

  const handleConfirm = (message: string, options?: any): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        message,
        title: options?.title || 'Confirm',
        confirmText: options?.confirmText || 'OK',
        cancelText: options?.cancelText || 'Cancel',
        onConfirm: () => resolve(true)
      });
      
      // Handle the reject case when modal is closed without confirmation
      const originalOnClose = () => resolve(false);
      setConfirmModal(prev => ({ ...prev, onClose: originalOnClose }));
    });
  };

  const closeAlertModal = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="administration-container">
      <div className="administration-header">
        <h1 className="administration-title">Administration</h1>
        <p className="administration-subtitle">Manage users and system settings</p>
      </div>

      <div className="administration-tabs">
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

      <div className="administration-content">
        {activeTab === 'users' && <UserManagement onAlert={handleAlert} onConfirm={handleConfirm} />}
        {activeTab === 'llm' && <LLMSettings />}
      </div>

      {/* Modal Components */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlertModal}
        message={alertModal.message}
        title={alertModal.title}
      />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        message={confirmModal.message}
        title={confirmModal.title}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
      />
    </div>
  );
};

export default Administration;
