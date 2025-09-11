import React, { useState } from 'react';

interface EmailConflictData {
  error: string;
  email: string;
  message: string;
  existing_user_info: {
    username: string;
    created_at: string;
    tier: string;
  };
}

interface EmailConflictModalProps {
  conflictData: EmailConflictData;
  onClose: () => void;
  onCreateNewAccount: () => void;
  onLoginExisting: () => void;
}

const EmailConflictModal: React.FC<EmailConflictModalProps> = ({
  conflictData,
  onClose,
  onCreateNewAccount,
  onLoginExisting
}) => {
  const [selectedOption, setSelectedOption] = useState<'login' | 'create' | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Account Already Exists</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="conflict-message">
            An account with the email address <strong>{conflictData.email}</strong> already exists.
          </p>
          
          <div className="existing-account-info">
            <h4>Existing Account Details:</h4>
            <ul>
              <li><strong>Username:</strong> {conflictData.existing_user_info.username}</li>
              <li><strong>Account Type:</strong> {conflictData.existing_user_info.tier}</li>
              <li><strong>Created:</strong> {formatDate(conflictData.existing_user_info.created_at)}</li>
            </ul>
          </div>
          
          <div className="choice-section">
            <h4>Choose how to proceed:</h4>
            
            <div className="choice-options">
              <div 
                className={`choice-option ${selectedOption === 'login' ? 'selected' : ''}`}
                onClick={() => setSelectedOption('login')}
              >
                <input 
                  type="radio" 
                  id="login-existing" 
                  name="conflict-choice" 
                  value="login"
                  checked={selectedOption === 'login'}
                  onChange={() => setSelectedOption('login')}
                />
                <label htmlFor="login-existing">
                  <strong>Log in to existing account</strong>
                  <span className="choice-description">
                    Use your username and password to log in, then connect your Google account in settings.
                  </span>
                </label>
              </div>
              
              <div 
                className={`choice-option ${selectedOption === 'create' ? 'selected' : ''}`}
                onClick={() => setSelectedOption('create')}
              >
                <input 
                  type="radio" 
                  id="create-new" 
                  name="conflict-choice" 
                  value="create"
                  checked={selectedOption === 'create'}
                  onChange={() => setSelectedOption('create')}
                />
                <label htmlFor="create-new">
                  <strong>Create a new account with Google</strong>
                  <span className="choice-description">
                    Create a separate account using your Google credentials. You'll have two different accounts.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={() => {
              if (selectedOption === 'login') {
                onLoginExisting();
              } else if (selectedOption === 'create') {
                onCreateNewAccount();
              }
            }}
            disabled={!selectedOption}
          >
            Continue
          </button>
        </div>
      </div>
      
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #333;
          font-size: 18px;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .modal-close:hover {
          color: #333;
          background-color: #f0f0f0;
          border-radius: 50%;
        }
        
        .modal-body {
          padding: 24px;
        }
        
        .conflict-message {
          margin-bottom: 20px;
          color: #555;
          line-height: 1.5;
        }
        
        .existing-account-info {
          background-color: #f8f9fa;
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .existing-account-info h4 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 14px;
        }
        
        .existing-account-info ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .existing-account-info li {
          margin-bottom: 5px;
          color: #666;
          font-size: 14px;
        }
        
        .choice-section h4 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 16px;
        }
        
        .choice-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .choice-option {
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .choice-option:hover {
          border-color: #4a90e2;
        }
        
        .choice-option.selected {
          border-color: #4a90e2;
          background-color: #f0f7ff;
        }
        
        .choice-option input[type="radio"] {
          margin-right: 12px;
        }
        
        .choice-option label {
          cursor: pointer;
          display: block;
        }
        
        .choice-option label strong {
          display: block;
          margin-bottom: 4px;
          color: #333;
        }
        
        .choice-description {
          color: #666;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .btn-secondary {
          padding: 10px 20px;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .btn-secondary:hover {
          background-color: #f8f9fa;
        }
        
        .btn-primary {
          padding: 10px 20px;
          background-color: #4a90e2;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: #3a80d2;
        }
        
        .btn-primary:disabled {
          background-color: #a0c0e8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default EmailConflictModal;