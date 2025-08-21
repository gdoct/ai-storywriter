import { Button } from '@drdata/ai-styles';
import React, { useEffect, useState } from 'react';
import MarketingFooter from '../components/marketing/MarketingFooter';
import { AlertModal, ConfirmModal } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useModals } from '../hooks/useModals';
import { 
  UserSettings, 
  BYOKCredentials,
  getUserSettings, 
  saveUserSettings,
  saveBYOKCredentials,
  getBYOKCredentials,
  clearBYOKCredentials,
} from '../services/settings';

const Settings: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const { alertState, confirmState, hideAlert, hideConfirm, customAlert, customConfirm } = useModals();
  
  const [settings, setSettings] = useState<UserSettings>({
    username: userProfile?.username || '',
    email: userProfile?.email || '',
    firstName: '',
    lastName: '',
    notifications: {
      email: true,
      marketing: false
    },
    llmMode: 'member'
  });
  
  const [byokCredentials, setBYOKCredentials] = useState<BYOKCredentials>({
    provider: 'openai',
    apiKey: '',
    baseUrl: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasSavedKeys, setHasSavedKeys] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, [userProfile]);

  const loadSettings = async () => {
    try {
      // Load user settings
      const userSettings = await getUserSettings();
      setSettings(_ => ({
        ...userSettings,
        username: userProfile?.username || userSettings.username,
        email: userProfile?.email || userSettings.email,
        firstName:userSettings.firstName || '',
        lastName: userSettings.lastName || ''
      }));

      // Load BYOK credentials if they exist
      const savedCredentials = getBYOKCredentials();
      if (savedCredentials) {
        setBYOKCredentials(savedCredentials);
        setHasSavedKeys(true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      customAlert('Failed to load settings. Using defaults.', 'Warning');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!settings.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!settings.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (settings.llmMode === 'byok') {
      if (!byokCredentials.apiKey.trim()) {
        newErrors.apiKey = 'API Key is required for BYOK mode';
      }
      
      if (byokCredentials.provider === 'openai' && byokCredentials.baseUrl && byokCredentials.baseUrl.trim()) {
        try {
          new URL(byokCredentials.baseUrl);
        } catch {
          newErrors.baseUrl = 'Please enter a valid URL';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof UserSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNotificationChange = (type: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: value
      }
    }));
    setHasChanges(true);
  };

  const handleLLMModeChange = (mode: 'member' | 'byok') => {
    setSettings(prev => ({ ...prev, llmMode: mode }));
    setHasChanges(true);
    
    // Clear BYOK errors when switching to member mode
    if (mode === 'member') {
      setErrors(prev => ({ ...prev, apiKey: '', baseUrl: '' }));
    }
  };

  const handleBYOKChange = (field: keyof BYOKCredentials, value: string) => {
    setBYOKCredentials(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      customAlert('Please fix the errors below before saving.', 'Error');
      return;
    }
    
    setLoading(true);
    try {
      // Save user settings
      await saveUserSettings(settings);
      
      // Handle BYOK credentials
      if (settings.llmMode === 'byok') {
        saveBYOKCredentials(byokCredentials);
        setHasSavedKeys(true);
      } else {
        // Clear BYOK credentials if switching to member mode
        if (hasSavedKeys) {
          clearBYOKCredentials();
          setHasSavedKeys(false);
        }
      }
      
      customAlert('Settings saved successfully!', 'Success');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      customAlert('Failed to save settings. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearBYOKKeys = () => {
    
  };

  const handleLogout = () => {
    logout();
  };

  const renderError = (field: string) => {
    if (!errors[field]) return null;
    return (
      <div style={{
        color: 'var(--color-danger)',
        fontSize: 'var(--font-size-sm)',
        marginTop: 'var(--spacing-xs)'
      }}>
        {errors[field]}
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--color-background)'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        padding: 'var(--spacing-xl)'
      }}>
        <div style={{ marginTop: 'var(--spacing-2xl)' }}>
          <h1 style={{ 
            fontSize: 'var(--font-size-3xl)', 
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            Settings
          </h1>
          
          <p style={{ 
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-2xl)',
            fontSize: 'var(--font-size-lg)'
          }}>
            Manage your account settings and AI preferences
          </p>

          {/* LLM Provider Selection */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius-lg)',
            padding: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <h2 style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              AI Provider
            </h2>

            <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--spacing-md)',
                cursor: 'pointer',
                padding: 'var(--spacing-md)',
                border: `2px solid ${settings.llmMode === 'member' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--border-radius-md)',
                background: settings.llmMode === 'member' ? 'var(--color-primary-subtle)' : 'transparent'
              }}>
                <input
                  type="radio"
                  name="llmMode"
                  value="member"
                  checked={settings.llmMode === 'member'}
                  onChange={() => handleLLMModeChange('member')}
                  style={{ marginTop: '2px' }}
                />
                <div>
                  <div style={{
                    fontSize: 'var(--font-size-md)',
                    color: 'var(--color-text-primary)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    Member (Recommended)
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: '1.4'
                  }}>
                    Use our managed AI services with credits. No setup required, just start creating!
                  </div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--spacing-md)',
                cursor: 'pointer',
                padding: 'var(--spacing-md)',
                border: `2px solid ${settings.llmMode === 'byok' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--border-radius-md)',
                background: settings.llmMode === 'byok' ? 'var(--color-primary-subtle)' : 'transparent'
              }}>
                <input
                  type="radio"
                  name="llmMode"
                  value="byok"
                  checked={settings.llmMode === 'byok'}
                  onChange={() => handleLLMModeChange('byok')}
                  style={{ marginTop: '2px' }}
                />
                <div>
                  <div style={{
                    fontSize: 'var(--font-size-md)',
                    color: 'var(--color-text-primary)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    BYOK (Bring Your Own Key)
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: '1.4'
                  }}>
                    Use your own OpenAI or GitHub API keys. Unlimited usage, stored locally for security.
                  </div>
                </div>
              </label>

              {/* BYOK Configuration */}
              {settings.llmMode === 'byok' && (
                <div style={{
                  marginTop: 'var(--spacing-md)',
                  padding: 'var(--spacing-lg)',
                  background: 'var(--color-background)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--color-border)'
                }}>
                  <h3 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-md)'
                  }}>
                    API Configuration
                  </h3>

                  <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text-primary)',
                        marginBottom: 'var(--spacing-xs)'
                      }}>
                        Provider
                      </label>
                      <select
                        value={byokCredentials.provider}
                        onChange={(e) => handleBYOKChange('provider', e.target.value)}
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-md)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--border-radius-md)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                          fontSize: 'var(--font-size-md)'
                        }}
                      >
                        <option value="openai">OpenAI</option>
                        <option value="github">GitHub Models</option>
                      </select>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text-primary)',
                        marginBottom: 'var(--spacing-xs)'
                      }}>
                        API Key *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={byokCredentials.apiKey}
                          onChange={(e) => handleBYOKChange('apiKey', e.target.value)}
                          placeholder="Enter your API key"
                          style={{
                            width: '100%',
                            padding: 'var(--spacing-md)',
                            paddingRight: '50px',
                            border: `1px solid ${errors.apiKey ? 'var(--color-danger)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--border-radius-md)',
                            background: 'var(--color-surface)',
                            color: 'var(--color-text-primary)',
                            fontSize: 'var(--font-size-md)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-sm)'
                          }}
                        >
                          {showApiKey ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                      {renderError('apiKey')}
                    </div>

                    {byokCredentials.provider === 'openai' && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text-primary)',
                          marginBottom: 'var(--spacing-xs)'
                        }}>
                          Base URL (Optional)
                        </label>
                        <input
                          type="text"
                          value={byokCredentials.baseUrl || ''}
                          onChange={(e) => handleBYOKChange('baseUrl', e.target.value)}
                          placeholder="https://api.openai.com/v1"
                          style={{
                            width: '100%',
                            padding: 'var(--spacing-md)',
                            border: `1px solid ${errors.baseUrl ? 'var(--color-danger)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--border-radius-md)',
                            background: 'var(--color-surface)',
                            color: 'var(--color-text-primary)',
                            fontSize: 'var(--font-size-md)'
                          }}
                        />
                        {renderError('baseUrl')}
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-secondary)',
                          marginTop: 'var(--spacing-xs)'
                        }}>
                          Leave empty to use OpenAI's default endpoint
                        </div>
                      </div>
                    )}

                    {hasSavedKeys && (
                      <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'var(--color-success-subtle)',
                        border: '1px solid var(--color-success)',
                        borderRadius: 'var(--border-radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{
                            color: 'var(--color-success)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)'
                          }}>
                            API credentials saved locally
                          </div>
                          <div style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--font-size-xs)'
                          }}>
                            Your keys are stored securely in your browser
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleClearBYOKKeys}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius-lg)',
            padding: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <h2 style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Profile Information
            </h2>

            <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    border: `1px solid ${errors.username ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--border-radius-md)',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-md)'
                  }}
                />
                {renderError('username')}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    border: `1px solid ${errors.email ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--border-radius-md)',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-md)'
                  }}
                />
                {renderError('email')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={settings.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--border-radius-md)',
                      background: 'var(--color-background)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-md)'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={settings.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--border-radius-md)',
                      background: 'var(--color-background)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-md)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius-lg)',
            padding: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <h2 style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Notifications
            </h2>

            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => handleNotificationChange('email', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <div>
                  <div style={{
                    fontSize: 'var(--font-size-md)',
                    color: 'var(--color-text-primary)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>
                    Email Notifications
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Receive important updates about your account
                  </div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.marketing}
                  onChange={(e) => handleNotificationChange('marketing', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <div>
                  <div style={{
                    fontSize: 'var(--font-size-md)',
                    color: 'var(--color-text-primary)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>
                    Marketing Emails
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Receive updates about new features and promotions
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Account Actions */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius-lg)',
            padding: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <h2 style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Account Actions
            </h2>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <Button
                variant="secondary"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: 'var(--spacing-md)',
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)'
          }}>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!hasChanges || loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div style={{ marginTop: 'var(--spacing-5xl)' }}>
          <MarketingFooter />
        </div>

        {/* Modals */}
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
    </div>
  );
};

export default Settings;