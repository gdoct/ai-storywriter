import React from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../../providers/ThemeProvider';
import './Dialog.css';

export interface DialogProps {
  open: boolean;
  onOk: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  showCancel?: boolean;
  children: React.ReactNode;
  title?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOk,
  onCancel,
  okText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
  children,
  title,
}) => {
  const { resolvedTheme: theme } = useTheme();

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className={`dialog-overlay dialog-overlay--${theme}`} data-testid="dialog-overlay">
      <div className={`dialog-modal dialog-modal--${theme}`} role="dialog" aria-modal="true">
        {title && <h2 className="dialog-header">{title}</h2>}
        <div className="dialog-content">{children}</div>
        <div className="dialog-buttons">
          {showCancel && (
            <button className="dialog-btn dialog-btn-cancel" onClick={onCancel} type="button">
              {cancelText}
            </button>
          )}
          <button className="dialog-btn dialog-btn-confirm" onClick={onOk} type="button">
            {okText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Dialog;
