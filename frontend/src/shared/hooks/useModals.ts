import { useState } from 'react';

interface AlertState {
  isOpen: boolean;
  message: string;
  title?: string;
}

interface ConfirmState {
  isOpen: boolean;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  onConfirm?: () => void;
  resolve?: (value: boolean) => void;
}

export const useModals = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    message: '',
    title: undefined,
  });

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    title: undefined,
    confirmText: undefined,
    cancelText: undefined,
    variant: 'default',
    onConfirm: undefined,
    resolve: undefined,
  });

  const showAlert = (message: string, title?: string) => {
    setAlertState({
      isOpen: true,
      message,
      title,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  const hideConfirm = () => {
    if (confirmState.resolve) {
      confirmState.resolve(false);
    }
    setConfirmState(prev => ({ 
      ...prev, 
      isOpen: false,
      resolve: undefined
    }));
  };

  // Custom alert function to replace window.alert
  const customAlert = (message: string, title?: string) => {
    showAlert(message, title);
  };

  // Custom confirm function to replace window.confirm
  const customConfirm = async (
    message: string,
    options?: {
      title?: string;
      confirmText?: string;
      cancelText?: string;
      variant?: 'default' | 'danger';
    }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const handleConfirm = () => {
        resolve(true);
        setConfirmState(prev => ({ 
          ...prev, 
          isOpen: false,
          resolve: undefined
        }));
      };

      setConfirmState({
        isOpen: true,
        message,
        title: options?.title,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        variant: options?.variant || 'default',
        onConfirm: handleConfirm,
        resolve,
      });
    });
  };

  return {
    alertState,
    confirmState: {
      ...confirmState,
      onConfirm: confirmState.onConfirm || (() => {}),
    },
    showAlert,
    hideAlert,
    hideConfirm,
    customAlert,
    customConfirm,
  };
};
