import type { ReactNode } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../providers/ThemeProvider';
import './HamburgerMenu.css';

export interface HamburgerMenuProps {
  /** Icon to use for the menu button (default: 3-bar hamburger) */
  icon?: ReactNode;
  /** Content to show in the menu (can be anything) */
  children: ReactNode;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
  /** Additional CSS class name */
  className?: string;
  /** Control menu open state externally */
  open?: boolean;
  /** Callback to set menu open state externally */
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

const DefaultIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect y="4" width="24" height="2" rx="1" fill="currentColor" />
    <rect y="11" width="24" height="2" rx="1" fill="currentColor" />
    <rect y="18" width="24" height="2" rx="1" fill="currentColor" />
  </svg>
);

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  icon,
  children,
  ariaLabel = 'Open menu',
  className = '',
  open: controlledOpen,
  setOpen: controlledSetOpen,
}) => {
  const { resolvedTheme: theme } = useTheme();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledSetOpen || setInternalOpen;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  // Create a portal root if it doesn't exist
  useEffect(() => {
    let portalRoot = document.getElementById('ai-hamburger-menu-portal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'ai-hamburger-menu-portal-root';
      document.body.appendChild(portalRoot);
    }
    return () => {
      // Optionally clean up if needed
    };
  }, []);

  return (
    <div className={`ai-hamburger-menu ai-hamburger-menu--${theme} ${className}`.trim()}>
      <button
        ref={buttonRef}
        className="ai-hamburger-menu__button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls="ai-hamburger-menu__content"
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          console.log('Hamburger menu clicked');
          console.log('Menu items:', children);
        }}
      >
        {icon || <DefaultIcon />}
      </button>
      {open &&
        createPortal(
          <div
            id="ai-hamburger-menu__content"
            className={`ai-hamburger-menu__content ai-hamburger-menu__content--${theme}`}
            style={{
              position: 'absolute',
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: menuPosition.width,
              zIndex: 1000,
            }}
          >
            {children}
          </div>,
          document.getElementById('ai-hamburger-menu-portal-root') as HTMLElement
        )}
    </div>
  );
};

export default HamburgerMenu;
