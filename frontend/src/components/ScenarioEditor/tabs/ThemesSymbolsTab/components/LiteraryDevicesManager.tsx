import React, { useCallback, useState } from 'react';
import { FaBook, FaCog, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';
import { LiteraryDevice } from '../types/themesSymbols';

interface LiteraryDevicesManagerProps {
  devices: LiteraryDevice[];
  onDevicesChange: (devices: LiteraryDevice[]) => void;
  readonly?: boolean;
}

const LiteraryDevicesManager: React.FC<LiteraryDevicesManagerProps> = ({
  devices,
  onDevicesChange,
  readonly = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', description: '' });

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this literary device?')) {
      const updatedDevices = devices.filter(device => device.id !== id);
      onDevicesChange(updatedDevices);
    }
  }, [devices, onDevicesChange]);

  const handleAdd = useCallback(() => {
    if (!newDevice.name.trim()) return;

    const device: LiteraryDevice = {
      id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newDevice.name.trim(),
      description: newDevice.description.trim(),
      type: 'narrative',
      technique: '',
      purpose: '',
      effect: '',
      examples: [],
      frequency: '',
      placement: '',
      effectiveness: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onDevicesChange([...devices, device]);
    setNewDevice({ name: '', description: '' });
    setIsAdding(false);
  }, [newDevice, devices, onDevicesChange]);

  if (devices.length === 0 && !isAdding) {
    return (
      <div className="empty-state">
        <FaBook className="empty-icon" />
        <h3>No Literary Devices Yet</h3>
        <p>Literary devices are techniques used to convey meaning, create effects, and enhance the reading experience.</p>
        {!readonly && (
          <button 
            className="btn btn-primary"
            onClick={() => setIsAdding(true)}
          >
            <FaPlus /> Add First Device
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="devices-manager">
      <div className="devices-header">
        <div className="devices-stats">
          <div className="stat-item">
            <span className="stat-label">Total Devices:</span>
            <span className="stat-value">{devices.length}</span>
          </div>
        </div>
        {!readonly && (
          <div className="devices-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
            >
              <FaPlus /> Add Device
            </button>
            <button 
              className="btn btn-secondary"
              disabled
              title="AI analysis coming soon"
            >
              <FaCog /> Analyze Devices
            </button>
          </div>
        )}
      </div>

      <div className="devices-list">
        {devices.map(device => (
          <div key={device.id} className="device-card">
            <div className="device-header">
              <h3>{device.name}</h3>
              {!readonly && (
                <button 
                  className="btn-icon btn-danger"
                  onClick={() => handleDelete(device.id)}
                  title="Delete device"
                >
                  <FaTrash />
                </button>
              )}
            </div>
            {device.description && (
              <p className="device-description">{device.description}</p>
            )}
            {device.purpose && (
              <div className="device-purpose">
                <strong>Purpose:</strong> {device.purpose}
              </div>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="device-card device-add-form">
            <h3>Add New Literary Device</h3>
            
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={newDevice.name}
                onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Device name..."
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newDevice.description}
                onChange={(e) => setNewDevice(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this literary device..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={!newDevice.name.trim()}
              >
                <FaCog /> Add Device
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setIsAdding(false);
                  setNewDevice({ name: '', description: '' });
                }}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiteraryDevicesManager;
